/**
 * Main Game Component
 * 
 * Uses Zustand store for all state management.
 * Components read from store and dispatch actions.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from './theme';
import { useGameStore } from './store/gameStore';
import { useShallow } from 'zustand/react/shallow';
import { audio } from './engine/audio';

// Components
import { ApartmentView } from './apartment/ApartmentView';
import { PlantHobby } from './hobbies/plants/PlantHobby';
import { MushroomHobby } from './hobbies/mushrooms/MushroomHobby';
import { CityMap, HousingPreview, HobbySelectModal, HousingTier } from './housing';
import { HobbySlot } from './apartment/types';
import { calculateGrocerySavings, getActiveKitchenBonuses, getBonusMultiplier } from './kitchen/types';
import { PantryView } from './kitchen/PantryView';
import { getRentForWeek } from './economy/types';
import { getWeeklyRentalCost } from './market/types';
import { ToastContainer, useToast } from './ui/toast';
import { detectKitchenCombos, detectGardenCombos, detectNewCombos, ActiveCombo } from './combos';
// getActiveKitchenBonuses, getBonusMultiplier used for derived values display

// Tick interval
const TICK_INTERVAL = 1000;

export function Game() {
  const { theme, toggleTheme, isDark } = useTheme();
  const [isMuted, setIsMuted] = useState(() => audio.isMuted());

  const toggleMute = () => {
    const newMuted = audio.toggleMute();
    setIsMuted(newMuted);
    if (!newMuted) {
      // Play a click sound when unmuting to confirm audio works
      audio.play('click');
    }
  };

  // Housing state
  const [selectedHousing, setSelectedHousing] = useState<HousingTier | null>(null);
  const [showHobbySelect, setShowHobbySelect] = useState(false);
  const [pendingTier, setPendingTier] = useState<HousingTier | null>(null);
  
  // Store state - use shallow to prevent unnecessary re-renders
  const { view, apartment, kitchen, economy, gameDay, market, pantry, todaysMeal } = useGameStore(
    useShallow(s => ({
      view: s.view,
      apartment: s.apartment,
      kitchen: s.kitchen,
      economy: s.economy,
      gameDay: s.gameDay,
      market: s.market,
      pantry: s.pantry,
      todaysMeal: s.todaysMeal,
    }))
  );
  
  // Store actions (stable references from Zustand)
  const setView = useGameStore(s => s.setView);
  const setSelectedSlot = useGameStore(s => s.setSelectedSlot);
  const startHobby = useGameStore(s => s.startHobby);
  const skipTime = useGameStore(s => s.skipTime);
  const upgradeHousing = useGameStore(s => s.upgradeHousing);
  const downgradeHousing = useGameStore(s => s.downgradeHousing);
  const buyStaple = useGameStore(s => s.buyStaple);
  
  // Derived values - compute from state directly
  const kitchenBonuses = useMemo(() => getActiveKitchenBonuses(kitchen.storage), [kitchen.storage]);
  const growthMultiplier = useMemo(() => getBonusMultiplier(kitchenBonuses, 'growth'), [kitchenBonuses]);
  const grocerySavings = useMemo(() => calculateGrocerySavings(kitchen.storage), [kitchen.storage]);
  
  // Calculate current week and dynamic rent (single source of truth)
  const currentWeek = Math.ceil(gameDay / 7);
  const currentRent = getRentForWeek(currentWeek);
  const marketRent = getWeeklyRentalCost(market.rentalTier);
  const weeklyExpenses = currentRent + Math.max(0, economy.weeklyGroceryBase - grocerySavings) + marketRent;

  // Game tick - handle time passing (runs once on mount)
  useEffect(() => {
    const interval = setInterval(() => {
      // tick() handles everything: time, kitchen decay, plant growth
      useGameStore.getState().tick();
    }, TICK_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);

  // Toast system for combo notifications
  const { showToast } = useToast();
  const prevKitchenCombosRef = React.useRef<ActiveCombo[]>([]);
  const prevGardenCombosRef = React.useRef<ActiveCombo[]>([]);

  // Detect kitchen combos
  const kitchenItemTypes = useMemo(
    () => kitchen.storage.map(item => item.sourceType),
    [kitchen.storage]
  );
  const kitchenCombos = useMemo(
    () => detectKitchenCombos(kitchenItemTypes),
    [kitchenItemTypes]
  );

  // Check for new kitchen combos and show toast
  useEffect(() => {
    const newCombos = detectNewCombos(prevKitchenCombosRef.current, kitchenCombos);
    newCombos.forEach(combo => {
      showToast({
        type: 'combo',
        title: combo.name,
        subtitle: combo.bonusDescription,
        emoji: combo.emoji,
      }, { x: window.innerWidth / 2, y: window.innerHeight / 2 });
      audio.play('click'); // Play a sound for combo discovery
    });
    prevKitchenCombosRef.current = kitchenCombos;
  }, [kitchenCombos, showToast]);

  // Navigation handlers
  const handleSelectHobby = (slot: HobbySlot) => {
    setSelectedSlot(slot.index);
    if (slot.hobby === 'plants') {
      setView('hobby-plants');
    } else if (slot.hobby === 'mushrooms') {
      setView('hobby-mushrooms');
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
          onMove={() => setView('housing')}
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

    case 'hobby-mushrooms':
      content = (
        <MushroomHobby
          onBack={handleBack}
        />
      );
      break;

    case 'kitchen':
      content = (
        <PantryView
          pantry={pantry}
          gameDay={Math.floor(gameDay)}
          todaysMeal={todaysMeal}
          onBuyStaple={buyStaple}
          onBack={handleBack}
          theme={theme}
        />
      );
      break;

    case 'housing':
      content = selectedHousing ? (
        <HousingPreview
          tier={selectedHousing}
          currentTier={apartment.housing}
          currentDeposit={apartment.securityDeposit ?? 0}
          currentHobbies={apartment.hobbySlots.map(s => s.hobby)}
          money={economy.money}
          onMove={() => {
            const isUpgrade = selectedHousing.hobbySlots >= apartment.housing.hobbySlots;
            if (isUpgrade) {
              upgradeHousing(selectedHousing.id);
            } else {
              // For downgrade without hobby conflict, keep all hobbies that fit
              const keepIndices = apartment.hobbySlots
                .filter(s => s.hobby !== null)
                .slice(0, selectedHousing.hobbySlots)
                .map(s => s.index);
              downgradeHousing(selectedHousing.id, keepIndices);
            }
            setSelectedHousing(null);
          }}
          onCancel={() => setSelectedHousing(null)}
          onNeedsHobbySelection={(maxSlots) => {
            setPendingTier(selectedHousing);
            setShowHobbySelect(true);
          }}
        />
      ) : (
        <CityMap
          currentTierId={apartment.housing.id}
          money={economy.money}
          onSelectHousing={(tier) => setSelectedHousing(tier)}
          onBack={handleBack}
        />
      );
      break;
  }

  // Handle hobby select modal for downgrade
  const handleHobbySelectConfirm = (keepIndices: number[]) => {
    if (pendingTier) {
      downgradeHousing(pendingTier.id, keepIndices);
      setShowHobbySelect(false);
      setPendingTier(null);
      setSelectedHousing(null);
    }
  };

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
        padding: '10px 12px',
        background: theme.surface,
        borderBottom: `1px solid ${theme.border}`,
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: 16, 
          fontWeight: 700, 
          color: theme.accent,
          whiteSpace: 'nowrap',
        }}>
          🌱 Side Hustle Sim
        </h1>
        <div style={{ 
          display: 'flex', 
          gap: 6, 
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <button onClick={() => skipTime(1)} style={devBtnStyle(theme)}>+1D</button>
          <button onClick={() => skipTime(7)} style={devBtnStyle(theme)}>+1W</button>
          <button onClick={toggleMute} style={devBtnStyle(theme)} title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button onClick={toggleTheme} style={devBtnStyle(theme)}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding: '16px 12px', maxWidth: 600, margin: '0 auto' }}>
        {content}
      </main>

      {/* Hobby Select Modal for Downgrade */}
      {showHobbySelect && pendingTier && (
        <HobbySelectModal
          hobbies={apartment.hobbySlots
            .filter(s => s.hobby !== null)
            .map(s => ({
              index: s.index,
              type: s.hobby,
              name: s.hobby || '',
              emoji: '',
            }))}
          maxSlots={pendingTier.hobbySlots}
          onConfirm={handleHobbySelectConfirm}
          onCancel={() => {
            setShowHobbySelect(false);
            setPendingTier(null);
          }}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer theme={theme} />
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
    { id: 'mushrooms' as const, emoji: '🍄', name: 'Mushroom Farm', desc: 'Fast-growing gourmet mushrooms' },
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
            onClick={() => onSelect(h.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              background: theme.surface,
              border: `2px solid ${theme.accent}`,
              borderRadius: theme.radiusMd,
              cursor: 'pointer',
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
  weeklyIncome,
  currentRent,
  groceryBase,
  marketRent,
  currentWeek,
  kitchenBonuses,
  onBack,
  theme,
}: {
  kitchen: any;
  grocerySavings: number;
  weeklyExpenses: number;
  weeklyIncome: number;
  currentRent: number;
  groceryBase: number;
  marketRent: number;
  currentWeek: number;
  kitchenBonuses: any[];
  onBack: () => void;
  theme: any;
}) {
  const netWeekly = weeklyIncome - weeklyExpenses;
  
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

      {/* Weekly finances breakdown */}
      <div style={{
        padding: 12,
        background: theme.bgAlt,
        borderRadius: theme.radiusMd,
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8 }}>
          Week {currentWeek}
        </div>
        {/* Income */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: theme.textSecondary, fontSize: 12 }}>💼 Day job</span>
          <span style={{ color: theme.accent, fontSize: 12 }}>+${weeklyIncome}</span>
        </div>
        {/* Expenses */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: theme.textSecondary, fontSize: 12 }}>🏠 Rent</span>
          <span style={{ color: theme.textSecondary, fontSize: 12 }}>-${currentRent}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: theme.textSecondary, fontSize: 12 }}>🛒 Groceries</span>
          <span style={{ color: theme.textSecondary, fontSize: 12 }}>-${groceryBase}</span>
        </div>
        {marketRent > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: theme.textSecondary, fontSize: 12 }}>🏪 Market stall</span>
            <span style={{ color: theme.textSecondary, fontSize: 12 }}>-${marketRent.toFixed(0)}</span>
          </div>
        )}
        {grocerySavings > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: theme.textSecondary, fontSize: 12 }}>🌿 Herb savings</span>
            <span style={{ color: theme.accent, fontSize: 12 }}>+${grocerySavings.toFixed(1)}</span>
          </div>
        )}
        {/* Net */}
        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 8, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: theme.text, fontWeight: 600 }}>Net weekly</span>
          <span style={{ 
            color: netWeekly >= 0 ? theme.accent : theme.danger, 
            fontWeight: 600 
          }}>
            {netWeekly >= 0 ? '+' : ''}${netWeekly.toFixed(0)}/wk
          </span>
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
