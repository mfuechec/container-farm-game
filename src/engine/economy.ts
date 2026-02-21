/**
 * Economy system
 * 
 * Handles money, income, expenses, housing, and the day job.
 */

import { HOUSING_TIERS, HousingTier, Job, STARTER_JOB, STARTING_MONEY } from './types';
import { getPlayerState, updatePlayerState } from './save';
import { onNewDay, emitMoneyEarned, emitMoneySpent, emitNotification } from './events';
import { gameLoop } from './tick';

// =============================================================================
// MONEY OPERATIONS
// =============================================================================

/**
 * Get current money
 */
export function getMoney(): number {
  return getPlayerState().money;
}

/**
 * Add money (income)
 */
export function addMoney(amount: number, reason: string, businessId?: string): void {
  const state = getPlayerState();
  updatePlayerState({
    money: state.money + amount,
    totalEarnings: state.totalEarnings + amount,
  });
  
  emitMoneyEarned({ amount, reason, businessId });
}

/**
 * Spend money (returns false if insufficient funds)
 */
export function spendMoney(amount: number, reason: string, businessId?: string): boolean {
  const state = getPlayerState();
  if (state.money < amount) {
    return false;
  }
  
  updatePlayerState({
    money: state.money - amount,
  });
  
  emitMoneySpent({ amount, reason, businessId });
  return true;
}

/**
 * Check if player can afford something
 */
export function canAfford(amount: number): boolean {
  return getMoney() >= amount;
}

// =============================================================================
// HOUSING
// =============================================================================

/**
 * Get current housing tier
 */
export function getHousing(): HousingTier {
  const tierId = getPlayerState().housingTier;
  return HOUSING_TIERS.find(h => h.id === tierId) || HOUSING_TIERS[0];
}

/**
 * Get available hobby slots
 */
export function getAvailableSlots(): number {
  return getHousing().slots;
}

/**
 * Get daily rent
 */
export function getDailyRent(): number {
  return getHousing().rentPerDay;
}

/**
 * Check if player can upgrade housing
 */
export function canUpgradeHousing(): { canUpgrade: boolean; nextTier: HousingTier | null; reason?: string } {
  const currentTier = getHousing();
  const nextTier = HOUSING_TIERS.find(h => h.id === currentTier.id + 1);
  
  if (!nextTier) {
    return { canUpgrade: false, nextTier: null, reason: 'Already at max housing' };
  }
  
  const state = getPlayerState();
  
  if (state.money < nextTier.unlockSavings) {
    return { 
      canUpgrade: false, 
      nextTier, 
      reason: `Need $${nextTier.unlockSavings} savings (have $${Math.floor(state.money)})` 
    };
  }
  
  if (nextTier.requiresQuitJob && state.job.active) {
    return { canUpgrade: false, nextTier, reason: 'Must quit day job first' };
  }
  
  return { canUpgrade: true, nextTier };
}

/**
 * Upgrade housing (costs money equal to first month rent)
 */
export function upgradeHousing(): boolean {
  const { canUpgrade, nextTier } = canUpgradeHousing();
  
  if (!canUpgrade || !nextTier) {
    return false;
  }
  
  // Moving costs = first month rent
  const movingCost = nextTier.rentPerDay * 30;
  if (!spendMoney(movingCost, `Move to ${nextTier.name}`)) {
    return false;
  }
  
  updatePlayerState({ housingTier: nextTier.id });
  
  emitNotification({
    type: 'success',
    title: 'Moved!',
    message: `Welcome to your new ${nextTier.name}! You now have ${nextTier.slots} hobby slots.`,
  });
  
  return true;
}

// =============================================================================
// JOB
// =============================================================================

/**
 * Get current job
 */
export function getJob(): Job {
  return getPlayerState().job;
}

/**
 * Get daily job income
 */
export function getDailyJobIncome(): number {
  const job = getJob();
  return job.active ? job.dailyIncome : 0;
}

/**
 * Check if player can quit job
 */
export function canQuitJob(): { canQuit: boolean; reason?: string } {
  const state = getPlayerState();
  
  if (!state.job.active) {
    return { canQuit: false, reason: 'Already quit' };
  }
  
  // Require some minimum savings and passive income
  const minSavings = 10000;
  const minDailyIncome = getDailyRent() * 1.5; // Need 150% of rent from businesses
  
  // TODO: Calculate actual daily business income
  const businessIncome = 0; // Placeholder
  
  if (state.money < minSavings) {
    return { canQuit: false, reason: `Need $${minSavings} savings first` };
  }
  
  // For now, just require savings
  return { canQuit: true };
}

/**
 * Quit the day job
 */
export function quitJob(): boolean {
  const { canQuit } = canQuitJob();
  if (!canQuit) return false;
  
  updatePlayerState({
    job: { ...getJob(), active: false },
  });
  
  emitNotification({
    type: 'success',
    title: 'Freedom!',
    message: 'You quit your day job. Time to go full-time on your hobbies!',
  });
  
  return true;
}

// =============================================================================
// DAILY ECONOMY TICK
// =============================================================================

/**
 * Calculate net daily income/expense
 */
export function getDailyBalance(businessUpkeep: number = 0): number {
  const jobIncome = getDailyJobIncome();
  const rent = getDailyRent();
  
  return jobIncome - rent - businessUpkeep;
}

/**
 * Process daily economy (called on each new day)
 */
function processDailyEconomy(): void {
  const state = getPlayerState();
  const jobIncome = getDailyJobIncome();
  const rent = getDailyRent();
  
  console.log(`[Economy] New day! Processing daily economy...`);
  console.log(`[Economy] Job income: $${jobIncome}, Rent: $${rent}`);
  
  // Add job income
  if (jobIncome > 0) {
    addMoney(jobIncome, 'Day job income');
    console.log(`[Economy] Added job income: +$${jobIncome}`);
  }
  
  // Pay rent
  if (!spendMoney(rent, 'Rent')) {
    // Can't pay rent - trigger failure state
    console.log(`[Economy] Can't pay rent! Triggering bankruptcy...`);
    handleBankruptcy();
  } else {
    console.log(`[Economy] Paid rent: -$${rent}`);
  }
  
  console.log(`[Economy] Balance after daily processing: $${getMoney()}`);
  
  // TODO: Process business upkeep
}

/**
 * Handle bankruptcy (soft reset)
 */
function handleBankruptcy(): void {
  const state = getPlayerState();
  
  emitNotification({
    type: 'error',
    title: 'Evicted!',
    message: "You couldn't pay rent. Time to start over with a smaller place.",
  });
  
  // Reset to starter apartment and job
  updatePlayerState({
    housingTier: 1,
    job: { ...STARTER_JOB },
    money: STARTING_MONEY / 2, // Start with half the normal amount
  });
  
  // TODO: Let player keep one business
  // TODO: Keep unlocks and achievements
}

// =============================================================================
// INITIALIZATION
// =============================================================================

let initialized = false;

export function initEconomy(): void {
  if (initialized) return;
  initialized = true;
  
  // Subscribe to new day events
  onNewDay(() => {
    processDailyEconomy();
  });
}

// =============================================================================
// DEV TOOLS
// =============================================================================

if (typeof window !== 'undefined') {
  (window as any).__addMoney = addMoney;
  (window as any).__getMoney = getMoney;
  (window as any).__upgradeHousing = upgradeHousing;
  (window as any).__quitJob = quitJob;
}
