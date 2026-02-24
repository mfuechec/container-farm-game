/**
 * Pantry & Kitchen View
 * 
 * Phase 1: Shows pantry contents and auto-generated daily meals
 */

import React from 'react';
import { 
  PantryState, PantryItem, Meal, 
  INGREDIENTS, STAPLE_IDS,
  getFreshness, getVarietyStats,
} from '../engine/pantryEngine';

interface PantryViewProps {
  pantry: PantryState;
  gameDay: number;
  todaysMeal: Meal | null;
  onBuyStaple: (ingredientId: string) => void;
  onBack: () => void;
  theme: any;
}

export function PantryView({
  pantry,
  gameDay,
  todaysMeal,
  onBuyStaple,
  onBack,
  theme,
}: PantryViewProps) {
  const varietyStats = getVarietyStats(gameDay);
  const recentMeals = pantry.mealHistory.slice(-7).reverse();
  
  return (
    <div style={{
      background: theme.surface,
      borderRadius: theme.radiusLg,
      padding: 24,
      boxShadow: theme.shadow,
    }}>
      {/* Header */}
      <button onClick={onBack} style={{
        background: 'none',
        border: 'none',
        color: theme.textSecondary,
        cursor: 'pointer',
        marginBottom: 16,
        fontSize: 14,
      }}>
        ← Back
      </button>

      <h2 style={{ margin: '0 0 16px', color: theme.text }}>
        🍳 Kitchen
      </h2>

      {/* Tonight's Dinner */}
      <TonightsDinner 
        meal={todaysMeal} 
        theme={theme} 
      />

      {/* Variety nudge */}
      {varietyStats.suggestion && (
        <div style={{
          padding: 12,
          background: theme.accentLight,
          borderRadius: theme.radiusMd,
          marginBottom: 16,
          fontSize: 13,
          color: theme.accent,
        }}>
          💡 {varietyStats.suggestion}
        </div>
      )}

      {/* Pantry */}
      <PantryGrid 
        items={pantry.items} 
        gameDay={gameDay}
        theme={theme} 
      />

      {/* Buy Staples */}
      <StaplesShop 
        currentPantry={pantry.items}
        onBuy={onBuyStaple}
        theme={theme} 
      />

      {/* Meal History */}
      <MealHistory 
        meals={recentMeals}
        theme={theme} 
      />

      {/* Stats */}
      <div style={{
        marginTop: 16,
        padding: 12,
        background: theme.bgAlt,
        borderRadius: theme.radiusMd,
        fontSize: 12,
        color: theme.textSecondary,
      }}>
        <div>🍽️ Meals cooked: {pantry.totalMealsCooked}</div>
        <div>🥗 Unique ingredients this week: {varietyStats.uniqueIngredientsThisWeek}</div>
        <div>🔥 Variety streak: {varietyStats.currentStreak} days</div>
      </div>
    </div>
  );
}

// Tonight's Dinner component
function TonightsDinner({ meal, theme }: { meal: Meal | null; theme: any }) {
  if (!meal) {
    return (
      <div style={{
        padding: 24,
        background: theme.bgAlt,
        borderRadius: theme.radiusMd,
        marginBottom: 16,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🍽️</div>
        <div style={{ color: theme.textMuted, fontSize: 14 }}>
          No ingredients to cook with yet
        </div>
        <div style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
          Harvest from your hobbies or buy some staples
        </div>
      </div>
    );
  }

  const ingredientEmojis = meal.ingredients
    .map(id => INGREDIENTS[id]?.icon || '🥘')
    .join(' ');

  return (
    <div style={{
      padding: 20,
      background: `linear-gradient(135deg, ${theme.accentLight}, ${theme.bgAlt})`,
      borderRadius: theme.radiusMd,
      marginBottom: 16,
      textAlign: 'center',
      border: `2px solid ${theme.accent}`,
    }}>
      <div style={{ 
        fontSize: 11, 
        color: theme.textSecondary, 
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}>
        Tonight's Dinner
      </div>
      
      <div style={{ fontSize: 32, marginBottom: 8 }}>
        {ingredientEmojis}
      </div>
      
      <div style={{ 
        fontSize: 18, 
        fontWeight: 600, 
        color: theme.text,
        marginBottom: 8,
      }}>
        {meal.name}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span 
            key={star} 
            style={{ 
              fontSize: 16,
              color: star <= meal.satisfaction ? '#fbbf24' : theme.border,
            }}
          >
            ★
          </span>
        ))}
      </div>

      {meal.isNew && (
        <div style={{
          marginTop: 8,
          fontSize: 11,
          color: theme.accent,
          fontWeight: 600,
        }}>
          ✨ New Recipe!
        </div>
      )}
    </div>
  );
}

