/**
 * GrowBags - Visual grow area for mushrooms
 * 
 * Shows grow bags in slots with mushroom progress.
 * Simple React component - no PixiJS needed.
 */

import React from 'react';
import {
  GrowBagInstance,
  MushroomInstance,
  MushroomStage,
  getMushroomType,
  getGrowBagType,
} from '../types';
import { MushroomEnvironment } from '../../../engine/mushroomEngine';

interface GrowBagsProps {
  growBags: GrowBagInstance[];
  mushrooms: Record<string, MushroomInstance>;
  environment: MushroomEnvironment;
  onBagClick: (slotIndex: number) => void;
  theme: any;
}

// Max slots for grow area (can expand later)
const MAX_SLOTS = 4;

export function GrowBags({ growBags, mushrooms, environment, onBagClick, theme }: GrowBagsProps) {
  return (
    <div>
      {/* Environment status */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 16,
        padding: 12,
        background: theme.bgAlt,
        borderRadius: theme.radiusMd,
        fontSize: 12,
      }}>
        <div>
          <span style={{ color: theme.textMuted }}>💧 Humidity: </span>
          <span style={{ 
            color: environment.humidity >= 60 && environment.humidity <= 90 
              ? theme.accent 
              : theme.danger 
          }}>
            {environment.humidity}%
          </span>
        </div>
        <div>
          <span style={{ color: theme.textMuted }}>🌡️ Temp: </span>
          <span style={{ 
            color: environment.temperature >= 55 && environment.temperature <= 75 
              ? theme.accent 
              : theme.danger 
          }}>
            {environment.temperature}°F
          </span>
        </div>
        <div>
          <span style={{ color: theme.textMuted }}>💨 Fresh Air: </span>
          <span style={{ color: environment.freshAir ? theme.accent : theme.danger }}>
            {environment.freshAir ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {/* Grow area grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
      }}>
        {Array.from({ length: MAX_SLOTS }).map((_, slotIndex) => {
          const bag = growBags.find(b => b.slot === slotIndex);
          const mushroom = bag?.mushroom ? mushrooms[bag.mushroom] : null;
          
          return (
            <BagSlot
              key={slotIndex}
              slotIndex={slotIndex}
              bag={bag || null}
              mushroom={mushroom}
              onClick={() => onBagClick(slotIndex)}
              theme={theme}
            />
          );
        })}
      </div>
    </div>
  );
}

interface BagSlotProps {
  slotIndex: number;
  bag: GrowBagInstance | null;
  mushroom: MushroomInstance | null;
  onClick: () => void;
  theme: any;
}

function BagSlot({ slotIndex, bag, mushroom, onClick, theme }: BagSlotProps) {
  const bagType = bag ? getGrowBagType(bag.typeId) : null;
  const mushroomType = mushroom ? getMushroomType(mushroom.typeId) : null;
  
  // Determine slot state
  let content: React.ReactNode;
  let borderColor = theme.border;
  let cursor = 'pointer';
  
  if (!bag) {
    // Empty slot - can buy bag
    content = (
      <>
        <div style={{ fontSize: 24, opacity: 0.3 }}>🛍️</div>
        <div style={{ fontSize: 11, color: theme.textMuted }}>Buy Grow Bag ($5)</div>
      </>
    );
  } else if (!mushroom) {
    // Has bag but no mushroom
    content = (
      <>
        <div style={{ fontSize: 24 }}>{bagType?.emoji || '🛍️'}</div>
        <div style={{ fontSize: 11, color: theme.textSecondary }}>Click to inoculate</div>
      </>
    );
    borderColor = theme.accent;
  } else {
    // Growing mushroom
    const stageEmoji = getStageEmoji(mushroom.stage);
    const progressPercent = Math.round(mushroom.growthProgress * 100);
    const isHarvestable = mushroom.stage === 'harvestable';
    
    content = (
      <>
        <div style={{ fontSize: 28 }}>
          {isHarvestable ? mushroomType?.emoji || '🍄' : stageEmoji}
        </div>
        <div style={{ fontSize: 11, color: theme.text, fontWeight: 500 }}>
          {mushroomType?.name || 'Mushroom'}
        </div>
        <div style={{ 
          fontSize: 10, 
          color: isHarvestable ? theme.accent : theme.textMuted 
        }}>
          {isHarvestable ? '✨ Ready to harvest!' : formatStage(mushroom.stage)}
        </div>
        
        {/* Progress bar */}
        {!isHarvestable && (
          <div style={{
            width: '80%',
            height: 4,
            background: theme.border,
            borderRadius: 2,
            marginTop: 8,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: theme.accent,
              transition: 'width 0.3s ease',
            }} />
          </div>
        )}
        
        {/* Synergy indicator */}
        {mushroom.synergyBoost > 0 && (
          <div style={{
            position: 'absolute',
            top: 4,
            right: 4,
            fontSize: 10,
            padding: '2px 4px',
            background: theme.accentLight,
            borderRadius: theme.radiusSm,
            color: theme.accent,
          }}>
            +{Math.round(mushroom.synergyBoost * 100)}%
          </div>
        )}
      </>
    );
    
    borderColor = isHarvestable ? theme.accent : theme.border;
  }
  
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: 16,
        minHeight: 100,
        background: theme.surface,
        border: `2px dashed ${borderColor}`,
        borderRadius: theme.radiusMd,
        cursor,
        transition: 'all 0.2s ease',
      }}
    >
      {content}
    </div>
  );
}

function getStageEmoji(stage: MushroomStage): string {
  switch (stage) {
    case 'inoculation': return '🧫';     // Just started
    case 'colonization': return '🕸️';   // Mycelium spreading
    case 'pinning': return '📍';         // Small pins
    case 'fruiting': return '🌱';        // Growing
    case 'harvestable': return '🍄';
    default: return '❓';
  }
}

function formatStage(stage: MushroomStage): string {
  switch (stage) {
    case 'inoculation': return 'Inoculating...';
    case 'colonization': return 'Colonizing substrate';
    case 'pinning': return 'Pins forming';
    case 'fruiting': return 'Fruiting!';
    case 'harvestable': return 'Ready!';
    default: return stage;
  }
}
