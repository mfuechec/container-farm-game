/**
 * City Map - Top-down illustrated map for housing selection
 * 
 * Shows all housing tiers with pins, tooltips, and navigation.
 */

import React, { useState } from 'react';
import { useTheme } from '../theme';
import { HousingTier, HOUSING_TIERS, calculateDeposit } from './types';

interface CityMapProps {
  currentTierId: number;
  money: number;
  onSelectHousing: (tier: HousingTier) => void;
  onBack: () => void;
}

export function CityMap({
  currentTierId,
  money,
  onSelectHousing,
  onBack,
}: CityMapProps) {
  const { theme } = useTheme();
  const [hoveredTier, setHoveredTier] = useState<HousingTier | null>(null);

  return (
    <div style={{
      background: theme.surface,
      borderRadius: theme.radiusLg,
      padding: 20,
      boxShadow: theme.shadow,
      border: `1px solid ${theme.border}`,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: theme.textSecondary,
            cursor: 'pointer',
            fontSize: 14,
            padding: 0,
          }}
        >
          ← Back
        </button>
        <div style={{
          background: theme.moneyLight,
          padding: '6px 12px',
          borderRadius: theme.radiusMd,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: theme.money }}>
            ${money.toFixed(0)}
          </span>
        </div>
      </div>

      <h2 style={{ margin: '0 0 8px', color: theme.text, fontSize: 18, fontWeight: 600 }}>
        🗺️ Find New Housing
      </h2>
      <p style={{ margin: '0 0 16px', color: theme.textSecondary, fontSize: 13 }}>
        Click a location to preview and move
      </p>

      {/* Map Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4/3',
        background: `linear-gradient(180deg, ${theme.accentLight} 0%, ${theme.bgAlt} 100%)`,
        borderRadius: theme.radiusMd,
        overflow: 'hidden',
        border: `2px solid ${theme.border}`,
      }}>
        {/* Sky gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 100%)',
          opacity: 0.3,
        }} />

        {/* Simple trees/parks */}
        <MapDecoration emoji="🌳" x={10} y={50} />
        <MapDecoration emoji="🌲" x={15} y={35} />
        <MapDecoration emoji="🌳" x={85} y={60} />
        <MapDecoration emoji="🏪" x={40} y={80} />
        <MapDecoration emoji="☕" x={60} y={55} />

        {/* Roads */}
        <div style={{
          position: 'absolute',
          top: '85%',
          left: 0,
          right: 0,
          height: 20,
          background: theme.border,
          opacity: 0.5,
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '45%',
          width: 16,
          background: theme.border,
          opacity: 0.3,
        }} />

        {/* Housing Pins */}
        {HOUSING_TIERS.map((tier) => (
          <HousingPin
            key={tier.id}
            tier={tier}
            isCurrentHome={tier.id === currentTierId}
            isHovered={hoveredTier?.id === tier.id}
            onHover={() => setHoveredTier(tier)}
            onLeave={() => setHoveredTier(null)}
            onClick={() => onSelectHousing(tier)}
            theme={theme}
          />
        ))}

        {/* Tooltip */}
        {hoveredTier && (
          <MapTooltip tier={hoveredTier} theme={theme} />
        )}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: 12,
        display: 'flex',
        gap: 16,
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        {HOUSING_TIERS.map((tier) => (
          <div
            key={tier.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: tier.id === currentTierId ? theme.accent : theme.textSecondary,
              fontWeight: tier.id === currentTierId ? 600 : 400,
            }}
          >
            <span style={{ fontSize: 14 }}>{tier.emoji}</span>
            <span>{tier.name}</span>
            {tier.id === currentTierId && (
              <span style={{
                background: theme.accentLight,
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 9,
              }}>
                HOME
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function MapDecoration({ emoji, x, y }: { emoji: string; x: number; y: number }) {
  return (
    <span
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        fontSize: 20,
        transform: 'translate(-50%, -50%)',
        opacity: 0.6,
        pointerEvents: 'none',
      }}
    >
      {emoji}
    </span>
  );
}

interface HousingPinProps {
  tier: HousingTier;
  isCurrentHome: boolean;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  theme: any;
}

function HousingPin({
  tier,
  isCurrentHome,
  isHovered,
  onHover,
  onLeave,
  onClick,
  theme,
}: HousingPinProps) {
  const pinColor = isCurrentHome ? theme.money : theme.accent;
  const scale = isHovered ? 1.15 : 1;

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onTouchStart={onHover}
      onTouchEnd={onLeave}
      style={{
        position: 'absolute',
        left: `${tier.mapPosition.x}%`,
        top: `${tier.mapPosition.y}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        background: 'white',
        border: `3px solid ${pinColor}`,
        borderRadius: '50%',
        width: 48,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: isHovered
          ? `0 4px 12px ${pinColor}40`
          : `0 2px 8px ${theme.shadow}`,
        transition: 'all 0.2s ease',
        zIndex: isHovered ? 10 : 1,
      }}
    >
      <span style={{ fontSize: 24 }}>{tier.emoji}</span>
      {isCurrentHome && (
        <span
          style={{
            position: 'absolute',
            bottom: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            background: theme.money,
            color: 'white',
            fontSize: 8,
            fontWeight: 700,
            padding: '2px 4px',
            borderRadius: 4,
          }}
        >
          HOME
        </span>
      )}
    </button>
  );
}

interface MapTooltipProps {
  tier: HousingTier;
  theme: any;
}

function MapTooltip({ tier, theme }: MapTooltipProps) {
  const deposit = calculateDeposit(tier);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${Math.min(Math.max(tier.mapPosition.x, 25), 75)}%`,
        top: `${tier.mapPosition.y - 18}%`,
        transform: 'translateX(-50%)',
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radiusMd,
        padding: '10px 14px',
        boxShadow: theme.shadow,
        zIndex: 20,
        minWidth: 160,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
      }}>
        <span style={{ fontSize: 18 }}>{tier.emoji}</span>
        <span style={{ fontWeight: 600, color: theme.text, fontSize: 14 }}>
          {tier.name}
        </span>
      </div>
      <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
        ${tier.rentPerWeek}/week rent
      </div>
      <div style={{ fontSize: 11, color: theme.textMuted }}>
        {tier.hobbySlots} hobby slot{tier.hobbySlots > 1 ? 's' : ''} · ${deposit} deposit
      </div>
    </div>
  );
}

export default CityMap;
