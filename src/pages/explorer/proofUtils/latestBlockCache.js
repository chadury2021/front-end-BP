/**
 * Cache implementation for latest active block with automatic invalidation
 */

const CACHE_KEY = 'latestActiveBlock';
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * @typedef {Object} CachedBlock
 * @property {number} blockNumber - The latest active block number
 * @property {number} timestamp - When this block was cached
 */

/**
 * Gets the cached latest active block if it exists and is not expired
 * @param {string} rpcUrl - The RPC URL used as part of the cache key
 * @param {string} attestationAddress - The contract address used as part of the cache key
 * @returns {number|null} The cached block number or null if not found/expired
 */
export function getCachedLatestActiveBlock(rpcUrl, attestationAddress) {
  try {
    const key = `${CACHE_KEY}:${rpcUrl}:${attestationAddress}`;
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { blockNumber, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - timestamp > CACHE_DURATION_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return blockNumber;
  } catch (error) {
    console.error('[getCachedLatestActiveBlock] Error reading cache:', error);
    return null;
  }
}

/**
 * Caches the latest active block with current timestamp
 * @param {string} rpcUrl - The RPC URL used as part of the cache key
 * @param {string} attestationAddress - The contract address used as part of the cache key
 * @param {number} blockNumber - The block number to cache
 */
export function cacheLatestActiveBlock(rpcUrl, attestationAddress, blockNumber) {
  try {
    const key = `${CACHE_KEY}:${rpcUrl}:${attestationAddress}`;
    const value = {
      blockNumber,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('[cacheLatestActiveBlock] Error writing cache:', error);
  }
} 