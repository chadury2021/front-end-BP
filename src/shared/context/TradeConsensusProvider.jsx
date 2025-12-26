import { createContext, useContext, useState, useMemo } from 'react';
import { DateRange } from '@/pages/points/DateRangePicker';
import { fetchRiskConsensusRecordsForTrader } from '@/pages/vaults/data/VaultFetchers';

const TradeConsensusContext = createContext();

export const useTradeConsensus = () => {
  return useContext(TradeConsensusContext);
};

// Helper function to generate cache key for a single trader
const getCacheKey = (traderId, dateRange) => {
  return `${traderId}:${dateRange.key}`;
};

export function TradeConsensusProvider({ children }) {
  const [consensusCache, setConsensusCache] = useState({});

  const fetchTradeConsensus = async (traderId, dateRange = DateRange.WEEK) => {
    if (!traderId) {
      console.warn('[TradeConsensusProvider] No traderId provided to fetchTradeConsensus');
      return null;
    }

    const cacheKey = getCacheKey(traderId, dateRange);

    // Check if data is already in cache
    if (consensusCache[cacheKey]) {
      return consensusCache[cacheKey];
    }

    // Fetch new data
    const consensusEvents = await fetchRiskConsensusRecordsForTrader([traderId], dateRange);

    const riskEvents = consensusEvents.filter((event) => event.eventName === 'ConsensusRisk');
    const parameterizedRiskEvents = riskEvents.reduce((acc, event) => {
      const paramId = event.parameterId;
      if (!acc[paramId]) {
        acc[paramId] = [];
      }
      acc[paramId].push(event);
      return acc;
    }, {});

    const dataEvents = consensusEvents.filter((event) => event.eventName === 'ConsensusData');
    const parameterizedDataEvents = dataEvents.reduce((acc, event) => {
      const paramId = event.parameterId;
      if (!acc[paramId]) {
        acc[paramId] = [];
      }
      acc[paramId].push(event);
      return acc;
    }, {});

    // Store in cache
    const newData = { riskEvents, parameterizedRiskEvents, dataEvents, parameterizedDataEvents };
    setConsensusCache((prev) => ({
      ...prev,
      [cacheKey]: newData,
    }));

    return newData;
  };

  const value = useMemo(
    () => ({
      consensusCache,
      setConsensusCache,
      fetchTradeConsensus,
    }),
    [consensusCache]
  );

  return <TradeConsensusContext.Provider value={value}>{children}</TradeConsensusContext.Provider>;
}
