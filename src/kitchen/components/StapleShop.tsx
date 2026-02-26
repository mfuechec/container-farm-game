/**
 * Staple Shop — Buy store-bought ingredients for cooking
 */

import React from 'react';
import { STAPLES } from '../../balance';
import { StapleItem } from '../types';
import { Theme } from '../../theme/themes';

interface StapleShopProps {
  staples: StapleItem[];
  money: number;
  onBuy: (stapleId: keyof typeof STAPLES, quantity?: number) => boolean;
  theme: Theme;
}

export function StapleShop({ staples, money, onBuy, theme }: StapleShopProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontSize: 11,
        color: theme.textSecondary,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}>
        Buy Staples
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: 8,
      }}>
        {(Object.entries(STAPLES) as [keyof typeof STAPLES, typeof STAPLES[keyof typeof STAPLES]][]).map(
          ([id, staple]) => {
            const owned = staples.find(s => s.stapleId === id);
            const qty = owned?.quantity ?? 0;
            const atLimit = qty >= staple.stackLimit;
            const cantAfford = money < staple.price;
            const disabled = atLimit || cantAfford;

            return (
              <button
                key={id}
                onClick={() => !disabled && onBuy(id)}
                disabled={disabled}
                style={{
                  padding: '10px 12px',
                  background: disabled ? theme.bgAlt : theme.surface,
                  border: `1px solid ${disabled ? theme.borderLight : theme.border}`,
                  borderRadius: 8,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  opacity: disabled ? 0.6 : 1,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>{staple.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: theme.text }}>
                  {staple.name}
                </div>
                <div style={{ fontSize: 11, color: theme.money, fontWeight: 600 }}>
                  ${staple.price}
                </div>
                <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 2 }}>
                  {qty}/{staple.stackLimit}
                </div>
                {atLimit && (
                  <div style={{ fontSize: 9, color: theme.warning, marginTop: 2 }}>Full</div>
                )}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}
