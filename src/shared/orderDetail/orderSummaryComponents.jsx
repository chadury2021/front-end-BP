import React, { useState } from 'react';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { Button, Collapse, Divider, Icon, Typography, Stack } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { useTheme } from '@emotion/react';
import { ValueTypography } from '@/shared/components/MuiComponents';
import { formatQty, smartRound, titleCase, msAndKs } from '@/util';
import EmptyBar from '@/shared/components/EmptyBar';
import { renderPriceWithSubscript } from '@/util/priceFormatting';
import { useThemeContext } from '../../theme/ThemeContext';
import { formatDateTime } from '../orderTable/util';
import { OrderInfo, OrderInfoTypography } from './OrderInfo';

// Duplicated from util.jsx for new theme, refactor once dashboard is converted
const parseStatus = (status) => {
  switch (status) {
    case 'SUBMITTED':
      return <ValueTypography color='primary.main'>Submitted</ValueTypography>;
    case 'CANCELED':
      return <ValueTypography color='error.main'>Canceled</ValueTypography>;
    case 'COMPLETE':
      return <ValueTypography color='success.main'>Finished</ValueTypography>;
    case 'SCHEDULED':
      return <ValueTypography color='secondary.main'>Scheduled</ValueTypography>;
    case 'PAUSED':
      return <ValueTypography color='info.main'>Paused</ValueTypography>;
    default:
      return <ValueTypography color='primary.main'>Active</ValueTypography>;
  }
};

export function OrderSummaryAdditional({
  notes,
  order_condition_normal,
  order_variable_normal,
  order_condition_vars,
  cancel_order_condition,
  resume_condition_normal,
  max_otc,
  pos_side,
  alpha_tilt,
  directional_bias,
  engine_passiveness,
  exposure_tolerance,
  pov_limit,
  isPovTarget,
  durationDisplay,
  schedule_discretion,
  strategy_params,
}) {
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);
  const { max_clip_size } = strategy_params;
  const strategyParamsKeys = Object.keys(strategy_params);

  return (
    <Stack direction='column'>
      <Collapse in={isAdditionalOpen}>
        <Stack direction='column' spacing={3}>
          <Divider />
          <Grid container spacing={3}>
            {notes && (
              <Grid xs={12}>
                <OrderInfoTypography header='Notes' value={notes} />
              </Grid>
            )}
            {order_condition_normal && (
              <Grid xs={12}>
                <OrderInfo header='Start Order Condition'>
                  <ValueTypography>{order_condition_normal}</ValueTypography>
                  {Object.entries(order_variable_normal).map(([k, v]) => {
                    return (
                      <li key={`clause ${k}`}>
                        <Typography variant='small2'>
                          {k} = <span style={{ fontWeight: 'bold' }}>{smartRound(order_condition_vars[k][1])}</span> :{' '}
                          {v}
                        </Typography>
                      </li>
                    );
                  })}
                </OrderInfo>
              </Grid>
            )}
            {cancel_order_condition && (
              <Grid xs={12}>
                <OrderInfo header='Cancel Order Condition'>
                  <ValueTypography>{cancel_order_condition}</ValueTypography>
                </OrderInfo>
              </Grid>
            )}
            {resume_condition_normal && (
              <Grid xs={12}>
                <OrderInfoTypography header='Resume Condition' value={resume_condition_normal} />
              </Grid>
            )}
            {max_otc && max_otc !== 0 ? (
              <Grid xs={6}>
                <OrderInfoTypography header='Max OTC Percentage' value={`${(Number(max_otc) * 100).toFixed(0)}%`} />
              </Grid>
            ) : null}
            {pos_side && (
              <Grid xs={6}>
                <OrderInfoTypography header='Position Side' value={pos_side} />
              </Grid>
            )}
            <Grid xs={3}>
              <OrderInfoTypography header='Alpha Tilt' value={parseFloat(alpha_tilt).toFixed(2)} />
            </Grid>
            <Grid xs={3}>
              <OrderInfoTypography header='Directional Bias' value={parseFloat(directional_bias ?? 0).toFixed(2)} />
            </Grid>
            <Grid xs={3}>
              <OrderInfoTypography header='Passiveness' value={parseFloat(engine_passiveness).toFixed(2)} />
            </Grid>
            <Grid xs={3}>
              <OrderInfoTypography header='Discretion' value={parseFloat(schedule_discretion).toFixed(2)} />
            </Grid>
            {max_clip_size && (
              <Grid xs={3}>
                <OrderInfoTypography header='Max Clip Size' value={parseFloat(max_clip_size)} />
              </Grid>
            )}
            {exposure_tolerance && (
              <Grid xs={3}>
                <OrderInfoTypography header='Exposure Tolerance' value={parseFloat(exposure_tolerance).toFixed(2)} />
              </Grid>
            )}
            {pov_limit && pov_limit > 0 && (
              <Grid xs={3}>
                <OrderInfoTypography
                  header='Participation Rate Limit'
                  value={`${smartRound(parseFloat(pov_limit) * 100)}%`}
                />
              </Grid>
            )}
            {isPovTarget && (
              <Grid xs={3}>
                <OrderInfoTypography header='Duration' value={`~${durationDisplay}`} />
              </Grid>
            )}
            {strategyParamsKeys.length !== 0 &&
              Object.values(strategy_params).includes(true) &&
              strategyParamsKeys
                .filter((x) => x !== 'max_clip_size' && strategy_params[x])
                .map((key) => (
                  <Grid key={key} xs={3}>
                    <OrderInfoTypography header={titleCase(key)} value='Yes' />
                  </Grid>
                ))}
          </Grid>
        </Stack>
      </Collapse>
      <Button
        sx={{
          color: 'text.dark',
        }}
        onClick={() => setIsAdditionalOpen(!isAdditionalOpen)}
      >
        <Typography color='text' variant='small2'>
          {isAdditionalOpen ? 'Hide Details' : 'Show Details'}
        </Typography>
        <Icon>{isAdditionalOpen ? <ExpandLess /> : <ExpandMore />}</Icon>
      </Button>
    </Stack>
  );
}

