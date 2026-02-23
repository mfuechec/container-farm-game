/**
 * Mushroom Hobby - Main orchestrator component
 * 
 * Uses Zustand store for state. Only local UI state (tab, menus) lives here.
 * Pattern follows PlantHobby but simpler - no genetics, no PixiJS.
 */

import React, { useState, useCallback } from 'react';
import { useTheme } from '../../theme';
import { useGameStore, selectMushroomSynergyBonus } from '../../store/gameStore';
import { GrowBags } from './components/GrowBags';
import { MushroomShop } from './components/MushroomShop';
import { MushroomHarvest } from './components/MushroomHarvest';
import { SpawnMenu } from './components/SpawnMenu';
import { getActiveSynergies } from '../../engine/synergies';

interface MushroomHobbyProps {
  onBack: () => void;
}

export function MushroomHobby({ onBack }: MushroomHobbyProps) {
  const { theme } = useTheme();
  
  // Store state
  const money = useGameStore(s => s.economy.money);
  const mushroomHobby = useGameStore(s => s.mushroomHobby);
  const kitchen = useGameStore(s => s.kitchen);
  const gameDay = useGameStore(s => s.gameDay);
  const synergyBonus = useGameStore(selectMushroomSynergyBonus);
  
  // Store actions
  const buySpawn = useGameStore(s => s.buySpawn);
  const buyGrowBag = useGameStore(s => s.buyGrowBag);
  const buyMushroomEquipment = useGameStore(s => s.buyMushroomEquipment);
  const inoculateBag = useGameStore(s => s.inoculateBag);
  const harvestMushroom = useGameStore(s => s.harvestMushroom);
  const sellMushroomHarvest = useGameStore(s => s.sellMushroomHarvest);
  const storeMushroomHarvest = useGameStore(s => s.storeMushroomHarvest);
  
  // Local UI state
  const [selectedBag, setSelectedBag] = useState<string | null>(null);
  const [showSpawnMenu, setShowSpawnMenu] = useState(false);
  const [tab, setTab] = useState<'grow' | 'harvest' | 'shop'>('grow');

  const { growBags, mushrooms, spawn, harvest, equipment, environment } = mushroomHobby;
  const kitchenFull = kitchen.storage.length >= kitchen.capacity;
  
  // Get active synergies for UI indicator
  const activeSynergies = getActiveSynergies('mushrooms', gameDay);
  const hasSynergyBoost = synergyBonus > 0;

  // Bag click handler
  const handleBagClick = useCallback((slotIndex: number) => {
    const bag = growBags.find(b => b.slot === slotIndex);
    
    if (!bag) {
      buyGrowBag(slotIndex);
    } else if (!bag.mushroom) {
      setSelectedBag(bag.id);
      setShowSpawnMenu(true);
    } else {
      const mushroom = mushrooms[bag.mushroom];
      if (mushroom?.stage === 'harvestable') {
        harvestMushroom(bag.mushroom);
      }
    }
  }, [growBags, mushrooms, buyGrowBag, harvestMushroom]);

  // Handle inoculation
  const handleInoculate = useCallback((typeId: string, bagId: string) => {
    inoculateBag(typeId, bagId);
    setShowSpawnMenu(false);
    setSelectedBag(null);
  }, [inoculateBag]);

  return (
    <div style={{ background: theme.surface, borderRadius: theme.radiusLg, boxShadow: theme.shadow }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <button onClick={onBack} style={{
          background: 'none',
          border: 'none',
          color: theme.textSecondary,
          cursor: 'pointer',
          fontSize: 14,
        }}>
          ← Back
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, color: theme.accent }}>🍄 Mushroom Farm</span>
          {hasSynergyBoost && (
            <span style={{
              padding: '2px 8px',
              background: theme.accentLight,
              borderRadius: theme.radiusFull,
              fontSize: 10,
              color: theme.accent,
            }}>
              +{Math.round(synergyBonus * 100)}% 🌿
            </span>
          )}
        </div>
        <span style={{ color: theme.textMuted, fontSize: 12 }}>${money.toFixed(0)}</span>
      </div>

      {/* Synergy indicator banner */}
      {hasSynergyBoost && (
        <div style={{
          padding: '8px 16px',
          background: theme.accentLight,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
        }}>
          <span>🌿</span>
          <span style={{ color: theme.accent }}>
            Compost boost active! +{Math.round(synergyBonus * 100)}% growth from plant harvest
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}` }}>
        {(['grow', 'harvest', 'shop'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '10px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? `2px solid ${theme.accent}` : '2px solid transparent',
              color: tab === t ? theme.accent : theme.textSecondary,
              cursor: 'pointer',
              fontWeight: tab === t ? 600 : 400,
              textTransform: 'capitalize',
            }}
          >
            {t} {t === 'harvest' && harvest.length > 0 && `(${harvest.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {tab === 'grow' && (
          <GrowBags
            growBags={growBags}
            mushrooms={mushrooms}
            environment={environment}
            onBagClick={handleBagClick}
            theme={theme}
          />
        )}

        {tab === 'harvest' && (
          <MushroomHarvest
            harvest={harvest}
            kitchenFull={kitchenFull}
            onSell={sellMushroomHarvest}
            onStore={storeMushroomHarvest}
            theme={theme}
          />
        )}

        {tab === 'shop' && (
          <MushroomShop
            money={money}
            spawn={spawn}
            equipment={equipment}
            onBuySpawn={buySpawn}
            onBuyEquipment={buyMushroomEquipment}
            theme={theme}
          />
        )}
      </div>

      {/* Spawn selection modal */}
      {showSpawnMenu && selectedBag && (
        <SpawnMenu
          spawn={spawn}
          bagId={selectedBag}
          onSelect={handleInoculate}
          onClose={() => { setShowSpawnMenu(false); setSelectedBag(null); }}
          theme={theme}
        />
      )}
    </div>
  );
}
