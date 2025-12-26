import { ethers } from 'ethers';

/**
 * Hash data using keccak256 to generate trader ID
 * @param {string} data - Data to hash (typically API key)
 * @returns {string} Hashed data
 */
export const hashData = /** @type {(data: string) => string} */ (data) => {
  return ethers.keccak256(ethers.toUtf8Bytes(data));
};

/**
 * Generate trader ID from API key
 * @param {string} apiKey - API key to generate trader ID from
 * @returns {string} Trader ID
 */
export const generateTraderId = /** @type {(apiKey: string) => string} */ (apiKey) => {
  return hashData(apiKey);
};

/**
 * Format trader ID for display by truncating with ellipsis
 * @param {string} traderId - Full trader ID
 * @param {number} startChars - Number of starting characters to show
 * @param {number} endChars - Number of ending characters to show
 * @returns {string} Formatted trader ID
 */
export const formatTraderId = /** @type {(traderId: string, startChars?: number, endChars?: number) => string} */ (
  traderId,
  startChars = 4,
  endChars = 3
) => {
  if (!traderId) {
    return '';
  }

  // Remove '0x' prefix if present for display purposes
  const cleanId = traderId.startsWith('0x') ? traderId.slice(2) : traderId;

  if (cleanId.length <= startChars + endChars) {
    return cleanId;
  }

  const start = cleanId.slice(0, startChars);
  const end = cleanId.slice(-1 * endChars);

  return `${start}...${end}`;
};

/**
 * Checks if a string matches a trader ID, considering both with and without '0x' prefix
 * @param {string} searchString - String to search for
 * @param {string} traderId - Trader ID to match against
 * @returns {boolean} True if matches either format
 */
export const matchesTraderId = (searchString, traderId) => {
  if (!searchString || !traderId) return false;

  // Normalize both values by removing 0x and lowercase
  const normalize = (str) => str.replace(/^0x/, '').toLowerCase();
  return normalize(searchString) === normalize(traderId);
};

/**
 * Checks if a string is in list of trader IDs, considering both with and without '0x' prefix
 * @param {string} searchString - String to search for
 * @param {string} traderIds - List of Trader IDs to match against
 * @returns {boolean} True if matches either format
 */
export const matchesTraderIds = (searchString, traderIds) => {
  // Normalize both values by removing 0x and lowercase
  const normalize = (str) => str.replace(/^0x/, '').toLowerCase();

  const normalizedIds = traderIds.map((id) => normalize(id));
  return normalizedIds.includes(normalize(searchString));
};
