/* eslint-disable no-await-in-loop */
import { SharedOrderTable } from '@/shared/orderTable/SharedOrderTable';
import Box from '@mui/material/Box';
import React, { useContext, useEffect, useRef, useState } from 'react';

import { getOrderTableRows, refreshAllAccountBalanceCache } from '@/apiServices';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import ChipStatusFilter from '@/shared/orderTable/ChipStatusFilter';

import { useAuthModal } from '@/shared/context/AuthModalProvider';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { matchPair, matchPairByBaseAndExchange } from '@/shared/formUtil';
import useViewport from '@/shared/hooks/useViewport';
import { keyframes } from '@emotion/react';
import ExchangeIcons from '@images/exchange_icons';
import { Sync as SyncIcon } from '@mui/icons-material';
import { Button, Chip, Divider, Stack, Typography, useTheme } from '@mui/material';
import BalancesTab from './BalancesTab';
import PositionsTab from './PositionsTab';
import { useAccountBalanceContext } from './orderEntry/AccountBalanceContext';

function OrderTable() {
  const ordersRequestIdRef = useRef(0);
  const { balances, isBalanceLoading, activeTab, setActiveTab } = useAccountBalanceContext();
  const [orders, setOrders] = useState([]);
  const [statusHighlight, setStatusHighlight] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState([]);
  const [pairFilter, setPairFilter] = useState(false);
  const [balancesPairFilter, setBalancesPairFilter] = useState(false);
  const [selectedExchanges, setSelectedExchanges] = useState([]);

  // Define the rotation animation
  const rotate = keyframes`
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  `;

  const { showAlert } = useContext(ErrorContext);
  const { user, isDev, isRetail } = useUserMetadata();
  const { openLoginModal, openSignupModal } = useAuthModal();
  const { isMobile } = useViewport();
  const theme = useTheme();
  const {
    FormAtoms,
    initialLoadValue,
    selectedPair,
    setSelectedPair: setOrderFormPair,
    setSelectedAccounts: setOrderFormAccounts,
    setSelectedSide,
    setBaseQty,
    setSelectedStrategyParams,
  } = useOrderForm();
  const { tokenPairs } = initialLoadValue;

  useEffect(() => {
    setPairFilter(false);
    setBalancesPairFilter(false);
  }, [selectedPair]);

  const getDashboardOrders = async (reload = false, requestId = null) => {
    if (!user || !user.is_authenticated) {
      setLoading(false);
      return false;
    }

    // don't show loading mask for interval reload
    if (!reload) {
      setLoading(true);
    }

    try {
      let allOrders = [];

      // If multiple statuses are selected, fetch each status separately and combine results
      if (statusHighlight && statusHighlight.length > 1) {
        const statusPromises = statusHighlight.map((status) => {
          const params = {
            status,
            type: typeFilter,
            page_size: 10,
            market_type: ['spot', 'perp', 'future'],
            market_type_filter_exception: true,
          };
          if (pairFilter && selectedPair.id) {
            params.pair = selectedPair.id;
          }
          return getOrderTableRows(params);
        });

        const statusResults = await Promise.all(statusPromises);
        allOrders = statusResults.flatMap((result) => result.orders || []);

        // Remove duplicates based on order ID
        const seenIds = new Set();
        allOrders = allOrders.filter((order) => {
          if (seenIds.has(order.id)) {
            return false;
          }
          seenIds.add(order.id);
          return true;
        });
      } else {
        // Single status or no status filter - use original logic
        const params = {
          status: statusHighlight,
          type: typeFilter,
          page_size: 10,
          market_type: ['spot', 'perp', 'future'],
          market_type_filter_exception: true,
        };
        if (pairFilter && selectedPair.id) {
          params.pair = selectedPair.id;
        }

        const data = await getOrderTableRows(params);
        allOrders = data.orders || [];
      }

      // Apply client-side status filtering for batched orders to respect chip selection
      let filteredOrders = allOrders;
      if (statusHighlight && statusHighlight.length > 0) {
        const statuses = Array.isArray(statusHighlight) ? statusHighlight : [statusHighlight];
        filteredOrders = filteredOrders.filter((row) => {
          if (!row) return false;
          if (row.side === 'Batch') {
            return statuses.includes(row.status);
          }
          return true;
        });
      }

      // Apply pair filtering when "Current pair" is checked
      if (pairFilter && selectedPair && selectedPair.id) {
        const selectedPairId = selectedPair.id; // Store the ID to avoid null reference errors
        filteredOrders = filteredOrders.filter((row) => {
          if (!row) return false;

          // For SINGLE orders, check exact pair match
          if (row.side !== 'Multi' && row.side !== 'Chained' && row.side !== 'Batch') {
            return row.pair === selectedPairId;
          }

          // For MULTI/CHAINED/BATCH orders, check if pairs array contains the selected pair
          if (row.pairs && Array.isArray(row.pairs)) {
            return row.pairs.includes(selectedPairId);
          }

          // Fallback: check if the pair field matches (for orders without pairs array)
          return row.pair === selectedPairId;
        });
      }

      // Only update state if this is the latest request
      if (requestId === null || requestId === ordersRequestIdRef.current) {
        setOrders(filteredOrders);
        if (!reload) {
          setLoading(false);
        }
      }
      return true;
    } catch (error) {
      if (requestId === null || requestId === ordersRequestIdRef.current) {
        showAlert({ severity: 'error', message: error.message });
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let success = true;
    let initialPoll = true;

    const pollData = async () => {
      while (isMounted && success) {
        const requestId = Date.now();
        ordersRequestIdRef.current = requestId;

        success = await getDashboardOrders(!initialPoll, requestId);
        initialPoll = false;

        await new Promise((resolve) => {
          setTimeout(resolve, 2000);
        });
      }
    };

    pollData();

    return () => {
      isMounted = false;
    };
  }, [statusHighlight, typeFilter, pairFilter]);

  const formatExchangeName = (name) => {
    if (name?.toLowerCase() === 'okx') {
      return 'OKX';
    }
    if (name?.toLowerCase() === 'okxdex') {
      return 'OKXDEX';
    }
    return name;
  };

  const getExchangeIcon = (exchangeName) => {
    return ExchangeIcons[exchangeName?.toLowerCase()] || ExchangeIcons.default;
  };

  const handleExchangeFilter = (exchangeName) => {
    setSelectedExchanges((prev) => {
      if (prev.includes(exchangeName)) {
        return prev.filter((ex) => ex !== exchangeName);
      }
      return [...prev, exchangeName];
    });
  };

  // Helper function to normalize exchange filtering (includes BinancePM when Binance is selected)
  const normalizeExchangeFilter = (exchangeName) => {
    if (exchangeName === 'Binance') {
      return ['Binance', 'BinancePM'];
    }
    return [exchangeName];
  };

  // Helper function to check if a balance should be included based on selected exchanges
  const shouldIncludeBalance = (balanceExchangeName, selectedExchangesList) => {
    if (selectedExchangesList.length === 0) return true;

    return selectedExchangesList.some((selectedExchange) => {
      const normalizedExchanges = normalizeExchangeFilter(selectedExchange);
      return normalizedExchanges.includes(balanceExchangeName);
    });
  };

  // Shared order handlers
  const handleLiquidate = (row) => {
    const isToken = row.assetType === 'token';
    const matchingPair = isToken
      ? matchPairByBaseAndExchange(tokenPairs, row.token, [row.exchange], false)
      : matchPair(tokenPairs, row.token);
    if (matchingPair) {
      const side = row.quantity > 0 ? 'sell' : 'buy';
      setOrderFormPair(matchingPair);
      setOrderFormAccounts([row.account]);
      setSelectedSide(side);
      setBaseQty(Math.abs(row.quantity));
      setSelectedStrategyParams({ reduce_only: true });
    } else {
      showAlert({ severity: 'error', message: `No matching pair found: ${row.token} on ${row.exchange}` });
    }
  };

  const handleDoubleDown = (row) => {
    const isToken = row.assetType === 'token';
    const matchingPair = isToken
      ? matchPairByBaseAndExchange(tokenPairs, row.token, [row.exchange], false)
      : matchPair(tokenPairs, row.token);

    if (matchingPair) {
      const side = row.quantity > 0 ? 'buy' : 'sell';
      setOrderFormPair(matchingPair);
      setOrderFormAccounts([row.account]);
      setSelectedSide(side);
      setBaseQty(Math.abs(row.quantity));
      setSelectedStrategyParams({});
    } else {
      showAlert({ severity: 'error', message: `No matching pair found: ${row.token} on ${row.exchange}` });
    }
  };

  const handleReverse = (row) => {
    const isToken = row.assetType === 'token';
    const matchingPair = isToken
      ? matchPairByBaseAndExchange(tokenPairs, row.token, [row.exchange], false)
      : matchPair(tokenPairs, row.token);

    if (matchingPair) {
      const side = row.quantity > 0 ? 'sell' : 'buy';
      const quantity = Math.abs(row.quantity) * 2;

      setOrderFormPair(matchingPair);
      setOrderFormAccounts([row.account]);
      setSelectedSide(side);
      setBaseQty(quantity);
      setSelectedStrategyParams({});
    } else {
      showAlert({ severity: 'error', message: `No matching pair found: ${row.token} on ${row.exchange}` });
    }
  };

  const handleTokenClick = (row) => {
    const isToken = row.assetType === 'token';
    const matchingPair = isToken
      ? matchPairByBaseAndExchange(tokenPairs, row.token, [row.exchange], false)
      : matchPair(tokenPairs, row.token);

    if (matchingPair) {
      setOrderFormPair(matchingPair);
      setOrderFormAccounts([row.account]);
      // Don't set quantity at all - let it remain empty
    } else {
      showAlert({ severity: 'error', message: `No matching pair found: ${row.token} on ${row.exchange}` });
    }
  };

  // Get unique exchanges from balances data
  const getAvailableExchanges = () => {
    if (!balances) return [];

    const exchanges = new Set();
    Object.values(balances).forEach((balance) => {
      if (balance.assets && balance.assets.length > 0) {
        // Exclude BinancePM since it's now included with Binance
        if (balance.exchange_name !== 'BinancePM') {
          exchanges.add(balance.exchange_name);
        }
      }
    });
    return Array.from(exchanges);
  };

  const emptyMobileView =
    !loading && isMobile && orders.length === 0 && statusHighlight.length === 0 && typeFilter.length === 0;

  // Check if user is authenticated for all tabs
  const isAuthenticated = user && user.is_authenticated;

  if (emptyMobileView) {
    return (
      <Box alignItems='center' display='flex' justifyContent='center'>
        {isAuthenticated ? (
          <Typography variant='subtitle1'>No orders found</Typography>
        ) : (
          <Stack alignItems='center' direction='row' gap={1}>
            <Button
              size='small'
              sx={{ backgroundColor: theme.palette.primary.main }}
              variant='contained'
              onClick={openLoginModal}
            >
              <Typography variant={theme.typography.button}>Log in</Typography>
            </Button>
            {isRetail && (
              <>
                <Typography variant='subtitle1'>or</Typography>
                <Button color='primary' size='small' variant='contained' onClick={openSignupModal}>
                  <Typography color={theme.palette.text.offBlack} variant='subtitle1'>
                    Sign up
                  </Typography>
                </Button>
              </>
            )}
            <Typography variant='body1'>to see orders</Typography>
          </Stack>
        )}
      </Box>
    );
  }

  const availableExchanges = getAvailableExchanges();

  const handleOrderPairClick = (pair, accounts) => {
    setOrderFormPair(pair);
    // Filter to only valid, known accounts present in initialLoadValue.accounts
    const validAccounts = Array.isArray(accounts)
      ? accounts.filter((accName) => accName && initialLoadValue?.accounts?.[accName]?.exchangeName)
      : [];
    setOrderFormAccounts(validAccounts);
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Stack
          alignItems='center'
          direction='row'
          justifyContent='space-between'
          spacing={1}
          sx={{ mb: 2, minHeight: '42px' }}
        >
          <Stack alignItems='center' direction='row' spacing={1}>
            <Button
              color={activeTab === 0 ? 'primary' : 'info'}
              sx={{
                height: '28px',
                whiteSpace: 'nowrap',
                alignItems: 'center',
              }}
              variant='text'
              onClick={() => setActiveTab(0)}
            >
              Orders
            </Button>
            <Divider orientation='vertical' style={{ height: '28px' }} />
            <Stack alignItems='center' direction='row' spacing={0.5}>
              <Button
                color={activeTab === 1 ? 'primary' : 'info'}
                sx={{
                  height: '28px',
                  whiteSpace: 'nowrap',
                  alignItems: 'center',
                }}
                variant='text'
                onClick={() => setActiveTab(1)}
              >
                Positions
              </Button>
            </Stack>
            <Divider orientation='vertical' style={{ height: '28px' }} />
            <Stack alignItems='center' direction='row' spacing={0.5}>
              <Button
                color={activeTab === 2 ? 'primary' : 'info'}
                sx={{
                  height: '28px',
                  whiteSpace: 'nowrap',
                  alignItems: 'center',
                }}
                variant='text'
                onClick={() => setActiveTab(2)}
              >
                Balances
              </Button>
            </Stack>
          </Stack>

          {/* Right side: Exchange Filter Chips for balances and positions tabs, ChipStatusFilter for orders tab */}
          {(activeTab === 1 || activeTab === 2) && availableExchanges.length > 0 && (
            <Box alignItems='left' display='flex'>
              <Stack direction='row' spacing={2} style={{ overflowX: 'auto', minWidth: '50px' }}>
                {selectedPair && selectedPair.id && (
                  <Chip
                    label={selectedPair.base}
                    sx={{
                      borderRadius: '3px',
                      minWidth: '80px',
                      fontSize: '0.7rem',
                      height: '28px',
                      borderColor: balancesPairFilter ? theme.palette.primary.main : theme.palette.text.disabled, // 70% opacity
                      color: balancesPairFilter ? theme.palette.primary.main : theme.palette.text.disabled,
                    }}
                    variant='outlined'
                    onClick={() => setBalancesPairFilter(!balancesPairFilter)}
                  />
                )}
                {availableExchanges.map((exchange) => (
                  <Chip
                    color='default'
                    icon={
                      <img
                        alt={formatExchangeName(exchange)}
                        src={getExchangeIcon(exchange)}
                        style={{
                          borderRadius: '50%',
                          height: '16px',
                          width: '16px',
                        }}
                      />
                    }
                    key={exchange}
                    label={formatExchangeName(exchange)}
                    sx={{
                      borderRadius: '3px',
                      fontSize: '0.7rem',
                      height: '28px',
                      minWidth: '80px',
                      ...(selectedExchanges.includes(exchange) && {
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          borderColor: 'primary.light',
                          color: 'primary.light',
                        },
                      }),
                    }}
                    variant='outlined'
                    onClick={() => handleExchangeFilter(exchange)}
                  />
                ))}
                <Chip
                  color='primary'
                  disabled={isBalanceLoading || (user && user.is_superuser)}
                  icon={
                    <SyncIcon
                      sx={{
                        fontSize: '0.875rem',
                        animation: isBalanceLoading ? `${rotate} 1s linear infinite` : 'none',
                        color: theme.palette.semantic.warning, // Orange color that stays during animation
                      }}
                    />
                  }
                  label='Refresh'
                  sx={{
                    borderRadius: '3px',
                    fontSize: '0.7rem',
                    height: '28px',
                    minWidth: '80px',
                    '&:hover': {
                      backgroundColor: `${theme.palette.primary.main}1A`, // 10% opacity
                    },
                  }}
                  variant='outlined'
                  onClick={async () => {
                    try {
                      await refreshAllAccountBalanceCache();
                    } catch (error) {
                      showAlert({ severity: 'error', message: error.message });
                    }
                  }}
                />
              </Stack>
            </Box>
          )}
          {activeTab === 0 && (
            <Box alignItems='left' display='flex'>
              <ChipStatusFilter
                dashboardView
                disabled={loading || !isAuthenticated}
                isDev={isDev}
                isSuperUser={user && user.is_superuser}
                loadOrders={isAuthenticated ? getDashboardOrders : undefined}
                pairFilter={pairFilter}
                selectedPair={selectedPair}
                setLoading={setLoading}
                setPairFilter={setPairFilter}
                setStatusHighlight={setStatusHighlight}
                setTypeFilter={setTypeFilter}
                statusHighlight={statusHighlight}
                typeFilter={typeFilter}
              />
            </Box>
          )}
        </Stack>
      </Box>
      <Box style={{ height: 'calc(100% - 52px)', overflow: isAuthenticated ? 'auto' : 'hidden', position: 'relative' }}>
        {!isAuthenticated ? (
          <Box
            alignItems='center'
            display='flex'
            height='100%'
            justifyContent='center'
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '100%',
            }}
          >
            <Stack alignItems='center' direction='row' gap={1}>
              <Button
                size='small'
                sx={{ backgroundColor: theme.palette.primary.main }}
                variant='contained'
                onClick={openLoginModal}
              >
                <Typography color={theme.palette.text.offBlack} variant='button1'>
                  Login
                </Typography>
              </Button>
              {isRetail && (
                <>
                  <Typography sx={{ paddingTop: '4px' }} variant='subtitle1'>
                    or
                  </Typography>
                  <Button color='primary' size='small' variant='contained' onClick={openSignupModal}>
                    <Typography color={theme.palette.text.offBlack} variant='subtitle1'>
                      Sign up
                    </Typography>
                  </Button>
                </>
              )}
              <Typography sx={{ paddingTop: '4px', paddingLeft: '4px' }} variant='subtitle2'>
                to see{' '}
                {(() => {
                  if (activeTab === 0) return 'orders';
                  if (activeTab === 1) return 'positions';
                  return 'balances';
                })()}
              </Typography>
            </Stack>
          </Box>
        ) : (
          <>
            {activeTab === 0 && (
              <SharedOrderTable
                dashboardView
                FormAtoms={FormAtoms}
                loading={loading}
                orderData={orders}
                orderRefresh={getDashboardOrders}
                tokenPairs={tokenPairs}
                onPairClick={handleOrderPairClick}
              />
            )}
            {activeTab === 1 && (
              <PositionsTab
                balances={balances}
                balancesPairFilter={balancesPairFilter ? selectedPair.id : ''}
                handleDoubleDown={handleDoubleDown}
                handleLiquidate={handleLiquidate}
                handleReverse={handleReverse}
                handleTokenClick={handleTokenClick}
                isAuthenticated={isAuthenticated}
                isMobile={isMobile}
                loading={isBalanceLoading}
                selectedExchanges={selectedExchanges}
                shouldIncludeBalance={shouldIncludeBalance}
              />
            )}
            {activeTab === 2 && (
              <BalancesTab
                balances={balances}
                balancesPairFilter={(() => {
                  if (!balancesPairFilter) return '';
                  return selectedPair.chain_id !== undefined ? selectedPair.id : selectedPair.base;
                })()}
                handleDoubleDown={handleDoubleDown}
                handleLiquidate={handleLiquidate}
                handleTokenClick={handleTokenClick}
                isAuthenticated={isAuthenticated}
                isMobile={isMobile}
                loading={isBalanceLoading}
                selectedExchanges={selectedExchanges}
                shouldIncludeBalance={shouldIncludeBalance}
              />
            )}
          </>
        )}
      </Box>
    </>
  );
}

export default OrderTable;
