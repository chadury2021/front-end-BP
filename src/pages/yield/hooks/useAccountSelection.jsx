import { useEffect, useMemo } from 'react';
import { useYieldPage } from '../context/YieldPageContext';

export function useAccountSelection() {
  const { accounts, selectedAccountName, setSelectedAccountName, selectedAccount } = useYieldPage();

  // Create accounts map for dropdown
  const accountsMapForDropdown = useMemo(() => {
    return accounts.reduce((acc, account) => {
      acc[account.name] = account;
      return acc;
    }, {});
  }, [accounts]);

  // Auto-select account when accounts load - prefer persisted selection, fallback to first
  useEffect(() => {
    if (accounts.length === 0) {
      setSelectedAccountName('');
      return;
    }

    setSelectedAccountName((prev) => {
      // If there's already a valid selection, keep it
      if (prev && accounts.some((account) => account.name === prev)) {
        return prev;
      }

      // Try to restore from localStorage
      const savedAccount = localStorage.getItem('yield-last-selected-account');
      if (savedAccount && accounts.some((account) => account.name === savedAccount)) {
        return savedAccount;
      }

      // Fallback to first account
      return accounts[0].name;
    });
  }, [accounts, setSelectedAccountName]);

  const handleAccountSelectChange = (event) => {
    const nextValue = event?.target?.value ?? '';
    setSelectedAccountName(nextValue);
  };

  return {
    accountsMapForDropdown,
    handleAccountSelectChange,
  };
}
