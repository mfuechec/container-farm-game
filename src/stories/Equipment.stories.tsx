/**
 * Equipment Stories
 * 
 * Visual catalog of all equipment types in the game.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { TABLE_TYPES, LIGHT_TYPES, POT_TYPES } from '../hobbies/plants/equipment';
import { PLANT_TYPES } from '../hobbies/plants/types';

// Simple card component for displaying equipment
function EquipmentCard({ 
  emoji, 
  name, 
  description, 
  stats,
  cost,
  owned = false 
}: { 
  emoji: string;
  name: string;
  description: string;
  stats: string[];
  cost: number;
  owned?: boolean;
}) {
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
      <div style={{ color: '#555', fontSize: 13, marginBottom: 8 }}>{description}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {stats.map((stat, i) => (
          <span key={i} style={{
            padding: '2px 8px',
            background: '#f5f5f5',
            borderRadius: 4,
            fontSize: 11,
            color: '#666',
          }}>{stat}</span>
        ))}
      </div>
    </div>
  );
}

// Grid layout for showing multiple items
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

// === TABLE STORIES ===

const TablesMeta: Meta = {
  title: 'Equipment/Tables',
  parameters: {
    layout: 'padded',
  },
};

export default TablesMeta;

export const AllTables: StoryObj = {
  render: () => (
    <EquipmentGrid>
      {TABLE_TYPES.map(table => (
        <EquipmentCard
          key={table.id}
          emoji={table.emoji}
          name={table.name}
          description={table.description}
          cost={table.cost}
          stats={[
            `${table.potSlots} pot slots`,
            `${table.seedStorage} seed storage`,
            `${table.width}×${table.height} size`,
          ]}
        />
      ))}
    </EquipmentGrid>
  ),
};

export const SmallDesk: StoryObj = {
  render: () => {
    const table = TABLE_TYPES[0];
    return (
      <EquipmentCard
        emoji={table.emoji}
        name={table.name}
        description={table.description}
        cost={table.cost}
        owned={true}
        stats={[
          `${table.potSlots} pot slots`,
          `${table.seedStorage} seed storage`,
        ]}
      />
    );
  },
};

export const PottingBench: StoryObj = {
  render: () => {
    const table = TABLE_TYPES[1];
    return (
      <EquipmentCard
        emoji={table.emoji}
        name={table.name}
        description={table.description}
        cost={table.cost}
        stats={[
          `${table.potSlots} pot slots`,
          `${table.seedStorage} seed storage`,
        ]}
      />
    );
  },
};

export const GrowShelf: StoryObj = {
  render: () => {
    const table = TABLE_TYPES[2];
    return (
      <EquipmentCard
        emoji={table.emoji}
        name={table.name}
        description={table.description}
        cost={table.cost}
        stats={[
          `${table.potSlots} pot slots`,
          `${table.seedStorage} seed storage`,
        ]}
      />
    );
  },
};
