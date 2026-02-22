/**
 * Container Farm - Main Component
 * 
 * A cozy herb farming simulation game.
 * Handles rendering only - all state and logic is in useContainerFarm hook.
 */

import React from 'react';
import { useTheme } from '../../theme';
import { TRAITS } from './types';
import { TRAIT_LABELS, getTraitColors, getVagueDescription } from './engine/traits';
import { harvestTraitScore, marketPrice, calcSellChance, checkContractWithShelf, getReveal } from './engine';
import { useContainerFarm } from './hooks/useContainerFarm';
import { Btn, PlantVis, TraitBar, EnvSlider, FreshnessBar } from './components';

export default function ContainerFarm() {
  const { theme } = useTheme();
  const TC = getTraitColors(theme);
  const game = useContainerFarm();

  // Tab content rendering
  let tabContent: React.ReactNode = null;

  // === CONTAINER TAB ===
  if (game.tab === "container") {
    let plantGrid: React.ReactNode;
    if (game.plants.length === 0) {
      plantGrid = (
        <div style={{ textAlign: "center", padding: "30px 0", color: theme.textMuted, fontSize: 12 }}>
          {game.seedBank.length > 0 ? "Plant seeds to get started!" : "Buy seeds from the Seeds tab."}
        </div>
      );
    } else {
      const gridItems: React.ReactNode[] = game.plants.map(p => (
        <PlantVis
          key={p.id}
          plant={p}
          size={52}
          selected={p.markedForBreeding || game.selected === p.id}
          marker={p.markedForBreeding ? "breed" : "select"}
          onClick={() => game.setSelected(game.selected === p.id ? null : p.id)}
          theme={theme}
        />
      ));
      for (let i = 0; i < game.emptySlots; i++) {
        gridItems.push(
          <div key={`e${i}`} style={{
            width: 52, height: 52,
            border: `1px dashed ${theme.border}`,
            borderRadius: theme.radiusSm,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: theme.textMuted, fontSize: 18
          }}>+</div>
        );
      }
      plantGrid = <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(52px,1fr))", gap: 4 }}>{gridItems}</div>;
    }

    tabContent = (
      <div>
        {/* Market countdown */}
        <div style={{
          background: game.daysToMarket <= 2 ? theme.warningLight : theme.surface,
          borderRadius: theme.radiusMd,
          border: `1px solid ${game.daysToMarket <= 2 ? theme.warning : theme.border}`,
          padding: "8px 12px", marginBottom: 12,
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span style={{ fontSize: 11, color: game.daysToMarket <= 2 ? theme.money : theme.textSecondary, fontFamily: "monospace" }}>
            🏪 Market in {game.daysToMarket} day{game.daysToMarket !== 1 ? "s" : ""}
          </span>
          <span style={{ fontSize: 10, color: theme.textMuted, fontFamily: "monospace" }}>
            Upkeep: $4/day{game.shelf.length > 0 ? ` · Shelf: ${game.shelf.length}` : ""}
          </span>
        </div>

        {/* Environment */}
        <div style={{ background: theme.surface, borderRadius: theme.radiusLg, border: `1px solid ${theme.border}`, padding: 14, marginBottom: 12, boxShadow: theme.shadow }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 8, letterSpacing: ".05em", textTransform: "uppercase" }}>Environment</div>
          <EnvSlider label="Light" value={game.env.light} onChange={v => game.setEnv(e => ({ ...e, light: v }))} icon="☀" theme={theme} />
          <EnvSlider label="Temp" value={game.env.temperature} onChange={v => game.setEnv(e => ({ ...e, temperature: v }))} icon="🌡" theme={theme} />
          <EnvSlider label="Nutrients" value={game.env.nutrients} onChange={v => game.setEnv(e => ({ ...e, nutrients: v }))} icon="🧪" theme={theme} />
          <EnvSlider label="Water" value={game.env.water} onChange={v => game.setEnv(e => ({ ...e, water: v }))} icon="💧" theme={theme} />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          <Btn onClick={() => game.doGrow(1)} theme={theme}>⏱ +1 Day</Btn>
          <Btn onClick={() => game.doGrow(5)} color={theme.info} bg={theme.infoLight} border={theme.info} theme={theme}>⏩ +5</Btn>
          <Btn onClick={() => game.doGrow(10)} color={theme.traits.hardiness} bg={`${theme.traits.hardiness}15`} border={theme.traits.hardiness} theme={theme}>⏩ +10</Btn>
          <Btn onClick={game.doHarvestAllToShelf} disabled={game.harvestable.length === 0} color={theme.money} bg={theme.moneyLight} border={theme.money} theme={theme}>
            ✂️ Harvest All ({game.harvestable.length}) [H]
          </Btn>
          {game.breeders.length >= 2 && (
            <Btn onClick={game.doBreed} color={theme.traits.flavorIntensity} bg={`${theme.traits.flavorIntensity}15`} border={theme.traits.flavorIntensity} theme={theme}>
              🧬 Breed ({game.breeders.length}) [⇧B]
            </Btn>
          )}
        </div>

        {/* Container grid */}
        <div style={{ background: theme.surface, borderRadius: theme.radiusLg, border: `1px solid ${theme.border}`, padding: 14, boxShadow: theme.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, letterSpacing: ".05em", textTransform: "uppercase" }}>
              Container · {game.plants.length}/{game.SLOTS}
            </span>
            {game.emptySlots > 0 && game.seedBank.length > 0 && (
              <Btn onClick={() => game.doPlantBest(game.emptySlots)} style={{ padding: "4px 10px", fontSize: 10 }} theme={theme}>
                Plant Best ({Math.min(game.emptySlots, game.seedBank.length)})
              </Btn>
            )}
          </div>
          {plantGrid}
        </div>
      </div>
    );
  }

  // === SHELF TAB ===
  if (game.tab === "shelf") {
    const shelfItems = game.shelf.map(h => {
      const sc = harvestTraitScore(h);
      const col = h.dried ? theme.traits.hardiness : h.freshness > 0.6 ? theme.accent : h.freshness > 0.3 ? theme.money : theme.danger;
      return (
        <div key={h.id} style={{
          background: h.dried ? `${theme.traits.hardiness}10` : theme.surface,
          borderRadius: theme.radiusMd,
          border: `1px solid ${h.dried ? theme.traits.hardiness : theme.border}`,
          padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: col }}>{h.dried ? "🌿 Dried" : `Gen ${h.generation}`}</span>
              <span style={{ fontSize: 10, color: theme.textMuted, fontFamily: "monospace" }}>Q:{Math.round(sc.overall * 100)}%</span>
              {h.dried && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: `${theme.traits.hardiness}22`, color: theme.traits.hardiness }}>no decay</span>}
            </div>
            {!h.dried && <FreshnessBar freshness={h.freshness} maxDays={h.maxFreshDays} daysOnShelf={h.daysOnShelf} theme={theme} />}
          </div>
          {!h.dried && (
            <Btn onClick={() => game.doDryHerb(h.id)} color={theme.traits.hardiness} bg={`${theme.traits.hardiness}15`} border={theme.traits.hardiness} style={{ padding: "4px 8px", fontSize: 10 }} theme={theme}>
              🌿 Dry
            </Btn>
          )}
        </div>
      );
    });

    const dryingItems = game.drying.length > 0 ? (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: theme.traits.hardiness, marginBottom: 6, letterSpacing: ".05em", textTransform: "uppercase" }}>
          🌿 Drying Rack ({game.drying.length})
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          {game.drying.map((d, i) => (
            <div key={i} style={{
              background: `${theme.traits.hardiness}10`, borderRadius: theme.radiusSm,
              border: `1px solid ${theme.traits.hardiness}`, padding: "6px 10px",
              display: "flex", justifyContent: "space-between", fontSize: 11
            }}>
              <span style={{ color: theme.traits.hardiness }}>Gen {d.item.generation} herb</span>
              <span style={{ color: theme.textMuted, fontFamily: "monospace" }}>{d.daysLeft}d left</span>
            </div>
          ))}
        </div>
      </div>
    ) : null;

    tabContent = (
      <div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {game.currentMarket && game.shelf.length > 0 && <Btn onClick={() => game.setTab("market")} theme={theme}>🏪 Go to Market</Btn>}
          {!game.currentMarket && (
            <div style={{ fontSize: 11, color: theme.textMuted, padding: "8px 0" }}>
              Next market in {game.daysToMarket}d · Rep: {Math.round(game.reputation)}/100 ({Math.round(calcSellChance(game.reputation) * 100)}% sell rate)
            </div>
          )}
        </div>
        {dryingItems}
        {game.shelf.length === 0 && game.drying.length === 0
          ? <div style={{ textAlign: "center", padding: "40px 0", color: theme.textMuted, fontSize: 12 }}>No harvested items. Harvest mature plants from the Container tab.</div>
          : <div style={{ display: "grid", gap: 6 }}>{shelfItems}</div>
        }
      </div>
    );
  }

  // === MARKET TAB ===
  if (game.tab === "market") {
    if (game.currentMarket) {
      const demand = game.currentMarket;
      let selTotal = 0, selCount = 0;
      game.shelf.forEach(h => {
        if (game.marketSel.has(h.id)) {
          selTotal += marketPrice(h, demand);
          selCount++;
        }
      });
      selTotal = Math.round(selTotal * 100) / 100;

      const marketItems = game.shelf.map(h => {
        let price = marketPrice(h, demand);
        if (h.dried) price *= game.DRY_PRICE_MULT;
        const isSel = game.marketSel.has(h.id);
        const sc = harvestTraitScore(h);
        return (
          <div key={h.id} onClick={() => game.toggleMarketSelect(h.id)} style={{
            background: isSel ? theme.accentLight : h.dried ? `${theme.traits.hardiness}10` : theme.surface,
            borderRadius: theme.radiusMd,
            border: `1px solid ${isSel ? theme.accent : h.dried ? theme.traits.hardiness : theme.border}`,
            padding: "10px 12px", cursor: "pointer", transition: theme.transitionFast
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{isSel ? "☑" : "☐"}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: h.dried ? theme.traits.hardiness : theme.text }}>{h.dried ? "🌿 Dried" : `Gen ${h.generation}`}</span>
                <span style={{ fontSize: 10, color: theme.textMuted }}>Q:{Math.round(sc.overall * 100)}%</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: theme.accent, fontFamily: "monospace" }}>${price.toFixed(2)}</span>
            </div>
            <div style={{ marginTop: 4 }}>
              {h.dried
                ? <div style={{ fontSize: 10, color: theme.traits.hardiness, fontFamily: "monospace" }}>Dried · {Math.round(game.DRY_PRICE_MULT * 100)}% of fresh price</div>
                : <FreshnessBar freshness={h.freshness} maxDays={h.maxFreshDays} daysOnShelf={h.daysOnShelf} theme={theme} />
              }
            </div>
          </div>
        );
      });

      const sellPct = Math.round(calcSellChance(game.reputation) * 100);
      tabContent = (
        <div>
          <div style={{ background: theme.accentLight, borderRadius: theme.radiusLg, border: `1px solid ${theme.accent}`, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.accent }}>🏪 Farmers Market Open!</div>
            <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4 }}>
              {demand.category.icon} Today's demand: <strong style={{ color: theme.text }}>{demand.category.name}</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 11, color: theme.textSecondary }}>Reputation:</span>
              <div style={{ flex: 1, maxWidth: 120, height: 6, background: theme.border, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, width: `${game.reputation}%`, background: game.reputation > 60 ? theme.accent : game.reputation > 30 ? theme.money : theme.danger, transition: "width .3s" }} />
              </div>
              <span style={{ fontSize: 11, color: theme.textSecondary }}>{Math.round(game.reputation)}/100 ({sellPct}%)</span>
            </div>
          </div>

          {selCount > 0 && (
            <div style={{ background: theme.surface, borderRadius: theme.radiusMd, border: `1px solid ${theme.border}`, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: theme.text }}>{selCount} selected · Est: <strong style={{ color: theme.money }}>${selTotal.toFixed(2)}</strong></span>
              <Btn onClick={game.doSellAtMarket} color={theme.accent} theme={theme}>💰 Sell at Market</Btn>
            </div>
          )}

          {game.shelf.length === 0
            ? <div style={{ textAlign: "center", padding: "40px 0", color: theme.textMuted, fontSize: 12 }}>No items to sell.</div>
            : <div style={{ display: "grid", gap: 6 }}>{marketItems}</div>
          }

          <Btn onClick={game.doCloseMarket} color={theme.danger} bg={theme.dangerLight} border={theme.danger} style={{ marginTop: 16, width: "100%" }} theme={theme}>
            Skip Market Day (-{game.REP_LOSS_SKIP_MARKET} rep)
          </Btn>
        </div>
      );
    } else {
      tabContent = <div style={{ textAlign: "center", padding: "40px 0", color: theme.textMuted, fontSize: 12 }}>Next market in {game.daysToMarket} days.</div>;
    }
  }

  // === SEEDS TAB ===
  if (game.tab === "seeds") {
    tabContent = (
      <div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Btn onClick={() => game.doBuySeeds(1)} theme={theme}>🛒 Buy Seed (${game.SEED_COST})</Btn>
          <Btn onClick={() => game.doBuySeeds(5)} theme={theme}>Buy 5 (${game.SEED_COST * 5})</Btn>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, color: theme.textMuted }}>Sort:</span>
            <select value={game.seedSort} onChange={e => game.setSeedSort(e.target.value)} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 4, color: theme.text, fontSize: 10, padding: "3px 6px" }}>
              <option value="overall">Overall</option>
              <option value="generation">Generation</option>
              {TRAITS.map(t => <option key={t} value={t}>{TRAIT_LABELS[t]}</option>)}
            </select>
            <button onClick={() => game.setSeedSortDir(d => d === "desc" ? "asc" : "desc")} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 4, color: theme.text, fontSize: 10, padding: "3px 6px", cursor: "pointer" }}>
              {game.seedSortDir === "desc" ? "↓" : "↑"}
            </button>
          </div>
        </div>

        {game.sortedSeeds.length === 0
          ? <div style={{ textAlign: "center", padding: "40px 0", color: theme.textMuted, fontSize: 12 }}>No seeds. Buy some or collect from mature plants.</div>
          : (
            <div style={{ display: "grid", gap: 6 }}>
              {game.sortedSeeds.map(seed => {
                const bg = seed.source === "store" ? theme.surface : seed.source === "bred" ? `${theme.traits.hardiness}10` : theme.accentLight;
                const accent = seed.source === "store" ? theme.textMuted : seed.source === "bred" ? theme.traits.hardiness : theme.accent;
                const sourceLabel = seed.source === "store" ? "🏪 Store" : seed.source === "bred" ? "🧬 Bred" : "🌱 Collected";

                const traitTags = TRAITS.map(t => {
                  const rev = getReveal(t, game.ownedTools);
                  if (rev.level === "hidden") return null;
                  const val = rev.level === "precise"
                    ? seed.genetics[t]
                    : rev.level === "approx"
                      ? `~${Math.round(seed.genetics[t] / 10) * 10}`
                      : getVagueDescription(t, seed.genetics[t]);
                  return <span key={t} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: `${TC[t]}18`, color: `${TC[t]}cc`, fontFamily: "monospace" }}>{TRAIT_LABELS[t]}: {val}</span>;
                }).filter(Boolean);

                return (
                  <div key={seed.id} style={{ background: bg, borderRadius: theme.radiusMd, border: `1px solid ${accent}33`, padding: "10px 12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: accent }}>{sourceLabel}</span>
                          <span style={{ fontSize: 10, color: theme.textMuted, fontFamily: "monospace" }}>Gen {seed.generation}</span>
                          {seed.name && <span style={{ fontSize: 11, fontWeight: 600, color: theme.text }}>"{seed.name}"</span>}
                        </div>
                        <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>{traitTags}</div>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <Btn onClick={() => game.doPlantSeed(seed)} disabled={game.plants.length >= game.SLOTS} style={{ padding: "5px 10px", fontSize: 10 }} theme={theme}>Plant</Btn>
                        <Btn onClick={() => game.doSellSeed(seed.id)} color={theme.money} bg={theme.moneyLight} border={theme.money} style={{ padding: "5px 8px", fontSize: 10 }} theme={theme}>${game.SEED_SELL_PRICE}</Btn>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    );
  }

  // === TOOLS TAB ===
  if (game.tab === "tools") {
    tabContent = (
      <div style={{ display: "grid", gap: 8 }}>
        {game.TOOLS.map(tool => {
          const owned = game.ownedTools.includes(tool.id);
          return (
            <div key={tool.id} style={{
              background: theme.surface, borderRadius: theme.radiusLg,
              border: `1px solid ${owned ? theme.accent : theme.border}`,
              padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: theme.text, marginBottom: 2 }}>{tool.name}</div>
                <div style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 4 }}>{tool.desc}</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {tool.reveals.map(r => <span key={r} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 3, background: `${TC[r]}22`, color: TC[r] }}>{TRAIT_LABELS[r]}</span>)}
                </div>
              </div>
              {owned
                ? <span style={{ color: theme.accent, fontWeight: 600, fontSize: 12 }}>✓ Owned</span>
                : <Btn onClick={() => game.doBuyTool(tool.id)} disabled={game.money < tool.cost} theme={theme}>${tool.cost}</Btn>
              }
            </div>
          );
        })}
      </div>
    );
  }

  // === CONTRACTS TAB ===
  if (game.tab === "contracts") {
    tabContent = (
      <div>
        <Btn onClick={game.doNewContract} style={{ marginBottom: 12 }} theme={theme}>📋 New Contract</Btn>
        <div style={{ display: "grid", gap: 8 }}>
          {game.activeContracts.map(c => {
            const d = checkContractWithShelf(c, game.shelf);
            return (
              <div key={c.id} style={{
                background: theme.surface, borderRadius: theme.radiusLg,
                border: `1px solid ${d.success ? theme.accent : theme.border}`, padding: 14
              }}>
                <div style={{ fontWeight: 600, color: theme.text, marginBottom: 4 }}>{c.clientName}</div>
                <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 8 }}>{c.description}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {c.traitRequirements.map((r, i) => (
                    <span key={i} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: `${TC[r.trait]}22`, color: TC[r.trait], fontFamily: "monospace" }}>
                      {TRAIT_LABELS[r.trait]} ≥ {r.minValue}
                    </span>
                  ))}
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: theme.bgAlt, color: d.qualifying.length >= c.quantity ? theme.accent : theme.textSecondary, fontFamily: "monospace" }}>
                    Ready: {d.qualifying.length}/{c.quantity}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: c.deadline <= 5 ? theme.danger : theme.textMuted }}>{c.deadline}d left</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, color: theme.money }}>${c.reward}</span>
                    <Btn onClick={() => game.doDeliverContract(c.id)} disabled={!d.success} theme={theme}>Deliver</Btn>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // === INSPECTOR SIDEBAR ===
  let inspectorContent: React.ReactNode = null;
  if (game.obsData) {
    const { plant: p, obs } = game.obsData;
    inspectorContent = (
      <div style={{ background: theme.surface, borderRadius: theme.radiusLg, border: `1px solid ${theme.border}`, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontWeight: 600, color: theme.text }}>Gen {p.generation}</span>
          <span style={{ fontSize: 11, color: p.health > 60 ? theme.accent : p.health > 30 ? theme.money : theme.danger }}>❤️ {p.health}%</span>
        </div>
        <div style={{ fontSize: 10, color: theme.textSecondary, marginBottom: 8 }}>
          Growth: {Math.round(p.growthStage * 100)}% · Age: {p.age}d
        </div>
        {TRAITS.map(t => <TraitBar key={t} name={t} value={obs[t].value} level={obs[t].level as any} theme={theme} />)}
        <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
          {p.growthStage >= 0.8 && !p.seedsCollected && <Btn onClick={() => game.doCollectSeeds(p.id)} style={{ fontSize: 10, padding: "4px 8px" }} theme={theme}>🫘 Seeds [S]</Btn>}
          {p.growthStage >= 0.8 && <Btn onClick={() => game.doHarvestToShelf(p.id)} color={theme.money} bg={theme.moneyLight} border={theme.money} style={{ fontSize: 10, padding: "4px 8px" }} theme={theme}>✂️ Harvest</Btn>}
          <Btn onClick={() => game.toggleBreed(p.id)} color={p.markedForBreeding ? theme.traits.flavorIntensity : theme.textSecondary} bg={p.markedForBreeding ? `${theme.traits.flavorIntensity}15` : theme.bgAlt} border={p.markedForBreeding ? theme.traits.flavorIntensity : theme.border} style={{ fontSize: 10, padding: "4px 8px" }} theme={theme}>
            {p.markedForBreeding ? "♥ Breeding" : "♡ Breed [B]"}
          </Btn>
          <Btn onClick={() => game.doCompost(p.id)} color={theme.textMuted} bg={theme.bgAlt} border={theme.border} style={{ fontSize: 10, padding: "4px 8px" }} theme={theme}>🗑</Btn>
        </div>
      </div>
    );
  }

  const logItems = game.log.map((l, i) => <div key={i} style={{ opacity: 1 - i * 0.03 }}>{l}</div>);

  // Tab definitions
  const tabs = [
    { id: "container", l: "🌱 Container" },
    { id: "shelf", l: `📦 Shelf (${game.shelf.length})` },
    { id: "market", l: game.currentMarket ? "🏪 Market!" : "🏪 Market" },
    { id: "seeds", l: `🫘 Seeds (${game.seedBank.length})` },
    { id: "contracts", l: `📋 (${game.activeContracts.length})` },
    { id: "tools", l: "🔬 Tools" }
  ];

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, fontFamily: "'DM Sans',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: theme.surface, boxShadow: theme.shadow }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.02em", color: theme.accent, margin: 0 }}>◻ Container Farm</h1>
          <span style={{ fontSize: 10, color: theme.textMuted, fontFamily: "monospace" }}>Gen {game.generation} · Day {game.day} · {game.plants.length}/{game.SLOTS} slots</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {game.money < 50 && <span style={{ fontSize: 10, color: theme.danger, fontFamily: "monospace" }}>⚠ LOW</span>}
          <div style={{ background: theme.moneyLight, border: `1px solid ${theme.border}`, borderRadius: theme.radiusMd, padding: "6px 14px", fontFamily: "monospace", fontSize: 15, fontWeight: 600, color: game.money > 100 ? theme.accent : game.money > 30 ? theme.money : theme.danger }}>
            ${game.money.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${theme.border}`, background: theme.surface }}>
        {tabs.map(t => {
          const isActive = game.tab === t.id;
          const isMarketOpen = t.id === "market" && game.currentMarket;
          return (
            <button key={t.id} onClick={() => game.setTab(t.id)} style={{
              flex: 1, padding: "9px 0", background: "transparent", border: "none",
              borderBottom: isActive ? `2px solid ${isMarketOpen ? theme.money : theme.accent}` : "2px solid transparent",
              color: isActive ? (isMarketOpen ? theme.money : theme.accent) : (isMarketOpen ? theme.money : theme.textMuted),
              cursor: "pointer", fontSize: 10, fontWeight: 600, fontFamily: "inherit"
            }}>{t.l}</button>
          );
        })}
      </div>

      {/* Main layout */}
      <div style={{ display: "flex", height: "calc(100vh - 98px)" }}>
        <div style={{ flex: 1, overflow: "auto", padding: 14 }}>{tabContent}</div>
        <div style={{ width: 240, borderLeft: `1px solid ${theme.border}`, overflow: "auto", background: theme.surface, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {inspectorContent}
          <div style={{ marginTop: "auto" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: theme.textSecondary, marginBottom: 4, letterSpacing: ".05em", textTransform: "uppercase" }}>Log</div>
            <div style={{ maxHeight: 200, overflow: "auto", fontSize: 10, fontFamily: "monospace", color: theme.textMuted, lineHeight: 1.6 }}>{logItems}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
