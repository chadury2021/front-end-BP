import React, { useCallback, useState, useContext } from 'react';
import { Box, Button, Divider, IconButton, Paper, Stack, Typography, LinearProgress, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import CheckIcon from '@mui/icons-material/Check';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ProgressBar from '@/shared/fields/ProgressBar/ProgressBar';
import { smartRound, formatQty } from '@/util';
import { renderBalanceWithSubscript } from '@/util/priceFormatting';
import { BasicModal } from '@/shared/Modal';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { submitCancel } from '@/apiServices';
import { useInitialLoadData } from '@/shared/context/InitialLoadDataProvider';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { useOrderData } from './hooks/useOrderData';
import { ModalContainer } from './OrderConfirmationModal';

function Configuration({ targetQty, targetToken, duration, urgency, strategy, autoOrderMetadata }) {
  const theme = useTheme();
  const isAuto = Object.keys(autoOrderMetadata || {}).length > 0;

  return (
    <Stack direction='column' spacing={2}>
      <Typography variant='body1'>Configuration</Typography>
      <Stack direction='column' spacing={0.5}>
        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <Typography variant='small2'>Target Quantity</Typography>
          <Typography variant='small2'>{targetQty ? `${formatQty(targetQty)} ${targetToken}` : '-'}</Typography>
        </Stack>
        {strategy !== 'Market' && (
          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <Typography variant='small2'>Duration</Typography>
            <Typography variant='small2'>{duration ? `${smartRound(duration / 60, 2)} mins` : '-'}</Typography>
          </Stack>
        )}
        {isAuto && (
          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <Typography variant='small2'>Urgency</Typography>
            <Typography
              sx={{
                color: theme.palette.orderUrgency[urgency?.key],
                textDecoration: 'underline',
              }}
              variant='small2'
            >
              {urgency?.name}
            </Typography>
          </Stack>
        )}
        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <Typography variant='small2'>Strategy</Typography>
          <Typography variant='small2'>{strategy || '-'}</Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}

function OrderStep({ label, state, Icon }) {
  const theme = useTheme();
  let borderProps = {};
  if (state === 'progress') {
    borderProps = {
      border: '3px solid transparent',
      borderTop: `3px solid ${theme.palette.primary.main}`,
      borderRight: `3px solid ${theme.palette.primary.main}`,
      animation: 'spin 1s linear infinite',
      '@keyframes spin': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
      },
    };
  } else if (state === 'complete') {
    borderProps = {
      border: '3px solid',
      borderColor: 'success.main',
    };
  } else {
    borderProps = {};
  }

  return (
    <Stack alignItems='center' direction='column' spacing={1.5} sx={{ px: 3 }}>
      <Box
        sx={{
          p: '15px',
          height: '40px',
          width: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--background-paper)',
            borderRadius: '50%',
            ...borderProps,
          }}
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          {state === 'complete' ? (
            <CheckIcon fontSize='large' sx={{ color: 'success.main' }} />
          ) : (
            <Icon fontSize='large' />
          )}
        </Box>
      </Box>
      <Typography sx={{ textAlign: 'center' }} variant='body1'>
        {label}
      </Typography>
    </Stack>
  );
}

function OrderLoadingBar({ progress, first }) {
  const left = first ? '122px' : '245px';
  const color = progress === 100 ? 'success.main' : '';
  return (
    <Box sx={{ position: 'absolute', top: '45px', left, transform: 'translate(-50%, -50%)' }}>
      <LinearProgress
        sx={{
          height: '2px',
          width: '24px',
          backgroundColor: 'var(--background-paper)',
          '& .MuiLinearProgress-bar': {
            backgroundColor: color,
          },
        }}
        value={progress}
        variant='determinate'
      />
    </Box>
  );
}

function OrderProgress({ orderActive, orderEnded, orderData }) {
  let creatingState;
  let firstProgress;
  let fillingState;
  let secondProgress;
  let completeState;

  if (orderEnded) {
    // Order is complete, show all steps as complete
    creatingState = 'complete';
    firstProgress = 100;
    fillingState = 'complete';
    secondProgress = 100;
    completeState = 'complete';
  } else if (orderActive) {
    // Order is active, show progress through steps
    creatingState = 'complete';
    firstProgress = 100;
    fillingState = 'progress';
    secondProgress = 50;
    completeState = 'pending';
  } else {
    // Order is not active and not ended - check if it's in SUBMITTED state
    const orderStatus = orderData?.order_summary?.status;
    if (orderStatus === 'COMPLETE') {
      // Order completed immediately without going through ACTIVE state
      creatingState = 'complete';
      firstProgress = 100;
      fillingState = 'complete';
      secondProgress = 100;
      completeState = 'complete';
    } else {
      // Order is still in initial submission
      creatingState = 'progress';
      firstProgress = 50;
      fillingState = 'pending';
      secondProgress = 0;
      completeState = 'pending';
    }
  }

  return (
    <Paper elevation={2} sx={{ py: 3 }}>
      <Grid container spacing={4} sx={{ position: 'relative' }}>
        <Grid item xs={4}>
          <OrderStep Icon={SendIcon} label='Submitting Order' state={creatingState} />
          <OrderLoadingBar first progress={firstProgress} />
        </Grid>
        <Grid item xs={4}>
          <OrderStep Icon={AddIcon} label='Filling Order' state={fillingState} />
          <OrderLoadingBar progress={secondProgress} />
        </Grid>
        <Grid item xs={4}>
          <OrderStep Icon={OutlinedFlagIcon} label='Order Complete' state={completeState} />
        </Grid>
      </Grid>
    </Paper>
  );
}

