import React, { useMemo, useState } from 'react';
import { Divider, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { Analytics } from '@mui/icons-material';
import SyncIcon from '@mui/icons-material/Sync';
import { keyframes } from '@emotion/react';
import LabelTooltip from '@/shared/components/LabelTooltip';
import { StyledIBMTypography } from '@/shared/orderTable/util';
import { formatQty } from '@/util';
import { refreshAllAccountBalanceCache } from '@/apiServices';

const getColorForFundingRate = (value) => {
  if (value == null || !Number.isFinite(value)) return 'text.secondary';
  if (Number(value) < 0) return 'error.main';
  if (Number(value) > 0) return 'success.main';
  return 'text.primary';
};

const formatLeverageDisplay = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const formatted = Number.isInteger(numeric) ? numeric.toFixed(0) : numeric.toFixed(2).replace(/\.?0+$/, '');
  return `${formatted}x`;
};

export default function DeltaNeutralPreTradeAnalytics({
  availableLongMargin,
  availableShortMargin,
  longLeverage,
  shortLeverage,
  longPair,
  shortPair,
  perLegNotional,
  longFees,
  shortFees,
  longPovRate,
  shortPovRate,
  longFundingRate,
  shortFundingRate,
  mode,
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const rotate = keyframes`
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  `;

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refreshAllAccountBalanceCache();
    } catch (error) {
      // Silently fail - the UI will show the existing balance
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  };

  const formatBps = (value) => {
    if (value == null || !Number.isFinite(value)) return '-';
    return `${(value * 10000).toFixed(1)} bps`;
  };

  const formatPercent = (value) => {
    if (value == null || !Number.isFinite(value)) return '-';
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatFundingRate = (value) => {
    if (value == null || !Number.isFinite(value)) return '-';
    return `${value.toFixed(4)}%`;
  };

  // Calculate sided funding rates
  // For long positions: sided rate = -funding_rate (positive funding = longs pay = negative for you)
  // For short positions: sided rate = +funding_rate (positive funding = shorts receive = positive for you)
  const longSidedFundingRate = longFundingRate != null ? -longFundingRate : null;
  const shortSidedFundingRate = shortFundingRate != null ? shortFundingRate : null;
  const longLeverageDisplay = useMemo(() => formatLeverageDisplay(longLeverage), [longLeverage]);
  const shortLeverageDisplay = useMemo(() => formatLeverageDisplay(shortLeverage), [shortLeverage]);

  const netSidedFundingRate =
    longSidedFundingRate != null && shortSidedFundingRate != null ? longSidedFundingRate + shortSidedFundingRate : null;

  return (
    <Paper elevation={1} sx={{ pt: 1, pb: 1, px: 2, backgroundColor: 'transparent', backdropFilter: 'blur(5px)' }}>
      <Stack direction='column' spacing={2}>
        <Stack alignItems='center' direction='row' spacing={1}>
          <Analytics sx={{ fontSize: '1rem', color: 'text.secondary' }} />
          <Typography variant='body1'>Pre-Trade Analytics</Typography>
        </Stack>

        {/* Long Leg */}
        <Stack direction='column' spacing={1}>
          <Typography color='success.main' variant='body2'>
            Long Leg
          </Typography>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <Stack alignItems='center' direction='row' spacing={0.5}>
              <LabelTooltip
                label={`Inventory${longLeverageDisplay ? ` (${longLeverageDisplay})` : ''}`}
                placement='left'
                title={<Typography>Quote inventory for the long leg.</Typography>}
              />
              <Tooltip title='Refresh account balances'>
                <IconButton disabled={isRefreshing} size='small' sx={{ p: 0.5 }} onClick={handleRefresh}>
                  <SyncIcon
                    sx={{
                      fontSize: '0.875rem',
                      color: 'primary.main',
                      animation: isRefreshing ? `${rotate} 1s linear infinite` : 'none',
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Stack>
            <StyledIBMTypography
              color={availableLongMargin != null ? 'text.primary' : 'text.secondary'}
              style={{ display: 'inline' }}
              variant='body2'
            >
              {availableLongMargin != null ? formatQty(availableLongMargin, true) : '-'}
            </StyledIBMTypography>
          </Stack>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Target Amount'
              placement='left'
              title={<Typography>Notional amount for long leg (half of total).</Typography>}
            />
            <StyledIBMTypography
              color={perLegNotional != null ? 'text.primary' : 'text.secondary'}
              style={{ display: 'inline' }}
              variant='body2'
            >
              {perLegNotional != null ? formatQty(perLegNotional, true) : '-'}
            </StyledIBMTypography>
          </Stack>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Estimated Fees'
              placement='left'
              title={<Typography>Builder + maker fees for long leg.</Typography>}
            />
            <StyledIBMTypography
              color={longFees != null ? 'text.primary' : 'text.secondary'}
              style={{ display: 'inline' }}
              variant='body2'
            >
              {longFees != null ? formatQty(longFees, true) : '-'}
            </StyledIBMTypography>
          </Stack>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Sided Funding Rate'
              placement='left'
              title={
                <Typography>
                  Sided funding rate for long position. Negative = you pay funding, Positive = you receive funding.
                </Typography>
              }
            />
            <StyledIBMTypography
              color={getColorForFundingRate(longSidedFundingRate)}
              style={{ display: 'inline' }}
              variant='body2'
            >
              {formatFundingRate(longSidedFundingRate)}
            </StyledIBMTypography>
          </Stack>
        </Stack>

        <Divider />

        {/* Short Leg */}
        <Stack direction='column' spacing={1}>
          <Typography color='error.main' variant='body2'>
            Short Leg
          </Typography>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <Stack alignItems='center' direction='row' spacing={0.5}>
              <LabelTooltip
                label={`Inventory${shortLeverageDisplay ? ` (${shortLeverageDisplay})` : ''}`}
                placement='left'
                title={<Typography>Quote inventory for the short leg.</Typography>}
              />
              <Tooltip title='Refresh account balances'>
                <IconButton disabled={isRefreshing} size='small' sx={{ p: 0.5 }} onClick={handleRefresh}>
                  <SyncIcon
                    sx={{
                      fontSize: '0.875rem',
                      color: 'primary.main',
                      animation: isRefreshing ? `${rotate} 1s linear infinite` : 'none',
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Stack>
            <StyledIBMTypography
              color={availableShortMargin != null ? 'text.primary' : 'text.secondary'}
              style={{ display: 'inline' }}
              variant='body2'
            >
              {availableShortMargin != null ? formatQty(availableShortMargin, true) : '-'}
            </StyledIBMTypography>
          </Stack>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Target Amount'
              placement='left'
              title={<Typography>Notional amount for short leg (half of total).</Typography>}
            />
            <StyledIBMTypography
              color={perLegNotional != null ? 'text.primary' : 'text.secondary'}
              style={{ display: 'inline' }}
              variant='body2'
            >
              {perLegNotional != null ? formatQty(perLegNotional, true) : '-'}
            </StyledIBMTypography>
          </Stack>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Estimated Fees'
              placement='left'
              title={<Typography>Builder + maker fees for short leg.</Typography>}
            />
            <StyledIBMTypography
              color={shortFees != null ? 'text.primary' : 'text.secondary'}
              style={{ display: 'inline' }}
              variant='body2'
            >
              {shortFees != null ? formatQty(shortFees, true) : '-'}
            </StyledIBMTypography>
          </Stack>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Sided Funding Rate'
              placement='left'
              title={
                <Typography>
                  Sided funding rate for short position. Negative = you pay funding, Positive = you receive funding.
                </Typography>
              }
            />
            <StyledIBMTypography
              color={getColorForFundingRate(shortSidedFundingRate)}
              style={{ display: 'inline' }}
              variant='body2'
            >
              {formatFundingRate(shortSidedFundingRate)}
            </StyledIBMTypography>
          </Stack>
        </Stack>

        <Divider />

        {/* Net Predicted Funding Rate */}
        <Stack direction='column' spacing={1}>
          <Typography color='text.primary' fontWeight='bold' variant='body2'>
            Net Position
          </Typography>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Net Sided Funding Rate'
              placement='left'
              title={
                <Typography>
                  Net sided funding rate = Long sided + Short sided. Negative = you pay funding overall, Positive = you
                  receive funding overall.
                </Typography>
              }
            />
            <StyledIBMTypography
              color={getColorForFundingRate(netSidedFundingRate)}
              style={{ display: 'inline' }}
              variant='body2'
            >
              {formatFundingRate(netSidedFundingRate)}
            </StyledIBMTypography>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
