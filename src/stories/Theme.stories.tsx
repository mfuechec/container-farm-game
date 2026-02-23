/**
 * Theme Stories
 * 
 * Visual showcase of the design system tokens, colors, and typography.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { lightTheme, darkTheme, Theme } from '../theme/themes';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import React from 'react';

// Color swatch component
function ColorSwatch({ name, color, textColor = '#fff' }: { name: string; color: string; textColor?: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    }}>
      <div style={{
        width: 60,
        height: 40,
        background: color,
        borderRadius: 6,
        border: '1px solid rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ color: textColor, fontSize: 9, fontFamily: 'monospace' }}>
          {color}
        </span>
      </div>
      <span style={{ fontSize: 13, fontFamily: 'system-ui' }}>{name}</span>
    </div>
  );
}

// Color section
function ColorSection({ title, colors }: { title: string; colors: { name: string; color: string; textColor?: string }[] }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, fontFamily: 'system-ui', color: '#666', textTransform: 'uppercase' }}>
        {title}
      </h4>
      {colors.map(c => <ColorSwatch key={c.name} {...c} />)}
    </div>
  );
}

// Full palette display
function ThemePalette({ theme, label }: { theme: Theme; label: string }) {
  const isDark = theme.name === 'dark';
  const textColorOnBg = isDark ? '#fff' : '#000';
  
  return (
    <div style={{
      padding: 24,
      background: theme.bg,
      borderRadius: 12,
      minWidth: 320,
    }}>
      <h3 style={{ margin: '0 0 20px', color: theme.text, fontFamily: 'system-ui' }}>{label}</h3>
      
      <ColorSection title="Backgrounds" colors={[
        { name: 'bg', color: theme.bg, textColor: textColorOnBg },
        { name: 'bgAlt', color: theme.bgAlt, textColor: textColorOnBg },
        { name: 'surface', color: theme.surface, textColor: textColorOnBg },
        { name: 'surfaceHover', color: theme.surfaceHover, textColor: textColorOnBg },
        { name: 'surfaceActive', color: theme.surfaceActive, textColor: textColorOnBg },
      ]} />
      
      <ColorSection title="Borders" colors={[
        { name: 'border', color: theme.border },
        { name: 'borderLight', color: theme.borderLight },
        { name: 'borderFocus', color: theme.borderFocus },
      ]} />
      
      <ColorSection title="Text" colors={[
        { name: 'text', color: theme.text, textColor: isDark ? '#000' : '#fff' },
        { name: 'textSecondary', color: theme.textSecondary, textColor: isDark ? '#000' : '#fff' },
        { name: 'textMuted', color: theme.textMuted, textColor: isDark ? '#000' : '#fff' },
      ]} />
      
      <ColorSection title="Semantic" colors={[
        { name: 'accent', color: theme.accent },
        { name: 'accentLight', color: theme.accentLight, textColor: theme.accent },
        { name: 'money', color: theme.money },
        { name: 'moneyLight', color: theme.moneyLight, textColor: theme.money },
        { name: 'danger', color: theme.danger },
        { name: 'warning', color: theme.warning },
        { name: 'info', color: theme.info },
      ]} />
      
      <ColorSection title="Trait Colors" colors={[
        { name: 'flavorIntensity', color: theme.traits.flavorIntensity },
        { name: 'growthSpeed', color: theme.traits.growthSpeed },
        { name: 'yield', color: theme.traits.yield },
        { name: 'hardiness', color: theme.traits.hardiness },
        { name: 'appearance', color: theme.traits.appearance },
        { name: 'shelfLife', color: theme.traits.shelfLife },
      ]} />
    </div>
  );
}

// Typography showcase
function TypographyShowcase({ theme }: { theme: Theme }) {
  return (
    <div style={{ 
      padding: 24, 
      background: theme.surface, 
      borderRadius: 12,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <h3 style={{ margin: '0 0 20px', color: theme.text }}>Typography</h3>
      
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: theme.textMuted }}>Headings</span>
        <h1 style={{ margin: '8px 0', fontSize: 28, fontWeight: 700, color: theme.text }}>Heading 1</h1>
        <h2 style={{ margin: '8px 0', fontSize: 22, fontWeight: 600, color: theme.text }}>Heading 2</h2>
        <h3 style={{ margin: '8px 0', fontSize: 18, fontWeight: 600, color: theme.text }}>Heading 3</h3>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: theme.textMuted }}>Body</span>
        <p style={{ margin: '8px 0', fontSize: 14, color: theme.text }}>
          Primary body text - used for main content. Lorem ipsum dolor sit amet.
        </p>
        <p style={{ margin: '8px 0', fontSize: 14, color: theme.textSecondary }}>
          Secondary body text - used for supporting content.
        </p>
        <p style={{ margin: '8px 0', fontSize: 14, color: theme.textMuted }}>
          Muted text - used for hints and disabled states.
        </p>
      </div>
      
      <div>
        <span style={{ fontSize: 11, color: theme.textMuted }}>Labels & Captions</span>
        <p style={{ margin: '8px 0', fontSize: 12, color: theme.text, fontWeight: 600 }}>Bold label</p>
        <p style={{ margin: '8px 0', fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          UPPERCASE CAPTION
        </p>
        <p style={{ margin: '8px 0', fontSize: 10, color: theme.textMuted, fontFamily: 'monospace' }}>
          Monospace: $123.45
        </p>
      </div>
    </div>
  );
}

// Shadows showcase
function ShadowsShowcase({ theme }: { theme: Theme }) {
  return (
    <div style={{ 
      padding: 24, 
      background: theme.bg,
      borderRadius: 12,
    }}>
      <h3 style={{ margin: '0 0 20px', color: theme.text, fontFamily: 'system-ui' }}>Shadows</h3>
      
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{
          width: 100,
          height: 80,
          background: theme.surface,
          borderRadius: theme.radiusMd,
          boxShadow: theme.shadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          color: theme.textSecondary,
        }}>
          shadow
        </div>
        <div style={{
          width: 100,
          height: 80,
          background: theme.surface,
          borderRadius: theme.radiusMd,
          boxShadow: theme.shadowLg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          color: theme.textSecondary,
        }}>
          shadowLg
        </div>
        <div style={{
          width: 100,
          height: 80,
          background: theme.accent,
          borderRadius: theme.radiusMd,
          boxShadow: theme.shadowGlow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          color: theme.textInverse,
        }}>
          shadowGlow
        </div>
      </div>
    </div>
  );
}

// Border radius showcase
function RadiusShowcase({ theme }: { theme: Theme }) {
  return (
    <div style={{ 
      padding: 24, 
      background: theme.bg,
      borderRadius: 12,
    }}>
      <h3 style={{ margin: '0 0 20px', color: theme.text, fontFamily: 'system-ui' }}>Border Radius</h3>
      
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
        {[
          { name: 'radiusSm', value: theme.radiusSm },
          { name: 'radiusMd', value: theme.radiusMd },
          { name: 'radiusLg', value: theme.radiusLg },
          { name: 'radiusFull', value: theme.radiusFull },
        ].map(r => (
          <div key={r.name} style={{ textAlign: 'center' }}>
            <div style={{
              width: r.name === 'radiusFull' ? 60 : 60,
              height: r.name === 'radiusFull' ? 60 : 60,
              background: theme.accent,
              borderRadius: r.value,
              marginBottom: 8,
            }} />
            <div style={{ fontSize: 10, color: theme.textSecondary }}>{r.name}</div>
            <div style={{ fontSize: 10, color: theme.textMuted, fontFamily: 'monospace' }}>{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Interactive theme toggle demo
function ThemeToggleDemo() {
  const { theme, isDark, toggleTheme } = useTheme();
  
  return (
    <div style={{
      padding: 24,
      background: theme.surface,
      borderRadius: theme.radiusLg,
      boxShadow: theme.shadow,
      border: `1px solid ${theme.border}`,
    }}>
      <h3 style={{ margin: '0 0 16px', color: theme.text }}>Theme Toggle Demo</h3>
      <p style={{ margin: '0 0 16px', color: theme.textSecondary, fontSize: 14 }}>
        Current mode: <strong style={{ color: theme.accent }}>{isDark ? 'Dark' : 'Light'}</strong>
      </p>
      <button
        onClick={toggleTheme}
        style={{
          padding: '10px 20px',
          background: theme.accent,
          border: 'none',
          borderRadius: theme.radiusMd,
          color: theme.textInverse,
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        {isDark ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
      </button>
    </div>
  );
}

const meta: Meta = {
  title: 'Design System/Theme',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

export const LightPalette: StoryObj = {
  render: () => <ThemePalette theme={lightTheme} label="Light Theme" />,
};

export const DarkPalette: StoryObj = {
  render: () => <ThemePalette theme={darkTheme} label="Dark Theme" />,
};

export const SideBySide: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      <ThemePalette theme={lightTheme} label="Light Theme" />
      <ThemePalette theme={darkTheme} label="Dark Theme" />
    </div>
  ),
};

export const Typography: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      <TypographyShowcase theme={lightTheme} />
      <TypographyShowcase theme={darkTheme} />
    </div>
  ),
};

export const Shadows: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      <ShadowsShowcase theme={lightTheme} />
      <ShadowsShowcase theme={darkTheme} />
    </div>
  ),
};

export const BorderRadius: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      <RadiusShowcase theme={lightTheme} />
      <RadiusShowcase theme={darkTheme} />
    </div>
  ),
};

export const InteractiveToggle: StoryObj = {
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
  render: () => <ThemeToggleDemo />,
};
