/* eslint-disable no-await-in-loop */
/* eslint-disable react-hooks/exhaustive-deps */
import { Box, Card, CardContent, FormControlLabel, Paper, Stack, Switch, Typography } from '@mui/material';
import 'chartjs-adapter-moment';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTitle } from '@/shared/context/TitleProvider';
import PlacementsTable from '@/shared/orderDetail/PlacementsTable';
import { fetchOrderDetailData, fetchPovOrderChartData, getMarkoutData } from '@/apiServices';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { OrderBenchmarks, OrderSummary, OrderMessages } from '@/shared/orderDetail';
import MarkoutGraph from '@/shared/orderDetail/MarkoutGraph'; // Correct import
import DataComponent from '@/shared/DataComponent';
import { Loader } from '@/shared/Loader';
import { OrderDetailsLayout, MobileOrderDetailsLayout } from '@/pages/orderDetails/OrderDetailsLayout';
import useViewport from '@/shared/hooks/useViewport';
import { BidAskChart, FillOrderChart } from './charts';

import { MarketVolumeChart } from './charts/pov/MarketVolumeChart';
import { PovMarketChart } from './charts/pov/PovMarketChart';
import { OrderActions } from './OrderActions/OrderActions';

// Helper function to format failure reasons for better readability
const formatFailureReason = (failureReason) => {
  if (!failureReason) return 'Unknown error';

  // Handle common backend error patterns with "None" values
  if (failureReason.includes('[None]') || failureReason.includes(': None')) {
    return failureReason.replace(/\[None\]/g, '[Missing Data]').replace(/: None/g, ': Missing Data');
  }

  return failureReason;
};

