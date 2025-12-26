import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchDeltaNeutralPositions, fetchDeltaNeutralOrders } from '@/apiServices';

// Positions: include any that haven't been reversed (no closing_parent_order)
export const useDeltaNeutralPositions = (options = {}) => {
  const { enabled = true, activeOnly = true } = options;
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  const timeoutRef = useRef();
  const currentRequestRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  const loadData = useCallback(
    async (requestId = 0, showLoading = true) => {
      if (showLoading) setLoading(true);
      try {
        const resp = await fetchDeltaNeutralPositions(activeOnly);
        const raw = Array.isArray(resp?.positions) ? resp.positions : [];

        // Process each position individually - don't merge unless explicitly linked via closing_parent_order
        const processed = [];
        raw.forEach((p) => {
          const isClosed = String(p?.status || '').toLowerCase() === 'closed';
          // Only filter out closed positions when activeOnly is true
          if (isClosed && activeOnly) return;

          const withFlags = {
            ...p,
            unwinding: !!p?.closing_parent_order,
            linkedMultiOrders: {
              openId: p?.opening_parent_order?.id || null,
              closeId: p?.closing_parent_order?.id || null,
            },
          };
          processed.push(withFlags);
        });

        const result = processed;

        if (requestId === currentRequestRef.current) {
          setPositions(result);
        }
      } catch (_) {
        // swallow
      } finally {
        if (requestId === currentRequestRef.current) setLoading(false);
      }
    },
    [activeOnly]
  );

  useEffect(() => {
    if (!enabled) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      currentRequestRef.current += 1; // invalidate
      setLoading(false);
      return () => {};
    }

    let isMounted = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    currentRequestRef.current += 1;
    const requestId = currentRequestRef.current;

    const startPolling = async () => {
      await loadData(requestId, isFirstLoadRef.current);
      isFirstLoadRef.current = false;

      while (isMounted && requestId === currentRequestRef.current) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          timeoutRef.current = setTimeout(resolve, 3000);
        });
        if (isMounted && requestId === currentRequestRef.current) {
          // eslint-disable-next-line no-await-in-loop
          await loadData(requestId, false);
        }
      }
    };

    startPolling();
    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [loadData, enabled]);

  return { positions, loading, refresh: loadData };
};