// Pantry Grid
function PantryGrid({ 
  items, 
  gameDay,
  theme 
}: { 
  items: PantryItem[]; 
  gameDay: number;
  theme: any;
}) {
  if (items.length === 0) {
    return (
      <div style={{
        padding: 16,
        background: theme.bgAlt,
        borderRadius: theme.radiusMd,
        marginBottom: 16,
        textAlign: 'center',
        color: theme.textMuted,
        fontSize: 13,
      }}>
        Pantry is empty
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ 
        fontSize: 11, 
        color: theme.textSecondary, 
        marginBottom: 8,
        textTransform: 'uppercase',
      }}>
        Pantry
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: 8,
      }}>
        {items.map((item, idx) => {
          const ingredient = INGREDIENTS[item.ingredientId];
          if (!ingredient) return null;
          
          const freshness = getFreshness(item, gameDay);
          const freshnessColor = freshness > 0.8 
            ? theme.accent 
            : freshness > 0.5 
              ? theme.warning 
              : theme.danger;

          return (
            <div
              key={idx}
              style={{
                padding: 12,
                background: theme.bgAlt,
                borderRadius: theme.radiusMd,
                textAlign: 'center',
                border: item.source === 'grown' 
                  ? `2px solid ${theme.accent}` 
                  : `1px solid ${theme.border}`,
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>
                {ingredient.icon}
              </div>
              <div style={{ 
                fontSize: 11, 
                color: theme.text,
                fontWeight: 500,
              }}>
                {ingredient.name}
              </div>
              <div style={{ 
                fontSize: 10, 
                color: theme.textMuted,
              }}>
                ×{item.quantity}
              </div>
              {ingredient.shelfLife !== Infinity && (
                <div style={{ 
                  fontSize: 9, 
                  color: freshnessColor,
                  marginTop: 2,
                }}>
                  {Math.round(freshness * 100)}% fresh
                </div>
              )}
              {item.source === 'grown' && (
                <div style={{
                  fontSize: 8,
                  color: theme.accent,
                  marginTop: 2,
                }}>
                  🌱 homegrown
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Staples Shop
function StaplesShop({ 
  currentPantry,
  onBuy, 
  theme 
}: { 
  currentPantry: PantryItem[];
  onBuy: (id: string) => void; 
  theme: any;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ 
        fontSize: 11, 
        color: theme.textSecondary, 
        marginBottom: 8,
        textTransform: 'uppercase',
      }}>
        Buy Staples
      </div>
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        flexWrap: 'wrap',
      }}>
        {STAPLE_IDS.map(id => {
          const ingredient = INGREDIENTS[id];
          if (!ingredient) return null;
          
          const owned = currentPantry.find(i => i.ingredientId === id)?.quantity || 0;

          return (
            <button
              key={id}
              onClick={() => onBuy(id)}
              style={{
                padding: '8px 12px',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radiusMd,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: theme.text,
              }}
            >
              <span>{ingredient.icon}</span>
              <span>{ingredient.name}</span>
              <span style={{ color: theme.textMuted }}>
                ${ingredient.basePrice}
              </span>
              {owned > 0 && (
                <span style={{ 
                  color: theme.accent, 
                  fontSize: 10,
                  background: theme.accentLight,
                  padding: '2px 6px',
                  borderRadius: 10,
                }}>
                  ×{owned}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Meal History
function MealHistory({ meals, theme }: { meals: Meal[]; theme: any }) {
  if (meals.length === 0) return null;

  return (
    <div>
      <div style={{ 
        fontSize: 11, 
        color: theme.textSecondary, 
        marginBottom: 8,
        textTransform: 'uppercase',
      }}>
        This Week
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {meals.map((meal, idx) => (
          <div
            key={meal.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: theme.bgAlt,
              borderRadius: theme.radiusSm,
              fontSize: 12,
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              color: theme.text,
            }}>
              <span style={{ color: theme.textMuted, minWidth: 50 }}>
                Day {meal.cookedAt}
              </span>
              <span>{meal.name}</span>
              {meal.isNew && (
                <span style={{ fontSize: 10, color: theme.accent }}>✨</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 1 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <span 
                  key={star}
                  style={{ 
                    fontSize: 10,
                    color: star <= meal.satisfaction ? '#fbbf24' : theme.border,
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
