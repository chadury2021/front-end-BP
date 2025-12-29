import React, { useMemo, useState } from 'react';
import { Alert, Paper, Stack, Typography, Skeleton, IconButton, Tooltip } from '@mui/material';
import { Analytics } from '@mui/icons-material';
import SyncIcon from '@mui/icons-material/Sync';
import { useTheme, keyframes } from '@emotion/react';
import LabelTooltip from '@/shared/components/LabelTooltip';
import { StyledIBMTypography } from '@/shared/orderTable/util';
import { formatQty } from '@/util';
import { refreshAllAccountBalanceCache } from '@/apiServices';

export default function MarketMakerPreTradeAnalytics({
  amount,
  estimatedFees,
  isSpot,
  exposureTolerance,
  availableMargin,
  baseAvailableMargin,
  inventory,
  leverage,
  isLoading = false,
  mode = 'normal', // Mode determines slippage: aggressive (10bps), normal (3bps), passive (1bps)
  directionalBias = 0,
}) {
  const theme = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Define the rotation animation
  const rotate = keyframes`
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  `;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAllAccountBalanceCache();
    } catch (error) {
      // Silently fail - the UI will show the existing balance
    } finally {
      // Keep spinning for a bit to indicate it's working
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  };

  const numericAmount = useMemo(() => {
    const n = parseFloat(String(amount || '').replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }, [amount]);

  const currentLeverage = leverage?.leverage || null;

  const leverageDisplay = useMemo(() => {
    const numeric = Number(currentLeverage);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return null;
    }
    const formatted = Number.isInteger(numeric) ? numeric.toFixed(0) : numeric.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted}x`;
  }, [currentLeverage]);

  // Dynamic safety buffer based on mode: aggressive (2x), normal (1x), passive (0.5x)
  const safetyBuffer = useMemo(() => {
    const safetyBufferByMode = {
      aggressive: 2.0,
      normal: 1.0,
      passive: 0.5,
      grid: 4.0, // 2x of aggressive (2.0 * 2)
    };
    return safetyBufferByMode[mode] || 1.0; // Default to normal (1x)
  }, [mode]);

  // Dynamic slippage based on mode: aggressive (10bps), normal (3bps), passive (1bps)
  const slippageBps = useMemo(() => {
    const slippageBpsByMode = {
      aggressive: 10,
      normal: 3,
      passive: 1,
    };
    return slippageBpsByMode[mode] || 3; // Default to normal (3bps)
  }, [mode]);

  // Calculate slippage cost based on mode
  const slippageCost = useMemo(() => {
    if (!numericAmount) return null;
    const cost = numericAmount * (slippageBps / 10000);
    // For grid mode, floor PnL Est at 0 (it can never go negative)
    if (mode === 'grid') {
      return Math.max(0, cost);
    }
    return cost;
  }, [numericAmount, slippageBps, mode]);

  // Calculate total estimated fees range (fee budget ± slippage)
  const totalEstimatedFeesRange = useMemo(() => {
    const numericFees = parseFloat(String(estimatedFees || '').replace(/,/g, ''));
    if (!numericFees || !slippageCost) return null;
    return {
      min: numericFees - slippageCost,
      max: numericFees + slippageCost,
    };
  }, [estimatedFees, slippageCost]);

  const recommendedMargin = useMemo(() => {
    if (!numericAmount) return null;

    // For long/short bias (non-zero directional bias), use fixed calculation across all modes
    if (directionalBias !== 0) {
      const baseMargin = 0.06 * numericAmount * 1.5;
      // For grid mode, use 2x the recommended inventory
      return mode === 'grid' ? baseMargin * 2 : baseMargin;
    }

    let baseMargin;

    // Spot: exposure * notional target
    if (isSpot) {
      const tol = Number(exposureTolerance ?? 0.06);
      baseMargin = numericAmount * tol;
    } else {
      // Derivatives: notional / leverage with safety buffer
      if (!currentLeverage) return null;
      baseMargin = (numericAmount / currentLeverage) * safetyBuffer;
    }

    // For grid mode, use 2x the recommended inventory
    return mode === 'grid' ? baseMargin * 2 : baseMargin;
  }, [numericAmount, currentLeverage, isSpot, exposureTolerance, safetyBuffer, directionalBias, mode]);

  const recommendedMarginColor = useMemo(() => {
    // Compare recommended inventory to actual inventory (asset balance)
    let inventoryForComparison = inventory;
    if (inventoryForComparison == null) {
      inventoryForComparison = baseAvailableMargin != null ? baseAvailableMargin : availableMargin;
    }
    if (!recommendedMargin || inventoryForComparison == null) return 'text.secondary';

    if (recommendedMargin < inventoryForComparison) {
      return 'success.main'; // Green
    }
    if (recommendedMargin <= inventoryForComparison * 5) {
      return 'warning.main'; // Orange
    }
    return 'error.main'; // Red
  }, [recommendedMargin, inventory, baseAvailableMargin, availableMargin]);

  return (
    <Paper elevation={1} sx={{ pt: 1, pb: 1, px: 2, backgroundColor: 'transparent', backdropFilter: 'blur(5px)' }}>
      <Stack direction='column' spacing={1}>
        <Stack alignItems='center' direction='row' spacing={1}>
          <Analytics sx={{ fontSize: '1rem', color: 'text.secondary' }} />
          <Typography variant='body1'>Pre-Trade Analytics</Typography>
        </Stack>

        <Stack direction='column' spacing={1}>
          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <Stack alignItems='center' direction='row' spacing={0.5}>
              <LabelTooltip
                label={`Inventory${leverageDisplay ? ` (${leverageDisplay})` : ''}`}
                link=''
                placement='left'
                title={
                  <div>
                    <Typography sx={{ marginBottom: 1.5 }}>
                      Quote-asset inventory available to open new positions.
                    </Typography>
                    <Typography color='text.secondary' variant='body2'>
                      Falls back to wallet balance when margin balance is unavailable.
                    </Typography>
                  </div>
                }
              />
              <Tooltip title='Refresh account balance'>
                <IconButton disabled={isRefreshing} size='small' sx={{ p: 0.5 }} onClick={handleRefresh}>
                  <SyncIcon
                    sx={{
                      fontSize: '0.875rem',
                      color: theme.palette.primary.main,
                      animation: isRefreshing ? `${rotate} 1s linear infinite` : 'none',
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Stack>
            {isLoading ? (
              <Skeleton height={20} variant='rectangular' width={80} />
            ) : (
              <StyledIBMTypography
                color={availableMargin != null ? 'text.primary' : 'text.secondary'}
                style={{ display: 'inline' }}
                variant='body2'
              >
                {availableMargin != null ? formatQty(availableMargin, true) : '-'}
              </StyledIBMTypography>
            )}
          </Stack>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Available Margin'
              link=''
              placement='left'
              title={
                <div>
                  <Typography sx={{ marginBottom: 1.5 }}>
                    Pre-leverage available margin balance for the selected account and pair.
                  </Typography>
                </div>
              }
            />
            {isLoading ? (
              <Skeleton height={20} variant='rectangular' width={80} />
            ) : (
              <StyledIBMTypography
                color={baseAvailableMargin != null ? 'text.primary' : 'text.secondary'}
                style={{ display: 'inline' }}
                variant='body2'
              >
                {baseAvailableMargin != null ? formatQty(baseAvailableMargin, true) : '-'}
              </StyledIBMTypography>
            )}
          </Stack>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Recommended Inventory'
              link=''
              placement='left'
              title={
                <div>
                  <Typography sx={{ marginBottom: 1.5 }}>
                    Heuristic: notional ÷ leverage × {safetyBuffer.toFixed(2)} buffer. Adjust if liquidation buffer is
                    low.
                  </Typography>
                </div>
              }
            />
            {isLoading ? (
              <Skeleton height={20} variant='rectangular' width={80} />
            ) : (
              <StyledIBMTypography color={recommendedMarginColor} style={{ display: 'inline' }}>
                {recommendedMargin ? formatQty(recommendedMargin, true) : '-'}
              </StyledIBMTypography>
            )}
          </Stack>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Exchange Fees'
              link=''
              placement='left'
              title={
                <div>
                  <Typography sx={{ marginBottom: 1.5 }}>Budget for builder + maker fees.</Typography>
                </div>
              }
            />
            {isLoading ? (
              <Skeleton height={20} variant='rectangular' width={80} />
            ) : (
              <StyledIBMTypography
                color={estimatedFees ? 'text.primary' : 'text.secondary'}
                style={{ display: 'inline' }}
              >
                {estimatedFees
                  ? (() => {
                      const value = parseFloat(String(estimatedFees).replace(/,/g, ''));
                      return value < 0 ? `-$${Math.abs(value).toFixed(2)}` : `$${value.toFixed(2)}`;
                    })()
                  : '-'}
              </StyledIBMTypography>
            )}
          </Stack>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='PnL Est.'
              link=''
              placement='left'
              title={
                <div>
                  <Typography sx={{ marginBottom: 1.5 }}>
                    Conservative estimate of {slippageBps} basis points slippage cost.
                  </Typography>
                </div>
              }
            />
            {isLoading ? (
              <Skeleton height={20} variant='rectangular' width={80} />
            ) : (
              <StyledIBMTypography
                color={slippageCost ? 'text.primary' : 'text.secondary'}
                style={{ display: 'inline' }}
              >
                {slippageCost ? `±$${slippageCost.toFixed(2)}` : '-'}
              </StyledIBMTypography>
            )}
          </Stack>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Total Est. Fees'
              link=''
              placement='left'
              title={
                <div>
                  <Typography sx={{ marginBottom: 1.5 }}>
                    Total estimated fees including exchange fees and slippage.
                  </Typography>
                </div>
              }
            />
            {isLoading ? (
              <Skeleton height={20} variant='rectangular' width={100} />
            ) : (
              <StyledIBMTypography
                color={totalEstimatedFeesRange ? 'text.primary' : 'text.secondary'}
                style={{ display: 'inline' }}
                variant='body2'
              >
                {totalEstimatedFeesRange
                  ? (() => {
                      const minFormatted =
                        totalEstimatedFeesRange.min < 0
                          ? `-$${Math.abs(totalEstimatedFeesRange.min).toFixed(2)}`
                          : `$${totalEstimatedFeesRange.min.toFixed(2)}`;
                      const maxFormatted =
                        totalEstimatedFeesRange.max < 0
                          ? `-$${Math.abs(totalEstimatedFeesRange.max).toFixed(2)}`
                          : `$${totalEstimatedFeesRange.max.toFixed(2)}`;
                      return `${minFormatted} - ${maxFormatted}`;
                    })()
                  : '-'}
              </StyledIBMTypography>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
