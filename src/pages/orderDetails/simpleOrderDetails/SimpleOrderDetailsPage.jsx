/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-await-in-loop */
import { Stack, Paper, Box } from '@mui/material';
import { OrderDetailsLayout, MobileOrderDetailsLayout } from '@/pages/orderDetails/OrderDetailsLayout';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTitle } from '@/shared/context/TitleProvider';
import { OrderActions } from '@/pages/orderDetails/algoOrderDetails/OrderActions/OrderActions';
import PlacementsTable from '@/shared/orderDetail//PlacementsTable';
import { OrderBenchmarks, OrderSummary, OrderMessages } from '@/shared/orderDetail';
import useViewport from '@/shared/hooks/useViewport';
import usePlacementMessages from '@/shared/orderDetail/hooks/usePlacementMessages';
import { fetchOrderDetailData } from '../../../apiServices';
import { ErrorContext } from '../../../shared/context/ErrorProvider';
import { FillOrderTable } from './FillOrderTable';

function SimpleOrderDetailsPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [benchmarkState, setBenchmarkState] = useState({});
  const [orderSummaryState, setOrderSummaryState] = useState({});
  const [tableData, setTableData] = useState({ fills: [] });
  const [orderMessages, setOrderMessages] = useState(null);
  const [analytics, setAnalytics] = useState({});
  const [orderEnded, setOrderEnded] = useState(false);

  const { showAlert } = useContext(ErrorContext);
  const { isMobile } = useViewport();

  // Fetch placement failure messages
  const { placementMessages, isLoading: placementMessagesLoading } = usePlacementMessages(uuid);

  const { status, pct_filled, side, pair, target_token } = orderSummaryState;
  const { setTitle } = useTitle();
  useEffect(() => {
    if (status && pct_filled >= 0) {
      setTitle(`${status} (${Math.round(Number(pct_filled))}%) - ${side} ${pair}`);
    }
  }, [status, pct_filled, side, pair]);

  // Merge order messages with placement failure messages
  const [mergedMessages, setMergedMessages] = useState([]);

  useEffect(() => {
    const allMessages = [...(orderMessages || []), ...(placementMessages || [])];

    // Sort by creation time (newest first)
    const sortedMessages = allMessages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setMergedMessages(sortedMessages);
  }, [orderMessages, placementMessages]);

  const parseOrderData = (messageData) => {
    const { benchmark, fills, order_summary, messages, order_analytics } = messageData;

    if (!order_summary.is_simple) {
      navigate(`/order/${order_summary.id}`);
      return;
    }

    if (Object.keys(messageData).length > 0) {
      if (Object.keys(benchmark).length > 0) {
        const { interval_volume, base_asset, pov } = benchmark;
        setBenchmarkState((prevState) => ({
          ...benchmark,
          interval_volume: interval_volume !== undefined ? interval_volume : prevState.interval_volume,
          base_asset: base_asset !== undefined ? base_asset : prevState.base_asset,
          pov: pov !== undefined ? pov : prevState.pov,
          points_earned: order_summary?.points_earned,
        }));
      }
      if (Object.keys(order_summary).length > 0) {
        setOrderSummaryState(order_summary);
      }

      if (Object.keys(order_analytics).length > 0) {
        setAnalytics(order_analytics);
      }

      setTableData({ fills });
      setOrderMessages(messages && messages.length > 0 ? messages : []);
      setOrderEnded(messageData.order_ended);
    }
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
      return false;
    }

    parseOrderData(orderData);
    return orderData;
  };

  useEffect(() => {
    let intervalId;

    const loadData = async () => {
      const order_id = uuid;
      const orderData = await loadOrderData(order_id);

      if (orderData?.order_ended) {
        clearInterval(intervalId);
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

  const isDexOrder =
    Array.isArray(orderSummaryState.unique_venues) &&
    orderSummaryState.unique_venues.some((venue) => venue.includes('OKXDEX'));
  const network = orderSummaryState.chain_id;

  const leftPanel = (
    <Stack direction='column' spacing={4}>
      <Box sx={{ padding: 1 }}>
        <OrderSummary isSimple analytics={analytics} orderId={uuid} OrderSummaryData={orderSummaryState} />
      </Box>
      <OrderActions loadOrderData={loadOrderData} OrderSummaryData={orderSummaryState} />
      <OrderMessages simpleView orderMessages={mergedMessages} />
    </Stack>
  );
  return isMobile ? (
    <MobileOrderDetailsLayout>
      <Box sx={{ padding: 1 }}>
        <OrderSummary isSimple analytics={analytics} orderId={uuid} OrderSummaryData={orderSummaryState} />
      </Box>
      <OrderActions loadOrderData={loadOrderData} OrderSummaryData={orderSummaryState} />
      <Box sx={{ padding: 1 }}>
        <OrderBenchmarks
          isSimple
          benchmarkData={benchmarkState}
          fillRoleBreakdown={orderSummaryState.fill_role_breakdown}
          isDexOrder={isDexOrder}
          orderSummary={orderSummaryState}
        />
      </Box>
    </MobileOrderDetailsLayout>
  ) : (
    <OrderDetailsLayout leftPanel={leftPanel}>
      <Stack direction='column' spacing={1} style={{ height: '100%' }}>
        <OrderBenchmarks
          isSimple
          benchmarkData={benchmarkState}
          fillRoleBreakdown={orderSummaryState.fill_role_breakdown}
          isDexOrder={isDexOrder}
          orderSummary={orderSummaryState}
        />

        <Stack direction='column' spacing={1} style={{ height: 'calc(100% - 120px)', flex: 1 }}>
          <Paper elevation={0} style={{ height: '35%', overflow: 'auto' }}>
            <PlacementsTable
              isSimpleOrderView
              isDexOrder={isDexOrder}
              network={network}
              orderActive={!orderEnded}
              orderId={uuid}
              targetBaseToken={orderSummaryState.target_base_token}
              targetToken={orderSummaryState.target_token}
            />
          </Paper>
          <Paper elevation={0} style={{ height: '65%', overflow: 'auto' }}>
            <FillOrderTable
              fills={tableData.fills}
              isDexOrder={isDexOrder}
              network={network}
              targetBaseToken={orderSummaryState.target_base_token}
              targetToken={orderSummaryState.target_token}
            />
          </Paper>
        </Stack>
      </Stack>
    </OrderDetailsLayout>
  );
}

export default SimpleOrderDetailsPage;
