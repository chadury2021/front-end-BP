import { FONT_COMBINATIONS, joinFontFamilies } from './fontTokens';

const typography = {
  // Font family configuration - can be overridden by themes
  fontFamily: {
    primary: ['IBM PLEX MONO'].join(','),
    monospace: ['monospace', 'IBM Plex Mono'],
  },

  // Theme-specific font configurations
  themes: {
    blue: {
      primary: ['Inter', 'Arial', 'sans-serif'].join(','), // UI text
      monospace: ['IBM Plex Mono', 'monospace'].join(','), // Numbers/data
      numbers: ['IBM Plex Mono', 'monospace'].join(','), // Specifically for numbers
      ui: ['Inter', 'Arial', 'sans-serif'].join(','), // UI elements
      text: ['Inter', 'Arial', 'sans-serif'].join(','), // Text labels, pair names, etc.
      data: ['IBM Plex Mono', 'monospace'].join(','), // Financial data, prices, quantities
    },
    light: {
      primary: ['IBM PLEX MONO'].join(','),
      monospace: ['monospace', 'IBM Plex Mono'],
      numbers: ['IBM Plex Mono', 'monospace'].join(','), // Numbers in light theme too
      ui: ['IBM PLEX MONO'].join(','), // Keep monospace for light theme UI
      text: ['IBM PLEX MONO'].join(','), // Text labels in light theme
      data: ['IBM Plex Mono', 'monospace'].join(','), // Financial data
    },
    bybit: {
      primary: ['IBM Plex Sans', 'Arial', 'sans-serif'].join(','), // UI text
      monospace: ['IBM Plex Mono', 'monospace'].join(','), // Numbers/data
      numbers: ['IBM Plex Mono', 'monospace'].join(','), // Specifically for numbers
      ui: ['IBM Plex Sans', 'Arial', 'sans-serif'].join(','), // UI elements
      text: ['IBM Plex Sans', 'Arial', 'sans-serif'].join(','), // Text labels, pair names, etc.
      data: ['IBM Plex Mono', 'monospace'].join(','), // Financial data, prices, quantities
    },
    deribit: {
      primary: ['Inter', 'Arial', 'sans-serif'].join(','), // UI text
      monospace: ['IBM Plex Mono', 'monospace'].join(','), // Numbers/data
      numbers: ['IBM Plex Mono', 'monospace'].join(','), // Specifically for numbers
      ui: ['Inter', 'Arial', 'sans-serif'].join(','), // UI elements
      text: ['Inter', 'Arial', 'sans-serif'].join(','), // Text labels, pair names, etc.
      data: ['IBM Plex Mono', 'monospace'].join(','), // Financial data, prices, quantities
    },
    gate: {
      primary: joinFontFamilies(FONT_COMBINATIONS.GATE_PRIMARY), // Gate_Sans for UI text
      monospace: joinFontFamilies(FONT_COMBINATIONS.GATE_MONOSPACE), // Numbers/data
      numbers: joinFontFamilies(FONT_COMBINATIONS.GATE_MONOSPACE), // Specifically for numbers
      ui: joinFontFamilies(FONT_COMBINATIONS.GATE_PRIMARY), // Gate_Sans for UI elements
      text: joinFontFamilies(FONT_COMBINATIONS.GATE_PRIMARY), // Gate_Sans for text labels, pair names, etc.
      data: joinFontFamilies(FONT_COMBINATIONS.GATE_MONOSPACE), // Financial data, prices, quantities
    },
  },
  fontWeights: {
    weight100: 100,
    weight200: 200,
    weight300: 300,
    weight400: 400,
    weight500: 500,
    weight600: 600,
  },
  fontSizes: {
    100: '0.64rem', // Small 2
    200: '0.75rem', // Small 1, Overline, Button S, Link S, Body 3
    300: '0.81rem', // Button M, Link M, Body 2
    400: '0.88rem', // Button L, Link L, Subtitle 2, Body 1
    500: '1rem', // Subtitle 1
    600: '1.13rem', // Heading H6
    700: '1.25rem', // Heading H5
    800: '1.38rem', // Heading H4
    900: '1.5rem', // Heading H3
    1000: '1.63rem', // Heading H2
    1100: '1.75rem', // Heading H1
    1200: '1.88rem', // Display 4
    1300: '2rem', // Display 3
    1400: '2.13rem', // Display 2
    1500: '2.25rem', // Display 1
  },
  lineHeights: {
    100: '1rem', // Small 2
    200: '1.19rem', // Small 1, Overline, Button S, Link S, Body 3
    300: '1.25rem', // Button M, Link M, Body 2
    400: '1.38rem', // Button L, Link L, Subtitle 2, Body 1
    500: '1.5rem', // Subtitle 1
    600: '1.69rem', // Heading H6
    700: '1.88rem', // Heading H5
    800: '2rem', // Heading H4
    900: '2.13rem', // Heading H3
    1000: '2.25rem', // Heading H2
    1100: '2.38rem', // Heading H1
    1200: '2.5rem', // Display 4
    1300: '2.63rem', // Display 3
    1400: '2.75rem', // Display 2
    1500: '2.88rem', // Display 1
  },
};

export default typography;
