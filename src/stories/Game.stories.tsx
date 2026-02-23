/**
 * Game Stories
 * 
 * Full game layouts and header components.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { lightTheme, darkTheme, Theme } from '../theme/themes';
import React, { useState } from 'react';

// Game header component
function GameHeader({
  isDark = false,
  onToggleTheme,
  onSkipDay,
  onSkipWeek,
  theme,
}: {
  isDark?: boolean;
  onToggleTheme?: () => void;
  onSkipDay?: () => void;
  onSkipWeek?: () => void;
  theme: Theme;
}) {
  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 20px',
      background: theme.surface,
      borderBottom: `1px solid ${theme.border}`,
    }}>
      <h1 style={{ 
        margin: 0, 
        fontSize: 18, 
        fontWeight: 700, 
        color: theme.accent,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        🌱 Side Hustle Simulator
      </h1>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={onSkipDay} style={{
          padding: '6px 10px',
          background: theme.bgAlt,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radiusSm,
          color: theme.textSecondary,
          cursor: 'pointer',
          fontSize: 11,
        }}>
          +1 Day
        </button>
        <button onClick={onSkipWeek} style={{
          padding: '6px 10px',
          background: theme.bgAlt,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radiusSm,
          color: theme.textSecondary,
          cursor: 'pointer',
          fontSize: 11,
        }}>
          +1 Week
        </button>
        <button onClick={onToggleTheme} style={{
          padding: '6px 10px',
          background: theme.bgAlt,
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radiusSm,
          color: theme.textSecondary,
          cursor: 'pointer',
          fontSize: 14,
        }}>
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}

// Mini apartment view for layout demo
function MiniApartment({ theme }: { theme: Theme }) {
  return (
    <div style={{
      background: theme.surface,
      borderRadius: theme.radiusLg,
      padding: 20,
      boxShadow: theme.shadow,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, color: theme.text }}>🏠 Studio Apartment</h2>
          <span style={{ fontSize: 11, color: theme.textSecondary }}>Day 15 · Week 3</span>
        </div>
        <div style={{
          background: theme.moneyLight,
          padding: '6px 12px',
          borderRadius: theme.radiusMd,
        }}>
          <span style={{ fontWeight: 700, color: theme.money }}>$245</span>
        </div>
      </div>
      
      <div style={{
        aspectRatio: '4/3',
        background: theme.bgAlt,
        borderRadius: theme.radiusMd,
        border: `1px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.textMuted,
        fontSize: 12,
      }}>
        Floor Plan
      </div>
    </div>
  );
}

// Game layout shell
function GameLayout({
  children,
  isDark = false,
  theme,
}: {
  children: React.ReactNode;
  isDark?: boolean;
  theme: Theme;
}) {
  return (
    <div style={{
      minHeight: '100vh',
      background: theme.bg,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <GameHeader theme={theme} isDark={isDark} />
      <main style={{ 
        padding: 20, 
        maxWidth: 600, 
        margin: '0 auto',
      }}>
        {children}
      </main>
    </div>
  );
}

const meta: Meta = {
  title: 'Views/Game',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

export const HeaderLight: StoryObj = {
  render: () => <GameHeader theme={lightTheme} />,
};

export const HeaderDark: StoryObj = {
  render: () => (
    <div style={{ background: darkTheme.bg }}>
      <GameHeader theme={darkTheme} isDark />
    </div>
  ),
};

export const FullLayoutLight: StoryObj = {
  render: () => (
    <GameLayout theme={lightTheme}>
      <MiniApartment theme={lightTheme} />
    </GameLayout>
  ),
};

export const FullLayoutDark: StoryObj = {
  render: () => (
    <GameLayout theme={darkTheme} isDark>
      <MiniApartment theme={darkTheme} />
    </GameLayout>
  ),
};

export const InteractiveTheme: StoryObj = {
  render: () => {
    const [isDark, setIsDark] = useState(false);
    const [day, setDay] = useState(1);
    const theme = isDark ? darkTheme : lightTheme;
    
    return (
      <div style={{
        minHeight: '100vh',
        background: theme.bg,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          background: theme.surface,
          borderBottom: `1px solid ${theme.border}`,
        }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: theme.accent }}>
            🌱 Side Hustle Simulator
          </h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setDay(d => d + 1)} style={{
              padding: '6px 10px',
              background: theme.bgAlt,
              border: `1px solid ${theme.border}`,
              borderRadius: theme.radiusSm,
              color: theme.textSecondary,
              cursor: 'pointer',
              fontSize: 11,
            }}>
              +1 Day
            </button>
            <button onClick={() => setDay(d => d + 7)} style={{
              padding: '6px 10px',
              background: theme.bgAlt,
              border: `1px solid ${theme.border}`,
              borderRadius: theme.radiusSm,
              color: theme.textSecondary,
              cursor: 'pointer',
              fontSize: 11,
            }}>
              +1 Week
            </button>
            <button onClick={() => setIsDark(!isDark)} style={{
              padding: '6px 10px',
              background: theme.bgAlt,
              border: `1px solid ${theme.border}`,
              borderRadius: theme.radiusSm,
              color: theme.textSecondary,
              cursor: 'pointer',
              fontSize: 14,
            }}>
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </header>
        
        <main style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
          <div style={{
            background: theme.surface,
            borderRadius: theme.radiusLg,
            padding: 20,
            boxShadow: theme.shadow,
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, color: theme.text }}>🏠 Studio Apartment</h2>
                <span style={{ fontSize: 11, color: theme.textSecondary }}>
                  Day {day} · Week {Math.floor((day - 1) / 7) + 1}
                </span>
              </div>
              <div style={{
                background: theme.moneyLight,
                padding: '6px 12px',
                borderRadius: theme.radiusMd,
              }}>
                <span style={{ fontWeight: 700, color: theme.money }}>
                  ${50 + day * 10}
                </span>
              </div>
            </div>
            
            <div style={{
              aspectRatio: '4/3',
              background: theme.bgAlt,
              borderRadius: theme.radiusMd,
              border: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.textMuted,
              fontSize: 12,
            }}>
              Click the buttons to change time and theme!
            </div>
          </div>
        </main>
      </div>
    );
  },
};

export const ViewNavigation: StoryObj = {
  render: () => {
    const [view, setView] = useState<'apartment' | 'hobby' | 'kitchen'>('apartment');
    const theme = lightTheme;
    
    const views = [
      { id: 'apartment', label: '🏠 Apartment', content: 'Main apartment view with floor plan' },
      { id: 'hobby', label: '🌱 Container Farm', content: 'Grow station with pots and plants' },
      { id: 'kitchen', label: '🍳 Kitchen', content: 'Food storage and bonuses' },
    ];
    
    return (
      <div style={{
        minHeight: '100vh',
        background: theme.bg,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <GameHeader theme={theme} />
        
        <main style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
          {/* Navigation pills */}
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            marginBottom: 16,
            padding: 4,
            background: theme.surface,
            borderRadius: theme.radiusFull,
          }}>
            {views.map(v => (
              <button
                key={v.id}
                onClick={() => setView(v.id as any)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: view === v.id ? theme.accent : 'transparent',
                  border: 'none',
                  borderRadius: theme.radiusFull,
                  color: view === v.id ? theme.textInverse : theme.textSecondary,
                  cursor: 'pointer',
                  fontWeight: view === v.id ? 600 : 400,
                  fontSize: 12,
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
          
          {/* View content */}
          <div style={{
            background: theme.surface,
            borderRadius: theme.radiusLg,
            padding: 24,
            boxShadow: theme.shadow,
            minHeight: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {views.find(v => v.id === view)?.label.split(' ')[0]}
            </div>
            <div style={{ color: theme.text, fontSize: 16, fontWeight: 600 }}>
              {views.find(v => v.id === view)?.label}
            </div>
            <div style={{ color: theme.textSecondary, fontSize: 13, marginTop: 8 }}>
              {views.find(v => v.id === view)?.content}
            </div>
          </div>
        </main>
      </div>
    );
  },
};
