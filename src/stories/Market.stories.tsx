/**
 * Market System Stories
 * 
 * Stories for the farmers market and wholesale selling system.
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { ThemeProvider, useTheme } from '../theme';
import { 
  MarketRentalTier, 
  MARKET_RENTALS, 
  isMarketDay, 
  getNextMarketDay,
  INITIAL_MARKET 
} from '../market/types';
import { HarvestedPlant, getPlantType, PLANT_TYPES } from '../hobbies/plants/types';

// Mock harvest items for stories
const mockHarvest: HarvestedPlant[] = [
  { id: '1', typeId: 'basil', quantity: 3, freshness: 1.0, harvestedAt: Date.now() },
  { id: '2', typeId: 'mint', quantity: 2, freshness: 0.7, harvestedAt: Date.now() - 86400000 },
  { id: '3', typeId: 'parsley', quantity: 1, freshness: 0.4, harvestedAt: Date.now() - 172800000 },
];

// Harvest Item Component (extracted for stories)
function HarvestItem({ 
  item, 
  marketOpen,
  onKeep,
  onWholesale,
  onMarket,
}: { 
  item: HarvestedPlant;
  marketOpen: boolean;
  onKeep: () => void;
  onWholesale: () => void;
  onMarket: () => void;
}) {
  const { theme } = useTheme();
  const plantType = getPlantType(item.typeId);
  if (!plantType) return null;

  const wholesalePrice = Math.round(plantType.sellPrice * item.quantity * 0.5 * 10) / 10;
  const freshnessBonus = 0.9 + (item.freshness * 0.2);
  const marketPrice = Math.round(plantType.sellPrice * item.quantity * freshnessBonus * 10) / 10;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      background: theme.bgAlt,
      borderRadius: 8,
    }}>
      <span style={{ fontSize: 24 }}>{plantType.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: theme.text }}>{plantType.name} ×{item.quantity}</div>
        <div style={{ fontSize: 11, color: theme.textMuted }}>
          {Math.round(item.freshness * 100)}% fresh
        </div>
      </div>
      
      <button onClick={onKeep} style={{
        padding: '6px 10px',
        background: theme.surface,
        border: `1px solid ${theme.accent}`,
        borderRadius: 4,
        color: theme.accent,
        cursor: 'pointer',
        fontSize: 11,
      }}>
        🏠
      </button>
      
      <button onClick={onWholesale} style={{
        padding: '6px 10px',
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: 4,
        color: theme.textSecondary,
        cursor: 'pointer',
        fontSize: 11,
      }}>
        🚚 ${wholesalePrice}
      </button>
      
      <button 
        onClick={onMarket}
        disabled={!marketOpen}
        style={{
          padding: '6px 10px',
          background: marketOpen ? '#FFF8E1' : theme.bgAlt,
          border: `1px solid ${marketOpen ? '#D4A84B' : theme.border}`,
          borderRadius: 4,
          color: marketOpen ? '#D4A84B' : theme.textMuted,
          cursor: marketOpen ? 'pointer' : 'not-allowed',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        🏪 ${marketPrice}
      </button>
    </div>
  );
}

// Market Status Banner
function MarketStatus({ 
  rentalTier, 
  marketOpen, 
  lastMarketDay,
  currentDay,
}: { 
  rentalTier: MarketRentalTier;
  marketOpen: boolean;
  lastMarketDay: number;
  currentDay: number;
}) {
  const { theme } = useTheme();

  return (
    <div style={{
      padding: 12,
      marginBottom: 12,
      background: marketOpen ? '#E8F5E9' : theme.bgAlt,
      border: marketOpen ? '2px solid #5A9A6B' : `1px solid ${theme.border}`,
      borderRadius: 8,
    }}>
      {rentalTier ? (
        <div>
          <div style={{ fontWeight: 600, color: marketOpen ? '#5A9A6B' : theme.text }}>
            {marketOpen ? '🏪 Market is OPEN!' : '🏪 Farmers Market'}
          </div>
          <div style={{ fontSize: 11, color: theme.textMuted }}>
            {MARKET_RENTALS[rentalTier].label} stall (${MARKET_RENTALS[rentalTier].cost}/{rentalTier === 'monthly' ? 'mo' : rentalTier === 'biweekly' ? '2wk' : 'wk'})
            {!marketOpen && ` · Next: Day ${lastMarketDay + MARKET_RENTALS[rentalTier].frequencyDays}`}
          </div>
        </div>
      ) : (
        <div style={{ color: theme.textMuted, fontSize: 12 }}>
          No market stall · Rent one in Shop tab
        </div>
      )}
    </div>
  );
}

// Market Rental Selector
function MarketRentalSelector({ 
  currentTier, 
  onSelect 
}: { 
  currentTier: MarketRentalTier;
  onSelect: (tier: MarketRentalTier) => void;
}) {
  const { theme } = useTheme();

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {(['weekly', 'biweekly', 'monthly'] as const).map(tier => {
        const rental = MARKET_RENTALS[tier];
        const isSelected = currentTier === tier;
        
        return (
          <div key={tier} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: 10,
            background: isSelected ? '#E8F5E9' : theme.bgAlt,
            border: isSelected ? '1px solid #5A9A6B' : '1px solid transparent',
            borderRadius: 8,
          }}>
            <span style={{ fontSize: 20 }}>🏪</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: theme.text, fontSize: 13 }}>
                {rental.label} Stall
                {isSelected && <span style={{ color: '#5A9A6B', marginLeft: 6, fontSize: 10 }}>✓ active</span>}
              </div>
              <div style={{ fontSize: 10, color: theme.textMuted }}>
                Market every {rental.frequencyDays} days
              </div>
            </div>
            <button
              onClick={() => onSelect(isSelected ? null : tier)}
              style={{
                padding: '6px 12px',
                background: isSelected ? theme.surface : '#5A9A6B',
                border: `1px solid ${isSelected ? theme.border : '#5A9A6B'}`,
                borderRadius: 4,
                color: isSelected ? theme.textSecondary : 'white',
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
    </div>
  );
}

// Story wrapper
function StoryWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div style={{ padding: 20, maxWidth: 500 }}>
        {children}
      </div>
    </ThemeProvider>
  );
}

// Meta
const meta: Meta = {
  title: 'Systems/Market',
  decorators: [(Story) => <StoryWrapper><Story /></StoryWrapper>],
};

export default meta;

// Stories
export const HarvestItemWithMarketOpen: StoryObj = {
  render: () => (
    <HarvestItem 
      item={mockHarvest[0]} 
      marketOpen={true}
      onKeep={() => console.log('Keep clicked')}
      onWholesale={() => console.log('Wholesale clicked')}
      onMarket={() => console.log('Market clicked')}
    />
  ),
};

export const HarvestItemMarketClosed: StoryObj = {
  render: () => (
    <HarvestItem 
      item={mockHarvest[0]} 
      marketOpen={false}
      onKeep={() => console.log('Keep clicked')}
      onWholesale={() => console.log('Wholesale clicked')}
      onMarket={() => console.log('Market clicked')}
    />
  ),
};

export const HarvestItemLowFreshness: StoryObj = {
  render: () => (
    <HarvestItem 
      item={mockHarvest[2]} 
      marketOpen={true}
      onKeep={() => console.log('Keep clicked')}
      onWholesale={() => console.log('Wholesale clicked')}
      onMarket={() => console.log('Market clicked')}
    />
  ),
};

export const MarketStatusNoRental: StoryObj = {
  render: () => (
    <MarketStatus 
      rentalTier={null}
      marketOpen={false}
      lastMarketDay={0}
      currentDay={5}
    />
  ),
};

export const MarketStatusWeeklyOpen: StoryObj = {
  render: () => (
    <MarketStatus 
      rentalTier="weekly"
      marketOpen={true}
      lastMarketDay={0}
      currentDay={7}
    />
  ),
};

export const MarketStatusWeeklyClosed: StoryObj = {
  render: () => (
    <MarketStatus 
      rentalTier="weekly"
      marketOpen={false}
      lastMarketDay={7}
      currentDay={10}
    />
  ),
};

export const MarketStatusMonthly: StoryObj = {
  render: () => (
    <MarketStatus 
      rentalTier="monthly"
      marketOpen={false}
      lastMarketDay={0}
      currentDay={15}
    />
  ),
};

export const RentalSelectorNone: StoryObj = {
  render: () => {
    const [tier, setTier] = React.useState<MarketRentalTier>(null);
    return (
      <div>
        <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
          Market Stall
        </div>
        <MarketRentalSelector currentTier={tier} onSelect={setTier} />
      </div>
    );
  },
};

export const RentalSelectorWeekly: StoryObj = {
  render: () => {
    const [tier, setTier] = React.useState<MarketRentalTier>('weekly');
    return (
      <div>
        <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>
          Market Stall
        </div>
        <MarketRentalSelector currentTier={tier} onSelect={setTier} />
      </div>
    );
  },
};

export const FullHarvestView: StoryObj = {
  render: () => {
    const [items, setItems] = React.useState(mockHarvest);
    const [marketTier, setMarketTier] = React.useState<MarketRentalTier>('weekly');
    const marketOpen = true;

    const handleSell = (id: string, type: 'wholesale' | 'market') => {
      console.log(`Sold ${id} via ${type}`);
      setItems(items.filter(i => i.id !== id));
    };

    return (
      <div>
        <MarketStatus 
          rentalTier={marketTier}
          marketOpen={marketOpen}
          lastMarketDay={0}
          currentDay={7}
        />
        
        <div style={{ display: 'grid', gap: 8 }}>
          {items.map(item => (
            <HarvestItem 
              key={item.id}
              item={item} 
              marketOpen={marketOpen}
              onKeep={() => console.log('Keep', item.id)}
              onWholesale={() => handleSell(item.id, 'wholesale')}
              onMarket={() => handleSell(item.id, 'market')}
            />
          ))}
        </div>
        
        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: 32, color: '#999' }}>
            All sold!
          </div>
        )}
      </div>
    );
  },
};

export const PriceComparison: StoryObj = {
  render: () => {
    const { theme } = useTheme();
    
    return (
      <div style={{ padding: 16, background: '#FAF8F5', borderRadius: 8 }}>
        <h3 style={{ margin: '0 0 16px', color: '#2D2A26' }}>Price Comparison</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E8E4DE' }}>
              <th style={{ textAlign: 'left', padding: 8 }}>Item</th>
              <th style={{ textAlign: 'right', padding: 8 }}>🚚 Wholesale</th>
              <th style={{ textAlign: 'right', padding: 8 }}>🏪 Market (100%)</th>
              <th style={{ textAlign: 'right', padding: 8 }}>🏪 Market (70%)</th>
            </tr>
          </thead>
          <tbody>
            {PLANT_TYPES.map(plant => {
              const base = plant.sellPrice * 2; // Assume qty 2
              const wholesale = base * 0.5;
              const market100 = base * (0.9 + 1.0 * 0.2);
              const market70 = base * (0.9 + 0.7 * 0.2);
              
              return (
                <tr key={plant.id} style={{ borderBottom: '1px solid #E8E4DE' }}>
                  <td style={{ padding: 8 }}>{plant.emoji} {plant.name} ×2</td>
                  <td style={{ textAlign: 'right', padding: 8, color: '#666' }}>${wholesale.toFixed(1)}</td>
                  <td style={{ textAlign: 'right', padding: 8, color: '#5A9A6B', fontWeight: 600 }}>${market100.toFixed(1)}</td>
                  <td style={{ textAlign: 'right', padding: 8, color: '#D4A84B' }}>${market70.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ marginTop: 12, fontSize: 11, color: '#666' }}>
          * Wholesale = 50% base price<br />
          * Market = 90-110% based on freshness
        </div>
      </div>
    );
  },
};
