/**
 * Apartment View - Blueprint layout of your home
 * 
 * Shows rooms, hobby spaces, and kitchen.
 */

import React from 'react';
import { useTheme } from '../theme';
import { ApartmentState, HobbySlot, HobbyType } from './types';
import { KitchenState } from '../kitchen/types';

interface ApartmentViewProps {
  apartment: ApartmentState;
  kitchen: KitchenState;
  onSelectHobby: (slot: HobbySlot) => void;
  onSelectKitchen: () => void;
  onMove: () => void;
  money: number;
  gameDay: number;
}

export function ApartmentView({
  apartment,
  kitchen,
  onSelectHobby,
  onSelectKitchen,
  onMove,
  money,
  gameDay,
}: ApartmentViewProps) {
  const { theme } = useTheme();
  const { housing, hobbySlots } = apartment;

  return (
    <div style={{
      background: theme.surface,
      borderRadius: theme.radiusLg,
      padding: 24,
      boxShadow: theme.shadow,
      border: `1px solid ${theme.border}`,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        gap: 8,
      }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, color: theme.text, fontSize: 18, fontWeight: 600 }}>
            {housing.emoji} {housing.name}
          </h2>
          <span style={{ fontSize: 12, color: theme.textSecondary }}>
            Rent: ${housing.rentPerWeek}/week · {hobbySlots.length} hobby space{hobbySlots.length > 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={onMove}
          style={{
            padding: '8px 12px',
            background: theme.bgAlt,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radiusMd,
            color: theme.textSecondary,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          🗺️ Move
        </button>
        <div style={{
          background: theme.moneyLight,
          padding: '8px 16px',
          borderRadius: theme.radiusMd,
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: theme.money }}>
            ${money.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Blueprint floor plan */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 500,
        margin: '0 auto',
        aspectRatio: '4/3',
        border: `2px solid ${theme.border}`,
        borderRadius: theme.radiusLg,
        background: theme.bgAlt,
        overflow: 'hidden',
      }}>
        {/* Grid pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(${theme.border}40 1px, transparent 1px),
            linear-gradient(90deg, ${theme.border}40 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }} />

        {/* Kitchen area - top left */}
        <div
          onClick={onSelectKitchen}
          style={{
            position: 'absolute',
            top: '5%',
            left: '5%',
            width: '35%',
            height: '40%',
            border: `2px solid ${theme.money}`,
            borderRadius: theme.radiusMd,
            background: `${theme.moneyLight}`,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: 28, marginBottom: 4 }}>🍳</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>Kitchen</span>
          <span style={{ fontSize: 10, color: theme.textSecondary }}>
            {kitchen.storage.length}/{kitchen.capacity} stored
          </span>
        </div>

        {/* Hobby space - right side */}
        {hobbySlots.map((slot, i) => (
          <HobbySpaceSlot
            key={i}
            slot={slot}
            onClick={() => onSelectHobby(slot)}
            style={{
              position: 'absolute',
              bottom: '10%',
              right: '5%',
              width: '50%',
              height: '55%',
            }}
            theme={theme}
          />
        ))}

        {/* Bed area indicator */}
        <div style={{
          position: 'absolute',
          bottom: '8%',
          left: '5%',
          width: '30%',
          height: '25%',
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radiusSm,
          background: `${theme.surfaceActive}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <span style={{ fontSize: 20 }}>🛏️</span>
          <span style={{ fontSize: 9, color: theme.textMuted }}>Bed</span>
        </div>

        {/* Door */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '45%',
          width: '10%',
          height: 6,
          background: theme.accent,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
        }} />
      </div>

      {/* Day indicator */}
      <div style={{
        marginTop: 16,
        textAlign: 'center',
        color: theme.textSecondary,
        fontSize: 12,
      }}>
        Day {Math.floor(gameDay)} · Week {Math.floor((gameDay - 1) / 7) + 1}
      </div>
    </div>
  );
}

function HobbySpaceSlot({
  slot,
  onClick,
  style,
  theme,
}: {
  slot: HobbySlot;
  onClick: () => void;
  style: React.CSSProperties;
  theme: any;
}) {
  const hasHobby = slot.hobby !== null;
  
  const hobbyInfo: Record<string, { emoji: string; name: string }> = {
    plants: { emoji: '🌱', name: 'Container Farm' },
    mushrooms: { emoji: '🍄', name: 'Mushroom Farm' },
    woodworking: { emoji: '🪵', name: 'Woodworking' },
  };
  
  const info = slot.hobby ? hobbyInfo[slot.hobby] : null;

  return (
    <div
      onClick={onClick}
      style={{
        ...style,
        border: hasHobby ? `2px solid ${theme.accent}` : `2px dashed ${theme.accent}`,
        borderRadius: theme.radiusLg,
        background: hasHobby ? theme.accentLight : `${theme.accent}08`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
      }}
    >
      {hasHobby ? (
        <>
          <span style={{ fontSize: 36, marginBottom: 8 }}>{info?.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: theme.accent }}>
            {info?.name}
          </span>
          <span style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>
            Click to manage →
          </span>
        </>
      ) : (
        <>
          <span style={{ fontSize: 12, color: theme.accent, fontWeight: 500, marginBottom: 8 }}>
            Hobby Space
          </span>
          <span style={{ fontSize: 28, opacity: 0.5, marginBottom: 8 }}>➕</span>
          <span style={{ fontSize: 11, color: theme.textSecondary }}>
            Click to start
          </span>
        </>
      )}
    </div>
  );
}
