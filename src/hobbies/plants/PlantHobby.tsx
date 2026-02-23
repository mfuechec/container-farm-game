/**
 * Plant Hobby - The grow station view
 * 
 * Uses Zustand store for state. Only local UI state (tab, menus) lives here.
 */

import React, { useState, useCallback } from 'react';
import { useTheme } from '../../theme';
import { useGameStore, selectYieldMultiplier } from '../../store/gameStore';
import {
  PlantInstance, PLANT_TYPES,
  getPlantType,
} from './types';
import {
  PotInstance,
  POT_TYPES, TABLE_TYPES, LIGHT_TYPES,
  getPotType, slotHasLight,
} from './equipment';
import { GrowCanvas } from './GrowCanvas';
import { isMarketDay, MARKET_RENTALS, MarketRentalTier } from '../../market/types';

interface PlantHobbyProps {
  onBack: () => void;
}

export function PlantHobby({ onBack }: PlantHobbyProps) {
  const { theme } = useTheme();
  
  // Store state
  const money = useGameStore(s => s.economy.money);
  const plantHobby = useGameStore(s => s.plantHobby);
  const kitchen = useGameStore(s => s.kitchen);
  const market = useGameStore(s => s.market);
  const gameDay = useGameStore(s => s.gameDay);
  const yieldMultiplier = useGameStore(selectYieldMultiplier);
  
  // Store actions
  const buySeeds = useGameStore(s => s.buySeeds);
  const buyPot = useGameStore(s => s.buyPot);
  const upgradeTable = useGameStore(s => s.upgradeTable);
  const upgradeLight = useGameStore(s => s.upgradeLight);
  const plantSeed = useGameStore(s => s.plantSeed);
  const harvestPlant = useGameStore(s => s.harvestPlant);
  const sellHarvest = useGameStore(s => s.sellHarvest);
  const storeHarvest = useGameStore(s => s.storeHarvest);
  const sellWholesale = useGameStore(s => s.sellWholesale);
  const sellAtMarket = useGameStore(s => s.sellAtMarket);
  const setMarketRental = useGameStore(s => s.setMarketRental);
  
  // Market calculations
  const currentDay = Math.floor(gameDay);
  const marketOpen = isMarketDay(currentDay, market.rentalTier, market.lastMarketDay);
  
  // Local UI state only
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showPlantMenu, setShowPlantMenu] = useState(false);
  const [tab, setTab] = useState<'grow' | 'harvest' | 'shop'>('grow');

  const { table, light, pots, plants, seeds, harvest } = plantHobby;
  const kitchenFull = kitchen.storage.length >= kitchen.capacity;

  // Slot click handler
  const handleSlotClick = useCallback((slotIndex: number) => {
    const pot = pots.find(p => p.slot === slotIndex);
    
    if (!pot) {
      buyPot(slotIndex);
    } else if (!pot.plant) {
      setSelectedSlot(slotIndex);
      setShowPlantMenu(true);
    } else {
      const plant = plants[pot.plant];
      if (plant?.stage === 'harvestable') {
        harvestPlant(pot.plant, yieldMultiplier);
      }
    }
  }, [pots, plants, buyPot, harvestPlant, yieldMultiplier]);

  // Handle planting
  const handlePlantSeed = useCallback((typeId: string, potId: string) => {
    plantSeed(typeId, potId);
    setShowPlantMenu(false);
    setSelectedSlot(null);
  }, [plantSeed]);

  // Render slots
  const slots = Array.from({ length: table.potSlots }, (_, i) => {
    const pot = pots.find(p => p.slot === i);
    const plant = pot?.plant ? plants[pot.plant] ?? null : null;
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
          <div style={{ 
            background: theme.bgAlt, 
            borderRadius: theme.radiusMd,
            padding: 12,
          }}>
            <GrowCanvas
              width={400}
              height={200}
              onSlotClick={handleSlotClick}
            />
          </div>
        )}

        {tab === 'harvest' && (
          <div>
            {/* Market Status */}
            <div style={{
              padding: 12,
              marginBottom: 12,
              background: marketOpen ? `${theme.accent}15` : theme.bgAlt,
              border: marketOpen ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
              borderRadius: theme.radiusMd,
            }}>
              {market.rentalTier ? (
                <div>
                  <div style={{ fontWeight: 600, color: marketOpen ? theme.accent : theme.text }}>
                    {marketOpen ? '🏪 Market is OPEN!' : '🏪 Farmers Market'}
                  </div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>
                    {MARKET_RENTALS[market.rentalTier].label} stall (${MARKET_RENTALS[market.rentalTier].cost}/{market.rentalTier === 'monthly' ? 'mo' : market.rentalTier === 'biweekly' ? '2wk' : 'wk'})
                    {!marketOpen && ` · Next: Day ${market.lastMarketDay + MARKET_RENTALS[market.rentalTier].frequencyDays}`}
                  </div>
                </div>
              ) : (
                <div style={{ color: theme.textMuted, fontSize: 12 }}>
                  No market stall · Rent one in Shop tab
                </div>
              )}
            </div>

            {/* Harvest Items */}
            {harvest.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: theme.textMuted }}>
                No harvested plants yet
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {harvest.map(item => {
                  const plantType = getPlantType(item.typeId);
                  if (!plantType) return null;
                  
                  // Calculate prices
                  const wholesalePrice = Math.round(plantType.sellPrice * item.quantity * 0.5 * 10) / 10;
                  const freshnessBonus = 0.9 + (item.freshness * 0.2);
                  const marketPrice = Math.round(plantType.sellPrice * item.quantity * freshnessBonus * 10) / 10;
                  
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
                        <div style={{ color: theme.text }}>{plantType.name} ×{Math.round(item.quantity)}</div>
                        <div style={{ fontSize: 11, color: theme.textMuted }}>
                          {Math.round(item.freshness * 100)}% fresh
                        </div>
                      </div>
                      
                      {/* Keep button */}
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
                        🏠
                      </button>
                      
                      {/* Wholesale button (always available) */}
                      <button
                        onClick={() => sellWholesale(item.id)}
                        style={{
                          padding: '6px 10px',
                          background: theme.surface,
                          border: `1px solid ${theme.border}`,
                          borderRadius: theme.radiusSm,
                          color: theme.textSecondary,
                          cursor: 'pointer',
                          fontSize: 11,
                        }}
                        title="Wholesale (50%)"
                      >
                        🚚 ${wholesalePrice}
                      </button>
                      
                      {/* Market button (only when open) */}
                      <button
                        onClick={() => sellAtMarket(item.id)}
                        disabled={!marketOpen}
                        style={{
                          padding: '6px 10px',
                          background: marketOpen ? theme.moneyLight : theme.bgAlt,
                          border: `1px solid ${marketOpen ? theme.money : theme.border}`,
                          borderRadius: theme.radiusSm,
                          color: marketOpen ? theme.money : theme.textMuted,
                          cursor: marketOpen ? 'pointer' : 'not-allowed',
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                        title={marketOpen ? "Farmers Market (100% + freshness)" : "Market closed"}
                      >
                        🏪 ${marketPrice}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'shop' && (
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Seeds Section */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>
                Seeds
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {PLANT_TYPES.map(plant => {
                  const owned = seeds[plant.id] || 0;
                  const canAfford = money >= plant.seedCost;
                  
                  return (
                    <div key={plant.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 10,
                      background: theme.bgAlt,
                      borderRadius: theme.radiusMd,
                    }}>
                      <span style={{ fontSize: 20 }}>{plant.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: theme.text, fontSize: 13 }}>
                          {plant.name}
                          {owned > 0 && <span style={{ color: theme.accent, marginLeft: 6 }}>×{owned}</span>}
                        </div>
                        <div style={{ fontSize: 10, color: theme.textMuted }}>
                          {plant.daysToMature}d · ${plant.sellPrice}/ea
                        </div>
                      </div>
                      <button
                        onClick={() => buySeeds(plant.id)}
                        disabled={!canAfford}
                        style={{
                          padding: '6px 12px',
                          background: canAfford ? theme.accent : theme.bgAlt,
                          border: `1px solid ${canAfford ? theme.accent : theme.border}`,
                          borderRadius: theme.radiusSm,
                          color: canAfford ? theme.textInverse : theme.textMuted,
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        ${plant.seedCost}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Tables Section */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>
                Tables
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {TABLE_TYPES.map(t => {
                  const owned = table.id === t.id;
                  const canAfford = money >= t.cost;
                  
                  return (
                    <div key={t.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 10,
                      background: owned ? `${theme.accent}15` : theme.bgAlt,
                      border: owned ? `1px solid ${theme.accent}` : `1px solid transparent`,
                      borderRadius: theme.radiusMd,
                    }}>
                      <span style={{ fontSize: 20 }}>{t.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: theme.text, fontSize: 13 }}>
                          {t.name}
                          {owned && <span style={{ color: theme.accent, marginLeft: 6, fontSize: 10 }}>✓ owned</span>}
                        </div>
                        <div style={{ fontSize: 10, color: theme.textMuted }}>
                          {t.potSlots} slots · {t.description}
                        </div>
                      </div>
                      {!owned && (
                        <button
                          onClick={() => upgradeTable(t.id)}
                          disabled={!canAfford || t.cost === 0}
                          style={{
                            padding: '6px 12px',
                            background: canAfford ? theme.accent : theme.bgAlt,
                            border: `1px solid ${canAfford ? theme.accent : theme.border}`,
                            borderRadius: theme.radiusSm,
                            color: canAfford ? theme.textInverse : theme.textMuted,
                            cursor: canAfford ? 'pointer' : 'not-allowed',
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          {t.cost === 0 ? 'Free' : `$${t.cost}`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Lights Section */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>
                Lights
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {LIGHT_TYPES.map(l => {
                  const owned = light.id === l.id;
                  const canAfford = money >= l.cost;
                  
                  return (
                    <div key={l.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 10,
                      background: owned ? `${theme.accent}15` : theme.bgAlt,
                      border: owned ? `1px solid ${theme.accent}` : `1px solid transparent`,
                      borderRadius: theme.radiusMd,
                    }}>
                      <span style={{ fontSize: 20 }}>{l.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: theme.text, fontSize: 13 }}>
                          {l.name}
                          {owned && <span style={{ color: theme.accent, marginLeft: 6, fontSize: 10 }}>✓ owned</span>}
                        </div>
                        <div style={{ fontSize: 10, color: theme.textMuted }}>
                          {l.coverage} coverage · {Math.round((l.growthBoost - 1) * 100)}% boost · {l.description}
                        </div>
                      </div>
                      {!owned && (
                        <button
                          onClick={() => upgradeLight(l.id)}
                          disabled={!canAfford || l.cost === 0}
                          style={{
                            padding: '6px 12px',
                            background: canAfford ? theme.accent : theme.bgAlt,
                            border: `1px solid ${canAfford ? theme.accent : theme.border}`,
                            borderRadius: theme.radiusSm,
                            color: canAfford ? theme.textInverse : theme.textMuted,
                            cursor: canAfford ? 'pointer' : 'not-allowed',
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          {l.cost === 0 ? 'Free' : `$${l.cost}`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Market Stall Section */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>
                Market Stall
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {(['weekly', 'biweekly', 'monthly'] as const).map(tier => {
                  const rental = MARKET_RENTALS[tier];
                  const isSelected = market.rentalTier === tier;
                  
                  return (
                    <div key={tier} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 10,
                      background: isSelected ? `${theme.accent}15` : theme.bgAlt,
                      border: isSelected ? `1px solid ${theme.accent}` : `1px solid transparent`,
                      borderRadius: theme.radiusMd,
                    }}>
                      <span style={{ fontSize: 20 }}>🏪</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: theme.text, fontSize: 13 }}>
                          {rental.label} Stall
                          {isSelected && <span style={{ color: theme.accent, marginLeft: 6, fontSize: 10 }}>✓ active</span>}
                        </div>
                        <div style={{ fontSize: 10, color: theme.textMuted }}>
                          Market every {rental.frequencyDays} days · Sell at full price + freshness bonus
                        </div>
                      </div>
                      <button
                        onClick={() => setMarketRental(isSelected ? null : tier)}
                        style={{
                          padding: '6px 12px',
                          background: isSelected ? theme.surface : theme.accent,
                          border: `1px solid ${isSelected ? theme.border : theme.accent}`,
                          borderRadius: theme.radiusSm,
                          color: isSelected ? theme.textSecondary : theme.textInverse,
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        {isSelected ? 'Cancel' : `$${rental.cost}/${tier === 'monthly' ? 'mo' : tier === 'biweekly' ? '2wk' : 'wk'}`}
                      </button>
                    </div>
                  );
                })}
                
                {/* No stall option */}
                {market.rentalTier && (
                  <div style={{
                    padding: 10,
                    background: theme.bgAlt,
                    borderRadius: theme.radiusMd,
                    fontSize: 11,
                    color: theme.textMuted,
                    textAlign: 'center',
                  }}>
                    Wholesale is always available at 50% price
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plant selection modal */}
      {showPlantMenu && (
        <PlantMenu
          seeds={seeds}
          pots={pots}
          selectedSlot={selectedSlot}
          onSelect={handlePlantSeed}
          onClose={() => { setShowPlantMenu(false); setSelectedSlot(null); }}
          theme={theme}
        />
      )}
    </div>
  );
}

// Visual Grow Light component
function GrowLight({ coverage, totalSlots, theme }: { coverage: number; totalSlots: number; theme: any }) {
  const width = Math.min(400, totalSlots * 80 + 40);
  const intensity = coverage / totalSlots;
  const glowColor = `rgba(255, 200, 100, ${intensity * 0.5})`;
  const lightColor = intensity > 0.5 ? '#FFD54F' : intensity > 0.2 ? '#FFA726' : '#5D4037';
  
  return (
    <div style={{ width: '100%', maxWidth: width, margin: '0 auto', position: 'relative' }}>
      {/* Light glow effect */}
      {intensity > 0.1 && (
        <div style={{
          position: 'absolute',
          top: 35,
          left: '15%',
          width: '70%',
          height: 150,
          background: `linear-gradient(180deg, ${glowColor} 0%, transparent 100%)`,
          pointerEvents: 'none',
          borderRadius: '50%',
        }} />
      )}
      
      <svg width="100%" height={40} viewBox={`0 0 ${width} 40`} preserveAspectRatio="xMidYMid meet">
        {/* Mounting bar */}
        <rect x={width * 0.1} y={0} width={width * 0.8} height={6} rx={2} fill="#37474F" />
        
        {/* Cables */}
        <line x1={width * 0.2} y1={6} x2={width * 0.2} y2={14} stroke="#212121" strokeWidth={2} />
        <line x1={width * 0.8} y1={6} x2={width * 0.8} y2={14} stroke="#212121" strokeWidth={2} />
        
        {/* Light fixture */}
        <rect x={width * 0.1} y={14} width={width * 0.8} height={14} rx={3} fill="#455A64" stroke="#37474F" />
        
        {/* Light panels */}
        {[0.15, 0.32, 0.49, 0.66, 0.83].slice(0, Math.ceil(coverage * 1.5)).map((pos, i) => (
          <rect
            key={i}
            x={width * pos}
            y={18}
            width={width * 0.1}
            height={6}
            rx={1}
            fill={lightColor}
            style={{ filter: intensity > 0.3 ? `drop-shadow(0 0 ${3 * intensity}px ${lightColor})` : 'none' }}
          />
        ))}
        
        {/* Power LED */}
        <circle cx={width * 0.93} cy={21} r={2} fill={intensity > 0.1 ? '#4CAF50' : '#757575'} />
      </svg>
    </div>
  );
}

// Visual Pot component with terracotta pot and growing plant
function VisualPot({
  slot,
  onClick,
  theme,
}: {
  slot: { index: number; pot: PotInstance | undefined; plant: PlantInstance | null; hasLight: boolean };
  onClick: () => void;
  theme: any;
}) {
  const plantType = slot.plant ? getPlantType(slot.plant.typeId) : null;
  const width = 70;
  const height = 100;
  const potHeight = 45;
  
  // Generate plant graphics
  let plantGraphic = null;
  if (slot.plant && plantType) {
    const growth = slot.plant.growthProgress;
    const stage = slot.plant.stage;
    
    // Plant colors vary slightly by type
    const hueOffset = plantType.id === 'basil' ? 0 : plantType.id === 'mint' ? -10 : 10;
    const leafHue = 115 + hueOffset;
    const leafColor = `hsl(${leafHue}, 55%, 40%)`;
    const stemColor = `hsl(${leafHue + 15}, 35%, 30%)`;
    
    if (stage === 'seed') {
      // Just soil with a tiny sprout
      plantGraphic = (
        <g>
          <line x1={width/2} y1={potHeight - 5} x2={width/2} y2={potHeight - 10} stroke={stemColor} strokeWidth={1.5} strokeLinecap="round" />
          <ellipse cx={width/2} cy={potHeight - 12} rx={4} ry={3} fill={leafColor} opacity={0.7} />
        </g>
      );
    } else {
      // Growing plant
      const stemHeight = 15 + growth * 35;
      const leafCount = Math.floor(2 + growth * 5);
      const leafSize = 6 + growth * 8;
      
      const leaves = [];
      for (let i = 0; i < leafCount; i++) {
        const tier = Math.floor(i / 2);
        const y = potHeight - 8 - (tier + 1) * (stemHeight / (leafCount / 2 + 1));
        const isLeft = i % 2 === 0;
        const xOffset = (leafSize * 0.5) * (isLeft ? -1 : 1);
        const rotation = isLeft ? -35 : 35;
        
        leaves.push(
          <ellipse
            key={i}
            cx={width/2 + xOffset}
            cy={y}
            rx={leafSize * 0.65}
            ry={leafSize * 0.4}
            fill={leafColor}
            transform={`rotate(${rotation}, ${width/2 + xOffset}, ${y})`}
            style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.15))' }}
          />
        );
      }
      
      plantGraphic = (
        <g>
          {/* Stem */}
          <line
            x1={width/2}
            y1={potHeight - 5}
            x2={width/2}
            y2={potHeight - 5 - stemHeight}
            stroke={stemColor}
            strokeWidth={2 + growth}
            strokeLinecap="round"
          />
          {/* Leaves */}
          {leaves}
          {/* Flower/bud for harvestable */}
          {stage === 'harvestable' && (
            <circle
              cx={width/2}
              cy={potHeight - 5 - stemHeight - 4}
              r={5}
              fill={`hsl(${leafHue - 30}, 60%, 50%)`}
              style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.3))' }}
            />
          )}
        </g>
      );
    }
  }
  
  const isReady = slot.plant?.stage === 'harvestable';
  const isEmpty = !slot.pot;
  const isEmptyPot = slot.pot && !slot.plant;
  
  return (
    <div
      onClick={onClick}
      style={{
        width,
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform 0.15s ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Pot and plant container */}
        <g transform={`translate(0, ${height - potHeight - 5})`}>
          {/* Plant (rendered behind pot rim) */}
          {plantGraphic}
          
          {/* Terracotta pot */}
          <defs>
            <linearGradient id={`potGrad${slot.index}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A0522D" />
              <stop offset="35%" stopColor="#CD7F32" />
              <stop offset="65%" stopColor="#CD7F32" />
              <stop offset="100%" stopColor="#8B4513" />
            </linearGradient>
          </defs>
          
          {isEmpty ? (
            // Empty slot - dashed outline
            <g>
              <rect
                x={10}
                y={10}
                width={width - 20}
                height={potHeight - 10}
                rx={4}
                fill="none"
                stroke={theme.border}
                strokeWidth={2}
                strokeDasharray="6 4"
              />
              <text x={width/2} y={potHeight/2 + 5} textAnchor="middle" fill={theme.textMuted} fontSize={10}>$5</text>
            </g>
          ) : (
            // Pot body
            <g>
              <path
                d={`
                  M ${width * 0.18} 4
                  L ${width * 0.12} ${potHeight - 8}
                  Q ${width * 0.12} ${potHeight} ${width * 0.22} ${potHeight}
                  L ${width * 0.78} ${potHeight}
                  Q ${width * 0.88} ${potHeight} ${width * 0.88} ${potHeight - 8}
                  L ${width * 0.82} 4
                  Z
                `}
                fill={`url(#potGrad${slot.index})`}
                stroke="#8B5A2B"
                strokeWidth={1}
              />
              
              {/* Pot rim */}
              <ellipse cx={width/2} cy={4} rx={width * 0.38} ry={5} fill="#CD7F32" stroke="#8B5A2B" strokeWidth={1} />
              
              {/* Soil */}
              <ellipse cx={width/2} cy={6} rx={width * 0.32} ry={3} fill="#3E2723" />
              
              {/* Pot highlight */}
              <path
                d={`M ${width * 0.22} 10 Q ${width * 0.18} ${potHeight/2} ${width * 0.2} ${potHeight - 10}`}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </g>
          )}
        </g>
        
        {/* Light indicator */}
        {slot.hasLight && slot.pot && (
          <circle cx={width - 8} cy={8} r={5} fill="#FFD54F" opacity={0.8} style={{ filter: 'drop-shadow(0 0 3px #FFD54F)' }} />
        )}
        
        {/* Ready pulse */}
        {isReady && (
          <circle
            cx={width/2}
            cy={height - potHeight}
            r={8}
            fill="none"
            stroke={theme.accent}
            strokeWidth={2}
            opacity={0.7}
          >
            <animate attributeName="r" from="8" to="18" dur="1.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.7" to="0" dur="1.2s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>
      
      {/* Status text */}
      <div style={{
        textAlign: 'center',
        fontSize: 10,
        fontFamily: 'monospace',
        marginTop: -2,
        color: isReady ? theme.accent : isEmpty ? theme.textMuted : theme.textSecondary,
        fontWeight: isReady ? 600 : 400,
      }}>
        {isEmpty ? '' : isEmptyPot ? 'empty' : isReady ? 'harvest!' : `${Math.round(slot.plant!.growthProgress * 100)}%`}
      </div>
    </div>
  );
}

// Visual table surface
function WoodenTable({ width, theme }: { width: number; theme: any }) {
  const woodColor = theme.name === 'dark' ? '#5D4037' : '#8D6E63';
  const woodDark = theme.name === 'dark' ? '#3E2723' : '#5D4037';
  const woodLight = theme.name === 'dark' ? '#6D4C41' : '#A1887F';
  
  return (
    <svg width="100%" height={25} viewBox={`0 0 ${width} 25`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <pattern id="woodPattern" patternUnits="userSpaceOnUse" width={80} height={25}>
          <rect width={80} height={25} fill={woodColor} />
          <line x1={0} y1={5} x2={80} y2={5} stroke={woodLight} strokeWidth={1} opacity={0.25} />
          <line x1={0} y1={12} x2={80} y2={12} stroke={woodDark} strokeWidth={1.5} opacity={0.35} />
          <line x1={0} y1={19} x2={80} y2={19} stroke={woodLight} strokeWidth={1} opacity={0.2} />
        </pattern>
      </defs>
      <rect x={0} y={0} width={width} height={18} fill="url(#woodPattern)" />
      <rect x={0} y={16} width={width} height={9} fill={woodDark} />
    </svg>
  );
}

// Combined grow area with table, pots, and light
function GrowArea({
  slots,
  onSlotClick,
  lightCoverage,
  theme,
}: {
  slots: { index: number; pot: PotInstance | undefined; plant: PlantInstance | null; hasLight: boolean }[];
  onSlotClick: (index: number) => void;
  lightCoverage: number;
  theme: any;
}) {
  const containerWidth = Math.min(500, slots.length * 80 + 60);
  
  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Grow light */}
      <GrowLight coverage={lightCoverage} totalSlots={slots.length} theme={theme} />
      
      {/* Pots on table */}
      <div style={{
        position: 'relative',
        maxWidth: containerWidth,
        margin: '0 auto',
        paddingBottom: 25,
      }}>
        {/* Pots row */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 6,
          padding: '8px 16px',
          minHeight: 110,
          position: 'relative',
          zIndex: 2,
        }}>
          {slots.map(slot => (
            <VisualPot
              key={slot.index}
              slot={slot}
              onClick={() => onSlotClick(slot.index)}
              theme={theme}
            />
          ))}
        </div>
        
        {/* Table surface */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1 }}>
          <WoodenTable width={containerWidth} theme={theme} />
        </div>
      </div>
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
  seeds: Record<string, number>;
  pots: PotInstance[];
  selectedSlot: number | null;
  onSelect: (typeId: string, potId: string) => void;
  onClose: () => void;
  theme: any;
}) {
  const pot = pots.find(p => p.slot === selectedSlot);
  const available = PLANT_TYPES.filter(p => (seeds[p.id] || 0) > 0);

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
                <span style={{ color: theme.accent }}>×{seeds[plant.id]}</span>
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
