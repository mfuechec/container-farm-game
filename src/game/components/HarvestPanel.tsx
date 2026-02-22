/**
 * Harvest Panel - Where harvested plants go
 * 
 * Player can sell for cash or store in kitchen.
 */

import React from 'react';
import { useTheme } from '../../theme';
import { HarvestedPlant, getPlantType } from '../plants/types';
import { useGame } from '../useGame';

interface HarvestPanelProps {
  game: ReturnType<typeof useGame>;
}

export function HarvestPanel({ game }: HarvestPanelProps) {
  const { theme } = useTheme();
  const { harvest, kitchen } = game;

  if (harvest.length === 0) {
    return (
      <div style={{
        background: theme.surface,
        borderRadius: theme.radiusLg,
        padding: 20,
        boxShadow: theme.shadow,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
        <div style={{ color: theme.textSecondary, fontSize: 14 }}>
          No harvested plants
        </div>
        <div style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
          Harvest mature plants to see them here
        </div>
      </div>
    );
  }

  const kitchenFull = kitchen.storage.length >= kitchen.capacity;

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
        📦 Harvest ({harvest.length})
      </h3>

      <div style={{ display: 'grid', gap: 10 }}>
        {harvest.map(item => (
          <HarvestItem 
            key={item.id} 
            item={item} 
            onSell={() => game.sellHarvest(item.id)}
            onStore={() => game.storeInKitchen(item.id)}
            kitchenFull={kitchenFull}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}

function HarvestItem({ 
  item, 
  onSell, 
  onStore,
  kitchenFull,
  theme 
}: { 
  item: HarvestedPlant;
  onSell: () => void;
  onStore: () => void;
  kitchenFull: boolean;
  theme: any;
}) {
  const plantType = getPlantType(item.typeId);
  if (!plantType) return null;

  const salePrice = Math.round(plantType.sellPrice * item.quantity * item.freshness * 10) / 10;
  const freshnessPercent = Math.round(item.freshness * 100);
  const freshnessColor = item.freshness > 0.6 
    ? theme.accent 
    : item.freshness > 0.3 
      ? theme.money 
      : theme.danger;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      background: theme.bgAlt,
      borderRadius: theme.radiusMd,
      border: `1px solid ${theme.border}`,
    }}>
      <span style={{ fontSize: 28 }}>{plantType.emoji}</span>
      
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: theme.text }}>
          {plantType.name} ×{item.quantity}
        </div>
        <div style={{ 
          fontSize: 11, 
          color: freshnessColor,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span>Freshness: {freshnessPercent}%</span>
          <div style={{
            flex: 1,
            maxWidth: 60,
            height: 4,
            background: theme.border,
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${freshnessPercent}%`,
              background: freshnessColor,
              transition: 'width 0.3s',
            }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onStore}
          disabled={kitchenFull}
          title={kitchenFull ? 'Kitchen is full' : 'Store in kitchen for bonuses'}
          style={{
            padding: '6px 10px',
            background: kitchenFull ? theme.bgAlt : theme.surface,
            border: `1px solid ${kitchenFull ? theme.border : theme.accent}`,
            borderRadius: theme.radiusSm,
            color: kitchenFull ? theme.textMuted : theme.accent,
            cursor: kitchenFull ? 'not-allowed' : 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          🏠 Keep
        </button>
        <button
          onClick={onSell}
          style={{
            padding: '6px 10px',
            background: theme.moneyLight,
            border: `1px solid ${theme.money}`,
            borderRadius: theme.radiusSm,
            color: theme.money,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          💰 ${salePrice}
        </button>
      </div>
    </div>
  );
}
