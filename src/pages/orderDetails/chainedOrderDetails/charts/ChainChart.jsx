import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Link,
  Grid,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
  IconButton,
  Stack,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableContainer,
  Chip,
  Paper,
} from '@mui/material';
import { ArrowDownward, RemoveCircleOutline, TrendingUp, TrendingDown } from '@mui/icons-material';
import { useTheme } from '@emotion/react';
import {
  BASEURL,
  capitalizeFirstLetter,
  calculateDurationDisplay,
  smartRound,
  chooseKeys,
  isEmpty,
  titleCase,
  getTrajectoryName,
  getStrategyName,
} from '../../../../util';
import ProgressBar from '../../../../shared/fields/ProgressBar/ProgressBar';
import { StyledBorderTableCell, StyledHeaderTableCell } from '../../../../shared/orderTable/util';

function ChainChart({
  orders_in_chain,
  orderView = true,
  handleDeleteOnClick,
  handlePriorityChange,
  strategies,
  trajectories,
  superStrategies,
  orderBenchmark,
}) {
  const maxPriority = !isEmpty(orders_in_chain)
    ? orders_in_chain.reduce((acc, order) => {
        if (order.priority > acc) return order.priority;
        return acc;
      }, 0) + 1
    : 1;

  const theme = useTheme();

  if (!orders_in_chain) {
    return (
      <Box align='center' mt={2}>
        <Typography color='error' variant='body1'>
          Order data is not available.
        </Typography>
      </Box>
    );
  }

  const groupedOrders = orders_in_chain.reduce((acc, orderData) => {
    const { priority } = orderData;
    if (!acc[priority]) {
      acc[priority] = [];
    }
    acc[priority].push(orderData);
    return acc;
  }, {});

  const sortedPriorities = Object.keys(groupedOrders).sort((a, b) => a - b);

  const getStatusBorderColor = (status) => {
    switch (status) {
      case 'SUBMITTED':
      case 'ACTIVE':
        return theme.palette.primary.main;
      case 'PAUSED':
        return theme.palette.grey.main;
      case 'FINISHER':
        return theme.palette.primary.light;
      case 'COMPLETE':
        return theme.palette.success.main;
      case 'CANCELED':
        return theme.palette.charts.red;
      case 'SCHEDULED':
        return theme.palette.secondary.main;
      default:
        return theme.palette.grey.main;
    }
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'SUBMITTED':
      case 'ACTIVE':
        return 'primary';
      case 'PAUSED':
        return 'default';
      case 'FINISHER':
        return 'info';
      case 'COMPLETE':
        return 'success';
      case 'CANCELED':
        return 'error';
      case 'SCHEDULED':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const splitByLastDash = (str) => {
    const lastIndex = str.lastIndexOf('-');
    if (lastIndex === -1) return [str];
    return [str.slice(0, lastIndex), str.slice(lastIndex + 1)];
  };

  const targetQtyDisplay = (orderData) => {
    const qty = orderData?.base_asset_qty ? orderData?.base_asset_qty : orderData?.quote_asset_qty;

    const splitPair = splitByLastDash(orderData.pair);

    const token = orderData?.base_asset_qty ? splitPair[0] : splitPair[1];

    return `${qty} ${token}`;
  };

  const orderViewPriorityCard = (order, colSize) => {
    const relevantBenchmarks = ['notional', 'vwap_cost', 'arrival_cost', 'fee_notional', 'pov'];
    const specifiedOrderBenchmark = orderBenchmark[order.id] || {};

    const parsedBenchmarkData = relevantBenchmarks.reduce((acc, e) => {
      const value = specifiedOrderBenchmark[e];
      switch (value) {
        case 'pov':
          acc[e] = value ? `${Number(value).toFixed(2)}%` : 'N/A';
          return acc;
        case 'notional':
        case 'fee_notional':
          acc[e] = value !== undefined ? `$${smartRound(Number(value))}` : 'N/A';
          return acc;
        default:
          acc[e] = value !== undefined ? `${smartRound(Number(value))}` : 'N/A';
          return acc;
      }
    }, {});

    const { notional, vwap_cost, arrival_cost, fee_notional, pov } = parsedBenchmarkData;

    const isActive = order.status === 'ACTIVE' || order.status === 'SUBMITTED';
    const baseBorderColor = getStatusBorderColor(order.status || order.status);

    return (
      <Grid item key={order.id} xs={colSize}>
        <Link color='inherit' href={`${BASEURL}/order/${order.id}`} target='_blank' underline='none'>
          <Card
            sx={{
              mb: 2,
              cursor: 'pointer',
              position: 'relative',
              zIndex: 1,
              borderWidth: 2,
              borderColor: baseBorderColor,
              borderStyle: 'solid',
              width: '100%',
              height: '100%',
              transition: 'all 0.2s ease-in-out',
              ...(isActive && {
                borderImage: `linear-gradient(45deg, ${baseBorderColor}, ${theme.palette.warning.main}, ${theme.palette.primary.light}, ${baseBorderColor}) 1`,
                borderImageSlice: 1,
                animation: 'rotateBorder 2s linear infinite',
                '@keyframes rotateBorder': {
                  '0%': {
                    borderImageSource: `linear-gradient(0deg, ${baseBorderColor}, ${theme.palette.warning.main}, ${theme.palette.primary.light}, ${baseBorderColor})`,
                  },
                  '25%': {
                    borderImageSource: `linear-gradient(90deg, ${baseBorderColor}, ${theme.palette.warning.main}, ${theme.palette.primary.light}, ${baseBorderColor})`,
                  },
                  '50%': {
                    borderImageSource: `linear-gradient(180deg, ${baseBorderColor}, ${theme.palette.warning.main}, ${theme.palette.primary.light}, ${baseBorderColor})`,
                  },
                  '75%': {
                    borderImageSource: `linear-gradient(270deg, ${baseBorderColor}, ${theme.palette.warning.main}, ${theme.palette.primary.light}, ${baseBorderColor})`,
                  },
                  '100%': {
                    borderImageSource: `linear-gradient(360deg, ${baseBorderColor}, ${theme.palette.warning.main}, ${theme.palette.primary.light}, ${baseBorderColor})`,
                  },
                },
              }),
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[8],
              },
            }}
            variant='outlined'
          >
            <CardContent sx={{ p: 3  }}>
              {/* Header Section */}
              <Grid container spacing={2} sx={{ mb: 1 }}>
                <Grid item xs={12}>
                  <Stack alignItems="center" direction="row" justifyContent="space-between">
                    <Typography color="primary" variant="h6">
                      {order.account_names || 'N/A'}
                    </Typography>
                    <Chip
                      color={getStatusChipColor(order.status)}
                      label={order.status || 'N/A'}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </Grid>
              </Grid>

              {/* Main Content - Two Column Layout */}
              <Grid container spacing={3}>
                {/* Left Column - Main Order Info */}
                <Grid item xs={7}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Stack spacing={1}>
                        <Typography color="text.secondary" variant="body2">
                          Side
                        </Typography>
                        <Stack alignItems="center" direction="row" spacing={1}>
                          {order.side === 'buy' ? (
                            <TrendingUp color="success" fontSize="small" />
                          ) : (
                            <TrendingDown color="error" fontSize="small" />
                          )}
                          <Typography color={order.side === 'buy' ? 'success.main' : 'error.main'} variant="body1">
                            {capitalizeFirstLetter(order.side || 'N/A')}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack spacing={1}>
                        <Typography color="text.secondary" variant="body2">
                          Pair
                        </Typography>
                        <Typography fontWeight="bold" variant="body1">
                          {order.pair || 'N/A'}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack spacing={1}>
                        <Typography color="text.secondary" variant="body2">
                          Quantity
                        </Typography>
                        <Typography variant="body1">
                          {order.buy_token_amount
                            ? `${order.buy_token_amount} ${order.market_type !== 'option' ? order.buy_token : 'Contracts'}`
                            : `${order.sell_token_amount} ${order.market_type !== 'option' ? order.sell_token : 'Contracts'}`}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack spacing={1}>
                        <Typography color="text.secondary" variant="body2">
                          Strategy
                        </Typography>
                        <Typography variant="body1">
                          {order.super_strategy_name || order.trajectory_name}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack spacing={1}>
                        <Typography color="text.secondary" variant="body2">
                          Duration
                        </Typography>
                        <Typography variant="body1">
                          {calculateDurationDisplay(order.duration)}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack spacing={1}>
                        <Typography color="text.secondary" variant="body2">
                          Progress
                        </Typography>
                        <ProgressBar fullWidth isPov progress={Math.round(Number(order.pct_filled?.toFixed(2)))} />
                      </Stack>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Right Column - Performance Metrics */}
                <Grid item xs={5}>
                  <Stack spacing={2}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Stack spacing={0.5}>
                          <Typography color="text.secondary" variant="body2">
                            Executed Notional
                          </Typography>
                          <Typography fontWeight="medium" variant="body1">
                            ${notional}
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={6}>
                        <Stack spacing={0.5}>
                          <Typography color="text.secondary" variant="body2">
                            Slippage
                          </Typography>
                          <Typography
                            color={arrival_cost > 0 ? theme.palette.charts.red : theme.palette.charts.green}
                            variant="body1"
                          >
                            {arrival_cost} bps
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={6}>
                        <Stack spacing={0.5}>
                          <Typography color="text.secondary" variant="body2">
                            VWAP Slippage
                          </Typography>
                          <Typography
                            color={vwap_cost > 0 ? theme.palette.charts.red : theme.palette.charts.green}
                            variant="body1"
                          >
                            {vwap_cost} bps
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={6}>
                        <Stack spacing={0.5}>
                          <Typography color="text.secondary" variant="body2">
                            Exchange Fee
                          </Typography>
                          <Typography fontWeight="medium" variant="body1">
                            ${fee_notional}
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={12}>
                        <Stack spacing={0.5}>
                          <Typography color="text.secondary" variant="caption">
                            Participation Rate
                          </Typography>
                          <Typography fontWeight="medium" variant="body1">
                            {pov}%
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Link>
      </Grid>
    );
  };

  const orderEntryPriorityCard = (orderData, colSize) => {
    const getDisplayNames = {
      accounts: 'Accounts',
      pair: 'Pair',
      side: 'Side',
      base_asset_qty: 'Base Quantity',
      quote_asset_qty: 'Quote Quantity',
      super_strategy: 'Super Strategy',
      strategy: 'Strategy',
      duration: 'Duration',
      engine_passiveness: 'Passiveness',
      alpha_tilt: 'Alpha Tilt',
      schedule_discretion: 'Discretion',
      notes: 'Notes',
      limit_price: 'Limit Price',
      updated_leverage: 'Updated Leverage',
      pov_limit: 'Participation Rate Limit',
      pov_target: 'Participation Rate Target',
      target_time: 'Target Time',
      strategy_params: 'Strategy Params',
      order_condition: 'Order Condition',
    };

    // Can refactor this with useSubmitForm getDisplayValues
    const getDisplayValues = () => {
      const templateValueMapping = {};

      Object.entries(orderData).forEach(([k, v]) => {
        const displayKey = k;
        switch (k) {
          case 'accounts':
            templateValueMapping[displayKey] = v
              ? v.map((names, index) => {
                  if (index === v.length - 1) {
                    return `${names}`;
                  }
                  return `${names} | `;
                })
              : '';
            break;
          case 'side':
            templateValueMapping[displayKey] = titleCase(v);
            break;
          case 'strategy_params':
            templateValueMapping[displayKey] =
              Object.keys(v).length !== 0
                ? Object.keys(v)
                    .map((key) => {
                      if (!v[key]) {
                        return null;
                      }
                      return (
                        <Typography key={key}>
                          <li>{titleCase(key)}</li>
                        </Typography>
                      );
                    })
                    .filter((value) => value != null)
                : null;
            break;
          case 'notes':
          case 'order_condition':
            templateValueMapping[displayKey] = <Typography sx={{ wordWrap: 'breakWord' }}>{v}</Typography>;
            break;
          case 'strategy':
            templateValueMapping[displayKey] = getTrajectoryName({
              trajectory: orderData.strategy,
              trajectories,
            });
            break;
          case 'super_strategy':
            templateValueMapping[displayKey] = getStrategyName({
              selectedStrategy: orderData.super_strategy,
              superStrategies,
              strategies,
            });
            break;
          case 'limit_price_options':
            templateValueMapping.limit_price = v;
            break;
          default:
            templateValueMapping[displayKey] = v;
        }
      });

      const returnObject = {};

      Object.keys(getDisplayNames).forEach((key) => {
        if (Object.keys(orderData).includes(key)) {
          returnObject[key] = [getDisplayNames[key], templateValueMapping[key]];
        }
      });

      return returnObject;
    };

    const displayMapping = getDisplayValues();

    return (
      <Grid item key={orderData.id} xs={colSize}>
        <Card
          key={`${orderData.id}Card`}
          sx={{
            mb: 2,
            cursor: 'pointer',
            position: 'relative',
            zIndex: 1,
            borderWidth: 2,
          }}
          variant='outlined'
        >
          <CardContent
            key={`${orderData.id}CardContent`}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box display='flex' flexDirection='row' flexWrap='wrap' sx={{ width: '100%' }}>
              <Stack direction='column' spacing={2}>
                <Box flex='1' mb={1} minWidth='150px'>
                  <Typography variant='h3'>{displayMapping.pair[1]}</Typography>
                </Box>
                <Box flex='1' mb={1} minWidth='150px'>
                  <Stack direction='row' spacing={1}>
                    <Typography
                      color={displayMapping.side[1] === 'Sell' ? theme.palette.charts.red : theme.palette.charts.green}
                      variant='h4'
                    >
                      {`${displayMapping.side[1]} `}
                    </Typography>
                    <Typography variant='h4'>
                      {targetQtyDisplay(orderData)} -{' '}
                      {displayMapping.super_strategy ? displayMapping.super_strategy[1] : displayMapping.strategy[1]}
                    </Typography>
                  </Stack>
                </Box>

                <Divider />
                <Box display='flex' flexDirection='column' flexWrap='wrap' sx={{ width: '99%', overflowX: 'auto' }}>
                  <Stack
                    direction='row'
                    style={{
                      whiteSpace: 'nowrap',
                      paddingTop: '10px',
                      paddingBottom: '10px',
                    }}
                  >
                    <Stack direction='column' style={{ whiteSpace: 'nowrap' }}>
                      <Table size='small'>
                        <TableHead>
                          <TableRow>
                            {Object.keys(displayMapping).map((dataKey) => {
                              const value = orderData[dataKey];
                              const displayValues = displayMapping[dataKey];

                              if (value && !isEmpty(value)) {
                                switch (dataKey) {
                                  case 'side':
                                  case 'pair':
                                  case 'strategy':
                                  case 'super_strategy':
                                  case 'quote_asset_qty':
                                  case 'base_asset_qty':
                                    return null;
                                  default:
                                    if (displayValues[1] && !isEmpty(displayValues[1])) {
                                      return (
                                        <StyledHeaderTableCell
                                          align='left'
                                          key={`${dataKey}-HeadCell`}
                                          style={{ width: '150px' }}
                                        >
                                          {displayValues[0]}
                                        </StyledHeaderTableCell>
                                      );
                                    }
                                }
                              }
                              return null;
                            })}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            {Object.keys(displayMapping).map((dataKey) => {
                              const value = orderData[dataKey];
                              const displayValues = displayMapping[dataKey];

                              if (value && !isEmpty(value)) {
                                switch (dataKey) {
                                  case 'side':
                                  case 'pair':
                                  case 'strategy':
                                  case 'super_strategy':
                                  case 'quote_asset_qty':
                                  case 'base_asset_qty':
                                    return null;
                                  default:
                                    if (displayValues[1])
                                      return (
                                        <StyledHeaderTableCell
                                          align='left'
                                          key={`${dataKey}-BodyCell`}
                                          style={{ width: '150px' }}
                                        >
                                          {displayValues[1]}
                                        </StyledHeaderTableCell>
                                      );
                                }
                              }
                              return null;
                            })}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-start',
                gap: 2,
                position: 'absolute',
                right: 16,
              }}
            >
              <FormControl
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'start',
                  width: '50px',
                }}
                variant='outlined'
              >
                <Select
                  displayEmpty
                  inputProps={{ 'aria-label': 'Priority' }}
                  value={orderData.priority}
                  onChange={(e) => handlePriorityChange(e, orderData.id, orderData.priority)}
                >
                  {[...Array(maxPriority + 1).keys()].slice(1).map((num) => (
                    <MenuItem key={num} value={num}>
                      {num}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Tooltip title='Remove order item'>
                <IconButton sx={{ height: '75%' }} onClick={(e) => handleDeleteOnClick(e, orderData.index)}>
                  <RemoveCircleOutline sx={{ fontSize: 25, color: theme.palette.error.main }} />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box sx={{ maxHeight: '100%', overflowY: 'auto', padding: 3 }}>
      {sortedPriorities.map((priority, index) => {
        const orders = groupedOrders[priority];

        return (
          <Box key={priority} mb={4} position='relative'>
            {/* Batch Header */}
            <Paper
              elevation={1}
              sx={{
                p: 2,
                mb: 3,
                backgroundColor: theme.palette.background.default,
                borderRadius: 2
              }}
            >
              <Typography variant='h6'>
                Batch {priority}
              </Typography>
              <Typography color='text.secondary' variant='body2'>
                {orders.length} order{orders.length !== 1 ? 's' : ''} in this batch
              </Typography>
            </Paper>

            {/* Orders Grid */}
            <Grid container spacing={3}>
              {orders.map((order) => (
                <Grid item key={`${priority}-row-${order.id}`} xs={12}>
                  {orderView ? orderViewPriorityCard(order, 12) : orderEntryPriorityCard(order, 12)}
                </Grid>
              ))}
            </Grid>

            {/* Connection Arrow */}
            {index < sortedPriorities.length - 1 && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  mt: 2,
                  mb: 2,
                }}
              >
                <ArrowDownward
                  sx={{
                    fontSize: '3rem',
                    color: getStatusBorderColor(
                      orders[orders.length - 1].order?.status || orders[orders.length - 1].status
                    ),
                  }}
                />
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export default ChainChart;
