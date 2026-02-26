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
import { audio } from '../engine/audio';

// Types
import { ApartmentState, INITIAL_APARTMENT, HobbySlot, HOUSING_TIERS } from '../apartment/types';
import {
  HousingTier, getHousingTier, calculateDeposit, calculateMoveTransaction,
} from '../housing/types';
import { KitchenState, INITIAL_KITCHEN, FoodItem, StapleItem, RecipeId, MealLog } from '../kitchen/types';
import { EconomyState, INITIAL_ECONOMY } from '../economy/types';
import { STAPLES as KITCHEN_STAPLES, RECIPES, KITCHEN as KITCHEN_BALANCE } from '../balance';
import {
  canMakeRecipe, getDiscoverableRecipes, selectBestMeal, cookRecipe, calculateMealSavings,
} from '../engine/kitchenEngine';
import { PantryState, Meal, INGREDIENTS, STAPLE_IDS, PantryItem } from '../engine/pantryEngine';
import { INITIAL_PANTRY, PantrySlice } from '../kitchen/pantryStore';
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
  
  // Pantry (new meal system)
  pantry: PantryState;
  todaysMeal: Meal | null;
  lastMealDay: number;
  
  // Time
  gameDay: number;
  lastTick: number;
  gameStartTime: number;
  lastRentPaid: number;
  
  // UI
  view: 'apartment' | 'kitchen' | 'hobby-plants' | 'hobby-mushrooms' | 'hobby-select' | 'housing';
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
  buyKitchenStaple: (stapleId: keyof typeof KITCHEN_STAPLES, quantity?: number) => boolean;
  cookDailyMeal: () => void;
  resetWeeklyMeals: () => void;

  // Pantry
  addToPantry: (ingredientId: string, quantity: number, source: 'grown' | 'bought') => void;
  buyStaple: (ingredientId: string) => boolean;
  processDailyMeal: () => void;
  storePlantHarvestInPantry: (harvestId: string) => boolean;
  storeMushroomHarvestInPantry: (harvestId: string) => boolean;
  
  // Apartment
  startHobby: (slot: number, hobby: 'plants' | 'mushrooms') => void;
  
  // Housing
  upgradeHousing: (tierId: number) => boolean;
  downgradeHousing: (tierId: number, keepHobbies: number[]) => boolean;
  
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
      pantry: INITIAL_PANTRY,
      todaysMeal: null,
      lastMealDay: 0,
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
      
      // Kitchen - unique items only (one slot per item type)
      storeInKitchen: (item) => {
        const { kitchen } = get();
        
        // Check if we already have this type
        const existingIndex = kitchen.storage.findIndex(
          existing => existing.sourceType === item.sourceType
        );
        
        if (existingIndex >= 0) {
          // Replace existing with fresher item (keeps variety, rewards fresh harvest)
          const existing = kitchen.storage[existingIndex];
          if (item.freshness > existing.freshness) {
            const newStorage = [...kitchen.storage];
            newStorage[existingIndex] = item;
            set({ kitchen: { ...kitchen, storage: newStorage } });
            return true;
          }
          return false; // Existing is fresher, reject
        }
        
        // New type - check capacity
        if (kitchen.storage.length >= kitchen.capacity) return false;
        set({
          kitchen: {
            ...kitchen,
            storage: [...kitchen.storage, item],
          }
        });
        return true;
      },

      buyKitchenStaple: (stapleId, quantity = 1) => {
        const staple = KITCHEN_STAPLES[stapleId];
        if (!staple) return false;

        const totalCost = staple.price * quantity;
        if (!get().spendMoney(totalCost)) return false;

        const { kitchen } = get();
        const existing = kitchen.staples.find(s => s.stapleId === stapleId);

        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, staple.stackLimit);
          if (newQty === existing.quantity) return false; // Already at stack limit
          const actualBought = newQty - existing.quantity;
          // Refund over-purchase
          if (actualBought < quantity) {
            get().addMoney((quantity - actualBought) * staple.price);
          }
          set({
            kitchen: {
              ...kitchen,
              staples: kitchen.staples.map(s =>
                s.stapleId === stapleId ? { ...s, quantity: newQty } : s
              ),
            },
          });
        } else {
          const qty = Math.min(quantity, staple.stackLimit);
          if (qty < quantity) {
            get().addMoney((quantity - qty) * staple.price);
          }
          const newItem: StapleItem = {
            id: `staple-${stapleId}-${Date.now()}`,
            stapleId,
            name: staple.name,
            emoji: staple.emoji,
            quantity: qty,
          };
          set({
            kitchen: {
              ...kitchen,
              staples: [...kitchen.staples, newItem],
            },
          });
        }

        audio.play('buy');
        return true;
      },

      cookDailyMeal: () => {
        const state = get();
        const currentDay = Math.floor(state.gameDay);
        const { kitchen } = state;

        // Only cook once per day (check if we already cooked today)
        const alreadyCooked = kitchen.mealHistory.some(
          m => Math.floor(m.cookedAt) === currentDay
        );
        if (alreadyCooked) return;

        // 1. Check for new recipe discoveries
        const newDiscoveries = getDiscoverableRecipes(
          kitchen.storage,
          kitchen.staples,
          kitchen.discoveredRecipes
        );
        let discoveredRecipes = kitchen.discoveredRecipes;
        if (newDiscoveries.length > 0) {
          discoveredRecipes = [...discoveredRecipes, ...newDiscoveries];
        }

        // 2. Select best available meal
        const recipeId = selectBestMeal(discoveredRecipes, kitchen.storage, kitchen.staples);

        let updatedStorage = kitchen.storage;
        let updatedStaples = kitchen.staples;
        let meal: MealLog;

        if (recipeId) {
          // 3. Cook the meal
          const result = cookRecipe(recipeId, kitchen.storage, kitchen.staples);
          if (result) {
            const recipe = RECIPES[recipeId];
            updatedStorage = result.updatedStorage;
            updatedStaples = result.updatedStaples;
            meal = {
              id: `meal-${currentDay}-${Date.now()}`,
              recipeId,
              recipeName: recipe.name,
              emoji: recipe.emoji,
              cookedAt: currentDay,
              grocerySavings: recipe.groceryValue,
              ingredientsUsed: result.ingredientsUsed,
            };
          } else {
            // Shouldn't happen (selectBestMeal verified), but fallback to takeout
            meal = {
              id: `meal-${currentDay}-${Date.now()}`,
              recipeId: null,
              recipeName: 'Takeout',
              emoji: '🥡',
              cookedAt: currentDay,
              grocerySavings: 0,
              ingredientsUsed: [],
            };
          }
        } else {
          // 4. No meal possible — takeout
          meal = {
            id: `meal-${currentDay}-${Date.now()}`,
            recipeId: null,
            recipeName: 'Takeout',
            emoji: '🥡',
            cookedAt: currentDay,
            grocerySavings: 0,
            ingredientsUsed: [],
          };
        }

        set({
          kitchen: {
            ...kitchen,
            storage: updatedStorage,
            staples: updatedStaples,
            discoveredRecipes,
            mealHistory: [...kitchen.mealHistory, meal],
          },
        });
      },

      resetWeeklyMeals: () => {
        const state = get();
        const currentDay = Math.floor(state.gameDay);
        set({
          kitchen: {
            ...state.kitchen,
            mealHistory: [],
            weekStartDay: currentDay,
          },
        });
      },

      // Pantry actions
      addToPantry: (ingredientId, quantity, source) => {
        const state = get();
        const gameDay = Math.floor(state.gameDay);
        
        const existingIdx = state.pantry.items.findIndex(
          i => i.ingredientId === ingredientId && i.source === source
        );
        
        let newItems: PantryItem[];
        if (existingIdx >= 0) {
          newItems = state.pantry.items.map((item, idx) =>
            idx === existingIdx
              ? { ...item, quantity: item.quantity + quantity, harvestedAt: gameDay }
              : item
          );
        } else {
          newItems = [...state.pantry.items, {
            ingredientId,
            quantity,
            harvestedAt: gameDay,
            source,
          }];
        }
        
        set({ pantry: { ...state.pantry, items: newItems } });
      },
      
      buyStaple: (ingredientId) => {
        const ingredient = INGREDIENTS[ingredientId];
        if (!ingredient) return false;
        if (!STAPLE_IDS.includes(ingredientId)) return false;
        
        const state = get();
        if (!state.spendMoney(ingredient.basePrice)) return false;
        
        state.addToPantry(ingredientId, 1, 'bought');
        audio.play('buy');
        return true;
      },
      
      processDailyMeal: () => {
        const state = get();
        const currentDay = Math.floor(state.gameDay);
        
        if (currentDay <= state.lastMealDay) return;
        
        const { pantry } = state;
        const available = pantry.items.filter(i => i.quantity > 0);
        
        // Need at least a base (staple/protein)
        const bases = available.filter(i => {
          const ing = INGREDIENTS[i.ingredientId];
          return ing?.category === 'staple' || ing?.category === 'protein';
        });
        
        if (bases.length === 0) {
          set({ lastMealDay: currentDay, todaysMeal: null });
          return;
        }
        
        // Pick a base (variety)
        const recentBases = pantry.mealHistory.slice(-3).flatMap(m => m.ingredients);
        const freshBase = bases.find(b => !recentBases.includes(b.ingredientId)) || bases[0];
        
        // Pick toppings
        const toppings = available
          .filter(i => {
            const ing = INGREDIENTS[i.ingredientId];
            return ing?.category !== 'staple' && i.ingredientId !== freshBase.ingredientId;
          })
          .sort((a, b) => {
            // Prefer soon-to-spoil, then homegrown
            const ingA = INGREDIENTS[a.ingredientId];
            const ingB = INGREDIENTS[b.ingredientId];
            const freshA = ingA?.shelfLife === Infinity ? 1 : Math.max(0, 1 - (currentDay - a.harvestedAt) / (ingA?.shelfLife || 7));
            const freshB = ingB?.shelfLife === Infinity ? 1 : Math.max(0, 1 - (currentDay - b.harvestedAt) / (ingB?.shelfLife || 7));
            if (freshA !== freshB) return freshA - freshB;
            return a.source === 'grown' ? -1 : 1;
          });
        
        const selected = [freshBase.ingredientId];
        for (let i = 0; i < Math.min(2, toppings.length); i++) {
          selected.push(toppings[i].ingredientId);
        }
        
        // Calculate freshness and generate meal
        let totalFreshness = 0;
        for (const id of selected) {
          const item = pantry.items.find(i => i.ingredientId === id);
          const ing = INGREDIENTS[id];
          if (item && ing) {
            const f = ing.shelfLife === Infinity ? 1 : Math.max(0, 1 - (currentDay - item.harvestedAt) / ing.shelfLife);
            totalFreshness += f;
          }
        }
        const avgFreshness = totalFreshness / selected.length;
        
        // Generate name
        const ingredients = selected.map(id => INGREDIENTS[id]).filter(Boolean);
        const base = ingredients.find(i => i.category === 'staple' || i.category === 'protein');
        const tops = ingredients.filter(i => i.category !== 'staple');
        let adj = avgFreshness >= 0.8 ? 'Fresh ' : avgFreshness < 0.5 ? 'Day-old ' : '';
        const topNames = tops.slice(0, 2).map(t => t.name.split(' ')[0]).join(' ');
        const mealName = `${adj}${topNames ? topNames + ' ' : ''}${base?.name || 'Bowl'}`;
        
        // Check if new
        const sorted = [...selected].sort().join(',');
        const isNew = !pantry.mealHistory.slice(-7).some(m => [...m.ingredients].sort().join(',') === sorted);
        
        // Calculate satisfaction
        let sat = 2;
        let hasHomegrown = false, hasFresh = false, hasWilted = false;
        for (const id of selected) {
          const item = pantry.items.find(i => i.ingredientId === id);
          const ing = INGREDIENTS[id];
          if (item && ing) {
            const f = ing.shelfLife === Infinity ? 1 : Math.max(0, 1 - (currentDay - item.harvestedAt) / ing.shelfLife);
            if (item.source === 'grown') hasHomegrown = true;
            if (f >= 0.8) hasFresh = true;
            if (f < 0.5) hasWilted = true;
          }
        }
        if (hasFresh) sat++;
        if (hasHomegrown) sat++;
        if (isNew) sat++;
        if (hasWilted) sat--;
        const lastMeal = pantry.mealHistory[pantry.mealHistory.length - 1];
        if (lastMeal && [...lastMeal.ingredients].sort().join(',') === sorted) sat--;
        sat = Math.max(1, Math.min(5, sat));
        
        const meal: Meal = {
          id: `meal-${currentDay}-${Date.now()}`,
          name: mealName,
          ingredients: selected,
          cookedAt: currentDay,
          satisfaction: sat,
          isNew,
        };
        
        // Consume ingredients
        const newItems = pantry.items
          .map(item => selected.includes(item.ingredientId) ? { ...item, quantity: item.quantity - 1 } : item)
          .filter(item => item.quantity > 0);
        
        set({
          lastMealDay: currentDay,
          todaysMeal: meal,
          pantry: {
            ...pantry,
            items: newItems,
            mealHistory: [...pantry.mealHistory.slice(-29), meal],
            totalMealsCooked: pantry.totalMealsCooked + 1,
          },
        });
      },
      
      storePlantHarvestInPantry: (harvestId) => {
        const state = get();
        const item = state.plantHobby.harvest.find(h => h.id === harvestId);
        if (!item) return false;
        
        // Map plant type ID to ingredient ID (they match in our case)
        const ingredientId = item.typeId;
        if (!INGREDIENTS[ingredientId]) return false;
        
        // Add to pantry
        state.addToPantry(ingredientId, Math.floor(item.quantity), 'grown');
        
        // Remove from harvest
        set({
          plantHobby: {
            ...state.plantHobby,
            harvest: state.plantHobby.harvest.filter(h => h.id !== harvestId),
          }
        });
        
        audio.play('click');
        return true;
      },
      
      storeMushroomHarvestInPantry: (harvestId) => {
        const state = get();
        const item = state.mushroomHobby.harvest.find(h => h.id === harvestId);
        if (!item) return false;
        
        // Map mushroom type ID to ingredient ID
        const ingredientId = item.typeId;
        if (!INGREDIENTS[ingredientId]) return false;
        
        // Add to pantry (mushroom quantity is in oz, convert to units)
        state.addToPantry(ingredientId, Math.floor(item.quantity), 'grown');
        
        // Remove from harvest
        set({
          mushroomHobby: {
            ...state.mushroomHobby,
            harvest: state.mushroomHobby.harvest.filter(h => h.id !== harvestId),
          }
        });
        
        audio.play('click');
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
      
      // Housing
      upgradeHousing: (tierId) => {
        const state = get();
        const newTier = getHousingTier(tierId);
        if (!newTier) return false;
        
        const currentTier = state.apartment.housing;
        const transaction = calculateMoveTransaction(
          currentTier,
          newTier,
          state.apartment.securityDeposit
        );
        
        // Check if can afford
        if (transaction.netCost > state.economy.money) return false;
        
        // Calculate new hobby slots
        const currentHobbies = state.apartment.hobbySlots;
        const newSlots: HobbySlot[] = [];
        for (let i = 0; i < newTier.hobbySlots; i++) {
          if (i < currentHobbies.length) {
            newSlots.push({ ...currentHobbies[i], index: i });
          } else {
            newSlots.push({ index: i, hobby: null });
          }
        }
        
        // Apply transaction
        set({
          apartment: {
            housing: newTier,
            hobbySlots: newSlots,
            securityDeposit: calculateDeposit(newTier),
          },
          economy: {
            ...state.economy,
            money: state.economy.money - transaction.netCost,
            weeklyRent: newTier.rentPerWeek,
          },
          view: 'apartment',
        });
        
        return true;
      },
      
      downgradeHousing: (tierId, keepHobbies) => {
        const state = get();
        const newTier = getHousingTier(tierId);
        if (!newTier) return false;
        
        const currentTier = state.apartment.housing;
        const transaction = calculateMoveTransaction(
          currentTier,
          newTier,
          state.apartment.securityDeposit
        );
        
        // Build new hobby slots from kept hobbies
        const currentHobbies = state.apartment.hobbySlots;
        const newSlots: HobbySlot[] = [];
        
        // Keep selected hobbies
        for (let i = 0; i < newTier.hobbySlots; i++) {
          if (i < keepHobbies.length) {
            const keepIndex = keepHobbies[i];
            const kept = currentHobbies[keepIndex];
            newSlots.push({ index: i, hobby: kept?.hobby || null });
          } else {
            newSlots.push({ index: i, hobby: null });
          }
        }
        
        // Apply transaction (negative netCost = refund)
        set({
          apartment: {
            housing: newTier,
            hobbySlots: newSlots,
            securityDeposit: calculateDeposit(newTier),
          },
          economy: {
            ...state.economy,
            money: state.economy.money - transaction.netCost, // netCost is negative for downgrade
            weeklyRent: newTier.rentPerWeek,
          },
          view: 'apartment',
        });
        
        return true;
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

        // Check if weekly reset needed
        const rentPaid = result.events.some(e => e.type === 'rent_paid');

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

        // Reset weekly meal tracking on new week
        if (rentPaid) {
          get().resetWeeklyMeals();
        }

        // Process daily meal after time skip
        get().processDailyMeal();
        get().cookDailyMeal();
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

        // Reset weekly meals when rent is paid (signals new week)
        const rentPaid = result.events.some(e => e.type === 'rent_paid');

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

        // Reset weekly meal tracking on new week
        if (rentPaid) {
          get().resetWeeklyMeals();
        }

        // Process daily meal after state update
        get().processDailyMeal();
        get().cookDailyMeal();
      },

      // Plant Hobby actions
      buySeeds: (typeId, qty = 1) => {
        const state = get();
        const plantType = getPlantType(typeId);
        if (!plantType) return;
        if (!get().spendMoney(plantType.seedCost * qty)) return;
        
        audio.play('buy');
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
        
        audio.play('buy');
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
        
        audio.play('buy');
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
        
        audio.play('buy');
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
        
        audio.play('buy');
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
        
        audio.play('harvest');
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
        
        audio.play('sell');
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
        
        audio.play('sell');
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
        
        audio.play('sell');
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
        
        audio.play('buy');
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
        
        audio.play('buy');
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
        
        audio.play('buy');
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
        
        audio.play('harvest');
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
        
        audio.play('sell');
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
        pantry: state.pantry,
        todaysMeal: state.todaysMeal,
        lastMealDay: state.lastMealDay,
        gameDay: state.gameDay,
        lastTick: state.lastTick,
        gameStartTime: state.gameStartTime,
        lastRentPaid: state.lastRentPaid,
        // Don't persist view/selectedSlot - start fresh
      }),
      // Merge persisted state with defaults to handle missing fields from old saves
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<GameState>;
        // Migrate old saves to new realistic economy
        // Force all economy values to new scale (old saves had tiny values)
        const migratedEconomy = {
          ...INITIAL_ECONOMY,
          // Keep player's money but scale it up if from old save
          money: (persisted.economy?.money ?? INITIAL_ECONOMY.money) < 200 
            ? (persisted.economy?.money ?? 100) * 5  // Scale up old tiny money
            : (persisted.economy?.money ?? INITIAL_ECONOMY.money),
        };
        return {
          ...currentState,
          ...persisted,
          // Force new economy values
          economy: migratedEconomy,
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
          // Migrate kitchen capacity
          kitchen: {
            ...INITIAL_KITCHEN,
            ...persisted.kitchen,
            capacity: INITIAL_KITCHEN.capacity,
          },
          // Ensure pantry state exists (handles old saves)
          pantry: {
            ...INITIAL_PANTRY,
            ...persisted.pantry,
          },
          todaysMeal: persisted.todaysMeal ?? null,
          lastMealDay: persisted.lastMealDay ?? 0,
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