function OrderDetailsPage() {
  const { uuid } = useParams();

  const navigate = useNavigate();

  const [benchmarkState, setBenchmarkState] = useState({});
  const [orderSummaryState, setOrderSummaryState] = useState({});
  const [bidAskState, setBidAskState] = useState([]);
  const [passiveFillState, setPassiveFillState] = useState([]);
  const [aggroFillState, setAggroFillState] = useState([]);
  const [crossFillState, setCrossFillState] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [isPov, setIsPov] = useState(false);
  const [limitHistory, setLimitHistory] = useState([]);
  const [povChartData, setPovChartData] = useState({
    cumulativePov: [],
    fills: { take: [], make: [] },
    timestamps: [],
    volume: [],
  });
  const [chartType, setChartType] = useState('default');
  const [markoutData, setMarkoutData] = useState({}); // state for markout data
  const [activePlacements, setActivePlacements] = useState([]);
  const [orderMessages, setOrderMessages] = useState(null);

  const [chartTrajectoryToggle, setChartTrajectoryToggle] = useState(false);

  const { showAlert } = useContext(ErrorContext);
  const { status, pct_filled, side, pair, is_active } = orderSummaryState;
  const { setTitle } = useTitle();
  const [isOrderLoading, setIsOrderLoading] = useState(true);
  const { isMobile } = useViewport();

  // Determine network from order data
  const getNetworkFromOrder = () => {
    // Check if this is a DEX order by looking at unique_venues
    const isDexOrder =
      Array.isArray(orderSummaryState.unique_venues) &&
      orderSummaryState.unique_venues.some((venue) => venue.includes('OKXDEX'));

    if (isDexOrder) {
      // For DEX orders, we need to determine the chain from the target_token
      if (orderSummaryState.target_token && orderSummaryState.target_token.includes(':')) {
        const chainId = orderSummaryState.target_token.split(':')[1];
        return chainId;
      }
      // Default to Ethereum for DEX orders if we can't determine the chain
      return '1';
    }

    // For non-DEX orders, default to Ethereum
    return '1';
  };

  useEffect(() => {
    if (status && pct_filled >= 0) {
      setTitle(`${status} (${Math.round(Number(pct_filled))}%) - ${side} ${pair}`);
    }
  }, [status, pct_filled, side, pair]);

  const parseOrderData = (messageData) => {
    const {
      passive_fills,
      aggro_fills,
      cross_fills,
      benchmark,
      order_summary,
      bid_ask_prices,
      order_analytics,
      limit_price_history,
      active_placements,
      failure_reason,
      messages,
    } = messageData;

    if (failure_reason && failure_reason !== '') {
      showAlert({
        severity: 'warning',
        message: `Failure Reason: ${formatFailureReason(failure_reason)}`,
      });
    }

    if (Object.keys(messageData).length > 0) {
      if (Object.keys(benchmark).length > 0) {
        const { interval_volume, pov } = benchmark;
        setBenchmarkState((prevState) => ({
          ...benchmark,
          interval_volume: interval_volume !== undefined ? interval_volume : prevState.interval_volume,
          pov: pov !== undefined ? pov : prevState.pov,
          points_earned: order_summary?.points_earned,
        }));
      }
      if (Object.keys(order_summary).length > 0) {
        setOrderSummaryState(order_summary);
        const { pov_target } = order_summary;
        if (pov_target !== null) {
          setIsPov(true);
        }
      }
      if (Array.isArray(bid_ask_prices)) {
        setBidAskState(bid_ask_prices);
      }
      if (passive_fills && passive_fills.length > 0) {
        const passiveFillsPrice = passive_fills.map((e) => [e.x, e.price]);
        setPassiveFillState(passiveFillsPrice);
      }
      if (aggro_fills && aggro_fills.length > 0) {
        const aggroFillsPrice = aggro_fills.map((e) => [e.x, e.price]);
        setAggroFillState(aggroFillsPrice);
      }
      if (cross_fills && cross_fills.length > 0) {
        const crossFillsPrice = cross_fills.map((e) => [e.x, e.price]);
        setCrossFillState(crossFillsPrice);
      }

      if (Object.keys(order_analytics).length > 0) {
        setAnalytics(order_analytics);
      }
      if (limit_price_history && limit_price_history.length > 0) {
        const parsed_limit_history = limit_price_history.map((e) => [Number(e[0]), Number(e[1])]);
        setLimitHistory(parsed_limit_history);
      }
      if (active_placements && active_placements.length > 0) {
        const activePlacementsData = active_placements.map((e) => [e.time, e.price, e.side]);
        setActivePlacements(activePlacementsData);
      } else {
        setActivePlacements([]);
      }
      setOrderMessages(messages && messages.length > 0 ? messages : []);
    }
    setIsOrderLoading(false);
  };

  const povSplicer = (splicee, timestamps, initialPovTruncate) => {
    const povSplicee = splicee.map((e) => e * 100);
    return timestamps.map((ts, index) => {
      if (index >= povSplicee.length) {
        return [ts, null];
      }
      // remove POV line based on discretion
      if (ts < initialPovTruncate[0] + Date.parse(initialPovTruncate[1])) {
        return [ts, null];
      }
      return [ts, povSplicee[index]];
    });
  };

  const timestampSplicer = (splicee, timestamps) => {
    return timestamps.map((ts, index) => {
      if (index >= splicee.length) {
        return [ts, null];
      }
      return [ts, splicee[index]];
    });
  };

  const targetSplicer = (target, timestamps) => {
    return timestamps.map((data, index) => {
      return [data, target];
    });
  };

  const parsePovData = (messageData, initialPovTruncate = undefined) => {
    const { cumulative_pov, fills, timestamps, volume } = messageData;

    let slicedPov = [];
    let slicedFills = [];
    let slicedVolume = [];

    if (Object.keys(messageData).length === 0 || !timestamps || timestamps.length === 0) {
      return;
    }

    if (cumulative_pov && cumulative_pov.length > 0) {
      slicedPov = povSplicer(cumulative_pov, timestamps, initialPovTruncate);
    }

    if (fills.take && fills.make) {
      slicedFills = {
        take: timestampSplicer(fills.take, timestamps),
        make: timestampSplicer(fills.make, timestamps),
      };
    }

    if (fills.cross) {
      slicedFills.cross = timestampSplicer(fills.cross, timestamps);
    }

    if (volume) {
      slicedVolume = timestampSplicer(volume, timestamps);
    }

    setPovChartData({
      cumulativePov: slicedPov,
      fills: slicedFills,
      timestamps: messageData.timestamps,
      volume: slicedVolume,
    });
  };

  const calculatePovTruncate = (order_summary) => {
    const { schedule_discretion, time_start, orig_time_end } = order_summary;
    const timeDelta = Date.parse(orig_time_end) - Date.parse(time_start);
    return [schedule_discretion * timeDelta, time_start];
  };

  const loadOrderData = async (order_id) => {
    let orderData;
    try {
      orderData = await fetchOrderDetailData(order_id);
    } catch (e) {
      showAlert({
        severity: 'error',
        message: `Failed to fetch order details: ${e.message}`,
      });
      return null;
    }

    parseOrderData(orderData);
    return orderData;
  };

  useEffect(() => {
    const loadData = async () => {
      window.setChartType = (type) => {
        setChartType(type);
      };

      const order_id = uuid;
      const orderData = await loadOrderData(order_id);

      if (!orderData) {
        navigate('/');
        return false;
      }

      if (orderData.order_summary.is_simple) {
        navigate(`/simple_order/${order_id}`);
        return false;
      }

      try {
        const data = await getMarkoutData(order_id);

        if (data.error) {
          // don't show error for now, it's usually temporary and annoying to show multiple times
        } else {
          setMarkoutData(data);
        }
      } catch (e) {
        // do nothing
      }

      let povOrderChartData;
      try {
        povOrderChartData = await fetchPovOrderChartData(order_id);
      } catch (e) {
        showAlert({
          severity: 'error',
          message: `Failed to fetch participation rate chart data: ${e.message}`,
        });
        return false;
      }

      const povTruncate = calculatePovTruncate(orderData.order_summary);
      parsePovData(povOrderChartData, povTruncate);

      if (orderData.order_ended) {
        return false;
      }

      return true;
    };

    let isMounted = true;
    let success = true;

    const pollData = async () => {
      while (isMounted && success) {
        success = await loadData();
        await new Promise((resolve) => {
          setTimeout(resolve, 2000);
        });
      }
    };

    pollData();

    return () => {
      // Stop polling when the component unmounts or success changes
      isMounted = false;
    };
  }, []);

  // Determine if this is a DEX order
  const isDexOrder =
    Array.isArray(orderSummaryState.unique_venues) &&
    orderSummaryState.unique_venues.some((venue) => venue.includes('OKXDEX'));

  const renderDurationCharts = () => {
    if (Object.keys(analytics).length === 0) {
      return <div />;
    }

    return <FillOrderChart data={analytics} orderData={orderSummaryState} />;
  };

  const renderPovCharts = () => {
    // What the target volume should be
    const targetVolume = povChartData.volume.map((point) => {
      return [point[0], point[1] ? point[1] * Number(orderSummaryState.pov_target) : null];
    });
    // What the (actual) executed volume is
    const executedVolume = povChartData.timestamps.map((timestamp, index) => {
      const take = povChartData.fills.take[index]?.[1] || 0;
      const make = povChartData.fills.make[index]?.[1] || 0;
      const cross = povChartData.fills.cross?.[index]?.[1] || 0;

      const totalVolume = take + make + cross;
      return [timestamp, totalVolume || 0];
    });

    return (
      <Stack direction='column' height='100%' spacing={1}>
        <Box
          style={{
            height: '50%',
            position: 'relative',
            marginX: '8px',
            marginTop: '8px',
            marginBottom: '4px',
          }}
        >
          <PovMarketChart
            analytics={analytics}
            fills={povChartData.fills}
            orderData={orderSummaryState}
            origTimeEnd={orderSummaryState.orig_order_end}
            pov={povChartData.cumulativePov}
            povTarget={orderSummaryState.pov_target}
            povTargetLine={targetSplicer(orderSummaryState.pov_target * 100, povChartData.timestamps)}
            target={benchmarkState.interval_volume}
            timeStart={orderSummaryState.time_start}
          />
        </Box>
        <Box
          style={{
            height: '50%',
            position: 'relative',
            marginX: '8px',
            marginTop: '4px',
            marginBottom: '8px',
          }}
        >
          <MarketVolumeChart
            executedVolume={executedVolume}
            origTimeEnd={orderSummaryState.orig_order_end}
            timeStart={orderSummaryState.time_start}
            volume={povChartData.volume}
          />
        </Box>
      </Stack>
    );
  };

  const bidAskTimestamps = bidAskState.map((e) => e.timestamp);

  const renderCharts = () => {
    let displayedChart = null;
    if (isPov) {
      displayedChart = chartTrajectoryToggle ? renderDurationCharts() : renderPovCharts();
    } else {
      displayedChart = chartTrajectoryToggle ? renderPovCharts() : renderDurationCharts();
    }
    return (
      <Box sx={{ height: '100%', width: '100%' }}>
        {isPov && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              height: '30px',
            }}
          >
            <FormControlLabel
              control={
                <Switch checked={chartTrajectoryToggle} onChange={(e) => setChartTrajectoryToggle(e.target.checked)} />
              }
              label={
                <Typography variant='small1'>
                  {isPov === chartTrajectoryToggle ? 'Schedule View' : 'Participation View'}
                </Typography>
              }
              labelPlacement='start'
            />
          </Box>
        )}
        <Box sx={{ height: isPov ? 'calc(100% - 30px)' : '100%', width: '100%' }}>{displayedChart}</Box>
      </Box>
    );
  };

  const leftPanel = (
    <Stack direction='column' spacing={4}>
      <Box sx={{ padding: 1 }}>
        <OrderSummary OrderSummaryData={orderSummaryState} />
      </Box>
      <OrderActions loadOrderData={loadOrderData} OrderSummaryData={orderSummaryState} />
      <Box sx={{ height: 'calc(100% - 780px)' }}>
        <PlacementsTable
          isDetailOrderView
          isDexOrder={isDexOrder}
          network={getNetworkFromOrder()}
          orderActive={is_active}
          orderId={uuid}
        />
      </Box>
    </Stack>
  );

  return isMobile ? (
    <MobileOrderDetailsLayout>
      <Box sx={{ padding: 1 }}>
        <OrderSummary OrderSummaryData={orderSummaryState} />
      </Box>
      <OrderActions loadOrderData={loadOrderData} OrderSummaryData={orderSummaryState} />
      <Box sx={{ padding: 1 }}>
        <OrderBenchmarks
          isMobile
          benchmarkData={benchmarkState}
          fillRoleBreakdown={orderSummaryState.fill_role_breakdown}
          isDexOrder={isDexOrder}
          orderSummary={orderSummaryState}
        />
      </Box>
    </MobileOrderDetailsLayout>
  ) : (
    <OrderDetailsLayout leftPanel={leftPanel}>
      <Stack direction='column' height='120%' spacing={2}>
        <OrderBenchmarks
          benchmarkData={benchmarkState}
          fillRoleBreakdown={orderSummaryState.fill_role_breakdown}
          orderSummary={orderSummaryState}
        />
        <Stack direction='column' spacing={2} sx={{ flex: 1, minHeight: 0 }}>
          <Paper
            elevation={0}
            style={{
              width: '100%',
              height: '45%',
            }}
          >
            {renderCharts()}
          </Paper>
          <Paper elevation={0} style={{ width: '100%', height: '30%', padding: 2 }}>
            <Box
              height='100%'
              style={{
                marginLeft: isPov ? '2%' : null,
                position: 'relative',
              }}
              width='100%'
            >
              <BidAskChart
                activePlacements={activePlacements}
                aggroFillState={aggroFillState}
                analytics={analytics}
                askState={bidAskState.map((e) => [e.timestamp, e.best_ask])}
                avgPriceLine={targetSplicer(Number(benchmarkState.executed_price), bidAskTimestamps)}
                bidState={bidAskState.map((e) => [e.timestamp, e.best_bid])}
                crossFillState={crossFillState}
                isPov={isPov}
                limitHistory={orderSummaryState.limit_price ? limitHistory : null}
                orderData={orderSummaryState}
                orderStats={{
                  time_start: orderSummaryState.time_start,
                  orig_time_end: orderSummaryState.orig_order_end,
                  time_end: orderSummaryState.time_end,
                  executed_price: orderSummaryState.executed_price,
                  vwap: benchmarkState.vwap,
                }}
                passiveFillState={passiveFillState}
                vwapLine={targetSplicer(Number(benchmarkState.vwap), bidAskTimestamps)}
              />
            </Box>
          </Paper>
          <Stack direction='row' height='30%' spacing={2}>
            <Paper elevation={0} sx={{ width: '50%', height: '100%' }}>
              <DataComponent isLoading={isOrderLoading} loadingComponent={<Loader />}>
                <Box
                  style={{
                    height: '100%',
                    position: 'relative',
                  }}
                >
                  <MarkoutGraph data={markoutData} height='30vh' />
                </Box>
              </DataComponent>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                width: '50%',
                height: '100%',
                overflow: 'auto',
              }}
            >
              <OrderMessages orderMessages={orderMessages} parentOrder={orderSummaryState?.parent_order} />
            </Paper>
          </Stack>
        </Stack>
      </Stack>
    </OrderDetailsLayout>
  );
}

export default OrderDetailsPage;
