import type { Preview } from '@storybook/react-vite'

// Custom mobile-first viewports
const mobileViewports = {
  iPhoneSE: {
    name: 'iPhone SE (375px)',
    styles: {
      width: '375px',
      height: '667px',
    },
  },
  iPhone14: {
    name: 'iPhone 14 (390px)',
    styles: {
      width: '390px',
      height: '844px',
    },
  },
  iPad: {
    name: 'iPad (768px)',
    styles: {
      width: '768px',
      height: '1024px',
    },
  },
  desktop: {
    name: 'Desktop (1280px)',
    styles: {
      width: '1280px',
      height: '800px',
    },
  },
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },

    viewport: {
      viewports: mobileViewports,
      defaultViewport: 'iPhoneSE',  // Mobile-first: default to smallest viewport
    },
  },
};

export default preview;