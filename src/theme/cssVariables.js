/**
 * CSS Custom Properties (CSS Variables) from Theme
 *
 * These variables are automatically set by the ThemeProvider in index.jsx
 * and can be used in any CSS file or styled-components.
 *
 * Usage examples:
 *
 * In CSS:
 * .my-component {
 *   background-color: var(--background-card);
 *   color: var(--text-primary);
 *   padding: var(--spacing-4);
 *   border-radius: var(--border-radius-medium);
 * }
 *
 * In styled-components:
 * const StyledDiv = styled.div`
 *   background-color: var(--background-card);
 *   color: var(--text-primary);
 *   font-family: var(--font-family);
 * `;
 *
 * In inline styles:
 * <div style={{ backgroundColor: 'var(--primary-main)' }}>
 */

export const CSS_VARIABLES = {
  // Background colors
  BACKGROUND: {
    APP: '--app-background-color',
    PAPER: '--background-paper',
    CARD: '--background-card',
    CONTAINER: '--background-container',
  },

  // Text colors
  TEXT: {
    PRIMARY: '--text-primary',
    SECONDARY: '--text-secondary',
    DISABLED: '--text-disabled',
    SUBTITLE: '--text-subtitle',
  },

  // Brand colors
  BRAND: {
    PRIMARY_MAIN: '--primary-main',
    PRIMARY_LIGHT: '--primary-light',
    PRIMARY_DARK: '--primary-dark',
  },

  // Semantic colors
  SEMANTIC: {
    SUCCESS: '--success-main',
    ERROR: '--error-main',
    WARNING: '--warning-main',
    INFO: '--info-main',
  },

  // UI colors
  UI: {
    BORDER: '--ui-border',
    BACKGROUND_LIGHT: '--ui-background-light',
    BACKGROUND_MEDIUM: '--ui-background-medium',
    BACKGROUND_DARK: '--ui-background-dark',
    CARD_BACKGROUND: '--ui-card-background',
    INPUT_BACKGROUND: '--ui-input-background',
    INPUT_BORDER: '--ui-input-border',
  },

  // Chart colors
  CHART: {
    RED: '--chart-red',
    GREEN: '--chart-green',
    ORANGE: '--chart-orange',
    BLUE: '--chart-blue',
    GRAY: '--chart-gray',
  },

  // Common colors
  COMMON: {
    WHITE: '--white',
    BLACK: '--black',
    TRANSPARENT: '--transparent',
  },

  // Typography
  TYPOGRAPHY: {
    FONT_FAMILY: '--font-family',
    FONT_FAMILY_PRIMARY: '--font-family-primary',
    FONT_FAMILY_MONOSPACE: '--font-family-monospace',
    FONT_FAMILY_GATE_SANS: '--font-family-gate-sans',
    H1_SIZE: '--font-size-h1',
    H2_SIZE: '--font-size-h2',
    H3_SIZE: '--font-size-h3',
    BODY1_SIZE: '--font-size-body1',
    BODY2_SIZE: '--font-size-body2',
    SMALL1_SIZE: '--font-size-small1',
    SMALL2_SIZE: '--font-size-small2',
  },

  // Spacing
  SPACING: {
    XS: '--spacing-1',
    SM: '--spacing-2',
    MD: '--spacing-3',
    LG: '--spacing-4',
    XL: '--spacing-6',
    XXL: '--spacing-8',
  },

  // Border radius
  BORDER_RADIUS: {
    SMALL: '--border-radius-small',
    MEDIUM: '--border-radius-medium',
    LARGE: '--border-radius-large',
  },

  // Shadows
  SHADOW: {
    LIGHT: '--shadow-light',
    MEDIUM: '--shadow-medium',
    HEAVY: '--shadow-heavy',
  },
};

/**
 * Helper function to get CSS variable value
 * @param {string} variable - CSS variable name (e.g., '--primary-main')
 * @returns {string} - CSS variable reference (e.g., 'var(--primary-main)')
 */
export const cssVar = (variable) => `var(${variable})`;

/**
 * Helper function to get CSS variable value with fallback
 * @param {string} variable - CSS variable name
 * @param {string} fallback - Fallback value
 * @returns {string} - CSS variable with fallback (e.g., 'var(--primary-main, #ff9830)')
 */
export const cssVarWithFallback = (variable, fallback) => `var(${variable}, ${fallback})`;

// Example usage:
// const styles = {
//   container: {
//     backgroundColor: cssVar(CSS_VARIABLES.BACKGROUND.CARD),
//     color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
//     padding: cssVar(CSS_VARIABLES.SPACING.LG),
//     borderRadius: cssVar(CSS_VARIABLES.BORDER_RADIUS.MEDIUM),
//   }
// };
