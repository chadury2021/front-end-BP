/* eslint-disable react/no-array-index-key */
/* eslint-disable no-param-reassign */
import { useTheme } from '@emotion/react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Tooltip } from '@mui/material';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { ExchangeTickerProvider } from '@/shared/context/ExchangeTickerProvider';
import { useSound } from '@/hooks/useSound';
import { ApiError, fetchOrderEntryFormData, submitChainedOrder, openInNewTab } from '../../apiServices';
import { Loader } from '../../shared/Loader';
import { ErrorContext } from '../../shared/context/ErrorProvider';
import ChainedOrdersSubmitForm from './ChainedOrdersSubmitForm';
import { BASEURL } from '../../util';

import { useSubmitForm } from '../dashboard/orderEntry/hooks/useSubmitForm';
import ChainChart from '../orderDetails/chainedOrderDetails/charts/ChainChart';
import useChainOrderActions from './hooks/useChainOrderActions';
import { ChainedOrderConfirmationModal } from '../dashboard/orderEntry/ChainedOrderConfirmationModal';

function matchPair(pairs, pairId) {
  const foundPairs = pairs.filter((p) => p.id === pairId);
  return foundPairs.length > 0 ? foundPairs[0] : null;
}

const columns = [
  { id: 'accounts', label: 'Accounts', width: 100, align: 'left' },
  { id: 'pair' || 'pairs', label: 'Pair', width: 160, align: 'left' },
  { id: 'side', label: 'Side', width: 30, align: 'left' },

  { id: 'qty', label: 'Target Quantity', width: 150, align: 'right' },
  { id: 'super_strategy', label: 'Strategy', width: 140, align: 'left' },
];

