import React from 'react';
import { Box, Grid, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { smartRound, msAndKs } from '@/util';
import {
  getMarginRatioColor,
  getMarginRatioHexColor,
  formatMarginRatio,
  getMarginRatioProgressBarColors,
} from '@/util/marginRatioUtils';
import LabelTooltip from '@/shared/components/LabelTooltip';
import useLiquidationRisk from '@/hooks/useLiquidationRisk';

// Segmented progress bar component
function SegmentedProgressBar({ value, height = 8, segmentCount = 20, theme }) {
  const segments = [];
  const filledSegments = Math.floor((value / 100) * segmentCount);

  // Use consistent colors from utility
  const colors = getMarginRatioProgressBarColors(theme);

  for (let i = 0; i < segmentCount; i += 1) {
    const isFilled = i < filledSegments;
    const colorIndex = Math.floor((i / segmentCount) * colors.length);
    const color = colors[Math.min(colorIndex, colors.length - 1)];

    segments.push(
      <Box
        key={i}
        sx={{
          backgroundColor: isFilled ? color : `${theme.palette.grey[600]}1A`,
          borderRight: i < segmentCount - 1 ? `1px solid ${theme.palette.grey[600]}0D` : 'none',
          flex: 1,
          height: `${height}px`,
          opacity: isFilled ? 1 : 0.3,
          transition: 'all 0.3s ease',
        }}
      />
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {/* Segmented progress bar */}
      <Box
        sx={{
          display: 'flex',
          height: `${height}px`,
          width: '100%',
          borderRadius: `${height / 2}px`,
          overflow: 'hidden',
          border: `1px solid ${theme.palette.grey[600]}1A`,
        }}
      >
        {segments}
      </Box>
    </Box>
  );
}

// Helper component for displaying stats
function Stat({ helper = null, label, value, tooltip = null, colorCode = null }) {
  const labelElement = tooltip ? (
    <LabelTooltip label={label} title={tooltip} />
  ) : (
    <Typography color='text.secondary' variant='body2'>
      {label}
    </Typography>
  );

  // Ensure value is a string to prevent rendering issues
  const safeValue = typeof value === 'string' ? value : String(value || 'N/A');

  return (
    <Stack spacing={0.5} sx={{ flex: 1 }}>
      {labelElement}
      <Typography fontWeight={400} sx={colorCode ? { color: colorCode } : {}} variant='h6'>
        {safeValue}
      </Typography>
      {helper && (
        <Typography color='text.secondary' variant='caption'>
          {helper}
        </Typography>
      )}
    </Stack>
  );
}

export default function LiquidationRiskPanel({ accountBalance }) {
  const theme = useTheme();
  // Calculate liquidation risk metrics using the hook (must be called unconditionally)
  const liquidationRiskData = useLiquidationRisk(accountBalance);

  if (!accountBalance) {
    return null;
  }

  // Check if this is a Hyperliquid account
  const isHyperliquid =
    accountBalance.exchange === 'hyperliquid' ||
    // Fallback detection: check if the hook detected Hyperliquid characteristics
    // Look for non-stablecoin tokens that are typical of Hyperliquid
    (accountBalance.assets &&
      accountBalance.assets.some(
        (a) =>
          a.asset_type === 'token' &&
          a.symbol &&
          !['USDT', 'USDC', 'USDE', 'DAI', 'FDUSD', 'USDD', 'TUSD', 'BUSD', 'USDK', 'PYUSD', 'USD'].includes(
            a.symbol
          ) &&
          a.notional &&
          Number(a.notional) > 0
      ));

  // For Hyperliquid accounts, show the panel even without perp exposure
  // For other exchanges, require perp exposure
  if (!isHyperliquid && !liquidationRiskData.hasPerpExposure) {
    return null;
  }

  try {
    const {
      liquidationBuffer,
      maintenanceMarginUsd,
      averageLeverage,
      riskScore,
      averageEntryPrice,
      perPosition,
      accountBalanceUsd,
    } = liquidationRiskData;

    // Ensure all values are numbers to prevent msAndKs errors
    const safeLiquidationBuffer = Number(liquidationBuffer) || 0;
    const safeMaintenanceMarginUsd = Number(maintenanceMarginUsd) || 0;
    const safeAverageLeverage = Number(averageLeverage) || 0;
    const safeRiskScore = Number(riskScore) || 0;
    const safeAccountBalanceUsd = Number(accountBalanceUsd) || 0;

    // Risk assessment based on risk score (0-100 scale, higher is safer)
    const isSafe = safeRiskScore > 66;

    // Determine risk category without nested ternary
    let riskCategory;
    if (safeRiskScore > 66) {
      riskCategory = 'Safe (>66%)';
    } else if (safeRiskScore > 33) {
      riskCategory = 'Warning (33-66%)';
    } else {
      riskCategory = 'Danger (<33%)';
    }

    // For Hyperliquid accounts without positions, show different messaging
    const hasPositions = perPosition.length > 0;
    const isHyperliquidNoPositions = isHyperliquid && !hasPositions;

    return (
      <Stack
        direction='column'
        spacing={2}
        sx={{
          height: '100%',
          display: 'flex',
        }}
      >
        <Stack spacing={1}>
          {/* Title and status above the progress bar */}
          <Stack alignItems='center' direction='row' justifyContent='space-between'>
            <Typography
              color={(() => {
                if (isHyperliquidNoPositions) return 'success.main';
                if (safeRiskScore > 66) return 'success.main';
                if (safeRiskScore > 33) return 'warning.main';
                return 'error.main';
              })()}
              variant='h6'
            >
              {(() => {
                if (isHyperliquidNoPositions) {
                  return `No Open Positions (${smartRound(safeAccountBalanceUsd, 2)} USD)`;
                }
                if (isSafe) {
                  return `Safe (${smartRound(safeRiskScore, 1)}%)`;
                }
                return `At Risk (${smartRound(safeRiskScore, 1)}%)`;
              })()}
            </Typography>
          </Stack>

          {/* Progress bar with dot indicator - only show if there are positions */}
          {hasPositions && (
            <Box sx={{ position: 'relative', pt: 2 }}>
              <SegmentedProgressBar height={8} segmentCount={20} theme={theme} value={safeRiskScore} />
            </Box>
          )}
        </Stack>

        <Stack direction='column' spacing={1} sx={{ flex: 1 }}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Stat
                helper={null}
                label='Liquidation Buffer'
                tooltip={
                  isHyperliquidNoPositions
                    ? 'Available balance in your Hyperliquid account. No open positions means no liquidation risk.'
                    : 'Available funds above the maintenance margin requirement. Higher buffer = safer position. If this reaches zero, positions may be liquidated.'
                }
                value={(() => {
                  let rounded;
                  try {
                    rounded = smartRound(safeLiquidationBuffer, 2);
                    // Convert string back to number for msAndKs
                    const numValue = Number(rounded);
                    const result = msAndKs(numValue);
                    return `$${result}`;
                  } catch (err) {
                    return '$N/A';
                  }
                })()}
              />
            </Grid>
            <Grid item xs={6}>
              <Stat
                helper={null}
                label={isHyperliquidNoPositions ? 'Account Balance' : 'Maintenance Margin'}
                tooltip={
                  isHyperliquidNoPositions
                    ? 'Total value of your Hyperliquid account in USD.'
                    : 'Minimum margin required to keep positions open. If account equity falls below this level, positions may be liquidated by the exchange.'
                }
                value={(() => {
                  if (isHyperliquidNoPositions) {
                    try {
                      const rounded = smartRound(safeAccountBalanceUsd, 2);
                      const numValue = Number(rounded);
                      const result = msAndKs(numValue);
                      return `$${result}`;
                    } catch (err) {
                      return '$N/A';
                    }
                  } else {
                    let rounded;
                    try {
                      rounded = smartRound(safeMaintenanceMarginUsd, 2);
                      const numValue = Number(rounded);
                      const result = msAndKs(numValue);
                      return `$${result}`;
                    } catch (err) {
                      return '$N/A';
                    }
                  }
                })()}
              />
            </Grid>
          </Grid>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Stat
                colorCode={
                  perPosition.length > 0 ? getMarginRatioHexColor(perPosition[0]?.marginRatioPct || 0, theme) : null
                }
                label={isHyperliquidNoPositions ? 'Available for Trading' : 'Margin Ratio'}
                tooltip={
                  isHyperliquidNoPositions
                    ? 'Amount available to open new positions or withdraw.'
                    : 'Maintenance Margin Ratio (MMR) = Maintenance Margin / Wallet Balance × 100%. Lower ratio = safer position. Above 25% = high liquidation risk.'
                }
                value={(() => {
                  if (isHyperliquidNoPositions) {
                    return '100%';
                  }
                  if (perPosition.length > 0) {
                    return formatMarginRatio(perPosition[0]?.marginRatioPct || 0);
                  }
                  return 'N/A';
                })()}
              />
            </Grid>
            <Grid item xs={6}>
              <Stat
                helper={null}
                label={isHyperliquidNoPositions ? 'Max Leverage' : 'Average Leverage'}
                tooltip={
                  isHyperliquidNoPositions
                    ? 'Maximum leverage available on Hyperliquid (typically 10x for most assets).'
                    : 'Weighted average leverage across all positions. Higher leverage = higher potential returns but also higher risk of liquidation.'
                }
                value={isHyperliquidNoPositions ? '10x' : `${smartRound(safeAverageLeverage, 2)}x`}
              />
            </Grid>
          </Grid>
        </Stack>
      </Stack>
    );
  } catch (error) {
    // Return a fallback UI when there's an error
    return (
      <Stack
        direction='column'
        spacing={2}
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color='text.secondary' variant='body2'>
          Unable to load liquidation risk data
        </Typography>
      </Stack>
    );
  }
}
