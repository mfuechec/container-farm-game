/**
 * Hobby Select Modal - Choose which hobbies to keep when downgrading
 */

import React, { useState } from 'react';
import { useTheme } from '../theme';
import { HobbyType } from '../apartment/types';

interface HobbyInfo {
  index: number;
  type: HobbyType;
  name: string;
  emoji: string;
}

interface HobbySelectModalProps {
  hobbies: HobbyInfo[];
  maxSlots: number;
  onConfirm: (keepIndices: number[]) => void;
  onCancel: () => void;
}

const HOBBY_DISPLAY: Record<string, { name: string; emoji: string }> = {
  plants: { name: 'Container Farm', emoji: '🌱' },
  mushrooms: { name: 'Mushroom Farm', emoji: '🍄' },
  woodworking: { name: 'Woodworking', emoji: '🪵' },
};

export function HobbySelectModal({
  hobbies,
  maxSlots,
  onConfirm,
  onCancel,
}: HobbySelectModalProps) {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else if (newSelected.size < maxSlots) {
      newSelected.add(index);
    }
    setSelected(newSelected);
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
  };

  const canConfirm = selected.size === maxSlots;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      zIndex: 100,
    }}>
      <div style={{
        background: theme.surface,
        borderRadius: theme.radiusLg,
        padding: 24,
        maxWidth: 340,
        width: '100%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
      }}>
        <h2 style={{
          margin: '0 0 8px',
          color: theme.text,
          fontSize: 18,
          fontWeight: 600,
        }}>
          ⚠️ Choose Hobbies to Keep
        </h2>
        <p style={{
          margin: '0 0 20px',
          color: theme.textSecondary,
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          Your new place only has {maxSlots} hobby slot{maxSlots > 1 ? 's' : ''}.
          Select which {maxSlots === 1 ? 'hobby' : 'hobbies'} to keep:
        </p>

        {/* Hobby List */}
        <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
          {hobbies.map((hobby) => {
            const isSelected = selected.has(hobby.index);
            const display = hobby.type ? HOBBY_DISPLAY[hobby.type] : null;
            if (!display) return null;

            return (
              <button
                key={hobby.index}
                onClick={() => toggleSelection(hobby.index)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  background: isSelected ? theme.accentLight : theme.bgAlt,
                  border: `2px solid ${isSelected ? theme.accent : theme.border}`,
                  borderRadius: theme.radiusMd,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 28 }}>{display.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600,
                    color: isSelected ? theme.accent : theme.text,
                    fontSize: 14,
                  }}>
                    {display.name}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: theme.textMuted,
                    marginTop: 2,
                  }}>
                    Slot {hobby.index + 1}
                  </div>
                </div>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: `2px solid ${isSelected ? theme.accent : theme.border}`,
                  background: isSelected ? theme.accent : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 14,
                }}>
                  {isSelected && '✓'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selection Counter */}
        <div style={{
          textAlign: 'center',
          marginBottom: 16,
          color: canConfirm ? theme.accent : theme.textMuted,
          fontSize: 12,
          fontWeight: 500,
        }}>
          {selected.size} of {maxSlots} selected
        </div>

        {/* Warning */}
        <div style={{
          background: `${theme.danger}10`,
          border: `1px solid ${theme.danger}30`,
          borderRadius: theme.radiusSm,
          padding: 10,
          marginBottom: 16,
          fontSize: 11,
          color: theme.danger,
          textAlign: 'center',
        }}>
          ⚠️ Unselected hobbies will be lost permanently!
        </div>

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
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: canConfirm ? theme.danger : theme.border,
              border: 'none',
              borderRadius: theme.radiusMd,
              color: canConfirm ? 'white' : theme.textMuted,
              fontWeight: 600,
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              fontSize: 14,
            }}
          >
            Confirm Move
          </button>
        </div>
      </div>
    </div>
  );
}

export default HobbySelectModal;
