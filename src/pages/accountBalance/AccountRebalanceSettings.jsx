/* eslint-disable no-shadow */
import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  TextField,
  Modal,
  MenuItem,
  FormControl,
  Select,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Stack,
  RadioGroup,
  Radio,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useAtom } from 'jotai';
import { DateTime } from 'luxon';
import { fetchOrderEntryFormData, fetchMultiOrderDetailData } from '../../apiServices';
import { TimezoneAutoComplete, timeZoneNoOffset } from '../../shared/TimezoneUtil';
import { timezoneAtom } from '../../shared/hooks/useGlobalFormReducer';
import AccountRebalanceSettingsForm from './AccountRebalanceSettingsForm';
import AccountRebalanceTable from './AccountRebalanceTable';

function AccountRebalanceSettings({
  BalanceNotional,
  ourAssets,
  positionTypes,
  setBalanceNotional,
  setOurAssets,
  setPositionTypes,
  setTargetWeights,
  targetWeights,
  selectedAccount,
  netBalance,
  rebalanceData,
  balanceData,
  showAlert,
  selectedAccountFull,
  totalCurrentNotional,
  fetchRebalanceStatus,
  localBalanceNotional,
  localInProgress,
  localIsFloating,
  localIsScheduled,
  localLoading,
  localNextRebalance,
  localOrderId,
  localRebalanceMode,
  localRebalanceProgress,
  localSelectedDuration,
  localTargetWeights,
  localTaskId,
  localTimeStart,
  localTolerance,
  setLocalBalanceNotional,
  setLocalInProgress,
  setLocalIsFloating,
  setLocalIsScheduled,
  setLocalNextRebalance,
  setLocalOrderId,
  setLocalRebalanceMode,
  setLocalSelectedDuration,
  setLocalStartTime,
  setLocalTargetWeights,
  setLocalTolerance,
  setTimeLeft,
  timeLeft,
}) {
  const [rebalanceFrequency, setRebalanceFrequency] = useState('Hours');
  const [rebalanceFrequencyValue, setRebalanceFrequencyValue] = useState(1);
  const [nextRebalance, setNextRebalance] = useState('');
  const [message, setMessage] = useState('');
  const [taskId, setTaskId] = useState([]);
  const [counterAsset, setCounterAsset] = useState('USDT');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rebalanceProgress, setRebalanceProgress] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [parentOrder, setParentOrder] = useState({});
  const [strategies, setStrategies] = useState([]);
  const [strategyParams, setStrategyParams] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [superStrategies, setSuperStrategies] = useState({});
  const [selectedStrategyParams, setSelectedStrategyParams] = useState({});
  const [selectedDuration, setSelectedDuration] = useState(15);
  const [passiveness, setPassiveness] = useState(0.02);
  const [discretion, setDiscretion] = useState(0.08);
  const [exposureTolerance, setExposureTolerance] = useState(0.1);
  const [alphaTilt, setAlphaTilt] = useState(0);
  const [isScheduled, setIsScheduled] = useState(false);
  const [startTime, setStartTime] = useState([new Date()]);
  const [setDateEnabled, setSetDateEnabled] = useState(false);
  const [durationStartDate, setDurationStartDate] = useState(null);
  const [timeZone, setTimeZone] = useAtom(timezoneAtom);
  const [initialSettings, setInitialSettings] = useState({
    selectedStrategy,
    selectedDuration,
    alphaTilt,
    discretion,
    exposureTolerance,
    passiveness,
    selectedStrategyParams,
  });
  const [rebalanceMode, setRebalanceMode] = useState('Once');
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    setInProgress(localInProgress);
    setStartTime(localTimeStart);
    setIsScheduled(localIsScheduled);
    setOrderId(localOrderId);
    setTaskId(localTaskId);
    setNextRebalance(localNextRebalance);
    setSelectedDuration(localSelectedDuration);
    setRebalanceMode(localRebalanceMode);
  }, [
    localInProgress,
    localIsScheduled,
    localTimeStart,
    localRebalanceProgress,
    localLoading,
    localOrderId,
    localTaskId,
    localSelectedDuration,
    localNextRebalance,
    localIsFloating,
    localRebalanceMode,
  ]);

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const data = await fetchOrderEntryFormData();
        const strategies = data.strategies.reduce((acc, strategy) => {
          if (strategy.name !== 'VWAP') acc[strategy.id] = strategy;
          return acc;
        }, {});
        setStrategies(strategies);

        setSelectedStrategy(data.strategies[0]?.id || '');
        setStrategyParams(data.strategy_params);
      } catch (error) {
        showAlert({ severity: 'error', message: `Failed to fetch token pairs or strategies: ${error.message}` });
      }
    };

    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchStrategies()]);
      setLoading(false);
    };

    loadInitialData();
  }, [counterAsset]);

  const trimSymbol = (symbol) => {
    if (typeof symbol === 'string') {
      return symbol.replace(/-USDT|-USDC|-USD$/, '');
    }
    return symbol;
  };

  useEffect(() => {
    if (!inProgress && totalCurrentNotional) {
      setBalanceNotional(parseFloat(totalCurrentNotional).toFixed(2));
    }
  }, [totalCurrentNotional, inProgress]);

  const loadOrderData = async (order_id) => {
    try {
      const orderData = await fetchMultiOrderDetailData(order_id);
      const childOrders = orderData?.child_orders ?? [];
      const totalPctFilled = childOrders.reduce((sum, order) => sum + (order.pct_filled || 0), 0);
      const avgPctFilled = childOrders.length > 0 ? totalPctFilled / childOrders.length : 0;
      setRebalanceProgress(avgPctFilled);
    } catch (e) {
      showAlert({ severity: 'error', message: `Failed to fetch order details: ${e.message}` });
      setRebalanceProgress(0);
    }
  };

  const handleStartDateChange = (value) => {
    const formattedDate = DateTime.fromMillis(value.ts).toFormat('EEE MMM dd yyyy HH:mm:ss ZZZZ');
    setDurationStartDate(value);
    setStartTime([formattedDate]);
  };

  useEffect(() => {
    if (selectedAccount && selectedAccount.accountId !== 'All Accounts') {
      fetchRebalanceStatus();

      setIsFloating(false);
      setRebalanceFrequencyValue(1);
      setRebalanceFrequency('Hours');
      setCounterAsset('USDT');
    }
  }, [selectedAccount]);

  const calculateRebalanceInterval = () => {
    if (!startTime || !nextRebalance) {
      console.warn('startTime or nextRebalance is missing.');
      return { calculatedFrequencyValue: 0, calculatedFrequencyUnit: 'Minutes' };
    }

    const startTimeDate = new Date(startTime);
    const nextRebalanceDate = new Date(nextRebalance);
    const timeDifferenceInMs = nextRebalanceDate - startTimeDate;

    let calculatedFrequencyValue = 0;
    let calculatedFrequencyUnit = 'Minutes';

    const timeInMinutes = timeDifferenceInMs / (1000 * 60);
    const timeInHours = timeDifferenceInMs / (1000 * 60 * 60);
    const timeInDays = timeDifferenceInMs / (1000 * 60 * 60 * 24);
    const timeInWeeks = timeDifferenceInMs / (1000 * 60 * 60 * 24 * 7);
    const timeInMonths = timeDifferenceInMs / (1000 * 60 * 60 * 24 * 30);

    if (timeInMinutes < 60) {
      calculatedFrequencyValue = Math.round(timeInMinutes);
      calculatedFrequencyUnit = 'Minutes';
    } else if (timeInHours < 24) {
      calculatedFrequencyValue = Math.round(timeInHours);
      calculatedFrequencyUnit = 'Hours';
    } else if (timeInDays < 7) {
      calculatedFrequencyValue = Math.round(timeInDays);
      calculatedFrequencyUnit = 'Days';
    } else if (timeInWeeks < 4) {
      calculatedFrequencyValue = Math.round(timeInWeeks);
      calculatedFrequencyUnit = 'Weeks';
    } else {
      calculatedFrequencyValue = Math.round(timeInMonths);
      calculatedFrequencyUnit = 'Months';
    }

    return { calculatedFrequencyValue, calculatedFrequencyUnit };
  };

  useEffect(() => {
    if (inProgress) {
      const { calculatedFrequencyValue, calculatedFrequencyUnit } = calculateRebalanceInterval();
      setRebalanceFrequencyValue(calculatedFrequencyValue);
      setRebalanceFrequency(calculatedFrequencyUnit);
    }
  }, [inProgress, rebalanceData]);

  const calculateNextRebalance = () => {
    const baseDate = startTime ? new Date(startTime) : new Date();
    const multiplier = rebalanceFrequencyValue;
    let nextTime;

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

    switch (rebalanceFrequency) {
      case 'Minutes':
        nextTime = new Date(baseDate.getTime() + multiplier * 60 * 1000);
        break;
      case 'Hours':
        nextTime = new Date(baseDate.getTime() + multiplier * 60 * 60 * 1000);
        break;
      case 'Days':
        nextTime = new Date(baseDate.getTime() + multiplier * 24 * 60 * 60 * 1000);
        break;
      case 'Weeks':
        nextTime = new Date(baseDate.getTime() + multiplier * 7 * 24 * 60 * 60 * 1000);
        break;
      case 'Months': {
        let tempDate = new Date(baseDate);
        for (let i = 0; i < multiplier; i += 1) {
          const daysToAdd = daysInMonth(tempDate.getFullYear(), tempDate.getMonth());
          tempDate = new Date(tempDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        }
        nextTime = tempDate;
        break;
      }
      default:
        return;
    }

    setNextRebalance(nextTime.toISOString());
  };

  useEffect(() => {
    if (!inProgress) {
      calculateNextRebalance();
    }
  }, [rebalanceFrequency, rebalanceFrequencyValue, startTime]);

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

  useEffect(() => {
    if (inProgress && orderId) {
      loadOrderData(orderId);
    }
  }, [inProgress, orderId]);

  useEffect(() => {
    let progressInterval;

    const fetchProgressPeriodically = async () => {
      if (inProgress && orderId) {
        try {
          await loadOrderData(orderId);
        } catch (error) {
          console.error('Error fetching progress:', error);
        }
      }
    };

    if (inProgress) {
      progressInterval = setInterval(fetchProgressPeriodically, 15000);
    } else {
      clearInterval(progressInterval);
    }

    return () => {
      clearInterval(progressInterval);
    };
  }, [inProgress, orderId]);

  const handleOpenSettings = () => {
    setInitialSettings({
      selectedStrategy,
      alphaTilt,
      discretion,
      exposureTolerance,
      passiveness,
      selectedStrategyParams,
    });

    setIsSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    setParentOrder((prevParentOrder) => ({
      ...prevParentOrder,
      strategy: selectedStrategy,
      alpha_tilt: alphaTilt,
      schedule_discretion: discretion,
      exposure_tolerance: exposureTolerance,
      engine_passiveness: passiveness,
      strategy_params: selectedStrategyParams,
    }));

    setInitialSettings({
      selectedStrategy,
      alphaTilt,
      discretion,
      exposureTolerance,
      passiveness,
      selectedStrategyParams,
    });

    setIsSettingsOpen(false);
  };

  const handleCloseSettings = () => {
    setSelectedStrategy(initialSettings.selectedStrategy);
    setAlphaTilt(initialSettings.alphaTilt);
    setDiscretion(initialSettings.discretion);
    setExposureTolerance(initialSettings.exposureTolerance);
    setPassiveness(initialSettings.passiveness);
    setSelectedStrategyParams(initialSettings.selectedStrategyParams);

    setParentOrder((prevParentOrder) => ({
      ...prevParentOrder,
      strategy: initialSettings.selectedStrategy,
      alpha_tilt: initialSettings.alphaTilt,
      schedule_discretion: initialSettings.discretion,
      exposure_tolerance: initialSettings.exposureTolerance,
      engine_passiveness: initialSettings.passiveness,
      strategy_params: initialSettings.selectedStrategyParams,
    }));

    setIsSettingsOpen(false);
  };

  const multiOrderFormProps = {
    strategies,
    strategyParams,
    selectedStrategy,
    setSelectedStrategy,
    selectedDuration,
    selectedStrategyParams,
    setSelectedStrategyParams,
    setSelectedDuration,
    passiveness,
    setPassiveness,
    discretion,
    setDiscretion,
    exposureTolerance,
    setExposureTolerance,
    superStrategies,
    showAlert,
    alphaTilt,
    setAlphaTilt,
    submitLoading,
  };

  useEffect(() => {
    setParentOrder((prevParentOrder) => ({
      ...prevParentOrder,
      strategy: selectedStrategy,
      alpha_tilt: alphaTilt,
      schedule_discretion: discretion,
      exposure_tolerance: exposureTolerance,
      engine_passiveness: passiveness,
      strategy_params: selectedStrategyParams,
    }));
  }, [selectedStrategy, alphaTilt, discretion, exposureTolerance, passiveness, selectedStrategyParams]);

  useEffect(() => {
    if (selectedAccount && selectedAccount.accountId) {
      const savedTimeStart = localStorage.getItem(`startTime_${selectedAccount.accountId}`);
      if (savedTimeStart) {
        try {
          const parsedTime = JSON.parse(savedTimeStart);
          const sanitizedTime = Array.isArray(parsedTime)
            ? parsedTime.map((time) => new Date(time))
            : [new Date(parsedTime)];
          setStartTime(sanitizedTime);
        } catch (error) {
          console.error('Error parsing saved startTime:', error);
          setStartTime([new Date()]);
        }
      } else {
        setStartTime([new Date()]);
      }
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (selectedAccount && selectedAccount.accountId) {
      try {
        const sanitizedStartTime = Array.isArray(startTime)
          ? startTime.map((time) => (time instanceof Date ? time : new Date(time)))
          : [new Date(startTime)];
        localStorage.setItem(
          `startTime_${selectedAccount.accountId}`,
          JSON.stringify(sanitizedStartTime.map((time) => time.toISOString()))
        );
      } catch (error) {
        console.error('Error saving startTime to localStorage:', error);
      }
    }
  }, [startTime, selectedAccount]);

  useEffect(() => {
    if (selectedAccount && selectedAccount.accountId) {
      const savedIsScheduled = localStorage.getItem(`isScheduled_${selectedAccount.accountId}`);
      if (savedIsScheduled !== null) {
        try {
          setIsScheduled(JSON.parse(savedIsScheduled));
        } catch (error) {
          console.error('Error parsing saved isScheduled:', error);
          setIsScheduled(false);
        }
      }
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (selectedAccount && selectedAccount.accountId) {
      try {
        localStorage.setItem(`isScheduled_${selectedAccount.accountId}`, JSON.stringify(isScheduled));
      } catch (error) {
        console.error('Error saving isScheduled to localStorage:', error);
      }
    }
  }, [isScheduled, selectedAccount]);

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

  const RebalanceTableProps = {
    loadOrderData,
    balanceData,
    counterAsset,
    fetchRebalanceStatus,
    inProgress,
    isFloating,
    isScheduled,
    multiOrderFormProps,
    parentOrder,
    rebalanceMode,
    rebalanceProgress,
    selectedAccount,
    selectedAccountFull,
    setCounterAsset,
    setInProgress,
    setIsFloating,
    setIsScheduled,
    setParentOrder,
    setRebalanceMode,
    setRebalanceProgress,
    setTaskId,
    showAlert,
    taskId,
    localTolerance,
    selectedDuration,
    rebalanceFrequencyValue,
    rebalanceFrequency,
    setLocalTolerance,
    setSelectedDuration,
    setRebalanceFrequencyValue,
    setRebalanceFrequency,
    nextRebalance,
    setNextRebalance,
    localBalanceNotional,
    localTargetWeights,
    setLocalBalanceNotional,
    setLocalTargetWeights,
    setStartTime,
    startTime,
    orderId,
    setOrderId,
    setTimeLeft,
    timeLeft,
    isStarting,
    setIsStarting,
  };

  return (
    <Box sx={{ color: 'text.primary' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <AccountRebalanceTable {...RebalanceTableProps} />
      </Box>
      <FormControlLabel
        control={
          <Checkbox
            checked={isFloating}
            color='primary'
            disabled={inProgress || isScheduled || isStarting}
            onChange={(e) => setIsFloating(e.target.checked)}
          />
        }
        label='Enable Floating Balance Notional (+5%/-5%)'
      />
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px',
          marginBottom: '20px',
        }}
      >
        <Box sx={{ flex: 1, maxWidth: '400px' }}>
          <Typography
            sx={{
              color: 'text.primary',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '10px',
            }}
            variant='body2'
          >
            3. Set Schedule
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '5px' }}>
            {!inProgress && (
              <Box sx={{ marginBottom: '20px' }}>
                <FormControl>
                  <RadioGroup
                    row
                    sx={{ justifyContent: 'flex-start' }}
                    value={rebalanceMode}
                    onChange={(e) => setRebalanceMode(e.target.value)}
                  >
                    <FormControlLabel
                      control={<Radio disabled={inProgress || isScheduled || isStarting} />}
                      label='Once'
                      value='Once'
                    />
                    <FormControlLabel
                      control={<Radio disabled={inProgress || isScheduled || isStarting} />}
                      label='Set Frequency'
                      value='Set Frequency'
                    />
                  </RadioGroup>
                </FormControl>
                {rebalanceMode === 'Set Frequency' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                    <TextField
                      autoComplete='off'
                      disabled={inProgress || isScheduled || isStarting}
                      inputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        min: 0,
                        style: {
                          backgroundColor: 'ui.inputBackground',
                          color: 'text.primary',
                          padding: '5px',
                        },
                      }}
                      // eslint-disable-next-line react/jsx-no-duplicate-props
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position='end'>
                            <FormControl>
                              <Select
                                disabled={inProgress || isScheduled || isStarting}
                                sx={{
                                  color: 'text.primary',
                                  '.MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                  },
                                  '.MuiSelect-select': {
                                    padding: 0,
                                  },
                                }}
                                value={rebalanceFrequency}
                                onChange={(e) => setRebalanceFrequency(e.target.value)}
                              >
                                <MenuItem value='Minutes'>Minutes</MenuItem>
                                <MenuItem value='Hours'>Hours</MenuItem>
                                <MenuItem value='Days'>Days</MenuItem>
                                <MenuItem value='Weeks'>Weeks</MenuItem>
                                <MenuItem value='Months'>Months</MenuItem>
                              </Select>
                            </FormControl>
                          </InputAdornment>
                        ),
                      }}
                      label='Time frequency'
                      sx={{
                        width: '220px',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: 'ui.inputBackground',
                        },
                      }}
                      type='text'
                      value={rebalanceFrequencyValue}
                      onChange={(e) => {
                        const inputValue = e.target.value.trim();
                        const parsedValue = parseInt(inputValue, 10);
                        if (inputValue === '' || Number.isNaN(parsedValue)) {
                          setRebalanceFrequencyValue(0);
                        } else {
                          setRebalanceFrequencyValue(parsedValue);
                        }
                      }}
                    />
                  </Box>
                )}
                <Stack alignItems='center' direction='row' spacing={2}>
                  <Stack alignItems='center' direction='row'>
                    <Checkbox
                      checked={setDateEnabled}
                      disabled={inProgress || isScheduled || isStarting}
                      onChange={(e) => setSetDateEnabled(e.target.checked)}
                    />
                    <Typography variant='body1'>Set Date</Typography>
                  </Stack>
                </Stack>
                <Box>
                  {setDateEnabled && !inProgress && (
                    <Box sx={{ marginTop: 1 }}>
                      <LocalizationProvider dateAdapter={AdapterLuxon}>
                        <Stack direction='row' spacing={1}>
                          <DateTimePicker
                            disablePast
                            ampm={false}
                            label={`Time Start (${timeZoneNoOffset(timeZone)})`}
                            renderInput={(props) => (
                              <TextField
                                {...props}
                                sx={{
                                  input: { backgroundColor: 'ui.inputBackground', color: 'text.primary' },
                                }}
                              />
                            )}
                            value={durationStartDate}
                            onChange={(value) => handleStartDateChange(value)}
                          />
                          <TimezoneAutoComplete
                            sx={{ width: '70%' }}
                            value={timeZone}
                            onChange={(tz) => setTimeZone(tz)}
                          />
                        </Stack>
                      </LocalizationProvider>
                    </Box>
                  )}
                </Box>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', marginTop: '-5px', marginBottom: '-5px' }}>
            <Typography sx={{ color: 'text.primary' }} variant='body2'>
              {rebalanceMode === 'Once' ? (
                <div />
              ) : (
                <div>
                  <strong>Next Rebalance:</strong> {formatDateTime(nextRebalance)}
                </div>
              )}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ marginLeft: 'auto' }}>
          <Button
            color='primary'
            disabled={inProgress || isStarting}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '14px',
              borderColor: 'warning.main',
              color: 'warning.main',
              '&:hover': {
                borderColor: 'warning.dark',
                color: 'warning.dark',
                backgroundColor: 'transparent',
              },
            }}
            variant='outlined'
            onClick={handleOpenSettings}
          >
            Additional settings (optional)
          </Button>
        </Box>
      </Box>
      <Modal
        aria-describedby='rebalance-settings-modal-description'
        aria-labelledby='rebalance-settings-modal-title'
        open={isSettingsOpen}
        onClose={handleCloseSettings}
      >
        <Box
          sx={{
            backgroundColor: 'ui.inputBackground',
            color: 'text.primary',
            padding: '30px',
            borderRadius: '10px',
            width: '60%',
            height: '28vh',
            overflowY: 'auto',
            margin: 'auto',
            marginTop: '10%',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <Typography component='h2' id='rebalance-settings-modal-title' variant='h6'>
            Parent Order Settings
          </Typography>

          <Box sx={{ marginTop: '10px' }}>
            <AccountRebalanceSettingsForm {...multiOrderFormProps} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <Button color='secondary' variant='contained' onClick={handleCloseSettings}>
              Close
            </Button>
            <Button color='primary' variant='contained' onClick={handleSaveSettings}>
              Save
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
export default AccountRebalanceSettings;
