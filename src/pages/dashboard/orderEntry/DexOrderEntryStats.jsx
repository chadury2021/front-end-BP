import React, { useState } from 'react';
import { Stack, Typography, Paper, Tooltip } from '@mui/material';
import { useTheme } from '@mui/system';
import { SwapHoriz } from '@mui/icons-material';
import DataComponent from '@/shared/DataComponent';
import EmptyBar from '@/shared/components/EmptyBar';
import LabelTooltip, { TreadTooltip } from '@/shared/components/LabelTooltip';
import { formatQty, msAndKs } from '@/util';
import { checkGasSufficiency } from '@/util/gasFeeUtils';
import { NATIVE_TOKENS } from '@/shared/dexUtils';

function DexOrderEntryStats({
  slippage,
  autoLoading,
  quoteLoading,
  isAdvanced,
  quote,
  gasFeeInfo,
  selectedChain,
  balances,
  selectedAccounts,
  accounts,
  sellState,
  buyState,
}) {
  const theme = useTheme();
  // Calculate total available gas balance across selected accounts
  const totalAvailableGas = selectedAccounts.reduce((total, accountName) => {
    const account = accounts[accountName];
    const balance = balances[account?.id];

    if (balance && balance.assets && selectedChain) {
      const nativeToken = balance.assets.find((asset) => {
        const nativeTokenAddress = NATIVE_TOKENS[selectedChain];
        if (!asset.symbol || !nativeTokenAddress) return false;

        const isNative =
          asset.symbol.toLowerCase() === nativeTokenAddress.toLowerCase() ||
          asset.symbol.toLowerCase() === `${nativeTokenAddress.toLowerCase()}:${selectedChain}`;

        return isNative;
      });

      return total + (nativeToken?.amount || 0);
    }
    return total;
  }, 0);

  // Check if gas is insufficient
  const gasSufficiency = checkGasSufficiency(quote?.estimateGasFee, totalAvailableGas, selectedChain);

  // Get estimated slippage value
  const estimatedSlippage = quote?.priceImpactPercentage ? parseFloat(quote.priceImpactPercentage) : null;

  // Determine color for estimated slippage
  const getEstimatedSlippageColor = () => {
    if (!estimatedSlippage) return 'inherit';
    // For DEX, negative slippage is good (green), positive is bad (red)
    if (estimatedSlippage < 0) return 'success.main';
    if (estimatedSlippage > 0) return 'error.main';
    return 'inherit';
  };

  // Check if max slippage is too low compared to estimated slippage
  const isMaxSlippageTooLow = () => {
    if (!slippage || !estimatedSlippage) return false;
    // Use absolute value for comparison since max slippage is always positive
    return slippage < Math.abs(estimatedSlippage);
  };

  // Exchange rate calculation: how much of buy token you receive for 1 unit of sell token
  const computeRate = () => {
    if (!quote?.fromTokenAmount || !quote?.toTokenAmount) return null;
    if (Number(quote.fromTokenAmount) === 0) return null;
    return Number(quote.toTokenAmount) / Number(quote.fromTokenAmount);
  };

  // Returns a React node with K/M/B/T formatting for large numbers and
  // subscript notation for very small decimals (e.g., 0.0₃123)
  const formatRateNode = (value) => {
    if (value === null || Number.isNaN(value)) return '-';
    const num = Number(value);
    if (!Number.isFinite(num)) return '∞';

    // Large numbers → use K/M/B/T
    if (Math.abs(num) >= 1000) {
      return msAndKs(num, 2);
    }

    // Between 1 and 999.999 → locale with 2–5 decimals
    if (num >= 1) {
      return Number(num).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 5,
      });
    }

    // num is between 0 and 1 → build a string with enough precision to detect leading zeros
    let priceStr;
    if (num < 1e-10) {
      priceStr = num.toFixed(15);
    } else if (num < 1e-8) {
      priceStr = num.toFixed(12);
    } else if (num < 1e-6) {
      priceStr = num.toFixed(10);
    } else if (num < 1e-4) {
      priceStr = num.toFixed(8);
    } else if (num < 1e-2) {
      priceStr = num.toFixed(6);
    } else {
      priceStr = num.toFixed(4);
    }

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
  const [isInverted, setIsInverted] = useState(false);

  const displayRate = () => {
    if (rate === null) return null;
    if (!isInverted) return rate;
    if (rate === 0) return null;
    return 1 / rate;
  };

  const leftTokenLabel = isInverted ? buyState?.token?.label : sellState?.token?.label;
  const rightTokenLabel = isInverted ? sellState?.token?.label : buyState?.token?.label;

  return (
    <Paper elevation={1} sx={{ py: 1, px: 2, bgcolor: theme.palette.background.card }}>
      <Stack direction='column' spacing={1}>
        <Stack alignItems='center' direction='row' spacing={1}>
          <SwapHoriz sx={{ fontSize: '1rem', color: 'text.secondary' }} />
          <Typography variant='body1Strong'>Pre-Trade Analytics</Typography>
        </Stack>

        {/* Exchange Rate */}
        <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography color='text.secondary' variant='small1'>
            Rate
          </Typography>
          <DataComponent isLoading={quoteLoading} loadingComponent={<EmptyBar />}>
            <Stack
              alignItems='flex-start'
              direction='row'
              sx={{ cursor: 'pointer' }}
              onClick={() => setIsInverted((prev) => !prev)}
            >
              <Typography component='div' variant='small1'>
                {displayRate() !== null && leftTokenLabel && rightTokenLabel ? (
                  <>
                    {`1 ${leftTokenLabel} ≈ `}
                    {formatRateNode(displayRate())}
                    {` ${rightTokenLabel}`}
                  </>
                ) : (
                  '-'
                )}
              </Typography>
              <SwapHoriz sx={{ fontSize: '1rem', color: 'text.secondary' }} />
            </Stack>
          </DataComponent>
        </Stack>

        {!isAdvanced && (
          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <TreadTooltip labelTextVariant='small1' placement='left' variant='max_slippage' />
            <DataComponent isLoading={autoLoading} loadingComponent={<EmptyBar />}>
              <Tooltip
                placement='top'
                title={
                  isMaxSlippageTooLow()
                    ? 'Max slippage is too low compared to estimated slippage. Increase urgency to allow higher slippage.'
                    : ''
                }
              >
                <Typography
                  sx={{
                    color: isMaxSlippageTooLow() ? 'error.main' : 'inherit',
                  }}
                  variant='small1'
                >
                  {slippage ? `${slippage.toFixed(2)}%` : '-'}
                </Typography>
              </Tooltip>
            </DataComponent>
          </Stack>
        )}
        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <TreadTooltip labelTextVariant='small1' placement='left' variant='estimated_slippage' />
          <DataComponent isLoading={quoteLoading} loadingComponent={<EmptyBar />}>
            <Typography
              sx={{
                color: getEstimatedSlippageColor(),
              }}
              variant='small1'
            >
              {(quote?.priceImpactPercentage && `${parseFloat(quote.priceImpactPercentage)}%`) || '-'}
            </Typography>
          </DataComponent>
        </Stack>
        <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <TreadTooltip labelTextVariant='small1' placement='left' variant='estimated_gas_fee' />
          <DataComponent isLoading={quoteLoading} loadingComponent={<EmptyBar />}>
            <Stack alignItems='center' direction='row' spacing={1}>
              <Tooltip placement='top' title={gasSufficiency.isInsufficient ? 'Insufficient gas' : ''}>
                <Typography
                  sx={{
                    color: gasSufficiency.isInsufficient ? 'error.main' : 'inherit',
                  }}
                  variant='small1'
                >
                  {gasFeeInfo.formattedFee}
                  {gasFeeInfo.formattedFee !== '-' && ` ${gasFeeInfo.networkSymbol}`}
                </Typography>
              </Tooltip>
              {gasFeeInfo.networkIcon && (
                <img
                  alt={`${gasFeeInfo.networkSymbol} icon`}
                  src={gasFeeInfo.networkIcon}
                  style={{ width: '14px', height: '14px', borderRadius: '50%' }}
                />
              )}
            </Stack>
          </DataComponent>
        </Stack>
        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <TreadTooltip labelTextVariant='small1' placement='left' variant='trading_fee' />
          <DataComponent isLoading={quoteLoading} loadingComponent={<EmptyBar />}>
            <Typography variant='small1'>{(quote?.tradeFee && `$${formatQty(quote.tradeFee)}`) || '-'}</Typography>
          </DataComponent>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default DexOrderEntryStats;
