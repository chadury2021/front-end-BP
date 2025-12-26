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
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import { TokenIcon } from '@/shared/components/Icons';
import { formatQty, msAndKs } from '@/util';
import { useTheme } from '@mui/material/styles';
import LabelTooltip, { TreadTooltip } from '@/shared/components/LabelTooltip';
import { formatGasFee } from '@/util/gasFeeUtils';
import {
  getUrgencyDisplayName,
  getSlippageForUrgency,
  formatUrgencyDisplay,
  getUrgencyKeyForTheme,
} from '@/util/urgencyUtils';
import ExitConditionBox from '@/shared/components/ExitConditionBox';
import { ModalContainer } from './OrderConfirmationModal';

function DexConfiguration({ urgency, autoOrderConfig }) {
  const theme = useTheme();

  return (
    <Stack direction='column' spacing={1}>
      <Typography variant='body1'>Configuration</Typography>
      <Stack direction='column' spacing={0.5}>
        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <Typography variant='small2'>Urgency</Typography>
          <Typography
            sx={{
              color: theme.palette.orderUrgency[getUrgencyKeyForTheme(urgency)] || theme.palette.primary.main,
              textDecoration: 'underline',
            }}
            variant='small2'
          >
            {getUrgencyDisplayName(urgency)}
          </Typography>
        </Stack>
        {autoOrderConfig?.slippage && (
          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <TreadTooltip labelTextVariant='small2' placement='left' variant='max_slippage' />
            <Typography variant='small2'>{`${autoOrderConfig.slippage}%`}</Typography>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}

function DexExitConditions({ exitConditions, autoOrderConfig }) {
  if (!exitConditions) {
    return null;
  }

  const { takeProfitExit, stopLossExit } = exitConditions;

  return (
    <Stack direction='column' spacing={2}>
      <Typography variant='body1'>Exit Conditions</Typography>
      <Stack direction='column' spacing={2}>
        {takeProfitExit && (
          <ExitConditionBox condition={takeProfitExit} type='takeProfit' urgency={takeProfitExit.urgency} />
        )}
        {stopLossExit && <ExitConditionBox condition={stopLossExit} type='stopLoss' urgency={stopLossExit.urgency} />}
      </Stack>
    </Stack>
  );
}

function DexQtyCard({ isBuySide, price, qty, token }) {
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
        <TokenIcon logoUrl={token.logo_url} style={{ height: '30px', width: '30px' }} tokenName={token.id || token} />
        <Stack alignItems='center' direction='column' spacing={0.5}>
          <Typography variant='body3'>
            {formatQty(qty)} {token.label || token.symbol || token}
          </Typography>

          <Typography color='text.secondary' variant='small2'>
            {price ? `~${formatQty(qty * price, true)} ` : '-'}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

function DexQtyArrow() {
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

function DexQtyComponent({ buyPrice, buyQty, buyToken, sellPrice, sellQty, sellToken }) {
  return (
    <Grid container spacing={1.5} sx={{ position: 'relative' }}>
      <Grid xs={6}>
        <DexQtyCard price={sellPrice} qty={sellQty} token={sellToken} />
      </Grid>
      <Grid xs={6}>
        <DexQtyCard isBuySide price={buyPrice} qty={buyQty} token={buyToken} />
      </Grid>
      <DexQtyArrow />
    </Grid>
  );
}

/* -------------------- Rate Row Component -------------------- */
function DexRateRow({ quote, quoteLoading, sellToken, buyToken }) {
  // Calculate exchange rate (buy per 1 sell)
  const computeRate = () => {
    if (!quote?.fromTokenAmount || !quote?.toTokenAmount) return null;
    if (Number(quote.fromTokenAmount) === 0) return null;
    return Number(quote.toTokenAmount) / Number(quote.fromTokenAmount);
  };

  // Format for large / small numbers
  const formatRateNode = (value) => {
    if (value === null || Number.isNaN(value)) return '-';
    const num = Number(value);
    if (!Number.isFinite(num)) return '∞';
    if (Math.abs(num) >= 1000) {
      return msAndKs(num, 2);
    }
    if (num >= 1) {
      return Number(num).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 5,
      });
    }
    let priceStr;
    if (num < 1e-10) priceStr = num.toFixed(15);
    else if (num < 1e-8) priceStr = num.toFixed(12);
    else if (num < 1e-6) priceStr = num.toFixed(10);
    else if (num < 1e-4) priceStr = num.toFixed(8);
    else if (num < 1e-2) priceStr = num.toFixed(6);
    else priceStr = num.toFixed(4);

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
  if (quoteLoading) {
    rateContent = '...';
  } else if (rate !== null && sellToken && buyToken) {
    const sellTokenLabel = sellToken?.label || sellToken?.symbol || sellToken;
    const buyTokenLabel = buyToken?.label || buyToken?.symbol || buyToken;
    rateContent = (
      <>
        {`1 ${sellTokenLabel} ≈ `}
        {formatRateNode(rate)}
        {` ${buyTokenLabel}`}
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

function DexOrderStats({ quote, quoteLoading, sellToken, buyToken }) {
  const theme = useTheme();

  /* --------------------- Rate / Inversion logic --------------------- */
  // Extract chain ID from either sell or buy token
  const getChainId = () => {
    if (sellToken?.id) {
      const [, chainId] = sellToken.id.split(':');
      return chainId;
    }
    if (buyToken?.id) {
      const [, chainId] = buyToken.id.split(':');
      return chainId;
    }
    return null;
  };

  const chainId = getChainId();
  const gasFeeInfo = formatGasFee(quote?.estimateGasFee, chainId);

  // Get estimated slippage value and determine color
  const estimatedSlippage = quote?.priceImpactPercentage ? parseFloat(quote.priceImpactPercentage) : null;
  const getEstimatedSlippageColor = () => {
    if (!estimatedSlippage) return 'inherit';
    // For DEX, negative slippage is good (green), positive is bad (red)
    if (estimatedSlippage < 0) return 'success.main';
    if (estimatedSlippage > 0) return 'error.main';
    return 'inherit';
  };

  return (
    <Box
      sx={{
        py: 2,
        px: 2,
        backgroundColor: `${theme.palette.common.pureBlack}4D`, // 30% opacity
        borderRadius: '8px',
        border: `1px solid ${theme.palette.grey[600]}`,
      }}
    >
      <Stack direction='column' spacing={1}>
        {/* Rate row moved to separate component */}

        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <TreadTooltip labelTextVariant='small2' placement='left' variant='estimated_slippage' />
          <Typography
            sx={{
              color: getEstimatedSlippageColor(),
            }}
            variant='small2'
          >
            {quoteLoading
              ? '...'
              : (quote?.priceImpactPercentage && `${parseFloat(quote.priceImpactPercentage)}%`) || '-'}
          </Typography>
        </Stack>
        <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <TreadTooltip labelTextVariant='small2' placement='left' variant='estimated_gas_fee' />
          <Stack alignItems='center' direction='row' spacing={1}>
            <Typography variant='small2'>
              {quoteLoading ? '...' : gasFeeInfo.formattedFee}
              {!quoteLoading && gasFeeInfo.formattedFee !== '-' && ` ${gasFeeInfo.networkSymbol}`}
            </Typography>
            {!quoteLoading && gasFeeInfo.networkIcon && (
              <img
                alt={`${gasFeeInfo.networkSymbol} icon`}
                src={gasFeeInfo.networkIcon}
                style={{ width: '16px', height: '16px', borderRadius: '50%' }}
              />
            )}
          </Stack>
        </Stack>
        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <TreadTooltip labelTextVariant='small2' placement='left' variant='trading_fee' />
          <Typography variant='small2'>
            {quoteLoading ? '...' : (quote?.tradeFee && `$${quote.tradeFee}`) || '-'}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

export function DexOrderConfirmationModal({ data, handleConfirm, open, setOpen, isSubmitted }) {
  const theme = useTheme();

  if (!data) {
    return null;
  }

  const {
    sellToken,
    buyToken,
    sellQty,
    buyQty,
    buyPrice,
    sellPrice,
    urgency,
    quote,
    autoOrderConfig,
    exitConditions,
    quoteLoading = false,
    autoLoading = false,
  } = data || {};

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
          backgroundColor: `${theme.palette.common.pureBlack}99`, // 60% opacity
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
                <DexQtyComponent
                  buyPrice={buyPrice}
                  buyQty={buyQty}
                  buyToken={buyToken}
                  sellPrice={sellPrice}
                  sellQty={sellQty}
                  sellToken={sellToken}
                />

                <DexRateRow buyToken={buyToken} quote={quote} quoteLoading={quoteLoading} sellToken={sellToken} />

                <DexOrderStats buyToken={buyToken} quote={quote} quoteLoading={quoteLoading} sellToken={sellToken} />

                <DexConfiguration autoOrderConfig={autoOrderConfig} urgency={urgency} />

                <DexExitConditions autoOrderConfig={autoOrderConfig} exitConditions={exitConditions} />
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
