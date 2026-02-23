/**
 * ApartmentView Stories
 * 
 * The main apartment blueprint/floor plan view.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { lightTheme, darkTheme, Theme } from '../theme/themes';
import React from 'react';

// Hobby space slot component
function HobbySpaceSlot({
  hobby,
  onClick,
  style,
  theme,
}: {
  hobby: 'plants' | 'mushrooms' | 'woodworking' | null;
  onClick: () => void;
  style: React.CSSProperties;
  theme: Theme;
}) {
  const hasHobby = hobby !== null;
  
  const hobbyInfo: Record<string, { emoji: string; name: string }> = {
    plants: { emoji: '🌱', name: 'Container Farm' },
    mushrooms: { emoji: '🍄', name: 'Mushroom Farm' },
    woodworking: { emoji: '🪵', name: 'Woodworking' },
  };
  
  const info = hobby ? hobbyInfo[hobby] : null;

  return (
    <div
      onClick={onClick}
      style={{
        ...style,
        border: hasHobby ? `2px solid ${theme.accent}` : `2px dashed ${theme.accent}`,
        borderRadius: theme.radiusLg,
        background: hasHobby ? theme.accentLight : `${theme.accent}08`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: theme.transitionNormal,
      }}
    >
      {hasHobby ? (
        <>
          <span style={{ fontSize: 36, marginBottom: 8 }}>{info?.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: theme.accent }}>
            {info?.name}
          </span>
          <span style={{ fontSize: 11, color: theme.textSecondary, marginTop: 4 }}>
            Click to manage →
          </span>
        </>
      ) : (
        <>
          <span style={{ fontSize: 12, color: theme.accent, fontWeight: 500, marginBottom: 8 }}>
            Hobby Space
          </span>
          <span style={{ fontSize: 28, opacity: 0.5, marginBottom: 8 }}>➕</span>
          <span style={{ fontSize: 11, color: theme.textSecondary }}>
            Click to start
          </span>
        </>
      )}
    </div>
  );
}

// Main apartment view component
function ApartmentView({
  housingName = 'Studio Apartment',
  housingEmoji = '🏠',
  rentPerWeek = 200,
  hobbySlots = 1,
  hobby = null as 'plants' | 'mushrooms' | 'woodworking' | null,
  kitchenStorage = 0,
  kitchenCapacity = 5,
  money = 100,
  gameDay = 1,
  theme,
}: {
  housingName?: string;
  housingEmoji?: string;
  rentPerWeek?: number;
  hobbySlots?: number;
  hobby?: 'plants' | 'mushrooms' | 'woodworking' | null;
  kitchenStorage?: number;
  kitchenCapacity?: number;
  money?: number;
  gameDay?: number;
  theme: Theme;
}) {
  return (
    <div style={{
      background: theme.surface,
      borderRadius: theme.radiusLg,
      padding: 24,
      boxShadow: theme.shadow,
      border: `1px solid ${theme.border}`,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <div>
          <h2 style={{ margin: 0, color: theme.text, fontSize: 18, fontWeight: 600 }}>
            {housingEmoji} {housingName}
          </h2>
          <span style={{ fontSize: 12, color: theme.textSecondary }}>
            Rent: ${rentPerWeek}/week · {hobbySlots} hobby space{hobbySlots > 1 ? 's' : ''}
          </span>
        </div>
        <div style={{
          background: theme.moneyLight,
          padding: '8px 16px',
          borderRadius: theme.radiusMd,
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: theme.money }}>
            ${money.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Blueprint floor plan */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 500,
        margin: '0 auto',
        aspectRatio: '4/3',
        border: `2px solid ${theme.border}`,
        borderRadius: theme.radiusLg,
        background: theme.bgAlt,
        overflow: 'hidden',
      }}>
        {/* Grid pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(${theme.border}40 1px, transparent 1px),
            linear-gradient(90deg, ${theme.border}40 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }} />

        {/* Kitchen area - top left */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            left: '5%',
            width: '35%',
            height: '40%',
            border: `2px solid ${theme.money}`,
            borderRadius: theme.radiusMd,
            background: theme.moneyLight,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: 28, marginBottom: 4 }}>🍳</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>Kitchen</span>
          <span style={{ fontSize: 10, color: theme.textSecondary }}>
            {kitchenStorage}/{kitchenCapacity} stored
          </span>
        </div>

        {/* Hobby space - right side */}
        <HobbySpaceSlot
          hobby={hobby}
          onClick={() => {}}
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '5%',
            width: '50%',
            height: '55%',
          }}
          theme={theme}
        />

        {/* Bed area indicator */}
        <div style={{
          position: 'absolute',
          bottom: '8%',
          left: '5%',
          width: '30%',
          height: '25%',
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radiusSm,
          background: theme.surfaceActive,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}>
          <span style={{ fontSize: 20 }}>🛏️</span>
          <span style={{ fontSize: 9, color: theme.textMuted }}>Bed</span>
        </div>

        {/* Door */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '45%',
          width: '10%',
          height: 6,
          background: theme.accent,
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
        }} />
      </div>

      {/* Day indicator */}
      <div style={{
        marginTop: 16,
        textAlign: 'center',
        color: theme.textSecondary,
        fontSize: 12,
      }}>
        Day {Math.floor(gameDay)} · Week {Math.floor((gameDay - 1) / 7) + 1}
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Views/ApartmentView',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

export const EmptyStudio: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 550, margin: '0 auto' }}>
      <ApartmentView 
        theme={lightTheme}
        money={50}
        gameDay={1}
      />
    </div>
  ),
};

export const WithPlantHobby: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 550, margin: '0 auto' }}>
      <ApartmentView 
        theme={lightTheme}
        hobby="plants"
        kitchenStorage={3}
        money={245}
        gameDay={15}
      />
    </div>
  ),
};

export const LargerApartment: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 550, margin: '0 auto' }}>
      <ApartmentView 
        theme={lightTheme}
        housingName="1BR Apartment"
        housingEmoji="🏢"
        rentPerWeek={350}
        hobbySlots={2}
        hobby="plants"
        kitchenStorage={5}
        kitchenCapacity={8}
        money={500}
        gameDay={45}
      />
    </div>
  ),
};

export const DarkTheme: StoryObj = {
  render: () => (
    <div style={{ 
      background: darkTheme.bg, 
      padding: 24, 
      borderRadius: 12,
      maxWidth: 600,
      margin: '0 auto',
    }}>
      <ApartmentView 
        theme={darkTheme}
        hobby="plants"
        kitchenStorage={2}
        money={180}
        gameDay={7}
      />
    </div>
  ),
};

export const DayProgression: StoryObj = {
  render: () => (
    <div style={{ display: 'grid', gap: 24, maxWidth: 1200 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left' }}>
          <ApartmentView theme={lightTheme} gameDay={1} money={50} />
        </div>
        <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left' }}>
          <ApartmentView theme={lightTheme} gameDay={7} money={100} hobby="plants" />
        </div>
        <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left' }}>
          <ApartmentView theme={lightTheme} gameDay={30} money={350} hobby="plants" kitchenStorage={4} />
        </div>
      </div>
    </div>
  ),
};
