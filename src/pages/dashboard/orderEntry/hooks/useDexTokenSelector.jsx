import { useCallback, useEffect, useMemo, useState } from 'react';
import { searchTokens } from '@/apiServices';
import { useToast } from '@/shared/context/ToastProvider';
import { useDexTokenRanking } from '@/shared/context/DexTokenRankingProvider';
import { CHAIN_CONFIGS as SHARED_CHAIN_CONFIGS } from '@/shared/dexUtils';

const useDexTokenSelector = (chains = [], sortBy = '5', timeFrame = '4') => {
  const [tokenRanking, setTokenRanking] = useState([]);
  const [tokenRankingLoading, setTokenRankingLoading] = useState(false);
  const [tokenSearch, setTokenSearch] = useState([]);
  const [tokenSearchLoading, setTokenSearchLoading] = useState(false);
  const [search, setSearch] = useState('');
  const { showToastMessage } = useToast();

  // Determine effective chains: if none selected, use all supported chains
  const allChainIds = useMemo(() => Object.keys(SHARED_CHAIN_CONFIGS), []);
  const effectiveChains = chains.length > 0 ? chains : allChainIds;
  const chainsHash = useMemo(() => effectiveChains.slice().sort().join(','), [effectiveChains]);
  const rankingHash = useMemo(() => {
    return `${chainsHash}:${sortBy}:${timeFrame}`;
  }, [chainsHash, sortBy, timeFrame]);

  const { fetchTokenRanking } = useDexTokenRanking();

  useEffect(() => {
    const fetch = async () => {
      setTokenRankingLoading(true);
      try {
        const tokens = await fetchTokenRanking(effectiveChains, sortBy, timeFrame);
        setTokenRanking(tokens);
      } catch (error) {
        showToastMessage({
          anchor: 'bottom-middle',
          message: `Error retrieving token list: ${error.message}`,
          type: 'error',
        });
      } finally {
        setTokenRankingLoading(false);
      }
    };

    // Always fetch tokens; with no selection we fetch all chains via effectiveChains
    fetch();
  }, [rankingHash]);

  const handleSearchToken = useCallback((s) => {
    setSearch(s);

    if (!s) {
      setTokenSearch([]);
    }
  }, []);

  useEffect(() => {
    const fetchSearchToken = async () => {
      try {
        setTokenSearchLoading(true);
        const tokens = await searchTokens(effectiveChains, search);
        setTokenSearch(tokens);
      } catch (error) {
        showToastMessage({
          anchor: 'bottom-middle',
          message: `Error searching tokens: ${error.message}`,
          type: 'error',
        });
      } finally {
        setTokenSearchLoading(false);
      }
    };

    // Search tokens even when chains is empty (searches all chains via effectiveChains)
    if (search) {
      fetchSearchToken(effectiveChains, search);
    }
  }, [search, chainsHash]);

  const value = useMemo(() => {
    const tokenList = search ? tokenSearch : tokenRanking;
    const tokenListLoading = search ? tokenSearchLoading : tokenRankingLoading;
    return { handleSearchToken, tokenList, tokenListLoading };
  }, [tokenRanking, tokenRankingLoading, tokenSearch, tokenSearchLoading, handleSearchToken]);

  return value;
};

export default useDexTokenSelector;
