// Urgency-related utility functions and constants

// Default urgency options for exit conditions
export const DEFAULT_EXIT_URGENCIES = [
  { key: 'ULTRA_LOW', name: 'Very Low' },
  { key: 'LOW', name: 'Low' },
  { key: 'MEDIUM', name: 'Medium' },
  { key: 'HIGH', name: 'High' },
  { key: 'ULTRA_HIGH', name: 'Very High' },
];

// Map urgency levels to their respective slippage percentages
// These values match the backend DEX order configs in oms/lib/auto_order.py
export const URGENCY_SLIPPAGE_MAP = {
  ULTRA_LOW: '0.01%', // Decimal("0.0001") = 0.01%
  LOW: '0.05%', // Decimal("0.0005") = 0.05%
  MEDIUM: '1%', // Decimal("0.01") = 1%
  HIGH: '5%', // Decimal("0.05") = 5%
  ULTRA_HIGH: '25%', // Decimal("0.25") = 25%
  VERY_HIGH: '25%', // Handle both naming conventions
};

/**
 * Get display name for urgency
 * @param {string|object} urgencyParam - Urgency value (string key or object with name property)
 * @returns {string} Formatted display name
 */
export const getUrgencyDisplayName = (urgencyParam) => {
  if (!urgencyParam) return '';

  // If it's an object with name property, use it
  if (urgencyParam?.name) return urgencyParam.name;

  // If it's a string key, convert it to display name
  if (typeof urgencyParam === 'string') {
    const urgencyKey = urgencyParam.toUpperCase();
    if (urgencyKey === 'ULTRA_HIGH') return 'Very High';
    if (urgencyKey === 'ULTRA_LOW') return 'Very Low';
    if (urgencyKey === 'LOW') return 'Low';
    if (urgencyKey === 'MEDIUM') return 'Medium';
    if (urgencyKey === 'HIGH') return 'High';
    // Fallback: convert underscore to space and capitalize
    return urgencyKey
      .replace('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  return urgencyParam;
};

/**
 * Format urgency display for UI (consistent naming)
 * @param {string|object} urgency - Urgency value
 * @returns {string} Formatted urgency string
 */
export const formatUrgencyDisplay = (urgency) => {
  if (!urgency) return '';
  // Handle both string and object formats
  const urgencyValue = typeof urgency === 'string' ? urgency : urgency.key || urgency.name || urgency;

  // Use the same display logic as getUrgencyDisplayName for consistency
  return getUrgencyDisplayName(urgencyValue);
};

/**
 * Get slippage percentage for urgency level
 * @param {string} urgency - Urgency level key
 * @returns {string} Slippage percentage or '-' if not found
 */
export const getSlippageForUrgency = (urgency) => {
  if (!urgency) return '-';
  return URGENCY_SLIPPAGE_MAP[urgency] || '-';
};

/**
 * Get urgency key for theme color lookup
 * @param {string|object} urgency - Urgency value
 * @returns {string} Urgency key for theme color access
 */
export const getUrgencyKeyForTheme = (urgency) => {
  if (!urgency) return '';
  // Handle both string and object formats
  const urgencyValue = typeof urgency === 'string' ? urgency : urgency.key || urgency.name || urgency;
  return urgencyValue.toUpperCase();
};

/**
 * Map urgency level to exit strategy type
 * @param {string} urgency - Urgency level key
 * @returns {string} Strategy type ('iceberg', 'vwap', or 'taker')
 */
export const getExitStrategyFromUrgency = (urgency) => {
  if (!urgency) return 'iceberg';

  const urgencyKey = urgency.toUpperCase();

  // Map urgency levels to strategies
  switch (urgencyKey) {
    case 'ULTRA_LOW':
    case 'LOW':
      return 'iceberg'; // Low urgency = iceberg strategy
    case 'MEDIUM':
      return 'vwap'; // Medium urgency = VWAP strategy
    case 'HIGH':
    case 'ULTRA_HIGH':
      return 'taker'; // High urgency = taker strategy
    default:
      return 'iceberg'; // Default to iceberg
  }
};
