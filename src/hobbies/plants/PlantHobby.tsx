/**
 * Plant Hobby - The grow station view
 * 
 * Manages plant growing, harvesting. Outputs to kitchen/economy.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../../theme';
import {
  PlantType, PlantInstance, HarvestedPlant, PLANT_TYPES,
  getPlantType, getGrowthStage, generatePlantId, generateHarvestId,
} from './types';
import {
  TableType, LightType, PotType, PotInstance,
  TABLE_TYPES, LIGHT_TYPES, POT_TYPES,
  getTableType, getLightType, getPotType, slotHasLight, generatePotId,
} from './equipment';

// Time
const MS_PER_GAME_DAY = 60 * 60 * 1000;
const TICK_INTERVAL = 1000;

interface PlantHobbyProps {
  money: number;
  onSpendMoney: (amount: number) => boolean;
  onAddMoney: (amount: number) => void;
  onStoreInKitchen: (harvest: HarvestedPlant) => boolean;
  kitchenFull: boolean;
  growthMultiplier: number;
  yieldMultiplier: number;
  gameDay: number;
  lastTick: number;
  onBack: () => void;
}

interface PlantState {
  table: TableType;
  light: LightType;
  pots: PotInstance[];
  plants: Map<string, PlantInstance>;
  seeds: Map<string, number>;
  harvest: HarvestedPlant[];
}

const INITIAL_STATE: PlantState = {
  table: TABLE_TYPES[0],
  light: LIGHT_TYPES[0],
  pots: [],
  plants: new Map(),
  seeds: new Map([['basil', 3]]),
  harvest: [],
};

export function PlantHobby({
  money,
  onSpendMoney,
  onAddMoney,
  onStoreInKitchen,
  kitchenFull,
  growthMultiplier,
  yieldMultiplier,
  gameDay,
  lastTick,
  onBack,
}: PlantHobbyProps) {
  const { theme } = useTheme();
  const [state, setState] = useState<PlantState>(INITIAL_STATE);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showPlantMenu, setShowPlantMenu] = useState(false);
  const [tab, setTab] = useState<'grow' | 'harvest' | 'shop'>('grow');
  const [prevTick, setPrevTick] = useState(lastTick);

  const { table, light, pots, plants, seeds, harvest } = state;

  // Growth tick
  useEffect(() => {
    const elapsed = lastTick - prevTick;
    if (elapsed < 0) {
      // Time skipped forward
      const daysPassed = -elapsed / MS_PER_GAME_DAY;
      
      setState(prev => {
        const newPlants = new Map(prev.plants);
        
        for (const [id, plant] of newPlants) {
          const plantType = getPlantType(plant.typeId);
          if (!plantType) continue;
          
          let growthRate = 1 / plantType.daysToMature;
          
          if (plant.hasLight) {
            growthRate *= prev.light.growthBoost;
          } else {
            growthRate *= 0.5;
          }
          
          growthRate *= growthMultiplier;
          
          const pot = prev.pots.find(p => p.plant === id);
          if (pot) {
            const potType = getPotType(pot.typeId);
            if (potType) growthRate *= potType.growthModifier;
          }
          
          const newProgress = Math.min(1, plant.growthProgress + growthRate * daysPassed);
          newPlants.set(id, {
            ...plant,
            growthProgress: newProgress,
            stage: getGrowthStage(newProgress),
          });
        }
        
        return { ...prev, plants: newPlants };
      });
    }
    setPrevTick(lastTick);
  }, [lastTick, growthMultiplier]);

  // Real-time growth
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const daysPassed = (now - prevTick) / MS_PER_GAME_DAY;
      
      if (daysPassed < 0.001) return;
      
      setState(prev => {
        const newPlants = new Map(prev.plants);
        let changed = false;
        
        for (const [id, plant] of newPlants) {
          if (plant.stage === 'harvestable') continue;
          
          const plantType = getPlantType(plant.typeId);
          if (!plantType) continue;
          
          let growthRate = 1 / plantType.daysToMature;
          if (plant.hasLight) growthRate *= prev.light.growthBoost;
          else growthRate *= 0.5;
          growthRate *= growthMultiplier;
          
          const pot = prev.pots.find(p => p.plant === id);
          if (pot) {
            const potType = getPotType(pot.typeId);
            if (potType) growthRate *= potType.growthModifier;
          }
          
          const newProgress = Math.min(1, plant.growthProgress + growthRate * daysPassed);
          if (newProgress !== plant.growthProgress) {
            changed = true;
            newPlants.set(id, {
              ...plant,
              growthProgress: newProgress,
              stage: getGrowthStage(newProgress),
            });
          }
        }
        
        if (!changed) return prev;
        return { ...prev, plants: newPlants };
      });
      
      setPrevTick(now);
    }, TICK_INTERVAL);
    
    return () => clearInterval(interval);
  }, [growthMultiplier]);

  // Actions
  const buySeeds = useCallback((typeId: string, qty: number = 1) => {
    const type = getPlantType(typeId);
    if (!type) return;
    if (!onSpendMoney(type.seedCost * qty)) return;
    
    setState(prev => {
      const newSeeds = new Map(prev.seeds);
      newSeeds.set(typeId, (newSeeds.get(typeId) || 0) + qty);
      return { ...prev, seeds: newSeeds };
    });
  }, [onSpendMoney]);

  const buyPot = useCallback((slot: number) => {
    const potType = POT_TYPES[0];
    if (!onSpendMoney(potType.cost)) return;
    
    setState(prev => {
      if (prev.pots.some(p => p.slot === slot)) return prev;
      const newPot: PotInstance = {
        id: generatePotId(),
        typeId: potType.id,
        slot,
        plant: null,
      };
      return { ...prev, pots: [...prev.pots, newPot] };
    });
  }, [onSpendMoney]);

  const plantSeed = useCallback((typeId: string, potId: string) => {
    setState(prev => {
      const seedCount = prev.seeds.get(typeId) || 0;
      if (seedCount <= 0) return prev;
      
      const pot = prev.pots.find(p => p.id === potId);
      if (!pot || pot.plant) return prev;
      
      const plantId = generatePlantId();
      const hasLight = slotHasLight(pot.slot, prev.light.coverage);
      
      const newPlant: PlantInstance = {
        id: plantId,
        typeId,
        plantedAt: Date.now(),
        growthProgress: 0,
        stage: 'seed',
        hasLight,
        potSlot: pot.slot,
      };
      
      const newSeeds = new Map(prev.seeds);
      newSeeds.set(typeId, seedCount - 1);
      
      const newPots = prev.pots.map(p => p.id === potId ? { ...p, plant: plantId } : p);
      const newPlants = new Map(prev.plants);
      newPlants.set(plantId, newPlant);
      
      return { ...prev, seeds: newSeeds, pots: newPots, plants: newPlants };
    });
    
    setShowPlantMenu(false);
    setSelectedSlot(null);
  }, []);

  const harvestPlant = useCallback((plantId: string) => {
    setState(prev => {
      const plant = prev.plants.get(plantId);
      if (!plant || plant.stage !== 'harvestable') return prev;
      
      const plantType = getPlantType(plant.typeId);
      if (!plantType) return prev;
      
      let yieldAmount = plantType.yieldAmount;
      const pot = prev.pots.find(p => p.plant === plantId);
      if (pot) {
        const potType = getPotType(pot.typeId);
        if (potType) yieldAmount *= potType.yieldModifier;
      }
      yieldAmount *= yieldMultiplier;
      yieldAmount = Math.round(yieldAmount);
      
      const harvested: HarvestedPlant = {
        id: generateHarvestId(),
        typeId: plant.typeId,
        quantity: yieldAmount,
        harvestedAt: Date.now(),
        freshness: 1.0,
      };
      
      const newPlants = new Map(prev.plants);
      newPlants.delete(plantId);
      
      const newPots = prev.pots.map(p => p.plant === plantId ? { ...p, plant: null } : p);
      
      return {
        ...prev,
        plants: newPlants,
        pots: newPots,
        harvest: [...prev.harvest, harvested],
      };
    });
  }, [yieldMultiplier]);

  const sellHarvest = useCallback((harvestId: string) => {
    const item = harvest.find(h => h.id === harvestId);
    if (!item) return;
    
    const plantType = getPlantType(item.typeId);
    if (!plantType) return;
    
    const price = Math.round(plantType.sellPrice * item.quantity * item.freshness * 10) / 10;
    onAddMoney(price);
    
    setState(prev => ({
      ...prev,
      harvest: prev.harvest.filter(h => h.id !== harvestId),
    }));
  }, [harvest, onAddMoney]);

  const storeHarvest = useCallback((harvestId: string) => {
    const item = harvest.find(h => h.id === harvestId);
    if (!item) return;
    
    if (onStoreInKitchen(item)) {
      setState(prev => ({
        ...prev,
        harvest: prev.harvest.filter(h => h.id !== harvestId),
      }));
    }
  }, [harvest, onStoreInKitchen]);

  // Slot click handler
  const handleSlotClick = useCallback((slotIndex: number) => {
    const pot = pots.find(p => p.slot === slotIndex);
    
    if (!pot) {
      buyPot(slotIndex);
    } else if (!pot.plant) {
      setSelectedSlot(slotIndex);
      setShowPlantMenu(true);
    } else {
      const plant = plants.get(pot.plant);
      if (plant?.stage === 'harvestable') {
        harvestPlant(pot.plant);
      }
    }
  }, [pots, plants, buyPot, harvestPlant]);

  // Render slots
  const slots = Array.from({ length: table.potSlots }, (_, i) => {
    const pot = pots.find(p => p.slot === i);
    const plant = pot?.plant ? plants.get(pot.plant) ?? null : null;
    const hasLight = slotHasLight(i, light.coverage);
    return { index: i, pot, plant, hasLight };
  });

  return (
    <div style={{ background: theme.surface, borderRadius: theme.radiusLg, boxShadow: theme.shadow }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <button onClick={onBack} style={{
          background: 'none',
          border: 'none',
          color: theme.textSecondary,
          cursor: 'pointer',
          fontSize: 14,
        }}>
          ← Back
        </button>
        <span style={{ fontWeight: 600, color: theme.accent }}>🌱 Container Farm</span>
        <span style={{ color: theme.textMuted, fontSize: 12 }}>${money.toFixed(0)}</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}` }}>
        {(['grow', 'harvest', 'shop'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '10px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? `2px solid ${theme.accent}` : '2px solid transparent',
              color: tab === t ? theme.accent : theme.textSecondary,
              cursor: 'pointer',
              fontWeight: tab === t ? 600 : 400,
              textTransform: 'capitalize',
            }}
          >
            {t} {t === 'harvest' && harvest.length > 0 && `(${harvest.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {tab === 'grow' && (
          <>
            {/* Light coverage bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {slots.map((s, i) => (
                <div key={i} style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: s.hasLight ? `${theme.money}88` : theme.border,
                }} />
              ))}
            </div>

            {/* Pot grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(table.potSlots, 4)}, 1fr)`,
              gap: 10,
            }}>
              {slots.map(slot => (
                <PotSlot
                  key={slot.index}
                  slot={slot}
                  onClick={() => handleSlotClick(slot.index)}
                  theme={theme}
                />
              ))}
            </div>
          </>
        )}

        {tab === 'harvest' && (
          harvest.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: theme.textMuted }}>
              No harvested plants yet
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {harvest.map(item => {
                const plantType = getPlantType(item.typeId);
                if (!plantType) return null;
                const price = Math.round(plantType.sellPrice * item.quantity * item.freshness * 10) / 10;
                
                return (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    background: theme.bgAlt,
                    borderRadius: theme.radiusMd,
                  }}>
                    <span style={{ fontSize: 24 }}>{plantType.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: theme.text }}>{plantType.name} ×{item.quantity}</div>
                      <div style={{ fontSize: 11, color: theme.textMuted }}>
                        {Math.round(item.freshness * 100)}% fresh
                      </div>
                    </div>
                    <button
                      onClick={() => storeHarvest(item.id)}
                      disabled={kitchenFull}
                      style={{
                        padding: '6px 10px',
                        background: kitchenFull ? theme.bgAlt : theme.surface,
                        border: `1px solid ${kitchenFull ? theme.border : theme.accent}`,
                        borderRadius: theme.radiusSm,
                        color: kitchenFull ? theme.textMuted : theme.accent,
                        cursor: kitchenFull ? 'not-allowed' : 'pointer',
                        fontSize: 11,
                      }}
                    >
                      🏠 Keep
                    </button>
                    <button
                      onClick={() => sellHarvest(item.id)}
                      style={{
                        padding: '6px 10px',
                        background: theme.moneyLight,
                        border: `1px solid ${theme.money}`,
                        borderRadius: theme.radiusSm,
                        color: theme.money,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      💰 ${price}
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === 'shop' && (
          <div style={{ display: 'grid', gap: 8 }}>
            {PLANT_TYPES.map(plant => {
              const owned = seeds.get(plant.id) || 0;
              const canAfford = money >= plant.seedCost;
              
              return (
                <div key={plant.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: theme.bgAlt,
                  borderRadius: theme.radiusMd,
                }}>
                  <span style={{ fontSize: 24 }}>{plant.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: theme.text }}>
                      {plant.name}
                      {owned > 0 && <span style={{ color: theme.accent, marginLeft: 8 }}>×{owned}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textSecondary }}>
                      {plant.daysToMature}d · ${plant.sellPrice}/ea
                    </div>
                  </div>
                  <button
                    onClick={() => buySeeds(plant.id)}
                    disabled={!canAfford}
                    style={{
                      padding: '8px 14px',
                      background: canAfford ? theme.accent : theme.bgAlt,
                      border: `1px solid ${canAfford ? theme.accent : theme.border}`,
                      borderRadius: theme.radiusMd,
                      color: canAfford ? theme.textInverse : theme.textMuted,
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      fontWeight: 600,
                    }}
                  >
                    ${plant.seedCost}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Plant selection modal */}
      {showPlantMenu && (
        <PlantMenu
          seeds={seeds}
          pots={pots}
          selectedSlot={selectedSlot}
          onSelect={plantSeed}
          onClose={() => { setShowPlantMenu(false); setSelectedSlot(null); }}
          theme={theme}
        />
      )}
    </div>
  );
}

