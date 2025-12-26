import React from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Divider,
  Typography,
  IconButton,
  Paper,
  CircularProgress,
  Stack,
  Grid,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { OrderInfo, OrderInfoTypography } from '@/shared/orderDetail/OrderInfo';
import OrderAccounts from '@/shared/orderDetail/OrderAccounts';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import getBaseTokenIcon from '@images/tokens';
import { capitalize, prettyPrice, numberWithCommas, formatQty } from '@/util';

// Utility to format duration in min(s), hr(s), or day(s) from seconds
function formatDuration(seconds) {
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(0)} min(s)`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(2)} hr(s)`;
  return `${(minutes / 1440).toFixed(2)} day(s)`;
}

function ChainedOrderSummary({
  pairDisplayIcon,
  selectedPair,
  base,
  quote,
  selectedSide,
  accounts,
  selectedAccounts,
  totalBaseQty,
  totalQuoteQty,
  strategy,
  limitPrice,
  isReverseLimitPrice,
  totalDuration,
  orderCount,
  hasQuoteQty,
  shouldShowNotional,
  shouldShowBaseQty,
}) {
  const { initialLoadValue } = useOrderForm();
  const { strategies, trajectories } = initialLoadValue;

  let strategyObj = strategies[strategy];
  const isSimple = !strategyObj?.is_super_strategy;
  let traj = trajectories[strategy];
  if (isSimple) {
    strategyObj = traj;
    traj = null;
  }

  return (
    <Grid container alignItems='center' spacing={2}>
      <Grid item xs={12}>
        <Stack alignItems='center' direction='row' spacing={1}>
          <img alt='Token Icon' src={pairDisplayIcon} style={{ height: '20px', width: '20px' }} />
          <Typography variant='h6'>{selectedPair}</Typography>
          <Typography variant='h6'>-</Typography>
          <Typography color={`side.${selectedSide}`} variant='h6'>
            {capitalize(selectedSide)}
          </Typography>
        </Stack>
      </Grid>
      <Grid item xs={4}>
        <OrderInfoTypography
          header='Target Quantity'
          value={<b>{shouldShowBaseQty ? `${prettyPrice(totalBaseQty)} ${base}` : 'N/A'}</b>}
          valueVariant='subtitle1'
        />
      </Grid>
      <Grid item xs={4}>
        <OrderInfoTypography
          header='Target Notional'
          value={<b>{shouldShowNotional ? `${prettyPrice(totalQuoteQty, 2)} ${quote}` : 'N/A'}</b>}
          valueVariant='subtitle1'
        />
      </Grid>
      <Grid item xs={4}>
        <OrderInfo header='Accounts'>
          <OrderAccounts accounts={accounts} selectedAccounts={selectedAccounts} />
        </OrderInfo>
      </Grid>
      <Grid item xs={4}>
        <OrderInfoTypography header='Strategy' value={strategyObj?.name || 'Unknown'} />
      </Grid>
      <Grid item xs={4}>
        <OrderInfoTypography header='Total Duration' value={formatDuration(totalDuration)} />
      </Grid>
      {limitPrice && (
        <Grid item xs={4}>
          <OrderInfoTypography header='Limit Price' value={limitPrice} />
        </Grid>
      )}
    </Grid>
  );
}

