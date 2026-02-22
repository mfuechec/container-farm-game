/**
 * Pots Stories
 * 
 * Visual catalog of all pot types.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { POT_TYPES } from '../hobbies/plants/equipment';

function PotCard({ 
  emoji, 
  name, 
  description, 
  growthModifier,
  yieldModifier,
  cost,
}: { 
  emoji: string;
  name: string;
  description: string;
  growthModifier: number;
  yieldModifier: number;
  cost: number;
}) {
  const growthPercent = Math.round((growthModifier - 1) * 100);
  const yieldPercent = Math.round((yieldModifier - 1) * 100);
  
  return (
    <div style={{
      padding: 16,
      border: '1px solid #ddd',
      borderRadius: 8,
      background: '#fff',
      maxWidth: 300,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 32 }}>{emoji}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{name}</div>
          <div style={{ color: '#666', fontSize: 12 }}>${cost}</div>
        </div>
      </div>
      <div style={{ color: '#555', fontSize: 13, marginBottom: 12 }}>{description}</div>
      
      {/* Modifiers */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{
          padding: '4px 8px',
          background: growthPercent > 0 ? '#E8F5E9' : growthPercent < 0 ? '#FFEBEE' : '#f5f5f5',
          borderRadius: 4,
          fontSize: 12,
        }}>
          <span style={{ color: '#888' }}>Growth: </span>
          <span style={{ 
            color: growthPercent > 0 ? '#4CAF50' : growthPercent < 0 ? '#f44336' : '#666',
            fontWeight: 600,
          }}>
            {growthPercent > 0 ? `+${growthPercent}%` : growthPercent < 0 ? `${growthPercent}%` : '0%'}
          </span>
        </div>
        <div style={{
          padding: '4px 8px',
          background: yieldPercent > 0 ? '#E8F5E9' : yieldPercent < 0 ? '#FFEBEE' : '#f5f5f5',
          borderRadius: 4,
          fontSize: 12,
        }}>
          <span style={{ color: '#888' }}>Yield: </span>
          <span style={{ 
            color: yieldPercent > 0 ? '#4CAF50' : yieldPercent < 0 ? '#f44336' : '#666',
            fontWeight: 600,
          }}>
            {yieldPercent > 0 ? `+${yieldPercent}%` : yieldPercent < 0 ? `${yieldPercent}%` : '0%'}
          </span>
        </div>
      </div>
    </div>
  );
}

function EquipmentGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 16,
      padding: 16,
    }}>
      {children}
    </div>
  );
}

const meta: Meta = {
  title: 'Equipment/Pots',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

export const AllPots: StoryObj = {
  render: () => (
    <EquipmentGrid>
      {POT_TYPES.map(pot => (
        <PotCard
          key={pot.id}
          emoji={pot.emoji}
          name={pot.name}
          description={pot.description}
          growthModifier={pot.growthModifier}
          yieldModifier={pot.yieldModifier}
          cost={pot.cost}
        />
      ))}
    </EquipmentGrid>
  ),
};

export const BasicPot: StoryObj = {
  render: () => {
    const pot = POT_TYPES[0];
    return (
      <PotCard
        emoji={pot.emoji}
        name={pot.name}
        description={pot.description}
        growthModifier={pot.growthModifier}
        yieldModifier={pot.yieldModifier}
        cost={pot.cost}
      />
    );
  },
};

export const SelfWateringPot: StoryObj = {
  render: () => {
    const pot = POT_TYPES[1];
    return (
      <PotCard
        emoji={pot.emoji}
        name={pot.name}
        description={pot.description}
        growthModifier={pot.growthModifier}
        yieldModifier={pot.yieldModifier}
        cost={pot.cost}
      />
    );
  },
};

export const LargePlanter: StoryObj = {
  render: () => {
    const pot = POT_TYPES[2];
    return (
      <PotCard
        emoji={pot.emoji}
        name={pot.name}
        description={pot.description}
        growthModifier={pot.growthModifier}
        yieldModifier={pot.yieldModifier}
        cost={pot.cost}
      />
    );
  },
};

export const TradeoffComparison: StoryObj = {
  render: () => (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h3 style={{ marginBottom: 16 }}>Pot Trade-offs</h3>
      <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
        Different pots offer different trade-offs between growth speed and harvest yield.
      </p>
      <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 500 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: 8, textAlign: 'left' }}>Pot</th>
            <th style={{ padding: 8, textAlign: 'center' }}>Growth</th>
            <th style={{ padding: 8, textAlign: 'center' }}>Yield</th>
            <th style={{ padding: 8, textAlign: 'right' }}>Cost</th>
          </tr>
        </thead>
        <tbody>
          {POT_TYPES.map(pot => {
            const growthPercent = Math.round((pot.growthModifier - 1) * 100);
            const yieldPercent = Math.round((pot.yieldModifier - 1) * 100);
            return (
              <tr key={pot.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{pot.emoji} {pot.name}</td>
                <td style={{ 
                  padding: 8, 
                  textAlign: 'center',
                  color: growthPercent > 0 ? '#4CAF50' : growthPercent < 0 ? '#f44336' : '#666',
                }}>
                  {growthPercent > 0 ? `+${growthPercent}%` : growthPercent < 0 ? `${growthPercent}%` : '-'}
                </td>
                <td style={{ 
                  padding: 8, 
                  textAlign: 'center',
                  color: yieldPercent > 0 ? '#4CAF50' : yieldPercent < 0 ? '#f44336' : '#666',
                }}>
                  {yieldPercent > 0 ? `+${yieldPercent}%` : yieldPercent < 0 ? `${yieldPercent}%` : '-'}
                </td>
                <td style={{ padding: 8, textAlign: 'right' }}>${pot.cost}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  ),
};
