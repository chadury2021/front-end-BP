/* eslint-disable react-hooks/exhaustive-deps */
import { Box, Card, CardContent, Stack } from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchChainedOrderBenchmarkData, fetchChainedOrderDetailData } from '../../../apiServices';
import { Loader } from '../../../shared/Loader';
import { ErrorContext } from '../../../shared/context/ErrorProvider';
import { ChainedOrderActions, ChainedOrderBenchmark, ChainedSummaryRender } from './ChainedSummary';
import ChainChart from './charts/ChainChart';

function ChainedOrderDetailsPage() {
  const { uuid } = useParams();
  const [orderBenchmark, setOrderBenchmark] = useState({});
  const [orderSummaryState, setOrderSummaryState] = useState({});
  const [ordersInChain, setOrdersInChain] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { showAlert } = useContext(ErrorContext);

  const loadOrderData = async (orderId) => {
    try {
      const orderData = await fetchChainedOrderDetailData(orderId);

      if (orderData) {
        setOrderSummaryState(orderData.order);
        setOrdersInChain(orderData.child_orders);
        return orderData;
      }
      showAlert({ severity: 'error', message: 'Failed to load order data.' });
      return null;
    } catch (e) {
      showAlert({
        severity: 'error',
        message: `Failed to fetch order details: ${e.message}`,
      });
      return null;
    }
  };

  const loadData = async () => {
    const orderId = uuid;
    try {
      const benchmarkData = await fetchChainedOrderBenchmarkData(orderId);
      setOrderBenchmark(benchmarkData);

      const chainedData = await loadOrderData(orderId);
      if (!chainedData) return false;

      const chainedOrderComplete = chainedData?.child_orders.every(
        (order) => order.status === 'COMPLETE' || order.status === 'CANCELED'
      );

      return !chainedOrderComplete;
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Failed to fetch data: ${error.message}`,
      });
    } finally {
      setIsLoading(false);
    }
    return true;
  };

  // revamp this with usePolling
  useEffect(() => {
    let isMounted = true;
    let success = true;

    const pollData = async () => {
      while (isMounted && success) {
        // eslint-disable-next-line no-await-in-loop
        success = await loadData();
        setIsLoading(false);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, 2000);
        });
      }
    };

    pollData();

    return () => {
      isMounted = false;
    };
  }, [uuid]);

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
  return (
    <Stack direction='row' height='100%' spacing={1} width='100%'>
      <Stack style={{ height: '100%', width: '30%' }}>
        <Stack direction='column' spacing={1} style={{ height: '100%' }}>
          <Card style={{ height: '65%' }}>
            <CardContent style={{ height: '100%' }}>
              <ChainedSummaryRender
                accountNames={orderSummaryState.account_names}
                ordersInChain={ordersInChain}
                orderSummaryData={orderSummaryState}
              />
            </CardContent>
          </Card>
          <Card style={{ height: '5%' }}>
            <CardContent style={{ height: '100%', padding: 0 }}>
              <ChainedOrderActions
                loadOrderData={loadOrderData}
                ordersInChain={ordersInChain}
                orderSummaryData={orderSummaryState}
                showAlert={showAlert}
              />
            </CardContent>
          </Card>
          <Card style={{ height: '30%', padding: 8 }}>
            <CardContent style={{ height: '100%', overflow: 'auto', padding: 8 }}>
              <ChainedOrderBenchmark benchmarkData={orderBenchmark.context} />
            </CardContent>
          </Card>
        </Stack>
      </Stack>
      <Stack style={{ height: '100%', width: '70%' }}>
        <Card style={{ height: '100%', padding: 8 }}>
          <CardContent style={{ height: '100%', overflow: 'auto' }}>
            <ChainChart orderBenchmark={orderBenchmark.order_context} orders_in_chain={ordersInChain} />
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
}

export default ChainedOrderDetailsPage;
