/**
 * KitchenView Stories
 * 
 * The kitchen storage and bonus display view.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { lightTheme, darkTheme, Theme } from '../theme/themes';
import React from 'react';

interface StorageItem {
  id: string;
  emoji: string;
  name: string;
  quantity: number;
  freshness: number;
}

interface KitchenBonus {
  type: string;
  amount: number;
  source: string;
}

function KitchenView({
  storageItems = [],
  capacity = 5,
  grocerySavings = 0,
  weeklyExpenses = 250,
  bonuses = [],
  onBack,
  theme,
}: {
  storageItems?: StorageItem[];
  capacity?: number;
  grocerySavings?: number;
  weeklyExpenses?: number;
  bonuses?: KitchenBonus[];
  onBack?: () => void;
  theme: Theme;
}) {
  return (
    <div style={{
      background: theme.surface,
      borderRadius: theme.radiusLg,
      padding: 24,
      boxShadow: theme.shadow,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <button onClick={onBack} style={{
        background: 'none',
        border: 'none',
        color: theme.textSecondary,
        cursor: 'pointer',
        marginBottom: 16,
        fontSize: 14,
        padding: 0,
      }}>
        ← Back
      </button>

      <h2 style={{ margin: '0 0 16px', color: theme.text }}>
        🍳 Kitchen ({storageItems.length}/{capacity})
      </h2>

      {/* Expenses */}
      <div style={{
        padding: 12,
        background: theme.bgAlt,
        borderRadius: theme.radiusMd,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: theme.textSecondary, fontSize: 12 }}>Grocery savings</span>
          <span style={{ color: theme.accent, fontSize: 12 }}>-${grocerySavings.toFixed(1)}/wk</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: theme.text, fontWeight: 600 }}>Weekly expenses</span>
          <span style={{ color: theme.money, fontWeight: 600 }}>${weeklyExpenses.toFixed(0)}/wk</span>
        </div>
      </div>

      {/* Bonuses */}
      {bonuses.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>
            Active Bonuses
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {bonuses.map((b, i) => (
              <span key={i} style={{
                padding: '4px 10px',
                background: theme.accentLight,
                borderRadius: theme.radiusFull,
                fontSize: 11,
                color: theme.accent,
              }}>
                +{Math.round((b.amount - 1) * 100)}% {b.type} ({b.source})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Storage */}
      {storageItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: theme.textMuted }}>
          Store harvested items here for bonuses
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {storageItems.map(item => (
            <div key={item.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: theme.bgAlt,
              borderRadius: theme.radiusMd,
            }}>
              <span style={{ fontSize: 24 }}>{item.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: theme.text }}>{item.name} ×{item.quantity.toFixed(1)}</div>
                <div style={{ 
                  fontSize: 11, 
                  color: item.freshness > 0.5 ? theme.textMuted : item.freshness > 0.25 ? theme.warning : theme.danger,
                }}>
                  {Math.round(item.freshness * 100)}% fresh
                </div>
              </div>
              {/* Freshness bar */}
              <div style={{
                width: 60,
                height: 6,
                background: theme.border,
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${item.freshness * 100}%`,
                  height: '100%',
                  background: item.freshness > 0.5 ? theme.accent : item.freshness > 0.25 ? theme.warning : theme.danger,
                  borderRadius: 3,
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const meta: Meta = {
  title: 'Views/KitchenView',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

export const Empty: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 450, margin: '0 auto' }}>
      <KitchenView theme={lightTheme} />
    </div>
  ),
};

export const WithItems: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 450, margin: '0 auto' }}>
      <KitchenView 
        theme={lightTheme}
        storageItems={[
          { id: '1', emoji: '🌿', name: 'Basil', quantity: 2.5, freshness: 0.9 },
          { id: '2', emoji: '🌱', name: 'Mint', quantity: 1.0, freshness: 0.65 },
          { id: '3', emoji: '🍅', name: 'Cherry Tomatoes', quantity: 3.0, freshness: 0.4 },
        ]}
        grocerySavings={15.5}
        weeklyExpenses={234.5}
        bonuses={[
          { type: 'growth', amount: 1.15, source: 'Basil' },
        ]}
      />
    </div>
  ),
};

export const Full: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 450, margin: '0 auto' }}>
      <KitchenView 
        theme={lightTheme}
        storageItems={[
          { id: '1', emoji: '🌿', name: 'Basil', quantity: 3.0, freshness: 0.95 },
          { id: '2', emoji: '🌱', name: 'Mint', quantity: 2.5, freshness: 0.8 },
          { id: '3', emoji: '🍅', name: 'Cherry Tomatoes', quantity: 4.0, freshness: 0.7 },
          { id: '4', emoji: '🌶️', name: 'Peppers', quantity: 2.0, freshness: 0.6 },
          { id: '5', emoji: '🥬', name: 'Lettuce', quantity: 1.5, freshness: 0.5 },
        ]}
        capacity={5}
        grocerySavings={35.0}
        weeklyExpenses={215}
        bonuses={[
          { type: 'growth', amount: 1.15, source: 'Basil' },
          { type: 'yield', amount: 1.1, source: 'Mint' },
        ]}
      />
    </div>
  ),
};

export const SpoilingItems: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 450, margin: '0 auto' }}>
      <KitchenView 
        theme={lightTheme}
        storageItems={[
          { id: '1', emoji: '🌿', name: 'Basil', quantity: 1.0, freshness: 0.15 },
          { id: '2', emoji: '🍅', name: 'Cherry Tomatoes', quantity: 2.0, freshness: 0.08 },
        ]}
        grocerySavings={5.0}
        weeklyExpenses={245}
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
      <KitchenView 
        theme={darkTheme}
        storageItems={[
          { id: '1', emoji: '🌿', name: 'Basil', quantity: 2.5, freshness: 0.9 },
          { id: '2', emoji: '🌱', name: 'Mint', quantity: 1.0, freshness: 0.65 },
        ]}
        grocerySavings={12.5}
        weeklyExpenses={237.5}
        bonuses={[
          { type: 'growth', amount: 1.15, source: 'Basil' },
        ]}
      />
    </div>
  ),
};
