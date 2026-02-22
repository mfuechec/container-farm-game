/**
 * Environment slider control
 */

import React from 'react';
import { Theme } from '../../../theme';

interface EnvSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon: string;
  theme: Theme;
}

export function EnvSlider({ label, value, onChange, icon, theme }: EnvSliderProps) {
  const sc = value < 20 || value > 80 ? theme.danger : theme.accent;
  const st = value < 30 ? "LOW" : value > 70 ? "HIGH" : "OK";

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 1
      }}>
        <span style={{
          fontSize: 10,
          color: theme.textSecondary,
          fontFamily: "monospace"
        }}>
          {icon} {label}
        </span>
        <span style={{
          fontSize: 10,
          color: sc,
          fontFamily: "monospace"
        }}>
          {st}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ width: "100%", accentColor: sc }}
      />
    </div>
  );
}