export function SimpleOrderExecutionModal({ orderId, handleClose }) {
  const [open, setOpen] = useState(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const { showAlert } = useContext(ErrorContext);

  const { orderData } = useOrderData(orderId);
  const { order_summary, order_ended: orderEnded, benchmark } = orderData;
  const {
    duration,
    super_strategy: strategy,
    auto_order_metadata: autoOrderMetadata,
    pct_filled: pctFilled,
    is_active: orderActive,
    target_order_qty: targetQty,
    target_token: targetToken,
    fill_role_breakdown: fillRoleBreakdown,
    unique_venues = [],
  } = order_summary;

  const { arrival_price, arrival_cost, price_impact_percentage } = benchmark;
  const isDexOrder = Array.isArray(unique_venues) && unique_venues.some((venue) => venue.includes('OKXDEX'));
  const { getAutoOrderUrgency } = useInitialLoadData();
  const urgency = getAutoOrderUrgency(autoOrderMetadata?.urgency);

  const handleCloseCallback = () => {
    setOpen(false);
    handleClose();
  };

  const handleViewOrderDetails = useCallback(() => {
    window.open(`/order/${orderId}`, '_blank', 'noopener,noreferrer');
  }, [orderId]);

  const handleCancelOrder = async () => {
    setConfirmModalOpen(false);
    try {
      await submitCancel(orderId);
      showAlert({
        severity: 'success',
        message: 'Successfully canceled the order.',
      });
      handleCloseCallback();
    } catch (e) {
      showAlert({
        severity: 'error',
        message: e.message || 'Failed to cancel the order.',
      });
    }
  };

  return (
    <ModalContainer open={open} setOpen={handleCloseCallback} sx={{ width: '400px' }}>
      <Paper elevation={0}>
        <Stack direction='column'>
          <Stack alignItems='center' direction='row' justifyContent='space-between' sx={{ pl: 6, pr: 2, py: 4 }}>
            <Typography variant='h6'>Order Execution</Typography>
            <IconButton aria-label='Close' onClick={handleCloseCallback}>
              <CloseIcon fontSize='small' />
            </IconButton>
          </Stack>
          <Divider sx={{ borderColor: 'var(--text-primary)' }} />
          <Stack direction='column' spacing={4} sx={{ py: 5 }}>
            <Stack direction='column' spacing={2} sx={{ px: 6 }}>
              <OrderProgress orderActive={orderActive} orderData={orderData} orderEnded={orderEnded} />
              <Configuration
                autoOrderMetadata={autoOrderMetadata}
                duration={duration}
                strategy={strategy}
                targetQty={targetQty}
                targetToken={targetToken}
                urgency={urgency}
              />
            </Stack>
            <Stack direction='column' spacing={2} sx={{ px: 5 }}>
              <Typography variant='small1'>Fill Percentage</Typography>
              <ProgressBar
                fullWidth
                barStyleOverride={{ height: '30px' }}
                containerStyleOverride={{
                  width: '100%',
                  height: '30px',
                  borderRadius: '10px',
                }}
                orderStatus='ACTIVE'
                progress={Math.round(Number(pctFilled || 0))}
              />
            </Stack>
            <Stack direction='row' spacing={2} sx={{ px: 6, justifyContent: 'space-between' }}>
              <Paper sx={{ width: '100%', px: 2, py: 1 }}>
                <Stack direction='column' spacing={1}>
                  <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
                    <Typography variant='body2'>Avg Entry Price</Typography>
                    <Typography variant='body2'>
                      {arrival_price ? renderBalanceWithSubscript(arrival_price) : '-'}
                    </Typography>
                  </Stack>
                  <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
                    <Typography variant='body2'>Slippage</Typography>
                    <Typography
                      sx={{
                        color: (() => {
                          if (isDexOrder) {
                            return price_impact_percentage > 0 ? 'error.main' : 'success.main';
                          }
                          return arrival_cost > 0 ? 'error.main' : 'success.main';
                        })(),
                      }}
                      variant='body2'
                    >
                      {(() => {
                        if (isDexOrder) {
                          return price_impact_percentage ? `${smartRound(price_impact_percentage, 2)}%` : '-';
                        }
                        return arrival_cost ? `${smartRound(arrival_cost, 2)} bps` : '-';
                      })()}
                    </Typography>
                  </Stack>
                  <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
                    <Typography variant='body2'>Fill Quality</Typography>
                    <Stack direction='row' spacing={0.5}>
                      {Object.entries(fillRoleBreakdown || {}).map(([role, value], i) => (
                        <React.Fragment key={role}>
                          {i !== 0 && <Typography variant='body2'>/</Typography>}
                          <Typography
                            sx={{
                              color: role === 'MAKE' ? 'success.main' : 'error.main',
                            }}
                            variant='body2'
                          >
                            {Number(value).toFixed(0)}% {role === 'MAKE' ? 'Maker' : 'Taker'}
                          </Typography>
                        </React.Fragment>
                      ))}
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>

            <Stack direction='row' spacing={2} sx={{ px: 6 }}>
              <Button fullWidth sx={{ height: '40px' }} variant='outlined' onClick={handleViewOrderDetails}>
                Order Details
              </Button>
              <Button
                fullWidth
                aria-label='cancel'
                color='error'
                disabled={!orderActive}
                size='small'
                startIcon={<CancelOutlinedIcon />}
                sx={{ height: '40px' }}
                variant='outlined'
                onClick={() => setConfirmModalOpen(true)}
              >
                <Typography variant='button1'>Cancel</Typography>
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
      <BasicModal
        confirmButtonText='Yes'
        handleConfirm={handleCancelOrder}
        message='Are you sure you want to cancel this order?'
        open={confirmModalOpen}
        setOpen={setConfirmModalOpen}
      />
    </ModalContainer>
  );
}
