/**
 * PlantShop - Shop tab for purchasing seeds, equipment, and market stalls
 */

import React from 'react';
import { PLANT_TYPES } from '../types';
import { TABLE_TYPES, LIGHT_TYPES, TableType, LightType } from '../equipment';
import { MARKET_RENTALS, MarketRentalTier } from '../../../market/types';

export interface PlantShopProps {
  money: number;
  seeds: Record<string, number>;
  table: TableType;
  light: LightType;
  marketRentalTier: MarketRentalTier | null;
  onBuySeeds: (typeId: string) => void;
  onUpgradeTable: (tableId: string) => void;
  onUpgradeLight: (lightId: string) => void;
  onSetMarketRental: (tier: MarketRentalTier | null) => void;
  theme: any;
}

export function PlantShop({
  money,
  seeds,
  table,
  light,
  marketRentalTier,
  onBuySeeds,
  onUpgradeTable,
  onUpgradeLight,
  onSetMarketRental,
  theme,
}: PlantShopProps) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Seeds Section */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>
          Seeds
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {PLANT_TYPES.map(plant => {
            const owned = seeds[plant.id] || 0;
            const canAfford = money >= plant.seedCost;
            
            return (
              <div key={plant.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 10,
                background: theme.bgAlt,
                borderRadius: theme.radiusMd,
              }}>
                <span style={{ fontSize: 20 }}>{plant.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.text, fontSize: 13 }}>
                    {plant.name}
                    {owned > 0 && <span style={{ color: theme.accent, marginLeft: 6 }}>×{owned}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: theme.textMuted }}>
                    {plant.daysToMature}d · ${plant.sellPrice}/ea
                  </div>
                </div>
                <button
                  onClick={() => onBuySeeds(plant.id)}
                  disabled={!canAfford}
                  style={{
                    padding: '6px 12px',
                    background: canAfford ? theme.accent : theme.bgAlt,
                    border: `1px solid ${canAfford ? theme.accent : theme.border}`,
                    borderRadius: theme.radiusSm,
                    color: canAfford ? theme.textInverse : theme.textMuted,
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  ${plant.seedCost}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Tables Section */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>
          Tables
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {TABLE_TYPES.map(t => {
            const owned = table.id === t.id;
            const canAfford = money >= t.cost;
            
            return (
              <div key={t.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 10,
                background: owned ? `${theme.accent}15` : theme.bgAlt,
                border: owned ? `1px solid ${theme.accent}` : `1px solid transparent`,
                borderRadius: theme.radiusMd,
              }}>
                <span style={{ fontSize: 20 }}>{t.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.text, fontSize: 13 }}>
                    {t.name}
                    {owned && <span style={{ color: theme.accent, marginLeft: 6, fontSize: 10 }}>✓ owned</span>}
                  </div>
                  <div style={{ fontSize: 10, color: theme.textMuted }}>
                    {t.potSlots} slots · {t.description}
                  </div>
                </div>
                {!owned && (
                  <button
                    onClick={() => onUpgradeTable(t.id)}
                    disabled={!canAfford || t.cost === 0}
                    style={{
                      padding: '6px 12px',
                      background: canAfford ? theme.accent : theme.bgAlt,
                      border: `1px solid ${canAfford ? theme.accent : theme.border}`,
                      borderRadius: theme.radiusSm,
                      color: canAfford ? theme.textInverse : theme.textMuted,
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {t.cost === 0 ? 'Free' : `$${t.cost}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Lights Section */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>
          Lights
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {LIGHT_TYPES.map(l => {
            const owned = light.id === l.id;
            const canAfford = money >= l.cost;
            
            return (
              <div key={l.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 10,
                background: owned ? `${theme.accent}15` : theme.bgAlt,
                border: owned ? `1px solid ${theme.accent}` : `1px solid transparent`,
                borderRadius: theme.radiusMd,
              }}>
                <span style={{ fontSize: 20 }}>{l.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.text, fontSize: 13 }}>
                    {l.name}
                    {owned && <span style={{ color: theme.accent, marginLeft: 6, fontSize: 10 }}>✓ owned</span>}
                  </div>
                  <div style={{ fontSize: 10, color: theme.textMuted }}>
                    {l.coverage} coverage · {Math.round((l.growthBoost - 1) * 100)}% boost · {l.description}
                  </div>
                </div>
                {!owned && (
                  <button
                    onClick={() => onUpgradeLight(l.id)}
                    disabled={!canAfford || l.cost === 0}
                    style={{
                      padding: '6px 12px',
                      background: canAfford ? theme.accent : theme.bgAlt,
                      border: `1px solid ${canAfford ? theme.accent : theme.border}`,
                      borderRadius: theme.radiusSm,
                      color: canAfford ? theme.textInverse : theme.textMuted,
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {l.cost === 0 ? 'Free' : `$${l.cost}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Market Stall Section */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>
          Market Stall
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {(['weekly', 'biweekly', 'monthly'] as const).map(tier => {
            const rental = MARKET_RENTALS[tier];
            const isSelected = marketRentalTier === tier;
            
            return (
              <div key={tier} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 10,
                background: isSelected ? `${theme.accent}15` : theme.bgAlt,
                border: isSelected ? `1px solid ${theme.accent}` : `1px solid transparent`,
                borderRadius: theme.radiusMd,
              }}>
                <span style={{ fontSize: 20 }}>🏪</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.text, fontSize: 13 }}>
                    {rental.label} Stall
                    {isSelected && <span style={{ color: theme.accent, marginLeft: 6, fontSize: 10 }}>✓ active</span>}
                  </div>
                  <div style={{ fontSize: 10, color: theme.textMuted }}>
                    Market every {rental.frequencyDays} days · Sell at full price + freshness bonus
                  </div>
                </div>
                <button
                  onClick={() => onSetMarketRental(isSelected ? null : tier)}
                  style={{
                    padding: '6px 12px',
                    background: isSelected ? theme.surface : theme.accent,
                    border: `1px solid ${isSelected ? theme.border : theme.accent}`,
                    borderRadius: theme.radiusSm,
                    color: isSelected ? theme.textSecondary : theme.textInverse,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {isSelected ? 'Cancel' : `$${rental.cost}/${tier === 'monthly' ? 'mo' : tier === 'biweekly' ? '2wk' : 'wk'}`}
                </button>
              </div>
            );
          })}
          
          {/* No stall option */}
          {marketRentalTier && (
            <div style={{
              padding: 10,
              background: theme.bgAlt,
              borderRadius: theme.radiusMd,
              fontSize: 11,
              color: theme.textMuted,
              textAlign: 'center',
            }}>
              Wholesale is always available at 50% price
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
