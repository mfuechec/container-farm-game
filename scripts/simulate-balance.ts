/**
 * Balance Simulation
 * 
 * Simulates a "dumb player" who follows a simple strategy:
 * 1. Buy pots when affordable
 * 2. Buy mint seeds (best $/day)
 * 3. Plant all seeds in empty pots
 * 4. Harvest and sell when ready
 * 
 * Run with: npx tsx scripts/simulate-balance.ts
 */

import { PLANT_TYPES, getPlantType, PlantInstance, HarvestedPlant } from '../src/hobbies/plants/types';
import { POT_TYPES, TABLE_TYPES, LIGHT_TYPES, PotInstance } from '../src/hobbies/plants/equipment';
import { INITIAL_ECONOMY, getRentForWeek } from '../src/economy/types';
import { engine, MS_PER_GAME_DAY } from '../src/engine';

// Game state
interface SimState {
  money: number;
  plants: Record<string, PlantInstance>;
  pots: PotInstance[];
  harvest: HarvestedPlant[];
  seeds: Record<string, number>;
  tableSlots: number;
  lightCoverage: number;
  gameDay: number;
  lastRentPaid: number;
  lastTick: number;
  gameStartTime: number;
}

// Initialize
function createInitialState(): SimState {
  return {
    money: INITIAL_ECONOMY.money,
    plants: {},
    pots: [],
    harvest: [],
    seeds: { mint: 3 },  // Start with 3 mint seeds
    tableSlots: 2,       // Small desk
    lightCoverage: 1,    // Desk lamp
    gameDay: 1,
    lastRentPaid: Date.now(),
    lastTick: Date.now(),
    gameStartTime: Date.now(),
  };
}

// Simulate one day
function simulateDay(state: SimState): SimState {
  const newState = { ...state };
  
  // Advance time by 1 day
  newState.lastTick = state.lastTick + MS_PER_GAME_DAY;
  newState.gameDay = state.gameDay + 1;
  
  // Process tick (growth, decay, rent)
  const currentWeek = Math.ceil(newState.gameDay / 7);
  const tickResult = engine.time.processTick({
    lastTick: state.lastTick,
    currentTime: newState.lastTick,
    gameStartTime: state.gameStartTime,
    plants: state.plants,
    pots: state.pots,
    harvest: state.harvest,
    lightCoverage: state.lightCoverage,
    kitchen: { storage: [], capacity: 10 },
    economy: { money: state.money, weeklyRent: 0, weeklyGroceryBase: INITIAL_ECONOMY.weeklyGroceryBase },
    rentPerWeek: getRentForWeek(currentWeek),
    groceryBase: INITIAL_ECONOMY.weeklyGroceryBase,
    lastRentPaid: state.lastRentPaid,
  });
  
  newState.plants = tickResult.plants;
  newState.harvest = tickResult.harvest;
  newState.money = tickResult.economy.money;
  newState.lastRentPaid = tickResult.lastRentPaid;
  
  // Log rent events
  for (const event of tickResult.events) {
    if (event.type === 'rent_paid') {
      console.log(`  💸 Week ${event.data.week}: Rent $${event.data.rent}, Groceries $${event.data.groceries}`);
    }
  }
  
  return newState;
}

