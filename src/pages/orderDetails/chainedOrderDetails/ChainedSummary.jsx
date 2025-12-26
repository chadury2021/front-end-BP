import { useTheme } from '@emotion/react';
import { Box, Button, Divider, Stack, Table, TableBody, TableRow, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import React, { useState } from 'react';
import ScaleLoader from 'react-spinners/ScaleLoader';
import { cancelChainedOrder } from '../../../apiServices';
import CountdownTimer from '../../../shared/fields/CountdownTimer/CountdownTimer';
import ProgressBar from '../../../shared/fields/ProgressBar/ProgressBar';
import { BasicModal } from '../../../shared/Modal';
import { OrderInfo, OrderInfoTypography } from '../../../shared/orderDetail/OrderInfo';
import { StyledBenchmarkTableCell, StyledIBMTypography, formatDateTime } from '../../../shared/orderTable/util';
import { formatQty } from '../../../util';

// Utility to format duration in min(s), hr(s), or day(s) from seconds
function formatDuration(seconds) {
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(0)} min(s)`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(2)} hr(s)`;
  return `${(minutes / 1440).toFixed(2)} day(s)`;
}

// Utility to format time remaining with proper units
function formatTimeRemaining(seconds) {
  if (!seconds || seconds <= 0) {
    return '0 hours';
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min${minutes > 1 ? 's' : ''}`;
  }
  return `${minutes} min${minutes > 1 ? 's' : ''}`;
}

function ChainedSummaryRender({ orderSummaryData, ordersInChain, accountNames }) {
  const theme = useTheme();

  if (!orderSummaryData) {
    return (
      <Box alignItems='center' display='flex' height='100%' justifyContent='center'>
        <ScaleLoader color={theme.palette.text.primary} />
      </Box>
    );
  }

  const {
    id,
    executed_notional,
    time_start,
    alpha_tilt,
    status,
    notes,
    pov_limit,
    pov_target,
    strategy_params,
    order_condition_normal,
  } = orderSummaryData;

  let maxPriority = 1;
  let orderDuration = 0;
  let totalProgress = 0;
  let completedOrders = 0;
  let timeRemaining = 0;

  if (ordersInChain && ordersInChain.length > 0) {
    ordersInChain.forEach((order) => {
      if (order.priority && order.priority > maxPriority) {
        maxPriority = order.priority;
      }
      if (order) {
        orderDuration += order.duration || orderDuration;
      }
      // Calculate overall progress based on individual order completion
      if (order.pct_filled !== undefined && order.pct_filled !== null) {
        totalProgress += order.pct_filled;
        completedOrders += 1;
      }
    });
  }

  // Calculate average progress across all orders
  const overallProgress = completedOrders > 0 ? totalProgress / completedOrders : 0;

  // Calculate time remaining based on order duration and progress
  if (orderDuration > 0 && overallProgress > 0 && overallProgress < 100) {
    // Estimate time remaining based on progress and total duration
    const elapsedTime = (overallProgress / 100) * orderDuration;
    timeRemaining = Math.max(0, orderDuration - elapsedTime);
  } else if (orderDuration > 0 && overallProgress === 0) {
    // If no progress yet, use full duration
    timeRemaining = orderDuration;
  }

  return (
    <Stack direction='column' spacing={2}>
      <Grid container spacing={3}>
        <Grid xs={6}>
          <OrderInfoTypography header='Accounts' value={accountNames?.join(' | ') || 'No Account Data'} />
        </Grid>
        <Grid xs={6}>
          <OrderInfoTypography header='Time Start' value={formatDateTime(time_start)} />
        </Grid>
        <Grid xs={6}>
          <OrderInfoTypography header='Total Duration' value={formatDuration(orderDuration)} />
        </Grid>
        <Grid xs={6}>
          <OrderInfo header='Time Remaining'>
            {timeRemaining > 0 ? (
              <CountdownTimer
                timeRemaining={timeRemaining}
                onComplete={() => {
                  // Optionally handle when countdown reaches zero
                  console.log('Countdown completed');
                }}
              />
            ) : (
              '-'
            )}
          </OrderInfo>
        </Grid>
        <Grid xs={6}>
          <OrderInfoTypography header='Orders in Chain' value={maxPriority} />
        </Grid>
        <Grid xs={6}>
          <OrderInfoTypography
            header='Executed Notional'
            value={executed_notional ? formatQty(executed_notional, true) : '-'}
          />
        </Grid>
        {notes && (
          <Grid xs={6}>
            <OrderInfoTypography header='Notes' value={notes} />
          </Grid>
        )}
        {order_condition_normal && (
          <Grid xs={6}>
            <OrderInfoTypography header='Order Condition' value={order_condition_normal} />
          </Grid>
        )}
      </Grid>

      <Divider />

      {/* Progress Bar Section */}
      <Grid xs={12}>
        <OrderInfo header='Overall Progress'>
          <ProgressBar
            fullWidth
            barStyleOverride={{ height: '18px' }}
            containerStyleOverride={{
              width: '100%',
              height: '18px',
              marginTop: '8px',
            }}
            isPov={pov_limit || pov_target}
            orderStatus={orderSummaryData.status === 'CANCELED' ? 'CANCELED' : 'ACTIVE'}
            progress={Math.round(Number(overallProgress))}
          />
        </OrderInfo>
      </Grid>
    </Stack>
  );
}

function ChainedOrderActions({ ordersInChain, orderSummaryData, showAlert, loadOrderData }) {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalText, setConfirmModalText] = useState('');
  const [handleConfirm, setHandleConfirm] = useState(() => {});

  const { id, status } = orderSummaryData || {};
  const isPaused = status === 'PAUSED';

  const isTerminated =
    Array.isArray(ordersInChain) &&
    ordersInChain.length > 0 &&
    ordersInChain.every((order) => ['COMPLETE', 'CANCELED'].includes(order.status));

  const handleAction = async (action) => {
    setConfirmModalOpen(false);
    try {
      await action(id);
      loadOrderData(id);
    } catch (error) {
      showAlert({ message: error.message, severity: 'error' });
    }
  };

  return (
    <Box alignItems='center' display='flex' justifyContent='center' sx={{ width: '100%', height: '100%' }}>
      <Stack direction='row' spacing={1} sx={{ width: '100%', marginX: '8px' }}>
        <Button
          fullWidth
          color='error'
          disabled={isTerminated}
          variant='contained'
          onClick={() => {
            setConfirmModalText('Are you sure you want to cancel this order?');
            setHandleConfirm(() => () => handleAction(cancelChainedOrder));
            setConfirmModalOpen(true);
          }}
        >
          Cancel
        </Button>
      </Stack>
      <BasicModal
        confirmButtonText='Yes'
        handleConfirm={handleConfirm}
        message={confirmModalText}
        open={confirmModalOpen}
        setOpen={setConfirmModalOpen}
      />
    </Box>
  );
}

function ChainedOrderBenchmark({ benchmarkData, chainedOrderDetailView = false }) {
  const theme = useTheme();

  if (!benchmarkData || Object.keys(benchmarkData).length === 0) {
    return (
      <Box alignItems='center' display='flex' height='100%' justifyContent='center'>
        <ScaleLoader color={theme.palette.common.pureWhite} />
      </Box>
    );
  }

  const { arrival_cost, notional_exposure, vwap_cost, fee_notional } = benchmarkData;

  return (
    <Stack direction='column' spacing={2}>
      <Typography variant='h6'>Benchmarks</Typography>
      <Table>
        <TableBody>
          <TableRow>
            <StyledBenchmarkTableCell>Arrival</StyledBenchmarkTableCell>
            <StyledBenchmarkTableCell>
              <StyledIBMTypography
                color={arrival_cost > 0 ? theme.palette.charts.red : theme.palette.charts.green}
                style={{ textAlign: 'right' }}
              >
                {Number(arrival_cost).toFixed(6)} bps
              </StyledIBMTypography>
            </StyledBenchmarkTableCell>
          </TableRow>
          <TableRow>
            <StyledBenchmarkTableCell>VWAP</StyledBenchmarkTableCell>
            <StyledBenchmarkTableCell>
              <StyledIBMTypography
                color={vwap_cost > 0 ? theme.palette.charts.red : theme.palette.charts.green}
                style={{ textAlign: 'right' }}
              >
                {Number(vwap_cost).toFixed(6)} bps
              </StyledIBMTypography>
            </StyledBenchmarkTableCell>
          </TableRow>
          <TableRow>
            <StyledBenchmarkTableCell>Exchange Fee</StyledBenchmarkTableCell>
            <StyledBenchmarkTableCell>
              <StyledIBMTypography style={{ textAlign: 'right' }}>
                ${Number(fee_notional).toFixed(6)}
              </StyledIBMTypography>
            </StyledBenchmarkTableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Stack>
  );
}

export { ChainedOrderActions, ChainedOrderBenchmark, ChainedSummaryRender };
