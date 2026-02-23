/**
 * GrowCanvas Stories
 * 
 * Visual tests for the PixiJS grow area renderer.
 * Each story sets up specific game state to test animations and rendering.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { GrowCanvas } from '../hobbies/plants/GrowCanvas';
import { useGameStore } from '../store/gameStore';
import { TABLE_TYPES, LIGHT_TYPES } from '../hobbies/plants/equipment';

// Decorator to reset and configure store state
function withStoreState(
  config: {
    tableSlots?: number;
    lightCoverage?: number;
    pots?: Array<{ slot: number; plantId?: string; typeId?: string; stage?: string; progress?: number }>;
  }
) {
  return function Decorator(Story: React.ComponentType) {
    const [ready, setReady] = useState(false);
    
    useEffect(() => {
      const store = useGameStore.getState();
      
      // Find table with desired slots
      const table = TABLE_TYPES.find(t => t.potSlots >= (config.tableSlots || 4)) || TABLE_TYPES[0];
      
      // Find light with desired coverage
      const light = LIGHT_TYPES.find(l => l.coverage >= (config.lightCoverage || 0)) || LIGHT_TYPES[0];
      
      // Build pots and plants from config
      const pots: typeof store.plantHobby.pots = [];
      const plants: typeof store.plantHobby.plants = {};
      const lightCoverage = config.lightCoverage ?? 0;
      
      for (const potConfig of (config.pots || [])) {
        const potId = `story-pot-${potConfig.slot}`;
        const plantId = potConfig.plantId || (potConfig.stage ? `story-plant-${potConfig.slot}` : null);
        
        pots.push({
          id: potId,
          slot: potConfig.slot,
          typeId: potConfig.typeId || 'basic',
          plant: plantId,
        });
        
        if (plantId && potConfig.stage) {
          plants[plantId] = {
            id: plantId,
            typeId: 'basil',
            potSlot: potConfig.slot,
            plantedAt: Date.now() - 1000000,
            growthProgress: potConfig.progress ?? (potConfig.stage === 'harvestable' ? 1 : 0.5),
            stage: potConfig.stage as 'seed' | 'sprout' | 'growing' | 'harvestable',
            hasLight: potConfig.slot < lightCoverage,
          };
        }
      }
      
      // Update store
      useGameStore.setState({
        plantHobby: {
          ...store.plantHobby,
          table: { ...table, potSlots: config.tableSlots || table.potSlots },
          light: { ...light, coverage: config.lightCoverage ?? light.coverage },
          pots,
          plants,
        },
      });
      
      setReady(true);
      
      return () => {
        // Reset to defaults on unmount
        useGameStore.setState({
          plantHobby: {
            table: TABLE_TYPES[0],
            light: LIGHT_TYPES[0],
            pots: [],
            plants: {},
            seeds: { basil: 3 },
            harvest: [],
          },
        });
      };
    }, []);
    
    if (!ready) return <div>Loading...</div>;
    return <Story />;
  };
}

// Wrapper component with controls
function GrowCanvasWrapper({ 
  showControls = true,
  onHarvest,
}: { 
  showControls?: boolean;
  onHarvest?: () => void;
}) {
  const [clickedSlot, setClickedSlot] = useState<number | null>(null);
  const plantHobby = useGameStore(s => s.plantHobby);
  const harvestPlant = useGameStore(s => s.harvestPlant);
  
  const handleSlotClick = (slot: number) => {
    setClickedSlot(slot);
    
    // Auto-harvest if there's a harvestable plant
    const pot = plantHobby.pots.find(p => p.slot === slot);
    if (pot?.plant) {
      const plant = plantHobby.plants[pot.plant];
      if (plant?.stage === 'harvestable') {
        harvestPlant(plant.id, 1);
        onHarvest?.();
      }
    }
  };
  
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ 
        background: '#f5f5f5', 
        borderRadius: 8, 
        padding: 16,
        display: 'inline-block',
      }}>
        <GrowCanvas 
          width={320} 
          height={200} 
          onSlotClick={handleSlotClick}
        />
      </div>
      
      {showControls && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
          {clickedSlot !== null && (
            <div>Last clicked: Slot {clickedSlot}</div>
          )}
          <div style={{ marginTop: 8 }}>
            <strong>Table:</strong> {plantHobby.table.potSlots} slots | 
            <strong> Light:</strong> {plantHobby.light.coverage} coverage | 
            <strong> Plants:</strong> {Object.keys(plantHobby.plants).length}
          </div>
        </div>
      )}
    </div>
  );
}

const meta: Meta = {
  title: 'Canvas/GrowCanvas',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

/**
 * Empty table with no pots - shows the table and light fixture.
 * Click slots to see interaction areas.
 */
export const EmptyTable: StoryObj = {
  decorators: [withStoreState({ 
    tableSlots: 4, 
    lightCoverage: 2,
    pots: [],
  })],
  render: () => <GrowCanvasWrapper />,
};

