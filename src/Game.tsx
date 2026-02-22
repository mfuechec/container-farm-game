/**
 * Main Game Component
 * 
 * Ties together all systems:
 * - Apartment (housing, rooms)
 * - Hobbies (plants, etc.)
 * - Kitchen (shared storage)
 * - Economy (money)
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTheme } from './theme';

// Systems
import { ApartmentState, HobbySlot, INITIAL_APARTMENT } from './apartment/types';
import { ApartmentView } from './apartment/ApartmentView';
import { KitchenState, INITIAL_KITCHEN, FoodItem, calculateGrocerySavings, getActiveKitchenBonuses, getBonusMultiplier, decayKitchenItems } from './kitchen/types';
import { EconomyState, INITIAL_ECONOMY } from './economy/types';

// Hobbies
import { PlantHobby } from './hobbies/plants/PlantHobby';
import { HarvestedPlant, harvestToFoodItem } from './hobbies/plants/types';

// Views
type GameView = 'apartment' | 'kitchen' | 'hobby-plants' | 'hobby-select';

// Time constants
const MS_PER_GAME_DAY = 60 * 60 * 1000; // 1 hour = 1 day
const TICK_INTERVAL = 1000;

export function Game() {
  const { theme, toggleTheme, isDark } = useTheme();
  
  // Core state
  const [view, setView] = useState<GameView>('apartment');
  const [selectedSlot, setSelectedSlot] = useState<number>(0);
  
  // Systems
  const [apartment, setApartment] = useState<ApartmentState>(INITIAL_APARTMENT);
  const [kitchen, setKitchen] = useState<KitchenState>(INITIAL_KITCHEN);
  const [economy, setEconomy] = useState<EconomyState>(INITIAL_ECONOMY);
  
  // Time
  const [gameDay, setGameDay] = useState(1);
  const [lastTick, setLastTick] = useState(Date.now());

  // Derived values
  const kitchenBonuses = useMemo(() => getActiveKitchenBonuses(kitchen.storage), [kitchen.storage]);
  const grocerySavings = useMemo(() => calculateGrocerySavings(kitchen.storage), [kitchen.storage]);
  const growthMultiplier = useMemo(() => getBonusMultiplier(kitchenBonuses, 'growth'), [kitchenBonuses]);
  const yieldMultiplier = useMemo(() => getBonusMultiplier(kitchenBonuses, 'yield'), [kitchenBonuses]);
  const weeklyExpenses = economy.weeklyRent + Math.max(0, economy.weeklyGroceryBase - grocerySavings);

  // Game tick - handle time passing
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTick;
      const daysPassed = elapsed / MS_PER_GAME_DAY;
      
      if (daysPassed < 0.01) return;
      
      // Decay kitchen items
      setKitchen(prev => ({
        ...prev,
        storage: decayKitchenItems(prev.storage, daysPassed),
      }));
      
      // Weekly expenses check
      const prevWeek = Math.floor((gameDay - 1) / 7);
      const newDay = gameDay + daysPassed;
      const newWeek = Math.floor((newDay - 1) / 7);
      
      if (newWeek > prevWeek) {
        setEconomy(prev => ({
          ...prev,
          money: prev.money - weeklyExpenses,
        }));
      }
      
      setGameDay(newDay);
      setLastTick(now);
    }, TICK_INTERVAL);
    
    return () => clearInterval(interval);
  }, [lastTick, gameDay, weeklyExpenses]);

  // Actions
  const addMoney = useCallback((amount: number) => {
    setEconomy(prev => ({ ...prev, money: prev.money + amount }));
  }, []);

  const spendMoney = useCallback((amount: number): boolean => {
    if (economy.money < amount) return false;
    setEconomy(prev => ({ ...prev, money: prev.money - amount }));
    return true;
  }, [economy.money]);

  const storeInKitchen = useCallback((item: FoodItem) => {
    if (kitchen.storage.length >= kitchen.capacity) return false;
    setKitchen(prev => ({
      ...prev,
      storage: [...prev.storage, item],
    }));
    return true;
  }, [kitchen]);

  const startHobby = useCallback((slot: number, hobby: 'plants' | 'mushrooms') => {
    setApartment(prev => ({
      ...prev,
      hobbySlots: prev.hobbySlots.map((s, i) => 
        i === slot ? { ...s, hobby } : s
      ),
    }));
    setView(`hobby-${hobby}` as GameView);
  }, []);

  const skipTime = useCallback((days: number) => {
    setLastTick(prev => prev - (days * MS_PER_GAME_DAY));
  }, []);

  // Navigation
  const handleSelectHobby = useCallback((slot: HobbySlot) => {
    setSelectedSlot(slot.index);
    if (slot.hobby === 'plants') {
      setView('hobby-plants');
    } else if (slot.hobby === null) {
      setView('hobby-select');
    }
  }, []);

  const handleBack = useCallback(() => {
    setView('apartment');
  }, []);

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
          onSelect={(hobby) => startHobby(selectedSlot, hobby)}
          onBack={handleBack}
          theme={theme}
        />
      );
      break;

    case 'hobby-plants':
      content = (
        <PlantHobby
          money={economy.money}
          onSpendMoney={spendMoney}
          onAddMoney={addMoney}
          onStoreInKitchen={(harvest: HarvestedPlant) => {
            const food = harvestToFoodItem(harvest);
            if (food) return storeInKitchen(food);
            return false;
          }}
          kitchenFull={kitchen.storage.length >= kitchen.capacity}
          growthMultiplier={growthMultiplier}
          yieldMultiplier={yieldMultiplier}
          gameDay={gameDay}
          lastTick={lastTick}
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
  kitchen: KitchenState;
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
          {kitchen.storage.map(item => (
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
