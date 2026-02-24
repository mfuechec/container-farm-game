import type { Meta, StoryObj } from '@storybook/react';
import { HousingPreview } from '../housing/HousingPreview';
import { HOUSING_TIERS, calculateDeposit } from '../housing/types';
import { ThemeProvider } from '../theme';

const meta = {
  title: 'Housing/HousingPreview',
  component: HousingPreview,
  parameters: {
    layout: 'centered',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div style={{ width: 375, padding: 16 }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof HousingPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

const studio = HOUSING_TIERS[0];
const oneBR = HOUSING_TIERS[1];
const twoBR = HOUSING_TIERS[2];

// Upgrading from studio to 1BR
export const UpgradeTo1BR: Story = {
  args: {
    tier: oneBR,
    currentTier: studio,
    currentDeposit: calculateDeposit(studio),
    currentHobbies: ['plants'],
    money: 200,
    onMove: () => console.log('Move!'),
    onCancel: () => console.log('Cancel'),
    onNeedsHobbySelection: (max) => console.log('Select hobbies:', max),
  },
};

// Upgrading from 1BR to 2BR
export const UpgradeTo2BR: Story = {
  args: {
    tier: twoBR,
    currentTier: oneBR,
    currentDeposit: calculateDeposit(oneBR),
    currentHobbies: ['plants', 'mushrooms'],
    money: 500,
    onMove: () => console.log('Move!'),
    onCancel: () => console.log('Cancel'),
    onNeedsHobbySelection: (max) => console.log('Select hobbies:', max),
  },
};

// Downgrading from 2BR to studio (needs hobby selection)
export const DowngradeNeedsSelection: Story = {
  args: {
    tier: studio,
    currentTier: twoBR,
    currentDeposit: calculateDeposit(twoBR),
    currentHobbies: ['plants', 'mushrooms', 'woodworking'],
    money: 100,
    onMove: () => console.log('Move!'),
    onCancel: () => console.log('Cancel'),
    onNeedsHobbySelection: (max) => console.log('Select hobbies:', max),
  },
};

// Cannot afford upgrade
export const CannotAfford: Story = {
  args: {
    tier: twoBR,
    currentTier: studio,
    currentDeposit: calculateDeposit(studio),
    currentHobbies: ['plants'],
    money: 50, // Not enough for $140 net cost
    onMove: () => console.log('Move!'),
    onCancel: () => console.log('Cancel'),
    onNeedsHobbySelection: (max) => console.log('Select hobbies:', max),
  },
};

// Viewing current home
export const CurrentHome: Story = {
  args: {
    tier: oneBR,
    currentTier: oneBR,
    currentDeposit: calculateDeposit(oneBR),
    currentHobbies: ['plants'],
    money: 500,
    onMove: () => console.log('Move!'),
    onCancel: () => console.log('Cancel'),
    onNeedsHobbySelection: (max) => console.log('Select hobbies:', max),
  },
};

// Studio blueprint preview
export const StudioPreview: Story = {
  args: {
    tier: studio,
    currentTier: oneBR,
    currentDeposit: calculateDeposit(oneBR),
    currentHobbies: ['plants'],
    money: 500,
    onMove: () => console.log('Move!'),
    onCancel: () => console.log('Cancel'),
    onNeedsHobbySelection: (max) => console.log('Select hobbies:', max),
  },
};

// 2BR blueprint preview
export const TwoBRPreview: Story = {
  args: {
    tier: twoBR,
    currentTier: studio,
    currentDeposit: calculateDeposit(studio),
    currentHobbies: [],
    money: 500,
    onMove: () => console.log('Move!'),
    onCancel: () => console.log('Cancel'),
    onNeedsHobbySelection: (max) => console.log('Select hobbies:', max),
  },
};
