/**
 * Main Game State Hook - Phase 1
 * 
 * Simplified plant growing with equipment-based mechanics.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  PlantType, PlantInstance, HarvestedPlant, PLANT_TYPES,
  getPlantType, getGrowthStage, generatePlantId, generateHarvestId
} from './plants/types';
import {
  TableType, LightType, PotType, EquipmentState, PotInstance,
  TABLE_TYPES, LIGHT_TYPES, POT_TYPES,
  getTableType, getLightType, getPotType, slotHasLight, generatePotId
} from './equipment/types';
import {
  KitchenState, INITIAL_KITCHEN,
  calculateGrocerySavings, getActiveKitchenBonuses, getGrowthMultiplier, getYieldMultiplier,
  decayKitchenItems, consumeKitchenItems
} from './kitchen/types';

// Game constants
const MS_PER_GAME_DAY = 60 * 60 * 1000; // 1 hour = 1 game day
const TICK_INTERVAL = 1000;              // Update every second
const WEEKLY_RENT = 50;
const DAYS_PER_WEEK = 7;

export interface GameState {
  // Time
  gameDay: number;
  lastTick: number;
  
  // Economy
  money: number;
  
  // Equipment
  equipment: EquipmentState;
  
  // Plants
  plants: Map<string, PlantInstance>;
  
  // Inventory
  seeds: Map<string, number>;  // plantTypeId -> count
  harvest: HarvestedPlant[];   // Ready to sell or store
  
  // Kitchen
  kitchen: KitchenState;
}

const INITIAL_STATE: GameState = {
  gameDay: 1,
  lastTick: Date.now(),
  money: 100,
  equipment: {
    table: TABLE_TYPES[0],     // Small desk
    light: LIGHT_TYPES[0],     // Desk lamp
    pots: [],
  },
  plants: new Map(),
  seeds: new Map([['basil', 3]]),  // Start with 3 basil seeds
  harvest: [],
  kitchen: INITIAL_KITCHEN,
};

export function useGame() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  // Kitchen bonuses (derived)
  const kitchenBonuses = useMemo(
    () => getActiveKitchenBonuses(state.kitchen.storage),
    [state.kitchen.storage]
  );
  const growthMultiplier = useMemo(
    () => getGrowthMultiplier(kitchenBonuses),
    [kitchenBonuses]
  );
  const yieldMultiplier = useMemo(
    () => getYieldMultiplier(kitchenBonuses),
    [kitchenBonuses]
  );
  const grocerySavings = useMemo(
    () => calculateGrocerySavings(state.kitchen.storage),
    [state.kitchen.storage]
  );

  // === GAME TICK ===
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const now = Date.now();
        const elapsed = now - prev.lastTick;
        const daysPassed = elapsed / MS_PER_GAME_DAY;
        
        if (daysPassed < 0.01) return prev; // Skip tiny updates
        
        // Update plants
        const newPlants = new Map(prev.plants);
        for (const [id, plant] of newPlants) {
          const plantType = getPlantType(plant.typeId);
          if (!plantType) continue;
          
          // Growth rate based on light, equipment, and bonuses
          let growthRate = 1 / plantType.daysToMature;
          
          // Light boost
          if (plant.hasLight) {
            growthRate *= prev.equipment.light.growthBoost;
          } else {
            growthRate *= 0.5; // Half speed without light
          }
          
          // Kitchen growth bonus
          growthRate *= growthMultiplier;
          
          // Pot modifier
          const pot = prev.equipment.pots.find(p => p.plant === id);
          if (pot) {
            const potType = getPotType(pot.typeId);
            if (potType) growthRate *= potType.growthModifier;
          }
          
          const newProgress = Math.min(1, plant.growthProgress + growthRate * daysPassed);
          newPlants.set(id, {
            ...plant,
            growthProgress: newProgress,
            stage: getGrowthStage(newProgress),
          });
        }
        
        // Decay kitchen items
        const decayedKitchen = decayKitchenItems(prev.kitchen.storage, daysPassed);
        
        // Weekly rent/groceries (check if we crossed a week boundary)
        const prevWeek = Math.floor((prev.gameDay - 1) / DAYS_PER_WEEK);
        const newDay = prev.gameDay + daysPassed;
        const newWeek = Math.floor((newDay - 1) / DAYS_PER_WEEK);
        
        let newMoney = prev.money;
        if (newWeek > prevWeek) {
          // Pay rent and groceries
          const groceryCost = Math.max(0, prev.kitchen.weeklyGroceryBase - grocerySavings);
          newMoney -= WEEKLY_RENT + groceryCost;
        }
        
        return {
          ...prev,
          gameDay: newDay,
          lastTick: now,
          money: newMoney,
          plants: newPlants,
          kitchen: {
            ...prev.kitchen,
            storage: decayedKitchen,
          },
        };
      });
    }, TICK_INTERVAL);
    
    return () => clearInterval(interval);
  }, [growthMultiplier, grocerySavings]);

  // === ACTIONS ===
  
  const buySeeds = useCallback((plantTypeId: string, quantity: number = 1) => {
    const plantType = getPlantType(plantTypeId);
    if (!plantType) return false;
    
    const cost = plantType.seedCost * quantity;
    
    setState(prev => {
      if (prev.money < cost) return prev;
      
      const newSeeds = new Map(prev.seeds);
      newSeeds.set(plantTypeId, (newSeeds.get(plantTypeId) || 0) + quantity);
      
      return {
        ...prev,
        money: prev.money - cost,
        seeds: newSeeds,
      };
    });
    
    return true;
  }, []);

  const buyPot = useCallback((potTypeId: string, slot: number) => {
    const potType = getPotType(potTypeId);
    if (!potType) return false;
    
    setState(prev => {
      if (prev.money < potType.cost) return prev;
      if (slot >= prev.equipment.table.potSlots) return prev;
      if (prev.equipment.pots.some(p => p.slot === slot)) return prev;
      
      const newPot: PotInstance = {
        id: generatePotId(),
        typeId: potTypeId,
        slot,
        plant: null,
      };
      
      return {
        ...prev,
        money: prev.money - potType.cost,
        equipment: {
          ...prev.equipment,
          pots: [...prev.equipment.pots, newPot],
        },
      };
    });
    
    return true;
  }, []);

  const plantSeed = useCallback((plantTypeId: string, potId: string) => {
    setState(prev => {
      const seedCount = prev.seeds.get(plantTypeId) || 0;
      if (seedCount <= 0) return prev;
      
      const pot = prev.equipment.pots.find(p => p.id === potId);
      if (!pot || pot.plant !== null) return prev;
      
      const plantId = generatePlantId();
      const hasLight = slotHasLight(pot.slot, prev.equipment.light.coverage);
      
      const newPlant: PlantInstance = {
        id: plantId,
        typeId: plantTypeId,
        plantedAt: Date.now(),
        growthProgress: 0,
        stage: 'seed',
        hasLight,
        potSlot: pot.slot,
      };
      
      const newSeeds = new Map(prev.seeds);
      newSeeds.set(plantTypeId, seedCount - 1);
      
      const newPots = prev.equipment.pots.map(p =>
        p.id === potId ? { ...p, plant: plantId } : p
      );
      
      const newPlants = new Map(prev.plants);
      newPlants.set(plantId, newPlant);
      
      return {
        ...prev,
        seeds: newSeeds,
        plants: newPlants,
        equipment: {
          ...prev.equipment,
          pots: newPots,
        },
      };
    });
  }, []);

  const harvestPlant = useCallback((plantId: string) => {
    setState(prev => {
      const plant = prev.plants.get(plantId);
      if (!plant || plant.stage !== 'harvestable') return prev;
      
      const plantType = getPlantType(plant.typeId);
      if (!plantType) return prev;
      
      // Calculate yield with modifiers
      let yieldAmount = plantType.yieldAmount;
      
      const pot = prev.equipment.pots.find(p => p.plant === plantId);
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
      
      // Remove plant, clear pot
      const newPlants = new Map(prev.plants);
      newPlants.delete(plantId);
      
      const newPots = prev.equipment.pots.map(p =>
        p.plant === plantId ? { ...p, plant: null } : p
      );
      
      return {
        ...prev,
        plants: newPlants,
        harvest: [...prev.harvest, harvested],
        equipment: {
          ...prev.equipment,
          pots: newPots,
        },
      };
    });
  }, [yieldMultiplier]);

  const sellHarvest = useCallback((harvestId: string) => {
    setState(prev => {
      const item = prev.harvest.find(h => h.id === harvestId);
      if (!item) return prev;
      
      const plantType = getPlantType(item.typeId);
      if (!plantType) return prev;
      
      const salePrice = plantType.sellPrice * item.quantity * item.freshness;
      
      return {
        ...prev,
        money: prev.money + Math.round(salePrice * 10) / 10,
        harvest: prev.harvest.filter(h => h.id !== harvestId),
      };
    });
  }, []);

  const storeInKitchen = useCallback((harvestId: string) => {
    setState(prev => {
      const item = prev.harvest.find(h => h.id === harvestId);
      if (!item) return prev;
      
      if (prev.kitchen.storage.length >= prev.kitchen.capacity) return prev;
      
      return {
        ...prev,
        harvest: prev.harvest.filter(h => h.id !== harvestId),
        kitchen: {
          ...prev.kitchen,
          storage: [...prev.kitchen.storage, item],
        },
      };
    });
  }, []);

  const buyEquipment = useCallback((type: 'table' | 'light', itemId: string) => {
    setState(prev => {
      if (type === 'table') {
        const table = getTableType(itemId);
        if (!table || prev.money < table.cost) return prev;
        
        return {
          ...prev,
          money: prev.money - table.cost,
          equipment: { ...prev.equipment, table },
        };
      } else {
        const light = getLightType(itemId);
        if (!light || prev.money < light.cost) return prev;
        
        // Update light coverage for existing plants
        const newPlants = new Map(prev.plants);
        for (const [id, plant] of newPlants) {
          newPlants.set(id, {
            ...plant,
            hasLight: slotHasLight(plant.potSlot, light.coverage),
          });
        }
        
        return {
          ...prev,
          money: prev.money - light.cost,
          plants: newPlants,
          equipment: { ...prev.equipment, light },
        };
      }
    });
  }, []);

  // Fast forward for dev/testing
  const skipTime = useCallback((days: number) => {
    setState(prev => ({
      ...prev,
      lastTick: prev.lastTick - (days * MS_PER_GAME_DAY),
    }));
  }, []);

  return {
    // State
    ...state,
    
    // Derived
    kitchenBonuses,
    growthMultiplier,
    yieldMultiplier,
    grocerySavings,
    weeklyExpenses: WEEKLY_RENT + Math.max(0, state.kitchen.weeklyGroceryBase - grocerySavings),
    
    // Actions
    buySeeds,
    buyPot,
    plantSeed,
    harvestPlant,
    sellHarvest,
    storeInKitchen,
    buyEquipment,
    skipTime,
    
    // Data
    PLANT_TYPES,
    TABLE_TYPES,
    LIGHT_TYPES,
    POT_TYPES,
  };
}
