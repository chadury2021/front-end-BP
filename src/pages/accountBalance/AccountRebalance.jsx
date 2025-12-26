import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import AccountRebalanceSettings from './AccountRebalanceSettings';
import { checkRebalance, fetchMultiOrderDetailData } from '../../apiServices';

function AccountRebalance({ assetOrdering, balanceData, selectedAccount, selectedAccountFull, showAlert }) {
  const [message, setMessage] = useState('');
  const [localInProgress, setLocalInProgress] = useState(false);
  const [localBalanceNotional, setLocalBalanceNotional] = useState([]);
  const [localIsScheduled, setLocalIsScheduled] = useState(false);
  const [localStartTime, setLocalStartTime] = useState([new Date()]);
  const [localRebalanceProgress, setLocalRebalanceProgress] = useState(0);
  const [localLoading, setLocalLoading] = useState(false);
  const [localOrderId, setLocalOrderId] = useState(null);
  const [localTaskId, setLocalTaskId] = useState(null);
  const [localSelectedDuration, setLocalSelectedDuration] = useState(15);
  const [localTargetWeights, setLocalTargetWeights] = useState({});
  const [localTolerance, setLocalTolerance] = useState(1);
  const [localNextRebalance, setLocalNextRebalance] = useState([new Date()]);
  const [timeLeft, setTimeLeft] = useState([new Date()]);
  const [localIsFloating, setLocalIsFloating] = useState(false);
  const [localRebalanceMode, setLocalRebalanceMode] = useState('Once');

  const loadOrderData = async (order_id) => {
    try {
      const orderData = await fetchMultiOrderDetailData(order_id);
      const childOrders = orderData?.child_orders ?? [];
      const totalPctFilled = childOrders.reduce((sum, order) => sum + (order.pct_filled || 0), 0);
      const avgPctFilled = childOrders.length > 0 ? totalPctFilled / childOrders.length : 0;
      setLocalRebalanceProgress(avgPctFilled);
    } catch (e) {
      showAlert({ severity: 'error', message: `Failed to fetch order details: ${e.message}` });
      setLocalRebalanceProgress(0);
    }
  };

  const fetchRebalanceStatus = async () => {
    const account_id = selectedAccount?.accountId;
    if (!account_id || account_id === 'All Accounts') {
      return;
    }

    try {
      setLocalLoading(true);
      const data = await checkRebalance(account_id);

      if (data.is_rebalance_enabled === true) {
        setLocalInProgress(true);
        setLocalIsScheduled(false);
        setLocalOrderId(data.parent_order_id);
        setLocalTaskId(data.task_id);
        const currentTime = new Date().getTime();
        const timeStart = new Date(data.time_start).getTime();
        const duration = data.rebalance_settings.duration * 1000;
        const endTime = timeStart + duration;
        const calculatedTimeLeft = endTime - currentTime;
        const remainingMinutes = calculatedTimeLeft > 0 ? (calculatedTimeLeft / 60000).toFixed(2) : 15;
        setLocalSelectedDuration(remainingMinutes);
        setLocalBalanceNotional(data.current_balance_notional);
        const simplifiedTargetWeights = Object.entries(data.target_weights).reduce((acc, [symbol, value]) => {
          acc[symbol] = value.targetWeight;
          return acc;
        }, {});

        setLocalTargetWeights(simplifiedTargetWeights);
        setLocalTolerance(data.tolerance);
        setLocalNextRebalance(data.next_rebalance);
        setLocalStartTime(data.time_start);
        setTimeLeft(data.time_left);
        setLocalIsFloating(data.is_floating_enabled);
        setLocalRebalanceMode(data.rebalance_mode);
        if (selectedAccount && selectedAccount.accountId) {
          localStorage.removeItem(`isScheduled_${selectedAccount.accountId}`);
        }
        if (selectedAccount && selectedAccount.accountId) {
          localStorage.removeItem(`startTime_${selectedAccount.accountId}`);
        }
        if (data.parent_order_id) {
          await loadOrderData(data.parent_order_id);
        }
      } else {
        setLocalInProgress(false);
        setMessage('');
      }
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccount && selectedAccount.accountId !== 'All Accounts') {
      fetchRebalanceStatus();

      setLocalTargetWeights({});
      setLocalBalanceNotional([]);
      setLocalTolerance(1);
      setLocalIsFloating(false);
    }
  }, [selectedAccount]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const loadData = async () => {
        if (selectedAccount?.accountId === 'All Accounts') {
          return;
        }

        try {
          setLocalLoading(true);
          await fetchRebalanceStatus();
        } catch (error) {
          showAlert({ severity: 'info', message: 'Rebalance not in progress.' });
        } finally {
          setLocalLoading(false);
        }
      };

      loadData();
    }, 1500);

    return () => {
      clearTimeout(handler);
    };
  }, [selectedAccount]);

  useEffect(() => {
    if (localInProgress && localOrderId) {
      loadOrderData(localOrderId);
    }
  }, [localInProgress, localOrderId]);

  useEffect(() => {
    let progressInterval;

    const fetchProgressPeriodically = async () => {
      if (localInProgress && localOrderId) {
        try {
          await loadOrderData(localOrderId);
        } catch (error) {
          console.error('Error fetching progress:', error);
        }
      }
    };

    if (localInProgress) {
      progressInterval = setInterval(fetchProgressPeriodically, 15000);
    } else {
      clearInterval(progressInterval);
    }

    return () => {
      clearInterval(progressInterval);
    };
  }, [localInProgress, localOrderId]);

  return (
    <Box sx={{ padding: '5px', color: 'text.primary' }}>
      <AccountRebalanceSettings
        balanceData={balanceData}
        fetchRebalanceStatus={fetchRebalanceStatus}
        localBalanceNotional={localBalanceNotional}
        localInProgress={localInProgress}
        localIsFloating={localIsFloating}
        localIsScheduled={localIsScheduled}
        localLoading={localLoading}
        localNextRebalance={localNextRebalance}
        localOrderId={localOrderId}
        localRebalanceMode={localRebalanceMode}
        localRebalanceProgress={localRebalanceProgress}
        localSelectedDuration={localSelectedDuration}
        localTargetWeights={localTargetWeights}
        localTaskId={localTaskId}
        localTimeStart={localStartTime}
        localTolerance={localTolerance}
        selectedAccount={selectedAccount}
        selectedAccountFull={selectedAccountFull}
        setLocalBalanceNotional={setLocalBalanceNotional}
        setLocalInProgress={setLocalInProgress}
        setLocalIsFloating={setLocalIsFloating}
        setLocalIsScheduled={setLocalIsScheduled}
        setLocalNextRebalance={setLocalNextRebalance}
        setLocalOrderId={setLocalOrderId}
        setLocalRebalanceMode={setLocalRebalanceMode}
        setLocalSelectedDuration={setLocalSelectedDuration}
        setLocalStartTime={setLocalStartTime}
        setLocalTargetWeights={setLocalTargetWeights}
        setLocalTolerance={setLocalTolerance}
        setTaskId={setLocalTaskId}
        setTimeLeft={setTimeLeft}
        showAlert={showAlert}
        timeLeft={timeLeft}
      />

      {message && <Typography sx={{ marginTop: '20px', color: 'var(--text-primary)' }}>{message}</Typography>}
    </Box>
  );
}

export default AccountRebalance;
