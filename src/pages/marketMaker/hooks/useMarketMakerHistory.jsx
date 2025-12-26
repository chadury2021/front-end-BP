import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMarketMakerOrders } from '@/apiServices';

const MARKET_MAKER_HISTORY_PAGE_SIZE_KEY = 'marketMakerHistoryPageSize';
const DEFAULT_PAGE_SIZE = 10;

// Helper to get page size from localStorage
const getStoredPageSize = () => {
  try {
    const stored = localStorage.getItem(MARKET_MAKER_HISTORY_PAGE_SIZE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      // Validate that it's a valid number and one of the allowed values
      if (!Number.isNaN(parsed) && [10, 25, 30].includes(parsed)) {
        return parsed;
      }
    }
  } catch (_) {
    // Ignore localStorage errors
  }
  return DEFAULT_PAGE_SIZE;
};

// Helper to save page size to localStorage
const savePageSize = (pageSize) => {
  try {
    localStorage.setItem(MARKET_MAKER_HISTORY_PAGE_SIZE_KEY, String(pageSize));
  } catch (_) {
    // Ignore localStorage errors
  }
};

export const useMarketMakerHistory = (statusFilter = []) => {
  const [marketMakerOrders, setMarketMakerOrders] = useState([]);
  const [lifetimeStats, setLifetimeStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(getStoredPageSize);
  const [numPages, setNumPages] = useState(1);
  const [count, setCount] = useState(0);

  // Use ref to track the previous status filter to detect changes
  const prevStatusFilterRef = useRef(statusFilter);
  const prevPageNumberRef = useRef(currentPageNumber);
  const prevPageSizeRef = useRef(currentPageSize);
  const timeoutRef = useRef();
  const currentRequestRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  const loadData = useCallback(async (pageNumber, pageSize, statuses = [], requestId = 0, showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = await fetchMarketMakerOrders(pageNumber, pageSize, undefined, undefined, statuses);
      const rawOrders = Array.isArray(response?.market_maker_orders) ? response.market_maker_orders : [];
      const filteredOrders = rawOrders.filter((order) => !order?.delta_neutral);

      // Only update state if this is still the latest request
      if (requestId === currentRequestRef.current) {
        setMarketMakerOrders(filteredOrders);
        setLifetimeStats(response.lifetime || {});
        setNumPages(response.num_pages || 1);
        setCount(response.count || 0);
      }

      const orders = filteredOrders;
      const activeStatuses = new Set(['ACTIVE', 'RUNNING', 'PAUSED', 'PENDING', 'FINISHER']);
      const hasActive = orders.some((o) => activeStatuses.has(String(o?.status || '').toUpperCase()));
      return hasActive;
    } catch (_) {
      // swallow errors to keep polling resilient
      return false;
    } finally {
      // Only update loading if this is still the latest request
      if (requestId === currentRequestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Persist page size to localStorage whenever it changes
  useEffect(() => {
    savePageSize(currentPageSize);
  }, [currentPageSize]);

  // Reset page to 1 when statusFilter changes
  useEffect(() => {
    const prevFilter = prevStatusFilterRef.current;
    const currentFilter = statusFilter;

    // Check if filter actually changed (by comparing length and contents)
    const filterChanged =
      prevFilter.length !== currentFilter.length || !prevFilter.every((val, idx) => val === currentFilter[idx]);

    if (filterChanged) {
      setCurrentPageNumber(1);
      prevStatusFilterRef.current = statusFilter;
    }
  }, [statusFilter]);

  useEffect(() => {
    let isMounted = true;

    // Cancel any pending timeout and increment request ID
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    currentRequestRef.current += 1;
    const requestId = currentRequestRef.current;

    // Detect if page or page size changed
    const pageChanged = prevPageNumberRef.current !== currentPageNumber;
    const pageSizeChanged = prevPageSizeRef.current !== currentPageSize;
    const shouldShowLoading = isFirstLoadRef.current || pageChanged || pageSizeChanged;

    // Update refs
    prevPageNumberRef.current = currentPageNumber;
    prevPageSizeRef.current = currentPageSize;
    isFirstLoadRef.current = false;

    const startPolling = async () => {
      // Immediate load for the current page - show loading for first load or page changes
      await loadData(currentPageNumber, currentPageSize, statusFilter, requestId, shouldShowLoading);

      // Always continue polling to keep data fresh, even when viewing pages without active orders
      // This ensures that if active orders exist on other pages, the UI will update when they complete
      while (isMounted && requestId === currentRequestRef.current) {
        // Wait for 3 seconds
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          timeoutRef.current = setTimeout(resolve, 3000);
        });

        // Check if still mounted and this is still the active request
        if (isMounted && requestId === currentRequestRef.current) {
          // Background refresh - don't show loading spinner
          // eslint-disable-next-line no-await-in-loop
          await loadData(currentPageNumber, currentPageSize, statusFilter, requestId, false);
        }
      }
    };

    startPolling();

    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentPageNumber, currentPageSize, statusFilter, loadData]);

  const refresh = useCallback(
    async (showLoading = true) => {
      // Use the latest request id so that loading is always cleared correctly
      const requestId = currentRequestRef.current;
      await loadData(currentPageNumber, currentPageSize, statusFilter, requestId, showLoading);
    },
    [currentPageNumber, currentPageSize, statusFilter, loadData]
  );

  return {
    marketMakerOrders,
    lifetimeStats,
    loading,
    currentPageNumber,
    currentPageSize,
    numPages,
    count,
    setCurrentPageNumber,
    setCurrentPageSize,
    refresh,
  };
};
