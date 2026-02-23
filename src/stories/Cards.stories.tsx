/**
 * Card Stories
 * 
 * Card components used throughout the game.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { lightTheme, darkTheme, Theme } from '../theme/themes';
import React from 'react';

// Base card container
function Card({ 
  children, 
  theme,
  selected = false,
  hoverable = false,
  onClick,
}: { 
  children: React.ReactNode;
  theme: Theme;
  selected?: boolean;
  hoverable?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 16,
        background: selected ? `${theme.accent}15` : theme.surface,
        border: selected ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
        borderRadius: theme.radiusLg,
        boxShadow: theme.shadow,
        cursor: hoverable || onClick ? 'pointer' : 'default',
        transition: theme.transitionFast,
      }}
    >
      {children}
    </div>
  );
}

// Shop item card
function ShopItemCard({
  emoji,
  name,
  description,
  price,
  owned = false,
  canAfford = true,
  stats = [],
  onBuy,
  theme,
}: {
  emoji: string;
  name: string;
  description: string;
  price: number;
  owned?: boolean;
  canAfford?: boolean;
  stats?: string[];
  onBuy?: () => void;
  theme: Theme;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      background: owned ? `${theme.accent}15` : theme.bgAlt,
      border: owned ? `1px solid ${theme.accent}` : '1px solid transparent',
      borderRadius: theme.radiusMd,
    }}>
      <span style={{ fontSize: 24 }}>{emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: theme.text, fontSize: 14, fontWeight: 500 }}>
          {name}
          {owned && <span style={{ color: theme.accent, marginLeft: 8, fontSize: 11 }}>✓ owned</span>}
        </div>
        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
          {description}
        </div>
        {stats.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {stats.map((stat, i) => (
              <span key={i} style={{
                padding: '2px 6px',
                background: theme.surface,
                borderRadius: 4,
                fontSize: 10,
                color: theme.textSecondary,
              }}>
                {stat}
              </span>
            ))}
          </div>
        )}
      </div>
      {!owned && (
        <button
          onClick={onBuy}
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
            whiteSpace: 'nowrap',
          }}
        >
          {price === 0 ? 'Free' : `$${price}`}
        </button>
      )}
    </div>
  );
}

// Harvest item card
function HarvestCard({
  emoji,
  name,
  quantity,
  freshness,
  sellPrice,
  onSell,
  onKeep,
  kitchenFull = false,
  theme,
}: {
  emoji: string;
  name: string;
  quantity: number;
  freshness: number;
  sellPrice: number;
  onSell?: () => void;
  onKeep?: () => void;
  kitchenFull?: boolean;
  theme: Theme;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      background: theme.bgAlt,
      borderRadius: theme.radiusMd,
    }}>
      <span style={{ fontSize: 24 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: theme.text }}>{name} ×{quantity}</div>
        <div style={{ 
          fontSize: 11, 
          color: freshness > 0.5 ? theme.accent : freshness > 0.25 ? theme.warning : theme.danger,
        }}>
          {Math.round(freshness * 100)}% fresh
        </div>
      </div>
      <button
        onClick={onKeep}
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
        🏠 Keep
      </button>
      <button
        onClick={onSell}
        style={{
          padding: '6px 10px',
          background: theme.moneyLight,
          border: `1px solid ${theme.money}`,
          borderRadius: theme.radiusSm,
          color: theme.money,
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        💰 ${sellPrice.toFixed(1)}
      </button>
    </div>
  );
}

// Kitchen storage item card
function StorageCard({
  emoji,
  name,
  quantity,
  freshness,
  theme,
}: {
  emoji: string;
  name: string;
  quantity: number;
  freshness: number;
  theme: Theme;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      background: theme.bgAlt,
      borderRadius: theme.radiusMd,
    }}>
      <span style={{ fontSize: 24 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ color: theme.text }}>{name} ×{quantity.toFixed(1)}</div>
        <div style={{ fontSize: 11, color: theme.textMuted }}>
          {Math.round(freshness * 100)}% fresh
        </div>
      </div>
    </div>
  );
}

// Hobby selection card
function HobbyCard({
  emoji,
  name,
  description,
  disabled = false,
  onClick,
  theme,
}: {
  emoji: string;
  name: string;
  description: string;
  disabled?: boolean;
  onClick?: () => void;
  theme: Theme;
}) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        background: disabled ? theme.bgAlt : theme.surface,
        border: `2px solid ${disabled ? theme.border : theme.accent}`,
        borderRadius: theme.radiusMd,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{ fontSize: 32 }}>{emoji}</span>
      <div>
        <div style={{ fontWeight: 600, color: theme.text }}>{name}</div>
        <div style={{ fontSize: 12, color: theme.textSecondary }}>{description}</div>
      </div>
    </div>
  );
}

// Money display card
function MoneyCard({
  amount,
  theme,
}: {
  amount: number;
  theme: Theme;
}) {
  return (
    <div style={{
      background: theme.moneyLight,
      padding: '8px 16px',
      borderRadius: theme.radiusMd,
    }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: theme.money }}>
        ${amount.toFixed(0)}
      </span>
    </div>
  );
}

// Stat card for bonuses
function BonusTag({
  type,
  amount,
  source,
  theme,
}: {
  type: string;
  amount: number;
  source: string;
  theme: Theme;
}) {
  return (
    <span style={{
      padding: '4px 10px',
      background: theme.accentLight,
      borderRadius: theme.radiusFull,
      fontSize: 11,
      color: theme.accent,
    }}>
      +{Math.round(amount * 100)}% {type} ({source})
    </span>
  );
}

const meta: Meta = {
  title: 'Design System/Cards',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

export const ShopItems: StoryObj = {
  render: () => (
    <div style={{ 
      background: lightTheme.surface, 
      padding: 24, 
      borderRadius: 12,
      maxWidth: 400,
    }}>
      <h3 style={{ margin: '0 0 16px', fontFamily: 'system-ui', color: lightTheme.text }}>Shop Items</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        <ShopItemCard
          theme={lightTheme}
          emoji="🌿"
          name="Basil Seeds"
          description="3 days to mature"
          price={2}
          stats={['3d', '$5/ea']}
        />
        <ShopItemCard
          theme={lightTheme}
          emoji="🪴"
          name="Self-Watering Pot"
          description="Grows plants faster"
          price={25}
          stats={['+20% growth', '+10% yield']}
          owned
        />
        <ShopItemCard
          theme={lightTheme}
          emoji="💡"
          name="LED Panel"
          description="Full coverage grow light"
          price={150}
          canAfford={false}
          stats={['6 slots', '+50% boost']}
        />
      </div>
    </div>
  ),
};

export const HarvestItems: StoryObj = {
  render: () => (
    <div style={{ 
      background: lightTheme.surface, 
      padding: 24, 
      borderRadius: 12,
      maxWidth: 400,
    }}>
      <h3 style={{ margin: '0 0 16px', fontFamily: 'system-ui', color: lightTheme.text }}>Harvest</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        <HarvestCard
          theme={lightTheme}
          emoji="🌿"
          name="Basil"
          quantity={3}
          freshness={0.95}
          sellPrice={12.5}
        />
        <HarvestCard
          theme={lightTheme}
          emoji="🌱"
          name="Mint"
          quantity={2}
          freshness={0.65}
          sellPrice={6.0}
        />
        <HarvestCard
          theme={lightTheme}
          emoji="🍅"
          name="Cherry Tomatoes"
          quantity={5}
          freshness={0.2}
          sellPrice={3.5}
          kitchenFull
        />
      </div>
    </div>
  ),
};

export const KitchenStorage: StoryObj = {
  render: () => (
    <div style={{ 
      background: lightTheme.surface, 
      padding: 24, 
      borderRadius: 12,
      maxWidth: 400,
    }}>
      <h3 style={{ margin: '0 0 16px', fontFamily: 'system-ui', color: lightTheme.text }}>
        🍳 Kitchen (3/5)
      </h3>
      <div style={{ display: 'grid', gap: 8 }}>
        <StorageCard theme={lightTheme} emoji="🌿" name="Basil" quantity={2.5} freshness={0.9} />
        <StorageCard theme={lightTheme} emoji="🌱" name="Mint" quantity={1.0} freshness={0.75} />
        <StorageCard theme={lightTheme} emoji="🍅" name="Cherry Tomatoes" quantity={3.0} freshness={0.5} />
      </div>
    </div>
  ),
};

export const HobbySelection: StoryObj = {
  render: () => (
    <div style={{ 
      background: lightTheme.surface, 
      padding: 24, 
      borderRadius: 12,
      maxWidth: 400,
    }}>
      <h3 style={{ margin: '0 0 16px', fontFamily: 'system-ui', color: lightTheme.text }}>Start a Hobby</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        <HobbyCard
          theme={lightTheme}
          emoji="🌱"
          name="Container Farm"
          description="Grow herbs and vegetables"
        />
        <HobbyCard
          theme={lightTheme}
          emoji="🍄"
          name="Mushroom Farm"
          description="Coming soon..."
          disabled
        />
        <HobbyCard
          theme={lightTheme}
          emoji="🪵"
          name="Woodworking"
          description="Coming soon..."
          disabled
        />
      </div>
    </div>
  ),
};

export const MoneyAndBonuses: StoryObj = {
  render: () => (
    <div style={{ 
      background: lightTheme.surface, 
      padding: 24, 
      borderRadius: 12,
    }}>
      <h3 style={{ margin: '0 0 16px', fontFamily: 'system-ui', color: lightTheme.text }}>Money & Bonuses</h3>
      
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 12, color: lightTheme.textMuted, marginBottom: 8 }}>WALLET</h4>
        <MoneyCard amount={245} theme={lightTheme} />
      </div>
      
      <div>
        <h4 style={{ fontSize: 12, color: lightTheme.textMuted, marginBottom: 8 }}>ACTIVE BONUSES</h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <BonusTag theme={lightTheme} type="growth" amount={0.15} source="Basil" />
          <BonusTag theme={lightTheme} type="yield" amount={0.1} source="Mint" />
        </div>
      </div>
    </div>
  ),
};

export const DarkThemeCards: StoryObj = {
  render: () => (
    <div style={{ 
      background: darkTheme.bg, 
      padding: 24, 
      borderRadius: 12,
    }}>
      <h3 style={{ margin: '0 0 16px', fontFamily: 'system-ui', color: darkTheme.text }}>Dark Theme Cards</h3>
      
      <div style={{ display: 'grid', gap: 16, maxWidth: 400 }}>
        <ShopItemCard
          theme={darkTheme}
          emoji="🌿"
          name="Basil Seeds"
          description="3 days to mature"
          price={2}
          stats={['3d', '$5/ea']}
        />
        
        <HarvestCard
          theme={darkTheme}
          emoji="🌿"
          name="Basil"
          quantity={3}
          freshness={0.95}
          sellPrice={12.5}
        />
        
        <HobbyCard
          theme={darkTheme}
          emoji="🌱"
          name="Container Farm"
          description="Grow herbs and vegetables"
        />
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <MoneyCard amount={150} theme={darkTheme} />
          <BonusTag theme={darkTheme} type="growth" amount={0.15} source="Basil" />
        </div>
      </div>
    </div>
  ),
};
