/**
 * Variety Status — Shows current meal diversity bonus
 */

import React from 'react';
import { VarietyStatus as VarietyStatusType, MealLog, getVarietyStatus } from '../types';
import { VARIETY_BONUS } from '../../balance';
import { Theme } from '../../theme/themes';

interface VarietyStatusProps {
  mealHistory: MealLog[];
  weekStartDay: number;
  gameDay: number;
  theme: Theme;
}

export function VarietyStatus({ mealHistory, weekStartDay, gameDay, theme }: VarietyStatusProps) {
  const status = getVarietyStatus(mealHistory, weekStartDay, gameDay);
  const maxTier = VARIETY_BONUS.tiers[VARIETY_BONUS.tiers.length - 1];
  const maxMeals = maxTier.minMeals;

  return (
    <div style={{
      padding: 12,
      background: status.tierName ? theme.accentLight : theme.bgAlt,
      borderRadius: 8,
      marginBottom: 16,
      border: status.tierName ? `1px solid ${theme.accent}` : `1px solid ${theme.borderLight}`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase' }}>
            Variety
          </span>
          {status.tierName && (
            <span style={{
              fontSize: 11,
              color: theme.accent,
              fontWeight: 600,
            }}>
              {status.tierEmoji} {status.tierName}
            </span>
          )}
        </div>
        {status.efficiencyBonus > 0 && (
          <span style={{
            fontSize: 11,
            color: theme.accent,
            fontWeight: 600,
          }}>
            +{Math.round(status.efficiencyBonus * 100)}% efficiency
          </span>
        )}
      </div>

      {/* Meal count icons */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {Array.from({ length: maxMeals }, (_, i) => (
          <div
            key={i}
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              background: i < status.uniqueMealsThisWeek ? theme.accent : theme.border,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: i < status.uniqueMealsThisWeek ? theme.textInverse : theme.textMuted,
              transition: 'all 0.2s',
            }}
          >
            {i < status.uniqueMealsThisWeek ? '✓' : ''}
          </div>
        ))}
        <span style={{ fontSize: 10, color: theme.textMuted, marginLeft: 4 }}>
          {status.uniqueMealsThisWeek}/{maxMeals} unique
        </span>
      </div>

      {/* Next tier hint */}
      {!status.tierName && (
        <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 6 }}>
          Cook {VARIETY_BONUS.tiers[0].minMeals - status.uniqueMealsThisWeek} more unique meals
          for {VARIETY_BONUS.tiers[0].emoji} {VARIETY_BONUS.tiers[0].name}
        </div>
      )}
      {status.tierName && status.uniqueMealsThisWeek < maxMeals && (
        <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 6 }}>
          {(() => {
            const nextTier = VARIETY_BONUS.tiers.find(t => t.minMeals > status.uniqueMealsThisWeek);
            if (!nextTier) return null;
            return `${nextTier.minMeals - status.uniqueMealsThisWeek} more for ${nextTier.emoji} ${nextTier.name}`;
          })()}
        </div>
      )}
    </div>
  );
}
