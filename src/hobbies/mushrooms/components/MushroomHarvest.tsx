/**
 * MushroomHarvest - Manage harvested mushrooms
 */

import React from 'react';
import { HarvestedMushroom, getMushroomType } from '../types';

interface MushroomHarvestProps {
  harvest: HarvestedMushroom[];
  kitchenFull: boolean;
  onSell: (harvestId: string) => void;
  onStore: (harvestId: string) => boolean;
  onStoreToPantry: (harvestId: string) => boolean;
  theme: any;
}

export function MushroomHarvest({
  harvest,
  kitchenFull,
  onSell,
  onStore,
  onStoreToPantry,
  theme,
}: MushroomHarvestProps) {
  if (harvest.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 40,
        color: theme.textMuted,
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🍄</div>
        <div>No mushrooms harvested yet</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>
          Grow and harvest mushrooms to see them here
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* Synergy hint */}
      <div style={{
        padding: 12,
        background: theme.bgAlt,
        borderRadius: theme.radiusMd,
        fontSize: 11,
        color: theme.textSecondary,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <span>💡</span>
        <span>
          Harvesting mushrooms creates spent substrate that boosts your plant yields!
        </span>
      </div>

      {harvest.map(item => {
        const mushroomType = getMushroomType(item.typeId);
        if (!mushroomType) return null;
        
        const sellPrice = Math.round(mushroomType.sellPrice * item.quantity * item.freshness * 10) / 10;
        const freshnessPercent = Math.round(item.freshness * 100);
        
        return (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: theme.radiusMd,
            }}
          >
            <span style={{ fontSize: 28 }}>{mushroomType.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, color: theme.text }}>
                {mushroomType.name}
              </div>
              <div style={{ fontSize: 12, color: theme.textSecondary }}>
                {item.quantity.toFixed(1)} oz • {freshnessPercent}% fresh
              </div>
              <div style={{ fontSize: 11, color: theme.accent, marginTop: 2 }}>
                ${sellPrice.toFixed(2)}
              </div>
            </div>
            
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => onStoreToPantry(item.id)}
                title="Store in Pantry (for cooking)"
                style={{
                  padding: '6px 10px',
                  background: theme.surface,
                  color: theme.accent,
                  border: `1px solid ${theme.accent}`,
                  borderRadius: theme.radiusSm,
                  cursor: 'pointer',
                  fontSize: 11,
                }}
              >
                🍳 Cook
              </button>
              <button
                onClick={() => onSell(item.id)}
                style={{
                  padding: '6px 10px',
                  background: theme.accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: theme.radiusSm,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                💰 Sell
              </button>
            </div>
          </div>
        );
      })}

      {/* Freshness warning */}
      {harvest.some(h => h.freshness < 0.5) && (
        <div style={{
          padding: 8,
          background: '#fef3c7',
          borderRadius: theme.radiusSm,
          fontSize: 11,
          color: '#92400e',
          textAlign: 'center',
        }}>
          ⚠️ Some mushrooms are losing freshness! Sell or store soon.
        </div>
      )}
    </div>
  );
}