// Pot slot component
function PotSlot({
  slot,
  onClick,
  theme,
}: {
  slot: { index: number; pot: PotInstance | undefined; plant: PlantInstance | null; hasLight: boolean };
  onClick: () => void;
  theme: any;
}) {
  const plantType = slot.plant ? getPlantType(slot.plant.typeId) : null;

  if (!slot.pot) {
    return (
      <div onClick={onClick} style={{
        aspectRatio: '1',
        border: `2px dashed ${theme.border}`,
        borderRadius: theme.radiusMd,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: theme.textMuted,
      }}>
        <span style={{ fontSize: 20 }}>➕</span>
        <span style={{ fontSize: 10 }}>$5</span>
      </div>
    );
  }

  if (!slot.plant) {
    return (
      <div onClick={onClick} style={{
        aspectRatio: '1',
        border: `2px solid ${theme.border}`,
        borderRadius: theme.radiusMd,
        background: theme.bgAlt,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
      }}>
        {slot.hasLight && <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 10 }}>☀️</span>}
        <span style={{ fontSize: 20 }}>🪴</span>
        <span style={{ fontSize: 10, color: theme.accent }}>Plant</span>
      </div>
    );
  }

  const progress = Math.round(slot.plant.growthProgress * 100);
  const isReady = slot.plant.stage === 'harvestable';

  return (
    <div onClick={onClick} style={{
      aspectRatio: '1',
      border: `2px solid ${isReady ? theme.accent : theme.border}`,
      borderRadius: theme.radiusMd,
      background: isReady ? theme.accentLight : theme.bgAlt,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: isReady ? 'pointer' : 'default',
      position: 'relative',
    }}>
      {slot.hasLight && <span style={{ position: 'absolute', top: 4, right: 4, fontSize: 10 }}>☀️</span>}
      <span style={{ fontSize: slot.plant.stage === 'seed' ? 16 : 24 }}>
        {slot.plant.stage === 'seed' ? '🫘' : plantType?.emoji}
      </span>
      {isReady ? (
        <span style={{ fontSize: 10, color: theme.accent, fontWeight: 600 }}>Harvest!</span>
      ) : (
        <span style={{ fontSize: 10, color: theme.textMuted }}>{progress}%</span>
      )}
    </div>
  );
}

