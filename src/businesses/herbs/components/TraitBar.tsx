/**
 * Trait display bar component
 */

import React from 'react';
import { TraitKey } from '../types';
import { TRAIT_LABELS, VAGUE_DESCRIPTIONS, getTraitColors } from '../engine/traits';
import { Theme } from '../../../theme';

interface TraitBarProps {
  name: TraitKey;
  value: number;
  level: "hidden" | "vague" | "approx" | "precise";
  theme: Theme;
}

export function TraitBar({ name, value, level, theme }: TraitBarProps) {
  const TC = getTraitColors(theme);
  const color = TC[name];
  
  let displayVal: string | number;
  if (level === "hidden") {
    displayVal = "???";
  } else if (level === "precise") {
    displayVal = value;
  } else if (level === "approx") {
    displayVal = "~" + Math.round(value / 5) * 5;
  } else {
    displayVal = VAGUE_DESCRIPTIONS[name]?.[Math.min(4, Math.floor(value / 20))] || "?";
  }
  
  const barWidth = level === "hidden" ? "0%" : `${value}%`;
  const barColor = level === "hidden" 
    ? theme.border 
    : level === "vague" 
      ? `${color}55` 
      : level === "approx" 
        ? `${color}99` 
        : color;
  const textColor = level === "precise" 
    ? theme.text 
    : level === "approx" 
      ? theme.textSecondary 
      : theme.textMuted;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 3,
      fontSize: 11
    }}>
      <span style={{
        width: 52,
        color: theme.textSecondary,
        fontFamily: "monospace",
        fontSize: 10
      }}>
        {TRAIT_LABELS[name]}
      </span>
      <div style={{
        flex: 1,
        height: 8,
        background: theme.border,
        borderRadius: 4,
        overflow: "hidden"
      }}>
        <div style={{
          height: "100%",
          borderRadius: 4,
          transition: "width .4s",
          width: barWidth,
          background: barColor
        }} />
      </div>
      <span style={{
        width: 60,
        textAlign: "right",
        fontFamily: "monospace",
        fontSize: 10,
        color: textColor
      }}>
        {displayVal}
      </span>
    </div>
  );
}
