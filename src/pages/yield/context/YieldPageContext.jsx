import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fetchAccountData, fetchOrderEntryFormData, getFundingRates } from '@/apiServices';
import { calculateTotalValue } from '@/pages/accountBalance/util';
import { normalizeExchangeName } from '@/pages/yield/utils/yieldUtils';

const SUPPORTED_EXCHANGES = new Set([
  'binance',
  'binancepm',
  'bybit',
  'okx',
  'hyperliquid',
  'hyperliquidspot',
  'gate',
  'gateio',
]);

const mapAccountBalance = (balance) => {
  const normalizedExchangeName = normalizeExchangeName(balance.exchange_name);
  const normalizedBalance = {
    ...balance,
    exchange_name: normalizedExchangeName,
  };
  const accountId = String(balance.account_id);
  const accountName = balance.account_name;

  return {
    id: accountId,
    name: accountName,
    accountId,
    accountName,
    exchangeName: normalizedExchangeName,
    totalEquity: calculateTotalValue(normalizedBalance),
  };
};

const getEightDaysAgoIso = () => new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
const getNowIso = () => new Date().toISOString();

const YieldPageContext = createContext();

export function YieldPageProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountName, setSelectedAccountName] = useState(() => {
    const saved = localStorage.getItem('yield-last-selected-account');
    return saved || '';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [orderAccountsMap, setOrderAccountsMap] = useState({});
  const [tokenPairs, setTokenPairs] = useState([]);
  const [defaultStrategyId, setDefaultStrategyId] = useState(null);
  const [strategiesMap, setStrategiesMap] = useState({});
  const [strategyParams, setStrategyParams] = useState([]);
  const [orderFormLoading, setOrderFormLoading] = useState(true);
  const [orderFormError, setOrderFormError] = useState(null);

  const [fundingRates, setFundingRates] = useState([]);
  const [fundingRatesLoading, setFundingRatesLoading] = useState(true);
  const [fundingRatesError, setFundingRatesError] = useState(null);

  const [selectedPerpOption, setSelectedPerpOption] = useState(null);
  const [pendingMatrixSelection, setPendingMatrixSelection] = useState(null);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.name === selectedAccountName) || null,
    [accounts, selectedAccountName]
  );

  // Save selected account to localStorage whenever it changes
  useEffect(() => {
    if (selectedAccountName) {
      localStorage.setItem('yield-last-selected-account', selectedAccountName);
    }
  }, [selectedAccountName]);

  const value = useMemo(
    () => ({
      // Account data
      accounts,
      setAccounts,
      selectedAccountName,
      setSelectedAccountName,
      selectedAccount,
      loading,
      setLoading,
      error,
      setError,

      // Order form data
      orderAccountsMap,
      setOrderAccountsMap,
      tokenPairs,
      setTokenPairs,
      defaultStrategyId,
      setDefaultStrategyId,
      strategiesMap,
      setStrategiesMap,
      strategyParams,
      setStrategyParams,
      orderFormLoading,
      setOrderFormLoading,
      orderFormError,
      setOrderFormError,

      // Funding rates data
      fundingRates,
      setFundingRates,
      fundingRatesLoading,
      setFundingRatesLoading,
      fundingRatesError,
      setFundingRatesError,

      // Selected perp analytics context
      selectedPerpOption,
      setSelectedPerpOption,

      // Matrix-driven order selection
      pendingMatrixSelection,
      setPendingMatrixSelection,

      // Utility functions
      getEightDaysAgoIso,
      getNowIso,
      SUPPORTED_EXCHANGES,
      mapAccountBalance,
    }),
    [
      accounts,
      selectedAccountName,
      selectedAccount,
      loading,
      error,
      orderAccountsMap,
      tokenPairs,
      defaultStrategyId,
      strategiesMap,
      orderFormLoading,
      orderFormError,
      strategyParams,
      fundingRates,
      fundingRatesLoading,
      fundingRatesError,
      selectedPerpOption,
      pendingMatrixSelection,
    ]
  );

  return <YieldPageContext.Provider value={value}>{children}</YieldPageContext.Provider>;
}

export const useYieldPage = () => {
  const context = useContext(YieldPageContext);
  if (!context) {
    throw new Error('useYieldPage must be used within a YieldPageProvider');
  }
  return context;
};
