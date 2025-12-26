/**
 * Hook for fetching and caching trade data for a specific trader-epoch pair
 *
 * Features:
 * - Cursor-based pagination for efficient data loading
 * - Caching of results by traderId-epoch pair
 * - Error handling and loading states
 * - Date range filtering
 */

import { useContext, useEffect, useState, useCallback } from 'react';
import { atom, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { getArweaveData } from '@/apiServices';
import { bigIntStorage } from '../cacheUtils/bigIntStorage';
import { handle0xTraderId } from './handle0xTraderId';

// Cache atom for storing trader-epoch data
const traderEpochCacheAtom = atomWithStorage('taas-trader-epoch-cache', {}, bigIntStorage);

/**
 * Creates a unique cache key for a trader-epoch pair
 * @param {string} traderId - Trader identifier
 * @param {string|number} epoch - Epoch number
 * @returns {string} Cache key
 */
const createCacheKey = (traderId, epoch) => `${traderId}-${epoch}`;

/**
 * Normalizes a trader ID by removing '0x' prefix if present
 * @param {string} traderId - Trader ID to normalize
 * @returns {string} Normalized trader ID
 */
const normalizeId = (traderId) => traderId?.replace(/^0x/, '') || '';

/**
 * Hook for fetching and managing trade data for a specific trader-epoch pair
 * @param {Object} options - Hook configuration
 * @param {string} options.traderId - Trader identifier
 * @param {string|number} options.epoch - Epoch number
 * @param {Object} [options.dateRange] - Optional date range filter
 * @param {Date} [options.dateRange.start] - Start date
 * @param {Date} [options.dateRange.end] - End date
 * @param {number|null} [options.pageSize=25] - Number of items per page, or null to fetch all
 * @returns {Object} Trade data and control functions
 */
export function useTraderEpochData({ traderId, epoch, dateRange, pageSize = 25 }) {
  const [cache, setCache] = useAtom(traderEpochCacheAtom);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const { showAlert } = useContext(ErrorContext);

  // Normalize traderId before using
  const normalizedTraderId = normalizeId(traderId); // basically non0xTraderId
  const [non0xTraderId, traderId0x] = handle0xTraderId(traderId);
  const cacheKey = createCacheKey(normalizedTraderId, epoch);

  // Get cached data or initialize empty state
  const getCachedData = useCallback(
    (targetCacheKey = cacheKey) => {
      return cache[targetCacheKey] || { trades: [], cursor: null };
    },
    [cache, cacheKey]
  );

  /**
   * Fetches trade data with optional cursor for pagination
   */
  const fetchTradeData = useCallback(
    async (cursor = null) => {
      if (!normalizedTraderId || !epoch) {
        setLoading(false);
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const response = await getArweaveData(pageSize, cursor, {
          ...(traderId && { trader_id: [non0xTraderId, traderId0x] }),
          epoch,
          dateRange,
        });

        // If no edges, set hasMore to false and return
        if (!response.edges?.length) {
          setHasMore(false);
          setLoading(false);
          return [];
        }

        // Filter trades to only include those matching our trader ID
        const newTrades = response.edges
          .filter((edge) => {
            const tradeId = edge.node.tags.find((t) => t.name === 'trader_id')?.value;
            return tradeId === normalizedTraderId;
          })
          .map((edge) => ({
            ...edge.node,
            cursor: edge.cursor,
            epoch: edge.node.tags.find((t) => t.name === 'epoch')?.value || epoch,
            trader_id: edge.node.tags.find((t) => t.name === 'trader_id')?.value || normalizedTraderId,
            exchange_name: edge.node.tags.find((t) => t.name === 'exchange_name')?.value || '',
            merkle_root: edge.node.tags.find((t) => t.name === 'merkle_root')?.value || '',
          }));

        // Update cache - REPLACE instead of append if no cursor
        setCache((prevCache) => {
          const currentData = prevCache[cacheKey] || {
            trades: [],
            cursor: null,
          };
          return {
            ...prevCache,
            [cacheKey]: {
              trades: cursor ? [...currentData.trades, ...newTrades] : newTrades,
              cursor: response.edges[response.edges.length - 1]?.cursor || null,
            },
          };
        });

        setHasMore(newTrades.length === pageSize);
        return newTrades;
      } catch (err) {
        const errorMessage = `Error fetching trades: ${err.message}`;
        setError(errorMessage);
        showAlert({
          severity: 'error',
          message: errorMessage,
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [normalizedTraderId, epoch, pageSize, dateRange, cacheKey, setCache, showAlert]
  );

  /**
   * Loads the next page of data
   */
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const { cursor } = getCachedData(cacheKey);
    await fetchTradeData(cursor);
  }, [loading, hasMore, getCachedData, fetchTradeData]);

  /**
   * Clears cached data for the current trader-epoch pair
   */
  const clearCache = useCallback(() => {
    setCache((prevCache) => {
      const newCache = { ...prevCache };
      delete newCache[cacheKey];
      return newCache;
    });
  }, [cacheKey, setCache]);

  // Initial fetch - only if cache is empty
  useEffect(() => {
    const { trades } = getCachedData(cacheKey);
    if (trades.length === 0) {
      fetchTradeData(null); // Pass null to indicate initial fetch
    }
  }, [normalizedTraderId, epoch, getCachedData, fetchTradeData]);

  const { trades } = getCachedData(cacheKey);

  return {
    trades,
    loading,
    error,
    hasMore,
    loadMore,
    clearCache,
    refresh: () => {
      clearCache();
      return fetchTradeData(null); // Pass null to indicate fresh fetch
    },
  };
}
