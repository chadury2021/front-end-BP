import React from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
  CircularProgress,
  GlobalStyles,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import CloseIcon from '@mui/icons-material/Close';
import EastIcon from '@mui/icons-material/East';
import { TokenIcon } from '@/shared/components/Icons';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { smartRound, formatQty, msAndKs } from '@/util';
import { useTheme } from '@mui/material/styles';
import { useInitialLoadData } from '@/shared/context/InitialLoadDataProvider';
import { ModalContainer } from './OrderConfirmationModal';

function Configuration({ duration, urgency, strategy, autoOrderMetadata }) {
  const theme = useTheme();
  const isMarket = strategy === 'Market';
  const isAuto = Object.keys(autoOrderMetadata || {}).length > 0;

  return (
    <Stack direction='column' spacing={1}>
      <Typography variant='body1'>Configuration</Typography>
      <Stack direction='column' spacing={0.5}>
        {!isMarket && (
          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <Typography variant='small2'>Duration</Typography>
            <Typography variant='small2'>{`${smartRound(duration / 60, 2)} mins`}</Typography>
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
          <Typography variant='small2'>{strategy}</Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}

function QtyCard({ isBuySide, qty, asset }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        px: 3,
        py: 3,
        backgroundColor: `${theme.palette.common.pureBlack}4D`, // 30% opacity
        borderRadius: '8px',
        border: `1px solid ${theme.palette.grey[600]}`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Stack alignItems='center' direction='column' spacing={3}>
        <Typography variant='body3Strong'>{isBuySide ? 'Buy' : 'Sell'} Amount</Typography>
        <TokenIcon style={{ height: '30px', width: '30px' }} tokenName={asset} />
        <Typography variant='body3'>
          {formatQty(qty)} {asset}
        </Typography>
      </Stack>
    </Box>
  );
}

function QtyArrow() {
  const theme = useTheme();
  return (
    <Box
      sx={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '40px',
        height: '40px',
        backgroundColor: 'var(--background-paper)',
        border: `1px solid ${theme.palette.grey[600]}`,
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
      }}
    >
      <EastIcon sx={{ color: 'var(--text-primary)', fontSize: '20px' }} />
    </Box>
  );
}

function QtyComponent({ buyAsset, sellAsset, buyQty, sellQty }) {
  return (
    <Grid container spacing={1.5} sx={{ position: 'relative' }}>
      <Grid xs={6}>
        <QtyCard asset={sellAsset} qty={sellQty} />
      </Grid>
      <Grid xs={6}>
        <QtyCard isBuySide asset={buyAsset} qty={buyQty} />
      </Grid>
      <QtyArrow />
    </Grid>
  );
}

/* -------------------- Rate Row Component for CEX -------------------- */
function CexRateRow({ sellAsset, buyAsset, sellQty, buyQty, pair }) {
  // Calculate exchange rate (buy per 1 sell) using pair quantities
  const computeRate = () => {
    if (!sellQty || !buyQty) return null;
    if (Number(sellQty) === 0) return null;
    return Number(buyQty) / Number(sellQty);
  };

  // Format for large / small numbers (same logic as DEX)
  const formatRateNode = (value) => {
    if (value === null || Number.isNaN(value)) return '-';
    const num = Number(value);
    if (!Number.isFinite(num)) return '∞';

    // Large numbers (≥1000) use K/M/B formatting
    if (Math.abs(num) >= 1000) {
      return msAndKs(num, 2);
    }

    // Numbers ≥1 use standard formatting
    if (num >= 1) {
      return Number(num).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 5,
      });
    }

    // Small numbers (<1) use scientific notation with subscript
    let priceStr;
    if (num < 1e-10) priceStr = num.toFixed(15);
    else if (num < 1e-8) priceStr = num.toFixed(12);
    else if (num < 1e-6) priceStr = num.toFixed(10);
    else if (num < 1e-4) priceStr = num.toFixed(8);
    else if (num < 1e-2) priceStr = num.toFixed(6);
    else priceStr = num.toFixed(4);

    // Convert trailing zeros to subscript notation (e.g., 0.0₃123)
    const match = priceStr.match(/^(\d*)\.(0{2,})([1-9]\d*)$/);
    if (match) {
      const [, intPart, zeros, rest] = match;
      return (
        <>
          {intPart}.0
          <sub style={{ fontSize: '0.7em', verticalAlign: 'sub', opacity: 0.7 }}>{zeros.length}</sub>
          {rest}
        </>
      );
    }
    return priceStr;
  };

  const rate = computeRate();

  let rateContent;
  if (rate !== null && sellAsset && buyAsset) {
    const sellAssetLabel = sellAsset;
    const buyAssetLabel = buyAsset;
    rateContent = (
      <>
        {`1 ${sellAssetLabel} ≈ `}
        {formatRateNode(rate)}
        {` ${buyAssetLabel}`}
      </>
    );
  } else {
    rateContent = '-';
  }

  return (
    <Box sx={{ pt: 6 }}>
      <Stack
        direction='row'
        spacing={1}
        sx={{ alignItems: 'flex-start', justifyContent: 'center', alignSelf: 'center', width: '100%' }}
      >
        <Typography color='text.secondary' variant='small2'>
          Rate
        </Typography>
        <Typography component='div' variant='small2'>
          {rateContent}
        </Typography>
      </Stack>
    </Box>
  );
}

