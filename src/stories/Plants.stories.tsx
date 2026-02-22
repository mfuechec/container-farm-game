/**
 * Plants Stories
 * 
 * Visual catalog of all plant types and growth stages.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { PLANT_TYPES } from '../hobbies/plants/types';

function PlantCard({ 
  emoji, 
  name, 
  daysToMature,
  yieldAmount,
  seedCost,
  sellPrice,
}: { 
  emoji: string;
  name: string;
  daysToMature: number;
  yieldAmount: number;
  seedCost: number;
  sellPrice: number;
}) {
  const profit = (yieldAmount * sellPrice) - seedCost;
  const profitPerDay = profit / daysToMature;
  
  return (
    <div style={{
      padding: 16,
      border: '1px solid #ddd',
      borderRadius: 8,
      background: '#fff',
      maxWidth: 300,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 40 }}>{emoji}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{name}</div>
          <div style={{ color: '#666', fontSize: 12 }}>Seed cost: ${seedCost}</div>
        </div>
      </div>
      
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Days to Mature</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{daysToMature}d</div>
        </div>
        <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Yield</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{yieldAmount} units</div>
        </div>
        <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Sell Price</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>${sellPrice}/ea</div>
        </div>
        <div style={{ padding: 8, background: profit > 0 ? '#E8F5E9' : '#FFEBEE', borderRadius: 4 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Profit</div>
          <div style={{ 
            fontSize: 16, 
            fontWeight: 600,
            color: profit > 0 ? '#4CAF50' : '#f44336',
          }}>
            ${profit.toFixed(1)}
          </div>
        </div>
      </div>
      
      {/* Efficiency */}
      <div style={{ 
        padding: 8, 
        background: '#FFF8E1', 
        borderRadius: 4,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: '#666' }}>Profit per day:</span>
        <span style={{ fontWeight: 600, color: '#FF9800' }}>${profitPerDay.toFixed(2)}/d</span>
      </div>
    </div>
  );
}

function GrowthStageVis({ stage, progress }: { stage: string; progress: number }) {
  const stages = ['seed', 'sprout', 'growing', 'harvestable'];
  const stageEmojis = ['🫘', '🌱', '🌿', '🌸'];
  const currentIndex = stages.indexOf(stage);
  
  return (
    <div style={{ 
      padding: 16, 
      border: '1px solid #ddd', 
      borderRadius: 8,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ marginBottom: 12, fontWeight: 600 }}>
        Growth Stage: {stage} ({Math.round(progress * 100)}%)
      </div>
      
      {/* Progress bar */}
      <div style={{ 
        height: 8, 
        background: '#eee', 
        borderRadius: 4, 
        marginBottom: 12,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${progress * 100}%`,
          height: '100%',
          background: stage === 'harvestable' ? '#4CAF50' : '#8BC34A',
          borderRadius: 4,
          transition: 'width 0.3s',
        }} />
      </div>
      
      {/* Stage indicators */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {stages.map((s, i) => (
          <div key={s} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: i <= currentIndex ? 1 : 0.3,
          }}>
            <span style={{ fontSize: 24 }}>{stageEmojis[i]}</span>
            <span style={{ fontSize: 10, color: '#666', textTransform: 'capitalize' }}>{s}</span>
          </div>
        ))}
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
  title: 'Plants',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

export const AllPlants: StoryObj = {
  render: () => (
    <EquipmentGrid>
      {PLANT_TYPES.map(plant => (
        <PlantCard
          key={plant.id}
          emoji={plant.emoji}
          name={plant.name}
          daysToMature={plant.daysToMature}
          yieldAmount={plant.yieldAmount}
          seedCost={plant.seedCost}
          sellPrice={plant.sellPrice}
        />
      ))}
    </EquipmentGrid>
  ),
};

export const GrowthStages: StoryObj = {
  render: () => (
    <div style={{ padding: 16, display: 'grid', gap: 16, maxWidth: 400 }}>
      <h3 style={{ margin: 0, fontFamily: 'system-ui' }}>Plant Growth Stages</h3>
      <GrowthStageVis stage="seed" progress={0.05} />
      <GrowthStageVis stage="sprout" progress={0.25} />
      <GrowthStageVis stage="growing" progress={0.6} />
      <GrowthStageVis stage="harvestable" progress={1.0} />
    </div>
  ),
};

export const ProfitComparison: StoryObj = {
  render: () => {
    const sorted = [...PLANT_TYPES].sort((a, b) => {
      const profitA = ((a.yieldAmount * a.sellPrice) - a.seedCost) / a.daysToMature;
      const profitB = ((b.yieldAmount * b.sellPrice) - b.seedCost) / b.daysToMature;
      return profitB - profitA;
    });
    
    return (
      <div style={{ padding: 16, fontFamily: 'system-ui, sans-serif' }}>
        <h3 style={{ marginBottom: 16 }}>Profit Efficiency Ranking</h3>
        <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
          Plants sorted by profit per day (most efficient first).
        </p>
        <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: 8, textAlign: 'left' }}>Plant</th>
              <th style={{ padding: 8, textAlign: 'center' }}>Days</th>
              <th style={{ padding: 8, textAlign: 'center' }}>Yield</th>
              <th style={{ padding: 8, textAlign: 'center' }}>Profit</th>
              <th style={{ padding: 8, textAlign: 'right' }}>$/day</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((plant, i) => {
              const profit = (plant.yieldAmount * plant.sellPrice) - plant.seedCost;
              const perDay = profit / plant.daysToMature;
              return (
                <tr key={plant.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>
                    <span style={{ marginRight: 8 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : ''}</span>
                    {plant.emoji} {plant.name}
                  </td>
                  <td style={{ padding: 8, textAlign: 'center' }}>{plant.daysToMature}d</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>{plant.yieldAmount}</td>
                  <td style={{ padding: 8, textAlign: 'center', color: '#4CAF50' }}>${profit.toFixed(1)}</td>
                  <td style={{ padding: 8, textAlign: 'right', fontWeight: 600, color: '#FF9800' }}>
                    ${perDay.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  },
};
