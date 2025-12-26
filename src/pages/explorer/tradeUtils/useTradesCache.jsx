import { atom, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useCallback, useState } from 'react';
import { bigIntStorage } from '../cacheUtils/bigIntStorage';

/**
 * @typedef {Object} Trade
 * @property {string} id - Unique identifier for the trade
 * @property {string} trader_id - ID of the trader
 * @property {number|string} epoch - Epoch number of the trade
 */

// Sort function used for both trades and proofs
const sortByEpochAndTraderId = (a, b) => {
  // First sort by epoch
  if (a.epoch !== b.epoch) {
    const epochA = Number(a.epoch || 0);
    const epochB = Number(b.epoch || 0);
    return epochB - epochA;
  }
  // Then by trader_id if available
  const traderIdA = a.trader_id || '';
  const traderIdB = b.trader_id || '';
  return traderIdB.localeCompare(traderIdA);
};

// Create a compound key for different filter combinations
const getCacheKey = (filters = {}) => {
  const { traderId, epoch } = filters;
  return traderId || epoch ? `${traderId}-${epoch}` : 'global';
};

/**
 * Persistent atom for storing trade data with multiple cache entries
 * @type {import('jotai').Atom<Record<string, Trade[]>>}
 */
const tradeBlobsCacheAtom = atomWithStorage('taas-trades-cache', { global: [] }, bigIntStorage);

/**
 * Persistent atom for storing current page numbers for different caches
 * @type {import('jotai').Atom<Record<string, number>>}
 */
const currentPagesAtom = atomWithStorage('taas-trades-current-pages', { global: 0 }, bigIntStorage);

/**
 * Hook for managing cached trade data with persistence
 * @returns {Object} Cache management interface
 * @property {Trade[]} trades - Trades array (sorted by epoch and trader_id)
 * @property {number} currentPage - Current page number
 * @property {(newTrades: Trade[]) => void} updateTradeBlobs - Function to merge new trades
 * @property {(page: number) => void} updateCurrentPage - Function to update current page
 * @property {number} tradesLength - Total number of trades
 */
export function useTradeBlobsCache(filters = {}) {
  const [cacheKey] = useState(() => getCacheKey(filters));
  const [allTradeBlobs, setAllTradeBlobs] = useAtom(tradeBlobsCacheAtom);
  const [allPages, setAllPages] = useAtom(currentPagesAtom);

  const tradeBlobs = allTradeBlobs[cacheKey] || [];
  const currentPage = allPages[cacheKey] || 0;

  const updateTradeBlobs = useCallback(
    (newTrades) => {
      setAllTradeBlobs((current) => {
        const existing = current[cacheKey] || [];
        const tradesMap = new Map(existing.map((trade) => [trade.id, trade]));

        newTrades.forEach((newTrade) => {
          tradesMap.set(newTrade.id, newTrade);
        });

        const updatedTradeBlobs = Array.from(tradesMap.values()).sort(sortByEpochAndTraderId);

        return {
          ...current,
          [cacheKey]: updatedTradeBlobs,
        };
      });
    },
    [cacheKey, setAllTradeBlobs]
  );

  const updateCurrentPage = useCallback(
    (page) => {
      setAllPages((current) => ({
        ...current,
        [cacheKey]: Math.max(0, page),
      }));
    },
    [cacheKey, setAllPages]
  );

  return {
    tradeBlobs,
    currentPage,
    updateTradeBlobs,
    updateCurrentPage,
    tradeBlobsLength: tradeBlobs.length,
    cacheKey,
  };
}
