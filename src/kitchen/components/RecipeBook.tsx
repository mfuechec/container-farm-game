/**
 * Recipe Book — Shows discovered and undiscovered recipes
 */

import React, { useState } from 'react';
import { RECIPES } from '../../balance';
import { RecipeId, FoodItem, StapleItem } from '../types';
import { canMakeRecipe } from '../../engine/kitchenEngine';
import { Theme } from '../../theme/themes';

interface RecipeBookProps {
  discoveredRecipes: RecipeId[];
  storage: FoodItem[];
  staples: StapleItem[];
  theme: Theme;
}

export function RecipeBook({ discoveredRecipes, storage, staples, theme }: RecipeBookProps) {
  const [expanded, setExpanded] = useState(false);
  const discoveredSet = new Set(discoveredRecipes);
  const allRecipes = Object.entries(RECIPES) as [RecipeId, typeof RECIPES[RecipeId]][];

  // Group by tier
  const tiers = [1, 2, 3, 4];
  const tierNames = ['Simple', 'Standard', 'Complex', 'Gourmet'];

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: theme.textSecondary,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}
      >
        <span>Recipe Book ({discoveredRecipes.length}/{allRecipes.length})</span>
        <span style={{ fontSize: 14 }}>{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tiers.map((tier, ti) => {
            const recipes = allRecipes.filter(([, r]) => r.tier === tier);
            if (recipes.length === 0) return null;

            return (
              <div key={tier}>
                <div style={{
                  fontSize: 10,
                  color: theme.textMuted,
                  marginBottom: 6,
                  fontWeight: 600,
                }}>
                  {tierNames[ti]}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 6,
                }}>
                  {recipes.map(([id, recipe]) => {
                    const discovered = discoveredSet.has(id);
                    const canMake = discovered && canMakeRecipe(id, storage, staples);

                    return (
                      <div
                        key={id}
                        style={{
                          padding: 10,
                          background: canMake
                            ? theme.accentLight
                            : discovered
                              ? theme.bgAlt
                              : theme.surface,
                          border: `1px solid ${canMake ? theme.accent : theme.borderLight}`,
                          borderRadius: 8,
                          opacity: discovered ? 1 : 0.5,
                        }}
                      >
                        {discovered ? (
                          <>
                            <div style={{ fontSize: 20, marginBottom: 4 }}>{recipe.emoji}</div>
                            <div style={{
                              fontSize: 11,
                              fontWeight: 500,
                              color: theme.text,
                              marginBottom: 2,
                            }}>
                              {recipe.name}
                            </div>
                            <div style={{ fontSize: 10, color: theme.money }}>
                              Saves ${recipe.groceryValue}
                            </div>
                            {canMake && (
                              <div style={{
                                fontSize: 9,
                                color: theme.accent,
                                fontWeight: 600,
                                marginTop: 4,
                              }}>
                                Ready to cook
                              </div>
                            )}
                            <div style={{
                              fontSize: 9,
                              color: theme.textMuted,
                              marginTop: 4,
                              lineHeight: 1.3,
                            }}>
                              {formatIngredients(recipe.ingredients as Record<string, number>)}
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ fontSize: 20, marginBottom: 4 }}>???</div>
                            <div style={{
                              fontSize: 11,
                              color: theme.textMuted,
                              fontStyle: 'italic',
                            }}>
                              Tier {tier} recipe
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatIngredients(ingredients: Record<string, number>): string {
  return Object.entries(ingredients)
    .map(([key, qty]) => {
      const name = key.startsWith('_')
        ? key.replace(/^_any/, '').replace(/Distinct$/, ' (different)').replace(/([A-Z])/g, ' $1').trim()
        : key.replace(/_/g, ' ');
      return `${name} x${qty}`;
    })
    .join(', ');
}
