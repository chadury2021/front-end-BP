/**
 * React hook for accessing theme styles and utilities
 * Provides easy access to theme-based styling patterns
 */

import { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { themeStyles, getSemanticColor, getValueColor, addHoverEffect, addFocusEffect } from './themeUtils';
import { CSS_VARIABLES, cssVar } from './cssVariables';

/**
 * Hook for accessing theme styles and utilities
 * @returns {object} - Theme utilities and common styles
 */
export const useThemeStyles = () => {
  const muiTheme = useTheme();

  const themeUtils = useMemo(() => ({
    // Common styles
    styles: themeStyles,

    // Utility functions
    getSemanticColor,
    getValueColor,
    addHoverEffect,
    addFocusEffect,

    // CSS variables
    cssVar,
    CSS_VARIABLES,

    // MUI theme access (for complex cases)
    muiTheme,

    // Quick access to common values
    colors: {
      primary: cssVar(CSS_VARIABLES.BRAND.PRIMARY_MAIN),
      success: cssVar(CSS_VARIABLES.SEMANTIC.SUCCESS),
      error: cssVar(CSS_VARIABLES.SEMANTIC.ERROR),
      warning: cssVar(CSS_VARIABLES.SEMANTIC.WARNING),
      info: cssVar(CSS_VARIABLES.SEMANTIC.INFO),
      text: {
        primary: cssVar(CSS_VARIABLES.TEXT.PRIMARY),
        secondary: cssVar(CSS_VARIABLES.TEXT.SECONDARY),
        disabled: cssVar(CSS_VARIABLES.TEXT.DISABLED),
        subtitle: cssVar(CSS_VARIABLES.TEXT.SUBTITLE),
      },
      background: {
        app: cssVar(CSS_VARIABLES.BACKGROUND.APP),
        paper: cssVar(CSS_VARIABLES.BACKGROUND.PAPER),
        card: cssVar(CSS_VARIABLES.BACKGROUND.CARD),
        container: cssVar(CSS_VARIABLES.BACKGROUND.CONTAINER),
      },
    },

    // Typography
    typography: {
      fontFamily: cssVar(CSS_VARIABLES.TYPOGRAPHY.FONT_FAMILY),
      h1: cssVar(CSS_VARIABLES.TYPOGRAPHY.H1_SIZE),
      h2: cssVar(CSS_VARIABLES.TYPOGRAPHY.H2_SIZE),
      h3: cssVar(CSS_VARIABLES.TYPOGRAPHY.H3_SIZE),
      body1: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY1_SIZE),
      body2: cssVar(CSS_VARIABLES.TYPOGRAPHY.BODY2_SIZE),
      small1: cssVar(CSS_VARIABLES.TYPOGRAPHY.SMALL1_SIZE),
      small2: cssVar(CSS_VARIABLES.TYPOGRAPHY.SMALL2_SIZE),
    },

    // Spacing
    spacing: {
      xs: cssVar(CSS_VARIABLES.SPACING.XS),
      sm: cssVar(CSS_VARIABLES.SPACING.SM),
      md: cssVar(CSS_VARIABLES.SPACING.MD),
      lg: cssVar(CSS_VARIABLES.SPACING.LG),
      xl: cssVar(CSS_VARIABLES.SPACING.XL),
      xxl: cssVar(CSS_VARIABLES.SPACING.XXL),
    },

    // Border radius
    borderRadius: {
      small: cssVar(CSS_VARIABLES.BORDER_RADIUS.SMALL),
      medium: cssVar(CSS_VARIABLES.BORDER_RADIUS.MEDIUM),
      large: cssVar(CSS_VARIABLES.BORDER_RADIUS.LARGE),
    },

    // Shadows
    shadows: {
      light: cssVar(CSS_VARIABLES.SHADOW.LIGHT),
      medium: cssVar(CSS_VARIABLES.SHADOW.MEDIUM),
      heavy: cssVar(CSS_VARIABLES.SHADOW.HEAVY),
    },
  }), [muiTheme]);

  return themeUtils;
};

export default useThemeStyles;
