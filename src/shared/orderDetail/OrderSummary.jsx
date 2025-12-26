import React, { useState, useEffect } from 'react';
import { ExchangeIcons } from '@/shared/iconUtil';
import { TokenIcon, ChainIcon } from '@/shared/components/Icons';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Breadcrumbs, Divider, IconButton, Link, Skeleton, Tooltip, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import Stack from '@mui/material/Stack';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { ValueTypography } from '@/shared/components/MuiComponents';
import { CHAIN_CONFIGS } from '@/shared/dexUtils';
import {
  calculateDurationDisplay,
  formatQty,
  smartRound,
  titleCase,
  numberWithCommas,
  formatAccountName,
} from '../../util';
import { FillExchangeChart, FillRoleChart } from './charts';
import { OrderSummaryAdditional, OrderSummaryBottomSection } from './orderSummaryComponents';
import { OrderInfo, OrderInfoTypography } from './OrderInfo';
import EmptyBar from '../components/EmptyBar';

const formatInitialValue = (val) => {
  if (!val) {
    return '';
  }

  if (Number(val)) {
    return `(${smartRound(Number(val))}) `;
  }

  return `(${val}) `;
};

function OrderSummaryEntrySkeleton() {
  return (
    <Stack direction='column' spacing={0}>
      <Skeleton height='1.5rem' variant='text' width='20%' />
      <Skeleton height='1.5rem' variant='text' width='50%' />
    </Stack>
  );
}

function OrderSummaryBarSkeleton() {
  return (
    <Stack direction='column' spacing={0}>
      <Skeleton height='1.5rem' variant='text' width='10%' />
      <Skeleton height='2rem' variant='rectangular' width='100%' />
    </Stack>
  );
}

function OrderSummaryFieldsSkeletonBlock() {
  return (
    <>
      <Grid xs={6}>
        <OrderSummaryEntrySkeleton />
      </Grid>
      <Grid xs={6}>
        <OrderSummaryEntrySkeleton />
      </Grid>
      <Grid xs={6}>
        <OrderSummaryEntrySkeleton />
      </Grid>
      <Grid xs={6}>
        <OrderSummaryEntrySkeleton />
      </Grid>
      <Grid xs={6}>
        <OrderSummaryEntrySkeleton />
      </Grid>
      <Grid xs={6}>
        <OrderSummaryEntrySkeleton />
      </Grid>
    </>
  );
}

function OrderSummaryBarsSkeletonBlock() {
  return (
    <>
      <Grid xs={12}>
        <OrderSummaryBarSkeleton />
      </Grid>
      <Grid xs={12}>
        <OrderSummaryBarSkeleton />
      </Grid>
      <Grid xs={12}>
        <OrderSummaryBarSkeleton />
      </Grid>
    </>
  );
}

