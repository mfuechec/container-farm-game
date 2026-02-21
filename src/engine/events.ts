/**
 * Event bus for cross-business communication and synergies
 */

import { Byproduct, GameEvent } from './types';

type EventHandler<T = unknown> = (payload: T) => void;

class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private eventLog: GameEvent[] = [];
  private maxLogSize = 1000;

  /**
   * Subscribe to an event type
   */
  on<T>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);
    
    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  /**
   * Emit an event
   */
  emit<T>(eventType: string, payload: T): void {
    const event: GameEvent = {
      type: eventType,
      payload,
      timestamp: Date.now(),
    };
    
    // Log event
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }
    
    // Notify handlers
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (e) {
          console.error(`Error in event handler for ${eventType}:`, e);
        }
      });
    }
  }

  /**
   * Get recent events of a type
   */
  getRecentEvents(eventType: string, limit = 10): GameEvent[] {
    return this.eventLog
      .filter(e => e.type === eventType)
      .slice(-limit);
  }

  /**
   * Clear all handlers (for cleanup)
   */
  clear(): void {
    this.handlers.clear();
    this.eventLog = [];
  }
}

// Singleton instance
export const eventBus = new EventBus();

// =============================================================================
// TYPED EVENT HELPERS
// =============================================================================

// Byproduct events (synergies between businesses)
export const emitByproduct = (byproduct: Byproduct) => 
  eventBus.emit('byproduct', byproduct);

export const onByproduct = (handler: EventHandler<Byproduct>) => 
  eventBus.on('byproduct', handler);

// Money events
export interface MoneyEvent {
  amount: number;
  reason: string;
  businessId?: string;
}

export const emitMoneyEarned = (event: MoneyEvent) => 
  eventBus.emit('money:earned', event);

export const emitMoneySpent = (event: MoneyEvent) => 
  eventBus.emit('money:spent', event);

export const onMoneyEarned = (handler: EventHandler<MoneyEvent>) => 
  eventBus.on('money:earned', handler);

export const onMoneySpent = (handler: EventHandler<MoneyEvent>) => 
  eventBus.on('money:spent', handler);

// Day events
export interface DayEvent {
  day: number;
  month: number;
  year: number;
}

export const emitNewDay = (event: DayEvent) => 
  eventBus.emit('time:newDay', event);

export const onNewDay = (handler: EventHandler<DayEvent>) => 
  eventBus.on('time:newDay', handler);

// Market events (for future marketplace)
export interface MarketEvent {
  type: 'open' | 'close';
  day: number;
}

export const emitMarket = (event: MarketEvent) => 
  eventBus.emit('market', event);

export const onMarket = (handler: EventHandler<MarketEvent>) => 
  eventBus.on('market', handler);

// Notification events (for UI toasts / tray notifications)
export interface NotificationEvent {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  businessId?: string;
}

export const emitNotification = (event: NotificationEvent) => 
  eventBus.emit('notification', event);

export const onNotification = (handler: EventHandler<NotificationEvent>) => 
  eventBus.on('notification', handler);
