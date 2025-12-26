import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Divider,
  TablePagination,
  Tooltip,
  IconButton,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import ProgressBar from '@/shared/fields/ProgressBar/ProgressBar';
import { msAndKs, insertEllipsis } from '@/util';
import { useThemeContext } from '@/theme/ThemeContext';
import { TokenIcon, ExchangeIcon } from '@/shared/components/Icons';
import { useInitialLoadData } from '@/shared/context/InitialLoadDataProvider';
import CancelIcon from '@mui/icons-material/Cancel';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { cancelMultiOrder, submitMultiOrder } from '@/apiServices';
import { useToast } from '@/shared/context/ToastProvider';
import { useTheme } from '@emotion/react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

// Custom CountUp component that animates formatted numbers (K/M/B)
function FormattedCountUp({ to, from = 0, duration = 0.3, formatter = msAndKs }) {
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

export default function DeltaNeutralHistory({ history }) {
  const {
    deltaNeutralOrders,
    loading,
    currentPageNumber,
    currentPageSize,
    numPages,
    count,
    setCurrentPageNumber,
    setCurrentPageSize,
    refresh,
  } = history;
  const { currentTheme } = useThemeContext();
  const { getAccount } = useInitialLoadData();
  const [cancelLoading, setCancelLoading] = useState({});
  const [windDownLoading, setWindDownLoading] = useState({});
  const { showToastMessage } = useToast();
  const theme = useTheme();

  const rows = useMemo(() => {
    if (!Array.isArray(deltaNeutralOrders)) return [];
    return deltaNeutralOrders.map((o) => {
      const pairs = (o.pairs || '').split(',').map((p) => p.trim());
      return {
        id: o.id,
        status: o.status,
        pct_filled: o.pct_filled,
        executed_notional: o.executed_notional,
        accounts: o.account_names || [],
        longPair: pairs[0] || '-',
        shortPair: pairs[1] || '-',
        child_orders: o.child_orders || [],
      };
    });
  }, [deltaNeutralOrders]);

  const getStatusColor = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'COMPLETE') return 'success';
    if (s === 'CANCELED' || s === 'CANCELLED') return 'error';
    if (s === 'ACTIVE' || s === 'RUNNING' || s === 'PAUSED' || s === 'FINISHER') return 'info';
    if (s === 'PENDING') return 'warning';
    return 'default';
  };

  const formatStatus = (status) => {
    const statusMap = {
      COMPLETE: 'Complete',
      CANCELED: 'Canceled',
      CANCELLED: 'Canceled',
      ACTIVE: 'Active',
      RUNNING: 'Running',
      PAUSED: 'Active', // Override PAUSED to display as Active
      PENDING: 'Pending',
      FINISHER: 'Active', // Override FINISHER to display as Active
    };
    return statusMap[status] || status;
  };

  const handleCancel = async (row, event) => {
    event.stopPropagation();
    setCancelLoading((prev) => ({ ...prev, [row.id]: true }));

    try {
      await cancelMultiOrder(row.id);

      showToastMessage({
        type: 'success',
        message: 'Delta Neutral bot order canceled successfully.',
      });

      // Refresh the data
      await refresh(currentPageNumber, currentPageSize, [], 0, false);
    } catch (error) {
      showToastMessage({
        type: 'error',
        message: error.message || 'Failed to cancel Delta Neutral bot order.',
      });
    } finally {
      setCancelLoading((prev) => ({ ...prev, [row.id]: false }));
    }
  };

  const handleWindDown = async (row, event) => {
    event.stopPropagation();
    setWindDownLoading((prev) => ({ ...prev, [row.id]: true }));

    try {
      // Find the child orders - buy (long) and sell (short)
      const buyOrder = row.child_orders?.find((c) => c.side === 'buy');
      const sellOrder = row.child_orders?.find((c) => c.side === 'sell');

      if (!buyOrder || !sellOrder) {
        throw new Error('Unable to find child orders');
      }

      // Get executed base quantities to reverse
      // For buy orders, executed_buy_qty is the base quantity
      // For sell orders, executed_qty is already the base quantity
      const buyExecutedQty = parseFloat(buyOrder.executed_buy_qty || buyOrder.executed_qty || 0);
      const sellExecutedQty = parseFloat(sellOrder.executed_qty || 0);

      if (buyExecutedQty === 0 && sellExecutedQty === 0) {
        throw new Error('No executed quantity to wind down');
      }

      // Get account names from child orders
      const originalBuyAccountName = buyOrder.account_names?.[0] || row.accounts[0];
      const originalSellAccountName = sellOrder.account_names?.[0] || row.accounts[1] || row.accounts[0];

      if (!originalBuyAccountName || !originalSellAccountName) {
        throw new Error('Unable to determine account names');
      }

      // Wind down: reverse the positions
      // The account that originally bought (long) will now sell
      // The account that originally sold (short) will now buy
      // But in the child_orders array, buy side should come first (that's the new long leg)
      const windDownPayload = {
        accounts: [originalSellAccountName, originalBuyAccountName], // buy account first, sell account second
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
          // New long leg: buy on the account that originally sold
          { accounts: [originalSellAccountName], pair: row.shortPair, side: 'buy', base_asset_qty: sellExecutedQty },
          // New short leg: sell on the account that originally bought
          { accounts: [originalBuyAccountName], pair: row.longPair, side: 'sell', base_asset_qty: buyExecutedQty },
        ],
        duration: 300, // 5 minutes for wind down
      };

      await submitMultiOrder(windDownPayload);
      showToastMessage({
        type: 'success',
        message: 'Wind down order submitted successfully.',
      });

      await refresh(currentPageNumber, currentPageSize, [], 0, false);
    } catch (error) {
      showToastMessage({
        type: 'error',
        message: error.message || 'Failed to submit wind down order.',
      });
    } finally {
      setWindDownLoading((prev) => ({ ...prev, [row.id]: false }));
    }
  };

  const isWalletAddress = (value) => {
    const s = String(value || '');
    const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(s);
    const isSolAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
    return isEthAddress || isSolAddress;
  };

  const handleOrderClick = (orderId) => {
    const url = `/multi_order/${orderId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderHeader = () => (
    <Grid container sx={{ px: 2, py: 1.5 }}>
      <Grid xs={1.75}>
        <Typography color='success.main' variant='small1'>
          Long Account
        </Typography>
      </Grid>
      <Grid xs={1.75}>
        <Typography color='success.main' variant='small1'>
          Long Pair
        </Typography>
      </Grid>
      <Grid xs={1.75}>
        <Typography color='error.main' variant='small1'>
          Short Account
        </Typography>
      </Grid>
      <Grid xs={1.75}>
        <Typography color='error.main' variant='small1'>
          Short Pair
        </Typography>
      </Grid>
      <Grid xs={1.75}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title='Total executed notional (buy + sell)'>
            <Typography color='text.secondary' sx={{ cursor: 'help' }} variant='small1'>
              Notional
            </Typography>
          </Tooltip>
        </Box>
      </Grid>
      <Grid xs={1.5}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography color='text.secondary' variant='small1'>
            Filled
          </Typography>
        </Box>
      </Grid>
      <Grid xs={0.75}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Typography color='text.secondary' variant='small1'>
            Status
          </Typography>
        </Box>
      </Grid>
      <Grid xs={1}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography color='text.secondary' variant='small1'>
            Actions
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );

  const renderRow = (row) => {
    const activeStatuses = new Set(['ACTIVE', 'RUNNING', 'PAUSED', 'PENDING', 'FINISHER']);
    const isActive = activeStatuses.has(String(row.status || '').toUpperCase());
    // Try to get accounts from child_orders first, then fall back to accounts array
    const buyOrder = row.child_orders?.find((c) => c.side === 'buy');
    const sellOrder = row.child_orders?.find((c) => c.side === 'sell');

    const longAccountName = buyOrder?.account_names?.[0] || row.accounts[0] || null;
    const shortAccountName = sellOrder?.account_names?.[0] || row.accounts[1] || row.accounts[0] || null;

    const longExchangeName = longAccountName ? getAccount(longAccountName)?.exchangeName : null;
    const shortExchangeName = shortAccountName ? getAccount(shortAccountName)?.exchangeName : null;

    const formatAccountName = (accountName) => {
      if (!accountName) return 'N/A';
      if (isWalletAddress(accountName)) {
        return insertEllipsis(accountName, 4, 4);
      }
      if (accountName.length > 15) {
        return `${accountName.substring(0, 15)}...`;
      }
      return accountName;
    };

    return (
      <Grid
        container
        key={row.id}
        sx={{
          px: 2,
          py: 0.5,
          cursor: 'pointer',
          alignItems: 'center',
          minHeight: '40px',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          transition: 'background-color 0.2s ease',
        }}
        onClick={() => handleOrderClick(row.id)}
      >
        <Grid xs={1.75}>
          <Stack alignItems='center' direction='row' spacing={1}>
            <ExchangeIcon exchangeName={longExchangeName} style={{ height: '20px', width: '20px' }} />
            <Typography variant='body1'>{formatAccountName(longAccountName)}</Typography>
          </Stack>
        </Grid>
        <Grid xs={1.75}>
          <Stack alignItems='center' direction='row' spacing={1}>
            <TokenIcon style={{ height: '20px', width: '20px' }} tokenName={row.longPair} />
            <Typography variant='body1'>{row.longPair}</Typography>
          </Stack>
        </Grid>
        <Grid xs={1.75}>
          <Stack alignItems='center' direction='row' spacing={1}>
            <ExchangeIcon exchangeName={shortExchangeName} style={{ height: '20px', width: '20px' }} />
            <Typography variant='body1'>{formatAccountName(shortAccountName)}</Typography>
          </Stack>
        </Grid>
        <Grid xs={1.75}>
          <Stack alignItems='center' direction='row' spacing={1}>
            <TokenIcon style={{ height: '20px', width: '20px' }} tokenName={row.shortPair} />
            <Typography variant='body1'>{row.shortPair}</Typography>
          </Stack>
        </Grid>
        <Grid xs={1.75}>
          <Typography sx={{ textAlign: 'right' }} variant='body1'>
            <span style={{ color: 'grey' }}>$</span>
            {isActive ? <AnimatedMsAndKs value={row.executed_notional || 0} /> : msAndKs(row.executed_notional || 0, 2)}
          </Typography>
        </Grid>
        <Grid xs={1.5}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
            <ProgressBar
              containerStyleOverride={{ width: '80%' }}
              isDark={currentTheme === 'dark'}
              isPov={false}
              orderStatus={row.status}
              progress={Math.round(Number(row.pct_filled || 0))}
            />
          </Box>
        </Grid>
        <Grid xs={0.75}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography
              sx={{
                color: (() => {
                  const statusColor = getStatusColor(row.status);
                  switch (statusColor) {
                    case 'success':
                      return 'success.main';
                    case 'error':
                      return 'error.main';
                    case 'warning':
                      return 'warning.main';
                    case 'info':
                      return 'info.main';
                    default:
                      return 'text.primary';
                  }
                })(),
              }}
              variant='body1'
            >
              {formatStatus(row.status)}
            </Typography>
          </Box>
        </Grid>
        <Grid xs={1}>
          <Stack alignItems='center' direction='row' justifyContent='center' spacing={0.5}>
            {/* Cancel button for active orders */}
            {row.status !== 'COMPLETE' &&
              row.status !== 'CANCELED' &&
              row.status !== 'CANCELLED' &&
              row.status !== 'FINISHER' && (
                <Tooltip title='Cancel order'>
                  <IconButton
                    disabled={cancelLoading[row.id]}
                    size='small'
                    sx={{
                      color: theme.palette.error.main,
                      '&:hover': {
                        backgroundColor: `${theme.palette.error.main}20`,
                      },
                    }}
                    onClick={(event) => handleCancel(row, event)}
                  >
                    {cancelLoading[row.id] ? <CircularProgress size={16} /> : <CancelIcon fontSize='small' />}
                  </IconButton>
                </Tooltip>
              )}
            {/* Wind down button for finished/canceled orders */}
            {(row.status === 'COMPLETE' ||
              row.status === 'CANCELED' ||
              row.status === 'CANCELLED' ||
              row.status === 'FINISHER') &&
              row.pct_filled > 0 && (
                <Tooltip title='Wind down positions (reverse trade)'>
                  <IconButton
                    disabled={windDownLoading[row.id]}
                    size='small'
                    sx={{
                      color: theme.palette.warning.main,
                      '&:hover': {
                        backgroundColor: `${theme.palette.warning.main}20`,
                      },
                    }}
                    onClick={(event) => handleWindDown(row, event)}
                  >
                    {windDownLoading[row.id] ? <CircularProgress size={16} /> : <SwapVertIcon fontSize='small' />}
                  </IconButton>
                </Tooltip>
              )}
          </Stack>
        </Grid>
      </Grid>
    );
  };

  const renderSkeletonRow = (key) => (
    <Grid
      container
      key={key}
      sx={{
        px: 2,
        py: 1,
        alignItems: 'center',
        minHeight: '48px',
      }}
    >
      <Grid xs={1.75}>
        <Stack alignItems='center' direction='row' spacing={1}>
          <Skeleton animation='wave' height={20} variant='circular' width={20} />
          <Skeleton animation='wave' height={24} variant='rounded' width='60%' />
        </Stack>
      </Grid>
      <Grid xs={1.75}>
        <Stack alignItems='center' direction='row' spacing={1}>
          <Skeleton animation='wave' height={20} variant='circular' width={20} />
          <Skeleton animation='wave' height={24} variant='rounded' width='60%' />
        </Stack>
      </Grid>
      <Grid xs={1.75}>
        <Stack alignItems='center' direction='row' spacing={1}>
          <Skeleton animation='wave' height={20} variant='circular' width={20} />
          <Skeleton animation='wave' height={24} variant='rounded' width='60%' />
        </Stack>
      </Grid>
      <Grid xs={1.75}>
        <Stack alignItems='center' direction='row' spacing={1}>
          <Skeleton animation='wave' height={20} variant='circular' width={20} />
          <Skeleton animation='wave' height={24} variant='rounded' width='60%' />
        </Stack>
      </Grid>
      <Grid xs={1.75}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Skeleton animation='wave' height={24} variant='rounded' width='80%' />
        </Box>
      </Grid>
      <Grid xs={1.5}>
        <Box sx={{ display: 'flex', justifyContent: 'center', px: 4 }}>
          <Skeleton animation='wave' height={24} variant='rounded' width='80%' />
        </Box>
      </Grid>
      <Grid xs={0.75}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Skeleton animation='wave' height={24} variant='rounded' width='60%' />
        </Box>
      </Grid>
      <Grid xs={1}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Skeleton animation='wave' height={24} variant='rounded' width='50%' />
        </Box>
      </Grid>
    </Grid>
  );

  return (
    <Stack direction='column' spacing={2} sx={{ pb: 10 }}>
      {/* Mobile: horizontally scrollable history */}
      <Box
        sx={{
          display: 'block',
          [theme.breakpoints.up('md')]: { display: 'none' },
        }}
      >
        <Paper elevation={1} sx={{ width: '100%', backgroundColor: 'rgba(10, 12, 24, 0.50)', backdropFilter: 'blur(8px)' }}>
          <Box sx={{ overflowX: 'auto', overflowY: 'visible' }}>
            <Box sx={{ minWidth: 980 }}>
              {renderHeader()}
              <Divider />
              <Box>
                {(() => {
                  if (loading) {
                    return (
                      <>
                        {Array.from({ length: currentPageSize || 10 }).map((_, index) => {
                          const uniqueKey = `dn-skeleton-${Math.random().toString(36).substr(2, 9)}-${index}`;
                          return (
                            <React.Fragment key={uniqueKey}>
                              {renderSkeletonRow(`dn-skeleton-row-${uniqueKey}`)}
                              {index < (currentPageSize || 10) - 1 && <Divider />}
                            </React.Fragment>
                          );
                        })}
                      </>
                    );
                  }
                  if (rows.length === 0) {
                    return (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                        <Typography color='text.secondary' variant='body2'>
                          No delta neutral orders found.
                        </Typography>
                      </Box>
                    );
                  }
                  return (
                    <>
                      {rows.map((r, index) => (
                        <React.Fragment key={r.id}>
                          {renderRow(r)}
                          {index < rows.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </>
                  );
                })()}
              </Box>
              <Divider />
              <Box alignItems='center' display='flex' justifyContent='flex-end' sx={{ p: 2 }}>
                <TablePagination
                  component='div'
                  count={typeof count === 'number' ? count : 0}
                  page={Math.max(0, (Number(currentPageNumber) || 1) - 1)}
                  rowsPerPage={Number(currentPageSize) || 10}
                  rowsPerPageOptions={[10, 25, 50, 100]}
                  onPageChange={(_, newPage) => {
                    setCurrentPageNumber(newPage + 1);
                  }}
                  onRowsPerPageChange={(event) => {
                    const newSize = parseInt(event.target.value, 10) || 10;
                    setCurrentPageSize(newSize);
                    setCurrentPageNumber(1);
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Desktop and larger */}
      <Box
        sx={{
          display: 'none',
          [theme.breakpoints.up('md')]: { display: 'block' },
        }}
      >
        <Paper elevation={1} sx={{ width: '100%', pb: 2, backgroundColor: 'rgba(10, 12, 24, 0.50)', backdropFilter: 'blur(8px)' }}>
          <Box sx={{ width: '100%' }}>
            {renderHeader()}
            <Divider />
            <Box>
              {(() => {
                if (loading) {
                  return (
                    <>
                      {Array.from({ length: currentPageSize || 10 }).map((_, index) => {
                        const uniqueKey = `dn-skeleton-${Math.random().toString(36).substr(2, 9)}-${index}`;
                        return (
                          <React.Fragment key={uniqueKey}>
                            {renderSkeletonRow(`dn-skeleton-row-${uniqueKey}`)}
                            {index < (currentPageSize || 10) - 1 && <Divider />}
                          </React.Fragment>
                        );
                      })}
                    </>
                  );
                }
                if (rows.length === 0) {
                  return (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                      <Typography color='text.secondary' variant='body2'>
                        No delta neutral orders found.
                      </Typography>
                    </Box>
                  );
                }
                return (
                  <>
                    {rows.map((r, index) => (
                      <React.Fragment key={r.id}>
                        {renderRow(r)}
                        {index < rows.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </>
                );
              })()}
            </Box>
            <Divider />
            <Box alignItems='center' display='flex' justifyContent='flex-end' sx={{ p: 2 }}>
              <TablePagination
                component='div'
                count={typeof count === 'number' ? count : 0}
                page={Math.max(0, (Number(currentPageNumber) || 1) - 1)}
                rowsPerPage={Number(currentPageSize) || 10}
                rowsPerPageOptions={[10, 25, 50, 100]}
                onPageChange={(_, newPage) => {
                  setCurrentPageNumber(newPage + 1);
                }}
                onRowsPerPageChange={(event) => {
                  const newSize = parseInt(event.target.value, 10) || 10;
                  setCurrentPageSize(newSize);
                  setCurrentPageNumber(1);
                }}
              />
            </Box>
          </Box>
        </Paper>
      </Box>
    </Stack>
  );
}
