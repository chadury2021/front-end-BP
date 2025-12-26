/**
 * Font Family Tokens
 *
 * This file contains font family tokens for consistent typography across themes.
 * Each theme can reference these tokens to maintain consistency while allowing
 * for theme-specific font choices.
 */

export const FONT_FAMILIES = {
  // Primary font families
  GATE_SANS: 'Gate_Sans',
  IBM_PLEX_SANS: 'IBM Plex Sans',
  IBM_PLEX_MONO: 'IBM Plex Mono',
  INTER: 'Inter',
  MONTSERRAT: 'Montserrat',
  MULI: 'Muli',

  // Fallback fonts
  ARIAL: 'Arial',
  SANS_SERIF: 'sans-serif',
  MONOSPACE: 'monospace',
};

/**
 * Font family combinations for different use cases
 */
export const FONT_COMBINATIONS = {
  // Gate theme font combinations
  GATE_PRIMARY: [FONT_FAMILIES.GATE_SANS, FONT_FAMILIES.ARIAL, FONT_FAMILIES.SANS_SERIF],
  GATE_MONOSPACE: [FONT_FAMILIES.IBM_PLEX_MONO, FONT_FAMILIES.MONOSPACE],

  // Other theme combinations
  IBM_PLEX_PRIMARY: [FONT_FAMILIES.IBM_PLEX_SANS, FONT_FAMILIES.ARIAL, FONT_FAMILIES.SANS_SERIF],
  IBM_PLEX_MONO_PRIMARY: [FONT_FAMILIES.IBM_PLEX_MONO, FONT_FAMILIES.MONOSPACE],
  INTER_PRIMARY: [FONT_FAMILIES.INTER, FONT_FAMILIES.ARIAL, FONT_FAMILIES.SANS_SERIF],
  MONTSERRAT_PRIMARY: [FONT_FAMILIES.MONTSERRAT, FONT_FAMILIES.ARIAL, FONT_FAMILIES.SANS_SERIF],
  MULI_PRIMARY: [FONT_FAMILIES.MULI, FONT_FAMILIES.ARIAL, FONT_FAMILIES.SANS_SERIF],
};

/**
 * Helper function to join font families with proper formatting
 * @param {string[]} fontFamilies - Array of font family names
 * @returns {string} - Joined font family string
 */
export const joinFontFamilies = (fontFamilies) => fontFamilies.join(', ');

/**
 * Font family tokens for CSS variables
 */
export const FONT_FAMILY_TOKENS = {
  GATE_SANS: '--font-family-gate-sans',
  IBM_PLEX_SANS: '--font-family-ibm-plex-sans',
  IBM_PLEX_MONO: '--font-family-ibm-plex-mono',
  INTER: '--font-family-inter',
  MONTSERRAT: '--font-family-montserrat',
  MULI: '--font-family-muli',
};

export default {
  FONT_FAMILIES,
  FONT_COMBINATIONS,
  joinFontFamilies,
  FONT_FAMILY_TOKENS,
};