function OrderSummary({ OrderSummaryData, isSimple = false, isMulti = false }) {
  const isLoading = OrderSummaryData === undefined || Object.keys(OrderSummaryData).length === 0;
  const { uuid } = useParams();

  const {
    account_names,
    pair,
    side,
    buy_token_amount,
    sell_token_amount,
    limit_price,
    is_reverse_limit_price,
    executed_token,
    executed_notional,
    pct_filled,
    executed_price,
    time_start,
    duration,
    strategy_params,
    trajectory_name,
    super_strategy_name,
    parent_order,
    order_condition_normal,
    order_variable_normal,
    order_condition_vars,
    cancel_order_condition,
    schedule_discretion,
    engine_passiveness,
    alpha_tilt,
    exposure_tolerance,
    pov_limit,
    pov_target,
    status,
    initial_order_params = {},
    market_type,
    max_otc,
    pos_side,
    resume_condition_normal,
    unique_venues = [],
    quote_asset,
    target_token,
    fill_role_breakdown,
    exchange_role_breakdown,
    target_notional,
    points_earned,
    target_base_token,
    order_slices,
    placement_live_qty,
    chain_id,
  } = OrderSummaryData;

  const isDexOrder = Array.isArray(unique_venues) && unique_venues.some((venue) => venue.includes('OKXDEX'));

  if (isLoading) {
    return (
      <Grid container spacing={2}>
        <Grid xs={12}>
          <OrderSummaryEntrySkeleton />
        </Grid>
        <OrderSummaryFieldsSkeletonBlock />
        <Grid xs={12}>
          <Divider />
        </Grid>
        <OrderSummaryFieldsSkeletonBlock />
        <OrderSummaryBarsSkeletonBlock />
      </Grid>
    );
  }

  const hasSuperStrategy = super_strategy_name !== undefined && super_strategy_name !== null;
  const isPovTarget = !!pov_target;

  const displayTargetToken = target_token;
  const displayNotionalToken = quote_asset;

  // Calculate percentage of open quantity
  const calculatePctOpenQty = () => {
    if (!placement_live_qty || !sell_token_amount) return 0;
    return (Number(placement_live_qty) / Number(sell_token_amount)) * 100;
  };
  const pct_open_qty = calculatePctOpenQty();

  const notionalLabel = market_type !== 'option' ? displayNotionalToken : 'Contracts';

  const renderDurationOrParticipation = () => {
    if (isPovTarget) {
      return <ValueTypography>{smartRound(pov_target * 100, 2)}%</ValueTypography>;
    }

    return (
      <ValueTypography>
        {initial_order_params.duration && `(${calculateDurationDisplay(initial_order_params.duration)})`}{' '}
        {calculateDurationDisplay(duration)}
      </ValueTypography>
    );
  };

  // Format order ID for breadcrumb (shortened format: XXXXXX...XXXXXX)
  const formatOrderId = () => {
    if (uuid) {
      const id = uuid.replace(/-/g, ''); // Remove dashes for cleaner display
      if (id.length > 12) {
        return `${id.substring(0, 6)}...${id.substring(id.length - 6)}`;
      }
      return id;
    }
    return 'Order';
  };

  const handleCopyOrderId = () => {
    if (uuid) {
      navigator.clipboard.writeText(uuid);
    }
  };

  return (
    <Stack direction='column' spacing={2} sx={{ pt: 2 }}>
      {parent_order && (
        <Breadcrumbs aria-label='breadcrumb' separator='/' sx={{ pl: 2 }}>
          <Link
            component={RouterLink}
            sx={{ display: 'flex', alignItems: 'center', color: 'text.primary' }}
            to='/view_orders'
            underline='hover'
            variant='body2'
          >
            <HomeIcon sx={{ mr: 0.5, fontSize: 'inherit' }} />
            Orders
          </Link>
          <Link
            component={RouterLink}
            sx={{ display: 'flex', alignItems: 'center', color: 'text.primary' }}
            to={`/multi_order/${parent_order}`}
            underline='hover'
            variant='body2'
          >
            <AssignmentIcon sx={{ mr: 0.5, fontSize: 'inherit' }} />
            Parent Order
          </Link>
          <Typography sx={{ display: 'flex', alignItems: 'center', color: 'text.primary' }} variant='body2'>
            <DescriptionIcon sx={{ mr: 0.5, fontSize: 'inherit' }} />
            {formatOrderId()}
            {uuid && (
              <Tooltip title='Copy order ID'>
                <IconButton size='small' sx={{ ml: 0.5, p: 0.25, color: 'text.primary' }} onClick={handleCopyOrderId}>
                  <ContentCopyIcon sx={{ fontSize: '14px' }} />
                </IconButton>
              </Tooltip>
            )}
          </Typography>
        </Breadcrumbs>
      )}
      <Grid container spacing={3}>
        {isDexOrder ? (
          // DEX-specific layout
          <>
            <Grid xs={6}>
              <OrderInfo header='Accounts'>
                <Stack direction='row' spacing={2} sx={{ alignItems: 'center', pl: '4px' }}>
                  {!isMulti && <ExchangeIcons exchanges={unique_venues} style={{ height: '1rem', width: '1rem' }} />}
                  <ValueTypography>
                    {account_names &&
                      account_names.map((names, index) => {
                        const displayName = formatAccountName(names);
                        if (index === account_names.length - 1) {
                          return displayName;
                        }
                        return `${displayName}, `;
                      })}
                  </ValueTypography>
                </Stack>
              </OrderInfo>
            </Grid>
            <Grid xs={6}>
              <OrderInfoTypography
                header='Swap'
                value={`${target_token} → ${target_base_token}`}
                valueColor='text.primary'
              />
            </Grid>
            <Grid xs={6}>
              <OrderInfo header='From'>
                <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
                  <ValueTypography>
                    {formatQty(buy_token_amount || sell_token_amount)} {target_token}
                  </ValueTypography>
                  <TokenIcon
                    showChainIcon={false}
                    style={{ height: '1.2rem', width: '1.2rem' }}
                    tokenName={target_token}
                  />
                </Stack>
              </OrderInfo>
            </Grid>
            <Grid xs={6}>
              <OrderInfo header='To'>
                <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
                  {executed_token ? (
                    <ValueTypography>
                      {formatQty(executed_token)} {target_base_token}
                    </ValueTypography>
                  ) : (
                    <>
                      <EmptyBar variant='small' />
                      <ValueTypography>{target_base_token}</ValueTypography>
                    </>
                  )}
                  <TokenIcon
                    showChainIcon={false}
                    style={{ height: '1.2rem', width: '1.2rem' }}
                    tokenName={target_base_token}
                  />
                </Stack>
              </OrderInfo>
            </Grid>
            <Grid xs={6}>
              <OrderInfo header='Chain'>
                <Stack direction='row' spacing={1} sx={{ alignItems: 'center' }}>
                  {(() => {
                    const chainConfig = CHAIN_CONFIGS[chain_id];
                    return (
                      <>
                        <ChainIcon chainId={chain_id} style={{ height: '1rem', width: '1rem' }} />
                        <ValueTypography>{chainConfig?.name}</ValueTypography>
                      </>
                    );
                  })()}
                </Stack>
              </OrderInfo>
            </Grid>
          </>
        ) : (
          // Regular layout for non-DEX orders
          <>
            <Grid xs={12}>
              <OrderInfo header='Accounts'>
                <Stack direction='row' spacing={2} sx={{ alignItems: 'center', pl: '4px' }}>
                  {!isMulti && <ExchangeIcons exchanges={unique_venues} style={{ height: '1rem', width: '1rem' }} />}
                  <ValueTypography>
                    {account_names &&
                      account_names.map((names, index) => {
                        const displayName = formatAccountName(names);
                        if (index === account_names.length - 1) {
                          return displayName;
                        }
                        return `${displayName}, `;
                      })}
                  </ValueTypography>
                </Stack>
              </OrderInfo>
            </Grid>
            <Grid xs={6}>
              <OrderInfoTypography header='Pair' value={pair} />
            </Grid>
            <Grid xs={6}>
              <OrderInfoTypography header='Side' value={titleCase(side)} valueColor={`side.${side}`} />
            </Grid>
            <Grid xs={6}>
              <OrderInfo header='Target Quantity'>
                {buy_token_amount ? (
                  <ValueTypography>
                    {formatInitialValue(initial_order_params.buy_token_amount)}
                    {formatQty(buy_token_amount)} {market_type !== 'option' ? displayTargetToken : 'Contracts'}
                  </ValueTypography>
                ) : (
                  <ValueTypography>
                    {formatInitialValue(initial_order_params.sell_token_amount)}
                    {formatQty(sell_token_amount)} {market_type !== 'option' ? displayTargetToken : 'Contracts'}
                  </ValueTypography>
                )}
              </OrderInfo>
            </Grid>
          </>
        )}
        {!isDexOrder && (
          <Grid xs={6}>
            <OrderInfoTypography
              header='Target Notional'
              value={target_notional ? `${formatQty(target_notional)} ${notionalLabel}` : <EmptyBar />}
            />
          </Grid>
        )}
        <Grid xs={6}>
          <OrderInfoTypography
            header={hasSuperStrategy ? 'Strategy' : 'Trajectory'}
            value={hasSuperStrategy ? `${super_strategy_name} (${trajectory_name})` : trajectory_name}
          />
        </Grid>
        <Grid xs={6}>
          <OrderInfoTypography
            header={isPovTarget && !isSimple ? 'Target Participation' : 'Duration'}
            value={renderDurationOrParticipation()}
          />
        </Grid>
        {limit_price &&
          limit_price.length > 0 &&
          (() => {
            const initialValue = formatInitialValue(initial_order_params.limit_price);
            const formattedLimitPrice = Number.isNaN(Number(limit_price))
              ? limit_price
              : numberWithCommas(smartRound(limit_price, 4));

            return (
              <Grid xs={6}>
                <OrderInfoTypography
                  header={
                    <Stack alignItems='center' direction='row'>
                      Limit Price
                      {is_reverse_limit_price && (
                        <Tooltip title='Reverse Limit Price'>
                          <SwapVertIcon fontSize='small' />
                        </Tooltip>
                      )}
                    </Stack>
                  }
                  value={`${initialValue} ${formattedLimitPrice}`}
                />
              </Grid>
            );
          })()}
        {trajectory_name === 'Iceberg' && (
          <Grid xs={6}>
            <OrderInfoTypography header='Slices' value={order_slices} />
          </Grid>
        )}
      </Grid>

      <OrderSummaryAdditional
        alpha_tilt={alpha_tilt}
        cancel_order_condition={cancel_order_condition}
        durationDisplay={calculateDurationDisplay(duration)}
        engine_passiveness={engine_passiveness}
        exposure_tolerance={exposure_tolerance}
        isPovTarget={isPovTarget}
        max_otc={max_otc}
        order_condition_normal={order_condition_normal}
        order_condition_vars={order_condition_vars}
        order_variable_normal={order_variable_normal}
        pos_side={pos_side}
        pov_limit={pov_limit}
        pov_target={pov_target}
        resume_condition_normal={resume_condition_normal}
        schedule_discretion={schedule_discretion}
        strategy_params={strategy_params}
      />
      <Divider />

      <OrderSummaryBottomSection
        executed_notional={executed_notional}
        executed_price={executed_price}
        executed_token={executed_token}
        isDexOrder={isDexOrder}
        market_type={market_type}
        pct_filled={pct_filled}
        pct_open_qty={pct_open_qty}
        pov_limit={pov_limit}
        pov_target={pov_target}
        status={status}
        target_base_token={target_base_token}
        target_token={target_token}
        time_start={time_start}
      />

      {!isSimple && (
        <div style={{ width: '100%' }}>
          <FillRoleChart data={fill_role_breakdown} height='32px' style={{ paddingRight: '4px' }} />
        </div>
      )}
      <div style={{ width: '100%', marginTop: '4px' }}>
        <FillExchangeChart data={exchange_role_breakdown} height='32px' style={{ paddingRight: '4px' }} />
      </div>
    </Stack>
  );
}

export { OrderSummary };
