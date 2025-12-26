import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDeltaNeutralOrders } from '@/apiServices';

const DELTA_NEUTRAL_HISTORY_PAGE_SIZE_KEY = 'deltaNeutralHistoryPageSize';
const DEFAULT_PAGE_SIZE = 10;

// Helper to get page size from localStorage
const getStoredPageSize = () => {
  try {
    const stored = localStorage.getItem(DELTA_NEUTRAL_HISTORY_PAGE_SIZE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      // Validate that it's a valid number and one of the allowed values
      if (!Number.isNaN(parsed) && [10, 25, 50, 100].includes(parsed)) {
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
    localStorage.setItem(DELTA_NEUTRAL_HISTORY_PAGE_SIZE_KEY, String(pageSize));
  } catch (_) {
    // Ignore localStorage errors
  }
};

export const useDeltaNeutralHistory = (statusFilter = [], options = {}) => {
  const { enabled = true } = options;
  const [deltaNeutralOrders, setDeltaNeutralOrders] = useState([]);
  const [lifetimeStats, setLifetimeStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(getStoredPageSize);
  const [numPages, setNumPages] = useState(1);
  const [count, setCount] = useState(0);

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
      // Always fetch delta neutral orders for history
      const response = await fetchDeltaNeutralOrders(pageNumber, pageSize, undefined, undefined, statuses);

      if (requestId === currentRequestRef.current) {
        setDeltaNeutralOrders(response.delta_neutral_orders || []);
        setLifetimeStats(response.lifetime || {});
        setNumPages(response.num_pages || 1);
        setCount(response.count || 0);
      }

      const orders = response?.delta_neutral_orders || [];
      const activeStatuses = new Set(['ACTIVE', 'RUNNING', 'PAUSED', 'PENDING', 'FINISHER']);
      const hasActive = orders.some((o) => activeStatuses.has(String(o?.status || '').toUpperCase()));
      return hasActive;
    } catch (_) {
      // swallow errors to keep polling resilient
      return false;
    } finally {
      if (requestId === currentRequestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Persist page size to localStorage whenever it changes
  useEffect(() => {
    savePageSize(currentPageSize);
  }, [currentPageSize]);

  useEffect(() => {
    const prevFilter = prevStatusFilterRef.current;
    const currentFilter = statusFilter;

    const filterChanged =
      prevFilter.length !== currentFilter.length || !prevFilter.every((val, idx) => val === currentFilter[idx]);

    if (filterChanged) {
      setCurrentPageNumber(1);
      prevStatusFilterRef.current = statusFilter;
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!enabled) {
      // If disabled, stop polling and ensure loading is false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      currentRequestRef.current += 1; // invalidate any in-flight
      setLoading(false);
      return () => {};
    }

    let isMounted = true;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    currentRequestRef.current += 1;
    const requestId = currentRequestRef.current;

    const pageChanged = prevPageNumberRef.current !== currentPageNumber;
    const pageSizeChanged = prevPageSizeRef.current !== currentPageSize;
    const shouldShowLoading = isFirstLoadRef.current || pageChanged || pageSizeChanged;

    prevPageNumberRef.current = currentPageNumber;
    prevPageSizeRef.current = currentPageSize;
    isFirstLoadRef.current = false;

    const startPolling = async () => {
      const shouldContinue = await loadData(
        currentPageNumber,
        currentPageSize,
        statusFilter,
        requestId,
        shouldShowLoading
      );

      if (!shouldContinue) return; // no active orders, skip polling

      while (isMounted && requestId === currentRequestRef.current) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          timeoutRef.current = setTimeout(resolve, 3000);
        });

        if (isMounted && requestId === currentRequestRef.current) {
          // eslint-disable-next-line no-await-in-loop
          const keepGoing = await loadData(currentPageNumber, currentPageSize, statusFilter, requestId, false);
          if (!keepGoing) break; // stop polling when no active orders remain
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
  }, [currentPageNumber, currentPageSize, statusFilter, loadData, enabled]);

  return {
    deltaNeutralOrders,
    lifetimeStats,
    loading,
    currentPageNumber,
    currentPageSize,
    numPages,
    count,
    setCurrentPageNumber,
    setCurrentPageSize,
    refresh: loadData,
  };
};
