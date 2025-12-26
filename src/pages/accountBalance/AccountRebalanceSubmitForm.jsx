/* eslint-disable no-shadow */
import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  TableCell,
  TableHead,
  TableRow,
  Modal,
  TableBody,
  Tooltip,
  IconButton,
  Table,
  LinearProgress,
  useTheme,
} from '@mui/material';
import { DateTime } from 'luxon';
import CachedIcon from '@mui/icons-material/Cached';
import {
  openInNewTab,
  startRebalance,
  stopRebalance,
  checkAccountRebalance,
  cancelMultiOrder,
  stopScheduled,
} from '../../apiServices';
import { BASEURL, removeFalsyAndEmptyKeys } from '../../util';

const filteredAssets = (assets) => {
  return assets.filter(
    (asset) => asset.symbol && typeof asset.symbol === 'string' && !['USDT', 'USD', 'USDC'].includes(asset.symbol)
  );
};

function AccountRebalanceSubmitForm({
  assetOrdering,
  balanceData,
  currentAssets,
  counterAsset,
  setCounterAsset,
  selectedAccount,
  fetchRebalanceStatus,
  selectedAccountFull,
  setIsFloating,
  multiOrderFormProps,
  isFloating,
  showAlert,
  setTargetWeights,
  setOurAssets,
  netBalance,
  ourAssets,
  targetWeights,
  calculateCurrentWeight,
  calculateDiff,
  currentPrices,
  setCurrentPrices,
  calculateProposedTrade,
  totalCurrentNotional,
  formattedTotalProposedTradeNotional,
  targetWeightsWithAssetType,
  totalTargetNotional,
  totalCurrentNotionalAllFormatted,
  formattedPerpAssetPairs,
  rebalanceMode,
  setRebalanceMode,
  parentOrder,
  setParentOrder,
  BalanceNotional,
  setBalanceNotional,
  taskId,
  setTaskId,
  rebalanceProgress,
  setRebalanceProgress,
  isScheduled,
  setIsScheduled,
  inProgress,
  setInProgress,
  tolerance,
  selectedDuration,
  rebalanceFrequencyValue,
  rebalanceFrequency,
  setTolerance,
  setSelectedDuration,
  setRebalanceFrequencyValue,
  setRebalanceFrequency,
  positionTypes,
  setPositionTypes,
  formattedSpotAssetPairs,
  nextRebalance,
  setNextRebalance,
  loadOrderData,
  startTime,
  setStartTime,
  orderId,
  setOrderId,
  setTimeLeft,
  timeLeft,
  getAssetQuantityForCounterAsset,
  isStarting,
  setIsStarting,
}) {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [stopLoading, setStopLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [rebalanceData, setRebalanceData] = useState(null);
  const [childOrders, setChildOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFinisher, setIsFinisher] = useState(false);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const trimSymbol = (symbol) => {
    if (typeof symbol === 'string') {
      return symbol.replace(/-USDT|-USDC|-USD$/, '');
    }
    return symbol;
  };

  useEffect(() => {
    const formattedStartTime = DateTime.fromJSDate(new Date(startTime));
    const calculatedEndTime = formattedStartTime.plus({ seconds: selectedDuration * 60 });
    if (calculatedEndTime > DateTime.fromISO(nextRebalance)) {
      setIsFinisher(true);
    }
    if (calculatedEndTime < DateTime.fromISO(nextRebalance)) {
      setIsFinisher(false);
    }
  }, [startTime, nextRebalance, selectedDuration]);

  useEffect(() => {
    if (!inProgress && totalCurrentNotional) {
      setBalanceNotional(parseFloat(totalCurrentNotional).toFixed(2));
    }
  }, [totalCurrentNotional, inProgress]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const loadData = async () => {
        if (selectedAccount?.accountId === 'All Accounts') {
          return;
        }

        try {
          setLoading(true);
          await fetchRebalanceStatus();
        } catch (error) {
          showAlert({ severity: 'info', message: 'Rebalance not in progress.' });
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, 1500);

    return () => {
      clearTimeout(handler);
    };
  }, [selectedAccount]);

  const handleClearFields = () => {
    if (selectedAccount && selectedAccount.accountId) {
      localStorage.removeItem(`targetWeights_${selectedAccount.accountId}`);
    }
    if (selectedAccount && selectedAccount.accountId) {
      localStorage.removeItem(`startTime_${selectedAccount.accountId}`);
    }
    setTargetWeights({});
    setBalanceNotional(totalCurrentNotional.toFixed(2));
    setTolerance(1);
    setSelectedDuration(15);
    setIsFloating(false);
    setRebalanceFrequencyValue(1);
    setRebalanceFrequency('Hours');
    setCounterAsset('USDT');

    setPositionTypes({});
    setOurAssets([]);
  };

  const handleRebalance = async () => {
    setSubmitLoading(true);
    setMessage('');

    if (!selectedAccount || !selectedAccount.accountId) {
      showAlert({ severity: 'error', message: 'No account selected. Please select an account to rebalance.' });
      setSubmitLoading(false);
      return;
    }

    try {
      const rebalanceStatus = await checkAccountRebalance(selectedAccount.accountId);
      if (rebalanceStatus.status === 'in_progress') {
        showAlert({
          severity: 'error',
          message: `Rebalance already in progress for account ${selectedAccount.accountId}. Please wait for it to complete.`,
        });
        setSubmitLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error checking rebalance status:', error);
      showAlert({
        severity: 'error',
        message: `Failed to check rebalance status for account ${selectedAccount.accountId}. Please try again.`,
      });
      setSubmitLoading(false);
      return;
    }

    const counterAssetBalance = parseFloat(getAssetQuantityForCounterAsset()) || 0;
    const combinedAssets = [...filteredAssets(netBalance.assets), ...ourAssets];
    const totalTargetWeight = Object.values(targetWeights).reduce(
      (total, weight) => total + parseFloat(weight || 0),
      0
    );

    if (Math.abs(totalTargetWeight) <= 0 || Math.abs(totalTargetWeight) > 100) {
      showAlert({
        severity: 'error',
        message: 'Total target weight must be greater than 0% and less than or equal to 100%.',
      });
      setSubmitLoading(false);
      return;
    }

    const invalidTargetWeights = Object.entries(targetWeights).filter(
      ([symbol, weight]) => parseFloat(weight) < -100 || parseFloat(weight) > 100
    );
    if (invalidTargetWeights.length > 0) {
      showAlert({ severity: 'error', message: 'Target weights must be between -100% and 100%.' });
      setSubmitLoading(false);
      return;
    }

    const filteredAssetsWithTargetWeight = combinedAssets.filter((asset) => {
      const normalizedSymbol = (asset.symbol || asset.pair.split('-')[0]).replace(/-USDT$/, '');
      const currentNotional = asset.currentNotional || 0;
      const currentWeight = calculateCurrentWeight(currentNotional, BalanceNotional);
      const targetWeight = parseFloat(targetWeights[normalizedSymbol] || 0);
      const targetNotional = targetWeight * (BalanceNotional / 100);
      const diff = parseFloat(calculateDiff(targetWeight, currentWeight, targetNotional, currentNotional));

      if (Math.abs(diff) < tolerance) {
        return false;
      }

      return Object.prototype.hasOwnProperty.call(targetWeights, normalizedSymbol);
    });

    if (filteredAssetsWithTargetWeight.length === 0) {
      showAlert({ severity: 'info', message: 'All assets are within tolerance. No rebalancing needed.' });
      setSubmitLoading(false);
      return;
    }

    const child_orders = filteredAssetsWithTargetWeight.map((asset, index) => {
      const symbolOrPair = trimSymbol(asset.symbol || asset.pair);
      const pair = symbolOrPair.includes(counterAsset) ? symbolOrPair : `${symbolOrPair}-${counterAsset}`;
      const currentPrice = currentPrices[pair] || currentPrices[symbolOrPair] || 0;

      if (currentPrice === 0) {
        return {
          accounts: [selectedAccount.exchangeName],
          pair,
          side: 'sell',
          base_asset_qty: 0,
        };
      }

      const targetWeight = parseFloat(targetWeights[symbolOrPair] || 0);
      const { proposedTradeNotional } = calculateProposedTrade(
        targetWeight,
        asset.currentNotional,
        currentPrice,
        totalCurrentNotional
      );

      const side = proposedTradeNotional > 0 ? 'buy' : 'sell';
      const base_asset_qty = currentPrice > 0 ? Math.abs(proposedTradeNotional / currentPrice) : 0;

      return {
        accounts: [selectedAccount.exchangeName],
        pair,
        side,
        base_asset_qty,
      };
    });
    const counterAssetCalculation = parseFloat(getAssetQuantityForCounterAsset());
    const totalCurrentNotionalAndCounterAsset = totalCurrentNotional + counterAssetCalculation;

    if (BalanceNotional > totalCurrentNotionalAndCounterAsset) {
      showAlert({
        severity: 'error',
        message: `Balance notional (${BalanceNotional.toFixed(2)} ${counterAsset}) exceeds the available balance (${totalCurrentNotionalAndCounterAsset.toFixed(2)} ${counterAsset}).`,
      });
      setSubmitLoading(false);
      return;
    }
    const maxAllowedBalanceNotional = BalanceNotional * 1.05;
    if (isFloating && maxAllowedBalanceNotional > totalCurrentNotionalAndCounterAsset) {
      showAlert({
        severity: 'error',
        message: `Maximum floating balance notional (${maxAllowedBalanceNotional.toFixed(2)} ${counterAsset})
        exceeds the available balance (${totalCurrentNotionalAndCounterAsset.toFixed(2)} ${counterAsset}).`,
      });
      setSubmitLoading(false);
      return;
    }

    if (formattedTotalProposedTradeNotional > counterAssetBalance) {
      showAlert({ severity: 'error', message: 'Insufficient liquidity for rebalancing.' });
      setSubmitLoading(false);
      return;
    }

    const duration = selectedDuration * 60; // Convert minutes to seconds
    const intervalMilliseconds =
      rebalanceFrequencyValue *
      {
        Minutes: 60 * 1000,
        Hours: 60 * 60 * 1000,
        Days: 24 * 60 * 60 * 1000,
        Weeks: 7 * 24 * 60 * 60 * 1000,
        Months: 30 * 24 * 60 * 60 * 1000,
      }[rebalanceFrequency];
    const intervalTime = intervalMilliseconds / 1000;
    if (duration > intervalTime) {
      showAlert({
        severity: 'error',
        message: `Duration exceeds the available execution time.
        Available time: ${duration} seconds.`,
      });
      setSubmitLoading(false);
      return;
    }

    const rebalanceSettings = removeFalsyAndEmptyKeys({
      ...parentOrder,
      duration,
    });
    const formattedStartTime = DateTime.fromJSDate(new Date(startTime)).toISO();
    const rebalanceData = {
      rebalance_mode: rebalanceMode,
      rebalance_settings: rebalanceSettings,
      target_weights: targetWeightsWithAssetType,
      tolerance,
      initial_balance_notional: parseInt(BalanceNotional, 10),
      is_floating: isFloating,
      account_id: selectedAccount.accountId,
      exchange_name: selectedAccount.exchangeName,
      counter_asset: counterAsset,
      interval: rebalanceMode === 'Set Frequency' ? intervalTime : 0,
      start_date: formattedStartTime,
    };

    setChildOrders(child_orders);
    setRebalanceData(rebalanceData);
    setShowConfirmation(true);
  };

  const confirmRebalance = async () => {
    if (!rebalanceData) {
      showAlert({ severity: 'error', message: 'Rebalance data not found.' });
      return;
    }

    setSubmitLoading(true);
    setShowConfirmation(false);
    try {
      const response = await startRebalance(rebalanceData);
      if (response.success) {
        showAlert({ severity: 'success', message: response.message });
        setTaskId(response.task_id);
        setOrderId(response.parent_order_id);
        if (response.task_id) {
          localStorage.setItem(`rebalance_task_id_${selectedAccount.accountId}`, response.task_id);
        }
        if (response.message.includes('Rebalance task started immediately')) {
          setIsStarting(true);
          setStartTime(response.start_date);
        }
        if (response.message.includes('successfully scheduled')) {
          setIsScheduled(true);
          setStartTime(response.start_date);
        }
      } else {
        showAlert({ severity: 'error', message: response.message });
      }
    } catch (error) {
      showAlert({ severity: 'error', message: 'Error occurred during rebalance process.' });
    } finally {
      const currentTime = new Date().getTime();
      const baseDelay = childOrders.length > 10 ? 60000 : 30000;
      const scheduledTime = startTime ? new Date(startTime).getTime() + baseDelay : currentTime + baseDelay;
      const delay = Math.max(0, scheduledTime - currentTime);

      setTimeout(() => {
        setSubmitLoading(false);
        fetchRebalanceStatus();
        setIsStarting(false);
      }, delay);
    }
  };

  const handleStopRebalanceConfirmation = () => {
    setShowStopConfirmation(true);
  };

  const confirmStopRebalance = async () => {
    setLoading(true);
    setStopLoading(true);
    setShowStopConfirmation(false);

    try {
      const accountId = selectedAccount?.accountId;
      if (!accountId) {
        showAlert({ severity: 'error', message: 'No account selected.' });
        return;
      }

      let cancelOrderSuccess = true;

      if (orderId) {
        try {
          const cancelOrderResponse = await cancelMultiOrder(orderId);
          if (cancelOrderResponse.message) {
            showAlert({ severity: 'success', message: 'Order canceled successfully.' });
          } else {
            showAlert({ severity: 'warning', message: 'Failed to cancel order. Order might be already complete.' });
            cancelOrderSuccess = false;
          }
        } catch (error) {
          showAlert({ severity: 'warning', message: 'Order cancellation failed. Order might already be complete.' });
          cancelOrderSuccess = false;
        }
      }

      if (!taskId) {
        await fetchRebalanceStatus();

        if (!taskId) {
          showAlert({ severity: 'error', message: 'Task ID not found. Unable to stop the rebalance task.' });
          return;
        }
      }

      const taskKey = isScheduled ? `rebalance_task_id_${accountId}` : `rebalance_task_id_${accountId}`;

      const savedTaskId = localStorage.getItem(taskKey);

      if (!savedTaskId) {
        showAlert({ severity: 'error', message: 'No task ID found for the selected account.' });
        return;
      }

      const stopRebalanceResponse = isScheduled ? await stopScheduled(savedTaskId) : await stopRebalance(taskId);

      if (stopRebalanceResponse.message) {
        showAlert({ severity: 'success', message: stopRebalanceResponse.message });
        if (isScheduled) {
          setIsScheduled(false);
        }
      } else {
        showAlert({ severity: 'error', message: 'Failed to stop rebalance.' });
      }
    } catch (error) {
      showAlert({ severity: 'error', message: 'Error while stopping the rebalance.' });
    } finally {
      setLoading(false);
      setStopLoading(false);
      fetchRebalanceStatus();
    }
  };

  const inProgressOrIsScheduled = inProgress || isScheduled;
  const isRebalanceButtonDisabled =
    loading || submitLoading || inProgress || isScheduled || totalTargetNotional === '0.00';
  const isStopButtonDisabled = loading || stopLoading || !inProgressOrIsScheduled;

  const getRebalanceButtonText = () => {
    if (submitLoading) return 'Starting...';
    if (inProgress || isScheduled) return 'in Progress';
    return 'Rebalance';
  };

  const getStopButtonText = () => {
    if (stopLoading) return 'Stopping...';
    return 'Stop';
  };

  const formatDateTime = (time) => {
    const date = new Date(time);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const isoDate = new Date(startTime).toISOString();
  const formattedIsoDate = formatDateTime(isoDate);

  let content;

  if (inProgress && !isFinisher) {
    content = (
      <Box
        sx={{
          backgroundColor: 'var(--background-paper)',
          padding: '10px',
          borderRadius: '8px',
          border: `1px solid ${theme.palette.success[500]}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          position: 'relative',
          minWidth: '1000px',
          width: 'fit-content',
        }}
      >
        <Button
          sx={{
            marginLeft: '10px',
            position: 'absolute',
            top: '10px',
            right: '10px',
            borderColor: 'primary',
            color: 'primary',
            '&:hover': {
              borderColor: 'warning.main',
              color: 'warning.main',
              backgroundColor: 'transparent',
            },
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 600,
          }}
          variant='outlined'
          onClick={() => openInNewTab(`${BASEURL}/multi_order/${orderId}`)}
        >
          Order details
        </Button>

        <Typography sx={{ color: 'text.primary', fontSize: '16px', fontWeight: 600 }} variant='body1'>
          {rebalanceMode === 'Once' ? (
            <div>Your portfolio rebalance is in progress.</div>
          ) : (
            <div>
              Your portfolio rebalance is in progress. The process will be completed within {(timeLeft / 60).toFixed(0)}{' '}
              minutes.
            </div>
          )}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '10px',
          }}
        >
          <LinearProgress
            sx={{
              flex: 1,
              height: '8px',
              borderRadius: '5px',
              backgroundColor: theme.palette.success[600],
              '& .MuiLinearProgress-bar': { backgroundColor: theme.palette.success[500] },
            }}
            value={rebalanceProgress}
            variant='determinate'
          />
          <Typography
            sx={{
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {rebalanceProgress.toFixed(0)}% {selectedDuration} mins left
          </Typography>
        </Box>

        <Box
          sx={{
            borderTop: `1px solid ${theme.palette.grey[600]}`,
            paddingTop: '10px',
            marginTop: '10px',
          }}
        >
          <Typography sx={{ color: 'text.secondary', fontSize: '14px' }} variant='body2'>
            {rebalanceMode === 'Once' ? (
              <div>
                <strong>Rebalance Mode:</strong> Once
              </div>
            ) : (
              <div>
                <strong>Next Rebalance:</strong> {formatDateTime(nextRebalance)}
              </div>
            )}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (inProgress && isFinisher) {
    content = (
      <Box
        sx={{
          backgroundColor: 'var(--background-paper)',
          padding: '10px',
          borderRadius: '8px',
          border: `1px solid ${theme.palette.success[500]}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          position: 'relative',
          minWidth: '1000px',
          width: 'fit-content',
        }}
      >
        <Button
          sx={{
            marginLeft: '10px',
            position: 'absolute',
            top: '10px',
            right: '10px',
            borderColor: 'primary',
            color: 'primary',
            '&:hover': {
              borderColor: 'warning.main',
              color: 'warning.main',
              backgroundColor: 'transparent',
            },
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 600,
          }}
          variant='outlined'
          onClick={() => openInNewTab(`${BASEURL}/multi_order/${orderId}`)}
        >
          Order details
        </Button>

        <Typography sx={{ color: 'text.primary', fontSize: '16px', fontWeight: 600 }} variant='body1'>
          {rebalanceMode === 'Once' ? (
            <div>Your portfolio rebalance is in progress.</div>
          ) : (
            <div>
              Your portfolio rebalance is finishing. The process will be completed within {(timeLeft / 60).toFixed(0)}{' '}
              minutes.
            </div>
          )}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '10px',
          }}
        >
          <LinearProgress
            sx={{
              flex: 1,
              height: '8px',
              borderRadius: '5px',
              backgroundColor: theme.palette.success[600],
              '& .MuiLinearProgress-bar': { backgroundColor: theme.palette.success[500] },
            }}
            value={rebalanceProgress}
            variant='determinate'
          />
          <Typography
            sx={{
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {rebalanceProgress.toFixed(0)}%
          </Typography>
        </Box>

        <Box
          sx={{
            borderTop: `1px solid ${theme.palette.grey[600]}`,
            paddingTop: '10px',
            marginTop: '10px',
          }}
        >
          <Typography sx={{ color: 'text.secondary', fontSize: '14px' }} variant='body2'>
            {rebalanceMode === 'Once' ? (
              <div>
                <strong>Rebalance Mode:</strong> Once
              </div>
            ) : (
              <div>
                <strong>Next Rebalance will start at:</strong> {formatDateTime(nextRebalance)}
              </div>
            )}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (isScheduled) {
    content = (
      <Box
        sx={{
          backgroundColor: 'var(--background-paper)',
          padding: '10px',
          borderRadius: '8px',
          border: `1px solid ${theme.palette.success[500]}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          position: 'relative',
          minWidth: '1000px',
          width: 'fit-content',
        }}
      >
        <Typography sx={{ color: 'text.primary', fontSize: '16px', fontWeight: 600 }} variant='body1'>
          Rebalance is scheduled.
        </Typography>
        <Typography sx={{ color: 'text.primary', fontSize: '14px', fontWeight: 400 }} variant='body2'>
          Please wait for the scheduled start time.
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '14px', marginTop: '5px' }} variant='body2'>
          <strong>Start time:</strong> {formattedIsoDate}
        </Typography>
      </Box>
    );
  }

  if (isStarting) {
    content = (
      <Box
        sx={{
          backgroundColor: 'var(--background-paper)',
          padding: '10px',
          borderRadius: '8px',
          border: `1px solid ${theme.palette.success[500]}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          position: 'relative',
          minWidth: '1000px',
          width: 'fit-content',
        }}
      >
        <Typography sx={{ color: 'text.primary', fontSize: '16px', fontWeight: 600 }} variant='body1'>
          Rebalance is initializing.
        </Typography>
        <Typography sx={{ color: 'text.primary', fontSize: '14px', fontWeight: 400 }} variant='body2'>
          The rebalance task is being set up. Please wait for it to start (this may take up to 30-60 seconds).
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '14px', marginTop: '5px' }} variant='body2'>
          <strong>Start time:</strong> {formattedIsoDate}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: '5px', color: 'text.primary' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <Typography
            sx={{
              color: 'var(--text-primary)',
              fontSize: '18px',
              fontWeight: 600,
            }}
            variant='h6'
          >
            Rebalance Portfolio
          </Typography>

          <Tooltip arrow title='Clear all fields'>
            <IconButton
              color='primary'
              sx={{
                color: theme.palette.warning[500],
                borderRadius: '50%',
              }}
              onClick={handleClearFields}
            >
              <CachedIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: '5%',
          }}
        >
          <Button
            disabled={isStopButtonDisabled}
            sx={{
              backgroundColor: theme.palette.error[500],
              color: 'var(--text-primary)',
              width: '150px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { backgroundColor: theme.palette.error[600] },
            }}
            variant='contained'
            onClick={handleStopRebalanceConfirmation}
          >
            {getStopButtonText()}
          </Button>
          <Button
            disabled={isRebalanceButtonDisabled}
            sx={{
              backgroundColor: theme.palette.warning[500],
              color: 'var(--text-primary)',
              width: '150px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { backgroundColor: theme.palette.warning[600] },
            }}
            variant='contained'
            onClick={handleRebalance}
          >
            {getRebalanceButtonText()}
          </Button>
        </Box>
      </Box>
      {showConfirmation && (
        <Modal
          open={showConfirmation}
          onClose={() => {
            setShowConfirmation(false);
            setSubmitLoading(false);
          }}
        >
          <Box
            sx={{
              backgroundColor: theme.palette.grey[750],
              color: 'var(--text-primary)',
              padding: '20px',
              borderRadius: '8px',
              width: '500px',
              maxHeight: '80vh',
              overflowY: 'auto',
              margin: 'auto',
              marginTop: '10%',
              boxShadow: `0px 0px 10px ${theme.palette.common.pureBlack}80`, // 50% opacity
              position: 'relative',
            }}
          >
            <IconButton
              sx={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                color: 'var(--text-primary)',
              }}
              onClick={() => {
                setShowConfirmation(false);
                setSubmitLoading(false);
              }}
            >
              ✖️
            </IconButton>
            <Typography sx={{ marginBottom: '20px', textAlign: 'center' }} variant='h6'>
              Confirm Your Trades
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'text.primary' }}>Pair</TableCell>
                  <TableCell sx={{ color: 'text.primary' }}>Side</TableCell>
                  <TableCell sx={{ color: 'text.primary' }}>Quantity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {childOrders.map((order) => {
                  const baseSymbol = order.pair ? order.pair.split('-')[0] : order.symbol;
                  const fullSymbol = `${baseSymbol}-USDT`;
                  const currentPrice = currentPrices[fullSymbol] || currentPrices[baseSymbol] || 0;
                  const uniqueKey = `${order.pair}-${order.side}`;

                  const isPerp = formattedPerpAssetPairs.some((pair) => pair.symbol === baseSymbol);
                  const targetWeight = targetWeights[fullSymbol] || targetWeights[baseSymbol] || 0;
                  const hasNonZeroTargetWeight = targetWeight !== 0;

                  let sideDescription;
                  if (!hasNonZeroTargetWeight && isPerp) {
                    sideDescription = order.side === 'buy' ? 'Close Short' : 'Close Long';
                  } else if (isPerp) {
                    sideDescription = order.side === 'buy' ? 'Buy (Long)' : 'Sell (Short)';
                  } else {
                    sideDescription = order.side === 'buy' ? 'Buy' : 'Sell';
                  }

                  return (
                    <TableRow key={uniqueKey}>
                      <TableCell sx={{ color: 'text.primary' }}>{order.pair}</TableCell>
                      <TableCell
                        sx={{
                          color: order.side === 'buy' ? theme.palette.semantic.success : theme.palette.semantic.error,
                          fontWeight: 'bold',
                        }}
                      >
                        {sideDescription}
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>
                        {(order.base_asset_qty * currentPrice).toFixed(2)} {counterAsset}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
              <Button
                sx={{ backgroundColor: 'warning.main', color: 'text.primary' }}
                variant='contained'
                onClick={confirmRebalance}
              >
                Confirm
              </Button>
            </Box>
          </Box>
        </Modal>
      )}
      {showStopConfirmation && (
        <Modal open={showStopConfirmation} onClose={() => setShowStopConfirmation(false)}>
          <Box
            sx={{
              backgroundColor: theme.palette.grey[750],
              color: 'var(--text-primary)',
              padding: '20px',
              borderRadius: '8px',
              width: '400px',
              margin: 'auto',
              marginTop: '20%',
              textAlign: 'center',
              boxShadow: `0px 0px 10px ${theme.palette.common.pureBlack}80`, // 50% opacity
            }}
          >
            <Typography sx={{ marginBottom: '20px' }} variant='h6'>
              Confirm Stop Rebalance
            </Typography>
            <Typography sx={{ marginBottom: '20px' }}>
              Are you sure you want to stop the rebalance process? This action cannot be undone.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
              <Button
                sx={{ backgroundColor: 'error.main', color: 'text.primary' }}
                variant='contained'
                onClick={confirmStopRebalance}
              >
                Yes, Stop
              </Button>
              <Button
                sx={{ backgroundColor: 'success.main', color: 'text.primary' }}
                variant='contained'
                onClick={() => setShowStopConfirmation(false)}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        </Modal>
      )}
      {content}
      {message && <Typography sx={{ marginTop: '20px', color: 'var(--text-primary)' }}>{message}</Typography>}
    </Box>
  );
}

export default AccountRebalanceSubmitForm;
