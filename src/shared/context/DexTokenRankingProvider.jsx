import { createContext, useContext, useState, useMemo } from 'react';
import { getTokenRanking } from '@/apiServices';
import { useToast } from '@/shared/context/ToastProvider';

const DexTokenRankingContext = createContext();

export function DexTokenRankingProvider({ children }) {
  const [tokenRankings, setTokenRankings] = useState({});
  const { showToastMessage } = useToast();

  const fetchTokenRanking = async (chains, sortBy, timeFrame) => {
    const chainsHash = chains.sort().join(',');
    const cacheKey = `${chainsHash}:${sortBy}:${timeFrame}`;

    if (tokenRankings[cacheKey]) {
      return tokenRankings[cacheKey];
    }

    try {
      const response = await getTokenRanking(chains, sortBy, timeFrame);
      setTokenRankings((prev) => ({ ...prev, [cacheKey]: response }));
      return response;
    } catch (error) {
      showToastMessage({
        anchor: 'bottom-middle',
        message: `Error retrieving token ranking: ${error.message}`,
        type: 'error',
      });
      return [];
    }
  };

  const value = useMemo(() => ({ fetchTokenRanking }), [fetchTokenRanking]);
  return <DexTokenRankingContext.Provider value={value}>{children}</DexTokenRankingContext.Provider>;
}

export const useDexTokenRanking = () => {
  const context = useContext(DexTokenRankingContext);
  if (!context) {
    return {
      fetchTokenRanking: () => [],
    };
  }
  return context;
};
