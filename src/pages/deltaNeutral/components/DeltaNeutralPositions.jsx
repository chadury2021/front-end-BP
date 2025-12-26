import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  Skeleton,
  FormControlLabel,
  Checkbox,
  Pagination,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CancelIcon from '@mui/icons-material/Cancel';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SyncIcon from '@mui/icons-material/Sync';
import CloseIcon from '@mui/icons-material/Close';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { TokenIcon, ExchangeIcon } from '@/shared/components/Icons';
import { msAndKs, formatAccountName, getPairBase } from '@/util';
import { useInitialLoadData } from '@/shared/context/InitialLoadDataProvider';
import { useTheme } from '@emotion/react';
import { useToast } from '@/shared/context/ToastProvider';
import { submitMultiOrder, getFundingRates, cancelMultiOrder } from '@/apiServices';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

// Custom CountUp component that animates formatted numbers (K/M/B)
function FormattedCountUp({ to, from = 0, duration = 0.3, formatter = (v) => v }) {
  const toNum = typeof to === 'string' ? parseFloat(to) : to;
  const fromNum = typeof from === 'string' ? parseFloat(from) : from;

  const ref = useRef(null);
  const motionValue = useMotionValue(fromNum);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);

  const springValue = useSpring(motionValue, {
    damping,
    stiffness,
  });

  const isInView = useInView(ref, { once: true, margin: '0px' });

  // Ensure initial text is rendered even if from === to (no spring change)
  useEffect(() => {
    if (ref.current) {
      try {
        ref.current.textContent = formatter(fromNum, 2);
      } catch (_) {
        ref.current.textContent = String(fromNum ?? '');
      }
    }
  }, [fromNum, formatter]);

  useEffect(() => {
    if (isInView) {
      motionValue.set(fromNum);

      const timeoutId = setTimeout(() => {
        motionValue.set(toNum);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [isInView, motionValue, fromNum, toNum]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = formatter(latest, 2);
      }
    });

    return () => unsubscribe();
  }, [springValue, formatter]);

  return <span ref={ref} />;
}

function AnimatedMsAndKs({ value, duration = 0.3 }) {
  const prevRef = useRef(value);
  const from = prevRef.current;
  useEffect(() => {
    prevRef.current = value;
  }, [value]);
  return <FormattedCountUp duration={duration} formatter={msAndKs} from={from} to={value} />;
}

function StatusIcon({ statusText, color = 'text.secondary' }) {
  const getStatusIcon = () => {
    const statusLower = statusText.toLowerCase();

    if (statusLower === 'opening' || statusLower === 'started') {
      return <HourglassEmptyIcon fontSize='small' />;
    }
    if (statusLower === 'open') {
      return <CheckCircleIcon fontSize='small' />;
    }
    if (statusLower === 'closing') {
      return <CloseIcon fontSize='small' />;
    }
    if (statusLower === 'complete') {
      return <CheckCircleIcon fontSize='small' />;
    }
    if (statusLower === 'canceled' || statusLower === 'cancelled') {
      return <CancelIcon fontSize='small' />;
    }
    if (statusLower === 'active') {
      return <PlayArrowIcon fontSize='small' />;
    }
    if (statusLower === 'paused') {
      return <PauseIcon fontSize='small' />;
    }
    if (statusLower === 'unwinding') {
      return <SyncIcon fontSize='small' />;
    }
    if (statusLower === 'unbalanced') {
      return <WarningIcon fontSize='small' />;
    }
    // Default
    return <CheckCircleIcon fontSize='small' />;
  };

  return (
    <Tooltip title={statusText}>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', color }}>{getStatusIcon()}</Box>
    </Tooltip>
  );
}

