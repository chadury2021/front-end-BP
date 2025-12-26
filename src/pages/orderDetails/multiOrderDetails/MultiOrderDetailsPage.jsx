/* eslint-disable no-await-in-loop */
/* eslint-disable react-hooks/exhaustive-deps */
import { Box, Card, CardContent, Stack, Paper } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTitle } from '@/shared/context/TitleProvider';
import { OrderMessages, useMultiOrderMessages } from '@/shared/orderDetail/OrderMessages';
import { OrderBenchmarks } from '@/shared/orderDetail';
import { OrderDetailsLayout, MobileOrderDetailsLayout } from '@/pages/orderDetails/OrderDetailsLayout';
import useViewport from '@/shared/hooks/useViewport';
import { fetchMultiOrderBenchmarkData, fetchMultiOrderDetailData } from '../../../apiServices';
import { Loader } from '../../../shared/Loader';
import { ErrorContext } from '../../../shared/context/ErrorProvider';
import MultiSummary from './MultiSummary';
import { BuySellSpreadChart } from './charts/BuySellSpreadChart';
import { PriceDifferenceChart } from './charts/PriceDifferenceChart';
import { PriceSpreadChart } from './charts/PriceSpreadChart';
import { PnLChart } from './charts/PnLChart';
import { OrderActions } from '../algoOrderDetails/OrderActions/OrderActions';
import { ChildOrderTable } from './ChildOrderTable';

// Utility function to detect if multi order has different underlying bases
const hasDifferentUnderlyingBases = (childOrders) => {
  if (!childOrders || childOrders.length < 2) return false;

  // Extract base symbols from pairs (e.g., "BTC" from "BTC/USDT", "ETH" from "ETH:PERP-USDT")
  const baseSymbols = childOrders
    .map(({ pair }) => {
      if (!pair) return null;

      // Handle different pair formats: "BTC/USDT", "BTCUSDT", "ETH:PERP-USDT", etc.
      if (pair.includes('/')) {
        return pair.split('/')[0];
      }

      // Handle PERP pairs (e.g., "ETH:PERP-USDT" -> "ETH")
      if (pair.includes(':PERP-')) {
        return pair.split(':PERP-')[0];
      }

      // Handle regular pairs with USDT/USD (e.g., "BTCUSDT" -> "BTC", "ETH-USDT" -> "ETH")
      if (pair.includes('USDT') || pair.includes('USD')) {
        // Remove quote currency to get base, handling both formats
        const base = pair.replace(/USDT|USD/g, '');
        // Remove any remaining separators like "-" or ":"
        return base.replace(/[-:]/g, '');
      }

      return pair;
    })
    .filter(Boolean);

  // Check if we have at least 2 different base symbols
  const uniqueBaseSymbols = new Set(baseSymbols);
  return uniqueBaseSymbols.size > 1;
};

