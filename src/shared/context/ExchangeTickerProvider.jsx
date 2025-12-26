import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ApiError, getExchangeTickerData } from '@/apiServices';
import { ErrorContext } from '@/shared/context/ErrorProvider';

const ExchangeTickerContext = createContext(null);

export function ExchangeTickerProvider({ children, exchangeName }) {
  const { showAlert } = useContext(ErrorContext);
  const [tickerData, setTickerData] = useState({});
  const [loading, setLoading] = useState(false);

  const loadTickerData = async (exName) => {
    setLoading(true);
    try {
      const result = await getExchangeTickerData({ exchangeName: exName });
      const tickerDataMap = result.reduce((acc, ticker) => {
        acc[ticker.pair] = ticker;
        return acc;
      }, {});
      setTickerData(tickerDataMap);
    } catch (e) {
      if (e instanceof ApiError) {
        showAlert({
          severity: 'error',
          message: `Failed to fetch exchange ticker data: ${e.message}`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (exchangeName) {
      loadTickerData(exchangeName);
    }
  }, [exchangeName]);

  const contextValue = useMemo(() => ({ tickerData, loading, loadTickerData }), [tickerData, loading, loadTickerData]);

  return <ExchangeTickerContext.Provider value={contextValue}>{children}</ExchangeTickerContext.Provider>;
}

export const useExchangeTicker = () => {
  const context = useContext(ExchangeTickerContext);

  // Return dummy values if no provider is found
  if (!context) {
    return {
      tickerData: {},
      loading: false,
      loadTickerData: () => {},
    };
  }

  return context;
};