function OverlayedProgressBar({ pct_filled, pct_open_qty, isPov, orderStatus }) {
  const theme = useTheme();
  const { currentTheme } = useThemeContext();

  const formatPctFilled = () => {
    if (isPov && pct_filled <= 100) {
      return [theme.palette.success.main, theme.palette.success.dark2];
    }
    if (pct_filled < 99 && orderStatus === 'ACTIVE') {
      return [theme.palette.success.main, theme.palette.success.dark2];
    }
    if (pct_filled <= 101 && pct_filled >= 95) {
      return [theme.palette.success.main, theme.palette.success.dark2];
    }
    if (pct_filled > 101 || orderStatus === 'COMPLETE') {
      return [theme.palette.error.main, theme.palette.error.dark2];
    }
    return [theme.palette.primary.main, theme.palette.primary.transparent];
  };

  const filledColor = formatPctFilled();
  const openColor = [theme.palette.success.main, theme.palette.success.dark2];

  // Determine text color based on progress bar color
  const getTextColor = () => {
    // Always use black text for order summary progress bars
    return '#000000';
  };

  const containerStyle = {
    position: 'relative',
    height: '18px',
    width: '100%',
    backgroundColor: currentTheme === 'dark' ? `${filledColor[0]}10` : filledColor[1], // Use transparent version of filled color in dark mode
    borderRadius: '5px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '8px',
    ...(currentTheme === 'dark' && {
      border: `1px solid ${filledColor[1]}`,
    }),
  };

  const barContainerStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '5px',
    backgroundColor: 'inherit',
    overflow: 'hidden',
  };

  const filledBarStyle = {
    position: 'absolute',
    height: '18px',
    width: `${pct_filled}%`,
    backgroundColor: filledColor[0], // Always use the bright color for the filled portion
    borderRadius: '0px',
    transition: 'width 0.5s ease-in-out',
    zIndex: 2,
    left: 0,
    top: 0,
  };

  const openBarStyle = {
    position: 'absolute',
    height: '18px',
    width: `${pct_open_qty}%`,
    backgroundColor: openColor[0], // Always use the bright color for the open portion
    borderRadius: '0px',
    transition: 'width 0.5s ease-in-out',
    zIndex: 1,
    opacity: 0.8,
    left: `${pct_filled}%`,
    top: 0,
  };

  return (
    <div style={containerStyle}>
      <div style={barContainerStyle}>
        <div style={openBarStyle} />
        <div style={filledBarStyle} />
      </div>
      <Typography
        color={getTextColor()}
        style={{ zIndex: 3, position: 'relative' }}
        variant='body2'
      >{`${pct_filled}%`}</Typography>
    </div>
  );
}