function ChainedOrderStrategyConfiguration({ chainedOrderData, strategy }) {
  const { initialLoadValue } = useOrderForm();
  const { strategies, trajectories } = initialLoadValue;
  let strategyObj = strategies[strategy];
  const isSimple = !strategyObj?.is_super_strategy;
  let traj = trajectories[strategy];
  if (isSimple) {
    strategyObj = traj;
    traj = null;
  }

  // Extract strategy parameters from the first order in the chain
  const firstOrder = chainedOrderData.orders_in_chain[0];
  const strategyParams = firstOrder.strategy_params || {};

  return (
    <Grid container alignItems='center' spacing={2}>
      <Grid item xs={3}>
        <OrderInfoTypography header='Strategy' value={strategyObj?.name || 'Unknown'} />
      </Grid>
      <Grid item xs={3}>
        <OrderInfoTypography header='Engine Passiveness' value={chainedOrderData.engine_passiveness} />
      </Grid>
      <Grid item xs={3}>
        <OrderInfoTypography header='Schedule Discretion' value={chainedOrderData.schedule_discretion} />
      </Grid>
      <Grid item xs={3}>
        <OrderInfoTypography
          header='Duration per Order'
          value={formatDuration(chainedOrderData.orders_in_chain[0].duration)}
        />
      </Grid>
      {strategyParams.passive_only !== undefined && (
        <Grid item xs={3}>
          <OrderInfoTypography header='Passive Only' value={strategyParams.passive_only ? 'Yes' : 'No'} />
        </Grid>
      )}
      {strategyParams.reduce_only !== undefined && (
        <Grid item xs={3}>
          <OrderInfoTypography header='Reduce Only' value={strategyParams.reduce_only ? 'Yes' : 'No'} />
        </Grid>
      )}
      {strategyParams.strict_duration !== undefined && (
        <Grid item xs={3}>
          <OrderInfoTypography header='Strict Duration' value={strategyParams.strict_duration ? 'Yes' : 'No'} />
        </Grid>
      )}
      {strategyParams.max_clip_size && (
        <Grid item xs={3}>
          <OrderInfoTypography header='Max Clip Size' value={numberWithCommas(strategyParams.max_clip_size)} />
        </Grid>
      )}
      {strategyParams.ool_pause !== undefined && (
        <Grid item xs={3}>
          <OrderInfoTypography header='OOL Pause' value={strategyParams.ool_pause ? 'Yes' : 'No'} />
        </Grid>
      )}
    </Grid>
  );
}

