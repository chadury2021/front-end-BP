import { useState, useEffect, useMemo } from 'react';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { useAccountBalanceContext } from '@/pages/dashboard/orderEntry/AccountBalanceContext';

/**
 * Custom hook to get token balances for the selected account
 * @param {Array} selectedAccountsOverride - Optional override for selected accounts
 * @param {boolean} includeAllDexAccounts - If true, includes all DEX accounts regardless of selection state
 * @returns {Object} - { tokenBalances, isLoading, error }
 */
export const useTokenBalances = (selectedAccountsOverride = null, includeAllDexAccounts = false) => {
  const { selectedAccounts: orderFormAccounts, balances, initialLoadValue } = useOrderForm();
  const { isBalanceLoading } = useAccountBalanceContext();

  // Allow override of selected accounts for flexibility
  const selectedAccounts = selectedAccountsOverride || orderFormAccounts;

  const [tokenBalances, setTokenBalances] = useState({});
  const [error, setError] = useState(null);

  // Extract token balances from account balances
  const processedTokenBalances = useMemo(() => {
    if (!balances || typeof balances !== 'object' || !initialLoadValue?.accounts) {
      return {};
    }

    const tokenBalanceMap = {};

    // Create a mapping from account names to account IDs
    const accountNameToId = {};
    Object.entries(initialLoadValue.accounts).forEach(([accountName, accountData]) => {
      if (accountData && accountData.id) {
        accountNameToId[accountName] = accountData.id;
      }
    });

    // Process each balance entry
    Object.entries(balances).forEach(([accountId, balanceData]) => {
      // For DEX accounts, check if we should include all or just selected ones
      let shouldIncludeAccount = false;

      if (includeAllDexAccounts) {
        // When including all DEX accounts, check if this is a DEX account
        const accountName = Object.keys(accountNameToId).find(name => accountNameToId[name] === accountId);
        if (accountName) {
          const accountData = initialLoadValue.accounts[accountName];
          shouldIncludeAccount = accountData?.exchangeName === 'OKXDEX';
        }
      } else {
        // Normal behavior: only include if account is in selected accounts
        const selectedAccountName = Object.keys(accountNameToId).find(name =>
          accountNameToId[name] === accountId && selectedAccounts.includes(name)
        );
        shouldIncludeAccount = !!selectedAccountName;
      }

      if (shouldIncludeAccount) {
        if (balanceData && balanceData.assets) {
          balanceData.assets.forEach((asset) => {
            // Only include token assets (not positions)
            if (asset.asset_type === 'token') {
              const tokenKey = asset.symbol;
              if (tokenKey) {
                if (!tokenBalanceMap[tokenKey]) {
                  tokenBalanceMap[tokenKey] = {
                    balance: 0,
                    balanceUsd: 0,
                    notional: 0, // Add notional for consistency with other components
                    accounts: []
                  };
                }

                const balance = parseFloat(asset.size || asset.amount || 0);
                const balanceUsd = parseFloat(asset.notional || 0);
                const notional = parseFloat(asset.notional || 0);

                tokenBalanceMap[tokenKey].balance += balance;
                tokenBalanceMap[tokenKey].balanceUsd += balanceUsd;
                tokenBalanceMap[tokenKey].notional += notional;
                tokenBalanceMap[tokenKey].accounts.push({
                  accountId,
                  balance,
                  balanceUsd,
                  notional
                });
              }
            }
          });
        }
      }
    });

    return tokenBalanceMap;
  }, [selectedAccounts, balances, initialLoadValue?.accounts, includeAllDexAccounts]);

  useEffect(() => {
    setTokenBalances(processedTokenBalances);
  }, [processedTokenBalances]);

  return {
    tokenBalances,
    isLoading: isBalanceLoading,
    error
  };
};