function computeDisplay(position, fundingRates = [], getAccount = () => null) {
  const po = position?.opening_parent_order || {};
  const childOrders = Array.isArray(po.child_orders) ? po.child_orders : [];

  const buyOrder = childOrders.find((c) => c.side === 'buy');
  const sellOrder = childOrders.find((c) => c.side === 'sell');

  const longPair = buyOrder?.pair || (po.pairs || '').split(',')[0] || '-';
  const shortPair = sellOrder?.pair || (po.pairs || '').split(',')[1] || '-';

  const longAccount = buyOrder?.account_names?.[0] || po.account_names?.[0] || null;
  const shortAccount = sellOrder?.account_names?.[0] || po.account_names?.[1] || po.account_names?.[0] || null;

  // Get absolute notional value for a child order
  const getChildNotional = (child) => {
    if (!child) return 0;
    const explicit = parseFloat(child.executed_notional || 0);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    const qty = parseFloat(child.executed_buy_qty ?? child.executed_qty ?? 0);
    const price = parseFloat(child.average_executed_price ?? child.executed_price ?? 0);
    if (Number.isFinite(qty) && Number.isFinite(price)) return Math.abs(qty * price);
    return 0;
  };

  // Get signed notional for net exposure calculation (buy positive, sell negative)
  const getChildNotionalSigned = (child) => {
    if (!child) return 0;
    const explicit = parseFloat(child.executed_notional);
    if (Number.isFinite(explicit)) return child.side === 'buy' ? Math.abs(explicit) : -Math.abs(explicit);
    const qty = parseFloat(child.executed_buy_qty ?? child.executed_qty ?? 0);
    const price = parseFloat(child.average_executed_price ?? child.executed_price ?? 0);
    if (Number.isFinite(qty) && Number.isFinite(price)) {
      const notional = Math.abs(qty * price);
      return child.side === 'buy' ? notional : -notional;
    }
    return 0;
  };

  // Calculate opening leg notionals (both positive)
  const openingBuyNotional = getChildNotional(buyOrder);
  const openingSellNotional = getChildNotional(sellOrder);
  let openingTotalNotional = openingBuyNotional + openingSellNotional;
  let openingNetExposure = getChildNotionalSigned(buyOrder) + getChildNotionalSigned(sellOrder);

  // If child orders are not populated, use parent order's executed_notional
  if (openingTotalNotional === 0) {
    const parentExecutedNotional = parseFloat(po.executed_notional);
    if (Number.isFinite(parentExecutedNotional) && parentExecutedNotional > 0) {
      openingTotalNotional = parentExecutedNotional;
    }
    const parentExposure = parseFloat(po.notional_exposure);
    if (Number.isFinite(parentExposure)) {
      openingNetExposure = parentExposure;
    }
  }

  // Calculate closing leg notionals if they exist
  const closingParentOrder = position?.closing_parent_order;
  let closingTotalNotional = 0;
  let closingNetExposure = 0;

  if (closingParentOrder) {
    // Try to get from child_orders array first (if populated)
    const closingChildOrders = Array.isArray(closingParentOrder?.child_orders) ? closingParentOrder.child_orders : [];

    if (closingChildOrders.length > 0) {
      // Use child orders if available
      const closingBuyOrder = closingChildOrders.find((c) => c.side === 'buy');
      const closingSellOrder = closingChildOrders.find((c) => c.side === 'sell');
      closingTotalNotional = getChildNotional(closingBuyOrder) + getChildNotional(closingSellOrder);
      closingNetExposure = getChildNotionalSigned(closingBuyOrder) + getChildNotionalSigned(closingSellOrder);
    } else {
      // Fallback: use executed_notional from parent order
      const closingExecutedNotional = parseFloat(closingParentOrder.executed_notional);
      if (Number.isFinite(closingExecutedNotional) && closingExecutedNotional > 0) {
        closingTotalNotional = closingExecutedNotional;
      }

      // For net exposure of closing order, use notional_exposure if available
      const closingExposure = parseFloat(closingParentOrder.notional_exposure);
      if (Number.isFinite(closingExposure)) {
        closingNetExposure = closingExposure;
      }
    }
  }

  // Total Notional = opening legs (both positive) - closing legs (both positive)
  const executedNotional = openingTotalNotional - closingTotalNotional;

  // Net Exposure = opening leg net exposure + closing leg net exposure
  // (closing leg exposure is already signed correctly: negative when unwinding longs, positive when unwinding shorts)
  let netExposureUsd = openingNetExposure + closingNetExposure;
  const pctFilled = po.pct_filled || 0;

  // Ensure net exposure defined
  if (!Number.isFinite(netExposureUsd)) netExposureUsd = 0;

  const EXPOSURE_EPSILON = 1e-6;
  const residualExposureAbs = Math.max(Math.abs(executedNotional), Math.abs(netExposureUsd));
  const hasExposure = residualExposureAbs > EXPOSURE_EPSILON;

  // Mark imbalanced when exposure is more than 1% of total notional
  const exposurePercent = executedNotional > 0 ? Math.abs(netExposureUsd) / executedNotional : 0;
  const exposureImbalanced = exposurePercent > 0.01; // 1% threshold
  const unbalanced = exposureImbalanced;

  // Derive status label
  let statusText = 'Unknown';
  const posStatus = String(position?.status || '').toLowerCase();

  // Use calculated_status (derived from child orders) if available, fallback to status
  const orderStatus = String(po?.calculated_status || po?.status || '').toUpperCase();

  // Check if opening leg multi order is active
  const activeStatuses = new Set(['ACTIVE', 'RUNNING', 'PAUSED', 'PENDING', 'SUBMITTED', 'SCHEDULED', 'FINISHER']);
  const openingLegActive = activeStatuses.has(orderStatus);
  const openingLegCompleteOrCanceled = ['COMPLETE', 'CANCELED', 'CANCELLED'].includes(orderStatus);

  // Check if closing leg multi order is active
  const closingStatus = String(closingParentOrder?.calculated_status || closingParentOrder?.status || '').toUpperCase();
  const closingLegActive = activeStatuses.has(closingStatus);
  const closingLegCompleteOrCanceled = ['COMPLETE', 'CANCELED', 'CANCELLED'].includes(closingStatus);

  // Use backend-calculated is_fully_closed value
  const isFullyClosed = position?.is_fully_closed || false;

  const inactiveDueToNoFill = !hasExposure && openingLegCompleteOrCanceled && !closingParentOrder;

  // Determine if position is inactive (closing order complete/canceled and exists, fully closed, or no fills)
  const isInactive = (closingParentOrder && closingLegCompleteOrCanceled) || isFullyClosed || inactiveDueToNoFill;

  // Can reverse if: opening order is complete AND no closing order exists (or closing order is still active) AND has exposure
  const canReverse =
    hasExposure &&
    openingLegCompleteOrCanceled &&
    (!closingParentOrder || !closingLegCompleteOrCanceled) &&
    !isFullyClosed;

  // Determine status based on order states (most specific first)
  if (openingLegActive) {
    statusText = 'Opening';
  } else if (closingLegActive) {
    statusText = 'Closing';
  } else if (inactiveDueToNoFill) {
    statusText = ['CANCELED', 'CANCELLED'].includes(orderStatus) ? 'Canceled' : 'No Fill';
  } else if (isInactive) {
    // Position has a completed/canceled closing order
    statusText = 'Complete';
  } else if (openingLegCompleteOrCanceled) {
    // Opening order is done but no closing order and still has exposure
    statusText = 'Open';
  } else if (orderStatus) {
    // Fallback to order status mapping
    const orderStatusMap = {
      COMPLETE: 'Complete',
      CANCELED: 'Canceled',
      CANCELLED: 'Canceled',
      ACTIVE: 'Active',
      RUNNING: 'Active',
      PAUSED: 'Active',
      PENDING: 'Pending',
      FINISHER: 'Active',
    };
    statusText = orderStatusMap[orderStatus] || orderStatus;
  } else {
    // Last resort: use position status
    const posStatusMap = {
      closed: 'Complete',
      closing: 'Closing',
      open: 'Open',
      opening: 'Opening',
    };
    statusText = posStatusMap[posStatus] || 'Unknown';
  }

  // Calculate funding rates for both positions
  // For long positions, funding rate is inverted (longs pay when funding is positive)
  const getFundingRateForPair = (pair, accountName) => {
    if (!pair || pair === '-' || !accountName) return null;
    const account = getAccount(accountName);
    const exchange = account?.exchangeName;
    if (!exchange) return null;
    const basePair = getPairBase(pair);
    const rateData = fundingRates.find((rate) => rate.pair === basePair && rate.exchange === exchange);
    const rate = rateData?.rate;
    const interval = rateData?.funding_rate_interval;
    return rate != null && interval != null ? parseFloat(rate) / parseFloat(interval) : null;
  };

  // Get raw funding rates
  const longFundingRate = getFundingRateForPair(longPair, longAccount);
  const shortFundingRate = getFundingRateForPair(shortPair, shortAccount);

  // For long positions, invert the sign (longs pay when funding is positive)
  // Treat null funding rates as 0
  const longFundingRateAdjusted = longFundingRate !== null ? -longFundingRate : 0;
  const shortFundingRateAdjusted = shortFundingRate !== null ? shortFundingRate : 0;

  // Combined funding rate (what we're earning/paying)
  const combinedFundingRate = longFundingRateAdjusted + shortFundingRateAdjusted;

  return {
    longPair,
    shortPair,
    longAccount,
    shortAccount,
    executedNotional,
    netExposureUsd,
    pctFilled,
    unbalanced,
    statusText,
    isInactive,
    canReverse,
    hasExposure,
    openingLegActive,
    closingLegActive,
    openingLegCompleteOrCanceled,
    closingLegCompleteOrCanceled,
    fundingRate: {
      combined: combinedFundingRate,
      long: longFundingRateAdjusted,
      short: shortFundingRateAdjusted,
      longRaw: longFundingRate,
      shortRaw: shortFundingRate,
    },
  };
}