function ChainedOrderDetails({
  chainedOrderData,
  totalBaseQty,
  totalQuoteQty,
  base,
  quote,
  convertedQty,
  hasBaseQty,
  hasQuoteQty,
}) {
  const orderCount = chainedOrderData.orders_in_chain.length;
  const baseQtyPerOrder = chainedOrderData.orders_in_chain[0].base_asset_qty || 0;
  const quoteQtyPerOrder = chainedOrderData.orders_in_chain[0].quote_asset_qty || 0;
  const limitPrice = chainedOrderData.orders_in_chain[0].limit_price;

  // Calculate quantities per order from convertedQty if the original quantity is not provided
  // If only base quantity is provided, convertedQty will be the total quote quantity, so divide by orderCount
  // If only quote quantity is provided, convertedQty will be the total base quantity, so divide by orderCount
  const calculatedQuoteQtyPerOrder =
    !hasQuoteQty && convertedQty && hasBaseQty ? convertedQty / orderCount : quoteQtyPerOrder;
  const calculatedBaseQtyPerOrder =
    !hasBaseQty && convertedQty && hasQuoteQty ? convertedQty / orderCount : baseQtyPerOrder;

  return (
    <Stack direction='column' spacing={2}>
      <Typography color='text.secondary' variant='h6'>
        Chained Order Details
      </Typography>
      <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
        <Grid container spacing={2}>
          {chainedOrderData.orders_in_chain.map((order, index) => {
            const exitConditions = order.exit_conditions || {};
            const takeProfit = exitConditions.takeProfitExit;
            const stopLoss = exitConditions.stopLossExit;
            const [orderBase, orderQuote] = order.pair.split('-');
            return (
              <Grid item key={`chained-order-${order.priority}`} xs={12}>
                <Paper elevation={1} sx={{ p: 2, backgroundColor: 'background.container', m: 0 }}>
                  <Stack alignItems='center' direction='row' justifyContent='space-between' sx={{ mb: 1 }}>
                    <Typography fontWeight='bold' variant='subtitle1'>
                      Order {index + 1} of {orderCount}
                    </Typography>
                  </Stack>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <OrderInfoTypography header='Duration' value={formatDuration(order.duration)} />
                    </Grid>
                    <Grid item xs={6}>
                      <OrderInfoTypography
                        header='Base Quantity'
                        value={order.base_asset_qty ? `${formatQty(order.base_asset_qty)} ${orderBase}` : '-'}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <OrderInfoTypography
                        header='Quote Quantity'
                        value={order.quote_asset_qty ? `${formatQty(order.quote_asset_qty)} ${orderQuote}` : '-'}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <OrderInfoTypography header='Limit Price' value={order.limit_price || '-'} />
                    </Grid>
                    {/* Exit Conditions for this order */}
                    {takeProfit && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 1, backgroundColor: 'background.paper', mt: 1 }}>
                          <Typography color='success.main' variant='subtitle2'>
                            Take Profit
                          </Typography>
                          <Typography variant='body2'>Price: {takeProfit.price}</Typography>
                          <Typography variant='body2'>
                            Type: {takeProfit.type && takeProfit.type.toUpperCase()}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}
                    {stopLoss && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 1, backgroundColor: 'background.paper', mt: 1 }}>
                          <Typography color='error.main' variant='subtitle2'>
                            Stop Loss
                          </Typography>
                          <Typography variant='body2'>Price: {stopLoss.price}</Typography>
                          <Typography variant='body2'>Type: {stopLoss.type && stopLoss.type.toUpperCase()}</Typography>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Stack>
  );
}

function ChainedOrderConfirmation({ isSubmitted, chainedOrderData, onClose, onConfirm }) {
  const { initialLoadValue, convertedQty, formPageType } = useOrderForm();
  const { accounts, strategies, trajectories } = initialLoadValue;

  // Extract data from the first order in chain for display
  const firstOrder = chainedOrderData.orders_in_chain[0];
  const selectedPair = firstOrder.pair;
  const selectedSide = firstOrder.side;
  const limitPrice = firstOrder.limit_price;
  const { strategy } = chainedOrderData;

  // Calculate totals
  const orderCount = chainedOrderData.orders_in_chain.length;
  const totalDuration = firstOrder.duration * orderCount;
  const baseQtyPerOrder = firstOrder.base_asset_qty || 0;
  const quoteQtyPerOrder = firstOrder.quote_asset_qty || 0;
  const totalBaseQty = baseQtyPerOrder * orderCount;
  const totalQuoteQty = quoteQtyPerOrder * orderCount;
  const hasQuoteQty = !!firstOrder.quote_asset_qty;
  const hasBaseQty = !!firstOrder.base_asset_qty;

  // Use convertedQty to calculate missing quantity for display
  // If only base quantity is provided, convertedQty will be the quote quantity
  // If only quote quantity is provided, convertedQty will be the base quantity
  const calculatedTotalQuoteQty = !hasQuoteQty && convertedQty && hasBaseQty ? convertedQty : totalQuoteQty;
  const calculatedTotalBaseQty = !hasBaseQty && convertedQty && hasQuoteQty ? convertedQty : totalBaseQty;

  const shouldShowNotional = hasQuoteQty || (convertedQty && hasBaseQty);
  const shouldShowBaseQty = hasBaseQty || (convertedQty && hasQuoteQty);

  // Pair
  const [base, quote] = selectedPair.split('-');
  const [token, _] = base.split(':');
  const pairDisplayIcon = getBaseTokenIcon(token);

  // If this is the chained order entry form, do NOT do any splitting logic
  const isChainedOrderPage = formPageType === 'ChainedOrderPage';

  return (
    <Card sx={{ display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={
          <Stack alignItems='center' direction='row' justifyContent='space-between'>
            <Typography variant='h6'>Chained Order Confirmation</Typography>
            <IconButton aria-label='Close' onClick={onClose}>
              <CloseIcon fontSize='small' />
            </IconButton>
          </Stack>
        }
      />
      <Divider />
      <CardContent sx={{ flex: 1, overflowY: 'auto' }}>
        <Stack direction='column' spacing={2}>
          <ChainedOrderSummary
            accounts={accounts}
            base={base}
            hasQuoteQty={hasQuoteQty}
            isReverseLimitPrice={false}
            limitPrice={limitPrice}
            orderCount={orderCount}
            pairDisplayIcon={pairDisplayIcon}
            quote={quote}
            selectedAccounts={chainedOrderData.accounts}
            selectedPair={selectedPair}
            selectedSide={selectedSide}
            shouldShowBaseQty={shouldShowBaseQty}
            shouldShowNotional={shouldShowNotional}
            strategy={strategy}
            totalBaseQty={calculatedTotalBaseQty}
            totalDuration={totalDuration}
            totalQuoteQty={calculatedTotalQuoteQty}
          />
          <Divider />
          <Grid container spacing={2}>
            <Grid xs={12}>
              <Typography color='text' variant='small1'>
                Strategy Configuration
              </Typography>
            </Grid>
            <ChainedOrderStrategyConfiguration chainedOrderData={chainedOrderData} strategy={strategy} />
          </Grid>
          <Divider />
          {isChainedOrderPage ? (
            // Just show each order as-is, no splitting logic
            <Stack direction='column' spacing={2}>
              <Typography color='text.secondary' variant='h6'>
                Chained Order Details
              </Typography>
              <Box sx={{ maxHeight: 350, overflowY: 'auto' }}>
                <Grid container spacing={2}>
                  {chainedOrderData.orders_in_chain.map((order, index) => {
                    // Get base and quote for this order
                    const [orderBase, orderQuote] = order.pair.split('-');
                    return (
                      <Grid item key={`chained-order-${order.priority}`} xs={12}>
                        <Paper elevation={1} sx={{ p: 2, backgroundColor: 'background.container', m: 0 }}>
                          <Stack alignItems='center' direction='row' justifyContent='space-between' sx={{ mb: 1 }}>
                            <Typography fontWeight='bold' variant='subtitle1'>
                              Order {index + 1} of {orderCount}
                            </Typography>
                          </Stack>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <OrderInfoTypography header='Duration' value={formatDuration(order.duration)} />
                            </Grid>
                            <Grid item xs={6}>
                              <OrderInfoTypography
                                header='Base Quantity'
                                value={order.base_asset_qty ? `${formatQty(order.base_asset_qty)} ${orderBase}` : '-'}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <OrderInfoTypography
                                header='Quote Quantity'
                                value={
                                  order.quote_asset_qty ? `${formatQty(order.quote_asset_qty)} ${orderQuote}` : '-'
                                }
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <OrderInfoTypography header='Limit Price' value={order.limit_price || '-'} />
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </Stack>
          ) : (
            // Default: splitting logic for normal order entry form
            <ChainedOrderDetails
              base={base}
              chainedOrderData={chainedOrderData}
              convertedQty={convertedQty}
              hasBaseQty={hasBaseQty}
              hasQuoteQty={hasQuoteQty}
              quote={quote}
              totalBaseQty={calculatedTotalBaseQty}
              totalQuoteQty={calculatedTotalQuoteQty}
            />
          )}
        </Stack>
      </CardContent>
      <CardActions sx={{ p: 4 }}>
        <Button
          fullWidth
          color={selectedSide === 'buy' ? 'success' : 'error'}
          disabled={isSubmitted}
          variant='contained'
          onClick={onConfirm}
        >
          {isSubmitted ? (
            <CircularProgress size={20} />
          ) : (
            <Typography color='text.offBlack' style={{ whiteSpace: 'nowrap' }}>
              Place {orderCount} Chained {capitalize(selectedSide)} Orders
            </Typography>
          )}
        </Button>
      </CardActions>
    </Card>
  );
}

export default ChainedOrderConfirmation;