export function OrderSummaryBottomSection({
  time_start,
  status,
  market_type,
  executed_notional,
  executed_price,
  executed_token,
  target_base_token,
  pct_filled,
  pct_open_qty,
  pov_limit,
  pov_target,
  isMultiView = false,
  isDexOrder = false,
  target_token,
}) {
  const displayTargetToken = target_token;
  const displayBaseToken = target_base_token;

  // Format DEX price with subscript notation for small numbers
  const formatDexPriceWithSubscript = (price) => {
    if (!price || price === 0) return '0';

    const priceNum = Number(price);

    // Handle Infinity and very large numbers
    if (!Number.isFinite(priceNum)) {
      return '∞';
    }

    // For extremely large numbers, use KMBT formatting
    if (priceNum > 1e15) {
      return msAndKs(priceNum, 2);
    }

    // For large numbers, use KMB formatting
    if (priceNum >= 1000) {
      return msAndKs(priceNum, 2);
    }

    // Convert scientific notation to decimal string
    let priceStr;
    if (priceNum < 1 && priceNum > 0) {
      // For very small numbers, use toFixed with enough precision to avoid scientific notation
      if (priceNum < 1e-10) {
        priceStr = priceNum.toFixed(15);
      } else if (priceNum < 1e-8) {
        priceStr = priceNum.toFixed(12);
      } else if (priceNum < 1e-6) {
        priceStr = priceNum.toFixed(10);
      } else if (priceNum < 1e-4) {
        priceStr = priceNum.toFixed(8);
      } else if (priceNum < 1e-2) {
        priceStr = priceNum.toFixed(6);
      } else {
        priceStr = priceNum.toFixed(4);
      }
    } else {
      priceStr = String(price);
    }

    // Only apply subscript formatting if price is less than 1
    if (priceNum >= 1) {
      return priceStr;
    }

    // Match: 0.(zeros)(rest), at least 2 zeros after decimal, then a nonzero digit
    const match = priceStr.match(/^(\d*)\.(0{2,})([1-9]\d*)$/);
    if (match) {
      const [, intPart, zeros, rest] = match;
      return (
        <>
          {intPart}.0<sub style={{ fontSize: '0.7em', verticalAlign: 'sub', opacity: 0.7 }}>{zeros.length}</sub>
          {rest}
        </>
      );
    }
    return priceStr;
  };

  return (
    <Grid container spacing={3}>
      <Grid xs={6}>
        <OrderInfoTypography header='Time Start' value={time_start ? formatDateTime(time_start) : '-'} />
      </Grid>
      <Grid xs={6}>
        <OrderInfo header='Status'>{parseStatus(status)}</OrderInfo>
      </Grid>
      {!isMultiView && !isDexOrder && (
        <>
          <Grid xs={6}>
            <OrderInfoTypography
              header='Executed Notional'
              value={executed_notional ? `${formatQty(executed_notional, true)}` : <EmptyBar />}
            />
          </Grid>
          <Grid xs={6}>
            <OrderInfoTypography
              header='Avg Execution Price'
              value={executed_price ? <>{renderPriceWithSubscript(smartRound(executed_price))}</> : <EmptyBar />}
            />
          </Grid>
          <Grid xs={6}>
            <OrderInfoTypography
              header='Executed Quantity'
              value={executed_token ? `${formatQty(executed_token)} ${target_base_token}` : <EmptyBar />}
            />
          </Grid>
        </>
      )}

      {!isMultiView && isDexOrder && (
        <Grid xs={6}>
          <OrderInfoTypography
            header='Avg Execution Price'
            value={
              <span>
                1 {displayBaseToken} ={' '}
                {formatDexPriceWithSubscript(
                  executed_token && executed_notional && Number(executed_token) > 0
                    ? Number(executed_notional) / Number(executed_token)
                    : '-'
                )}{' '}
                {displayTargetToken}
              </span>
            }
          />
        </Grid>
      )}

      <Grid xs={12}>
        <OrderInfo header='Fill Percentage'>
          <OverlayedProgressBar
            isPov={pov_limit || pov_target}
            orderStatus={status}
            pct_filled={Math.round(Number(pct_filled))}
            pct_open_qty={Math.round(Number(pct_open_qty))}
          />
        </OrderInfo>
      </Grid>
    </Grid>
  );
}
