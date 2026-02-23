/**
 * SpawnMenu - Modal for selecting spawn to inoculate a bag
 */

import React from 'react';
import { MUSHROOM_TYPES, getMushroomType } from '../types';

interface SpawnMenuProps {
  spawn: Record<string, number>;
  bagId: string;
  onSelect: (typeId: string, bagId: string) => void;
  onClose: () => void;
  theme: any;
}

export function SpawnMenu({ spawn, bagId, onSelect, onClose, theme }: SpawnMenuProps) {
  // Filter to only show spawn we have
  const availableSpawn = MUSHROOM_TYPES.filter(t => (spawn[t.id] || 0) > 0);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.surface,
          borderRadius: theme.radiusLg,
          padding: 20,
          minWidth: 300,
          maxWidth: 400,
          boxShadow: theme.shadow,
        }}
      >
        <h3 style={{ margin: '0 0 16px', color: theme.text }}>
          🧫 Select Spawn
        </h3>

        {availableSpawn.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 20,
            color: theme.textMuted,
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📦</div>
            <div>No spawn available</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              Buy spawn from the shop first
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {availableSpawn.map(type => {
              const count = spawn[type.id] || 0;
              
              return (
                <button
                  key={type.id}
                  onClick={() => onSelect(type.id, bagId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    background: theme.bgAlt,
                    border: `2px solid ${theme.border}`,
                    borderRadius: theme.radiusMd,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.2s ease',
                  }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = theme.accent)}
                  onMouseOut={e => (e.currentTarget.style.borderColor = theme.border)}
                >
                  <span style={{ fontSize: 24 }}>{type.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: theme.text }}>
                      {type.name}
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>
                      {type.daysToMature}d cycle • ${type.sellPrice}/oz
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    background: theme.surface,
                    borderRadius: theme.radiusSm,
                    fontSize: 11,
                    color: theme.textSecondary,
                  }}>
                    ×{count}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: 16,
            padding: '10px',
            background: 'none',
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radiusSm,
            color: theme.textSecondary,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
