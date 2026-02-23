/**
 * Progress Indicators Stories
 * 
 * Progress bars, freshness indicators, and growth displays.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { lightTheme, darkTheme, Theme } from '../theme/themes';
import React from 'react';

// Linear progress bar
function ProgressBar({
  value,
  max = 1,
  color,
  showLabel = false,
  size = 'md',
  theme,
}: {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  theme: Theme;
}) {
  const percent = Math.min(100, (value / max) * 100);
  const heights = { sm: 4, md: 8, lg: 12 };
  const height = heights[size];
  const barColor = color || theme.accent;
  
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        height,
        background: theme.border,
        borderRadius: height / 2,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percent}%`,
          height: '100%',
          background: barColor,
          borderRadius: height / 2,
          transition: 'width 0.3s ease',
        }} />
      </div>
      {showLabel && (
        <div style={{ 
          marginTop: 4, 
          fontSize: 11, 
          color: theme.textMuted,
          textAlign: 'right',
        }}>
          {Math.round(percent)}%
        </div>
      )}
    </div>
  );
}

// Freshness indicator (decays over time)
function FreshnessIndicator({
  freshness,
  showLabel = true,
  theme,
}: {
  freshness: number;
  showLabel?: boolean;
  theme: Theme;
}) {
  const color = freshness > 0.5 ? theme.accent : freshness > 0.25 ? theme.warning : theme.danger;
  const label = freshness > 0.75 ? 'Fresh' : freshness > 0.5 ? 'Good' : freshness > 0.25 ? 'Aging' : 'Spoiling';
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 60,
        height: 6,
        background: theme.border,
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${freshness * 100}%`,
          height: '100%',
          background: color,
          borderRadius: 3,
        }} />
      </div>
      {showLabel && (
        <span style={{ fontSize: 11, color, minWidth: 50 }}>{label}</span>
      )}
    </div>
  );
}

// Growth stage indicator
function GrowthStage({
  stage,
  progress,
  theme,
}: {
  stage: 'seed' | 'sprout' | 'growing' | 'harvestable';
  progress: number;
  theme: Theme;
}) {
  const stages = ['seed', 'sprout', 'growing', 'harvestable'];
  const stageEmojis = ['🫘', '🌱', '🌿', '🌸'];
  const currentIndex = stages.indexOf(stage);
  
  return (
    <div>
      {/* Progress bar */}
      <div style={{
        height: 8,
        background: theme.border,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
      }}>
        <div style={{
          width: `${progress * 100}%`,
          height: '100%',
          background: stage === 'harvestable' ? theme.accent : theme.info,
          borderRadius: 4,
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
            <span style={{ fontSize: 16 }}>{stageEmojis[i]}</span>
            <span style={{ 
              fontSize: 9, 
              color: i === currentIndex ? theme.accent : theme.textMuted,
              textTransform: 'capitalize',
              fontWeight: i === currentIndex ? 600 : 400,
            }}>
              {s}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Coverage indicator (for lights)
function CoverageIndicator({
  coverage,
  total,
  theme,
}: {
  coverage: number;
  total: number;
  theme: Theme;
}) {
  return (
    <div>
      <div style={{ 
        fontSize: 11, 
        color: theme.textMuted, 
        marginBottom: 6,
      }}>
        Coverage: {coverage}/{total} slots
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{
            width: 24,
            height: 8,
            borderRadius: 2,
            background: i < coverage ? '#FFD54F' : theme.border,
            boxShadow: i < coverage ? '0 0 4px #FFD54F' : 'none',
          }} />
        ))}
      </div>
    </div>
  );
}

