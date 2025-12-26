import React from 'react';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  IconButton,
  Tooltip,
  Paper,
  CircularProgress,
  useTheme,
} from '@mui/material';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import { Stack } from '@mui/system';
import { OrderInfo, OrderInfoTypography } from '@/shared/orderDetail/OrderInfo';
import OrderAccounts from '@/shared/orderDetail/OrderAccounts';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import getBaseTokenIcon from '@images/tokens';
import { capitalize, prettyPrice, numberWithCommas, formatQty, smartRound } from '@/util';
import { timezoneAtom } from '@/shared/hooks/useGlobalFormReducer';
import { useAtom } from 'jotai';
import { timeZoneNoOffset } from '@/shared/TimezoneUtil';
import { DateTime } from 'luxon';
import CloseIcon from '@mui/icons-material/Close';
import { TokenIcon } from '@/shared/components/Icons';
import defaultStrategySettings from '@/pages/dashboard/defaultStrategySettings';
import usePreTradeAnayltics from './hooks/usePreTradeAnalytics';

function Summary({
  isSimple,
  pairDisplayIcon,
  selectedPair,
  base,
  quote,
  selectedSide,
  accounts,
  selectedAccounts,
  targetQuantity,
  targetNotional,
  strategy,
  limitPrice,
  isReverseLimitPrice,
  selectedDuration,
  orderSlices,
  isAuto,
  isPov = false,
  isEntryEnabled,
  currentLeverage,
  isPerpetualPair,
}) {
  // Compare to defaults
  const highlightTargetQuantity = targetQuantity !== '' && targetQuantity !== undefined;
  const highlightTargetNotional = targetNotional !== '' && targetNotional !== undefined;
  const highlightLimitPrice = limitPrice !== '' && limitPrice !== undefined;
  const highlightDuration = selectedDuration !== defaultStrategySettings.duration;
  const highlightOrderSlices = orderSlices !== defaultStrategySettings.orderSlices;
  const formattedLimitPrice = Number.isFinite(Number(limitPrice)) ? prettyPrice(limitPrice, 6) : limitPrice;
  return (
    <Grid container spacing={3}>
      <Grid xs={12}>
        <Stack alignItems='center' direction='row' spacing={1}>
          <img alt='Token Icon' src={pairDisplayIcon} style={{ height: '20px', width: '20px' }} />
          <Typography variant='h6'>{selectedPair}</Typography>
          <Typography variant='h6'>-</Typography>
          <Typography color={`side.${selectedSide}`} variant='h6'>
            {capitalize(selectedSide)}
          </Typography>
        </Stack>
      </Grid>
      <Grid xs={4}>
        <OrderInfoTypography
          header='Target Quantity'
          highlight={highlightTargetQuantity}
          value={`${prettyPrice(targetQuantity)} ${base}`}
          valueVariant='subtitle1'
        />
      </Grid>
      <Grid xs={4}>
        <OrderInfoTypography
          header='Target Notional'
          highlight={highlightTargetNotional}
          value={`${prettyPrice(targetNotional, 2)} ${quote}`}
          valueVariant='subtitle1'
        />
      </Grid>
      <Grid xs={4}>
        <OrderInfo header='Accounts'>
          <OrderAccounts accounts={accounts} selectedAccounts={selectedAccounts} />
        </OrderInfo>
      </Grid>
      {isPerpetualPair && currentLeverage && (
        <Grid xs={3}>
          <OrderInfoTypography header='Current Leverage' value={`${currentLeverage}x`} />
        </Grid>
      )}
      {!isAuto && (
        <>
          <Grid xs={3}>
            <OrderInfoTypography header='Strategy' value={strategy.name} />
          </Grid>
          {limitPrice && (
            <Grid xs={3}>
              <OrderInfoTypography
                header={
                  <Stack alignItems='center' direction='row'>
                    Limit Price
                    {isReverseLimitPrice && (
                      <Tooltip title='Reverse Limit Price'>
                        <SwapVertIcon fontSize='small' />
                      </Tooltip>
                    )}
                  </Stack>
                }
                highlight={highlightLimitPrice}
                value={formattedLimitPrice}
              />
            </Grid>
          )}
          {isEntryEnabled !== undefined && (
            <Grid xs={3}>
              <OrderInfoTypography header='Limit Price Entry' value={isEntryEnabled ? 'Yes' : 'No'} />
            </Grid>
          )}
          <Grid xs={3}>
            <OrderInfoTypography
              header={isSimple ? 'Expiry' : 'Duration'}
              highlight={highlightDuration}
              value={
                isPov
                  ? `~${prettyPrice(selectedDuration / 60, 2)} min(s)`
                  : `${prettyPrice(selectedDuration / 60, 2)} min(s)`
              }
            />
          </Grid>
          {strategy.name === 'Iceberg' && (
            <Grid xs={3}>
              <OrderInfoTypography header='Slices' highlight={highlightOrderSlices} value={orderSlices} />
            </Grid>
          )}
        </>
      )}
    </Grid>
  );
}

