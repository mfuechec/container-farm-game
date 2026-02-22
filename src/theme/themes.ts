/**
 * Theme definitions for Side Hustle Simulator
 * 
 * Design philosophy:
 * - Cozy, warm, Unpacking/Stardew Valley vibes
 * - Spatial interaction over menus
 * - Show don't tell
 */

export interface Theme {
  name: 'light' | 'dark';
  
  // Core backgrounds
  bg: string;              // Page background
  bgAlt: string;           // Alternate bg (subtle sections)
  surface: string;         // Cards, modals
  surfaceHover: string;    // Surface on hover
  surfaceActive: string;   // Surface when active/selected
  
  // Borders & dividers
  border: string;          // Default border
  borderLight: string;     // Subtle border
  borderFocus: string;     // Focus ring color
  
  // Text
  text: string;            // Primary text
  textSecondary: string;   // Secondary text
  textMuted: string;       // Muted/disabled text
  textInverse: string;     // Text on colored backgrounds
  
  // Semantic colors
  accent: string;          // Primary accent (plants, positive actions)
  accentLight: string;     // Light accent bg
  accentHover: string;     // Accent on hover
  
  money: string;           // Money, gold, rewards
  moneyLight: string;      // Light money bg
  
  danger: string;          // Errors, negative
  dangerLight: string;     // Light danger bg
  
  warning: string;         // Warnings, caution
  warningLight: string;    // Light warning bg
  
  info: string;            // Info, neutral highlights
  infoLight: string;       // Light info bg
  
  // Trait colors (for plant genetics display)
  traits: {
    flavorIntensity: string;
    growthSpeed: string;
    yield: string;
    hardiness: string;
    appearance: string;
    shelfLife: string;
  };
  
  // Shadows
  shadow: string;          // Default shadow
  shadowLg: string;        // Large shadow (modals, dropdowns)
  shadowGlow: string;      // Glow effect for highlights
  
  // Transitions
  transitionFast: string;
  transitionNormal: string;
  
  // Border radius
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusFull: string;
}

export const lightTheme: Theme = {
  name: 'light',
  
  // Core backgrounds - warm cream, not stark white
  bg: '#FAF8F5',
  bgAlt: '#F5F3EF',
  surface: '#FFFFFF',
  surfaceHover: '#F8F6F2',
  surfaceActive: '#F0EDE8',
  
  // Borders - warm grays
  border: '#E8E4DE',
  borderLight: '#F0EDE8',
  borderFocus: '#5A9A6B',
  
  // Text - warm browns
  text: '#2D2A26',
  textSecondary: '#7A746A',
  textMuted: '#A8A299',
  textInverse: '#FFFFFF',
  
  // Semantic - earthy, natural palette
  accent: '#5A9A6B',        // Sage green
  accentLight: '#E8F2EB',
  accentHover: '#4A8A5B',
  
  money: '#D4A84B',         // Warm gold
  moneyLight: '#FBF5E8',
  
  danger: '#C95D63',        // Muted red
  dangerLight: '#FCEEED',
  
  warning: '#D4943A',       // Warm orange
  warningLight: '#FDF4E8',
  
  info: '#5A8A9A',          // Muted teal
  infoLight: '#E8F2F4',
  
  // Trait colors - slightly muted for light mode
  traits: {
    flavorIntensity: '#C95D63',  // Rose/red
    growthSpeed: '#5A9A6B',      // Sage green
    yield: '#D4A84B',            // Gold
    hardiness: '#7A6A9A',        // Muted purple
    appearance: '#D4843A',       // Warm orange
    shelfLife: '#5A8A9A',        // Teal
  },
  
  // Shadows - warm tinted
  shadow: '0 2px 8px rgba(45, 42, 38, 0.08)',
  shadowLg: '0 8px 24px rgba(45, 42, 38, 0.12)',
  shadowGlow: '0 0 20px rgba(90, 154, 107, 0.2)',
  
  // Transitions
  transitionFast: '0.15s ease',
  transitionNormal: '0.25s ease',
  
  // Border radius
  radiusSm: '6px',
  radiusMd: '10px',
  radiusLg: '16px',
  radiusFull: '9999px',
};

export const darkTheme: Theme = {
  name: 'dark',
  
  // Core backgrounds - deep blues
  bg: '#0C1017',
  bgAlt: '#111825',
  surface: '#131922',
  surfaceHover: '#1A2230',
  surfaceActive: '#1E2A3A',
  
  // Borders
  border: '#2A3444',
  borderLight: '#1E2A3A',
  borderFocus: '#4ECDC4',
  
  // Text
  text: '#E2E8F0',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0C1017',
  
  // Semantic
  accent: '#4ECDC4',        // Teal
  accentLight: '#1A3A3A',
  accentHover: '#3DBDB4',
  
  money: '#F7B731',         // Bright gold
  moneyLight: '#3A2A1A',
  
  danger: '#E85D75',        // Pink/red
  dangerLight: '#3A1A2A',
  
  warning: '#F7A731',       // Orange
  warningLight: '#3A2A1A',
  
  info: '#45AAF2',          // Blue
  infoLight: '#1A2A3A',
  
  // Trait colors - vibrant for dark mode
  traits: {
    flavorIntensity: '#E85D75',
    growthSpeed: '#4ECDC4',
    yield: '#F7B731',
    hardiness: '#8854D0',
    appearance: '#FD9644',
    shelfLife: '#45AAF2',
  },
  
  // Shadows
  shadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  shadowLg: '0 8px 24px rgba(0, 0, 0, 0.4)',
  shadowGlow: '0 0 20px rgba(78, 205, 196, 0.3)',
  
  // Transitions
  transitionFast: '0.15s ease',
  transitionNormal: '0.25s ease',
  
  // Border radius
  radiusSm: '6px',
  radiusMd: '10px',
  radiusLg: '16px',
  radiusFull: '9999px',
};

// Helper to get trait color
export function getTraitColor(theme: Theme, trait: keyof Theme['traits']): string {
  return theme.traits[trait];
}

// Helper for trait background (20% opacity)
export function getTraitBg(theme: Theme, trait: keyof Theme['traits']): string {
  const color = theme.traits[trait];
  return color + '22'; // 22 hex = ~13% opacity
}