export default function ChainedOrdersEntryPage() {
  const theme = useTheme();
  const {
    FormAtoms,
    selectedPair,
    setSelectedPair,
    loading,
    setLoading,
    initialLoadValue,
    setInitialLoadValue,
    setFormPageType,
  } = useOrderForm();
  const { playOrderSuccess } = useSound();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
  const [chainedOrderData, setChainedOrderData] = useState(null);

  const { strategies, superStrategies, trajectories } = initialLoadValue;

  const { showAlert } = useContext(ErrorContext);

  const { getFormData } = useSubmitForm({
    isChainedOrder: true,
  });

  const { addOrderRow, handleDeleteOnClick, handlePriorityChange, formState } = useChainOrderActions();

  const pair = selectedPair ? selectedPair.id : 'BTC-USDT';

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setFormPageType('ChainedOrderPage');

      try {
        const [data] = await Promise.all([fetchOrderEntryFormData()]);

        const pairs = data.pairs.map((p) => {
          return {
            base: p.base,
            exchanges: p.exchanges,
            id: p.name,
            is_contract: p.is_contract,
            is_inverse: p.is_inverse,
            label: p.name,
            market_type: p.market_type,
            quote: p.quote,
          };
        });

        if (pairs && pair.length > 0 && selectedPair === null) {
          let newPair = matchPair(pairs, pair);
          if (!newPair) {
            newPair = matchPair(pairs, 'BTC-USDT');
          }

          if (newPair) {
            setSelectedPair(newPair);
          }
        }

        const accounts = {};
        data.accounts.forEach((acc) => {
          const scopedAccName = acc.user === data.user_id ? acc.name : `${acc.username}/${acc.name}`;
          const displayName = `${acc.exchange} - ${scopedAccName}`;
          accounts[scopedAccName] = {
            displayName,
            id: acc.id,
            name: scopedAccName,
            exchangeName: acc.exchange,
            walletProvider: acc.wallet_provider,
            walletType: acc.wallet_type,
          };
        });

        const indexedStrategies = data.strategies.reduce((obj, item) => {
          obj[item.id] = item;
          return obj;
        }, {});

        const indexedSuperStrategies = data.super_strategies.reduce((obj, item) => {
          obj[item.id] = item;
          return obj;
        }, {});

        setInitialLoadValue({
          tokenPairs: pairs,
          accounts,
          exchanges: data.exchanges,
          strategies: indexedSuperStrategies,
          trajectories: indexedStrategies,
          superStrategies: indexedSuperStrategies,
          strategyParams: data.strategy_params,
          orderTemplates: data.order_templates,
        });
      } catch (e) {
        showAlert({
          severity: 'error',
          message: `Error loading initial data: ${e.message}`,
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitLoading(true);

    if (formState.orders.length < 2) {
      showAlert({
        severity: 'error',
        message: 'Chained orders require at least 2 orders.',
      });
      setSubmitLoading(false);
      return;
    }

    const sortedOrders = formState.orders.sort((a, b) => a.priority - b.priority);

    const payload = {
      orders_in_chain: sortedOrders,
    };

    try {
      const response = await submitChainedOrder(payload);

      if (response.id) {
        // Play success sound
        playOrderSuccess();

        showAlert({
          message: 'Chained order submitted successfully!',
          severity: 'success',
        });
        openInNewTab(`${BASEURL}/chained_orders/${response.id}`);
        if (response.message === `Chain ${response.id} is Completed.`) {
          showAlert({
            message: `Chain ${response.id} is Completed.`,
            severity: 'success',
          });
        }
      } else {
        const errorMessage = response.errors?.[0] || 'Failed to submit chained order';
        showAlert({ message: errorMessage, severity: 'error' });
      }
    } catch (e) {
      if (e instanceof ApiError) {
        showAlert({ message: e.message, severity: 'error' });
      } else {
        throw e;
      }
    } finally {
      setSubmitLoading(false);
      setOpenConfirmationModal(false);
    }
  };

  const handleSubmitClick = (event) => {
    event.preventDefault();

    if (formState.orders.length < 2) {
      showAlert({
        severity: 'error',
        message: 'Chained orders require at least 2 orders.',
      });
      return;
    }

    const sortedOrders = formState.orders.sort((a, b) => a.priority - b.priority);

    // Create chained order data for confirmation modal
    const firstOrder = sortedOrders[0];
    const orderCount = sortedOrders.length;

    // Calculate totals for display
    const baseQtyPerOrder = firstOrder.base_asset_qty || 0;
    const quoteQtyPerOrder = firstOrder.quote_asset_qty || 0;
    const totalBaseQty = baseQtyPerOrder * orderCount;
    const totalQuoteQty = quoteQtyPerOrder * orderCount;
    const totalDuration = firstOrder.duration * orderCount;

    const confirmationData = {
      orders_in_chain: sortedOrders,
      accounts: firstOrder.accounts || [],
      strategy: firstOrder.strategy || firstOrder.super_strategy,
      duration: firstOrder.duration,
      engine_passiveness: firstOrder.engine_passiveness,
      schedule_discretion: firstOrder.schedule_discretion,
      totalBaseQty,
      totalQuoteQty,
      totalDuration,
    };

    setChainedOrderData(confirmationData);
    setOpenConfirmationModal(true);
  };

  if (loading) {
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
    <ExchangeTickerProvider exchangeName='Binance'>
      <Stack direction='column' height='100%' spacing={1}>
        <Box height='100%'>
          <Stack direction='row' height='100%' spacing={2} width='100%'>
            <Card sx={{ marginTop: '20px', width: '80%', height: '100%' }}>
              <CardContent
                sx={{
                  paddingBottom: '16px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflowY: 'auto',
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <ChainChart
                    handleDeleteOnClick={handleDeleteOnClick}
                    handlePriorityChange={handlePriorityChange}
                    orders_in_chain={formState.orders}
                    orderView={false}
                    strategies={strategies}
                    superStrategies={superStrategies}
                    trajectories={trajectories}
                  />
                </Box>

                <Box
                  sx={{
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 1,
                    backgroundColor: theme.palette.card.main,
                    padding: '0px 32px 32px 32px',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <Tooltip title='Add new order item'>
                    <div>
                      {!submitLoading ? (
                        <Button
                          fullWidth
                          color='primary'
                          disabled={formState.orders.length < 2}
                          size='large'
                          type='submit'
                          variant='outlined'
                          onClick={handleSubmitClick}
                        >
                          Submit Chained Orders
                        </Button>
                      ) : (
                        <Button disabled fullWidth size='large' sx={{ width: '205.92' }} variant='outlined'>
                          <CircularProgress size={20} />
                        </Button>
                      )}
                    </div>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ width: '30%', height: '100%' }}>
              <CardContent sx={{ paddingBottom: '16px', height: 'calc(100% - 32px)' }}>
                <ChainedOrdersSubmitForm
                  isAuthenticated
                  addNewRow={() => addOrderRow({ getFormData })}
                  FormAtoms={FormAtoms}
                />
              </CardContent>
            </Card>
          </Stack>
        </Box>

        {/* Chained Order Confirmation Modal */}
        <ChainedOrderConfirmationModal
          isSubmitted={submitLoading}
          props={{
            chainedOrderData,
            handleConfirm: handleSubmit,
            open: openConfirmationModal,
            setOpen: setOpenConfirmationModal,
          }}
        />
      </Stack>
    </ExchangeTickerProvider>
  );
}