function SimpleStrategyConfiguration({ isLimit, isReduceOnly, isPassiveOnly, stopPrice, quote, updatePairLeverage }) {
  return (
    <>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Active Limit'
          highlight={isLimit !== defaultStrategySettings.activeLimit}
          value={isLimit ? 'Yes' : 'No'}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Reduce Only'
          highlight={isReduceOnly !== defaultStrategySettings.reduce_only}
          value={isReduceOnly ? 'Yes' : 'No'}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Passive Only'
          highlight={isPassiveOnly !== defaultStrategySettings.passive_only}
          value={isPassiveOnly ? 'Yes' : 'No'}
        />
      </Grid>
      {updatePairLeverage && (
        <Grid xs={3}>
          <OrderInfoTypography header='Pair Leverage' value={updatePairLeverage} />
        </Grid>
      )}
    </>
  );
}

function AlgoStrategyConfiguration({
  trajectory,
  passiveness,
  discretion,
  maxClipSize,
  alphaTilt,
  maxOtcPercentage,
  isPassiveOnly,
  isLimit,
  isReduceOnly,
  isStrictDuration,
  updatePairLeverage,
  povLimit,
  povTarget,
}) {
  return (
    <>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Trajectory'
          highlight={trajectory !== defaultStrategySettings.trajectory}
          value={trajectory}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Passiveness'
          highlight={passiveness !== defaultStrategySettings.passiveness}
          value={passiveness}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Discretion'
          highlight={discretion !== defaultStrategySettings.discretion}
          value={discretion}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Alpha Tilt'
          highlight={alphaTilt !== defaultStrategySettings.alphaTilt}
          value={alphaTilt}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Max Clip Size'
          highlight={!!maxClipSize}
          value={maxClipSize ? numberWithCommas(maxClipSize) : 'Adaptive'}
        />
      </Grid>
      {maxOtcPercentage > 0 && (
        <Grid xs={3}>
          <OrderInfoTypography
            header='Max OTC Percentage'
            highlight={maxOtcPercentage !== defaultStrategySettings.otcPercentage}
            value={maxOtcPercentage}
          />
        </Grid>
      )}
      <Grid xs={3}>
        <OrderInfoTypography
          header='Passive Only'
          highlight={isPassiveOnly !== defaultStrategySettings.passive_only}
          value={isPassiveOnly ? 'Yes' : 'No'}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Active Limit'
          highlight={isLimit !== defaultStrategySettings.activeLimit}
          value={isLimit ? 'Yes' : 'No'}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Reduce Only'
          highlight={isReduceOnly !== defaultStrategySettings.reduce_only}
          value={isReduceOnly ? 'Yes' : 'No'}
        />
      </Grid>
      {isPassiveOnly && (
        <Grid xs={3}>
          <OrderInfoTypography
            header='Strict Duration'
            highlight={isStrictDuration !== defaultStrategySettings.strict_duration}
            value={isStrictDuration ? 'Yes' : 'No'}
          />
        </Grid>
      )}
      {updatePairLeverage && (
        <Grid xs={3}>
          <OrderInfoTypography header='Pair Leverage' value={updatePairLeverage} />
        </Grid>
      )}
      {povTarget && (
        <Grid xs={3}>
          <OrderInfoTypography
            header='Participation Rate Target'
            highlight={!!povTarget}
            value={`${smartRound(povTarget * 100)}%`}
          />
        </Grid>
      )}
      {povLimit && (
        <Grid xs={3}>
          <OrderInfoTypography
            header='Participation Rate Limit'
            highlight={!!povLimit}
            value={`${smartRound(povLimit * 100)}%`}
          />
        </Grid>
      )}
    </>
  );
}

