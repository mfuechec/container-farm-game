/**
 * Freshness indicator bar
 */

import React from 'react';
import { Theme } from '../../../theme';

interface FreshnessBarProps {
  freshness: number;
  maxDays: number;
  daysOnShelf: number;
  theme: Theme;
}

export function FreshnessBar({ freshness, maxDays, daysOnShelf, theme }: FreshnessBarProps) {
  const col = freshness > 0.6 
    ? theme.accent 
    : freshness > 0.3 
      ? theme.money 
      : theme.danger;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 10
    }}>
      <span style={{
        color: theme.textMuted,
        fontFamily: "monospace",
        width: 50
      }}>
        Fresh
      </span>
      <div style={{
        flex: 1,
        height: 6,
        background: theme.border,
        borderRadius: 3,
        overflow: "hidden"
      }}>
        <div style={{
          height: "100%",
          borderRadius: 3,
          width: `${Math.round(freshness * 100)}%`,
          background: col,
          transition: "width .3s"
        }} />
      </div>
      <span style={{
        color: col,
        fontFamily: "monospace",
        fontSize: 9
      }}>
        {daysOnShelf}/{maxDays}d
      </span>
    </div>
  );
}
