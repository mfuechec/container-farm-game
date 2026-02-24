/**
 * Toast Notification Component
 * 
 * Animated notification that rises and fades.
 */

import React, { useEffect, useState } from 'react';
import { ToastWithPosition, DEFAULT_TOAST_DURATION } from './types';

interface ToastNotificationProps {
  toast: ToastWithPosition;
  theme: {
    surface: string;
    text: string;
    textSecondary: string;
    accent: string;
    shadow: string;
    radiusMd: string | number;
  };
}

export function ToastNotification({ toast, theme }: ToastNotificationProps) {
  const [progress, setProgress] = useState(0);
  const duration = toast.duration ?? DEFAULT_TOAST_DURATION;
  
  useEffect(() => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);
      
      if (newProgress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [duration]);
  
  // Animation values
  const rise = progress * 60;  // Rise 60px
  const opacity = progress < 0.5 ? 1 : 1 - ((progress - 0.5) * 2);  // Fade in second half
  const scale = 1 + Math.sin(progress * Math.PI) * 0.05;  // Subtle pulse
  
  // Color based on type
  const bgColor = toast.type === 'combo' ? '#E8F5E9' : 
                  toast.type === 'achievement' ? '#FFF8E1' :
                  toast.type === 'warning' ? '#FFEBEE' : theme.surface;
  
  const borderColor = toast.type === 'combo' ? '#4CAF50' :
                      toast.type === 'achievement' ? '#FFC107' :
                      toast.type === 'warning' ? '#F44336' : theme.accent;

  return (
    <div
      style={{
        position: 'absolute',
        left: toast.position.x,
        top: toast.position.y - rise,
        transform: `translate(-50%, -100%) scale(${scale})`,
        opacity,
        pointerEvents: 'none',
        zIndex: 1000,
        
        // Visual styling
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: theme.radiusMd,
        padding: '8px 16px',
        boxShadow: theme.shadow,
        
        // Text
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {toast.emoji && (
        <span style={{ fontSize: 18, marginRight: 6 }}>{toast.emoji}</span>
      )}
      <span style={{ 
        fontWeight: 600, 
        color: theme.text,
        fontSize: 14,
      }}>
        {toast.title}
      </span>
      {toast.subtitle && (
        <div style={{ 
          fontSize: 11, 
          color: theme.textSecondary,
          marginTop: 2,
        }}>
          {toast.subtitle}
        </div>
      )}
    </div>
  );
}