function AutoStrategyConfiguration({ strategy, duration, passiveness, alphaTilt }) {
  const isSimple = ['Market', 'IOC'].includes(strategy);
  return (
    <>
      <Grid xs={3}>
        <OrderInfoTypography header='Strategy' value={strategy} />
      </Grid>
      {!isSimple && (
        <>
          <Grid xs={3}>
            <OrderInfoTypography
              header='Duration'
              highlight={duration !== defaultStrategySettings.duration}
              value={`${prettyPrice(duration / 60, 2)} min(s)`}
            />
          </Grid>
          <Grid xs={3}>
            <OrderInfoTypography
              header='Passiveness'
              highlight={passiveness !== defaultStrategySettings.passiveness}
              value={passiveness}
            />
          </Grid>
          <Grid xs={3}>
            <OrderInfoTypography
              header='Alpha Tilt'
              highlight={alphaTilt !== defaultStrategySettings.alphaTilt}
              value={alphaTilt}
            />
          </Grid>
        </>
      )}
    </>
  );
}

function Scheduled({ startDatetime, duration }) {
  const [timeZone] = useAtom(timezoneAtom);
  const startDt = DateTime.fromISO(startDatetime, { zone: 'utc' }).setZone(timeZoneNoOffset(timeZone));
  const endDt = startDt.plus({ seconds: duration });

  return (
    <Grid container spacing={2}>
      <Grid xs={12}>
        <Typography color='secondary' variant='small1'>
          Scheduled
        </Typography>
      </Grid>
      <Grid xs={6}>
        <OrderInfoTypography header='Time start' value={startDt.toFormat('yyyy-MM-dd HH:mm')} />
      </Grid>
      <Grid xs={6}>
        <OrderInfoTypography header='Time end' value={endDt.toFormat('yyyy-MM-dd HH:mm')} />
      </Grid>
      <Grid xs={6}>
        <OrderInfoTypography header='Timezone' value={timeZone} />
      </Grid>
    </Grid>
  );
}

function PreTradeAnalytics({ preTradeEstimationData }) {
  const { displayPov, displayPovColor, displayVolatility, warning } = usePreTradeAnayltics(preTradeEstimationData);
  return (
    <Grid container spacing={2}>
      <Grid xs={12}>
        <Typography variant='small1'>Pre-Trade Analytics</Typography>
      </Grid>
      <Grid xs={6}>
        <OrderInfoTypography header='Participation Rate' value={displayPov} valueColor={displayPovColor} />
      </Grid>
      <Grid xs={6}>
        <OrderInfoTypography header='Expected Volatility' value={displayVolatility} />
      </Grid>
      {warning && (
        <Grid xs={12}>
          <OrderInfoTypography value={warning} valueColor='warning.main' />
        </Grid>
      )}
    </Grid>
  );
}