// Plant selection menu
function PlantMenu({
  seeds,
  pots,
  selectedSlot,
  onSelect,
  onClose,
  theme,
}: {
  seeds: Map<string, number>;
  pots: PotInstance[];
  selectedSlot: number | null;
  onSelect: (typeId: string, potId: string) => void;
  onClose: () => void;
  theme: any;
}) {
  const pot = pots.find(p => p.slot === selectedSlot);
  const available = PLANT_TYPES.filter(p => (seeds.get(p.id) || 0) > 0);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: `${theme.text}66`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: theme.surface,
        borderRadius: theme.radiusLg,
        padding: 20,
        minWidth: 260,
        boxShadow: theme.shadowLg,
      }} onClick={e => e.stopPropagation()}>
        <h4 style={{ margin: '0 0 12px', color: theme.text }}>Plant a seed</h4>
        
        {available.length === 0 ? (
          <p style={{ color: theme.textMuted }}>No seeds. Buy some in the shop!</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {available.map(plant => (
              <div
                key={plant.id}
                onClick={() => pot && onSelect(plant.id, pot.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 10,
                  background: theme.bgAlt,
                  borderRadius: theme.radiusMd,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 20 }}>{plant.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.text }}>{plant.name}</div>
                  <div style={{ fontSize: 10, color: theme.textMuted }}>{plant.daysToMature}d</div>
                </div>
                <span style={{ color: theme.accent }}>×{seeds.get(plant.id)}</span>
              </div>
            ))}
          </div>
        )}
        
        <button onClick={onClose} style={{
          marginTop: 12,
          width: '100%',
          padding: 10,
          background: 'none',
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radiusMd,
          color: theme.textSecondary,
          cursor: 'pointer',
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
