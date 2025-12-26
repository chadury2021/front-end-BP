import { useState } from 'react';

export const useDexModals = () => {
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [selectedAccountBalances, setSelectedAccountBalances] = useState(null);

  const openDepositModal = (accountId) => {
    setSelectedAccountId(accountId);
    setDepositModalOpen(true);
  };

  const openWithdrawModal = (accountId, balances = null) => {
    setSelectedAccountId(accountId);
    setSelectedAccountBalances(balances);
    setWithdrawModalOpen(true);
  };

  const closeDepositModal = () => {
    setDepositModalOpen(false);
    setSelectedAccountId(null);
  };

  const closeWithdrawModal = () => {
    setWithdrawModalOpen(false);
    setSelectedAccountId(null);
    setSelectedAccountBalances(null);
  };

  return {
    depositModalOpen,
    withdrawModalOpen,
    selectedAccountId,
    selectedAccountBalances,
    openDepositModal,
    openWithdrawModal,
    closeDepositModal,
    closeWithdrawModal,
  };
};