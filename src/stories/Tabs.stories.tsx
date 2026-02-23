/**
 * Tabs Stories
 * 
 * Tab navigation component used in PlantHobby and other views.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { lightTheme, darkTheme, Theme } from '../theme/themes';
import React, { useState } from 'react';

// Tab bar component
function TabBar({
  tabs,
  activeTab,
  onTabChange,
  badges = {},
  theme,
}: {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  badges?: Record<string, number>;
  theme: Theme;
}) {
  return (
    <div style={{ 
      display: 'flex', 
      borderBottom: `1px solid ${theme.border}`,
      background: theme.surface,
    }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          style={{
            flex: 1,
            padding: '10px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === tab 
              ? `2px solid ${theme.accent}` 
              : '2px solid transparent',
            color: activeTab === tab ? theme.accent : theme.textSecondary,
            cursor: 'pointer',
            fontWeight: activeTab === tab ? 600 : 400,
            textTransform: 'capitalize',
            fontSize: 14,
            transition: theme.transitionFast,
          }}
        >
          {tab}
          {badges[tab] !== undefined && badges[tab] > 0 && (
            <span style={{
              marginLeft: 6,
              padding: '2px 6px',
              background: theme.accent,
              color: theme.textInverse,
              borderRadius: theme.radiusFull,
              fontSize: 10,
              fontWeight: 600,
            }}>
              {badges[tab]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Mini tab pills (secondary navigation)
function TabPills({
  tabs,
  activeTab,
  onTabChange,
  theme,
}: {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: Theme;
}) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: 8,
      padding: 4,
      background: theme.bgAlt,
      borderRadius: theme.radiusFull,
    }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          style={{
            padding: '6px 14px',
            background: activeTab === tab ? theme.surface : 'transparent',
            border: 'none',
            borderRadius: theme.radiusFull,
            color: activeTab === tab ? theme.text : theme.textSecondary,
            cursor: 'pointer',
            fontWeight: activeTab === tab ? 500 : 400,
            fontSize: 13,
            boxShadow: activeTab === tab ? theme.shadow : 'none',
            transition: theme.transitionFast,
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// Icon tabs (emoji-based)
function IconTabs({
  tabs,
  activeTab,
  onTabChange,
  theme,
}: {
  tabs: { id: string; icon: string; label: string }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: Theme;
}) {
  return (
    <div style={{ 
      display: 'flex', 
      gap: 4,
      padding: 8,
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '8px 16px',
            background: activeTab === tab.id ? theme.accentLight : 'transparent',
            border: activeTab === tab.id 
              ? `1px solid ${theme.accent}` 
              : `1px solid transparent`,
            borderRadius: theme.radiusMd,
            cursor: 'pointer',
            transition: theme.transitionFast,
          }}
        >
          <span style={{ fontSize: 20 }}>{tab.icon}</span>
          <span style={{ 
            fontSize: 11, 
            color: activeTab === tab.id ? theme.accent : theme.textSecondary,
            fontWeight: activeTab === tab.id ? 500 : 400,
          }}>
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}

const meta: Meta = {
  title: 'Design System/Tabs',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

export const BasicTabs: StoryObj = {
  render: () => {
    const [active, setActive] = useState('grow');
    const theme = lightTheme;
    
    return (
      <div style={{ 
        background: theme.surface, 
        borderRadius: 12,
        overflow: 'hidden',
        maxWidth: 400,
        boxShadow: theme.shadow,
      }}>
        <TabBar
          tabs={['grow', 'harvest', 'shop']}
          activeTab={active}
          onTabChange={setActive}
          theme={theme}
        />
        <div style={{ padding: 24, color: theme.text }}>
          Content for: <strong>{active}</strong>
        </div>
      </div>
    );
  },
};

export const TabsWithBadges: StoryObj = {
  render: () => {
    const [active, setActive] = useState('grow');
    const theme = lightTheme;
    
    return (
      <div style={{ 
        background: theme.surface, 
        borderRadius: 12,
        overflow: 'hidden',
        maxWidth: 400,
        boxShadow: theme.shadow,
      }}>
        <TabBar
          tabs={['grow', 'harvest', 'shop']}
          activeTab={active}
          onTabChange={setActive}
          badges={{ harvest: 3, shop: 0 }}
          theme={theme}
        />
        <div style={{ padding: 24, color: theme.text }}>
          The "harvest" tab has a badge showing 3 items ready.
        </div>
      </div>
    );
  },
};

export const PillTabs: StoryObj = {
  render: () => {
    const [active, setActive] = useState('all');
    const theme = lightTheme;
    
    return (
      <div style={{ 
        background: theme.surface, 
        borderRadius: 12,
        padding: 16,
        maxWidth: 400,
        boxShadow: theme.shadow,
      }}>
        <TabPills
          tabs={['all', 'seeds', 'equipment']}
          activeTab={active}
          onTabChange={setActive}
          theme={theme}
        />
        <div style={{ padding: '16px 0', color: theme.textSecondary, fontSize: 14 }}>
          Pill-style tabs for filters and secondary navigation.
        </div>
      </div>
    );
  },
};

export const IconTabsDemo: StoryObj = {
  render: () => {
    const [active, setActive] = useState('plants');
    const theme = lightTheme;
    
    return (
      <div style={{ 
        background: theme.surface, 
        borderRadius: 12,
        padding: 8,
        maxWidth: 400,
        boxShadow: theme.shadow,
      }}>
        <IconTabs
          tabs={[
            { id: 'plants', icon: '🌱', label: 'Plants' },
            { id: 'kitchen', icon: '🍳', label: 'Kitchen' },
            { id: 'shop', icon: '🛒', label: 'Shop' },
          ]}
          activeTab={active}
          onTabChange={setActive}
          theme={theme}
        />
      </div>
    );
  },
};

export const DarkThemeTabs: StoryObj = {
  render: () => {
    const [active1, setActive1] = useState('grow');
    const [active2, setActive2] = useState('all');
    const theme = darkTheme;
    
    return (
      <div style={{ 
        background: theme.bg, 
        padding: 24,
        borderRadius: 12,
      }}>
        <h3 style={{ margin: '0 0 16px', fontFamily: 'system-ui', color: theme.text }}>
          Dark Theme Tabs
        </h3>
        
        <div style={{ 
          background: theme.surface, 
          borderRadius: 12,
          overflow: 'hidden',
          maxWidth: 400,
          boxShadow: theme.shadow,
          marginBottom: 16,
        }}>
          <TabBar
            tabs={['grow', 'harvest', 'shop']}
            activeTab={active1}
            onTabChange={setActive1}
            badges={{ harvest: 2 }}
            theme={theme}
          />
          <div style={{ padding: 16, color: theme.text, fontSize: 14 }}>
            Tab content here
          </div>
        </div>
        
        <div style={{ 
          background: theme.surface, 
          borderRadius: 12,
          padding: 16,
          maxWidth: 400,
          boxShadow: theme.shadow,
        }}>
          <TabPills
            tabs={['all', 'seeds', 'equipment']}
            activeTab={active2}
            onTabChange={setActive2}
            theme={theme}
          />
        </div>
      </div>
    );
  },
};
