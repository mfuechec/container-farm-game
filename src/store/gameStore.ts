/**
 * Global Game Store (Zustand)
 * 
 * Single source of truth for all game state.
 * Persists to localStorage automatically.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Types
import { ApartmentState, INITIAL_APARTMENT } from '../apartment/types';
import { KitchenState, INITIAL_KITCHEN, FoodItem, decayKitchenItems } from '../kitchen/types';
import { EconomyState, INITIAL_ECONOMY } from '../economy/types';
import {
  PlantInstance, HarvestedPlant, PLANT_TYPES,
  getPlantType, getGrowthStage, generatePlantId, generateHarvestId,
} from '../hobbies/plants/types';
import {
  TableType, LightType, PotInstance,
  TABLE_TYPES, LIGHT_TYPES, POT_TYPES,
  getPotType, slotHasLight, generatePotId,
} from '../hobbies/plants/equipment';

// Time constants
const MS_PER_GAME_DAY = 60 * 60 * 1000;

// Plant state (serializable - uses Record instead of Map)
interface PlantHobbyState {
  table: TableType;
  light: LightType;
  pots: PotInstance[];
  plants: Record<string, PlantInstance>;
  seeds: Record<string, number>;
  harvest: HarvestedPlant[];
}

const INITIAL_PLANT_STATE: PlantHobbyState = {
  table: TABLE_TYPES[0],
  light: LIGHT_TYPES[0],
  pots: [],
  plants: {},
  seeds: { basil: 3 },
  harvest: [],
};

// Full game state
interface GameState {
  // Core systems
  apartment: ApartmentState;
  kitchen: KitchenState;
  economy: EconomyState;
  plantHobby: PlantHobbyState;
  
  // Time
  gameDay: number;
  lastTick: number;
  
  // UI
  view: 'apartment' | 'kitchen' | 'hobby-plants' | 'hobby-select';
  selectedSlot: number;
}

// Actions
interface GameActions {
  // Navigation
  setView: (view: GameState['view']) => void;
  setSelectedSlot: (slot: number) => void;
  
  // Economy
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  
  // Kitchen
  storeInKitchen: (item: FoodItem) => boolean;
  
  // Apartment
  startHobby: (slot: number, hobby: 'plants' | 'mushrooms') => void;
  
  // Time
  skipTime: (days: number) => void;
  tick: () => void;
  
  // Plant Hobby
  buySeeds: (typeId: string, qty?: number) => void;
  buyPot: (slot: number) => void;
  plantSeed: (typeId: string, potId: string) => void;
  harvestPlant: (plantId: string, yieldMultiplier: number) => void;
  sellHarvest: (harvestId: string) => void;
  storeHarvest: (harvestId: string) => boolean;
  growPlants: (growthMultiplier: number) => void;
}

type GameStore = GameState & GameActions;

// Store
export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial state
      apartment: INITIAL_APARTMENT,
      kitchen: INITIAL_KITCHEN,
      economy: INITIAL_ECONOMY,
      plantHobby: INITIAL_PLANT_STATE,
      gameDay: 1,
      lastTick: Date.now(),
      view: 'apartment',
      selectedSlot: 0,
      
      // Navigation
      setView: (view) => set({ view }),
      setSelectedSlot: (slot) => set({ selectedSlot: slot }),
      
      // Economy
      addMoney: (amount) => set((state) => ({
        economy: { ...state.economy, money: state.economy.money + amount }
      })),
      
      spendMoney: (amount) => {
        const { economy } = get();
        if (economy.money < amount) return false;
        set({ economy: { ...economy, money: economy.money - amount } });
        return true;
      },
      
      // Kitchen
      storeInKitchen: (item) => {
        const { kitchen } = get();
        if (kitchen.storage.length >= kitchen.capacity) return false;
        set({
          kitchen: {
            ...kitchen,
            storage: [...kitchen.storage, item],
          }
        });
        return true;
      },
      
      // Apartment
      startHobby: (slot, hobby) => {
        const { apartment } = get();
        set({
          apartment: {
            ...apartment,
            hobbySlots: apartment.hobbySlots.map((s, i) =>
              i === slot ? { ...s, hobby } : s
            ),
          },
          view: `hobby-${hobby}` as GameState['view'],
        });
      },
      
      // Time
      skipTime: (days) => set((state) => ({
        lastTick: state.lastTick - (days * MS_PER_GAME_DAY)
      })),
      
      tick: () => {
        const state = get();
        const now = Date.now();
        const elapsed = now - state.lastTick;
        const daysPassed = elapsed / MS_PER_GAME_DAY;
        
        if (daysPassed < 0.001) return;
        
        // Decay kitchen items
        const newKitchen = {
          ...state.kitchen,
          storage: decayKitchenItems(state.kitchen.storage, daysPassed),
        };
        
        // Weekly expenses
        const prevWeek = Math.floor((state.gameDay - 1) / 7);
        const newDay = state.gameDay + daysPassed;
        const newWeek = Math.floor((newDay - 1) / 7);
        
        let newMoney = state.economy.money;
        if (newWeek > prevWeek) {
          const weeklyExpenses = state.economy.weeklyRent + state.economy.weeklyGroceryBase;
          newMoney -= weeklyExpenses;
        }
        
        // Grow plants
        const { plantHobby } = state;
        let plantsChanged = false;
        const newPlants: Record<string, PlantInstance> = {};
        
        for (const [id, plant] of Object.entries(plantHobby.plants)) {
          if (plant.stage === 'harvestable') {
            newPlants[id] = plant;
            continue;
          }
          
          const plantType = getPlantType(plant.typeId);
          if (!plantType) {
            newPlants[id] = plant;
            continue;
          }
          
          // Calculate growth rate
          let growthRate = 1 / plantType.daysToMature;
          if (plant.hasLight) growthRate *= plantHobby.light.growthBoost;
          else growthRate *= 0.5;
          
          const pot = plantHobby.pots.find(p => p.plant === id);
          if (pot) {
            const potType = getPotType(pot.typeId);
            if (potType) growthRate *= potType.growthModifier;
          }
          
          const newProgress = Math.min(1, plant.growthProgress + growthRate * daysPassed);
          if (newProgress !== plant.growthProgress) {
            plantsChanged = true;
            newPlants[id] = {
              ...plant,
              growthProgress: newProgress,
              stage: getGrowthStage(newProgress),
            };
          } else {
            newPlants[id] = plant;
          }
        }
        
        set({
          kitchen: newKitchen,
          economy: { ...state.economy, money: newMoney },
          gameDay: newDay,
          lastTick: now,
          plantHobby: plantsChanged 
            ? { ...plantHobby, plants: newPlants }
            : plantHobby,
        });
      },
      
      // Plant Hobby actions
      buySeeds: (typeId, qty = 1) => {
        const state = get();
        const plantType = getPlantType(typeId);
        if (!plantType) return;
        if (!get().spendMoney(plantType.seedCost * qty)) return;
        
        set({
          plantHobby: {
            ...state.plantHobby,
            seeds: {
              ...state.plantHobby.seeds,
              [typeId]: (state.plantHobby.seeds[typeId] || 0) + qty,
            }
          }
        });
      },
      
      buyPot: (slot) => {
        const state = get();
        const potType = POT_TYPES[0];
        if (!get().spendMoney(potType.cost)) return;
        if (state.plantHobby.pots.some(p => p.slot === slot)) return;
        
        const newPot: PotInstance = {
          id: generatePotId(),
          typeId: potType.id,
          slot,
          plant: null,
        };
        
        set({
          plantHobby: {
            ...state.plantHobby,
            pots: [...state.plantHobby.pots, newPot],
          }
        });
      },
      
      plantSeed: (typeId, potId) => {
        const state = get();
        const { plantHobby } = state;
        
        const seedCount = plantHobby.seeds[typeId] || 0;
        if (seedCount <= 0) return;
        
        const pot = plantHobby.pots.find(p => p.id === potId);
        if (!pot || pot.plant) return;
        
        const plantId = generatePlantId();
        const hasLight = slotHasLight(pot.slot, plantHobby.light.coverage);
        
        const newPlant: PlantInstance = {
          id: plantId,
          typeId,
          plantedAt: Date.now(),
          growthProgress: 0,
          stage: 'seed',
          hasLight,
          potSlot: pot.slot,
        };
        
        set({
          plantHobby: {
            ...plantHobby,
            seeds: {
              ...plantHobby.seeds,
              [typeId]: seedCount - 1,
            },
            pots: plantHobby.pots.map(p =>
              p.id === potId ? { ...p, plant: plantId } : p
            ),
            plants: {
              ...plantHobby.plants,
              [plantId]: newPlant,
            },
          }
        });
      },
      
      harvestPlant: (plantId, yieldMultiplier) => {
        const state = get();
        const { plantHobby } = state;
        
        const plant = plantHobby.plants[plantId];
        if (!plant || plant.stage !== 'harvestable') return;
        
        const plantType = getPlantType(plant.typeId);
        if (!plantType) return;
        
        let yieldAmount = plantType.yieldAmount;
        const pot = plantHobby.pots.find(p => p.plant === plantId);
        if (pot) {
          const potType = getPotType(pot.typeId);
          if (potType) yieldAmount *= potType.yieldModifier;
        }
        yieldAmount *= yieldMultiplier;
        yieldAmount = Math.round(yieldAmount);
        
        const harvested: HarvestedPlant = {
          id: generateHarvestId(),
          typeId: plant.typeId,
          quantity: yieldAmount,
          harvestedAt: Date.now(),
          freshness: 1.0,
        };
        
        // Remove plant from plants object
        const { [plantId]: _, ...remainingPlants } = plantHobby.plants;
        
        set({
          plantHobby: {
            ...plantHobby,
            plants: remainingPlants,
            pots: plantHobby.pots.map(p =>
              p.plant === plantId ? { ...p, plant: null } : p
            ),
            harvest: [...plantHobby.harvest, harvested],
          }
        });
      },
      
      sellHarvest: (harvestId) => {
        const state = get();
        const item = state.plantHobby.harvest.find(h => h.id === harvestId);
        if (!item) return;
        
        const plantType = getPlantType(item.typeId);
        if (!plantType) return;
        
        const price = Math.round(plantType.sellPrice * item.quantity * item.freshness * 10) / 10;
        
        set({
          economy: { ...state.economy, money: state.economy.money + price },
          plantHobby: {
            ...state.plantHobby,
            harvest: state.plantHobby.harvest.filter(h => h.id !== harvestId),
          }
        });
      },
      
      storeHarvest: (harvestId) => {
        const state = get();
        const item = state.plantHobby.harvest.find(h => h.id === harvestId);
        if (!item) return false;
        
        const plantType = getPlantType(item.typeId);
        if (!plantType) return false;
        
        const food: FoodItem = {
          id: `food_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: plantType.name,
          emoji: plantType.emoji,
          quantity: item.quantity,
          freshness: item.freshness,
          maxFreshDays: 7, // Herbs last about a week
          storedAt: Date.now(),
          groceryValue: plantType.sellPrice * 0.5, // Worth half sell price in grocery savings
          sourceHobby: 'plants',
          sourceType: item.typeId,
          bonus: {
            type: 'growth',
            amount: 1.1, // 10% growth boost when stored
          },
        };
        
        if (!get().storeInKitchen(food)) return false;
        
        set({
          plantHobby: {
            ...state.plantHobby,
            harvest: state.plantHobby.harvest.filter(h => h.id !== harvestId),
          }
        });
        return true;
      },
      
      growPlants: (growthMultiplier) => {
        const state = get();
        const { plantHobby, lastTick } = state;
        const now = Date.now();
        const daysPassed = (now - lastTick) / MS_PER_GAME_DAY;
        
        if (daysPassed < 0.001) return;
        
        let changed = false;
        const newPlants: Record<string, PlantInstance> = {};
        
        for (const [id, plant] of Object.entries(plantHobby.plants)) {
          if (plant.stage === 'harvestable') {
            newPlants[id] = plant;
            continue;
          }
          
          const plantType = getPlantType(plant.typeId);
          if (!plantType) {
            newPlants[id] = plant;
            continue;
          }
          
          let growthRate = 1 / plantType.daysToMature;
          if (plant.hasLight) growthRate *= plantHobby.light.growthBoost;
          else growthRate *= 0.5;
          growthRate *= growthMultiplier;
          
          const pot = plantHobby.pots.find(p => p.plant === id);
          if (pot) {
            const potType = getPotType(pot.typeId);
            if (potType) growthRate *= potType.growthModifier;
          }
          
          const newProgress = Math.min(1, plant.growthProgress + growthRate * daysPassed);
          if (newProgress !== plant.growthProgress) {
            changed = true;
            newPlants[id] = {
              ...plant,
              growthProgress: newProgress,
              stage: getGrowthStage(newProgress),
            };
          } else {
            newPlants[id] = plant;
          }
        }
        
        if (changed) {
          set({
            plantHobby: {
              ...plantHobby,
              plants: newPlants,
            }
          });
        }
      },
    }),
    {
      name: 'side-hustle-game',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        apartment: state.apartment,
        kitchen: state.kitchen,
        economy: state.economy,
        plantHobby: state.plantHobby,
        gameDay: state.gameDay,
        lastTick: state.lastTick,
        // Don't persist view/selectedSlot - start fresh
      }),
    }
  )
);

// Selectors for derived state
export const selectKitchenBonuses = (state: GameState) => {
  // Get bonuses from stored items that have them
  const bonuses: Array<{ type: string; amount: number; source: string }> = [];
  
  for (const item of state.kitchen.storage) {
    // Only active if fresh enough
    if (item.freshness > 0.3 && item.bonus) {
      bonuses.push({
        type: item.bonus.type,
        amount: item.bonus.amount,
        source: item.name,
      });
    }
  }
  
  return bonuses;
};

export const selectGrowthMultiplier = (state: GameState) => {
  const bonuses = selectKitchenBonuses(state);
  return bonuses
    .filter(b => b.type === 'growth')
    .reduce((mult, b) => mult * b.amount, 1);
};

export const selectYieldMultiplier = (state: GameState) => {
  const bonuses = selectKitchenBonuses(state);
  return bonuses
    .filter(b => b.type === 'yield')
    .reduce((mult, b) => mult * b.amount, 1);
};
