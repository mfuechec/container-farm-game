/**
 * Toast Container
 * 
 * Renders all active toasts with proper positioning.
 */

import React from 'react';
import { useToast } from './ToastContext';
import { ToastNotification } from './ToastNotification';

interface ToastContainerProps {
  theme: {
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
    shadow: string;
    radiusMd: string | number;
  };
}

export function ToastContainer({ theme }: ToastContainerProps) {
  const { toasts } = useToast();
  
  if (toasts.length === 0) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {toasts.map(toast => (
        <ToastNotification key={toast.id} toast={toast} theme={theme} />
      ))}
    </div>
  );
}