/**
 * Pots with seedlings - watch the subtle leaf sway animation.
 * The sway should be a gentle 3px oscillation.
 */
export const Seedlings: StoryObj = {
  decorators: [withStoreState({
    tableSlots: 4,
    lightCoverage: 3,
    pots: [
      { slot: 0, stage: 'seed', progress: 0.1 },
      { slot: 1, stage: 'sprout', progress: 0.25 },
      { slot: 2, stage: 'sprout', progress: 0.3 },
    ],
  })],
  render: () => (
    <div>
      <GrowCanvasWrapper />
      <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
        👀 Watch the leaves sway gently left and right
      </p>
    </div>
  ),
};

/**
 * Mature plants ready for harvest - shows the harvestable state.
 * Plants should sway and have the harvest-ready indicator.
 */
export const MaturePlants: StoryObj = {
  decorators: [withStoreState({
    tableSlots: 4,
    lightCoverage: 4,
    pots: [
      { slot: 0, stage: 'harvestable', progress: 1 },
      { slot: 1, stage: 'growing', progress: 0.7 },
      { slot: 2, stage: 'harvestable', progress: 1 },
      { slot: 3, stage: 'growing', progress: 0.5 },
    ],
  })],
  render: () => (
    <div>
      <GrowCanvasWrapper />
      <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
        ✅ Click harvestable plants (100%) to trigger harvest particles
      </p>
    </div>
  ),
};

/**
 * Harvest action demo - click a ready plant to see particles burst.
 */
export const HarvestParticles: StoryObj = {
  decorators: [withStoreState({
    tableSlots: 3,
    lightCoverage: 3,
    pots: [
      { slot: 0, stage: 'harvestable', progress: 1 },
      { slot: 1, stage: 'harvestable', progress: 1 },
      { slot: 2, stage: 'harvestable', progress: 1 },
    ],
  })],
  render: () => {
    const [harvested, setHarvested] = useState(0);
    return (
      <div>
        <GrowCanvasWrapper onHarvest={() => setHarvested(h => h + 1)} />
        <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          🎉 Click any plant to harvest and see sparkle particles! (Harvested: {harvested})
        </p>
      </div>
    );
  },
};

/**
 * Light ON - shows the grow light glow with visible flicker effect.
 * The glow should pulse between 50-100% alpha.
 */
export const LightOn: StoryObj = {
  decorators: [withStoreState({
    tableSlots: 4,
    lightCoverage: 4,  // Full coverage = bright light
    pots: [
      { slot: 0, stage: 'growing', progress: 0.5 },
      { slot: 1, stage: 'growing', progress: 0.6 },
    ],
  })],
  render: () => (
    <div>
      <GrowCanvasWrapper />
      <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
        💡 Watch the yellow glow flicker (50-100% alpha oscillation)
      </p>
    </div>
  ),
};

/**
 * Light OFF - minimal light coverage shows no glow.
 */
export const LightOff: StoryObj = {
  decorators: [withStoreState({
    tableSlots: 4,
    lightCoverage: 0,  // No coverage = no glow
    pots: [
      { slot: 0, stage: 'growing', progress: 0.3 },
    ],
  })],
  render: () => (
    <div>
      <GrowCanvasWrapper />
      <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
        🌑 No light coverage - glow should be absent
      </p>
    </div>
  ),
};

/**
 * All slots filled - tests positioning with maximum pots.
 * Ensures plants render inside their pots, not between them.
 */
export const AllSlotsFilled: StoryObj = {
  decorators: [withStoreState({
    tableSlots: 5,
    lightCoverage: 3,
    pots: [
      { slot: 0, stage: 'seed', progress: 0.1 },
      { slot: 1, stage: 'sprout', progress: 0.3 },
      { slot: 2, stage: 'growing', progress: 0.6 },
      { slot: 3, stage: 'growing', progress: 0.8 },
      { slot: 4, stage: 'harvestable', progress: 1 },
    ],
  })],
  render: () => (
    <div>
      <GrowCanvasWrapper />
      <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
        🌱 All 5 slots filled - each plant should be centered in its pot
      </p>
    </div>
  ),
};

/**
 * Mixed states - combination of empty slots, pots, and plants.
 */
export const MixedStates: StoryObj = {
  decorators: [withStoreState({
    tableSlots: 6,
    lightCoverage: 4,
    pots: [
      { slot: 0, stage: 'harvestable', progress: 1 },
      { slot: 1 },  // Empty pot
      { slot: 3, stage: 'growing', progress: 0.5 },
      { slot: 5, stage: 'sprout', progress: 0.2 },
    ],
  })],
  render: () => (
    <div>
      <GrowCanvasWrapper />
      <p style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
        Mixed: harvestable, empty pot, empty slot, growing, empty slot, sprout
      </p>
    </div>
  ),
};
