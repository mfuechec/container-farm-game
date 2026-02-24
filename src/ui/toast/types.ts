/**
 * Toast Notification Types
 * 
 * Reusable notification system for combo discoveries, achievements, etc.
 */

export interface Toast {
  id: string;
  type: 'combo' | 'achievement' | 'warning' | 'info';
  title: string;
  subtitle?: string;
  emoji?: string;
  duration?: number;  // ms, default 1500
}

export interface ToastWithPosition extends Toast {
  position: { x: number; y: number };
  createdAt: number;
}

export const DEFAULT_TOAST_DURATION = 1500;
