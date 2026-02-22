/**
 * Main Game Component
 * 
 * Uses Zustand store for all state management.
 * Components read from store and dispatch actions.
 */

import React, { useEffect, useMemo } from 'react';
import { useTheme } from './theme';
import { useGameStore, selectKitchenBonuses, selectGrowthMultiplier, selectYieldMultiplier } from './store/gameStore';

// Components
import { ApartmentView } from './apartment/ApartmentView';
import { PlantHobby } from './hobbies/plants/PlantHobby';
import { HobbySlot } from './apartment/types';
import { calculateGrocerySavings } from './kitchen/types';

// Tick interval
const TICK_INTERVAL = 1000;

export function Game() {
  const { theme, toggleTheme, isDark } = useTheme();
  
  // Store state
  const view = useGameStore(s => s.view);
  const apartment = useGameStore(s => s.apartment);
  const kitchen = useGameStore(s => s.kitchen);
  const economy = useGameStore(s => s.economy);
  const gameDay = useGameStore(s => s.gameDay);
  
  // Store actions
  const setView = useGameStore(s => s.setView);
  const setSelectedSlot = useGameStore(s => s.setSelectedSlot);
  const startHobby = useGameStore(s => s.startHobby);
  const skipTime = useGameStore(s => s.skipTime);
  const tick = useGameStore(s => s.tick);
  const growPlants = useGameStore(s => s.growPlants);
  
  // Derived values
  const kitchenBonuses = useGameStore(selectKitchenBonuses);
  const growthMultiplier = useGameStore(selectGrowthMultiplier);
  const grocerySavings = useMemo(() => calculateGrocerySavings(kitchen.storage), [kitchen.storage]);
  const weeklyExpenses = economy.weeklyRent + Math.max(0, economy.weeklyGroceryBase - grocerySavings);

  // Game tick - handle time passing
  useEffect(() => {
    const interval = setInterval(() => {
      tick();
      growPlants(growthMultiplier);
    }, TICK_INTERVAL);
    
    return () => clearInterval(interval);
  }, [tick, growPlants, growthMultiplier]);

  // Navigation handlers
  const handleSelectHobby = (slot: HobbySlot) => {
    setSelectedSlot(slot.index);
    if (slot.hobby === 'plants') {
      setView('hobby-plants');
    } else if (slot.hobby === null) {
      setView('hobby-select');
    }
  };

  const handleBack = () => setView('apartment');

  // Render based on current view
  let content: React.ReactNode;

  switch (view) {
    case 'apartment':
      content = (
        <ApartmentView
          apartment={apartment}
          kitchen={kitchen}
          onSelectHobby={handleSelectHobby}
          onSelectKitchen={() => setView('kitchen')}
          money={economy.money}
          gameDay={gameDay}
        />
      );
      break;

    case 'hobby-select':
      content = (
        <HobbySelector
          onSelect={(hobby) => startHobby(0, hobby)}
          onBack={handleBack}
          theme={theme}
        />
      );
      break;

    case 'hobby-plants':
      content = (
        <PlantHobby
          onBack={handleBack}
        />
      );
      break;

    case 'kitchen':
      content = (
        <KitchenView
          kitchen={kitchen}
          grocerySavings={grocerySavings}
          weeklyExpenses={weeklyExpenses}
          kitchenBonuses={kitchenBonuses}
          onBack={handleBack}
          theme={theme}
        />
      );
      break;
  }

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
        padding: '12px 20px',
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.accent }}>
          🌱 Side Hustle Simulator
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => skipTime(1)} style={devBtnStyle(theme)}>+1 Day</button>
          <button onClick={() => skipTime(7)} style={devBtnStyle(theme)}>+1 Week</button>
          <button onClick={toggleTheme} style={devBtnStyle(theme)}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
        {content}
      </main>
    </div>
  );
}

function devBtnStyle(theme: any): React.CSSProperties {
  return {
    padding: '6px 10px',
    background: theme.bgAlt,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusSm,
    color: theme.textSecondary,
    cursor: 'pointer',
    fontSize: 11,
  };
}

// Hobby selection screen
function HobbySelector({ 
  onSelect, 
  onBack, 
  theme 
}: { 
  onSelect: (hobby: 'plants' | 'mushrooms') => void;
  onBack: () => void;
  theme: any;
}) {
  const hobbies = [
    { id: 'plants' as const, emoji: '🌱', name: 'Container Farm', desc: 'Grow herbs and vegetables' },
    { id: 'mushrooms' as const, emoji: '🍄', name: 'Mushroom Farm', desc: 'Coming soon...', disabled: true },
  ];

  return (
    <div style={{
      background: theme.surface,
      borderRadius: theme.radiusLg,
      padding: 24,
      boxShadow: theme.shadow,
    }}>
      <button onClick={onBack} style={{
        background: 'none',
        border: 'none',
        color: theme.textSecondary,
        cursor: 'pointer',
        marginBottom: 16,
        fontSize: 14,
      }}>
        ← Back
      </button>
      
      <h2 style={{ margin: '0 0 8px', color: theme.text }}>Start a Hobby</h2>
      <p style={{ margin: '0 0 20px', color: theme.textSecondary, fontSize: 14 }}>
        Choose a side hustle to begin
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        {hobbies.map(h => (
          <div
            key={h.id}
            onClick={() => !h.disabled && onSelect(h.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              background: h.disabled ? theme.bgAlt : theme.surface,
              border: `2px solid ${h.disabled ? theme.border : theme.accent}`,
              borderRadius: theme.radiusMd,
              cursor: h.disabled ? 'not-allowed' : 'pointer',
              opacity: h.disabled ? 0.5 : 1,
            }}
          >
            <span style={{ fontSize: 32 }}>{h.emoji}</span>
            <div>
              <div style={{ fontWeight: 600, color: theme.text }}>{h.name}</div>
              <div style={{ fontSize: 12, color: theme.textSecondary }}>{h.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Kitchen view
function KitchenView({
  kitchen,
  grocerySavings,
  weeklyExpenses,
  kitchenBonuses,
  onBack,
  theme,
}: {
  kitchen: any;
  grocerySavings: number;
  weeklyExpenses: number;
  kitchenBonuses: any[];
  onBack: () => void;
  theme: any;
}) {
  return (
    <div style={{
      background: theme.surface,
      borderRadius: theme.radiusLg,
      padding: 24,
      boxShadow: theme.shadow,
    }}>
      <button onClick={onBack} style={{
        background: 'none',
        border: 'none',
        color: theme.textSecondary,
        cursor: 'pointer',
        marginBottom: 16,
        fontSize: 14,
      }}>
        ← Back
      </button>

      <h2 style={{ margin: '0 0 16px', color: theme.text }}>
        🍳 Kitchen ({kitchen.storage.length}/{kitchen.capacity})
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
      {kitchenBonuses.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>
            Active Bonuses
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {kitchenBonuses.map((b, i) => (
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
      {kitchen.storage.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: theme.textMuted }}>
          Store harvested items here for bonuses
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {kitchen.storage.map((item: any) => (
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
                <div style={{ fontSize: 11, color: theme.textMuted }}>
                  {Math.round(item.freshness * 100)}% fresh
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