// AI actions
function dumbPlayerActions(state: SimState): SimState {
  let newState = { ...state };
  
  // 1. Harvest ready plants
  for (const [id, plant] of Object.entries(newState.plants)) {
    if (plant.stage === 'harvestable') {
      const plantType = getPlantType(plant.typeId)!;
      const revenue = plantType.sellPrice * plantType.yieldAmount;
      newState.money += revenue;
      
      // Remove plant and free pot
      delete newState.plants[id];
      newState.pots = newState.pots.map(p => 
        p.plant === id ? { ...p, plant: null } : p
      );
      
      console.log(`  🌿 Harvested ${plantType.name}: +$${revenue.toFixed(1)}`);
    }
  }
  
  // 2. Buy pots for empty slots (if affordable)
  const potCost = POT_TYPES[0].cost;
  while (newState.pots.length < newState.tableSlots && newState.money >= potCost) {
    const slot = newState.pots.length;
    newState.pots.push({
      id: `pot_${slot}`,
      typeId: 'basic_pot',
      slot,
      plant: null,
    });
    newState.money -= potCost;
    console.log(`  🪴 Bought pot: -$${potCost}`);
  }
  
  // 2b. Buy table upgrade if we have max pots and can afford it
  if (newState.pots.length >= newState.tableSlots && newState.tableSlots < 6) {
    const nextTable = TABLE_TYPES.find(t => t.potSlots > newState.tableSlots);
    if (nextTable && newState.money >= nextTable.cost) {
      newState.money -= nextTable.cost;
      newState.tableSlots = nextTable.potSlots;
      console.log(`  📚 Upgraded to ${nextTable.name}: -$${nextTable.cost} (${nextTable.potSlots} slots)`);
    }
  }
  
  // 3. Buy seeds if needed and affordable
  const emptyPots = newState.pots.filter(p => !p.plant).length;
  const seedsNeeded = emptyPots - (newState.seeds.mint || 0);
  const seedCost = getPlantType('mint')!.seedCost;
  
  if (seedsNeeded > 0 && newState.money >= seedCost) {
    const canBuy = Math.floor(newState.money / seedCost);
    const toBuy = Math.min(seedsNeeded, canBuy);
    newState.seeds.mint = (newState.seeds.mint || 0) + toBuy;
    newState.money -= toBuy * seedCost;
    if (toBuy > 0) {
      console.log(`  🌱 Bought ${toBuy} mint seeds: -$${toBuy * seedCost}`);
    }
  }
  
  // 4. Plant seeds in empty pots
  for (const pot of newState.pots) {
    if (!pot.plant && (newState.seeds.mint || 0) > 0) {
      const plantId = `plant_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      newState.plants[plantId] = {
        id: plantId,
        typeId: 'mint',
        plantedAt: Date.now(),
        growthProgress: 0,
        stage: 'seed',
        hasLight: pot.slot < newState.lightCoverage,
        potSlot: pot.slot,
      };
      pot.plant = plantId;
      newState.seeds.mint!--;
      console.log(`  🌱 Planted mint in slot ${pot.slot}`);
    }
  }
  
  return newState;
}

// Main simulation
function runSimulation(weeks: number) {
  console.log('='.repeat(60));
  console.log('ECONOMY BALANCE SIMULATION');
  console.log('='.repeat(60));
  console.log(`Strategy: Dumb player (buy pots → buy mint → plant → harvest → sell)`);
  console.log(`Duration: ${weeks} weeks (${weeks * 7} days)`);
  console.log('');
  
  let state = createInitialState();
  console.log(`Starting: $${state.money}, ${state.tableSlots} slots, ${state.seeds.mint} seeds`);
  console.log('');
  
  const history: { day: number; money: number; plants: number; week: number }[] = [];
  
  for (let day = 1; day <= weeks * 7; day++) {
    const week = Math.ceil(day / 7);
    const dayOfWeek = ((day - 1) % 7) + 1;
    
    // Log start of week
    if (dayOfWeek === 1) {
      console.log(`--- Week ${week} (Rent: $${getRentForWeek(week)}) ---`);
    }
    
    // Player actions at start of day
    state = dumbPlayerActions(state);
    
    // Advance time
    state = simulateDay(state);
    
    // Track history
    history.push({
      day,
      money: state.money,
      plants: Object.keys(state.plants).length,
      week,
    });
    
    // Log day summary
    console.log(`Day ${day}: $${state.money.toFixed(1)}, ${Object.keys(state.plants).length} plants growing`);
    
    // Check for bankruptcy
    if (state.money < -100) {
      console.log('');
      console.log('❌ BANKRUPTCY! Player went too far into debt.');
      break;
    }
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Final balance: $${state.money.toFixed(1)}`);
  console.log(`Pots: ${state.pots.length}/${state.tableSlots}`);
  console.log(`Plants growing: ${Object.keys(state.plants).length}`);
  console.log('');
  
  // Weekly summary
  console.log('Weekly breakdown:');
  for (let w = 1; w <= weeks; w++) {
    const weekEnd = history.find(h => h.day === w * 7);
    if (weekEnd) {
      const rent = getRentForWeek(w);
      const status = weekEnd.money < 0 ? '🔴' : weekEnd.money < 20 ? '🟡' : '🟢';
      console.log(`  Week ${w}: ${status} $${weekEnd.money.toFixed(1)} (rent was $${rent})`);
    }
  }
  
  const survived = state.money > -100;
  console.log('');
  console.log(survived 
    ? '✅ BALANCE WORKS - Player survived!' 
    : '❌ BALANCE BROKEN - Player went bankrupt');
}

// Run it
runSimulation(8);
