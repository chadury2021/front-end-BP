import { createContext, useState, useMemo, useContext } from 'react';
import { getTokenTradingInfo } from '@/apiServices';
import { isDexToken } from '@/shared/dexUtils';

const DexTokenManagerContext = createContext();

export function DexTokenManagerProvider({ children }) {
  const [tokensCache, setTokensCache] = useState({});

  const loadTokens = async (tokenIds) => {
    const validTokenIds = tokenIds.filter((tokenId) => isDexToken(tokenId));

    const cachedResults = validTokenIds.reduce((acc, tokenId) => {
      const cachedToken = tokensCache[tokenId];
      if (cachedToken) acc[tokenId] = cachedToken;
      return acc;
    }, {});

    const uncachedResults = validTokenIds.filter((tokenId) => !(tokenId in cachedResults));

    if (uncachedResults.length === 0) {
      return cachedResults;
    }

    const results = await getTokenTradingInfo(uncachedResults);
    setTokensCache((prev) => ({ ...prev, ...results }));
    return { ...cachedResults, ...results };
  };

  const loadToken = async (tokenId) => {
    const results = await loadTokens([tokenId]);
    return results[tokenId];
  };

  const getToken = (tokenId) => {
    return tokensCache[tokenId];
  };

  const value = useMemo(
    () => ({ tokensCache, loadTokens, loadToken, getToken }),
    [tokensCache, loadTokens, loadToken, getToken]
  );

  return <DexTokenManagerContext.Provider value={value}>{children}</DexTokenManagerContext.Provider>;
}

export const useDexTokenManager = () => {
  const context = useContext(DexTokenManagerContext);
  if (!context) {
    return { tokensCache: {}, loadTokens: () => {}, loadToken: () => {}, getToken: () => {} };
  }
  return context;
};
