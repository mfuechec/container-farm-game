/**
 * Toast Context
 * 
 * Provides toast notification functionality throughout the app.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Toast, ToastWithPosition, DEFAULT_TOAST_DURATION } from './types';

interface ToastContextValue {
  toasts: ToastWithPosition[];
  showToast: (toast: Omit<Toast, 'id'>, position?: { x: number; y: number }) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastWithPosition[]>([]);
  const toastQueueRef = useRef<ToastWithPosition[]>([]);
  
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  const showToast = useCallback((
    toast: Omit<Toast, 'id'>,
    position: { x: number; y: number } = { x: 50, y: 50 }
  ) => {
    const id = `toast_${++toastIdCounter}_${Date.now()}`;
    const duration = toast.duration ?? DEFAULT_TOAST_DURATION;
    
    const newToast: ToastWithPosition = {
      ...toast,
      id,
      position,
      createdAt: Date.now(),
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto-dismiss after duration
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }, [dismissToast]);
  
  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