function MultiOrderDetailsPage() {
  const { uuid } = useParams();
  const [orderBenchmark, setOrderBenchmark] = useState({});
  const [orderSummaryState, setOrderSummaryState] = useState({});
  const [childOrders, setChildOrders] = useState([]);
  const [multiOrderStats, setMultiOrderStats] = useState({});
  const [activePlacements, setActivePlacements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const { showAlert } = useContext(ErrorContext);
  const { isMobile } = useViewport();

  const { status, pct_filled } = orderSummaryState;
  const { setTitle } = useTitle();
  useEffect(() => {
    if (status && pct_filled >= 0) {
      setTitle(`${status} (${Math.round(Number(pct_filled))}%) - Multi`);
    }
  }, [status, pct_filled]);

  const loadOrderData = async (order_id) => {
    let orderData;
    try {
      orderData = await fetchMultiOrderDetailData(order_id);
    } catch (e) {
      showAlert({
        severity: 'error',
        message: `Failed to fetch order details: ${e.message}`,
      });
      return null;
    }

    if (orderData.active_placements && orderData.active_placements.length > 0) {
      const activePlacementsData = orderData.active_placements.map((e) => [e.time, e.price, e.side]);
      setActivePlacements(activePlacementsData);
    }

    setOrderSummaryState(orderData.order);
    setChildOrders(orderData.child_orders);
    setMultiOrderStats(orderData);
    return orderData;
  };

  useEffect(() => {
    let intervalId;
    const order_id = uuid;

    setIsLoading(true);
    const loadData = async () => {
      let benchmarkData;
      try {
        benchmarkData = await fetchMultiOrderBenchmarkData(order_id);
      } catch (e) {
        showAlert({
          severity: 'error',
          message: `Failed to fetch order details: ${e.message}`,
        });
        return false;
      }

      setOrderBenchmark(benchmarkData);

      const multiData = await loadOrderData(order_id);
      const isTerminated = multiData.child_orders.every(
        (child) => child.status === 'COMPLETE' || child.status === 'CANCELED'
      );

      if (!multiData || isTerminated) {
        clearInterval(intervalId);
      }

      setIsLoading(false);

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

  const orderMessages = useMultiOrderMessages(multiOrderStats);
  const { is_spread } = multiOrderStats;
  const hasDifferentBases = hasDifferentUnderlyingBases(childOrders);
  const isMarketMaker = orderSummaryState.market_maker;

  let timeStart;
  let timeEnd;
  let origTimeEnd;
  if (childOrders[0]) {
    timeStart = childOrders[0].time_start;
    timeEnd = childOrders[0].time_end;
    origTimeEnd = childOrders[0].orig_time_end;
  }

  if (isLoading) {
    return (
      <Box height='100%'>
        <Card>
          <CardContent>
            <Loader />
          </CardContent>
        </Card>
      </Box>
    );
  }

  const leftPanel = (
    <Stack direction='column' spacing={4}>
      <Box style={{ padding: 1 }}>
        <MultiSummary childOrders={childOrders} orderSummaryData={orderSummaryState} />
      </Box>
      <OrderActions
        multiDetailView
        childOrders={childOrders}
        loadOrderData={loadOrderData}
        OrderSummaryData={orderSummaryState}
      />
      <Box sx={{ height: 'calc(100% - 680px)' }}>
        <OrderMessages orderMessages={orderMessages} />
      </Box>
    </Stack>
  );
  return isMobile ? (
    <MobileOrderDetailsLayout>
      <Box style={{ padding: 1 }}>
        <MultiSummary childOrders={childOrders} orderSummaryData={orderSummaryState} />
      </Box>
      <OrderActions
        multiDetailView
        childOrders={childOrders}
        loadOrderData={loadOrderData}
        OrderSummaryData={orderSummaryState}
      />
      <Box style={{ padding: 1 }}>
        <OrderBenchmarks
          isMobile
          isMulti
          benchmarkData={orderBenchmark}
          fillRoleBreakdown={orderSummaryState.fill_role_breakdown}
        />
      </Box>
    </MobileOrderDetailsLayout>
  ) : (
    <OrderDetailsLayout leftPanel={leftPanel}>
      <Stack direction='column' minHeight='100%' spacing={2}>
        <OrderBenchmarks
          isMulti
          benchmarkData={orderBenchmark}
          fillRoleBreakdown={orderSummaryState.fill_role_breakdown}
        />
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            height: '100%',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <PriceDifferenceChart
            data={multiOrderStats}
            height={is_spread ? '25%' : '40%'}
            origTimeEnd={origTimeEnd}
            timeStart={timeStart}
          />
        </Paper>
        {is_spread && (
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              minWidth: '300px',
              height: '35vh',
            }}
          >
            <Box
              style={{
                height: '100%',
                position: 'relative',
              }}
            >
              <PriceSpreadChart
                activePlacements={activePlacements}
                data={multiOrderStats}
                hasDifferentBases={hasDifferentBases}
                isMarketMaker={isMarketMaker}
                origTimeEnd={origTimeEnd}
                timeEnd={timeEnd}
                timeStart={timeStart}
              />
              {isMarketMaker ? (
                <PnLChart data={multiOrderStats} origTimeEnd={origTimeEnd} timeEnd={timeEnd} timeStart={timeStart} />
              ) : (
                <BuySellSpreadChart
                  data={multiOrderStats}
                  hasDifferentBases={hasDifferentBases}
                  origTimeEnd={origTimeEnd}
                  timeEnd={timeEnd}
                  timeStart={timeStart}
                />
              )}
            </Box>
          </Paper>
        )}
        <Paper
          elevation={0}
          sx={{
            height: !is_spread ? '50%' : '35%',
            padding: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ChildOrderTable includeHeaders childOrders={childOrders} />
        </Paper>
      </Stack>
    </OrderDetailsLayout>
  );
}

export default MultiOrderDetailsPage;
