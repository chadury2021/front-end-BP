/**
 * Utility functions for position calculations and formatting
 */

import { formatMarginRatio, getMarginRatioColor, calculateMarginRatio } from './marginRatioUtils';
import { formatPrice } from '../util';

/**
 * Calculate average entry price for a position
 * @param {Object} asset - Asset data with size, notional, and symbol
 * @param {number} currentPrice - Current market price for the asset
 * @returns {number} Average entry price
 */
export const calculateEntryPrice = (asset, currentPrice = 0) => {
  const size = Number(asset.size || asset.amount || 0);
  const notional = Number(asset.notional || 0);
  const unrealizedProfit = Number(asset.unrealized_profit || 0);

  // If we have both size and notional, we can calculate the entry price
  // Entry price = (Notional - Unrealized PnL) / Size for all positions
  // This accounts for the fact that notional represents current value, not entry value
  if (size !== 0 && notional !== 0) {
    const adjustedNotional = notional - unrealizedProfit;
    return Math.abs(adjustedNotional / size);
  }

  // If we only have notional and current price, estimate entry price
  if (notional !== 0 && currentPrice && currentPrice > 0) {
    // Estimate entry price based on unrealized PnL
    // For all positions: Entry Price = Current Price - (Unrealized PnL / |Quantity|)
    const estimatedEntryPrice = currentPrice - (unrealizedProfit / Math.abs(size));
    return Math.max(0, estimatedEntryPrice);
  }

  return currentPrice || 0;
};



/**
 * Format entry price for display
 * @param {number} entryPrice - The entry price to format
 * @returns {string} Formatted entry price
 */
export const formatEntryPrice = (entryPrice) => {
  if (entryPrice === null || entryPrice === undefined || entryPrice === 0) {
    return '-';
  }

  return formatPrice(entryPrice);
};

/**
 * Get position data with calculated entry price and margin ratio
 * @param {Object} asset - Asset data
 * @param {number} currentPrice - Current market price (optional)
 * @returns {Object} Position data with calculated fields
 */
export const getPositionData = (asset, currentPrice = 0) => {
  const entryPrice = calculateEntryPrice(asset, currentPrice);
  const marginRatio = calculateMarginRatio(asset);

  return {
    ...asset,
    entryPrice,
    marginRatio,
    formattedEntryPrice: formatEntryPrice(entryPrice),
    formattedMarginRatio: formatMarginRatio(marginRatio),
    marginRatioColor: getMarginRatioColor(marginRatio),
  };
};