function ExitConditionsSection({ orderData, accounts }) {
  const theme = useTheme();
  const exitConditions = orderData.exit_conditions || {};
  const takeProfit = exitConditions.takeProfitExit;
  const stopLoss = exitConditions.stopLossExit;

  // Only show if either TP or SL is set
  if (!takeProfit && !stopLoss) {
    return null;
  }

  const { side: selectedSide, pair: selectedPair, base_asset_qty: baseQty, quote_asset_qty: quoteQty } = orderData;
  const [base, quote] = selectedPair.split('-');

  // Determine quantity and asset for the orders
  let qty;
  let asset;
  if (baseQty) {
    qty = baseQty;
    asset = base;
  } else {
    qty = quoteQty;
    asset = quote;
  }

  // Create TP and SL order objects
  const exitOrders = [];

  if (takeProfit) {
    exitOrders.push({
      id: 'take-profit',
      type: 'Take Profit',
      side: selectedSide === 'buy' ? 'sell' : 'buy',
      price: takeProfit.price,
      exitType: takeProfit.type,
      qty,
      asset,
      condition: `${selectedPair}@${accounts[0]?.exchangeName || 'exchange'} ${selectedSide === 'buy' ? '>=' : '<='} ${takeProfit.price}`,
      color: 'success',
      percent: takeProfit.percent,
    });
  }

  if (stopLoss) {
    exitOrders.push({
      id: 'stop-loss',
      type: 'Stop Loss',
      side: selectedSide === 'buy' ? 'sell' : 'buy',
      price: stopLoss.price,
      exitType: stopLoss.type,
      trailing: stopLoss.trailing,
      qty,
      asset,
      condition: `${selectedPair}@${accounts[0]?.exchangeName || 'exchange'} ${selectedSide === 'buy' ? '<=' : '>='} ${stopLoss.price}`,
      color: 'error',
      percent: stopLoss.percent,
    });
  }

  return (
    <>
      <Divider />
      <Grid container spacing={2}>
        <Grid xs={12}>
          <Typography color='text' variant='small1'>
            Exit Conditions
          </Typography>
        </Grid>
        {exitOrders.map((exitOrder) =>
          (() => {
            let displayQty = qty;
            // Always use base asset for the icon
            const baseAsset = base;
            if (asset === quote && exitOrder.percent !== undefined) {
              if (exitOrder.id === 'take-profit') {
                displayQty = qty * (1 + exitOrder.percent);
              } else if (exitOrder.id === 'stop-loss') {
                displayQty = qty * (1 - exitOrder.percent);
              }
            }
            return (
              <Grid key={exitOrder.id} xs={12}>
                <Paper sx={{ pb: 2 }}>
                  <Grid container spacing={2} sx={{ p: 2 }}>
                    <Grid xs={12}>
                      <Stack alignItems='center' direction='row' spacing={1.5}>
                        {/* Add Chip for Take Profit or Stop Loss */}
                        <Typography component='span' sx={{ mr: 1 }}>
                          <span
                            style={{
                              display: 'inline-block',
                              background:
                                exitOrder.id === 'take-profit' ? theme.palette.success[500] : theme.palette.error[500],
                              color: 'var(--text-primary)',
                              borderRadius: 8,
                              fontSize: 12,
                              padding: '2px 8px',
                              fontWeight: 600,
                              letterSpacing: 0.5,
                            }}
                          >
                            {exitOrder.id === 'take-profit' ? 'Take Profit' : 'Stop Loss'}
                          </span>
                        </Typography>
                        <TokenIcon style={{ height: '20px', width: '20px' }} tokenName={baseAsset} />
                        <Typography variant='subtitle1'>{selectedPair}</Typography>
                        <Typography color={`side.${exitOrder.side}`} variant='subtitle1'>
                          - {exitOrder.side === 'buy' ? 'Buy' : 'Sell'}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid xs={6}>
                      <OrderInfoTypography header='Target Quantity' value={`${formatQty(displayQty)} ${asset}`} />
                    </Grid>
                    <Grid xs={6}>
                      <OrderInfoTypography header='Price' value={`${prettyPrice(exitOrder.price, 6)} ${quote}`} />
                    </Grid>
                    <Grid xs={6}>
                      <OrderInfoTypography
                        header='Type'
                        value={exitOrder.exitType ? exitOrder.exitType.toUpperCase() : ''}
                      />
                    </Grid>
                    {exitOrder.percent !== undefined && (
                      <Grid xs={6}>
                        <OrderInfoTypography header='Percentage' value={`${(exitOrder.percent * 100).toFixed(2)}%`} />
                      </Grid>
                    )}
                    <Grid xs={6}>
                      <OrderInfoTypography
                        header='Order Condition'
                        sx={{ wordBreak: 'break-word' }}
                        value={exitOrder.condition}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            );
          })()
        )}
      </Grid>
    </>
  );
}

