/**
 * Shop Panel - Buy seeds and equipment
 */

import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { PLANT_TYPES } from '../plants/types';
import { TABLE_TYPES, LIGHT_TYPES, POT_TYPES } from '../equipment/types';
import { useGame } from '../useGame';

interface ShopPanelProps {
  game: ReturnType<typeof useGame>;
}

type ShopTab = 'seeds' | 'equipment';

export function ShopPanel({ game }: ShopPanelProps) {
  const { theme } = useTheme();
  const [tab, setTab] = useState<ShopTab>('seeds');
  const { money, seeds, equipment } = game;

  return (
    <div style={{
      background: theme.surface,
      borderRadius: theme.radiusLg,
      padding: 20,
      boxShadow: theme.shadow,
    }}>
      <h3 style={{ 
        margin: '0 0 16px', 
        color: theme.text, 
        fontSize: 16, 
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        🛒 Shop
      </h3>

      {/* Tab buttons */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 16,
      }}>
        {(['seeds', 'equipment'] as ShopTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: tab === t ? theme.accentLight : 'transparent',
              border: `1px solid ${tab === t ? theme.accent : theme.border}`,
              borderRadius: theme.radiusMd,
              color: tab === t ? theme.accent : theme.textSecondary,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              textTransform: 'capitalize',
            }}
          >
            {t === 'seeds' ? '🫘 Seeds' : '🔧 Equipment'}
          </button>
        ))}
      </div>

      {/* Seeds tab */}
      {tab === 'seeds' && (
        <div style={{ display: 'grid', gap: 10 }}>
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
                border: `1px solid ${theme.border}`,
              }}>
                <span style={{ fontSize: 28 }}>{plant.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: theme.text }}>
                    {plant.name}
                    {owned > 0 && (
                      <span style={{ 
                        marginLeft: 8,
                        fontSize: 11,
                        color: theme.accent,
                        fontWeight: 400,
                      }}>
                        (×{owned})
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: theme.textSecondary }}>
                    {plant.daysToMature} days · ${plant.sellPrice}/ea
                  </div>
                  <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>
                    {plant.description}
                  </div>
                </div>
                <button
                  onClick={() => game.buySeeds(plant.id)}
                  disabled={!canAfford}
                  style={{
                    padding: '8px 14px',
                    background: canAfford ? theme.accent : theme.bgAlt,
                    border: `1px solid ${canAfford ? theme.accent : theme.border}`,
                    borderRadius: theme.radiusMd,
                    color: canAfford ? theme.textInverse : theme.textMuted,
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    fontSize: 13,
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

      {/* Equipment tab */}
      {tab === 'equipment' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Tables */}
          <div>
            <div style={{ 
              fontSize: 12, 
              color: theme.textSecondary, 
              marginBottom: 8,
              fontWeight: 600,
            }}>
              Tables
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {TABLE_TYPES.map(table => {
                const owned = equipment.table.id === table.id;
                const canAfford = money >= table.cost;
                
                return (
                  <EquipmentItem
                    key={table.id}
                    emoji={table.emoji}
                    name={table.name}
                    description={`${table.potSlots} pots · ${table.seedStorage} seed storage`}
                    cost={table.cost}
                    owned={owned}
                    canAfford={canAfford}
                    onBuy={() => game.buyEquipment('table', table.id)}
                    theme={theme}
                  />
                );
              })}
            </div>
          </div>

          {/* Lights */}
          <div>
            <div style={{ 
              fontSize: 12, 
              color: theme.textSecondary, 
              marginBottom: 8,
              fontWeight: 600,
            }}>
              Grow Lights
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {LIGHT_TYPES.map(light => {
                const owned = equipment.light.id === light.id;
                const canAfford = money >= light.cost;
                
                return (
                  <EquipmentItem
                    key={light.id}
                    emoji={light.emoji}
                    name={light.name}
                    description={`Covers ${light.coverage} pots · ${Math.round((light.growthBoost - 1) * 100)}% faster growth`}
                    cost={light.cost}
                    owned={owned}
                    canAfford={canAfford}
                    onBuy={() => game.buyEquipment('light', light.id)}
                    theme={theme}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EquipmentItem({
  emoji,
  name,
  description,
  cost,
  owned,
  canAfford,
  onBuy,
  theme,
}: {
  emoji: string;
  name: string;
  description: string;
  cost: number;
  owned: boolean;
  canAfford: boolean;
  onBuy: () => void;
  theme: any;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      background: owned ? theme.accentLight : theme.bgAlt,
      borderRadius: theme.radiusMd,
      border: `1px solid ${owned ? theme.accent : theme.border}`,
    }}>
      <span style={{ fontSize: 24 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: theme.text }}>{name}</div>
        <div style={{ fontSize: 11, color: theme.textSecondary }}>{description}</div>
      </div>
      {owned ? (
        <span style={{ 
          color: theme.accent, 
          fontSize: 12, 
          fontWeight: 600,
        }}>
          ✓ Owned
        </span>
      ) : cost === 0 ? (
        <span style={{ 
          color: theme.textMuted, 
          fontSize: 12,
        }}>
          Starter
        </span>
      ) : (
        <button
          onClick={onBuy}
          disabled={!canAfford}
          style={{
            padding: '8px 14px',
            background: canAfford ? theme.accent : theme.bgAlt,
            border: `1px solid ${canAfford ? theme.accent : theme.border}`,
            borderRadius: theme.radiusMd,
            color: canAfford ? theme.textInverse : theme.textMuted,
            cursor: canAfford ? 'pointer' : 'not-allowed',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ${cost}
        </button>
      )}
    </div>
  );
}
