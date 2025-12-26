/**
 * Utility functions for margin ratio calculations and styling
 */

// Consistent color constants for margin ratio styling
export const getMarginRatioColors = (theme) => ({
  VERY_SAFE: theme.palette.semantic.success,    // Green - very safe (≤5%)
  SAFE: theme.palette.semantic.success,         // Green - safe (≤10%)
  MODERATE: theme.palette.semantic.warning,     // Yellow - moderate (≤15%)
  RISKY: theme.palette.semantic.warning,        // Orange - risky (≤25%)
  VERY_RISKY: theme.palette.semantic.error,     // Red - very risky (>25%)
  NEUTRAL: theme.palette.text.primary,          // Default text color
});

/**
 * Calculate margin ratio for a position
 *
 * For Hyperliquid (based on https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margining):
 * - Cross margin: Margin ratio = Maintenance Margin / Account Value
 *   where Account Value includes unrealized PNL and is shared across all cross positions
 * - Isolated margin: Margin ratio = Maintenance Margin / (Isolated Margin + Unrealized PNL)
 *   where only the isolated position's margin and PNL are considered
 *
 * For other exchanges:
 * - Standard MMR formula: MMR = Maintenance Margin / Wallet Balance × 100%
 *
 * @param {Object} asset - Asset data with maint_margin, initial_margin, margin_balance, unrealized_profit, margin_mode
 * @param {number} accountBalanceUsd - Total account balance (for Hyperliquid cross margin)
 * @param {boolean} isHyperliquid - Whether this is a Hyperliquid account
 * @returns {number} Margin ratio percentage
 */
export const calculateMarginRatio = (asset, accountBalanceUsd = 0, isHyperliquid = false) => {
  const maintMargin = Number(asset.maint_margin || 0);
  const initialMargin = Number(asset.initial_margin || 0);
  const marginBalance = Number(asset.margin_balance || 0);
  const unrealizedProfit = Number(asset.unrealized_profit || 0);
  const notional = Math.abs(Number(asset.notional || 0));
  const marginMode = asset.margin_mode || 'CROSS'; // Default to CROSS if not specified

  if (isHyperliquid) {
    // Hyperliquid-specific calculations based on margin mode
    if (marginMode === 'ISOLATED' || marginMode === 'SPOT_ISOLATED') {
      // Isolated margin: Use isolated position's margin and unrealized PNL
      // Account value for this position = isolated margin + unrealized PNL
      const isolatedAccountValue = marginBalance + unrealizedProfit;

      if (isolatedAccountValue <= 0) {
        // If account value is negative or zero, position is at risk
        return 100;
      }

      // Margin ratio = Maintenance Margin / Isolated Account Value
      return (maintMargin / isolatedAccountValue) * 100;
    }

    // Cross margin: Use total account balance
    // liquidation occurs when: account value < maintenance margin × total notional
    if (accountBalanceUsd <= 0) {
      return 100;
    }

    // Margin ratio = Maintenance Margin / Total Account Value
    return (maintMargin / accountBalanceUsd) * 100;
  }

  // Standard Binance MMR formula: MMR = Maintenance Margin / Wallet Balance × 100%
  const positionWalletBalance = marginBalance > 0 ? marginBalance : notional;
  return positionWalletBalance > 0 ? (maintMargin / positionWalletBalance) * 100 : 0;
};

/**
 * Get the color for margin ratio based on the percentage value
 * @param {number} marginRatioPct - The margin ratio percentage
 * @returns {string} The color theme key (success.main, warning.main, error.main, or text.primary)
 */
export const getMarginRatioColor = (marginRatioPct) => {
  if (marginRatioPct === null || marginRatioPct === undefined || marginRatioPct === 0) {
    return 'text.primary';
  }

  if (marginRatioPct <= 5) {
    return 'success.main'; // Green - very safe
  } if (marginRatioPct <= 10) {
    return 'success.main'; // Green - safe
  } if (marginRatioPct <= 15) {
    return 'warning.main'; // Yellow - moderate
  } if (marginRatioPct <= 25) {
    return 'warning.main'; // Orange - risky
  }
    return 'error.main'; // Red - very risky

};

/**
 * Get the hex color for margin ratio based on the percentage value
 * @param {number} marginRatioPct - The margin ratio percentage
 * @param {Object} theme - The theme object
 * @returns {string} The hex color code
 */
export const getMarginRatioHexColor = (marginRatioPct, theme) => {
  const colors = getMarginRatioColors(theme);

  if (marginRatioPct === null || marginRatioPct === undefined || marginRatioPct === 0) {
    return colors.NEUTRAL;
  }

  if (marginRatioPct <= 5) {
    return colors.VERY_SAFE;
  } if (marginRatioPct <= 10) {
    return colors.SAFE;
  } if (marginRatioPct <= 15) {
    return colors.MODERATE;
  } if (marginRatioPct <= 25) {
    return colors.RISKY;
  }
    return colors.VERY_RISKY;

};

/**
 * Format margin ratio for display
 * @param {number} marginRatioPct - The margin ratio percentage
 * @returns {string} Formatted margin ratio with % symbol
 */
export const formatMarginRatio = (marginRatioPct) => {
  if (marginRatioPct === null || marginRatioPct === undefined || marginRatioPct === 0) {
    return '-';
  }

  return `${marginRatioPct.toFixed(1)}%`;
};

/**
 * Get the progress bar colors array for margin ratio visualization
 * @returns {string[]} Array of hex colors for progress bar segments
 */
export const getMarginRatioProgressBarColors = (theme) => {
  const colors = getMarginRatioColors(theme);
  return [
    colors.VERY_RISKY,  // Red - highest risk
    colors.RISKY,       // Orange - risky
    colors.MODERATE,    // Yellow - moderate
    colors.SAFE,        // Green - safe
    colors.VERY_SAFE,   // Green - very safe
  ];
};

/**
 * Get human-readable description of margin mode
 * @param {string} marginMode - The margin mode (CROSS, ISOLATED, SPOT_ISOLATED)
 * @returns {string} Human-readable description
 */
export const getMarginModeDescription = (marginMode) => {
  switch (marginMode) {
    case 'ISOLATED':
    case 'SPOT_ISOLATED':
      return 'Isolated';
    case 'CROSS':
      return 'Cross';
    default:
      return 'Cross'; // Default to cross margin
  }
};
