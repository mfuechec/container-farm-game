/**
 * PlantMenu - Modal for selecting seeds to plant in a pot
 */

import React from 'react';
import { PLANT_TYPES } from '../types';
import { PotInstance } from '../equipment';

export interface PlantMenuProps {
  seeds: Record<string, number>;
  pots: PotInstance[];
  selectedSlot: number | null;
  onSelect: (typeId: string, potId: string) => void;
  onClose: () => void;
  theme: any;
}

export function PlantMenu({
  seeds,
  pots,
  selectedSlot,
  onSelect,
  onClose,
  theme,
}: PlantMenuProps) {
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
