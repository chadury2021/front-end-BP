import React, { useContext, useEffect } from 'react';
import { Box, Button, Card, CardContent, Paper, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import useViewport from '@/shared/hooks/useViewport';
import { InitialLoadDataProvider } from '@/shared/context/InitialLoadDataProvider';
import { isDexToken } from '@/shared/dexUtils';
import DataComponent from '@/shared/DataComponent';
import { OkxDexMarketDataProvider } from '@/shared/context/OkxDexMarketDataProvider';
import { ExchangeTickerProvider } from '@/shared/context/ExchangeTickerProvider';
import resolveExchangeName from '@/shared/utils/resolveExchangeName';
import { ErrorContext } from '../../shared/context/ErrorProvider';
import { Loader } from '../../shared/Loader';
import FavoritePairTabs from './orderEntry/FavoritePairTabs';
import { MarketDataProvider } from './orderEntry/MarketDataContext';
import { AccountBalanceProvider } from './orderEntry/AccountBalanceContext';
import OrderEntryForm from './orderEntry/OrderEntryForm';
import { PriceDataProvider } from './orderEntry/PriceDataContext';
import DexOrderEntryForm from './orderEntry/DexOrderEntryForm';
import OrderTable from './OrderTable';
import { PairInfoBar } from './PairInfoBar';
import NewTradingViewChart from './charts/NewTradingViewChart';
import OKXDexSummaryCard from './OKXDexSummaryCard';
import PriceCard from './PriceCard';
import { useUserMetadata } from '../../shared/context/UserMetadataProvider';
import useQueryParams from '../../shared/hooks/useQueryParams';
import { DexTokenRankingProvider } from '../../shared/context/DexTokenRankingProvider';
/**
 * Main order entry page component that provides market data and price streaming.
 *
 * Provider Hierarchy:
 * ```
 * <PriceDataProvider>          // Handles websocket connections for real-time price/orderbook data
 *   <MarketDataProvider>       // Handles market metrics, charts and predictions
 *     <AccountBalanceProvider> // Handles fetching user account balances
 *       <Components/>          // All child components have access to both contexts
 *     </AccountBalanceProvider>
 *  </MarketDataProvider>
 * </PriceDataProvider>
 * ```
 *
 * Important Notes:
 * - PriceDataProvider wraps MarketDataProvider as market data calculations
 *   depend on real-time price information (?)
 * - Both providers are initialized with the same exchangeName and pair props
 * - Components using both contexts should handle potential race conditions during
 *   initial data loading
 *
 * @component
 * @example
 * return (
 *   <OrderEntryPage />
 * )
 *
 * @todo Verify websocket reconnection behavior in PriceDataProvider
 * @todo Add coordination between contexts to prevent race conditions
 * @todo Consider adding error boundaries between providers
 * @todo Document required provider nesting order for future maintainers
 */
export default function OrderEntryPage() {
  const { showAlert } = useContext(ErrorContext);
  const [queryParams, setQueryParam] = useQueryParams();
  const { isMobile } = useViewport();

  const {
    FormAtoms,
    selectedPair,
    selectedAccounts,
    loading,
    initialLoadValue,
    setBaseQtyPlaceholder,
    setQuoteQtyPlaceholder,
    setSelectedAccounts,
  } = useOrderForm();

  const { user } = useUserMetadata();
  const { tokenPairs, accounts } = initialLoadValue;

  const requiresSecurityUpgrade = Boolean(user?.is_authenticated && user?.is_mfa_enforced && !user?.is_2fa_enabled);
  const tradingGuarded = !user?.is_authenticated || requiresSecurityUpgrade;

  const tradingGuardStyles = {
    filter: tradingGuarded ? 'blur(2px)' : 'none',
    pointerEvents: tradingGuarded ? 'none' : 'auto',
    opacity: tradingGuarded ? 0.8 : 1,
    transition: 'filter 0.2s ease, opacity 0.2s ease',
  };

  const renderMfaOverlay = () =>
    requiresSecurityUpgrade ? (
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          zIndex: 2,
          px: 2,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            maxWidth: 360,
            width: '100%',
            borderRadius: 4,
            p: 3,
            textAlign: 'center',
          }}
        >
          <Stack alignItems='center' spacing={2}>
            <Typography variant='h6'>Two-factor authentication required</Typography>
            <Typography color='text.secondary' variant='body2'>
              Enable 2FA to unlock the trading form.
            </Typography>
            <Button component={Link} size='medium' to='/settings?tab=security' variant='contained'>
              Go to Security settings
            </Button>
          </Stack>
        </Paper>
      </Box>
    ) : null;

  const getRelevantExchangeName = (pair) => {
    let exchange = 'Binance';

    const firstSelectedAccountDetails =
      selectedAccounts.length > 0 ? initialLoadValue.accounts[selectedAccounts[0]] : null;

    if (firstSelectedAccountDetails) {
      exchange = resolveExchangeName(firstSelectedAccountDetails.exchangeName);
    } else if (isDexToken(pair)) {
      return 'OKXDEX';
    } else if (tokenPairs && tokenPairs.length > 0) {
      const [firstExchange] = tokenPairs
        .filter((p) => p.id === pair)
        .map((p) => p.exchanges.filter((e) => e !== 'MockExchange'));
      if (firstExchange && firstExchange.length > 0 && !firstExchange.includes(exchange)) {
        [exchange] = firstExchange;
      }
    }

    return exchange;
  };

  const pair = selectedPair ? selectedPair.id : queryParams.pair || 'BTC:PERP-USDT';
  const exchangeName = getRelevantExchangeName(pair);

  // Check if the selected pair is an OKXDEX pair (has chain_id property)
  const isOKXDEXPair = selectedPair && selectedPair.chain_id !== undefined;

  useEffect(() => {
    if (selectedPair) {
      setBaseQtyPlaceholder(selectedPair.base);
      setQuoteQtyPlaceholder(selectedPair.quote);
      setQueryParam('pair', selectedPair.id);

      if (isOKXDEXPair) {
        const dexAccountsOnly = selectedAccounts.filter((acc) => accounts[acc]?.exchangeName === 'OKXDEX');
        setSelectedAccounts(dexAccountsOnly || []);
      } else {
        const cexAccountsOnly = selectedAccounts.filter(
          (acc) => accounts[acc]?.exchangeName && accounts[acc].exchangeName !== 'OKXDEX'
        );
        setSelectedAccounts(cexAccountsOnly || []);
      }
    }
  }, [selectedPair]);

  return (
    <InitialLoadDataProvider pair={pair}>
      <DexTokenRankingProvider>
        <OkxDexMarketDataProvider pair={pair}>
          <ExchangeTickerProvider exchangeName={exchangeName}>
            <PriceDataProvider exchangeName={exchangeName} pair={pair}>
              <MarketDataProvider exchangeName={exchangeName} pair={pair} showAlert={showAlert}>
                <AccountBalanceProvider>
                  <DataComponent
                    isLoading={loading}
                    loadingComponent={
                      <Stack height='100%'>
                        <Card>
                          <CardContent>
                            <Loader />
                          </CardContent>
                        </Card>
                      </Stack>
                    }
                  >
                    {isMobile ? (
                      <Stack direction='column' spacing={2}>
                        <Card style={{ height: '60px' }}>
                          <CardContent style={{ padding: '8px', height: 'calc(100% - 16px)' }}>
                            <PairInfoBar
                              exchangeName={exchangeName}
                              selectedPairName={selectedPair?.label}
                              showAlert={showAlert}
                            />
                          </CardContent>
                        </Card>
                        <Card style={{ height: '300px' }}>
                          <NewTradingViewChart
                            isMobile
                            exchangeName={exchangeName}
                            pair={selectedPair}
                            symbol={`${exchangeName}|${pair}`}
                          />
                        </Card>
                        <Box sx={{ position: 'relative' }}>
                          {renderMfaOverlay()}
                          <Paper elevation={0} sx={tradingGuardStyles}>
                            <Card>
                              <CardContent>
                                {exchangeName === 'OKXDEX' ? (
                                  <DexOrderEntryForm isAdvanced={false} />
                                ) : (
                                  <OrderEntryForm />
                                )}
                              </CardContent>
                            </Card>
                          </Paper>
                        </Box>
                        <Card sx={{ flexGrow: 1, minHeight: '300px', height: '100%' }}>
                          <CardContent sx={{ height: '100%', overflow: 'auto' }}>
                            {isOKXDEXPair ? (
                              <OKXDexSummaryCard pair={selectedPair} />
                            ) : (
                              <PriceCard exchangeName={exchangeName} pair={pair} />
                            )}
                          </CardContent>
                        </Card>
                        <Card sx={{ width: '100%', height: '300px', minHeight: '200px' }}>
                          <CardContent sx={{ height: '100%', overflow: 'auto' }}>
                            <OrderTable FormAtoms={FormAtoms} />
                          </CardContent>
                        </Card>
                      </Stack>
                    ) : (
                      <Stack alignItems='stretch' direction='row' spacing={2} style={{ height: '100%' }}>
                        <Stack direction='column' height='100%' spacing={2} width='75%'>
                          <Paper elevation={0}>
                            <FavoritePairTabs exchangeName={exchangeName} FormAtoms={FormAtoms} />
                          </Paper>

                          <Stack direction='row' spacing={2} sx={{ flexGrow: 1, minHeight: 0 }}>
                            <Stack direction='column' spacing={2} sx={{ width: '75%', height: '100%' }}>
                              <Card sx={{ height: '60px' }}>
                                <CardContent sx={{ padding: '8px', height: 'calc(100% - 16px)' }}>
                                  <PairInfoBar
                                    exchangeName={exchangeName}
                                    selectedPairName={selectedPair?.label}
                                    showAlert={showAlert}
                                  />
                                </CardContent>
                              </Card>
                              <Card sx={{ flexGrow: 1, minHeight: 0 }}>
                                <NewTradingViewChart
                                  exchangeName={exchangeName}
                                  pair={selectedPair}
                                  symbol={`${exchangeName}|${pair}`}
                                />
                              </Card>
                            </Stack>
                            <Paper elevation={0} sx={{ width: '25%', height: '100%', overflow: 'auto' }}>
                              {isOKXDEXPair ? (
                                <OKXDexSummaryCard pair={selectedPair} />
                              ) : (
                                <PriceCard exchangeName={exchangeName} pair={pair} />
                              )}
                            </Paper>
                          </Stack>

                          <Stack direction='row' spacing={2} sx={{ height: '40%', minHeight: '200px' }}>
                            <Card sx={{ width: '100%', height: '100%' }}>
                              <CardContent>
                                <OrderTable FormAtoms={FormAtoms} />
                              </CardContent>
                            </Card>
                          </Stack>
                        </Stack>
                        <Box sx={{ position: 'relative', width: '25%', height: '100%' }}>
                          {renderMfaOverlay()}
                          <Paper
                            elevation={0}
                            sx={{
                              width: '100%',
                              height: '100%',
                              ...tradingGuardStyles,
                            }}
                          >
                            <Card sx={{ height: '100%' }}>
                              <CardContent sx={{ height: '100%' }}>
                                {exchangeName === 'OKXDEX' ? (
                                  <DexOrderEntryForm isAdvanced={false} />
                                ) : (
                                  <OrderEntryForm />
                                )}
                              </CardContent>
                            </Card>
                          </Paper>
                        </Box>
                      </Stack>
                    )}
                  </DataComponent>
                </AccountBalanceProvider>
              </MarketDataProvider>
            </PriceDataProvider>
          </ExchangeTickerProvider>
        </OkxDexMarketDataProvider>
      </DexTokenRankingProvider>
    </InitialLoadDataProvider>
  );
}
