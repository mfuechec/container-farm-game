/**
 * Housing Preview - Blueprint preview modal for housing selection
 * 
 * Shows layout, hobby slots, rent, and move costs.
 */

import React from 'react';
import { useTheme } from '../theme';
import {
  HousingTier,
  calculateDeposit,
  calculateMoveTransaction,
  needsHobbySelection,
} from './types';

interface HousingPreviewProps {
  tier: HousingTier;
  currentTier: HousingTier;
  currentDeposit: number;
  currentHobbies: (string | null)[];
  money: number;
  onMove: () => void;
  onCancel: () => void;
  onNeedsHobbySelection: (maxSlots: number) => void;
}

export function HousingPreview({
  tier,
  currentTier,
  currentDeposit,
  currentHobbies,
  money,
  onMove,
  onCancel,
  onNeedsHobbySelection,
}: HousingPreviewProps) {
  const { theme } = useTheme();
  const transaction = calculateMoveTransaction(currentTier, tier, currentDeposit);
  const newDeposit = calculateDeposit(tier);
  const canAfford = transaction.netCost <= money;
  const isCurrentHome = tier.id === currentTier.id;
  
  const activeHobbies = currentHobbies.filter(Boolean).length;
  const needsSelection = needsHobbySelection(activeHobbies, tier.hobbySlots);

  const handleMoveClick = () => {
    if (needsSelection) {
      onNeedsHobbySelection(tier.hobbySlots);
    } else {
      onMove();
    }
  };

  return (
    <div style={{
      background: theme.surface,
      borderRadius: theme.radiusLg,
      padding: 20,
      boxShadow: theme.shadow,
      border: `1px solid ${theme.border}`,
      maxWidth: 400,
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px', color: theme.text, fontSize: 20, fontWeight: 600 }}>
            {tier.emoji} {tier.name}
          </h2>
          <p style={{ margin: 0, color: theme.textSecondary, fontSize: 13 }}>
            {tier.description}
          </p>
        </div>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            color: theme.textMuted,
            padding: 4,
          }}
        >
          ✕
        </button>
      </div>

      {/* Blueprint Preview */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '4/3',
        border: `2px solid ${theme.border}`,
        borderRadius: theme.radiusMd,
        background: theme.bgAlt,
        marginBottom: 16,
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
          backgroundSize: '20px 20px',
        }} />

        {/* Kitchen */}
        <div style={{
          position: 'absolute',
          top: '5%',
          left: '5%',
          width: '30%',
          height: '35%',
          border: `2px solid ${theme.money}`,
          borderRadius: theme.radiusSm,
          background: `${theme.moneyLight}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: 22 }}>🍳</span>
          <span style={{ fontSize: 10, color: theme.text, fontWeight: 500 }}>Kitchen</span>
        </div>

        {/* Hobby Slots */}
        {Array.from({ length: tier.hobbySlots }).map((_, i) => {
          const positions = getSlotPositions(tier.hobbySlots);
          const pos = positions[i];
          
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                ...pos,
                border: `2px dashed ${theme.accent}`,
                borderRadius: theme.radiusSm,
                background: `${theme.accent}10`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: 18, opacity: 0.5 }}>➕</span>
              <span style={{ fontSize: 9, color: theme.accent }}>
                Hobby {i + 1}
              </span>
            </div>
          );
        })}

        {/* Bed */}
        <div style={{
          position: 'absolute',
          bottom: '8%',
          left: '5%',
          width: '25%',
          height: '20%',
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radiusSm,
          background: theme.surfaceActive,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <span style={{ fontSize: 16 }}>🛏️</span>
        </div>
      </div>

      {/* Details */}
      <div style={{
        background: theme.bgAlt,
        borderRadius: theme.radiusMd,
        padding: 14,
        marginBottom: 16,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          fontSize: 13,
        }}>
          <div>
            <div style={{ color: theme.textMuted, fontSize: 11, marginBottom: 2 }}>
              Weekly Rent
            </div>
            <div style={{ color: theme.text, fontWeight: 600 }}>
              ${tier.rentPerWeek}/week
            </div>
          </div>
          <div>
            <div style={{ color: theme.textMuted, fontSize: 11, marginBottom: 2 }}>
              Hobby Slots
            </div>
            <div style={{ color: theme.text, fontWeight: 600 }}>
              {tier.hobbySlots} space{tier.hobbySlots > 1 ? 's' : ''}
            </div>
          </div>
          <div>
            <div style={{ color: theme.textMuted, fontSize: 11, marginBottom: 2 }}>
              Security Deposit
            </div>
            <div style={{ color: theme.text, fontWeight: 600 }}>
              ${newDeposit}
            </div>
          </div>
          <div>
            <div style={{ color: theme.textMuted, fontSize: 11, marginBottom: 2 }}>
              Kitchen
            </div>
            <div style={{ color: theme.text, fontWeight: 600 }}>
              {tier.hasKitchen ? '✓ Included' : '✗ None'}
            </div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      {!isCurrentHome && (
        <div style={{
          background: transaction.netCost > 0 ? `${theme.danger}10` : `${theme.accent}10`,
          border: `1px solid ${transaction.netCost > 0 ? `${theme.danger}40` : `${theme.accent}40`}`,
          borderRadius: theme.radiusMd,
          padding: 14,
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 8 }}>
            Moving Costs
          </div>
          <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
            <span>Old deposit returned:</span>
            <span style={{ float: 'right', color: theme.accent }}>
              +${transaction.depositReturned}
            </span>
          </div>
          <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 4 }}>
            <span>New deposit required:</span>
            <span style={{ float: 'right', color: theme.textSecondary }}>
              -${transaction.depositCharged}
            </span>
          </div>
          <div style={{
            borderTop: `1px solid ${theme.border}`,
            paddingTop: 8,
            marginTop: 8,
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 600,
          }}>
            <span style={{ color: theme.text }}>Net cost:</span>
            <span style={{
              color: transaction.netCost > 0 ? theme.danger : theme.accent,
            }}>
              {transaction.netCost > 0 ? '-' : '+'}${Math.abs(transaction.netCost)}
            </span>
          </div>
        </div>
      )}

      {/* Warning for downgrade */}
      {needsSelection && (
        <div style={{
          background: `${theme.danger}10`,
          border: `1px solid ${theme.danger}40`,
          borderRadius: theme.radiusMd,
          padding: 12,
          marginBottom: 16,
          fontSize: 12,
          color: theme.danger,
        }}>
          ⚠️ You have {activeHobbies} hobbies but this place only has {tier.hobbySlots} slot{tier.hobbySlots > 1 ? 's' : ''}.
          You'll need to choose which to keep.
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: theme.bgAlt,
            border: `1px solid ${theme.border}`,
            borderRadius: theme.radiusMd,
            color: theme.textSecondary,
            fontWeight: 500,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleMoveClick}
          disabled={!canAfford || isCurrentHome}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: canAfford && !isCurrentHome ? theme.accent : theme.border,
            border: 'none',
            borderRadius: theme.radiusMd,
            color: canAfford && !isCurrentHome ? 'white' : theme.textMuted,
            fontWeight: 600,
            cursor: canAfford && !isCurrentHome ? 'pointer' : 'not-allowed',
            fontSize: 14,
          }}
        >
          {isCurrentHome
            ? 'Current Home'
            : !canAfford
            ? `Need $${transaction.netCost - money} more`
            : needsSelection
            ? 'Choose Hobbies...'
            : 'Move Here'
          }
        </button>
      </div>
    </div>
  );
}

function getSlotPositions(count: number): React.CSSProperties[] {
  if (count === 1) {
    return [{
      right: '5%',
      top: '10%',
      width: '55%',
      height: '55%',
    }];
  }
  if (count === 2) {
    return [
      { right: '5%', top: '5%', width: '50%', height: '40%' },
      { right: '5%', bottom: '8%', width: '50%', height: '40%' },
    ];
  }
  // 3 slots
  return [
    { right: '5%', top: '5%', width: '35%', height: '40%' },
    { left: '40%', top: '5%', width: '15%', height: '40%' },
    { right: '5%', bottom: '8%', width: '55%', height: '35%' },
  ];
}

export default HousingPreview;
