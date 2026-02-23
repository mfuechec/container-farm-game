/**
 * Global Game Store (Zustand)
 * 
 * Single source of truth for all game state.
 * Persists to localStorage automatically.
 * 
 * Uses engine modules for all game logic calculations.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Engine
import { engine, MS_PER_GAME_DAY, TickInput } from '../engine';

// Types
import { ApartmentState, INITIAL_APARTMENT } from '../apartment/types';
import { KitchenState, INITIAL_KITCHEN, FoodItem } from '../kitchen/types';
import { EconomyState, INITIAL_ECONOMY } from '../economy/types';
import { MarketState, MarketRentalTier, INITIAL_MARKET, isMarketDay, MARKET_RENTALS } from '../market/types';
import {
  PlantInstance, HarvestedPlant,
  getPlantType, generatePlantId, generateHarvestId,
} from '../hobbies/plants/types';
import {
  TableType, LightType, PotInstance,
  TABLE_TYPES, LIGHT_TYPES, POT_TYPES,
  getPotType, slotHasLight, generatePotId,
} from '../hobbies/plants/equipment';

// Mushroom types
import {
  MushroomInstance, HarvestedMushroom, GrowBagInstance,
  MUSHROOM_TYPES, GROW_BAG_TYPES, EQUIPMENT_TYPES,
  getMushroomType, getGrowBagType, getEquipmentType,
  generateMushroomId, generateBagId, createMushroomInstance,
  calculateMushroomYield,
} from '../hobbies/mushrooms/types';
import {
  MushroomEnvironment, DEFAULT_ENVIRONMENT,
  calculateMushroomGrowth, calculateHarvest as calculateMushroomHarvest,
  updateHarvestFreshness as updateMushroomFreshness,
} from '../engine/mushroomEngine';
import {
  emitCompostFromPlants, emitSubstrateFromMushrooms,
  getSynergyBonus, synergyBus,
} from '../engine/synergies';

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

// Mushroom hobby state (serializable)
interface MushroomHobbyState {
  growBags: GrowBagInstance[];
  mushrooms: Record<string, MushroomInstance>;
  spawn: Record<string, number>;          // spawn counts by type
  harvest: HarvestedMushroom[];
  equipment: string[];                     // owned equipment IDs
  environment: MushroomEnvironment;        // current conditions
}

const INITIAL_MUSHROOM_STATE: MushroomHobbyState = {
  growBags: [],
  mushrooms: {},
  spawn: { oyster: 2 },                   // Start with 2 oyster spawn
  harvest: [],
  equipment: ['spray_bottle'],            // Start with spray bottle
  environment: { ...DEFAULT_ENVIRONMENT },
};

// Full game state
interface GameState {
  // Core systems
  apartment: ApartmentState;
  kitchen: KitchenState;
  economy: EconomyState;
  plantHobby: PlantHobbyState;
  mushroomHobby: MushroomHobbyState;
  market: MarketState;
  
  // Time
  gameDay: number;
  lastTick: number;
  gameStartTime: number;
  lastRentPaid: number;
  
  // UI
  view: 'apartment' | 'kitchen' | 'hobby-plants' | 'hobby-mushrooms' | 'hobby-select';
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
  buyPotType: (slot: number, potTypeId: string) => void;
  upgradeTable: (tableId: string) => void;
  upgradeLight: (lightId: string) => void;
  plantSeed: (typeId: string, potId: string) => void;
  harvestPlant: (plantId: string, yieldMultiplier: number) => void;
  sellHarvest: (harvestId: string) => void;
  storeHarvest: (harvestId: string) => boolean;
  
  // Market
  setMarketRental: (tier: MarketRentalTier) => void;
  sellWholesale: (harvestId: string) => void;
  sellAtMarket: (harvestId: string) => void;
  
  // Mushroom Hobby
  buySpawn: (typeId: string, qty?: number) => void;
  buyGrowBag: (slot: number) => void;
  buyMushroomEquipment: (equipmentId: string) => void;
  inoculateBag: (typeId: string, bagId: string) => void;
  harvestMushroom: (mushroomId: string) => void;
  sellMushroomHarvest: (harvestId: string) => void;
  storeMushroomHarvest: (harvestId: string) => boolean;
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
      mushroomHobby: INITIAL_MUSHROOM_STATE,
      market: INITIAL_MARKET,
      gameDay: 1,
      lastTick: Date.now(),
      gameStartTime: Date.now(),
      lastRentPaid: Date.now(),
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
      skipTime: (days) => {
        const state = get();
        
        // Build TickInput for the engine
        // Use lastTick as the base - skipTime advances from current game position, not real time
        const tickInput: TickInput = {
          lastTick: state.lastTick,
          currentTime: state.lastTick, // Start from current game position
          gameStartTime: state.gameStartTime,
          plants: state.plantHobby.plants,
          pots: state.plantHobby.pots,
          harvest: state.plantHobby.harvest,
          lightCoverage: state.plantHobby.light.coverage,
          kitchen: state.kitchen,
          economy: state.economy,
          rentPerWeek: state.economy.weeklyRent,
          groceryBase: state.economy.weeklyGroceryBase,
          weeklyIncome: state.economy.weeklyIncome,
          lastRentPaid: state.lastRentPaid,
        };
        
        const result = engine.time.skipTime(tickInput, days);
        
        // Process mushroom growth separately
        const mushroomState = state.mushroomHobby;
        let newMushrooms = mushroomState.mushrooms;
        let newMushroomHarvest = mushroomState.harvest;
        
        // Grow mushrooms
        for (const [id, mushroom] of Object.entries(mushroomState.mushrooms)) {
          newMushrooms = {
            ...newMushrooms,
            [id]: calculateMushroomGrowth(mushroom, days, mushroomState.environment),
          };
        }
        
        // Update mushroom harvest freshness
        newMushroomHarvest = updateMushroomFreshness(mushroomState.harvest, result.lastTick);
        
        set({
          kitchen: result.kitchen,
          economy: result.economy,
          gameDay: result.gameDay,
          lastTick: result.lastTick,
          lastRentPaid: result.lastRentPaid,
          plantHobby: {
            ...state.plantHobby,
            plants: result.plants,
            harvest: result.harvest,
          },
          mushroomHobby: {
            ...mushroomState,
            mushrooms: newMushrooms,
            harvest: newMushroomHarvest,
          },
        });
      },
      
      tick: () => {
        const state = get();
        const now = Date.now();
        
        // Quick check before building full input
        const elapsed = now - state.lastTick;
        const minElapsed = MS_PER_GAME_DAY * 0.001; // 3.6 seconds
        
        if (elapsed < minElapsed) return;
        
        // Build TickInput for the engine
        const tickInput: TickInput = {
          lastTick: state.lastTick,
          currentTime: now,
          gameStartTime: state.gameStartTime,
          plants: state.plantHobby.plants,
          pots: state.plantHobby.pots,
          harvest: state.plantHobby.harvest,
          lightCoverage: state.plantHobby.light.coverage,
          kitchen: state.kitchen,
          economy: state.economy,
          rentPerWeek: state.economy.weeklyRent,
          groceryBase: state.economy.weeklyGroceryBase,
          weeklyIncome: state.economy.weeklyIncome,
          lastRentPaid: state.lastRentPaid,
        };
        
        const result = engine.time.processTick(tickInput);
        
        // Log events for debugging (can be expanded for UI notifications)
        if (result.events.length > 0) {
          console.log('[GameStore] Tick events:', result.events);
        }
        
        // Process mushroom growth separately
        const deltaDays = (now - state.lastTick) / MS_PER_GAME_DAY;
        const mushroomState = state.mushroomHobby;
        let newMushrooms = mushroomState.mushrooms;
        let newMushroomHarvest = mushroomState.harvest;
        
        // Grow mushrooms
        if (deltaDays > 0) {
          for (const [id, mushroom] of Object.entries(mushroomState.mushrooms)) {
            newMushrooms = {
              ...newMushrooms,
              [id]: calculateMushroomGrowth(mushroom, deltaDays, mushroomState.environment),
            };
          }
          
          // Update mushroom harvest freshness
          newMushroomHarvest = updateMushroomFreshness(mushroomState.harvest, now);
        }
        
        set({
          kitchen: result.kitchen,
          economy: result.economy,
          gameDay: result.gameDay,
          lastTick: result.lastTick,
          lastRentPaid: result.lastRentPaid,
          plantHobby: {
            ...state.plantHobby,
            plants: result.plants,
            harvest: result.harvest,
          },
          mushroomHobby: {
            ...mushroomState,
            mushrooms: newMushrooms,
            harvest: newMushroomHarvest,
          },
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
      
      buyPotType: (slot, potTypeId) => {
        const state = get();
        const potType = getPotType(potTypeId);
        if (!potType) return;
        if (!get().spendMoney(potType.cost)) return;
        if (state.plantHobby.pots.some(p => p.slot === slot)) return;
        
        const newPot: PotInstance = {
          id: generatePotId(),
          typeId: potTypeId,
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
      
      upgradeTable: (tableId) => {
        const state = get();
        const tableType = TABLE_TYPES.find(t => t.id === tableId);
        if (!tableType) return;
        if (state.plantHobby.table.id === tableId) return; // Already have it
        if (!get().spendMoney(tableType.cost)) return;
        
        // When upgrading table, keep existing pots that fit
        const newPots = state.plantHobby.pots.filter(p => p.slot < tableType.potSlots);
        
        set({
          plantHobby: {
            ...state.plantHobby,
            table: tableType,
            pots: newPots,
          }
        });
      },
      
      upgradeLight: (lightId) => {
        const state = get();
        const lightType = LIGHT_TYPES.find(l => l.id === lightId);
        if (!lightType) return;
        if (state.plantHobby.light.id === lightId) return; // Already have it
        if (!get().spendMoney(lightType.cost)) return;
        
        // Update light coverage for existing plants
        const newPlants: Record<string, PlantInstance> = {};
        for (const [id, plant] of Object.entries(state.plantHobby.plants)) {
          newPlants[id] = {
            ...plant,
            hasLight: slotHasLight(plant.potSlot, lightType.coverage),
          };
        }
        
        set({
          plantHobby: {
            ...state.plantHobby,
            light: lightType,
            plants: newPlants,
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
        
        // Get pot yield modifier
        const pot = plantHobby.pots.find(p => p.plant === plantId);
        let potYieldMod = 1;
        if (pot) {
          const potType = getPotType(pot.typeId);
          if (potType) potYieldMod = potType.yieldModifier;
        }
        
        // Use engine to calculate harvest
        const totalYieldMult = potYieldMod * yieldMultiplier;
        const harvested = engine.plants.calculateHarvest(plant, totalYieldMult);
        
        if (!harvested) return;
        
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
      
      // Market actions
      setMarketRental: (tier) => {
        set((state) => ({
          market: { ...state.market, rentalTier: tier }
        }));
      },
      
      sellWholesale: (harvestId) => {
        const state = get();
        const item = state.plantHobby.harvest.find(h => h.id === harvestId);
        if (!item) return;
        
        const plantType = getPlantType(item.typeId);
        if (!plantType) return;
        
        // Wholesale: 50% of base price
        const price = Math.round(plantType.sellPrice * item.quantity * 0.5 * 10) / 10;
        
        set({
          economy: { ...state.economy, money: state.economy.money + price },
          plantHobby: {
            ...state.plantHobby,
            harvest: state.plantHobby.harvest.filter(h => h.id !== harvestId),
          }
        });
      },
      
      sellAtMarket: (harvestId) => {
        const state = get();
        
        // Check if market is open
        const currentDay = Math.floor(state.gameDay);
        if (!isMarketDay(currentDay, state.market.rentalTier, state.market.lastMarketDay)) {
          console.log('[Store] Cannot sell - market not open');
          return;
        }
        
        const item = state.plantHobby.harvest.find(h => h.id === harvestId);
        if (!item) return;
        
        const plantType = getPlantType(item.typeId);
        if (!plantType) return;
        
        // Market: 100% base + freshness bonus (90-110%)
        const freshnessBonus = 0.9 + (item.freshness * 0.2);
        const price = Math.round(plantType.sellPrice * item.quantity * freshnessBonus * 10) / 10;
        
        // Emit compost synergy when selling at market (composting leftovers)
        emitCompostFromPlants(item.quantity, state.gameDay);
        
        set({
          economy: { ...state.economy, money: state.economy.money + price },
          market: { ...state.market, lastMarketDay: currentDay },
          plantHobby: {
            ...state.plantHobby,
            harvest: state.plantHobby.harvest.filter(h => h.id !== harvestId),
          }
        });
      },
      
      // =========================================================================
      // MUSHROOM HOBBY ACTIONS
      // =========================================================================
      
      buySpawn: (typeId, qty = 1) => {
        const state = get();
        const mushroomType = getMushroomType(typeId);
        if (!mushroomType) return;
        if (!get().spendMoney(mushroomType.spawnCost * qty)) return;
        
        set({
          mushroomHobby: {
            ...state.mushroomHobby,
            spawn: {
              ...state.mushroomHobby.spawn,
              [typeId]: (state.mushroomHobby.spawn[typeId] || 0) + qty,
            }
          }
        });
      },
      
      buyGrowBag: (slot) => {
        const state = get();
        const bagType = GROW_BAG_TYPES[0]; // Basic bag
        if (!get().spendMoney(bagType.cost)) return;
        if (state.mushroomHobby.growBags.some(b => b.slot === slot)) return;
        
        const newBag: GrowBagInstance = {
          id: generateBagId(),
          typeId: bagType.id,
          slot,
          mushroom: null,
        };
        
        set({
          mushroomHobby: {
            ...state.mushroomHobby,
            growBags: [...state.mushroomHobby.growBags, newBag],
          }
        });
      },
      
      buyMushroomEquipment: (equipmentId) => {
        const state = get();
        const equipment = getEquipmentType(equipmentId);
        if (!equipment) return;
        if (state.mushroomHobby.equipment.includes(equipmentId)) return;
        if (!get().spendMoney(equipment.cost)) return;
        
        // Apply equipment bonuses to environment
        const newEnv = { ...state.mushroomHobby.environment };
        if (equipment.bonus.humidity) {
          newEnv.humidity = Math.min(100, newEnv.humidity + equipment.bonus.humidity);
        }
        if (equipment.bonus.temperature) {
          newEnv.temperature += equipment.bonus.temperature;
        }
        if (equipment.bonus.freshAir) {
          newEnv.freshAir = true;
        }
        
        set({
          mushroomHobby: {
            ...state.mushroomHobby,
            equipment: [...state.mushroomHobby.equipment, equipmentId],
            environment: newEnv,
          }
        });
      },
      
      inoculateBag: (typeId, bagId) => {
        const state = get();
        const { mushroomHobby } = state;
        
        const spawnCount = mushroomHobby.spawn[typeId] || 0;
        if (spawnCount <= 0) return;
        
        const bag = mushroomHobby.growBags.find(b => b.id === bagId);
        if (!bag || bag.mushroom) return;
        
        // Create new mushroom with synergy boost if available
        const synergyBoost = getSynergyBonus('mushrooms', state.gameDay);
        const newMushroom = {
          ...createMushroomInstance(typeId, bag.slot),
          synergyBoost,
        };
        
        set({
          mushroomHobby: {
            ...mushroomHobby,
            spawn: {
              ...mushroomHobby.spawn,
              [typeId]: spawnCount - 1,
            },
            growBags: mushroomHobby.growBags.map(b =>
              b.id === bagId ? { ...b, mushroom: newMushroom.id } : b
            ),
            mushrooms: {
              ...mushroomHobby.mushrooms,
              [newMushroom.id]: newMushroom,
            },
          }
        });
      },
      
      harvestMushroom: (mushroomId) => {
        const state = get();
        const { mushroomHobby } = state;
        
        const mushroom = mushroomHobby.mushrooms[mushroomId];
        if (!mushroom || mushroom.stage !== 'harvestable') return;
        
        const harvested = calculateMushroomHarvest(mushroom);
        if (!harvested) return;
        
        // Emit spent substrate synergy for plants
        emitSubstrateFromMushrooms(harvested.quantity, state.gameDay);
        
        // Remove mushroom
        const { [mushroomId]: _, ...remainingMushrooms } = mushroomHobby.mushrooms;
        
        set({
          mushroomHobby: {
            ...mushroomHobby,
            mushrooms: remainingMushrooms,
            growBags: mushroomHobby.growBags.map(b =>
              b.mushroom === mushroomId ? { ...b, mushroom: null } : b
            ),
            harvest: [...mushroomHobby.harvest, harvested],
          }
        });
      },
      
      sellMushroomHarvest: (harvestId) => {
        const state = get();
        const item = state.mushroomHobby.harvest.find(h => h.id === harvestId);
        if (!item) return;
        
        const mushroomType = getMushroomType(item.typeId);
        if (!mushroomType) return;
        
        const price = Math.round(mushroomType.sellPrice * item.quantity * item.freshness * 10) / 10;
        
        set({
          economy: { ...state.economy, money: state.economy.money + price },
          mushroomHobby: {
            ...state.mushroomHobby,
            harvest: state.mushroomHobby.harvest.filter(h => h.id !== harvestId),
          }
        });
      },
      
      storeMushroomHarvest: (harvestId) => {
        const state = get();
        const item = state.mushroomHobby.harvest.find(h => h.id === harvestId);
        if (!item) return false;
        
        const mushroomType = getMushroomType(item.typeId);
        if (!mushroomType) return false;
        
        const food: FoodItem = {
          id: `food_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: mushroomType.name,
          emoji: mushroomType.emoji,
          quantity: item.quantity,
          freshness: item.freshness,
          maxFreshDays: mushroomType.maxFreshDays,
          storedAt: Date.now(),
          groceryValue: mushroomType.groceryValue,
          sourceHobby: 'mushrooms',
          sourceType: item.typeId,
          bonus: mushroomType.kitchenBonus,
        };
        
        if (!get().storeInKitchen(food)) return false;
        
        set({
          mushroomHobby: {
            ...state.mushroomHobby,
            harvest: state.mushroomHobby.harvest.filter(h => h.id !== harvestId),
          }
        });
        return true;
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
        mushroomHobby: state.mushroomHobby,
        market: state.market,
        gameDay: state.gameDay,
        lastTick: state.lastTick,
        gameStartTime: state.gameStartTime,
        lastRentPaid: state.lastRentPaid,
        // Don't persist view/selectedSlot - start fresh
      }),
      // Merge persisted state with defaults to handle missing fields from old saves
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<GameState>;
        return {
          ...currentState,
          ...persisted,
          // Ensure economy has all fields (handles old saves missing weeklyIncome)
          economy: {
            ...INITIAL_ECONOMY,
            ...persisted.economy,
          },
          // Ensure market state exists (handles old saves)
          market: {
            ...INITIAL_MARKET,
            ...persisted.market,
          },
          // Ensure mushroom hobby state exists (handles old saves)
          mushroomHobby: {
            ...INITIAL_MUSHROOM_STATE,
            ...persisted.mushroomHobby,
          },
        };
      },
    }
  )
);

// Selectors for derived state (use engine.kitchen functions)
export const selectKitchenBonuses = (state: GameState) => {
  return engine.kitchen.getActiveKitchenBonuses(state.kitchen.storage);
};

export const selectGrowthMultiplier = (state: GameState) => {
  const bonuses = engine.kitchen.getActiveKitchenBonuses(state.kitchen.storage);
  return engine.kitchen.getBonusMultiplier(bonuses, 'growth');
};

export const selectYieldMultiplier = (state: GameState) => {
  const bonuses = engine.kitchen.getActiveKitchenBonuses(state.kitchen.storage);
  return engine.kitchen.getBonusMultiplier(bonuses, 'yield');
};

// Mushroom selectors
export const selectMushroomSynergyBonus = (state: GameState) => {
  return getSynergyBonus('mushrooms', state.gameDay);
};

export const selectPlantSynergyBonus = (state: GameState) => {
  return getSynergyBonus('plants', state.gameDay);
};