// Circular progress (for timers/cooldowns)
function CircularProgress({
  value,
  max = 1,
  size = 48,
  strokeWidth = 4,
  theme,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  theme: Theme;
}) {
  const percent = (value / max) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  
  return (
    <svg width={size} height={size}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={theme.border}
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={theme.accent}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
      />
      {/* Center text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={theme.text}
        fontSize={size * 0.25}
        fontWeight={600}
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

const meta: Meta = {
  title: 'Design System/Progress',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

export const LinearBars: StoryObj = {
  render: () => (
    <div style={{ 
      background: lightTheme.surface, 
      padding: 24, 
      borderRadius: 12,
      maxWidth: 400,
    }}>
      <h3 style={{ margin: '0 0 16px', fontFamily: 'system-ui', color: lightTheme.text }}>
        Progress Bars
      </h3>
      
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: lightTheme.textSecondary, marginBottom: 6 }}>Small</div>
          <ProgressBar theme={lightTheme} value={0.75} size="sm" />
        </div>
        <div>
          <div style={{ fontSize: 12, color: lightTheme.textSecondary, marginBottom: 6 }}>Medium (default)</div>
          <ProgressBar theme={lightTheme} value={0.5} showLabel />
        </div>
        <div>
          <div style={{ fontSize: 12, color: lightTheme.textSecondary, marginBottom: 6 }}>Large</div>
          <ProgressBar theme={lightTheme} value={0.3} size="lg" />
        </div>
        <div>
          <div style={{ fontSize: 12, color: lightTheme.textSecondary, marginBottom: 6 }}>Custom Color</div>
          <ProgressBar theme={lightTheme} value={0.6} color={lightTheme.money} />
        </div>
      </div>
    </div>
  ),
};

export const FreshnessLevels: StoryObj = {
  render: () => (
    <div style={{ 
      background: lightTheme.surface, 
      padding: 24, 
      borderRadius: 12,
      maxWidth: 300,
    }}>
      <h3 style={{ margin: '0 0 16px', fontFamily: 'system-ui', color: lightTheme.text }}>
        Freshness Levels
      </h3>
      
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: lightTheme.text }}>🌿 Basil</span>
          <FreshnessIndicator theme={lightTheme} freshness={0.95} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: lightTheme.text }}>🌱 Mint</span>
          <FreshnessIndicator theme={lightTheme} freshness={0.65} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: lightTheme.text }}>🍅 Tomatoes</span>
          <FreshnessIndicator theme={lightTheme} freshness={0.35} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: lightTheme.text }}>🥬 Lettuce</span>
          <FreshnessIndicator theme={lightTheme} freshness={0.1} />
        </div>
      </div>
    </div>
  ),
};

export const GrowthStages: StoryObj = {
  render: () => (
    <div style={{ 
      background: lightTheme.surface, 
      padding: 24, 
      borderRadius: 12,
      maxWidth: 350,
    }}>
      <h3 style={{ margin: '0 0 16px', fontFamily: 'system-ui', color: lightTheme.text }}>
        Plant Growth
      </h3>
      
      <div style={{ display: 'grid', gap: 24 }}>
        <GrowthStage theme={lightTheme} stage="seed" progress={0.05} />
        <GrowthStage theme={lightTheme} stage="sprout" progress={0.25} />
        <GrowthStage theme={lightTheme} stage="growing" progress={0.65} />
        <GrowthStage theme={lightTheme} stage="harvestable" progress={1.0} />
      </div>
    </div>
  ),
};

export const LightCoverage: StoryObj = {
  render: () => (
    <div style={{ 
      background: lightTheme.surface, 
      padding: 24, 
      borderRadius: 12,
    }}>
      <h3 style={{ margin: '0 0 16px', fontFamily: 'system-ui', color: lightTheme.text }}>
        Light Coverage
      </h3>
      
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: lightTheme.textSecondary, marginBottom: 8 }}>💡 Desk Lamp</div>
          <CoverageIndicator theme={lightTheme} coverage={1} total={4} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: lightTheme.textSecondary, marginBottom: 8 }}>📎 Clip Light</div>
          <CoverageIndicator theme={lightTheme} coverage={3} total={4} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: lightTheme.textSecondary, marginBottom: 8 }}>💡 LED Panel</div>
          <CoverageIndicator theme={lightTheme} coverage={6} total={6} />
        </div>
      </div>
    </div>
  ),
};

export const CircularProgressDemo: StoryObj = {
  render: () => (
    <div style={{ 
      background: lightTheme.surface, 
      padding: 24, 
      borderRadius: 12,
    }}>
      <h3 style={{ margin: '0 0 16px', fontFamily: 'system-ui', color: lightTheme.text }}>
        Circular Progress
      </h3>
      
      <div style={{ display: 'flex', gap: 24 }}>
        <CircularProgress theme={lightTheme} value={0.25} />
        <CircularProgress theme={lightTheme} value={0.5} />
        <CircularProgress theme={lightTheme} value={0.75} />
        <CircularProgress theme={lightTheme} value={1.0} />
      </div>
    </div>
  ),
};

export const DarkTheme: StoryObj = {
  render: () => (
    <div style={{ 
      background: darkTheme.bg, 
      padding: 24, 
      borderRadius: 12,
    }}>
      <h3 style={{ margin: '0 0 16px', fontFamily: 'system-ui', color: darkTheme.text }}>
        Dark Theme Progress
      </h3>
      
      <div style={{ display: 'grid', gap: 24 }}>
        <ProgressBar theme={darkTheme} value={0.6} showLabel />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: darkTheme.text }}>🌿 Basil</span>
          <FreshnessIndicator theme={darkTheme} freshness={0.7} />
        </div>
        
        <CoverageIndicator theme={darkTheme} coverage={3} total={5} />
        
        <div style={{ display: 'flex', gap: 16 }}>
          <CircularProgress theme={darkTheme} value={0.6} />
          <CircularProgress theme={darkTheme} value={0.3} size={64} strokeWidth={6} />
        </div>
      </div>
    </div>
  ),
};
