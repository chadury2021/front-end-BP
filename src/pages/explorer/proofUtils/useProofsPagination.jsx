/**
 * This hook builds on top of useProofsCache to provide pagination functionality.
 *
 * While useProofsCache handles:
 * - Storing proofs in localStorage
 * - Maintaining current page state
 * - Deduplicating and sorting proofs
 *
 * This hook adds:
 * - Fetching proofs from the blockchain in batches
 * - Paginating through the cached proofs
 * - Periodic refresh of proofs
 * - Loading states and error handling
 *
 * The flow is:
 * 1. Initialize with useProofsCache for storage/state
 * 2. If cache is empty, fetch initial batch of proofs
 * 3. When user changes page, fetch more if needed
 * 4. Every 10 minutes, refresh proofs
 * 5. Return paginated subset of sorted proofs
 */

import { ErrorContext } from '@/shared/context/ErrorProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { useContext, useEffect, useState, useCallback } from 'react';
import { selectConfig } from '../utils/chainConfig';
import { fetchUntilEnoughEvents } from './ProofFetchers';
import { fetchEventsWithFallback } from './ProofGraphQL';
import { useProofsCache } from './useProofsCache';
import { PAGINATION_CONFIG, REFRESH_CONFIG } from '../utils/uiConfig';

/**
 * Hook to paginate through proofs with caching and automatic fetching.
 * Builds on top of useProofsCache which handles the local storage and deduplication of proofs.
 * @param {Object} options Configuration options
 * @param {number} [options.pageSize=25] Number of items per page
 * @param {Function} [options.fetcher] Custom function to fetch proofs from blockchain
 * @param {Function} [options.cacheHook] Custom hook for caching proofs (defaults to useProofsCache)
 * @returns {Object} {
 *   proofs: Array<Proof>, - All cached proofs from useProofsCache
 *   sortedProofs: Array<Proof>, - Sorted proofs by epoch and traderId
 *   currentPage: number, - Current page number stored in cache
 *   loading: boolean, - Whether proofs are being fetched
 *   hasMore: boolean, - Whether more proofs can be fetched
 *   updateCurrentPage: (page: number) => void, - Update current page in cache
 *   proofsLength: number - Total number of cached proofs
 *   refreshProofs: () => Promise<void> - Function to force refresh proofs
 * }
 */
export function useProofsPagination({
  pageSize = PAGINATION_CONFIG.DEFAULT_ROWS,
  fetcher = fetchEventsWithFallback,
  cacheHook = useProofsCache,
}) {
  const { proofs, currentPage, updateProofs, updateCurrentPage, proofsLength, clearCache } = cacheHook();

  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { isDev } = useUserMetadata();
  const { showAlert } = useContext(ErrorContext);

  const getEarliestBlock = () => {
    if (proofs.length === 0) return null;
    return proofs.reduce((earliest, proof) => {
      const blockNum = proof.dataEvents?.[0]?.blockNumber;
      return blockNum && (!earliest || blockNum < earliest) ? blockNum : earliest;
    }, null);
  };

  const fetchAndCacheProofs = async (startFromBlock = null, forceRefresh = false) => {
    setLoading(true);
    try {
      // Skip if we already have proofs, are not forcing a refresh, and are not explicitly
      // fetching older blocks. This only applies when paginating to older blocks.
      if (proofsLength > 0 && !forceRefresh && !startFromBlock) {
        setLoading(false);
        return proofs;
      }

      // For forced refresh, clear the cache first
      if (forceRefresh) {
        clearCache();
      }

      const config = await selectConfig(isDev);
      const { events } = await fetcher(config, pageSize, startFromBlock, fetchUntilEnoughEvents);

      if (events.length === 0) {
        setHasMore(false);
      } else if (events.length < pageSize) {
        const earliestBlock = events[events.length - 1]?.dataEvents?.[0]?.blockNumber;
        if (earliestBlock) {
          const { events: moreEvents } = await fetcher(config, pageSize - events.length, earliestBlock - 1);
          events.push(...moreEvents);
        }
        setHasMore(events.length === pageSize);
      }

      updateProofs(events);
      return events;
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Error fetching events: ${error.message}`,
      });
      setHasMore(true);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const refreshProofs = useCallback(async () => {
    await fetchAndCacheProofs(null, true);
  }, [fetchAndCacheProofs]);

  const handlePageChange = async (event, newPage) => {
    const requiredEvents = (newPage + 1) * pageSize;

    if (requiredEvents > proofs.length && hasMore) {
      const earliestBlock = getEarliestBlock();
      await fetchAndCacheProofs(earliestBlock ? earliestBlock - 1 : null);
    }

    updateCurrentPage(newPage);
  };

  // Initial fetch
  useEffect(() => {
    if (proofsLength === 0) {
      fetchAndCacheProofs();
    }
  }, []);

  // Periodic refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAndCacheProofs(null, true); // Force refresh on interval
    }, REFRESH_CONFIG.INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const currentProofs = proofs.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return {
    proofs: currentProofs,
    page: currentPage,
    loading,
    handlePageChange,
    hasMore,
    totalItems: proofs.length,
    totalPages: Math.ceil(proofs.length / pageSize),
    refreshProofs,
  };
}
