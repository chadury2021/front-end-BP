import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { isDexToken } from '@/shared/dexUtils';
import { useDexTokenManager } from '@/shared/context/DexTokenManagerProvider';
import { matchPair } from '@/shared/formUtil';
import { fetchNoUserOrderEntryFormData, fetchOrderEntryFormData } from '@/apiServices';

const InitialLoadDataContext = createContext();

export function InitialLoadDataProvider({ children, pair = 'BTC:PERP-USDT' }) {
  const { showAlert } = useContext(ErrorContext);

  const { selectedPair, setSelectedPair, setLoading, initialLoadValue, setInitialLoadValue, setFormPageType } =
    useOrderForm();

  const { user } = useUserMetadata();

  const { loadToken } = useDexTokenManager();

  const getAutoOrderUrgency = (urgencyKey) => {
    if (!initialLoadValue?.autoOrderUrgencies) return null;
    return initialLoadValue.autoOrderUrgencies.find((urgency) => urgency.key === urgencyKey);
  };

  const getAccount = (accountName) => {
    if (!initialLoadValue?.accounts) return null;
    return initialLoadValue.accounts[accountName];
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setFormPageType('DashboardPage');
      let data;
      try {
        data = await fetchOrderEntryFormData();
      } catch (e) {
        showAlert({
          severity: 'error',
          message: `Unable to load accounts: ${e.message}`,
        });
        return;
      }

      const tokenPairs = data.pairs.map((p) => {
        return {
          base: p.base,
          exchanges: p.exchanges,
          id: p.name,
          is_contract: p.is_contract,
          is_inverse: p.is_inverse,
          label: p.name,
          market_type: p.market_type,
          quote: p.quote,
          external_names: p.external_names,
        };
      });

      if (tokenPairs && pair.length > 0 && selectedPair === null) {
        let newPair = null;
        if (isDexToken(pair)) {
          try {
            newPair = await loadToken(pair);
          } catch (e) {
            showAlert({
              severity: 'warning',
              message: `${pair} token not recognized`,
            });
          }
        } else {
          newPair = matchPair(tokenPairs, pair);
        }

        if (!newPair) {
          newPair = matchPair(tokenPairs, 'BTC:PERP-USDT');
        }

        if (newPair) {
          setSelectedPair(newPair);
        }
      }

      const accounts = {};
      data.accounts.forEach((acc) => {
        const scopedAccName = acc.user === data.user_id ? acc.name : `${acc.username}/${acc.name}`;
        const displayName = `${acc.exchange} - ${scopedAccName}`;
        accounts[scopedAccName] = {
          displayName,
          id: acc.id,
          name: scopedAccName,
          exchangeName: acc.exchange,
          walletType: acc.wallet_type,
          walletProvider: acc.wallet_provider,
          api_key: acc.api_key,
          logo: acc.exchange.toLowerCase(),
        };
      });

      const indexedStrategies = data.strategies.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});

      const indexedSuperStrategies = data.super_strategies.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});

      setInitialLoadValue({
        tokenPairs,
        accounts,
        exchanges: data.exchanges,
        strategies: indexedSuperStrategies,
        trajectories: indexedStrategies,
        superStrategies: indexedSuperStrategies,
        strategyParams: data.strategy_params,
        orderTemplates: data.order_templates,
        autoOrderUrgencies: data.auto_order_urgencies,
      });

      setLoading(false);
    };
    const loadNoUserInitialData = async () => {
      setLoading(true);
      let data;
      try {
        data = await fetchNoUserOrderEntryFormData();
      } catch (e) {
        showAlert({
          severity: 'error',
          message: `Unable to load accounts: ${e.message}`,
        });
        return;
      }

      const tokenPairs = data.pairs.map((p) => {
        return {
          base: p.base,
          exchanges: p.exchanges,
          id: p.name,
          is_contract: p.is_contract,
          is_inverse: p.is_inverse,
          label: p.name,
          market_type: p.market_type,
          quote: p.quote,
          external_names: p.external_names,
        };
      });

      if (tokenPairs && pair.length > 0 && selectedPair === null) {
        let newPair = null;
        if (isDexToken(pair)) {
          try {
            newPair = await loadToken(pair);
          } catch (e) {
            showAlert({
              severity: 'warning',
              message: `${pair} token not recognized`,
            });
          }
        } else {
          newPair = matchPair(tokenPairs, pair);
        }

        if (!newPair) {
          newPair = matchPair(tokenPairs, 'BTC-USDT');
        }

        if (newPair) {
          setSelectedPair(newPair);
        }
      }

      const indexedStrategies = data.strategies.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});

      const indexedSuperStrategies = data.super_strategies.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});

      setInitialLoadValue({
        ...initialLoadValue,
        exchanges: data.exchanges,
        tokenPairs,
        strategies: indexedSuperStrategies,
        trajectories: indexedStrategies,
        superStrategies: indexedSuperStrategies,
        strategyParams: data.strategy_params,
      });

      setLoading(false);
    };

    if (user?.is_authenticated) {
      loadInitialData();
    } else {
      loadNoUserInitialData();
    }
  }, [user]);

  const value = useMemo(
    () => ({
      getAutoOrderUrgency,
      getAccount,
    }),
    [getAutoOrderUrgency, getAccount]
  );

  return <InitialLoadDataContext.Provider value={value}>{children}</InitialLoadDataContext.Provider>;
}

export function useInitialLoadData() {
  const context = useContext(InitialLoadDataContext);
  if (context === undefined) {
    throw new Error('useInitialLoadData must be used within an InitialLoadDataProvider');
  }
  return context;
}
