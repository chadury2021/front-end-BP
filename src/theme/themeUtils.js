/**
 * Theme utility functions and constants
 * Provides easy access to theme values and common styling patterns
 */

import { CSS_VARIABLES, cssVar } from './cssVariables';

/**
 * Common theme-based styling patterns
 */
export const themeStyles = {
  // Card styles
  card: {
    backgroundColor: cssVar(CSS_VARIABLES.BACKGROUND.CARD),
    borderRadius: cssVar(CSS_VARIABLES.BORDER_RADIUS.MEDIUM),
    padding: cssVar(CSS_VARIABLES.SPACING.LG),
    boxShadow: cssVar(CSS_VARIABLES.SHADOW.MEDIUM),
    border: `1px solid ${cssVar(CSS_VARIABLES.UI.BORDER)}`,
  },

  // Paper styles
  paper: {
    backgroundColor: cssVar(CSS_VARIABLES.BACKGROUND.PAPER),
    borderRadius: cssVar(CSS_VARIABLES.BORDER_RADIUS.MEDIUM),
    padding: cssVar(CSS_VARIABLES.SPACING.LG),
    boxShadow: cssVar(CSS_VARIABLES.SHADOW.LIGHT),
  },

  // Button styles
  primaryButton: {
    backgroundColor: cssVar(CSS_VARIABLES.BRAND.PRIMARY_MAIN),
    color: cssVar(CSS_VARIABLES.COMMON.WHITE),
    border: 'none',
    padding: `${cssVar(CSS_VARIABLES.SPACING.SM)} ${cssVar(CSS_VARIABLES.SPACING.MD)}`,
    borderRadius: cssVar(CSS_VARIABLES.BORDER_RADIUS.SMALL),
    fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE),
    fontFamily: cssVar(CSS_VARIABLES.TYPOGRAPHY.FONT_FAMILY),
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  secondaryButton: {
    backgroundColor: cssVar(CSS_VARIABLES.UI.BACKGROUND_LIGHT),
    color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
    border: `1px solid ${cssVar(CSS_VARIABLES.UI.BORDER)}`,
    padding: `${cssVar(CSS_VARIABLES.SPACING.SM)} ${cssVar(CSS_VARIABLES.SPACING.MD)}`,
    borderRadius: cssVar(CSS_VARIABLES.BORDER_RADIUS.SMALL),
    fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE),
    fontFamily: cssVar(CSS_VARIABLES.TYPOGRAPHY.FONT_FAMILY),
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },

  // Input styles
  input: {
    backgroundColor: cssVar(CSS_VARIABLES.UI.INPUT_BACKGROUND),
    color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
    border: `1px solid ${cssVar(CSS_VARIABLES.UI.INPUT_BORDER)}`,
    borderRadius: cssVar(CSS_VARIABLES.BORDER_RADIUS.SMALL),
    padding: cssVar(CSS_VARIABLES.SPACING.SM),
    fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE),
    fontFamily: cssVar(CSS_VARIABLES.TYPOGRAPHY.FONT_FAMILY),
  },

  // Typography styles
  heading1: {
    fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.H1_SIZE),
    color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
    fontFamily: cssVar(CSS_VARIABLES.TYPOGRAPHY.FONT_FAMILY),
    fontWeight: 400,
  },

  heading2: {
    fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.H2_SIZE),
    color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
    fontFamily: cssVar(CSS_VARIABLES.TYPOGRAPHY.FONT_FAMILY),
    fontWeight: 400,
  },

  heading3: {
    fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.H3_SIZE),
    color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
    fontFamily: cssVar(CSS_VARIABLES.TYPOGRAPHY.FONT_FAMILY),
    fontWeight: 400,
  },

  bodyText: {
    fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE),
    color: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
    fontFamily: cssVar(CSS_VARIABLES.TYPOGRAPHY.FONT_FAMILY),
  },

  secondaryText: {
    fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY2_SIZE),
    color: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
    fontFamily: cssVar(CSS_VARIABLES.TYPOGRAPHY.FONT_FAMILY),
  },

  smallText: {
    fontSize: cssVar(CSS_VARIABLES.TYPOGRAPHY.SMALL1_SIZE),
    color: cssVar(CSS_VARIABLES.TEXT.SUBTITLE),
    fontFamily: cssVar(CSS_VARIABLES.TYPOGRAPHY.FONT_FAMILY),
  },

  // Status colors
  success: {
    color: cssVar(CSS_VARIABLES.SEMANTIC.SUCCESS),
    backgroundColor: `${cssVar(CSS_VARIABLES.SEMANTIC.SUCCESS)}20`,
  },

  error: {
    color: cssVar(CSS_VARIABLES.SEMANTIC.ERROR),
    backgroundColor: `${cssVar(CSS_VARIABLES.SEMANTIC.ERROR)}20`,
  },

  warning: {
    color: cssVar(CSS_VARIABLES.SEMANTIC.WARNING),
    backgroundColor: `${cssVar(CSS_VARIABLES.SEMANTIC.WARNING)}20`,
  },

  info: {
    color: cssVar(CSS_VARIABLES.SEMANTIC.INFO),
    backgroundColor: `${cssVar(CSS_VARIABLES.SEMANTIC.INFO)}20`,
  },

  // Layout utilities
  container: {
    padding: cssVar(CSS_VARIABLES.SPACING.LG),
    backgroundColor: cssVar(CSS_VARIABLES.BACKGROUND.APP),
  },

  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  flexBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Spacing utilities
  spacing: {
    xs: cssVar(CSS_VARIABLES.SPACING.XS),
    sm: cssVar(CSS_VARIABLES.SPACING.SM),
    md: cssVar(CSS_VARIABLES.SPACING.MD),
    lg: cssVar(CSS_VARIABLES.SPACING.LG),
    xl: cssVar(CSS_VARIABLES.SPACING.XL),
    xxl: cssVar(CSS_VARIABLES.SPACING.XXL),
  },
};

/**
 * Get semantic color based on value
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @returns {object} - Color and background color styles
 */
export const getSemanticColor = (type) => {
  const colors = {
    success: themeStyles.success,
    error: themeStyles.error,
    warning: themeStyles.warning,
    info: themeStyles.info,
  };
  return colors[type] || themeStyles.info;
};

/**
 * Get status color for numeric values
 * @param {number} value - Numeric value
 * @param {number} threshold - Threshold for positive/negative
 * @returns {object} - Success or error color styles
 */
export const getValueColor = (value, threshold = 0) => {
  return value >= threshold ? themeStyles.success : themeStyles.error;
};

/**
 * Create responsive spacing
 * @param {string} size - Spacing size
 * @returns {object} - Responsive spacing styles
 */
export const getResponsiveSpacing = (size) => ({
  padding: cssVar(CSS_VARIABLES.SPACING[size]),
  '@media (max-width: 768px)': {
    padding: cssVar(CSS_VARIABLES.SPACING.SM),
  },
});

/**
 * Create hover effects
 * @param {object} baseStyles - Base styles
 * @returns {object} - Styles with hover effects
 */
export const addHoverEffect = (baseStyles) => ({
  ...baseStyles,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: cssVar(CSS_VARIABLES.SHADOW.MEDIUM),
  },
});

/**
 * Create focus styles for accessibility
 * @param {object} baseStyles - Base styles
 * @returns {object} - Styles with focus effects
 */
export const addFocusEffect = (baseStyles) => ({
  ...baseStyles,
  '&:focus': {
    outline: `2px solid ${cssVar(CSS_VARIABLES.BRAND.PRIMARY_MAIN)}`,
    outlineOffset: '2px',
  },
});

export default themeStyles;
