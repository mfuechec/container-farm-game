/**
 * HarvestManager - Harvest tab for managing harvested plants
 * 
 * Displays harvest items with options to:
 * - Store in kitchen
 * - Sell wholesale (50%)
 * - Sell at farmers market (100% + freshness bonus)
 */

import React from 'react';
import { HarvestedPlant, getPlantType } from '../types';
import { MARKET_RENTALS, MarketRentalTier, isMarketDay } from '../../../market/types';

export interface HarvestManagerProps {
  harvest: HarvestedPlant[];
  marketOpen: boolean;
  marketRentalTier: MarketRentalTier | null;
  lastMarketDay: number;
  kitchenFull: boolean;
  onStoreHarvest: (harvestId: string) => void;
  onSellWholesale: (harvestId: string) => void;
  onSellAtMarket: (harvestId: string) => void;
  theme: any;
}

export function HarvestManager({
  harvest,
  marketOpen,
  marketRentalTier,
  lastMarketDay,
  kitchenFull,
  onStoreHarvest,
  onSellWholesale,
  onSellAtMarket,
  theme,
}: HarvestManagerProps) {
  return (
    <div>
      {/* Market Status */}
      <div style={{
        padding: 12,
        marginBottom: 12,
        background: marketOpen ? `${theme.accent}15` : theme.bgAlt,
        border: marketOpen ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
        borderRadius: theme.radiusMd,
      }}>
        {marketRentalTier ? (
          <div>
            <div style={{ fontWeight: 600, color: marketOpen ? theme.accent : theme.text }}>
              {marketOpen ? '🏪 Market is OPEN!' : '🏪 Farmers Market'}
            </div>
            <div style={{ fontSize: 11, color: theme.textMuted }}>
              {MARKET_RENTALS[marketRentalTier].label} stall (${MARKET_RENTALS[marketRentalTier].cost}/{marketRentalTier === 'monthly' ? 'mo' : marketRentalTier === 'biweekly' ? '2wk' : 'wk'})
              {!marketOpen && ` · Next: Day ${lastMarketDay + MARKET_RENTALS[marketRentalTier].frequencyDays}`}
            </div>
          </div>
        ) : (
          <div style={{ color: theme.textMuted, fontSize: 12 }}>
            No market stall · Rent one in Shop tab
          </div>
        )}
      </div>

      {/* Harvest Items */}
      {harvest.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: theme.textMuted }}>
          No harvested plants yet
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {harvest.map(item => {
            const plantType = getPlantType(item.typeId);
            if (!plantType) return null;
            
            // Calculate prices
            const wholesalePrice = Math.round(plantType.sellPrice * item.quantity * 0.5 * 10) / 10;
            const freshnessBonus = 0.9 + (item.freshness * 0.2);
            const marketPrice = Math.round(plantType.sellPrice * item.quantity * freshnessBonus * 10) / 10;
            
            return (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                background: theme.bgAlt,
                borderRadius: theme.radiusMd,
              }}>
                <span style={{ fontSize: 24 }}>{plantType.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.text }}>{plantType.name} ×{Math.round(item.quantity)}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>
                    {Math.round(item.freshness * 100)}% fresh
                  </div>
                </div>
                
                {/* Keep button */}
                <button
                  onClick={() => onStoreHarvest(item.id)}
                  disabled={kitchenFull}
                  style={{
                    padding: '6px 10px',
                    background: kitchenFull ? theme.bgAlt : theme.surface,
                    border: `1px solid ${kitchenFull ? theme.border : theme.accent}`,
                    borderRadius: theme.radiusSm,
                    color: kitchenFull ? theme.textMuted : theme.accent,
                    cursor: kitchenFull ? 'not-allowed' : 'pointer',
                    fontSize: 11,
                  }}
                >
                  🏠
                </button>
                
                {/* Wholesale button (always available) */}
                <button
                  onClick={() => onSellWholesale(item.id)}
                  style={{
                    padding: '6px 10px',
                    background: theme.surface,
                    border: `1px solid ${theme.border}`,
                    borderRadius: theme.radiusSm,
                    color: theme.textSecondary,
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                  title="Wholesale (50%)"
                >
                  🚚 ${wholesalePrice}
                </button>
                
                {/* Market button (only when open) */}
                <button
                  onClick={() => onSellAtMarket(item.id)}
                  disabled={!marketOpen}
                  style={{
                    padding: '6px 10px',
                    background: marketOpen ? theme.moneyLight : theme.bgAlt,
                    border: `1px solid ${marketOpen ? theme.money : theme.border}`,
                    borderRadius: theme.radiusSm,
                    color: marketOpen ? theme.money : theme.textMuted,
                    cursor: marketOpen ? 'pointer' : 'not-allowed',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                  title={marketOpen ? "Farmers Market (100% + freshness)" : "Market closed"}
                >
                  🏪 ${marketPrice}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
