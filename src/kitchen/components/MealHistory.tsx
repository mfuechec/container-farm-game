/**
 * Meal History — This week's meals with savings tracking
 */

import React from 'react';
import { MealLog } from '../types';
import { Theme } from '../../theme/themes';

interface MealHistoryProps {
  mealHistory: MealLog[];
  weekStartDay: number;
  theme: Theme;
}

export function MealHistory({ mealHistory, weekStartDay, theme }: MealHistoryProps) {
  const thisWeek = mealHistory.filter(m => m.cookedAt >= weekStartDay);

  if (thisWeek.length === 0) {
    return (
      <div style={{
        padding: 16,
        background: theme.bgAlt,
        borderRadius: 8,
        marginBottom: 16,
        textAlign: 'center',
        color: theme.textMuted,
        fontSize: 13,
      }}>
        No meals cooked this week yet
      </div>
    );
  }

  const totalSaved = thisWeek.reduce((sum, m) => sum + m.grocerySavings, 0);
  const takeoutCount = thisWeek.filter(m => m.recipeId === null).length;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 8,
      }}>
        <div style={{
          fontSize: 11,
          color: theme.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          This Week's Meals
        </div>
        <div style={{ fontSize: 11, color: theme.money, fontWeight: 600 }}>
          Saved ${totalSaved}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {thisWeek.slice().reverse().map(meal => (
          <div
            key={meal.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: meal.recipeId === null ? theme.warningLight : theme.bgAlt,
              borderRadius: 6,
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>{meal.emoji}</span>
              <div>
                <div style={{ color: theme.text, fontWeight: 500 }}>
                  {meal.recipeName}
                </div>
                <div style={{ fontSize: 10, color: theme.textMuted }}>
                  Day {meal.cookedAt}
                </div>
              </div>
            </div>
            <div style={{
              fontSize: 11,
              color: meal.grocerySavings > 0 ? theme.money : theme.danger,
              fontWeight: 600,
            }}>
              {meal.grocerySavings > 0 ? `+$${meal.grocerySavings}` : '-$12'}
            </div>
          </div>
        ))}
      </div>

      {takeoutCount > 0 && (
        <div style={{
          fontSize: 10,
          color: theme.warning,
          marginTop: 6,
        }}>
          {takeoutCount} takeout order{takeoutCount > 1 ? 's' : ''} this week
        </div>
      )}
    </div>
  );
}
