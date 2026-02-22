/**
 * Hobby Space - Main game view for the plant growing hobby
 * 
 * Phase 1: Simplified, equipment-based plant growing.
 */

import React, { useState } from 'react';
import { useTheme } from '../theme';
import { useGame } from './useGame';
import { GrowStation, HarvestPanel, KitchenPanel, ShopPanel } from './components';

type Tab = 'grow' | 'harvest' | 'kitchen' | 'shop';

export function HobbySpace() {
  const { theme, toggleTheme, isDark } = useTheme();
  const game = useGame();
  const [tab, setTab] = useState<Tab>('grow');

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'grow', label: 'Grow', emoji: '🌱' },
    { id: 'harvest', label: `Harvest (${game.harvest.length})`, emoji: '📦' },
    { id: 'kitchen', label: 'Kitchen', emoji: '🏠' },
    { id: 'shop', label: 'Shop', emoji: '🛒' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        boxShadow: theme.shadow,
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: 20, 
            fontWeight: 700, 
            color: theme.accent,
          }}>
            🌱 Side Hustle Simulator
          </h1>
          <span style={{ 
            fontSize: 12, 
            color: theme.textSecondary,
          }}>
            Day {Math.floor(game.gameDay)} · Week {Math.floor((game.gameDay - 1) / 7) + 1}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Money display */}
          <div style={{
            background: theme.moneyLight,
            padding: '8px 16px',
            borderRadius: theme.radiusMd,
          }}>
            <span style={{ 
              fontSize: 18, 
              fontWeight: 700, 
              color: theme.money,
            }}>
              ${game.money.toFixed(0)}
            </span>
          </div>

          {/* Dev controls */}
          <div style={{
            display: 'flex',
            gap: 4,
          }}>
            <button
              onClick={() => game.skipTime(1)}
              style={{
                padding: '6px 10px',
                background: theme.bgAlt,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radiusSm,
                color: theme.textSecondary,
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              +1 Day
            </button>
            <button
              onClick={() => game.skipTime(7)}
              style={{
                padding: '6px 10px',
                background: theme.bgAlt,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radiusSm,
                color: theme.textSecondary,
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              +1 Week
            </button>
            <button
              onClick={toggleTheme}
              style={{
                padding: '6px 10px',
                background: theme.bgAlt,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radiusSm,
                color: theme.textSecondary,
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <nav style={{
        display: 'flex',
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
      }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t.id 
                ? `2px solid ${theme.accent}` 
                : '2px solid transparent',
              color: tab === t.id ? theme.accent : theme.textSecondary,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: tab === t.id ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main style={{
        padding: 24,
        maxWidth: 800,
        margin: '0 auto',
      }}>
        {tab === 'grow' && <GrowStation game={game} />}
        {tab === 'harvest' && <HarvestPanel game={game} />}
        {tab === 'kitchen' && <KitchenPanel game={game} />}
        {tab === 'shop' && <ShopPanel game={game} />}

        {/* Weekly expenses reminder */}
        <div style={{
          marginTop: 24,
          padding: 16,
          background: theme.surface,
          borderRadius: theme.radiusLg,
          border: `1px solid ${theme.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <span style={{ fontSize: 13, color: theme.textSecondary }}>
              Weekly expenses:
            </span>
            <span style={{ 
              fontSize: 13, 
              color: theme.text, 
              fontWeight: 600,
              marginLeft: 8,
            }}>
              ${game.weeklyExpenses.toFixed(0)}/week
            </span>
          </div>
          <div style={{ fontSize: 12, color: theme.textMuted }}>
            Rent $50 + Groceries ${Math.max(0, game.kitchen.weeklyGroceryBase - game.grocerySavings).toFixed(0)}
          </div>
        </div>
      </main>
    </div>
  );
}
