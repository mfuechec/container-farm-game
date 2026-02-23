/**
 * Modal Stories
 * 
 * Modal dialogs and overlays.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { lightTheme, darkTheme, Theme } from '../theme/themes';
import { PLANT_TYPES } from '../hobbies/plants/types';
import React, { useState } from 'react';

// Base modal wrapper
function Modal({
  isOpen,
  onClose,
  children,
  theme,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  theme: Theme;
}) {
  if (!isOpen) return null;
  
  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: `${theme.text}66`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.surface,
          borderRadius: theme.radiusLg,
          padding: 20,
          minWidth: 280,
          maxWidth: 400,
          boxShadow: theme.shadowLg,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Plant selection modal
function PlantMenu({
  seeds,
  onSelect,
  onClose,
  theme,
}: {
  seeds: Record<string, number>;
  onSelect: (typeId: string) => void;
  onClose: () => void;
  theme: Theme;
}) {
  const available = PLANT_TYPES.filter(p => (seeds[p.id] || 0) > 0);

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', color: theme.text, fontSize: 16 }}>
        Plant a seed
      </h4>
      
      {available.length === 0 ? (
        <p style={{ color: theme.textMuted, marginBottom: 16 }}>
          No seeds. Buy some in the shop!
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          {available.map(plant => (
            <div
              key={plant.id}
              onClick={() => onSelect(plant.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 10,
                background: theme.bgAlt,
                borderRadius: theme.radiusMd,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20 }}>{plant.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: theme.text, fontSize: 14 }}>{plant.name}</div>
                <div style={{ fontSize: 10, color: theme.textMuted }}>
                  {plant.daysToMature} days
                </div>
              </div>
              <span style={{ color: theme.accent, fontWeight: 500 }}>×{seeds[plant.id]}</span>
            </div>
          ))}
        </div>
      )}
      
      <button onClick={onClose} style={{
        width: '100%',
        padding: 10,
        background: 'none',
        border: `1px solid ${theme.border}`,
        borderRadius: theme.radiusMd,
        color: theme.textSecondary,
        cursor: 'pointer',
      }}>
        Cancel
      </button>
    </div>
  );
}

// Confirmation dialog
function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor,
  onConfirm,
  onCancel,
  theme,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  theme: Theme;
}) {
  return (
    <div>
      <h4 style={{ margin: '0 0 8px', color: theme.text, fontSize: 16 }}>
        {title}
      </h4>
      <p style={{ margin: '0 0 16px', color: theme.textSecondary, fontSize: 14 }}>
        {message}
      </p>
      
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={{
          flex: 1,
          padding: 10,
          background: 'none',
          border: `1px solid ${theme.border}`,
          borderRadius: theme.radiusMd,
          color: theme.textSecondary,
          cursor: 'pointer',
        }}>
          {cancelLabel}
        </button>
        <button onClick={onConfirm} style={{
          flex: 1,
          padding: 10,
          background: confirmColor || theme.accent,
          border: 'none',
          borderRadius: theme.radiusMd,
          color: theme.textInverse,
          cursor: 'pointer',
          fontWeight: 600,
        }}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

// Info dialog
function InfoDialog({
  title,
  content,
  onClose,
  theme,
}: {
  title: string;
  content: React.ReactNode;
  onClose: () => void;
  theme: Theme;
}) {
  return (
    <div>
      <h4 style={{ margin: '0 0 12px', color: theme.text, fontSize: 16 }}>
        {title}
      </h4>
      <div style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 16 }}>
        {content}
      </div>
      <button onClick={onClose} style={{
        width: '100%',
        padding: 10,
        background: theme.accent,
        border: 'none',
        borderRadius: theme.radiusMd,
        color: theme.textInverse,
        cursor: 'pointer',
        fontWeight: 600,
      }}>
        Got it
      </button>
    </div>
  );
}

// Success toast-style message
function SuccessMessage({
  message,
  emoji = '✓',
  theme,
}: {
  message: string;
  emoji?: string;
  theme: Theme;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      background: theme.accentLight,
      border: `1px solid ${theme.accent}`,
      borderRadius: theme.radiusMd,
    }}>
      <span style={{ 
        fontSize: 20, 
        color: theme.accent,
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.surface,
        borderRadius: '50%',
      }}>
        {emoji}
      </span>
      <span style={{ color: theme.text, fontWeight: 500 }}>{message}</span>
    </div>
  );
}

const meta: Meta = {
  title: 'Design System/Modals',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

export const PlantSelection: StoryObj = {
  render: () => {
    const [selected, setSelected] = useState<string | null>(null);
    const theme = lightTheme;
    
    return (
      <div style={{ maxWidth: 320, margin: '0 auto' }}>
        {selected ? (
          <SuccessMessage 
            theme={theme} 
            message={`Planted ${PLANT_TYPES.find(p => p.id === selected)?.name}!`}
            emoji={PLANT_TYPES.find(p => p.id === selected)?.emoji}
          />
        ) : (
          <div style={{
            background: theme.surface,
            borderRadius: theme.radiusLg,
            padding: 20,
            boxShadow: theme.shadowLg,
          }}>
            <PlantMenu
              seeds={{ basil: 3, mint: 1, tomato: 2 }}
              onSelect={setSelected}
              onClose={() => {}}
              theme={theme}
            />
          </div>
        )}
      </div>
    );
  },
};

export const NoSeeds: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 320, margin: '0 auto' }}>
      <div style={{
        background: lightTheme.surface,
        borderRadius: lightTheme.radiusLg,
        padding: 20,
        boxShadow: lightTheme.shadowLg,
      }}>
        <PlantMenu
          seeds={{}}
          onSelect={() => {}}
          onClose={() => {}}
          theme={lightTheme}
        />
      </div>
    </div>
  ),
};

export const Confirmation: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 320, margin: '0 auto' }}>
      <div style={{
        background: lightTheme.surface,
        borderRadius: lightTheme.radiusLg,
        padding: 20,
        boxShadow: lightTheme.shadowLg,
      }}>
        <ConfirmDialog
          title="Sell Harvest?"
          message="You'll receive $15.50 for 3 Basil plants."
          confirmLabel="Sell"
          onConfirm={() => {}}
          onCancel={() => {}}
          theme={lightTheme}
        />
      </div>
    </div>
  ),
};

export const DangerConfirmation: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 320, margin: '0 auto' }}>
      <div style={{
        background: lightTheme.surface,
        borderRadius: lightTheme.radiusLg,
        padding: 20,
        boxShadow: lightTheme.shadowLg,
      }}>
        <ConfirmDialog
          title="Remove Plant?"
          message="This plant hasn't matured yet. You won't get any harvest."
          confirmLabel="Remove"
          confirmColor={lightTheme.danger}
          onConfirm={() => {}}
          onCancel={() => {}}
          theme={lightTheme}
        />
      </div>
    </div>
  ),
};

export const InfoDialogDemo: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 360, margin: '0 auto' }}>
      <div style={{
        background: lightTheme.surface,
        borderRadius: lightTheme.radiusLg,
        padding: 20,
        boxShadow: lightTheme.shadowLg,
      }}>
        <InfoDialog
          title="🌿 Growing Basil"
          content={
            <div>
              <p style={{ margin: '0 0 8px' }}>
                Basil takes <strong>3 days</strong> to mature and yields up to 5 units.
              </p>
              <p style={{ margin: 0 }}>
                Store in your kitchen for a <strong>+15% growth</strong> bonus!
              </p>
            </div>
          }
          onClose={() => {}}
          theme={lightTheme}
        />
      </div>
    </div>
  ),
};

export const SuccessMessages: StoryObj = {
  render: () => (
    <div style={{ display: 'grid', gap: 12, maxWidth: 320, margin: '0 auto' }}>
      <SuccessMessage theme={lightTheme} message="Planted Basil!" emoji="🌿" />
      <SuccessMessage theme={lightTheme} message="Harvest ready!" emoji="🌸" />
      <SuccessMessage theme={lightTheme} message="Sold for $25!" emoji="💰" />
      <SuccessMessage theme={lightTheme} message="Table upgraded!" emoji="🪵" />
    </div>
  ),
};

export const InteractiveModal: StoryObj = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const theme = lightTheme;
    
    return (
      <div>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: '12px 24px',
            background: theme.accent,
            border: 'none',
            borderRadius: theme.radiusMd,
            color: theme.textInverse,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Open Modal
        </button>
        
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} theme={theme}>
          <PlantMenu
            seeds={{ basil: 2, mint: 1 }}
            onSelect={() => setIsOpen(false)}
            onClose={() => setIsOpen(false)}
            theme={theme}
          />
        </Modal>
      </div>
    );
  },
};

export const DarkThemeModals: StoryObj = {
  render: () => (
    <div style={{ 
      background: darkTheme.bg, 
      padding: 24, 
      borderRadius: 12,
    }}>
      <div style={{ display: 'grid', gap: 16, maxWidth: 320, margin: '0 auto' }}>
        <div style={{
          background: darkTheme.surface,
          borderRadius: darkTheme.radiusLg,
          padding: 20,
          boxShadow: darkTheme.shadowLg,
        }}>
          <PlantMenu
            seeds={{ basil: 2, tomato: 1 }}
            onSelect={() => {}}
            onClose={() => {}}
            theme={darkTheme}
          />
        </div>
        
        <SuccessMessage theme={darkTheme} message="Planted Basil!" emoji="🌿" />
      </div>
    </div>
  ),
};
