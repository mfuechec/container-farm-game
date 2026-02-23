/**
 * PlantHobby Stories
 * 
 * The main grow station view with all tabs.
 * Uses self-contained mock data instead of Zustand store.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { lightTheme, darkTheme, Theme } from '../theme/themes';
import { PLANT_TYPES } from '../hobbies/plants/types';
import { TABLE_TYPES, LIGHT_TYPES, POT_TYPES } from '../hobbies/plants/equipment';
import React, { useState } from 'react';

// Mock data types
interface MockPlant {
  id: string;
  typeId: string;
  growthProgress: number;
  stage: 'seed' | 'sprout' | 'growing' | 'harvestable';
}

interface MockPot {
  id: string;
  slot: number;
  typeId: string;
  plant?: string;
}

interface MockHarvest {
  id: string;
  typeId: string;
  quantity: number;
  freshness: number;
}

// Visual pot component (simplified from the real one)
function VisualPot({
  slotIndex,
  pot,
  plant,
  hasLight,
  onClick,
  theme,
}: {
  slotIndex: number;
  pot?: MockPot;
  plant?: MockPlant;
  hasLight: boolean;
  onClick: () => void;
  theme: Theme;
}) {
  const plantType = plant ? PLANT_TYPES.find(p => p.id === plant.typeId) : null;
  const isEmpty = !pot;
  const isEmptyPot = pot && !plant;
  const isReady = plant?.stage === 'harvestable';
  
  return (
    <div
      onClick={onClick}
      style={{
        width: 70,
        height: 100,
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.15s ease',
      }}
    >
      {/* Light indicator */}
      {hasLight && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: '#FFD54F',
          boxShadow: '0 0 4px #FFD54F',
        }} />
      )}
      
      {isEmpty ? (
        // Empty slot
        <div style={{
          width: 50,
          height: 60,
          border: `2px dashed ${theme.border}`,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.textMuted,
        }}>
          <span style={{ fontSize: 10 }}>$5</span>
        </div>
      ) : (
        // Pot with optional plant
        <div style={{
          width: 50,
          height: 60,
          background: '#CD7F32',
          borderRadius: '4px 4px 8px 8px',
          border: '1px solid #8B4513',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Soil */}
          <div style={{
            position: 'absolute',
            top: 4,
            left: 8,
            right: 8,
            height: 6,
            background: '#3E2723',
            borderRadius: 2,
          }} />
          
          {/* Plant */}
          {plant && plantType && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 24 + plant.growthProgress * 8,
              marginBottom: -8,
            }}>
              {plantType.emoji}
            </div>
          )}
          
          {/* Harvest pulse */}
          {isReady && (
            <div style={{
              position: 'absolute',
              inset: -4,
              border: `2px solid ${theme.accent}`,
              borderRadius: 12,
              animation: 'pulse 1.5s infinite',
            }} />
          )}
        </div>
      )}
      
      {/* Status */}
      <div style={{
        marginTop: 4,
        fontSize: 10,
        color: isReady ? theme.accent : isEmpty ? theme.textMuted : theme.textSecondary,
        fontWeight: isReady ? 600 : 400,
        fontFamily: 'monospace',
      }}>
        {isEmpty ? '' : isEmptyPot ? 'empty' : isReady ? 'harvest!' : `${Math.round((plant?.growthProgress || 0) * 100)}%`}
      </div>
    </div>
  );
}

