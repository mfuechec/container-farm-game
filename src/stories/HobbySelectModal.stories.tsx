import type { Meta, StoryObj } from '@storybook/react';
import { HobbySelectModal } from '../housing/HobbySelectModal';
import { ThemeProvider } from '../theme';

const meta = {
  title: 'Housing/HobbySelectModal',
  component: HobbySelectModal,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div style={{ 
          width: '100%', 
          height: '100vh', 
          position: 'relative',
          background: '#1a1a2e',
        }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof HobbySelectModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Downgrading from 3 hobbies to 1 slot
export const KeepOneOfThree: Story = {
  args: {
    hobbies: [
      { index: 0, type: 'plants', name: 'Container Farm', emoji: '🌱' },
      { index: 1, type: 'mushrooms', name: 'Mushroom Farm', emoji: '🍄' },
      { index: 2, type: 'woodworking', name: 'Woodworking', emoji: '🪵' },
    ],
    maxSlots: 1,
    onConfirm: (indices) => console.log('Keep indices:', indices),
    onCancel: () => console.log('Cancelled'),
  },
};

// Downgrading from 3 hobbies to 2 slots
export const KeepTwoOfThree: Story = {
  args: {
    hobbies: [
      { index: 0, type: 'plants', name: 'Container Farm', emoji: '🌱' },
      { index: 1, type: 'mushrooms', name: 'Mushroom Farm', emoji: '🍄' },
      { index: 2, type: 'woodworking', name: 'Woodworking', emoji: '🪵' },
    ],
    maxSlots: 2,
    onConfirm: (indices) => console.log('Keep indices:', indices),
    onCancel: () => console.log('Cancelled'),
  },
};

// Downgrading from 2 hobbies to 1 slot
export const KeepOneOfTwo: Story = {
  args: {
    hobbies: [
      { index: 0, type: 'plants', name: 'Container Farm', emoji: '🌱' },
      { index: 1, type: 'mushrooms', name: 'Mushroom Farm', emoji: '🍄' },
    ],
    maxSlots: 1,
    onConfirm: (indices) => console.log('Keep indices:', indices),
    onCancel: () => console.log('Cancelled'),
  },
};

// Only plants and mushrooms
export const PlantsAndMushrooms: Story = {
  args: {
    hobbies: [
      { index: 0, type: 'plants', name: 'Container Farm', emoji: '🌱' },
      { index: 1, type: 'mushrooms', name: 'Mushroom Farm', emoji: '🍄' },
    ],
    maxSlots: 1,
    onConfirm: (indices) => console.log('Keep indices:', indices),
    onCancel: () => console.log('Cancelled'),
  },
};
