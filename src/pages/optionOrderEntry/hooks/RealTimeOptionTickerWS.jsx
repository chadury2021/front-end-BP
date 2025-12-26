import { useState, useEffect, useCallback, useMemo } from 'react';
import { getDeribitOptionTickersWS } from '@/websockets';

export function useRealTimeOptionTickers({ instrumentNames, exchangeName, isTestnet = false }) {
  const [tickerData, setTickerData] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const memoizedInstrumentNames = useMemo(() => instrumentNames || [], [instrumentNames]);

  const handleTickerData = useCallback((instrumentName, data) => {
    setTickerData((prev) => ({
      ...prev,
      [instrumentName]: data,
    }));
  }, []);

  useEffect(() => {
    if (!memoizedInstrumentNames.length) {
      return () => {};
    }

    if (exchangeName === 'Deribit') {
      const cleanup = getDeribitOptionTickersWS(
        memoizedInstrumentNames,
        handleTickerData,
        setConnectionStatus,
        isTestnet
      );

      return cleanup;
    }

    return () => {};
  }, [memoizedInstrumentNames, exchangeName, isTestnet]);

  return { tickerData, connectionStatus };
}
