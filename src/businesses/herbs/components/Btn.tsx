/**
 * Themed button component
 */

import React from 'react';
import { Theme } from '../../../theme';

interface BtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  color?: string;
  bg?: string;
  border?: string;
  style?: React.CSSProperties;
  theme: Theme;
}

export function Btn({ 
  children, 
  onClick, 
  disabled, 
  color, 
  bg, 
  border, 
  style, 
  theme 
}: BtnProps) {
  const btnColor = color || theme.accent;
  const btnBg = bg || theme.accentLight;
  const btnBorder = border || theme.accent;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 12px",
        background: disabled ? theme.bgAlt : btnBg,
        border: `1px solid ${disabled ? theme.border : btnBorder}`,
        borderRadius: theme.radiusMd,
        color: disabled ? theme.textMuted : btnColor,
        cursor: disabled ? "default" : "pointer",
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "inherit",
        transition: theme.transitionFast,
        ...style
      }}
    >
      {children}
    </button>
  );
}
