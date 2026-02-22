/**
 * Grow Station - Visual representation of table, lights, and pots
 * 
 * This is the main interactive area where plants grow.
 */

import React, { useState } from 'react';
import { useTheme } from '../../theme';
import { PlantInstance, PLANT_TYPES, getPlantType, GrowthStage } from '../plants/types';
import { PotInstance, PotType, POT_TYPES, getPotType, slotHasLight } from '../equipment/types';
import { useGame } from '../useGame';

interface GrowStationProps {
  game: ReturnType<typeof useGame>;
}

export function GrowStation({ game }: GrowStationProps) {
  const { theme } = useTheme();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showPlantMenu, setShowPlantMenu] = useState(false);

  const { equipment, plants, seeds } = game;
  const table = equipment.table;
  const light = equipment.light;

  // Create slot array based on table capacity
  const slots = Array.from({ length: table.potSlots }, (_, i) => {
    const pot = equipment.pots.find(p => p.slot === i);
    const plant = pot?.plant ? plants.get(pot.plant) ?? null : null;
    const hasLight = slotHasLight(i, light.coverage);
    return { index: i, pot, plant, hasLight };
  });

  const handleSlotClick = (slotIndex: number) => {
    const slot = slots[slotIndex];
    
    if (!slot.pot) {
      // No pot - buy a basic pot
      game.buyPot('basic_pot', slotIndex);
    } else if (!slot.plant) {
      // Has pot, no plant - show plant menu
      setSelectedSlot(slotIndex);
      setShowPlantMenu(true);
    } else if (slot.plant.stage === 'harvestable') {
      // Ready to harvest
      game.harvestPlant(slot.plant.id);
    }
  };

  const handlePlantSeed = (plantTypeId: string) => {
    if (selectedSlot === null) return;
    const pot = equipment.pots.find(p => p.slot === selectedSlot);
    if (pot) {
      game.plantSeed(plantTypeId, pot.id);
    }
    setShowPlantMenu(false);
    setSelectedSlot(null);
  };

  return (
    <div style={{
      background: theme.surface,
      borderRadius: theme.radiusLg,
      padding: 24,
      boxShadow: theme.shadow,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <div>
          <h3 style={{ margin: 0, color: theme.text, fontSize: 16, fontWeight: 600 }}>
            {table.emoji} {table.name}
          </h3>
          <span style={{ fontSize: 12, color: theme.textSecondary }}>
            {equipment.pots.length}/{table.potSlots} pots · {light.emoji} {light.name} (covers {light.coverage})
          </span>
        </div>
      </div>

      {/* Light coverage indicator */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 12,
      }}>
        {slots.map((slot, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: slot.hasLight 
                ? `linear-gradient(180deg, ${theme.money}88, ${theme.money}22)`
                : theme.border,
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>

      {/* Pot slots */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(table.potSlots, 4)}, 1fr)`,
        gap: 12,
      }}>
        {slots.map((slot) => (
          <PotSlot
            key={slot.index}
            slot={slot}
            selected={selectedSlot === slot.index}
            onClick={() => handleSlotClick(slot.index)}
            theme={theme}
          />
        ))}
      </div>

      {/* Plant selection menu */}
      {showPlantMenu && (
        <PlantMenu
          seeds={seeds}
          onSelect={handlePlantSeed}
          onClose={() => { setShowPlantMenu(false); setSelectedSlot(null); }}
          theme={theme}
        />
      )}
    </div>
  );
}

// Individual pot slot
function PotSlot({ 
  slot, 
  selected, 
  onClick, 
  theme 
}: { 
  slot: { index: number; pot: PotInstance | undefined; plant: PlantInstance | null; hasLight: boolean };
  selected: boolean;
  onClick: () => void;
  theme: any;
}) {
  const potType = slot.pot ? getPotType(slot.pot.typeId) : null;
  const plantType = slot.plant ? getPlantType(slot.plant.typeId) : null;

  // Determine what to show
  let content: React.ReactNode;
  let borderStyle: string;
  let bgStyle: string;

  if (!slot.pot) {
    // Empty slot - can add pot
    content = (
      <div style={{ textAlign: 'center', color: theme.textMuted }}>
        <div style={{ fontSize: 24, marginBottom: 4 }}>➕</div>
        <div style={{ fontSize: 10 }}>Add pot</div>
      </div>
    );
    borderStyle = `2px dashed ${theme.border}`;
    bgStyle = 'transparent';
  } else if (!slot.plant) {
    // Has pot, no plant
    content = (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>{potType?.emoji || '🪴'}</div>
        <div style={{ fontSize: 10, color: theme.textSecondary }}>Empty pot</div>
        <div style={{ fontSize: 10, color: theme.accent }}>Click to plant</div>
      </div>
    );
    borderStyle = `2px solid ${theme.border}`;
    bgStyle = theme.bgAlt;
  } else {
    // Has plant
    const progress = Math.round(slot.plant.growthProgress * 100);
    const isReady = slot.plant.stage === 'harvestable';
    
    content = (
      <div style={{ textAlign: 'center' }}>
        <PlantVisual plant={slot.plant} plantType={plantType!} theme={theme} />
        <div style={{ fontSize: 10, color: theme.textSecondary, marginTop: 4 }}>
          {plantType?.name}
        </div>
        {isReady ? (
          <div style={{ 
            fontSize: 10, 
            color: theme.accent,
            fontWeight: 600,
            marginTop: 2,
          }}>
            ✓ Harvest!
          </div>
        ) : (
          <div style={{ 
            fontSize: 10, 
            color: theme.textMuted,
            marginTop: 2,
          }}>
            {progress}%
          </div>
        )}
      </div>
    );
    borderStyle = isReady ? `2px solid ${theme.accent}` : `2px solid ${theme.border}`;
    bgStyle = isReady ? theme.accentLight : theme.bgAlt;
  }

  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio: '1',
        border: borderStyle,
        borderRadius: theme.radiusMd,
        background: bgStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        boxShadow: selected ? theme.shadowGlow : 'none',
      }}
    >
      {/* Light indicator */}
      {slot.hasLight && (
        <div style={{
          position: 'absolute',
          top: 4,
          right: 4,
          fontSize: 10,
        }}>☀️</div>
      )}
      {content}
    </div>
  );
}

// Plant visual based on growth stage
function PlantVisual({ 
  plant, 
  plantType, 
  theme 
}: { 
  plant: PlantInstance; 
  plantType: { emoji: string; color: string };
  theme: any;
}) {
  const sizes: Record<GrowthStage, number> = {
    seed: 16,
    sprout: 24,
    growing: 32,
    mature: 40,
    harvestable: 44,
  };

  const size = sizes[plant.stage];

  return (
    <div style={{
      fontSize: size,
      transition: 'font-size 0.5s ease-out',
      filter: plant.stage === 'harvestable' ? 'drop-shadow(0 0 8px rgba(90, 154, 107, 0.5))' : 'none',
    }}>
      {plant.stage === 'seed' ? '🫘' : plantType.emoji}
    </div>
  );
}

// Plant selection menu
function PlantMenu({ 
  seeds, 
  onSelect, 
  onClose, 
  theme 
}: { 
  seeds: Map<string, number>;
  onSelect: (id: string) => void;
  onClose: () => void;
  theme: any;
}) {
  const availableSeeds = PLANT_TYPES.filter(p => (seeds.get(p.id) || 0) > 0);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: `${theme.text}66`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: theme.surface,
        borderRadius: theme.radiusLg,
        padding: 20,
        minWidth: 280,
        boxShadow: theme.shadowLg,
      }} onClick={e => e.stopPropagation()}>
        <h4 style={{ margin: '0 0 16px', color: theme.text }}>Plant a seed</h4>
        
        {availableSeeds.length === 0 ? (
          <div style={{ color: theme.textMuted, fontSize: 14 }}>
            No seeds available. Buy some from the shop!
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {availableSeeds.map(plant => (
              <div
                key={plant.id}
                onClick={() => onSelect(plant.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: theme.bgAlt,
                  borderRadius: theme.radiusMd,
                  cursor: 'pointer',
                  border: `1px solid ${theme.border}`,
                }}
              >
                <span style={{ fontSize: 24 }}>{plant.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: theme.text }}>{plant.name}</div>
                  <div style={{ fontSize: 11, color: theme.textSecondary }}>
                    {plant.daysToMature} days · ${plant.sellPrice}/ea
                  </div>
                </div>
                <div style={{ 
                  background: theme.accentLight, 
                  color: theme.accent,
                  padding: '4px 8px',
                  borderRadius: theme.radiusSm,
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  ×{seeds.get(plant.id)}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            width: '100%',
            padding: 10,
            background: 'transparent',
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radiusMd,
            color: theme.textSecondary,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
