import { getArweaveData } from '@/apiServices';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { matchesTraderId } from '@/shared/cryptoUtil';
import { useContext, useEffect, useState } from 'react';
import { PAGINATION_CONFIG, REFRESH_CONFIG } from '../utils/uiConfig';
import { useTradeBlobsCache } from './useTradesCache';
import { handle0xTraderId } from './handle0xTraderId';

/**
 * Hook to paginate through trades with caching, auto-fetching, and cursor-based navigation.
 * Uses cursor from the last trade to determine if more data is available.
 * Builds on top of useTradesCache which handles the local storage and deduplication of trades.
 * Handles error states and provides retry functionality.
 * @param {Object} options Configuration options
 * @param {number|null} [options.pageSize=25] Number of items per page (1-100), or null for default
 * @param {string} [options.traderId] Filter by specific trader ID
 * @param {number|string} [options.epoch] Filter by specific epoch
 * @param {Object} [options.dateRange] Date range filter {start, end}
 * @param {boolean} [options.fetchDecodedData=false] Request decoded trade data
 * @param {Function} [options.cacheHook] Custom hook for caching trades (defaults to useTradesCache)
 * @returns {Object} Pagination state and controls
 * @returns {Array} returns.trades - Array of trade objects for the current page. Each trade contains:
 *   - id: Unique identifier for the trade
 *   - cursor: Pagination cursor for this trade
 *   - epoch: The epoch number this trade belongs to
 *   - trader_id: The hashed ID of the trader who made the trade
 *   - exchange_name: The exchange where the trade was executed
 *   - merkle_root: The merkle root hash for verification
 *   - Additional properties from Arweave tags
 * @returns {number} returns.page - Current page number (zero-based)
 * @returns {boolean} returns.loading - Whether trades are currently being fetched
 * @returns {Error|null} returns.error - Error object if fetch failed, null otherwise
 * @returns {Function} returns.retryFetch - Function to retry fetching trades
 * @returns {Function} returns.handlePageChange - Function to change the current page
 * @returns {boolean} returns.hasMore - Whether more trades are available to fetch
 * @returns {number} returns.totalItems - Total number of trades in the cache
 * @returns {number} returns.totalPages - Total number of pages based on pageSize
 */
export function useTradeBlobsPagination({
  pageSize = null,
  cacheHook = useTradeBlobsCache,
  traderId = null,
  epoch = null,
  dateRange = null,
  protocol = null,
}) {
  // Create cache key based on filters
  const { tradeBlobs, currentPage, updateTradeBlobs, updateCurrentPage, tradeBlobsLength } = cacheHook({
    traderId,
    epoch,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showAlert } = useContext(ErrorContext);

  // Get cursor from last trade to determine if more data is available
  const lastTrade = tradeBlobs[tradeBlobs.length - 1];
  const hasMore = Boolean(lastTrade?.cursor);

  // Use a default page size from config if none is provided
  const effectivePageSize = pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE;

  // Add validation before API calls
  const validateParameters = () => {
    // warn if pageSize is null
    if (pageSize === null) {
      console.warn('[useTradeBlobsPagination] pageSize is null, which will fetch all trades');
    }
    if (pageSize !== null && (typeof pageSize !== 'number' || pageSize < 1 || pageSize > 100)) {
      throw new Error(`Invalid pageSize: ${pageSize}. Must be between 1-100`);
    }
    if (epoch && Number.isNaN(Number(epoch))) {
      throw new Error(`Invalid epoch: ${epoch}. Must be a number`);
    }
  };

  const fetchAndCacheTradeBlobs = async (cursor = null, isRetry = false) => {
    if (loading) return [];

    setLoading(true);
    setError(null);

    try {
      validateParameters(); // Validate before making API call
      const [non0xTraderId, traderId0x] = handle0xTraderId(traderId);

      const filters = {
        // Handle both 0x and non-0x trader IDs
        // because legacy had 0x, but newer version since 2025-03-25 doesn't
        ...(traderId && non0xTraderId && traderId0x && { trader_id: [non0xTraderId, traderId0x] }),
        ...(epoch && { epoch: Number(epoch) }),
        ...(dateRange && { dateRange }),
        // TODO: This will miss out on all the previous historical tradeBlobs
        // that didn't have the protocol tag.
        // protocol: tread
        ...(protocol && { protocol }),
      };

      const result = await getArweaveData(effectivePageSize, cursor, filters);

      if (!result || result.edges.length === 0) {
        return [];
      }

      const formattedTrades = result.edges.map((edge) => {
        // Get all tags into a map for easier access
        const tags = edge.node.tags.reduce((acc, tag) => {
          acc[tag.name] = tag.value;
          return acc;
        }, {});

        return {
          ...edge.node,
          id: edge.node.id,
          cursor: edge.cursor, // Important: preserve cursor for pagination
          epoch: tags.epoch || '0',
          trader_id: tags.trader_id || '',
          exchange_name: tags.exchange_name || '',
          merkle_root: tags.merkle_root || '',
          ...tags, // Include any other tags
        };
      });

      updateTradeBlobs(formattedTrades);
      return formattedTrades;
    } catch (fetchError) {
      console.error('[fetchAndCacheTrades] error:', fetchError);
      console.error('[fetchAndCacheTrades] traderId:', traderId, 'type:', typeof traderId);
      setError(fetchError);

      // Handle validation errors
      if (fetchError.message.includes('Invalid pageSize') || fetchError.message.includes('Invalid epoch')) {
        showAlert({ severity: 'error', message: fetchError.message });
        return [];
      }

      // Only show alert if this isn't an auto-retry
      if (!isRetry) {
        showAlert({
          severity: 'error',
          message: `Error fetching trades: ${fetchError.message}. Please try again.`,
        });
      }
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (event, newPage) => {
    const requiredTrades = (newPage + 1) * effectivePageSize;

    if (requiredTrades > tradeBlobsLength && hasMore) {
      await fetchAndCacheTradeBlobs(lastTrade?.cursor);
    }

    updateCurrentPage(newPage);
  };

  // Ensure initial fetch errors are handled
  useEffect(() => {
    if (tradeBlobsLength === 0) {
      fetchAndCacheTradeBlobs().catch((initialFetchError) => {
        // Use a more descriptive error logging
        setError(initialFetchError);
      });
    }
  }, []);

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => fetchAndCacheTradeBlobs(), REFRESH_CONFIG.INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const filteredTrades = tradeBlobs.filter((trade) => {
    const matchesTrader = traderId ? matchesTraderId(traderId, trade.trader_id) : true;
    const matchesEpoch = epoch ? Number(epoch) === Number(trade.epoch) : true;
    return matchesTrader && matchesEpoch;
  });

  // Use effectivePageSize instead of potentially null pageSize
  const currentTrades = pageSize
    ? filteredTrades.slice(currentPage * effectivePageSize, (currentPage + 1) * effectivePageSize)
    : filteredTrades; // If no pageSize specified, return all filtered trades

  // Add retry functionality
  const retryFetch = () => {
    return fetchAndCacheTradeBlobs(lastTrade?.cursor, true);
  };

  console.debug(
    '[useTradeBlobsPagination] has ',
    filteredTrades?.length,
    'filtered trades with ',
    currentTrades?.length,
    'current page trades',
    'for traderId',
    traderId,
    'and epoch',
    epoch,
    'on page',
    currentPage
  );

  return {
    trades: currentTrades,
    page: currentPage,
    loading,
    error,
    retryFetch,
    handlePageChange,
    hasMore,
    totalItems: tradeBlobs.length,
    totalPages: Math.ceil(tradeBlobs.length / effectivePageSize),
  };
}
