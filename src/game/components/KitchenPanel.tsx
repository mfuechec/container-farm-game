/**
 * Kitchen Panel - Shows stored plants and their bonuses
 */

import React from 'react';
import { useTheme } from '../../theme';
import { getPlantType } from '../plants/types';
import { useGame } from '../useGame';

interface KitchenPanelProps {
  game: ReturnType<typeof useGame>;
}

export function KitchenPanel({ game }: KitchenPanelProps) {
  const { theme } = useTheme();
  const { kitchen, kitchenBonuses, grocerySavings, weeklyExpenses } = game;

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
        🏠 Kitchen ({kitchen.storage.length}/{kitchen.capacity})
      </h3>

      {/* Weekly expenses summary */}
      <div style={{
        padding: 12,
        background: theme.bgAlt,
        borderRadius: theme.radiusMd,
        marginBottom: 16,
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <span style={{ color: theme.textSecondary, fontSize: 12 }}>Weekly rent</span>
          <span style={{ color: theme.text, fontSize: 12 }}>$50</span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <span style={{ color: theme.textSecondary, fontSize: 12 }}>Base groceries</span>
          <span style={{ color: theme.text, fontSize: 12 }}>${kitchen.weeklyGroceryBase}</span>
        </div>
        {grocerySavings > 0 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <span style={{ color: theme.accent, fontSize: 12 }}>Savings from plants</span>
            <span style={{ color: theme.accent, fontSize: 12 }}>-${grocerySavings.toFixed(1)}</span>
          </div>
        )}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          borderTop: `1px solid ${theme.border}`,
          paddingTop: 8,
          marginTop: 4,
        }}>
          <span style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>Weekly total</span>
          <span style={{ color: theme.money, fontSize: 13, fontWeight: 600 }}>${weeklyExpenses.toFixed(1)}</span>
        </div>
      </div>

      {/* Active bonuses */}
      {kitchenBonuses.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ 
            fontSize: 11, 
            color: theme.textSecondary, 
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Active Bonuses
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {kitchenBonuses.map((bonus, i) => (
              <div key={i} style={{
                padding: '4px 10px',
                background: theme.accentLight,
                borderRadius: theme.radiusFull,
                fontSize: 11,
                color: theme.accent,
                fontWeight: 500,
              }}>
                {bonus.type === 'growth' && '🌱'}
                {bonus.type === 'yield' && '📈'}
                {bonus.type === 'freshness' && '✨'}
                {' '}{Math.round((bonus.amount - 1) * 100)}% {bonus.type} ({bonus.source})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stored items */}
      {kitchen.storage.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px 0',
          color: theme.textMuted,
          fontSize: 13,
        }}>
          Store harvested plants here for bonuses and grocery savings
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {kitchen.storage.map(item => {
            const plantType = getPlantType(item.typeId);
            if (!plantType) return null;
            
            const freshnessPercent = Math.round(item.freshness * 100);
            const freshnessColor = item.freshness > 0.6 
              ? theme.accent 
              : item.freshness > 0.3 
                ? theme.money 
                : theme.danger;

            return (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 10,
                background: theme.bgAlt,
                borderRadius: theme.radiusMd,
              }}>
                <span style={{ fontSize: 22 }}>{plantType.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: theme.text }}>
                    {plantType.name} ×{item.quantity.toFixed(1)}
                  </div>
                  <div style={{ 
                    fontSize: 10, 
                    color: theme.textMuted,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    <span>Saves ${(plantType.groceryValue * item.quantity * item.freshness).toFixed(1)}/wk</span>
                    {plantType.kitchenBonus && (
                      <span style={{ color: theme.accent }}>
                        +{Math.round((plantType.kitchenBonus.amount - 1) * 100)}% {plantType.kitchenBonus.type}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: `conic-gradient(${freshnessColor} ${freshnessPercent}%, ${theme.border} 0%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: theme.bgAlt,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 600,
                    color: freshnessColor,
                  }}>
                    {freshnessPercent}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
