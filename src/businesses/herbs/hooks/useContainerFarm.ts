/**
 * Main game state hook for Container Farm
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plant, Seed, Environment, Contract, HarvestItem, DryingItem, MarketDemand, TraitKey, TRAITS } from '../types';
import { 
  mkRng, RNG,
  mkStoreSeed, plantSeed, collectSeeds, breedSeeds, sortSeeds,
  growOnce,
  harvestPlant, ageHarvest, harvestTraitScore, dryHarvestItem,
  generateMarketDemand, marketPrice, calcSellChance,
  mkContract, checkContractWithShelf,
  TOOLS, getReveal, observe
} from '../engine';
import {
  SLOTS, SEED_COST, DAILY_UPKEEP, SEED_SELL_PRICE,
  MARKET_DAY_INTERVAL, REP_GAIN_PER_SALE, REP_LOSS_SKIP_MARKET, REP_GAIN_QUALITY_BONUS,
  DRY_DAYS, DRY_PRICE_MULT,
  STARTING_MONEY, STARTING_REPUTATION, STARTING_SEEDS
} from '../constants';

export function useContainerFarm() {
  // RNG state
  const [seedCounter] = useState(() => ({ v: 42 }));
  const newRng = useCallback((): RNG => mkRng(seedCounter.v++), []);

  // Core game state
  const [plants, setPlants] = useState<Plant[]>([]);
  const [seedBank, setSeedBank] = useState<Seed[]>(() => {
    const r = mkRng(42);
    return Array.from({ length: STARTING_SEEDS }, () => mkStoreSeed(r));
  });
  const [env, setEnv] = useState<Environment>({ light: 50, temperature: 50, nutrients: 50, water: 50 });
  const [money, setMoney] = useState(STARTING_MONEY);
  const [ownedTools, setOwnedTools] = useState<string[]>([]);
  const [contracts, setContracts] = useState<Contract[]>(() => [mkContract(mkRng(100), 0)]);
  const [day, setDay] = useState(0);
  const [generation, setGeneration] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>(["Welcome to Container Farm! Plant seeds, grow crops, and sell at the farmers market."]);
  const [tab, setTab] = useState("container");
  const [difficulty, setDifficulty] = useState(0);
  const [seedSort, setSeedSort] = useState("overall");
  const [seedSortDir, setSeedSortDir] = useState<"asc" | "desc">("desc");
  
  // Harvest & Market state
  const [shelf, setShelf] = useState<HarvestItem[]>([]);
  const [currentMarket, setCurrentMarket] = useState<MarketDemand | null>(null);
  const [marketSel, setMarketSel] = useState<Set<string>>(new Set());
  const [reputation, setReputation] = useState(STARTING_REPUTATION);
  const [drying, setDrying] = useState<DryingItem[]>([]);

  // Derived values
  const emptySlots = SLOTS - plants.length;
  const maturePlants = useMemo(() => plants.filter(p => p.growthStage >= 0.8), [plants]);
  const breeders = useMemo(() => plants.filter(p => p.markedForBreeding), [plants]);
  const harvestable = useMemo(() => maturePlants.filter(p => !p.markedForBreeding), [maturePlants]);
  const sortedSeeds = useMemo(() => sortSeeds(seedBank, seedSort, seedSortDir), [seedBank, seedSort, seedSortDir]);
  const daysToMarket = MARKET_DAY_INTERVAL - (day % MARKET_DAY_INTERVAL);
  const activeContracts = useMemo(() => contracts.filter(c => c.status === "active"), [contracts]);

  // Helpers
  const addLog = useCallback((msg: string) => {
    setLog(p => [msg, ...p].slice(0, 50));
  }, []);

  // === ACTIONS ===

  const doPlantSeed = useCallback((seed: Seed) => {
    if (plants.length >= SLOTS) { addLog("Container full!"); return; }
    setPlants(p => [...p, plantSeed(seed)]);
    setSeedBank(b => b.filter(s => s.id !== seed.id));
    addLog(`🌱 Planted ${seed.source} seed (Gen ${seed.generation})`);
  }, [plants.length, addLog]);

  const doPlantBest = useCallback((n: number) => {
    const avail = Math.min(n, emptySlots, sortedSeeds.length);
    if (avail === 0) { addLog("No seeds or container full."); return; }
    const toPlant = sortedSeeds.slice(0, avail);
    const ids = new Set(toPlant.map(s => s.id));
    setPlants(p => [...p, ...toPlant.map(s => plantSeed(s))]);
    setSeedBank(b => b.filter(s => !ids.has(s.id)));
    addLog(`🌱 Planted ${avail} best seeds`);
  }, [emptySlots, sortedSeeds, addLog]);

  const doBuySeeds = useCallback((n: number) => {
    const cost = n * SEED_COST;
    if (money < cost) { addLog(`Need $${cost}`); return; }
    setMoney(m => m - cost);
    setSeedBank(b => [...b, ...Array.from({ length: n }, () => mkStoreSeed(newRng()))]);
    addLog(`🛒 Bought ${n} seeds ($${cost})`);
  }, [money, newRng, addLog]);

  const doGrow = useCallback((ticks: number) => {
    const upkeep = DAILY_UPKEEP * ticks;
    setPlants(p => {
      let cur = p;
      for (let i = 0; i < ticks; i++) cur = growOnce(cur, env);
      return cur;
    });
    setShelf(s => {
      let cur = s;
      for (let i = 0; i < ticks; i++) cur = ageHarvest(cur);
      return cur;
    });
    setMoney(m => Math.round((m - upkeep) * 100) / 100);
    setDay(d => d + ticks);

    // Check contracts
    setContracts(cs => cs.map(c => {
      if (c.status === "active") {
        const dl = c.deadline - ticks;
        if (dl <= 0) {
          addLog(`❌ Contract from ${c.clientName} expired!`);
          return { ...c, deadline: 0, status: "failed" as const };
        }
        return { ...c, deadline: dl };
      }
      return c;
    }));

    // Advance drying
    setDrying(dr => {
      const finished: HarvestItem[] = [];
      const remaining: DryingItem[] = [];
      dr.forEach(d => {
        const left = d.daysLeft - ticks;
        if (left <= 0) finished.push(d.item);
        else remaining.push({ item: d.item, daysLeft: left });
      });
      if (finished.length > 0) {
        setShelf(s => [...s, ...finished.map(item => dryHarvestItem(item))]);
        addLog(`🌿 ${finished.length} herb${finished.length > 1 ? "s" : ""} finished drying!`);
      }
      return remaining;
    });

    // Check market day
    const newDay = day + ticks;
    if (Math.floor(day / MARKET_DAY_INTERVAL) !== Math.floor(newDay / MARKET_DAY_INTERVAL) && newDay > 0) {
      const md = generateMarketDemand(newRng());
      setCurrentMarket(md);
      setMarketSel(new Set());
      addLog(`🏪 MARKET DAY! ${md.category.icon} Demand: ${md.category.name}${md.crowded ? " (crowded)" : ""}`);
      setTab("market");
    }
    addLog(`⏱ ${ticks}d · -$${upkeep} upkeep`);
  }, [env, day, newRng, addLog]);

  const doHarvestToShelf = useCallback((plantId: string) => {
    const p = plants.find(x => x.id === plantId);
    if (!p || p.growthStage < 0.8) return;
    const item = harvestPlant(p, day);
    setShelf(s => [...s, item]);
    setPlants(ps => ps.filter(x => x.id !== plantId));
    if (selected === plantId) setSelected(null);
    addLog(`✂️ Harvested to shelf (fresh for ~${item.maxFreshDays}d)`);
  }, [plants, day, selected, addLog]);

  const doHarvestAllToShelf = useCallback(() => {
    if (harvestable.length === 0) return;
    const items = harvestable.map(p => harvestPlant(p, day));
    const ids = new Set(harvestable.map(p => p.id));
    setShelf(s => [...s, ...items]);
    setPlants(ps => ps.filter(x => !ids.has(x.id)));
    setSelected(null);
    addLog(`✂️ Harvested ${items.length} plants to shelf`);
  }, [harvestable, day, addLog]);

  const toggleBreed = useCallback((id: string) => {
    setPlants(p => p.map(x => x.id === id ? { ...x, markedForBreeding: !x.markedForBreeding } : x));
  }, []);

  const doBreed = useCallback(() => {
    if (breeders.length < 2) { addLog("Select at least 2 breeders."); return; }
    let allSeeds: Seed[] = [];
    for (let i = 0; i < breeders.length; i++) {
      for (let j = i + 1; j < breeders.length; j++) {
        allSeeds = [...allSeeds, ...breedSeeds(breeders[i], breeders[j], newRng())];
      }
    }
    if (allSeeds.length === 0) { addLog("⚠️ Breeding failed"); return; }
    setPlants(ps => ps.map(p => p.markedForBreeding ? { ...p, markedForBreeding: false, seedsCollected: true } : p));
    setSeedBank(b => [...b, ...allSeeds]);
    setGeneration(g => g + 1);
    addLog(`🧬 Bred ${allSeeds.length} seeds (Gen ${generation + 1})`);
  }, [breeders, generation, newRng, addLog]);

  const doCollectSeeds = useCallback((plantId: string) => {
    const p = plants.find(x => x.id === plantId);
    if (!p || p.growthStage < 0.8 || p.seedsCollected) return;
    const seeds = collectSeeds(p, newRng());
    if (seeds.length === 0) { addLog("⚠️ Cannot collect seeds"); return; }
    setSeedBank(b => [...b, ...seeds]);
    setPlants(ps => ps.map(x => x.id === plantId ? { ...x, seedsCollected: true } : x));
    addLog(`🫘 Collected ${seeds.length} seeds (Gen ${seeds[0].generation})`);
  }, [plants, newRng, addLog]);

  const doCompost = useCallback((plantId: string) => {
    setPlants(ps => ps.filter(x => x.id !== plantId));
    if (selected === plantId) setSelected(null);
    addLog("🗑 Composted plant");
  }, [selected, addLog]);

  const doDryHerb = useCallback((itemId: string) => {
    const item = shelf.find(h => h.id === itemId);
    if (!item) return;
    const itemToDry = item;
    setShelf(s => s.filter(h => h.id !== itemId));
    setDrying(d => [...d, { item: itemToDry, daysLeft: DRY_DAYS }]);
    addLog(`🌿 Started drying herb (${DRY_DAYS} days)`);
  }, [shelf, addLog]);

  const toggleMarketSelect = useCallback((itemId: string) => {
    setMarketSel(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const doSellAtMarket = useCallback(() => {
    if (!currentMarket || marketSel.size === 0) return;
    const sellChance = calcSellChance(reputation);
    let total = 0, sold = 0, unsold = 0, repGain = 0;

    shelf.forEach(h => {
      if (!marketSel.has(h.id)) return;
      const roll = Math.random();
      if (roll < sellChance) {
        let price = marketPrice(h, currentMarket);
        if (h.dried) price *= DRY_PRICE_MULT;
        total += price;
        sold++;
        const sc = harvestTraitScore(h);
        repGain += REP_GAIN_PER_SALE + sc.overall * REP_GAIN_QUALITY_BONUS;
      } else {
        unsold++;
      }
    });

    total = Math.round(total * 100) / 100;
    setMoney(m => Math.round((m + total) * 100) / 100);
    setShelf(s => s.filter(h => !marketSel.has(h.id)));
    setMarketSel(new Set());
    setReputation(r => Math.min(100, Math.round((r + repGain) * 10) / 10));

    let msg = `💰 Sold ${sold}/${sold + unsold} items for $${total.toFixed(2)}`;
    if (unsold > 0) msg += ` · ${unsold} unsold (lost)`;
    addLog(msg);
  }, [currentMarket, marketSel, shelf, reputation, addLog]);

  const doCloseMarket = useCallback(() => {
    setReputation(r => Math.max(0, r - REP_LOSS_SKIP_MARKET));
    setCurrentMarket(null);
    setMarketSel(new Set());
    addLog(`🏪 Market closed. Rep -${REP_LOSS_SKIP_MARKET}. Next in ${MARKET_DAY_INTERVAL} days.`);
  }, [addLog]);

  const doBuyTool = useCallback((toolId: string) => {
    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool || money < tool.cost || ownedTools.includes(tool.id)) return;
    setMoney(m => m - tool.cost);
    setOwnedTools(p => [...p, tool.id]);
    addLog(`🔬 Bought ${tool.name}`);
  }, [money, ownedTools, addLog]);

  const doSellSeed = useCallback((seedId: string) => {
    setSeedBank(b => b.filter(s => s.id !== seedId));
    setMoney(m => m + SEED_SELL_PRICE);
    addLog(`💰 Sold seed for $${SEED_SELL_PRICE}`);
  }, [addLog]);

  const doDeliverContract = useCallback((contractId: string) => {
    const c = contracts.find(x => x.id === contractId);
    if (!c) return;
    const result = checkContractWithShelf(c, shelf);
    if (!result.success) {
      addLog(`Need ${result.shortfall} more qualifying items on shelf.`);
      return;
    }
    const used = new Set(result.qualifying.slice(0, c.quantity).map(h => h.id));
    setShelf(s => s.filter(x => !used.has(x.id)));
    setMoney(m => m + c.reward);
    setContracts(cs => cs.map(x => x.id === contractId ? { ...x, status: "completed" as const } : x));
    setDifficulty(diff => Math.min(5, diff + 1));
    setContracts(cs => [...cs, mkContract(newRng(), Math.min(5, difficulty + 1))]);
    addLog(`✅ Delivered to ${c.clientName}! +$${c.reward}`);
  }, [contracts, shelf, difficulty, newRng, addLog]);

  const doNewContract = useCallback(() => {
    setContracts(cs => [...cs, mkContract(newRng(), Math.min(5, difficulty))]);
  }, [difficulty, newRng]);

  // Observation data for selected plant
  const obsData = useMemo(() => {
    if (!selected) return null;
    const p = plants.find(x => x.id === selected);
    if (!p) return null;
    const stageBucket = Math.floor(p.growthStage * 10);
    const healthBucket = Math.floor(p.health / 10);
    const r = mkRng(p.id.charCodeAt(1) * 997 + stageBucket * 31 + healthBucket * 7);
    const obs: Record<string, { level: string; value: number }> = {};
    for (const t of TRAITS) {
      const rev = getReveal(t, ownedTools);
      obs[t] = rev.level === "hidden"
        ? { level: rev.level, value: 0 }
        : { level: rev.level, value: observe(p.traits[t].genetic, p.traits[t].expression, rev.prec, r) };
    }
    return { plant: p, obs };
  }, [selected, plants, ownedTools]);

  // Keybinds
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      const key = e.key.toLowerCase();
      if (key === "h") doHarvestAllToShelf();
      else if (key === "b" && e.shiftKey) doBreed();
      else if (key === "b" && !e.shiftKey && selected) toggleBreed(selected);
      else if (key === "s" && selected) doCollectSeeds(selected);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [doHarvestAllToShelf, doBreed, toggleBreed, selected, doCollectSeeds]);

  return {
    // State
    plants, seedBank, env, money, ownedTools, contracts, day, generation,
    selected, log, tab, seedSort, seedSortDir,
    shelf, currentMarket, marketSel, reputation, drying,
    
    // Derived
    emptySlots, maturePlants, breeders, harvestable, sortedSeeds,
    daysToMarket, activeContracts, obsData,
    
    // Setters
    setEnv, setSelected, setTab, setSeedSort, setSeedSortDir,
    
    // Actions
    doPlantSeed, doPlantBest, doBuySeeds, doGrow,
    doHarvestToShelf, doHarvestAllToShelf,
    toggleBreed, doBreed, doCollectSeeds, doCompost,
    doDryHerb, toggleMarketSelect, doSellAtMarket, doCloseMarket,
    doBuyTool, doSellSeed, doDeliverContract, doNewContract,
    
    // Constants
    SLOTS, SEED_COST, TOOLS, MARKET_DAY_INTERVAL, DRY_PRICE_MULT, SEED_SELL_PRICE,
    REP_LOSS_SKIP_MARKET,
  };
}
