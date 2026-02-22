/**
 * Plant visualization component
 */

import React from 'react';
import { Plant } from '../types';
import { Theme } from '../../../theme';

interface PlantVisProps {
  plant: Plant;
  size?: number;
  onClick?: () => void;
  selected?: boolean;
  marker?: "breed" | "seeds" | "select";
  theme: Theme;
}

export function PlantVis({ 
  plant, 
  size = 48, 
  onClick, 
  selected, 
  marker,
  theme 
}: PlantVisProps) {
  const g = plant.traits;
  const hue = 90 + (g.flavorIntensity.genetic - 50) * 0.8;
  const sat = 30 + g.appearance.genetic * 0.5;
  const light = theme.name === 'dark' 
    ? 25 + (g.yield.genetic * 0.25) * g.yield.expression 
    : 35 + (g.yield.genetic * 0.25) * g.yield.expression;
  
  const leafN = 3 + Math.floor(g.yield.genetic / 20);
  const leafSz = 6 + (g.yield.genetic / 100) * 8;
  const stemH = 8 + (plant.growthStage * 20) * (g.growthSpeed.genetic / 80);
  const op = 0.3 + (plant.health / 100) * 0.7;
  const mat = plant.growthStage;
  
  const borderCol = marker === "breed" 
    ? theme.traits.flavorIntensity 
    : marker === "seeds" 
      ? theme.traits.hardiness 
      : theme.accent;

  const leaves: React.ReactNode[] = [];
  if (mat > 0.2) {
    const count = Math.ceil(leafN * mat);
    for (let i = 0; i < count; i++) {
      const a = (i * 137.5) * Math.PI / 180;
      const d = leafSz * mat * (0.5 + (i % 3) * 0.2);
      const cx = 20 + Math.cos(a) * d * 0.6;
      const cy = 37 - stemH * mat * (0.3 + (i / leafN) * 0.6) + Math.sin(a) * d * 0.3;
      const ls = leafSz * mat * (0.4 + g.appearance.genetic / 200);
      
      leaves.push(
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={ls * 0.7}
          ry={ls * 0.45}
          fill={`hsla(${hue},${sat}%,${light}%,.85)`}
          transform={`rotate(${a * 180 / Math.PI + 90},${cx},${cy})`}
        />
      );
    }
  }

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        position: "relative",
        cursor: onClick ? "pointer" : "default",
        opacity: op,
        border: selected ? `2px solid ${borderCol}` : "2px solid transparent",
        borderRadius: theme.radiusSm,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: selected ? `${borderCol}12` : "transparent",
        transition: theme.transitionFast
      }}
    >
      <svg width={size - 4} height={size - 4} viewBox="0 0 40 40">
        <ellipse cx={20} cy={37} rx={12} ry={3} fill="#8B6F47" opacity={0.5} />
        <line
          x1={20}
          y1={37}
          x2={20}
          y2={37 - stemH * mat}
          stroke={`hsl(${hue + 10},30%,35%)`}
          strokeWidth={1.5}
        />
        {leaves}
      </svg>
      
      {/* Growth bar */}
      <div style={{
        position: "absolute",
        bottom: 1,
        left: 4,
        right: 4,
        height: 2,
        background: theme.border,
        borderRadius: 1
      }}>
        <div style={{
          height: "100%",
          borderRadius: 1,
          transition: "width .3s",
          width: `${mat * 100}%`,
          background: mat >= 0.8 ? theme.accent : theme.textMuted
        }} />
      </div>
      
      {/* Breeding marker */}
      {plant.markedForBreeding && (
        <div style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 14,
          height: 14,
          background: theme.traits.flavorIntensity,
          borderRadius: "50%",
          fontSize: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.textInverse
        }}>♥</div>
      )}
      
      {/* Seeds collected marker */}
      {plant.seedsCollected && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 14,
          height: 14,
          background: theme.traits.hardiness,
          borderRadius: "50%",
          fontSize: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.textInverse
        }}>⊙</div>
      )}
    </div>
  );
}
