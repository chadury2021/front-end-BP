import { useEffect } from 'react';
import { fetchAccountData, fetchOrderEntryFormData, getFundingRates } from '@/apiServices';
import { useYieldPage } from '../context/YieldPageContext';

export function useYieldPageData() {
  const {
    setAccounts,
    setSelectedAccountName,
    setLoading,
    setError,
    setOrderAccountsMap,
    setTokenPairs,
    setDefaultStrategyId,
    setStrategiesMap,
    setStrategyParams,
    setOrderFormLoading,
    setOrderFormError,
    setFundingRates,
    setFundingRatesLoading,
    setFundingRatesError,
    getEightDaysAgoIso,
    getNowIso,
    SUPPORTED_EXCHANGES,
    mapAccountBalance,
  } = useYieldPage();

  // Load accounts data
  useEffect(() => {
    let isMounted = true;
    async function loadAccounts() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchAccountData({ startTime: getEightDaysAgoIso(), endTime: getNowIso() });
        const rawBalances = Array.isArray(response?.account_balances) ? response.account_balances : [];
        const filtered = rawBalances.filter((balance) =>
          SUPPORTED_EXCHANGES.has((balance?.exchange_name || '').toLowerCase())
        );
        const processed = filtered.map(mapAccountBalance).sort((a, b) => a.accountName.localeCompare(b.accountName));

        if (!isMounted) return;

        setAccounts(processed);
      } catch (e) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load accounts.');
        setAccounts([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAccounts();

    return () => {
      isMounted = false;
    };
  }, [setAccounts, setLoading, setError, getEightDaysAgoIso, getNowIso, SUPPORTED_EXCHANGES, mapAccountBalance]);

  // Load order entry form data
  useEffect(() => {
    let isMounted = true;

    async function loadOrderEntryData() {
      setOrderFormLoading(true);
      setOrderFormError(null);
      try {
        const data = await fetchOrderEntryFormData();
        if (!isMounted) return;

        const accountsMap = {};
        (data.accounts || []).forEach((acc) => {
          const scopedAccName = acc.user === data.user_id ? acc.name : `${acc.username}/${acc.name}`;
          accountsMap[scopedAccName] = {
            displayName: `${acc.exchange} - ${scopedAccName}`,
            id: acc.id,
            name: scopedAccName,
            exchangeName: acc.exchange,
            walletType: acc.wallet_type,
            walletProvider: acc.wallet_provider,
            logo: acc.exchange.toLowerCase(),
          };
        });

        const strategiesArray = Array.isArray(data.strategies) ? data.strategies : [];
        const mappedStrategies = strategiesArray.reduce((acc, strategy) => {
          if (strategy?.id != null) {
            acc[strategy.id] = strategy;
          }
          return acc;
        }, {});

        const mappedPairs = (data.pairs || []).map((pair) => ({
          base: pair.base,
          exchanges: pair.exchanges,
          id: pair.name,
          is_contract: pair.is_contract,
          is_inverse: pair.is_inverse,
          label: pair.name,
          market_type: pair.market_type,
          quote: pair.quote,
        }));

        // Filter to only include TWAP and VWAP strategies
        const filteredStrategies = strategiesArray.filter(
          (strategy) => strategy.name === 'TWAP' || strategy.name === 'VWAP'
        );
        const defaultStrategy =
          filteredStrategies.find((strategy) => strategy.name === 'TWAP')?.id ||
          filteredStrategies[0]?.id ||
          strategiesArray[0]?.id ||
          null;

        setOrderAccountsMap(accountsMap);
        setTokenPairs(mappedPairs);
        setDefaultStrategyId(defaultStrategy);
        setStrategiesMap(mappedStrategies);
        setStrategyParams(Array.isArray(data.strategy_params) ? data.strategy_params : []);
      } catch (e) {
        if (!isMounted) return;
        setOrderFormError(e?.message || 'Failed to load trading form data.');
        setOrderAccountsMap({});
        setTokenPairs([]);
        setDefaultStrategyId(null);
        setStrategiesMap({});
        setStrategyParams([]);
      } finally {
        if (isMounted) {
          setOrderFormLoading(false);
        }
      }
    }

    loadOrderEntryData();

    return () => {
      isMounted = false;
    };
  }, [
    setOrderAccountsMap,
    setTokenPairs,
    setDefaultStrategyId,
    setStrategiesMap,
    setStrategyParams,
    setOrderFormLoading,
    setOrderFormError,
  ]);

  // Load funding rates data
  useEffect(() => {
    let isMounted = true;

    async function loadFundingRates() {
      setFundingRatesLoading(true);
      setFundingRatesError(null);
      try {
        const result = await getFundingRates();
        if (!isMounted) return;
        setFundingRates(Array.isArray(result) ? result : []);
      } catch (e) {
        if (!isMounted) return;
        setFundingRates([]);
        setFundingRatesError(e?.message || 'Failed to load funding rates.');
      } finally {
        if (isMounted) {
          setFundingRatesLoading(false);
        }
      }
    }

    loadFundingRates();

    return () => {
      isMounted = false;
    };
  }, [setFundingRates, setFundingRatesLoading, setFundingRatesError]);
}
