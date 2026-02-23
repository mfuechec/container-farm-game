/**
 * Plant Hobby - The grow station view
 * 
 * Uses Zustand store for state. Only local UI state (tab, menus) lives here.
 * Tab content extracted to:
 *   - PlantShop (shop tab)
 *   - HarvestManager (harvest tab)
 *   - PlantMenu (seed selection modal)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '../../theme';
import { useGameStore, selectYieldMultiplier } from '../../store/gameStore';
import { GrowCanvas } from './GrowCanvas';
import { isMarketDay } from '../../market/types';
import { PlantShop, HarvestManager, PlantMenu } from './components';
import { audio } from '../../engine/audio';

interface PlantHobbyProps {
  onBack: () => void;
}

export function PlantHobby({ onBack }: PlantHobbyProps) {
  const { theme } = useTheme();
  
  // Store state
  const money = useGameStore(s => s.economy.money);
  const plantHobby = useGameStore(s => s.plantHobby);
  const kitchen = useGameStore(s => s.kitchen);
  const market = useGameStore(s => s.market);
  const gameDay = useGameStore(s => s.gameDay);
  const yieldMultiplier = useGameStore(selectYieldMultiplier);
  
  // Store actions
  const buySeeds = useGameStore(s => s.buySeeds);
  const buyPot = useGameStore(s => s.buyPot);
  const upgradeTable = useGameStore(s => s.upgradeTable);
  const upgradeLight = useGameStore(s => s.upgradeLight);
  const plantSeed = useGameStore(s => s.plantSeed);
  const harvestPlant = useGameStore(s => s.harvestPlant);
  const storeHarvest = useGameStore(s => s.storeHarvest);
  const sellWholesale = useGameStore(s => s.sellWholesale);
  const sellAtMarket = useGameStore(s => s.sellAtMarket);
  const setMarketRental = useGameStore(s => s.setMarketRental);
  
  // Market calculations
  const currentDay = Math.floor(gameDay);
  const marketOpen = isMarketDay(currentDay, market.rentalTier, market.lastMarketDay);
  
  // Local UI state only
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showPlantMenu, setShowPlantMenu] = useState(false);
  const [tab, setTab] = useState<'grow' | 'harvest' | 'shop'>('grow');
  
  // Responsive canvas sizing
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 200 });
  
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;
    
    const updateSize = () => {
      // Account for container padding (8px on each side = 16px total)
      const containerPadding = 16;
      const availableWidth = container.clientWidth - containerPadding;
      // Maintain 2:1 aspect ratio, with min/max bounds
      const width = Math.max(280, Math.min(availableWidth, 600));
      const height = Math.round(width * 0.5); // 2:1 aspect ratio
      setCanvasSize({ width, height });
    };
    
    // Initial size
    updateSize();
    
    // Watch for resize
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    
    return () => resizeObserver.disconnect();
  }, []);

  const { table, pots, plants, seeds, harvest } = plantHobby;
  const kitchenFull = kitchen.storage.length >= kitchen.capacity;

  // Slot click handler
  const handleSlotClick = useCallback((slotIndex: number) => {
    const pot = pots.find(p => p.slot === slotIndex);
    
    if (!pot) {
      buyPot(slotIndex);
    } else if (!pot.plant) {
      setSelectedSlot(slotIndex);
      setShowPlantMenu(true);
    } else {
      const plant = plants[pot.plant];
      if (plant?.stage === 'harvestable') {
        harvestPlant(pot.plant, yieldMultiplier);
      }
    }
  }, [pots, plants, buyPot, harvestPlant, yieldMultiplier]);

  // Handle planting
  const handlePlantSeed = useCallback((typeId: string, potId: string) => {
    plantSeed(typeId, potId);
    setShowPlantMenu(false);
    setSelectedSlot(null);
  }, [plantSeed]);

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
        <span style={{ fontWeight: 600, color: theme.accent }}>🌱 Container Farm</span>
        <span style={{ color: theme.textMuted, fontSize: 12 }}>${money.toFixed(0)}</span>
      </div>

      {/* Tabs - 44px min height for touch targets */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}` }}>
        {(['grow', 'harvest', 'shop'] as const).map(t => (
          <button
            key={t}
            onClick={() => { audio.play('click'); setTab(t); }}
            style={{
              flex: 1,
              padding: '12px 8px',
              minHeight: 44,
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? `2px solid ${theme.accent}` : '2px solid transparent',
              color: tab === t ? theme.accent : theme.textSecondary,
              cursor: 'pointer',
              fontWeight: tab === t ? 600 : 400,
              textTransform: 'capitalize',
              fontSize: 14,
            }}
          >
            {t} {t === 'harvest' && harvest.length > 0 && `(${harvest.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 12 }}>
        {tab === 'grow' && (
          <div 
            ref={canvasContainerRef}
            style={{ 
              background: theme.bgAlt, 
              borderRadius: theme.radiusMd,
              padding: 8,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            <GrowCanvas
              width={canvasSize.width}
              height={canvasSize.height}
              onSlotClick={handleSlotClick}
            />
          </div>
        )}

        {tab === 'harvest' && (
          <HarvestManager
            harvest={harvest}
            marketOpen={marketOpen}
            marketRentalTier={market.rentalTier}
            lastMarketDay={market.lastMarketDay}
            kitchenFull={kitchenFull}
            onStoreHarvest={storeHarvest}
            onSellWholesale={sellWholesale}
            onSellAtMarket={sellAtMarket}
            theme={theme}
          />
        )}

        {tab === 'shop' && (
          <PlantShop
            money={money}
            seeds={seeds}
            table={table}
            light={plantHobby.light}
            marketRentalTier={market.rentalTier}
            onBuySeeds={buySeeds}
            onUpgradeTable={upgradeTable}
            onUpgradeLight={upgradeLight}
            onSetMarketRental={setMarketRental}
            theme={theme}
          />
        )}
      </div>

      {/* Plant selection modal */}
      {showPlantMenu && (
        <PlantMenu
          seeds={seeds}
          pots={pots}
          selectedSlot={selectedSlot}
          onSelect={handlePlantSeed}
          onClose={() => { setShowPlantMenu(false); setSelectedSlot(null); }}
          theme={theme}
        />
      )}
    </div>
  );
}
