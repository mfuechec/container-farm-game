import type { Meta, StoryObj } from '@storybook/react';
import { CityMap } from '../housing/CityMap';
import { ThemeProvider } from '../theme';

const meta = {
  title: 'Housing/CityMap',
  component: CityMap,
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
} satisfies Meta<typeof CityMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StudioResident: Story = {
  args: {
    currentTierId: 1,
    money: 150,
    onSelectHousing: (tier) => console.log('Selected:', tier.name),
    onBack: () => console.log('Back'),
  },
};

export const OneBRResident: Story = {
  args: {
    currentTierId: 2,
    money: 500,
    onSelectHousing: (tier) => console.log('Selected:', tier.name),
    onBack: () => console.log('Back'),
  },
};

export const TwoBRResident: Story = {
  args: {
    currentTierId: 3,
    money: 1000,
    onSelectHousing: (tier) => console.log('Selected:', tier.name),
    onBack: () => console.log('Back'),
  },
};

export const BrokePlayer: Story = {
  args: {
    currentTierId: 1,
    money: 5,
    onSelectHousing: (tier) => console.log('Selected:', tier.name),
    onBack: () => console.log('Back'),
  },
};

export const RichPlayer: Story = {
  args: {
    currentTierId: 1,
    money: 9999,
    onSelectHousing: (tier) => console.log('Selected:', tier.name),
    onBack: () => console.log('Back'),
  },
};