const HIDDEN_POSITIONS_STORAGE_KEY = 'deltaNeutralHiddenPositions:v1';

export default function DeltaNeutralPositions({
  positions = [],
  loading = false,
  onReverseSuccess = () => {},
  showActiveOnly = true,
  onToggleActiveOnly = () => {},
}) {
  const theme = useTheme();
  const { getAccount } = useInitialLoadData();
  const { showToastMessage } = useToast();
  const [reverseLoading, setReverseLoading] = useState({});
  const [cancelLoading, setCancelLoading] = useState({});
  const [fundingRates, setFundingRates] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [hiddenPositions, setHiddenPositions] = useState({});

  // Load locally hidden positions from localStorage so deletions persist across refresh
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HIDDEN_POSITIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setHiddenPositions(parsed);
        }
      }
    } catch {
      // ignore parse/storage errors
    }
  }, []);

  // Persist hidden positions to localStorage whenever they change
  useEffect(() => {
    try {
      window.localStorage.setItem(HIDDEN_POSITIONS_STORAGE_KEY, JSON.stringify(hiddenPositions));
    } catch {
      // ignore storage errors
    }
  }, [hiddenPositions]);

  // Fetch funding rates
  useEffect(() => {
    let isMounted = true;

    const fetchFundingRates = async () => {
      try {
        const data = await getFundingRates();
        if (!isMounted) return;
        setFundingRates(Array.isArray(data) ? data : []);
      } catch {
        if (!isMounted) return;
        setFundingRates([]);
      }
    };

    // Fetch immediately on mount so funding data is available without delay
    fetchFundingRates();

    const interval = setInterval(fetchFundingRates, 30000); // Refresh every 30 seconds
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const rows = useMemo(() => (Array.isArray(positions) ? positions : []), [positions]);

  // Locally hide positions that the user has removed from the list
  const visibleRows = useMemo(() => {
    if (!rows.length) return rows;
    return rows.filter((position) => {
      const key = position?.opening_parent_order?.id || position?.id;
      if (!key) return true;
      return !hiddenPositions[key];
    });
  }, [rows, hiddenPositions]);

  // Calculate aggregate metrics for header tooltips
  const summaryMetrics = useMemo(() => {
    const metrics = {
      totalPositions: visibleRows.length,
      activePositions: 0,
      closingPositions: 0,
      openingActive: 0,
      closingActive: 0,
      totalExposure: 0,
      netExposure: 0,
      fundingSum: 0,
      fundingCount: 0,
      statusCounts: {},
    };

    visibleRows.forEach((position) => {
      const data = computeDisplay(position, fundingRates, getAccount);

      metrics.totalExposure += data.executedNotional || 0;
      metrics.netExposure += data.netExposureUsd || 0;

      if (data.openingLegActive || data.closingLegActive) metrics.activePositions += 1;
      if (position?.closing_parent_order) metrics.closingPositions += 1;
      if (data.openingLegActive) metrics.openingActive += 1;
      if (data.closingLegActive) metrics.closingActive += 1;

      const statusKey = data.statusText || 'Unknown';
      metrics.statusCounts[statusKey] = (metrics.statusCounts[statusKey] || 0) + 1;

      const hasFunding = data.fundingRate.longRaw !== null || data.fundingRate.shortRaw !== null;
      if (hasFunding) {
        metrics.fundingSum += data.fundingRate.combined || 0;
        metrics.fundingCount += 1;
      }
    });

    metrics.avgFunding = metrics.fundingCount ? metrics.fundingSum / metrics.fundingCount : null;
    return metrics;
  }, [visibleRows, fundingRates, getAccount]);

  // Calculate pagination
  const totalPages = Math.ceil(visibleRows.length / rowsPerPage);
  const paginatedRows = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return visibleRows.slice(startIndex, startIndex + rowsPerPage);
  }, [visibleRows, page, rowsPerPage]);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(1);
    }
  }, [page, totalPages]);

  const handleWindDown = async (position) => {
    const po = position?.opening_parent_order;
    if (!po) {
      showToastMessage({ type: 'error', message: 'No opening order found for this position.' });
      return;
    }

    // Get child orders to extract executed quantities
    const childOrders = Array.isArray(po.child_orders) ? po.child_orders : [];
    const buyOrder = childOrders.find((c) => c.side === 'buy');
    const sellOrder = childOrders.find((c) => c.side === 'sell');

    if (!buyOrder || !sellOrder) {
      showToastMessage({ type: 'error', message: 'Child orders not found. Cannot wind down.' });
      return;
    }

    // For delta neutral: buyOrder is the long position, sellOrder is the short position
    const longPair = buyOrder.pair;
    const shortPair = sellOrder.pair;
    const longAccount = buyOrder.account_names?.[0];
    const shortAccount = sellOrder.account_names?.[0];

    if (!longPair || !shortPair || !longAccount || !shortAccount) {
      showToastMessage({ type: 'error', message: 'Incomplete position data. Cannot wind down.' });
      return;
    }

    // Get executed quantities from child orders
    const longQty = parseFloat(buyOrder.executed_buy_qty || buyOrder.executed_qty || 0);
    const shortQty = parseFloat(sellOrder.executed_qty || 0);

    if (longQty === 0 && shortQty === 0) {
      showToastMessage({ type: 'error', message: 'No executed quantities to wind down.' });
      return;
    }

    setReverseLoading((prev) => ({ ...prev, [po.id]: true }));
    try {
      // Use the same duration as the opening order
      const duration = po.duration || 300;

      const windDownPayload = {
        accounts: [shortAccount, longAccount],
        strategy: 'TWAP',
        delta_neutral: true,
        strategy_params: {
          passive_only: false,
          active_limit: true,
          cleanup_on_cancel: false,
        },
        engine_passiveness: 0.03,
        schedule_discretion: 0.03,
        child_orders: [
          { accounts: [shortAccount], pair: shortPair, side: 'buy', base_asset_qty: shortQty },
          { accounts: [longAccount], pair: longPair, side: 'sell', base_asset_qty: longQty },
        ],
        duration,
      };

      await submitMultiOrder(windDownPayload);
      showToastMessage({ type: 'success', message: 'Wind down order submitted successfully.' });
      onReverseSuccess();
    } catch (error) {
      showToastMessage({ type: 'error', message: error.message || 'Failed to submit wind down order.' });
    } finally {
      setReverseLoading((prev) => ({ ...prev, [po.id]: false }));
    }
  };

  const handleCancel = async (position) => {
    const po = position?.opening_parent_order;
    const closingOrder = position?.closing_parent_order;

    if (!po) {
      showToastMessage({ type: 'error', message: 'No order found to cancel.' });
      return;
    }

    // Determine which orders to cancel based on their status
    const ordersToCancelIds = [];
    const ordersToCancelNames = [];

    // Check if opening order is active
    const openingStatus = String(po?.calculated_status || po?.status || '').toUpperCase();
    const activeStatuses = new Set(['ACTIVE', 'RUNNING', 'PAUSED', 'PENDING', 'SUBMITTED', 'SCHEDULED', 'FINISHER']);
    if (activeStatuses.has(openingStatus)) {
      ordersToCancelIds.push(po.id);
      ordersToCancelNames.push('opening order');
    }

    // Check if closing order is active
    if (closingOrder) {
      const closingStatus = String(closingOrder?.calculated_status || closingOrder?.status || '').toUpperCase();
      if (activeStatuses.has(closingStatus)) {
        ordersToCancelIds.push(closingOrder.id);
        ordersToCancelNames.push('closing order');
      }
    }

    if (ordersToCancelIds.length === 0) {
      showToastMessage({ type: 'info', message: 'No active orders to cancel.' });
      return;
    }

    const positionKey = po.id;
    setCancelLoading((prev) => ({ ...prev, [positionKey]: true }));

    try {
      // Cancel all active orders
      await Promise.all(ordersToCancelIds.map((orderId) => cancelMultiOrder(orderId)));

      const orderNames = ordersToCancelNames.join(' and ');
      showToastMessage({ type: 'success', message: `Successfully canceled ${orderNames}.` });
      onReverseSuccess();
    } catch (error) {
      showToastMessage({ type: 'error', message: error.message || 'Failed to cancel order(s).' });
    } finally {
      setCancelLoading((prev) => ({ ...prev, [positionKey]: false }));
    }
  };

  const renderSkeletonCard = (key) => (
    <Paper
      elevation={1}
      key={key}
      sx={{ p: 2, mb: 2, backgroundColor: 'rgba(10, 12, 24, 0.50)', backdropFilter: 'blur(8px)' }}
    >
      <Grid container alignItems='center' spacing={2}>
        <Grid xs={2.25}>
          <Skeleton animation='wave' height={40} variant='rounded' width='90%' />
        </Grid>
        <Grid xs={2.25}>
          <Skeleton animation='wave' height={40} variant='rounded' width='90%' />
        </Grid>
        <Grid xs={1.5}>
          <Skeleton animation='wave' height={40} variant='rounded' width='90%' />
        </Grid>
        <Grid xs={1.5}>
          <Skeleton animation='wave' height={40} variant='rounded' width='90%' />
        </Grid>
        <Grid xs={1.5}>
          <Skeleton animation='wave' height={40} variant='rounded' width='90%' />
        </Grid>
        <Grid xs={1.25}>
          <Skeleton animation='wave' height={40} variant='rounded' width='90%' />
        </Grid>
        <Grid xs={1.25}>
          <Skeleton animation='wave' height={40} variant='rounded' width='90%' />
        </Grid>
        <Grid xs={0.75}>
          <Stack alignItems='center' direction='row' justifyContent='flex-end' spacing={0}>
            <Skeleton animation='wave' height={32} variant='circular' width={32} />
            <Skeleton animation='wave' height={32} variant='circular' width={32} />
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );

  const renderCard = (position) => {
    const po = position?.opening_parent_order || {};
    const {
      longPair,
      shortPair,
      longAccount,
      shortAccount,
      executedNotional,
      netExposureUsd,
      pctFilled,
      unbalanced,
      statusText,
      isInactive,
      canReverse,
      hasExposure,
      openingLegActive,
      closingLegActive,
      openingLegCompleteOrCanceled,
      closingLegCompleteOrCanceled,
      fundingRate,
    } = computeDisplay(position, fundingRates, getAccount);

    const longExchange = longAccount ? getAccount(longAccount)?.exchangeName : null;
    const shortExchange = shortAccount ? getAccount(shortAccount)?.exchangeName : null;
    let netExposureColor = 'text.secondary';
    if (netExposureUsd > 0) netExposureColor = 'success.main';
    else if (netExposureUsd < 0) netExposureColor = 'error.main';

    const handleDeletePosition = () => {
      const key = po?.id || position.id;
      if (!key) return;
      setHiddenPositions((prev) => ({
        ...prev,
        [key]: true,
      }));
    };

    return (
      <Paper
        elevation={1}
        key={po.id || position.id}
        sx={{
          p: 2,
          mb: 2,
          backgroundColor: 'rgba(10, 12, 24, 0.50)',
          backdropFilter: 'blur(8px)',
          opacity: isInactive ? 0.5 : 1,
          transition: 'opacity 0.3s ease',
        }}
      >
        <Grid container alignItems='center' spacing={2}>
          {/* Long position */}
          <Grid xs={2.25}>
            <Stack alignItems='center' direction='row' spacing={1.5}>
              {/* Token icon with exchange subscript */}
              <Stack alignItems='center' direction='row' spacing={0.5}>
                <TokenIcon style={{ height: 28, width: 28 }} tokenName={longPair} />
                <ExchangeIcon exchangeName={longExchange} style={{ height: 28, width: 28 }} />
              </Stack>
              <Stack direction='column'>
                <Typography color='success.main' variant='body2'>
                  {longPair}
                </Typography>
                <Tooltip title={longAccount || 'N/A'}>
                  <Typography
                    color='text.secondary'
                    sx={{
                      maxWidth: '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    variant='caption'
                  >
                    {formatAccountName(longAccount, 15) || 'N/A'}
                  </Typography>
                </Tooltip>
              </Stack>
            </Stack>
          </Grid>

          {/* Short position */}
          <Grid xs={2.25}>
            <Stack alignItems='center' direction='row' spacing={1.5}>
              {/* Token icon with exchange subscript */}
              <Stack alignItems='center' direction='row' spacing={0.5}>
                <TokenIcon style={{ height: 28, width: 28 }} tokenName={shortPair} />
                <ExchangeIcon exchangeName={shortExchange} style={{ height: 28, width: 28 }} />
              </Stack>
              <Stack direction='column'>
                <Typography color='error.main' variant='body2'>
                  {shortPair}
                </Typography>
                <Tooltip title={shortAccount || 'N/A'}>
                  <Typography
                    color='text.secondary'
                    sx={{
                      maxWidth: '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    variant='caption'
                  >
                    {formatAccountName(shortAccount, 15) || 'N/A'}
                  </Typography>
                </Tooltip>
              </Stack>
            </Stack>
          </Grid>

          {/* Notional */}
          <Grid xs={1.5}>
            <Typography variant='body1'>
              {executedNotional < 0 ? '-' : ''}$<AnimatedMsAndKs value={Math.abs(executedNotional) || 0} />
            </Typography>
          </Grid>

          {/* Net Exposure */}
          <Grid xs={1.5}>
            <Typography sx={{ color: netExposureColor }} variant='body1'>
              {executedNotional > 0
                ? `${netExposureUsd < 0 ? '-' : ''}${((Math.abs(netExposureUsd) / executedNotional) * 100).toFixed(2)}%`
                : '0.00%'}
            </Typography>
          </Grid>

          {/* Funding Rate */}
          <Grid xs={1.5}>
            <Tooltip
              title={
                <Box>
                  <Typography variant='caption'>
                    Long: {fundingRate.longRaw !== null ? `${fundingRate.long.toFixed(4)}%` : '-'}
                  </Typography>
                  <br />
                  <Typography variant='caption'>
                    Short: {fundingRate.shortRaw !== null ? `${fundingRate.short.toFixed(4)}%` : '-'}
                  </Typography>
                  <br />
                </Box>
              }
            >
              <Typography
                sx={{
                  color: (() => {
                    if (fundingRate.longRaw === null && fundingRate.shortRaw === null) return 'text.secondary';
                    if (fundingRate.combined > 0) return 'success.main';
                    if (fundingRate.combined < 0) return 'error.main';
                    return 'text.primary';
                  })(),
                }}
                variant='body1'
              >
                {fundingRate.longRaw !== null || fundingRate.shortRaw !== null
                  ? `${fundingRate.combined.toFixed(4)}%`
                  : '-'}
              </Typography>
            </Tooltip>
          </Grid>

          {/* Status - opening/closing spinners */}
          <Grid xs={1.25}>
            <Stack alignItems='center' direction='row' flexWrap='wrap' spacing={1}>
              {/* Opening order status - hide if closing order exists */}
              {po?.id && !position?.closing_parent_order?.id && (
                <Tooltip
                  title={
                    openingLegCompleteOrCanceled
                      ? 'Opening order complete'
                      : `Opening order: ${Math.round(pctFilled || 0)}% filled`
                  }
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    {openingLegCompleteOrCanceled ? (
                      <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: '16px' }} />
                    ) : (
                      <>
                        <CircularProgress
                          size={16}
                          sx={{
                            color: theme.palette.success.main,
                          }}
                          thickness={5}
                          value={pctFilled || 0}
                          variant={openingLegActive ? 'indeterminate' : 'determinate'}
                        />
                        <Typography
                          color='success.main'
                          sx={{ fontSize: '0.7rem', minWidth: '30px' }}
                          variant='caption'
                        >
                          {Math.round(pctFilled || 0)}%
                        </Typography>
                      </>
                    )}
                  </Box>
                </Tooltip>
              )}

              {/* Closing order status */}
              {position?.closing_parent_order?.id && (
                <Tooltip
                  title={
                    closingLegCompleteOrCanceled
                      ? 'Closing order complete'
                      : `Closing order: ${Math.round(position.closing_parent_order.pct_filled || 0)}% filled`
                  }
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    {closingLegCompleteOrCanceled ? (
                      <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: '16px' }} />
                    ) : (
                      <>
                        <CircularProgress
                          size={16}
                          sx={{
                            color: theme.palette.error.main,
                          }}
                          thickness={5}
                          value={position.closing_parent_order.pct_filled || 0}
                          variant={closingLegActive ? 'indeterminate' : 'determinate'}
                        />
                        <Typography color='error.main' sx={{ fontSize: '0.7rem', minWidth: '30px' }} variant='caption'>
                          {Math.round(position.closing_parent_order.pct_filled || 0)}%
                        </Typography>
                      </>
                    )}
                  </Box>
                </Tooltip>
              )}

              {/* Unbalanced warning */}
              {unbalanced && !openingLegActive && !closingLegActive && (
                <StatusIcon color={theme.palette.warning.main} statusText='Unbalanced' />
              )}
            </Stack>
          </Grid>

          {/* Orders - clickable links */}
          <Grid xs={1.25}>
            <Stack alignItems='center' direction='row' spacing={0}>
              {/* Opening order link */}
              {po?.id && (
                <Tooltip title='View opening order'>
                  <IconButton
                    size='small'
                    sx={{ px: 0.5 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/multi_order/${po.id}`, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <Typography color='success.main' sx={{ fontSize: '1.2rem' }} variant='body2'>
                      ↑
                    </Typography>
                  </IconButton>
                </Tooltip>
              )}

              {/* Closing order link */}
              {position?.closing_parent_order?.id && (
                <Tooltip title='View closing order'>
                  <IconButton
                    size='small'
                    sx={{ px: 0.5 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/multi_order/${position.closing_parent_order.id}`, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <Typography color='error.main' sx={{ fontSize: '1.2rem' }} variant='body2'>
                      ↓
                    </Typography>
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Grid>

          {/* Actions */}
          <Grid xs={0.5}>
            <Stack alignItems='center' direction='row' justifyContent='flex-end' spacing={0}>
              {/* Cancel button */}
              <Tooltip
                title={(() => {
                  if (openingLegActive || closingLegActive) return 'Cancel active orders';
                  return 'No active orders to cancel';
                })()}
              >
                <span>
                  <IconButton
                    disabled={(!openingLegActive && !closingLegActive) || !!cancelLoading[po.id]}
                    size='small'
                    sx={{ color: theme.palette.error.main, padding: '4px' }}
                    onClick={() => handleCancel(position)}
                  >
                    {cancelLoading[po.id] ? (
                      <Skeleton animation='wave' height={20} variant='circular' width={20} />
                    ) : (
                      <CancelIcon fontSize='small' />
                    )}
                  </IconButton>
                </span>
              </Tooltip>

              {/* Wind down button */}
              <Tooltip
                title={(() => {
                  if (canReverse) return 'Wind down positions (reverse trade)';
                  if (!hasExposure && openingLegCompleteOrCanceled) return 'No fills executed to wind down';
                  if (isInactive) return 'Position is already closed';
                  return 'Opening order must complete before reversing';
                })()}
              >
                <span>
                  <IconButton
                    disabled={!canReverse || !!reverseLoading[po.id || position.id]}
                    size='small'
                    sx={{ color: theme.palette.warning.main, padding: '4px' }}
                    onClick={() => handleWindDown(position)}
                  >
                    {reverseLoading[po.id || position.id] ? (
                      <Skeleton animation='wave' height={20} variant='circular' width={20} />
                    ) : (
                      <SwapVertIcon fontSize='small' />
                    )}
                  </IconButton>
                </span>
              </Tooltip>

              {/* Delete (hide) position button */}
              <Tooltip title='Remove this position from the list (tread.fi only, does not close out the position on exchange)'>
                <span>
                  <IconButton
                    size='small'
                    sx={{ color: theme.palette.text.secondary, padding: '4px' }}
                    onClick={handleDeletePosition}
                  >
                    <DeleteForeverIcon fontSize='small' />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  const renderCheckbox = () => (
    <Box sx={{ mt: 2, px: 2, display: 'flex', justifyContent: 'flex-end' }}>
      <FormControlLabel
        control={
          <Checkbox
            checked={showActiveOnly}
            sx={{ color: 'text.secondary' }}
            onChange={(e) => onToggleActiveOnly(e.target.checked)}
          />
        }
        label={
          <Typography color='text.secondary' variant='body2'>
            Show only active positions
          </Typography>
        }
      />
    </Box>
  );

  if (loading) {
    return (
      <Stack direction='column' spacing={0} sx={{ pb: 6 }}>
        {Array.from({ length: 5 }).map((_, idx) => renderSkeletonCard(`pos-skel-${idx}`))}
        {renderCheckbox()}
      </Stack>
    );
  }

  if (visibleRows.length === 0) {
    return (
      <Stack direction='column' spacing={0} sx={{ pb: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Typography color='text.secondary' variant='body2'>
            No delta neutral positions found.
          </Typography>
        </Box>
        {renderCheckbox()}
      </Stack>
    );
  }

  const renderHeader = () => (
    <Grid container alignItems='center' spacing={2} sx={{ px: 2, py: 1.5, mb: 1 }}>
      <Grid xs={2.25}>
        <Tooltip
          title={
            <Box>
              <Typography variant='caption'>{`Total positions: ${summaryMetrics.totalPositions}`}</Typography>
              <br />
              <Typography variant='caption'>{`Active positions: ${summaryMetrics.activePositions}`}</Typography>
              <br />
              <Typography variant='caption'>{`Closing positions: ${summaryMetrics.closingPositions}`}</Typography>
            </Box>
          }
        >
          <Typography
            color='text.secondary'
            sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
            variant='caption'
          >
            Long
          </Typography>
        </Tooltip>
      </Grid>
      <Grid xs={2.25}>
        <Tooltip
          title={
            <Box>
              <Typography variant='caption'>{`Opening active: ${summaryMetrics.openingActive}`}</Typography>
              <br />
              <Typography variant='caption'>{`Closing active: ${summaryMetrics.closingActive}`}</Typography>
            </Box>
          }
        >
          <Typography
            color='text.secondary'
            sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
            variant='caption'
          >
            Short
          </Typography>
        </Tooltip>
      </Grid>
      <Grid xs={1.5}>
        <Tooltip
          title={
            <Typography variant='caption'>{`Aggregate: ${summaryMetrics.totalExposure >= 0 ? '' : '-'}$${msAndKs(
              Math.abs(summaryMetrics.totalExposure)
            )}`}</Typography>
          }
        >
          <Typography
            color='text.secondary'
            sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
            variant='caption'
          >
            Total Exposure
          </Typography>
        </Tooltip>
      </Grid>
      <Grid xs={1.5}>
        <Tooltip
          title={
            <Typography variant='caption'>{`Aggregate: ${summaryMetrics.netExposure >= 0 ? '' : '-'}$${msAndKs(
              Math.abs(summaryMetrics.netExposure)
            )}`}</Typography>
          }
        >
          <Typography
            color='text.secondary'
            sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
            variant='caption'
          >
            Net Exposure
          </Typography>
        </Tooltip>
      </Grid>
      <Grid xs={1.5}>
        <Tooltip
          title={
            <Typography variant='caption'>{`Average: ${
              summaryMetrics.avgFunding !== null ? `${summaryMetrics.avgFunding.toFixed(4)}%` : '-'
            }`}</Typography>
          }
        >
          <Typography
            color='text.secondary'
            sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
            variant='caption'
          >
            Funding Rate
          </Typography>
        </Tooltip>
      </Grid>
      <Grid xs={1.25}>
        <Tooltip
          title={
            <Box>
              {Object.entries(summaryMetrics.statusCounts).map(([status, count]) => (
                <Typography key={status} variant='caption'>{`${status}: ${count}`}</Typography>
              ))}
            </Box>
          }
        >
          <Typography
            color='text.secondary'
            sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
            variant='caption'
          >
            Status
          </Typography>
        </Tooltip>
      </Grid>
      <Grid xs={1.25}>
        <Tooltip
          title={
            <Box>
              <Typography variant='caption'>{`Positions with closing order: ${summaryMetrics.closingPositions}`}</Typography>
              <br />
              <Typography variant='caption'>{`Closing active: ${summaryMetrics.closingActive}`}</Typography>
            </Box>
          }
        >
          <Typography
            color='text.secondary'
            sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
            variant='caption'
          >
            Orders
          </Typography>
        </Tooltip>
      </Grid>
    </Grid>
  );

  return (
    <Stack direction='column' spacing={0} sx={{ pb: 6 }}>
      {/* Mobile: horizontally scrollable area */}
      <Box
        sx={{
          display: 'block',
          [theme.breakpoints.up('md')]: { display: 'none' },
        }}
      >
        <Paper elevation={1} sx={{ backgroundColor: 'rgba(10, 12, 24, 0.50)', backdropFilter: 'blur(8px)' }}>
          <Box sx={{ overflowX: 'auto', overflowY: 'visible' }}>
            <Box sx={{ minWidth: 980 }}>
              {renderHeader()}
              <Box sx={{ px: 2 }}>{paginatedRows.map((p) => renderCard(p))}</Box>
            </Box>
          </Box>
        </Paper>
        {renderCheckbox()}
      </Box>

      {/* Desktop and larger */}
      <Box
        sx={{
          display: 'none',
          [theme.breakpoints.up('md')]: { display: 'block' },
        }}
      >
        {renderHeader()}
        {paginatedRows.map((p) => renderCard(p))}
        {renderCheckbox()}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            color='primary'
            count={totalPages}
            page={page}
            size='small'
            onChange={(e, value) => setPage(value)}
          />
        </Box>
      )}
    </Stack>
  );
}