function ScaleOrdersPreview({ order }) {
  // Handle both legacy scale_orders structure and new scale_order_count field
  const scale = order.scale_orders || null;
  const scaleOrderCount = order.scale_order_count;
  const { initialLoadValue } = useOrderForm();
  const { accounts } = initialLoadValue;

  // Preview ladder (may be provided by backend)
  const ladder = order.scale_preview || [];

  // Determine effective order count from explicit count or ladder size
  const rawCount = scaleOrderCount ?? (scale ? scale.order_count : undefined) ?? ladder.length;
  const effectiveCount = Number(rawCount);

  // Do not render section if count is not set or is 1 or less
  if (!Number.isFinite(effectiveCount) || effectiveCount <= 1) return null;

  // Use the effective count for display
  const orderCount = effectiveCount;
  const fromPriceRaw = order.scale_from_price || scale.from_price;
  const toPriceRaw = order.scale_to_price || scale.to_price;
  const priceSkew = order.scale_price_skew ?? scale.price_skew ?? 0;
  const sizeSkew = order.scale_size_skew ?? scale.size_skew ?? 0;

  const formatFromTo = (val) => {
    if (val === undefined || val === null) return '';
    const s = String(val).trim();
    if (s.endsWith('%') || s.includes('%')) return s;
    if (s.startsWith('+') || s.startsWith('-')) {
      const sign = s[0];
      const rest = s.slice(1);
      return `${sign}$${rest}`;
    }
    return `$${s}`;
  };

  const fromPrice = formatFromTo(fromPriceRaw);
  const toPrice = formatFromTo(toPriceRaw);

  return (
    <>
      <Divider />
      <Grid container spacing={2}>
        <Grid xs={12}>
          <Typography color='text' variant='small1'>
            Scale Orders
          </Typography>
        </Grid>
        {ladder.length > 0 ? (
          <Grid xs={12}>
            <Stack direction='column' spacing={1} sx={{ maxHeight: '220px', overflowY: 'auto', pr: 1 }}>
              {ladder.map((row, idx) => (
                <Stack direction='row' justifyContent='space-between' key={`scale-order-${row.price}-${row.qty}`}>
                  <Typography variant='body2'>#{idx + 1}</Typography>
                  <Typography variant='body2'>Price: {prettyPrice(row.price, 6)}</Typography>
                  <Typography variant='body2'>Qty: {formatQty(row.qty)}</Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
        ) : (
          <>
            <Grid xs={4}>
              <OrderInfoTypography header='# Orders' value={orderCount} />
            </Grid>
            <Grid xs={3}>
              <OrderInfoTypography header='From' value={fromPrice} />
            </Grid>
            <Grid xs={3}>
              <OrderInfoTypography header='To' value={toPrice} />
            </Grid>
            <Grid xs={3}>
              <OrderInfoTypography header='Price Skew' value={priceSkew} />
            </Grid>
            <Grid xs={3}>
              <OrderInfoTypography header='Size Skew' value={sizeSkew} />
            </Grid>
          </>
        )}
      </Grid>
    </>
  );
}

function OrderConfirmation({ isSubmitted, order, onClose, onConfirm }) {
  const {
    accounts: selectedAccounts,
    alpha_tilt: alphaTilt,
    side: selectedSide,
    duration: selectedDuration,
    engine_passiveness: passiveness,
    schedule_discretion: discretion,
    strategy_params: selectedStrategyParams,
    super_strategy: selectedStrategy,
    strategy: trajectory,
    updated_leverage: updatePairLeverage,
    stop_price: stopPrice,
    max_otc: maxOtcPercentage,
    limit_price: limitPrice,
    is_reverse_limit_price: isReverseLimitPrice,
    quote_asset_qty: quoteQty,
    base_asset_qty: baseQty,
    order_slices: orderSlices,
    pre_trade_data: preTradeEstimationData,
    pair: selectedPair,
    auto_order_metadata: autoOrderMetadata,
    start_datetime: startDatetime,
    pov_limit: povLimit,
    pov_target: povTarget,
    take_profit_price: takeProfitPrice,
    stop_loss_price: stopLossPrice,
  } = order;

  const { initialLoadValue, convertedQty, currentLeverage } = useOrderForm();

  const { accounts, trajectories, strategies } = initialLoadValue;
  // Pair
  const [base, quote] = selectedPair.split('-');
  const [token, _] = base.split(':');
  const pairDisplayIcon = getBaseTokenIcon(token);

  // Check if this is a perpetual pair for leverage display
  const isPerpetualPair = selectedPair?.market_type === 'perp';

  // Strategy/Trajectory
  let strategy = strategies[selectedStrategy];
  const isSimple = !strategy?.is_super_strategy;
  let traj = trajectories[trajectory];

  // If simple order, strategy is listed as the trajectory
  if (isSimple) {
    strategy = traj;
    traj = null;
  }

  const isPov = !!povLimit || !!povTarget;

  const isAuto = Object.keys(autoOrderMetadata).length > 0;

  let StrategyConfiguration;
  if (isAuto) {
    StrategyConfiguration = (
      <AutoStrategyConfiguration
        alphaTilt={alphaTilt}
        duration={selectedDuration}
        passiveness={passiveness}
        strategy={strategy.name}
      />
    );
  } else if (isSimple) {
    StrategyConfiguration = (
      <SimpleStrategyConfiguration
        isLimit={!!limitPrice}
        isPassiveOnly={selectedStrategyParams?.passive_only}
        isReduceOnly={selectedStrategyParams?.reduce_only}
        pairLeverage={updatePairLeverage}
        quote={quote}
        stopPrice={stopPrice}
      />
    );
  } else {
    StrategyConfiguration = (
      <AlgoStrategyConfiguration
        alphaTilt={alphaTilt}
        discretion={discretion}
        isLimit={!!limitPrice}
        isPassiveOnly={selectedStrategyParams?.passive_only}
        isReduceOnly={selectedStrategyParams?.reduce_only}
        isStrictDuration={selectedStrategyParams?.strict_duration}
        maxClipSize={selectedStrategyParams?.max_clip_size}
        maxOtcPercentage={maxOtcPercentage}
        passiveness={passiveness}
        povLimit={povLimit}
        povTarget={povTarget}
        trajectory={traj.name}
        updatePairLeverage={updatePairLeverage}
      />
    );
  }

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100%' }}>
      <CardHeader
        title={
          <Stack alignItems='center' direction='row' justifyContent='space-between'>
            <Typography variant='h6'>Order Confirmation</Typography>
            <IconButton aria-label='Close' onClick={onClose}>
              <CloseIcon fontSize='small' />
            </IconButton>
          </Stack>
        }
      />
      <Divider />
      <CardContent sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <Stack direction='column' spacing={2}>
          <Summary
            accounts={accounts}
            base={base}
            currentLeverage={currentLeverage}
            isAuto={isAuto}
            isEntryEnabled={selectedStrategyParams?.entry}
            isPerpetualPair={isPerpetualPair}
            isPov={isPov}
            isReverseLimitPrice={isReverseLimitPrice}
            isSimple={isSimple}
            limitPrice={limitPrice}
            orderSlices={orderSlices}
            pairDisplayIcon={pairDisplayIcon}
            quote={quote}
            selectedAccounts={selectedAccounts}
            selectedDuration={selectedDuration}
            selectedPair={selectedPair}
            selectedSide={selectedSide}
            strategy={strategy}
            targetNotional={quoteQty || convertedQty}
            targetQuantity={baseQty || convertedQty}
          />
          <Divider />
          <Grid container spacing={2}>
            <Grid xs={12}>
              <Typography color='text' variant='small1'>
                Strategy Configuration
              </Typography>
            </Grid>
            {StrategyConfiguration}
          </Grid>

          {startDatetime && !isSimple && !isAuto && (
            <>
              <Divider />
              <Scheduled duration={selectedDuration} startDatetime={startDatetime} />
            </>
          )}
          <Divider />
          <PreTradeAnalytics preTradeEstimationData={preTradeEstimationData} />

          <ExitConditionsSection accounts={accounts} orderData={order} />

          <ScaleOrdersPreview order={order} />
        </Stack>
      </CardContent>
      <Divider />
      <CardActions sx={{ p: 3, pt: 2, gap: 2, justifyContent: 'flex-end' }}>
        <Button variant='outlined' onClick={onClose}>
          Cancel
        </Button>
        <Button
          color={selectedSide === 'buy' ? 'success' : 'error'}
          disabled={isSubmitted}
          variant='contained'
          onClick={onConfirm}
        >
          {isSubmitted ? (
            <CircularProgress size={20} />
          ) : (
            <Typography color='text.offBlack' style={{ whiteSpace: 'nowrap' }}>
              Place {capitalize(selectedSide)} Order
            </Typography>
          )}
        </Button>
      </CardActions>
    </Card>
  );
}

function MultiChildCard({ accounts, order }) {
  const { accounts: selectedAccounts, pair, base_asset_qty, quote_asset_qty } = order;

  const [pairBase, quote] = pair.split('-');

  let qty;
  let asset;
  if (base_asset_qty) {
    qty = base_asset_qty;
    asset = pairBase;
  } else {
    qty = quote_asset_qty;
    asset = quote;
  }

  const iconToken = pairBase.includes(':') ? pairBase.split(':')[0] : pairBase;

  return (
    <Paper>
      <Grid container spacing={2} sx={{ p: 2 }}>
        <Grid xs={12}>
          <Stack alignItems='center' direction='row' spacing={1.5}>
            <TokenIcon style={{ height: '20px', width: '20px' }} tokenName={iconToken} />
            <Typography variant='subtitle1'>{pair}</Typography>
          </Stack>
        </Grid>
        <Grid xs={6}>
          <OrderInfoTypography header='Target Quantity' value={`${formatQty(qty)} ${asset}`} />
        </Grid>
        <Grid sx={{ wordBreak: 'break-word', whiteSpace: 'normal' }} xs={6}>
          <OrderInfo header='Accounts'>
            <OrderAccounts accounts={accounts} selectedAccounts={selectedAccounts} />
          </OrderInfo>
        </Grid>
      </Grid>
    </Paper>
  );
}

function MultiChildSection({ accounts, orders, side }) {
  return (
    <Stack direction='column' spacing={4}>
      <Typography color={`side.${side}`} variant='h5'>
        {side === 'buy' ? 'Buy' : 'Sell'} ({orders.length} pairs)
      </Typography>
      <Stack
        direction='column'
        spacing={1.5}
        sx={{
          boxSizing: 'border-box',
          maxHeight: '350px',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarGutter: 'stable',
          py: 2,
        }}
      >
        {orders.map((order) => (
          <MultiChildCard
            accounts={accounts}
            key={`${order.pair}|${order.base_asset_qty}|${order.quote_asset_qty}`}
            order={order}
          />
        ))}
      </Stack>
    </Stack>
  );
}

function MultiOrderStrategyConfiguration({
  duration,
  trajectory,
  passiveness,
  exposureTolerance,
  discretion,
  alphaTilt,
  isPassiveOnly,
  isActiveLimit,
  isReduceOnly,
  isStrictDuration,
  maxClipSize,
  limitPriceSpread,
}) {
  return (
    <Grid container spacing={2}>
      <Grid xs={12}>
        <Typography color='text' variant='small1'>
          Strategy Configuration
        </Typography>
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Duration'
          highlight={duration !== defaultStrategySettings.duration}
          value={`${prettyPrice(duration / 60, 2)} min(s)`}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Trajectory'
          highlight={trajectory !== defaultStrategySettings.trajectory}
          value={trajectory}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography header='Exposure Tolerance' value={exposureTolerance} />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Passiveness'
          highlight={passiveness !== defaultStrategySettings.passiveness}
          value={passiveness}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Discretion'
          highlight={discretion !== defaultStrategySettings.discretion}
          value={discretion}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Alpha Tilt'
          highlight={alphaTilt !== defaultStrategySettings.alphaTilt}
          value={alphaTilt}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Passive Only'
          highlight={isPassiveOnly !== defaultStrategySettings.passive_only}
          value={isPassiveOnly ? 'Yes' : 'No'}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Active Limit'
          highlight={isActiveLimit !== defaultStrategySettings.activeLimit}
          value={isActiveLimit ? 'Yes' : 'No'}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Reduce Only'
          highlight={isReduceOnly !== defaultStrategySettings.reduce_only}
          value={isReduceOnly ? 'Yes' : 'No'}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Strict Duration'
          highlight={isStrictDuration !== defaultStrategySettings.strict_duration}
          value={isStrictDuration ? 'Yes' : 'No'}
        />
      </Grid>
      <Grid xs={3}>
        <OrderInfoTypography
          header='Max Clip Size'
          highlight={!!maxClipSize}
          value={maxClipSize ? numberWithCommas(maxClipSize) : 'Adaptive'}
        />
      </Grid>
      {limitPriceSpread && (
        <Grid xs={3}>
          <OrderInfoTypography header='Limit Price Spread' value={formatQty(limitPriceSpread, true)} />
        </Grid>
      )}
    </Grid>
  );
}

function MultiOrderConfirmation({
  data,
  onClose,
  onConfirm,
  submitLoading,
  mode = 'confirm',
  onEdit,
  confirmDisabled = false,
}) {
  const theme = useTheme();
  const {
    child_orders: childOrders,
    alpha_tilt: alphaTilt,
    duration,
    engine_passiveness: passiveness,
    exposure_tolerance: exposureTolerance,
    schedule_discretion: discretion,
    strategy_params: strategyParams,
    strategy: trajectoryId,
    strategies,
    accounts,
    limit_price_spread: limitPriceSpread,
  } = data;

  const buyChilds = childOrders.filter((c) => c.side === 'buy');
  const sellChilds = childOrders.filter((c) => c.side === 'sell');

  const trajectory = strategies[trajectoryId];
  const isResubmit = mode === 'resubmit';

  const actionLabel = isResubmit ? 'Resubmit' : 'Submit Multi Order';
  const titleLabel = isResubmit ? 'Resubmit Multi Order' : 'Multi Order Confirmation';
  const dividerColor = theme.palette.divider;
  const textOnPrimary = theme.palette.getContrastText(theme.palette.primary.main);

  const handleConfirm = (event) => {
    event?.preventDefault?.();
    if (!confirmDisabled && !submitLoading && onConfirm) {
      onConfirm(event);
    }
  };

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <Stack alignItems='center' direction='row' justifyContent='space-between'>
            <Typography variant='h6'>{titleLabel}</Typography>
            <IconButton aria-label='Close' onClick={onClose}>
              <CloseIcon fontSize='small' />
            </IconButton>
          </Stack>
        }
      />
      <Divider />
      <CardContent sx={{ flex: 1, overflowY: 'auto' }}>
        <Stack direction='column' spacing={4} sx={{ p: 5 }}>
          <Grid container>
            <Grid sx={{ pr: 4, borderRight: `1px solid ${dividerColor}` }} xs={6}>
              <MultiChildSection accounts={accounts} orders={buyChilds} side='buy' />
            </Grid>
            <Grid sx={{ pl: 4 }} xs={6}>
              <MultiChildSection accounts={accounts} orders={sellChilds} side='sell' />
            </Grid>
          </Grid>
          <Divider />
          <MultiOrderStrategyConfiguration
            alphaTilt={alphaTilt}
            discretion={discretion}
            duration={duration}
            exposureTolerance={exposureTolerance}
            isActiveLimit={strategyParams.active_limit}
            isPassiveOnly={strategyParams.passive_only}
            isReduceOnly={strategyParams.reduce_only}
            isStrictDuration={strategyParams.strict_duration}
            limitPriceSpread={limitPriceSpread}
            maxClipSize={strategyParams.max_clip_size}
            passiveness={passiveness}
            trajectory={trajectory.name}
          />
        </Stack>
      </CardContent>
      <CardActions sx={{ p: 4 }}>
        <Stack alignItems='center' direction='row' justifyContent='flex-end' spacing={2} sx={{ width: '100%' }}>
          {isResubmit && (
            <Button
              color='primary'
              disabled={submitLoading}
              variant='outlined'
              onClick={(event) => {
                event?.preventDefault?.();
                onEdit?.(event);
              }}
            >
              Edit
            </Button>
          )}
          <Button
            color='primary'
            disabled={submitLoading || confirmDisabled}
            variant='contained'
            onClick={handleConfirm}
          >
            {submitLoading ? (
              <CircularProgress size={20} />
            ) : (
              <Typography color={textOnPrimary} variant='button2'>
                {actionLabel}
              </Typography>
            )}
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
}

export { OrderConfirmation, MultiOrderConfirmation };
