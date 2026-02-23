/**
 * HobbySelector Stories
 * 
 * The hobby selection modal/screen.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { lightTheme, darkTheme, Theme } from '../theme/themes';
import React from 'react';

interface HobbyOption {
  id: string;
  emoji: string;
  name: string;
  description: string;
  disabled?: boolean;
}

function HobbySelector({
  hobbies,
  onSelect,
  onBack,
  theme,
}: {
  hobbies: HobbyOption[];
  onSelect?: (id: string) => void;
  onBack?: () => void;
  theme: Theme;
}) {
  return (
    <div style={{
      background: theme.surface,
      borderRadius: theme.radiusLg,
      padding: 24,
      boxShadow: theme.shadow,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <button onClick={onBack} style={{
        background: 'none',
        border: 'none',
        color: theme.textSecondary,
        cursor: 'pointer',
        marginBottom: 16,
        fontSize: 14,
        padding: 0,
      }}>
        ← Back
      </button>
      
      <h2 style={{ margin: '0 0 8px', color: theme.text }}>Start a Hobby</h2>
      <p style={{ margin: '0 0 20px', color: theme.textSecondary, fontSize: 14 }}>
        Choose a side hustle to begin
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        {hobbies.map(h => (
          <div
            key={h.id}
            onClick={() => !h.disabled && onSelect?.(h.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              background: h.disabled ? theme.bgAlt : theme.surface,
              border: `2px solid ${h.disabled ? theme.border : theme.accent}`,
              borderRadius: theme.radiusMd,
              cursor: h.disabled ? 'not-allowed' : 'pointer',
              opacity: h.disabled ? 0.5 : 1,
              transition: theme.transitionFast,
            }}
          >
            <span style={{ fontSize: 32 }}>{h.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: theme.text }}>{h.name}</div>
              <div style={{ fontSize: 12, color: theme.textSecondary }}>{h.description}</div>
            </div>
            {!h.disabled && (
              <span style={{ color: theme.accent, fontSize: 18 }}>→</span>
            )}
            {h.disabled && (
              <span style={{ 
                fontSize: 10, 
                color: theme.textMuted,
                padding: '4px 8px',
                background: theme.bgAlt,
                borderRadius: theme.radiusSm,
              }}>
                Coming Soon
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const defaultHobbies: HobbyOption[] = [
  { id: 'plants', emoji: '🌱', name: 'Container Farm', description: 'Grow herbs and vegetables' },
  { id: 'mushrooms', emoji: '🍄', name: 'Mushroom Farm', description: 'Grow gourmet mushrooms', disabled: true },
  { id: 'woodworking', emoji: '🪵', name: 'Woodworking', description: 'Craft wooden goods', disabled: true },
];

const meta: Meta = {
  title: 'Views/HobbySelector',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <HobbySelector 
        hobbies={defaultHobbies}
        theme={lightTheme}
      />
    </div>
  ),
};

export const AllUnlocked: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <HobbySelector 
        hobbies={[
          { id: 'plants', emoji: '🌱', name: 'Container Farm', description: 'Grow herbs and vegetables' },
          { id: 'mushrooms', emoji: '🍄', name: 'Mushroom Farm', description: 'Grow gourmet mushrooms' },
          { id: 'woodworking', emoji: '🪵', name: 'Woodworking', description: 'Craft wooden goods' },
        ]}
        theme={lightTheme}
      />
    </div>
  ),
};

export const ExtendedList: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 400, margin: '0 auto' }}>
      <HobbySelector 
        hobbies={[
          { id: 'plants', emoji: '🌱', name: 'Container Farm', description: 'Grow herbs and vegetables' },
          { id: 'mushrooms', emoji: '🍄', name: 'Mushroom Farm', description: 'Grow gourmet mushrooms', disabled: true },
          { id: 'woodworking', emoji: '🪵', name: 'Woodworking', description: 'Craft wooden goods', disabled: true },
          { id: 'fermentation', emoji: '🫙', name: 'Fermentation', description: 'Make pickles and kombucha', disabled: true },
          { id: 'candles', emoji: '🕯️', name: 'Candle Making', description: 'Craft artisan candles', disabled: true },
        ]}
        theme={lightTheme}
      />
    </div>
  ),
};

export const Interactive: StoryObj = {
  render: () => {
    const [selected, setSelected] = React.useState<string | null>(null);
    
    return (
      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        {selected ? (
          <div style={{
            padding: 24,
            background: lightTheme.surface,
            borderRadius: lightTheme.radiusLg,
            textAlign: 'center',
            fontFamily: 'system-ui',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {defaultHobbies.find(h => h.id === selected)?.emoji}
            </div>
            <h3 style={{ margin: '0 0 8px', color: lightTheme.text }}>
              {defaultHobbies.find(h => h.id === selected)?.name}
            </h3>
            <p style={{ margin: '0 0 16px', color: lightTheme.textSecondary }}>
              You selected this hobby!
            </p>
            <button
              onClick={() => setSelected(null)}
              style={{
                padding: '10px 20px',
                background: lightTheme.accent,
                border: 'none',
                borderRadius: lightTheme.radiusMd,
                color: lightTheme.textInverse,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Choose Different
            </button>
          </div>
        ) : (
          <HobbySelector 
            hobbies={defaultHobbies}
            onSelect={setSelected}
            theme={lightTheme}
          />
        )}
      </div>
    );
  },
};

export const DarkTheme: StoryObj = {
  render: () => (
    <div style={{ 
      background: darkTheme.bg, 
      padding: 24, 
      borderRadius: 12,
      maxWidth: 450,
      margin: '0 auto',
    }}>
      <HobbySelector 
        hobbies={defaultHobbies}
        theme={darkTheme}
      />
    </div>
  ),
};