export function SimpleOrderConfirmationModal({ props }) {
  const theme = useTheme();
  const { data, handleConfirm, open, setOpen, isSubmitted } = props;
  const { initialLoadValue, convertedQty } = useOrderForm();
  const { getAutoOrderUrgency } = useInitialLoadData();
  const { trajectories, strategies } = initialLoadValue;
  const {
    side,
    pair,
    quote_asset_qty,
    base_asset_qty,
    duration,
    auto_order_metadata,
    super_strategy: selectedStrategy,
    strategy: trajectory,
  } = data;

  const urgency = getAutoOrderUrgency(auto_order_metadata?.urgency);

  // Strategy/Trajectory
  let strategy = strategies[selectedStrategy];
  const isSimple = !strategy?.is_super_strategy;
  let traj = trajectories[trajectory];
  if (isSimple) {
    // If simple order, strategy is listed as the trajectory
    strategy = traj;
    traj = null;
  }

  // sort out sell and buy sides
  const baseQty = base_asset_qty || convertedQty;
  const quoteQty = quote_asset_qty || convertedQty;
  const [base, quote] = pair.split('-');
  const isBuySide = side === 'buy';
  const buyAsset = isBuySide ? base : quote;
  const sellAsset = isBuySide ? quote : base;
  const buyQty = isBuySide ? baseQty : quoteQty;
  const sellQty = isBuySide ? quoteQty : baseQty;

  return (
    <>
      <GlobalStyles
        styles={{
          '@keyframes holographic-shimmer': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
          },
        }}
      />
      <ModalContainer
        open={open}
        setOpen={setOpen}
        sx={{
          width: '90%',
          maxWidth: '500px',
          backgroundColor: theme.palette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          borderRadius: '8px',
          overflow: 'hidden',
          border: `1px solid ${theme.palette.grey[600]}`,
          boxShadow: `0 8px 32px ${theme.palette.common.pureBlack}4D`, // 30% opacity
          outline: 'none',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            backgroundColor: 'transparent',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Stack direction='column' sx={{ height: '100%', minHeight: 0 }}>
            {/* Header */}
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', backgroundColor: 'transparent' }}>
              <Stack alignItems='center' direction='row' justifyContent='space-between'>
                <Typography variant='h6'>Order Confirmation</Typography>
                <IconButton aria-label='Close' sx={{ color: 'var(--text-primary)' }} onClick={() => setOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </Box>

            {/* Content */}
            <Box
              sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 3, backgroundColor: 'transparent' }}
            >
              <Stack direction='column' spacing={3}>
                <QtyComponent buyAsset={buyAsset} buyQty={buyQty} sellAsset={sellAsset} sellQty={sellQty} />
                <CexRateRow buyAsset={buyAsset} buyQty={buyQty} pair={pair} sellAsset={sellAsset} sellQty={sellQty} />
                <Configuration
                  autoOrderMetadata={auto_order_metadata}
                  duration={duration}
                  strategy={strategy?.name}
                  urgency={urgency}
                />
              </Stack>
            </Box>

            {/* Bottom Bar */}
            <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', backgroundColor: 'transparent' }}>
              <Button
                fullWidth
                color='success'
                disabled={isSubmitted}
                startIcon={isSubmitted ? <CircularProgress size={20} /> : null}
                sx={{
                  height: '48px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
                variant='contained'
                onClick={handleConfirm}
              >
                <Typography color='text.offBlack' variant='button2'>
                  {isSubmitted ? 'Processing...' : 'Confirm Order'}
                </Typography>
              </Button>
            </Box>
          </Stack>
        </Paper>
      </ModalContainer>
    </>
  );
}