// Main PlantHobby component
function PlantHobby({
  money = 100,
  tableSlots = 4,
  lightCoverage = 2,
  pots = [] as MockPot[],
  plants = {} as Record<string, MockPlant>,
  seeds = { basil: 3 } as Record<string, number>,
  harvest = [] as MockHarvest[],
  onBack,
  theme,
}: {
  money?: number;
  tableSlots?: number;
  lightCoverage?: number;
  pots?: MockPot[];
  plants?: Record<string, MockPlant>;
  seeds?: Record<string, number>;
  harvest?: MockHarvest[];
  onBack?: () => void;
  theme: Theme;
}) {
  const [tab, setTab] = useState<'grow' | 'harvest' | 'shop'>('grow');

  // Generate slots
  const slots = Array.from({ length: tableSlots }, (_, i) => {
    const pot = pots.find(p => p.slot === i);
    const plant = pot?.plant ? plants[pot.plant] : undefined;
    const hasLight = i < lightCoverage;
    return { index: i, pot, plant, hasLight };
  });

  return (
    <div style={{ 
      background: theme.surface, 
      borderRadius: theme.radiusLg, 
      boxShadow: theme.shadow,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
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
            padding: 16,
          }}>
            {/* Grow light */}
            <div style={{
              height: 24,
              background: '#455A64',
              borderRadius: 4,
              margin: '0 auto 16px',
              maxWidth: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} style={{
                  width: 30,
                  height: 6,
                  borderRadius: 2,
                  background: i < lightCoverage ? '#FFD54F' : '#5D4037',
                  boxShadow: i < lightCoverage ? '0 0 4px #FFD54F' : 'none',
                }} />
              ))}
            </div>
            
            {/* Pots */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}>
              {slots.map(slot => (
                <VisualPot
                  key={slot.index}
                  slotIndex={slot.index}
                  pot={slot.pot}
                  plant={slot.plant}
                  hasLight={slot.hasLight}
                  onClick={() => {}}
                  theme={theme}
                />
              ))}
            </div>
            
            {/* Table */}
            <div style={{
              height: 20,
              background: '#8D6E63',
              borderRadius: 4,
              marginTop: 8,
              maxWidth: 350,
              margin: '8px auto 0',
            }} />
          </div>
        )}

        {tab === 'harvest' && (
          harvest.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: theme.textMuted }}>
              No harvested plants yet
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {harvest.map(item => {
                const plantType = PLANT_TYPES.find(p => p.id === item.typeId);
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
                    <button style={{
                      padding: '6px 10px',
                      background: theme.surface,
                      border: `1px solid ${theme.accent}`,
                      borderRadius: theme.radiusSm,
                      color: theme.accent,
                      cursor: 'pointer',
                      fontSize: 11,
                    }}>
                      🏠 Keep
                    </button>
                    <button style={{
                      padding: '6px 10px',
                      background: theme.moneyLight,
                      border: `1px solid ${theme.money}`,
                      borderRadius: theme.radiusSm,
                      color: theme.money,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      💰 ${price}
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === 'shop' && (
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Seeds */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>
                Seeds
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {PLANT_TYPES.map(plant => (
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
                        {(seeds[plant.id] || 0) > 0 && (
                          <span style={{ color: theme.accent, marginLeft: 6 }}>×{seeds[plant.id]}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: theme.textMuted }}>
                        {plant.daysToMature}d · ${plant.sellPrice}/ea
                      </div>
                    </div>
                    <button style={{
                      padding: '6px 12px',
                      background: money >= plant.seedCost ? theme.accent : theme.bgAlt,
                      border: `1px solid ${money >= plant.seedCost ? theme.accent : theme.border}`,
                      borderRadius: theme.radiusSm,
                      color: money >= plant.seedCost ? theme.textInverse : theme.textMuted,
                      cursor: money >= plant.seedCost ? 'pointer' : 'not-allowed',
                      fontWeight: 600,
                      fontSize: 12,
                    }}>
                      ${plant.seedCost}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Tables */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>
                Tables
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {TABLE_TYPES.slice(0, 3).map((t, i) => (
                  <div key={t.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 10,
                    background: i === 0 ? `${theme.accent}15` : theme.bgAlt,
                    border: i === 0 ? `1px solid ${theme.accent}` : '1px solid transparent',
                    borderRadius: theme.radiusMd,
                  }}>
                    <span style={{ fontSize: 20 }}>{t.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: theme.text, fontSize: 13 }}>
                        {t.name}
                        {i === 0 && <span style={{ color: theme.accent, marginLeft: 6, fontSize: 10 }}>✓ owned</span>}
                      </div>
                      <div style={{ fontSize: 10, color: theme.textMuted }}>
                        {t.potSlots} slots · {t.description}
                      </div>
                    </div>
                    {i > 0 && (
                      <button style={{
                        padding: '6px 12px',
                        background: money >= t.cost ? theme.accent : theme.bgAlt,
                        border: `1px solid ${money >= t.cost ? theme.accent : theme.border}`,
                        borderRadius: theme.radiusSm,
                        color: money >= t.cost ? theme.textInverse : theme.textMuted,
                        fontWeight: 600,
                        fontSize: 12,
                      }}>
                        ${t.cost}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Lights */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>
                Lights
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {LIGHT_TYPES.slice(0, 3).map((l, i) => (
                  <div key={l.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 10,
                    background: i === 0 ? `${theme.accent}15` : theme.bgAlt,
                    border: i === 0 ? `1px solid ${theme.accent}` : '1px solid transparent',
                    borderRadius: theme.radiusMd,
                  }}>
                    <span style={{ fontSize: 20 }}>{l.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: theme.text, fontSize: 13 }}>
                        {l.name}
                        {i === 0 && <span style={{ color: theme.accent, marginLeft: 6, fontSize: 10 }}>✓ owned</span>}
                      </div>
                      <div style={{ fontSize: 10, color: theme.textMuted }}>
                        {l.coverage} coverage · {Math.round((l.growthBoost - 1) * 100)}% boost
                      </div>
                    </div>
                    {i > 0 && (
                      <button style={{
                        padding: '6px 12px',
                        background: money >= l.cost ? theme.accent : theme.bgAlt,
                        border: `1px solid ${money >= l.cost ? theme.accent : theme.border}`,
                        borderRadius: theme.radiusSm,
                        color: money >= l.cost ? theme.textInverse : theme.textMuted,
                        fontWeight: 600,
                        fontSize: 12,
                      }}>
                        ${l.cost}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Views/PlantHobby',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

export const EmptyGrow: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 450, margin: '0 auto' }}>
      <PlantHobby theme={lightTheme} />
    </div>
  ),
};

export const WithPlants: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 450, margin: '0 auto' }}>
      <PlantHobby 
        theme={lightTheme}
        money={85}
        pots={[
          { id: 'pot1', slot: 0, typeId: 'basic', plant: 'plant1' },
          { id: 'pot2', slot: 1, typeId: 'basic', plant: 'plant2' },
          { id: 'pot3', slot: 2, typeId: 'basic', plant: 'plant3' },
        ]}
        plants={{
          plant1: { id: 'plant1', typeId: 'basil', growthProgress: 0.9, stage: 'harvestable' },
          plant2: { id: 'plant2', typeId: 'mint', growthProgress: 0.5, stage: 'growing' },
          plant3: { id: 'plant3', typeId: 'basil', growthProgress: 0.1, stage: 'sprout' },
        }}
        seeds={{ basil: 1, mint: 2 }}
      />
    </div>
  ),
};

export const WithHarvest: StoryObj = {
  render: () => {
    const [tab, setTab] = useState<'grow' | 'harvest' | 'shop'>('harvest');
    
    return (
      <div style={{ maxWidth: 450, margin: '0 auto' }}>
        <PlantHobby 
          theme={lightTheme}
          money={120}
          harvest={[
            { id: 'h1', typeId: 'basil', quantity: 3, freshness: 0.95 },
            { id: 'h2', typeId: 'mint', quantity: 2, freshness: 0.8 },
            { id: 'h3', typeId: 'tomato', quantity: 5, freshness: 0.6 },
          ]}
        />
      </div>
    );
  },
};

export const RichPlayer: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 450, margin: '0 auto' }}>
      <PlantHobby 
        theme={lightTheme}
        money={500}
        tableSlots={6}
        lightCoverage={4}
        pots={[
          { id: 'pot1', slot: 0, typeId: 'basic', plant: 'plant1' },
          { id: 'pot2', slot: 1, typeId: 'basic', plant: 'plant2' },
          { id: 'pot3', slot: 2, typeId: 'basic' },
          { id: 'pot4', slot: 3, typeId: 'basic', plant: 'plant3' },
        ]}
        plants={{
          plant1: { id: 'plant1', typeId: 'basil', growthProgress: 1, stage: 'harvestable' },
          plant2: { id: 'plant2', typeId: 'tomato', growthProgress: 0.7, stage: 'growing' },
          plant3: { id: 'plant3', typeId: 'pepper', growthProgress: 0.3, stage: 'growing' },
        }}
        seeds={{ basil: 5, mint: 3, tomato: 2, pepper: 1 }}
      />
    </div>
  ),
};

export const DarkTheme: StoryObj = {
  render: () => (
    <div style={{ 
      background: darkTheme.bg, 
      padding: 24, 
      borderRadius: 12,
      maxWidth: 500,
      margin: '0 auto',
    }}>
      <PlantHobby 
        theme={darkTheme}
        money={150}
        pots={[
          { id: 'pot1', slot: 0, typeId: 'basic', plant: 'plant1' },
          { id: 'pot2', slot: 1, typeId: 'basic', plant: 'plant2' },
        ]}
        plants={{
          plant1: { id: 'plant1', typeId: 'basil', growthProgress: 0.8, stage: 'growing' },
          plant2: { id: 'plant2', typeId: 'mint', growthProgress: 1, stage: 'harvestable' },
        }}
        seeds={{ basil: 2 }}
        harvest={[
          { id: 'h1', typeId: 'basil', quantity: 2, freshness: 0.9 },
        ]}
      />
    </div>
  ),
};
