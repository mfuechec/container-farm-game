/**
 * Lights Stories
 * 
 * Visual catalog of all light fixtures.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { LIGHT_TYPES } from '../hobbies/plants/equipment';

function LightCard({ 
  emoji, 
  name, 
  description, 
  coverage,
  growthBoost,
  cost,
  owned = false 
}: { 
  emoji: string;
  name: string;
  description: string;
  coverage: number;
  growthBoost: number;
  cost: number;
  owned?: boolean;
}) {
  const boostPercent = Math.round((growthBoost - 1) * 100);
  
  return (
    <div style={{
      padding: 16,
      border: owned ? '2px solid #4CAF50' : '1px solid #ddd',
      borderRadius: 8,
      background: owned ? '#E8F5E9' : '#fff',
      maxWidth: 300,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 32 }}>{emoji}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{name}</div>
          <div style={{ color: '#666', fontSize: 12 }}>${cost === 0 ? 'Free (starter)' : cost}</div>
        </div>
        {owned && <span style={{ marginLeft: 'auto', color: '#4CAF50', fontSize: 12 }}>✓ Owned</span>}
      </div>
      <div style={{ color: '#555', fontSize: 13, marginBottom: 12 }}>{description}</div>
      
      {/* Coverage visualization */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Coverage ({coverage} slots)</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{
              width: 24,
              height: 8,
              borderRadius: 2,
              background: i <= coverage ? '#FFD54F' : '#eee',
              boxShadow: i <= coverage ? '0 0 4px #FFD54F' : 'none',
            }} />
          ))}
        </div>
      </div>
      
      {/* Growth boost visualization */}
      <div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
          Growth Boost {boostPercent > 0 ? `(+${boostPercent}%)` : '(none)'}
        </div>
        <div style={{
          height: 8,
          background: '#eee',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${growthBoost * 50}%`,
            height: '100%',
            background: boostPercent > 30 ? '#4CAF50' : boostPercent > 0 ? '#8BC34A' : '#ccc',
            borderRadius: 4,
          }} />
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
  title: 'Equipment/Lights',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

export const AllLights: StoryObj = {
  render: () => (
    <EquipmentGrid>
      {LIGHT_TYPES.map(light => (
        <LightCard
          key={light.id}
          emoji={light.emoji}
          name={light.name}
          description={light.description}
          coverage={light.coverage}
          growthBoost={light.growthBoost}
          cost={light.cost}
        />
      ))}
    </EquipmentGrid>
  ),
};

export const DeskLamp: StoryObj = {
  render: () => {
    const light = LIGHT_TYPES[0];
    return (
      <LightCard
        emoji={light.emoji}
        name={light.name}
        description={light.description}
        coverage={light.coverage}
        growthBoost={light.growthBoost}
        cost={light.cost}
        owned={true}
      />
    );
  },
};

export const ClipLight: StoryObj = {
  render: () => {
    const light = LIGHT_TYPES[1];
    return (
      <LightCard
        emoji={light.emoji}
        name={light.name}
        description={light.description}
        coverage={light.coverage}
        growthBoost={light.growthBoost}
        cost={light.cost}
      />
    );
  },
};

export const LEDPanel: StoryObj = {
  render: () => {
    const light = LIGHT_TYPES[2];
    return (
      <LightCard
        emoji={light.emoji}
        name={light.name}
        description={light.description}
        coverage={light.coverage}
        growthBoost={light.growthBoost}
        cost={light.cost}
      />
    );
  },
};

export const Comparison: StoryObj = {
  render: () => (
    <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h3 style={{ marginBottom: 16 }}>Light Comparison</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 500 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: 8, textAlign: 'left' }}>Light</th>
            <th style={{ padding: 8, textAlign: 'center' }}>Coverage</th>
            <th style={{ padding: 8, textAlign: 'center' }}>Boost</th>
            <th style={{ padding: 8, textAlign: 'right' }}>Cost</th>
          </tr>
        </thead>
        <tbody>
          {LIGHT_TYPES.map(light => (
            <tr key={light.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{light.emoji} {light.name}</td>
              <td style={{ padding: 8, textAlign: 'center' }}>{light.coverage}</td>
              <td style={{ padding: 8, textAlign: 'center' }}>
                {light.growthBoost > 1 ? `+${Math.round((light.growthBoost - 1) * 100)}%` : '-'}
              </td>
              <td style={{ padding: 8, textAlign: 'right' }}>${light.cost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};
