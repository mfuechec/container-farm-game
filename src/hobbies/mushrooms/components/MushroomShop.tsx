/**
 * MushroomShop - Buy spawn and equipment
 */

import React from 'react';
import { MUSHROOM_TYPES, EQUIPMENT_TYPES } from '../types';

interface MushroomShopProps {
  money: number;
  spawn: Record<string, number>;
  equipment: string[];
  onBuySpawn: (typeId: string, qty?: number) => void;
  onBuyEquipment: (equipmentId: string) => void;
  theme: any;
}

export function MushroomShop({
  money,
  spawn,
  equipment,
  onBuySpawn,
  onBuyEquipment,
  theme,
}: MushroomShopProps) {
  return (
    <div>
      {/* Spawn section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 11,
          color: theme.textMuted,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          🧫 Spawn
        </div>
        
        <div style={{ display: 'grid', gap: 8 }}>
          {MUSHROOM_TYPES.map(type => {
            const owned = spawn[type.id] || 0;
            const canAfford = money >= type.spawnCost;
            
            return (
              <div
                key={type.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: theme.bgAlt,
                  borderRadius: theme.radiusMd,
                }}
              >
                <span style={{ fontSize: 24 }}>{type.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 500, color: theme.text }}>{type.name}</span>
                    <DifficultyBadge difficulty={type.difficulty} theme={theme} />
                  </div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>
                    {type.description}
                  </div>
                  <div style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>
                    {type.daysToMature}d cycle • ${type.sellPrice}/oz • Owned: {owned}
                  </div>
                </div>
                <button
                  onClick={() => onBuySpawn(type.id)}
                  disabled={!canAfford}
                  style={{
                    padding: '8px 12px',
                    background: canAfford ? theme.accent : theme.bgAlt,
                    color: canAfford ? '#fff' : theme.textMuted,
                    border: 'none',
                    borderRadius: theme.radiusSm,
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  ${type.spawnCost}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Equipment section */}
      <div>
        <div style={{
          fontSize: 11,
          color: theme.textMuted,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}>
          🛠️ Equipment
        </div>
        
        <div style={{ display: 'grid', gap: 8 }}>
          {EQUIPMENT_TYPES.map(equip => {
            const owned = equipment.includes(equip.id);
            const canAfford = money >= equip.cost;
            const available = !owned && canAfford;
            
            return (
              <div
                key={equip.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: owned ? theme.accentLight : theme.bgAlt,
                  borderRadius: theme.radiusMd,
                  opacity: owned ? 0.7 : 1,
                }}
              >
                <span style={{ fontSize: 24 }}>{equip.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, color: theme.text }}>
                    {equip.name}
                    {owned && <span style={{ marginLeft: 8, fontSize: 10, color: theme.accent }}>✓ Owned</span>}
                  </div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>
                    {equip.description}
                  </div>
                  <div style={{ fontSize: 10, color: theme.textSecondary, marginTop: 4 }}>
                    {formatBonus(equip.bonus)}
                  </div>
                </div>
                {!owned && (
                  <button
                    onClick={() => onBuyEquipment(equip.id)}
                    disabled={!available}
                    style={{
                      padding: '8px 12px',
                      background: available ? theme.accent : theme.bgAlt,
                      color: available ? '#fff' : theme.textMuted,
                      border: 'none',
                      borderRadius: theme.radiusSm,
                      cursor: available ? 'pointer' : 'not-allowed',
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    ${equip.cost}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DifficultyBadge({ difficulty, theme }: { difficulty: string; theme: any }) {
  const colors: Record<string, { bg: string; text: string }> = {
    easy: { bg: '#dcfce7', text: '#16a34a' },
    medium: { bg: '#fef9c3', text: '#ca8a04' },
    hard: { bg: '#fee2e2', text: '#dc2626' },
  };
  
  const c = colors[difficulty] || colors.easy;
  
  return (
    <span style={{
      padding: '2px 6px',
      background: c.bg,
      color: c.text,
      borderRadius: theme.radiusSm,
      fontSize: 9,
      textTransform: 'uppercase',
      fontWeight: 600,
    }}>
      {difficulty}
    </span>
  );
}

function formatBonus(bonus: { humidity?: number; temperature?: number; freshAir?: boolean }): string {
  const parts: string[] = [];
  if (bonus.humidity) parts.push(`+${bonus.humidity}% humidity`);
  if (bonus.temperature) parts.push(`${bonus.temperature > 0 ? '+' : ''}${bonus.temperature}°F temp`);
  if (bonus.freshAir) parts.push('Enables fresh air');
  return parts.join(' • ') || 'No bonus';
}
