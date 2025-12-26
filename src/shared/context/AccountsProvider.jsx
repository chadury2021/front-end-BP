import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getAccounts } from '../../apiServices';

export const AccountsContext = createContext();

export function AccountsProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);

  const loadAccounts = useCallback(async () => {
    try {
      const fetchedAccounts = await getAccounts();

      if (!Array.isArray(fetchedAccounts)) {
        console.error('[AccountsProvider] fetchedAccounts is not an array:', typeof fetchedAccounts);
        return;
      }

      // Sort accounts by name for consistency
      const sortedAccounts = fetchedAccounts.sort((a, b) => a.name.localeCompare(b.name));

      // Debug log with safe data only
      console.debug(
        '[AccountsProvider] Processed accounts:',
        JSON.stringify(
          sortedAccounts.map((acc) => ({
            id: acc.id,
            name: acc.name,
            exchange: acc.exchange,
            traderId: acc.hashed_api_key ? `${acc.hashed_api_key.slice(0, 4)}...${acc.hashed_api_key.slice(-4)}` : null,
          })),
          null,
          2
        )
      );

      setAccounts(sortedAccounts);
    } catch (error) {
      console.error('[AccountsProvider] Error in loadAccounts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const traderIds = useMemo(() => {
    if (!Array.isArray(accounts)) return [];
    const ids = accounts.map((acc) => acc?.hashed_api_key).filter((id) => id != null);
    return [...new Set(ids)];
  }, [accounts]);

  const traderIdExchanges = useMemo(() => {
    if (!Array.isArray(accounts)) return {};
    const traderExchanges = accounts.reduce((acc, val) => {
      const { hashed_api_key, exchange } = val;
      if (hashed_api_key) {
        acc[hashed_api_key] = val;
      }
      return acc;
    }, {});
    return traderExchanges;
  }, [accounts]);

  const value = useMemo(
    () => ({ loading, accounts, loadAccounts, traderIds, traderIdExchanges }),
    [loading, accounts, loadAccounts, traderIds, traderIdExchanges]
  );

  console.log('[AccountsProvider] traderIds:', traderIds);

  return <AccountsContext.Provider value={value}>{children}</AccountsContext.Provider>;
}
