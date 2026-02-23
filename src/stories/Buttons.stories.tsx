/**
 * Button Stories
 * 
 * All button variants used in the game UI.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { lightTheme, darkTheme, Theme } from '../theme/themes';
import React from 'react';

// Primary action button
function PrimaryButton({ 
  children, 
  disabled = false,
  onClick,
  theme,
}: { 
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  theme: Theme;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 20px',
        background: disabled ? theme.bgAlt : theme.accent,
        border: `1px solid ${disabled ? theme.border : theme.accent}`,
        borderRadius: theme.radiusMd,
        color: disabled ? theme.textMuted : theme.textInverse,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 14,
        transition: theme.transitionFast,
      }}
    >
      {children}
    </button>
  );
}

// Secondary/outline button
function SecondaryButton({ 
  children, 
  disabled = false,
  onClick,
  theme,
}: { 
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  theme: Theme;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 20px',
        background: 'none',
        border: `1px solid ${disabled ? theme.border : theme.accent}`,
        borderRadius: theme.radiusMd,
        color: disabled ? theme.textMuted : theme.accent,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 14,
        transition: theme.transitionFast,
      }}
    >
      {children}
    </button>
  );
}

// Ghost/text button
function GhostButton({ 
  children, 
  onClick,
  theme,
}: { 
  children: React.ReactNode;
  onClick?: () => void;
  theme: Theme;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 12px',
        background: 'none',
        border: 'none',
        borderRadius: theme.radiusSm,
        color: theme.textSecondary,
        cursor: 'pointer',
        fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}

// Dev/debug button (small, subdued)
function DevButton({ 
  children, 
  onClick,
  theme,
}: { 
  children: React.ReactNode;
  onClick?: () => void;
  theme: Theme;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 10px',
        background: theme.bgAlt,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radiusSm,
        color: theme.textSecondary,
        cursor: 'pointer',
        fontSize: 11,
      }}
    >
      {children}
    </button>
  );
}

// Price button (shop)
function PriceButton({ 
  price, 
  canAfford = true,
  onClick,
  theme,
}: { 
  price: number;
  canAfford?: boolean;
  onClick?: () => void;
  theme: Theme;
}) {
  return (
    <button
      onClick={onClick}
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
      ${price}
    </button>
  );
}

// Sell button (money themed)
function SellButton({ 
  price, 
  onClick,
  theme,
}: { 
  price: number;
  onClick?: () => void;
  theme: Theme;
}) {
  return (
    <button
      onClick={onClick}
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
      💰 ${price}
    </button>
  );
}

// Keep/store button
function KeepButton({ 
  disabled = false,
  onClick,
  theme,
}: { 
  disabled?: boolean;
  onClick?: () => void;
  theme: Theme;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 10px',
        background: disabled ? theme.bgAlt : theme.surface,
        border: `1px solid ${disabled ? theme.border : theme.accent}`,
        borderRadius: theme.radiusSm,
        color: disabled ? theme.textMuted : theme.accent,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 11,
      }}
    >
      🏠 Keep
    </button>
  );
}

// Icon button
function IconButton({ 
  icon, 
  onClick,
  theme,
}: { 
  icon: string;
  onClick?: () => void;
  theme: Theme;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radiusSm,
        cursor: 'pointer',
        fontSize: 16,
      }}
    >
      {icon}
    </button>
  );
}

// Button row container
function ButtonRow({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: 12, 
      alignItems: 'center',
      padding: 16,
      background: theme.surface,
      borderRadius: 8,
      marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

const meta: Meta = {
  title: 'Design System/Buttons',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

export const AllVariantsLight: StoryObj = {
  render: () => (
    <div style={{ background: lightTheme.bg, padding: 24, borderRadius: 12 }}>
      <h3 style={{ margin: '0 0 16px', fontFamily: 'system-ui', color: lightTheme.text }}>Light Theme Buttons</h3>
      
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 12, color: lightTheme.textMuted, marginBottom: 8 }}>PRIMARY</h4>
        <ButtonRow theme={lightTheme}>
          <PrimaryButton theme={lightTheme}>Buy Seeds</PrimaryButton>
          <PrimaryButton theme={lightTheme} disabled>Disabled</PrimaryButton>
        </ButtonRow>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 12, color: lightTheme.textMuted, marginBottom: 8 }}>SECONDARY</h4>
        <ButtonRow theme={lightTheme}>
          <SecondaryButton theme={lightTheme}>Cancel</SecondaryButton>
          <SecondaryButton theme={lightTheme} disabled>Disabled</SecondaryButton>
        </ButtonRow>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 12, color: lightTheme.textMuted, marginBottom: 8 }}>GHOST / DEV</h4>
        <ButtonRow theme={lightTheme}>
          <GhostButton theme={lightTheme}>← Back</GhostButton>
          <DevButton theme={lightTheme}>+1 Day</DevButton>
          <DevButton theme={lightTheme}>+1 Week</DevButton>
          <IconButton theme={lightTheme} icon="☀️" />
        </ButtonRow>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 12, color: lightTheme.textMuted, marginBottom: 8 }}>SHOP / TRANSACTION</h4>
        <ButtonRow theme={lightTheme}>
          <PriceButton theme={lightTheme} price={5} canAfford={true} />
          <PriceButton theme={lightTheme} price={100} canAfford={false} />
          <SellButton theme={lightTheme} price={12.5} />
          <KeepButton theme={lightTheme} />
          <KeepButton theme={lightTheme} disabled />
        </ButtonRow>
      </div>
    </div>
  ),
};

export const AllVariantsDark: StoryObj = {
  render: () => (
    <div style={{ background: darkTheme.bg, padding: 24, borderRadius: 12 }}>
      <h3 style={{ margin: '0 0 16px', fontFamily: 'system-ui', color: darkTheme.text }}>Dark Theme Buttons</h3>
      
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 12, color: darkTheme.textMuted, marginBottom: 8 }}>PRIMARY</h4>
        <ButtonRow theme={darkTheme}>
          <PrimaryButton theme={darkTheme}>Buy Seeds</PrimaryButton>
          <PrimaryButton theme={darkTheme} disabled>Disabled</PrimaryButton>
        </ButtonRow>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 12, color: darkTheme.textMuted, marginBottom: 8 }}>SECONDARY</h4>
        <ButtonRow theme={darkTheme}>
          <SecondaryButton theme={darkTheme}>Cancel</SecondaryButton>
          <SecondaryButton theme={darkTheme} disabled>Disabled</SecondaryButton>
        </ButtonRow>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 12, color: darkTheme.textMuted, marginBottom: 8 }}>GHOST / DEV</h4>
        <ButtonRow theme={darkTheme}>
          <GhostButton theme={darkTheme}>← Back</GhostButton>
          <DevButton theme={darkTheme}>+1 Day</DevButton>
          <DevButton theme={darkTheme}>+1 Week</DevButton>
          <IconButton theme={darkTheme} icon="🌙" />
        </ButtonRow>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ fontSize: 12, color: darkTheme.textMuted, marginBottom: 8 }}>SHOP / TRANSACTION</h4>
        <ButtonRow theme={darkTheme}>
          <PriceButton theme={darkTheme} price={5} canAfford={true} />
          <PriceButton theme={darkTheme} price={100} canAfford={false} />
          <SellButton theme={darkTheme} price={12.5} />
          <KeepButton theme={darkTheme} />
          <KeepButton theme={darkTheme} disabled />
        </ButtonRow>
      </div>
    </div>
  ),
};

export const Interactive: StoryObj = {
  render: () => {
    const [count, setCount] = React.useState(0);
    const theme = lightTheme;
    
    return (
      <div style={{ 
        padding: 24, 
        background: theme.surface, 
        borderRadius: 12,
        fontFamily: 'system-ui',
      }}>
        <h3 style={{ margin: '0 0 16px', color: theme.text }}>Interactive Demo</h3>
        <p style={{ color: theme.textSecondary, marginBottom: 16 }}>
          Click count: <strong style={{ color: theme.accent }}>{count}</strong>
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <PrimaryButton theme={theme} onClick={() => setCount(c => c + 1)}>
            Increment
          </PrimaryButton>
          <SecondaryButton theme={theme} onClick={() => setCount(0)}>
            Reset
          </SecondaryButton>
        </div>
      </div>
    );
  },
};
