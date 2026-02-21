/**
 * Side Hustle Simulator - Game Engine
 * 
 * This module exports all engine functionality and provides
 * initialization/shutdown hooks.
 */

// Re-export everything
export * from './types';
export * from './events';
export * from './tick';
export * from './save';
export * from './economy';

// Import for initialization
import { gameLoop } from './tick';
import { load, hasSave, startAutoSave, stopAutoSave } from './save';
import { initEconomy } from './economy';

/**
 * Initialize the game engine
 * Call this once on app startup
 */
export function initEngine(): void {
  console.log('Initializing Side Hustle Simulator engine...');
  
  // Initialize subsystems
  initEconomy();
  
  // Try to load existing save
  if (hasSave()) {
    console.log('Found existing save, loading...');
    load();
  } else {
    console.log('No save found, starting fresh');
  }
  
  // Start auto-save
  startAutoSave();
  
  // Start the game loop
  gameLoop.start();
  
  console.log('Engine initialized and running');
}

/**
 * Shut down the game engine
 * Call this on app close
 */
export function shutdownEngine(): void {
  console.log('Shutting down engine...');
  
  // Stop auto-save
  stopAutoSave();
  
  // Stop game loop
  gameLoop.stop();
  
  // Final save
  import('./save').then(({ save }) => save());
  
  console.log('Engine shut down');
}

/**
 * Pause the game (e.g., when window loses focus)
 */
export function pauseEngine(): void {
  gameLoop.stop();
}

/**
 * Resume the game
 */
export function resumeEngine(): void {
  gameLoop.start();
}
