import React, { useState, useEffect } from 'react';
import { Container, Paper, Box, Typography, Button, Tabs, Tab, useTheme } from '@mui/material';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { InitialLoadDataProvider } from '@/shared/context/InitialLoadDataProvider';
import DataComponent from '@/shared/DataComponent';
import { useAuthModal } from '@/shared/context/AuthModalProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import backgroundImage from '@images/bg/simple-order-bg.png';
import { DexTokenRankingProvider } from '@/shared/context/DexTokenRankingProvider';
import SimpleOrderEntryForm, { SimpleOrderEntrySkeleton } from './orderEntry/SimpleOrderEntryForm';
import { AccountBalanceProvider } from './orderEntry/AccountBalanceContext';
import { PriceDataProvider } from './orderEntry/PriceDataContext';
import DexOrderEntryForm from './orderEntry/DexOrderEntryForm';

function SwapEntryPage() {
  const { selectedPair, selectedAccounts, initialLoadValue, loading, setSelectedAccounts } = useOrderForm();
  const { tokenPairs, accounts } = initialLoadValue;
  const { user } = useUserMetadata();
  const { openLoginModal } = useAuthModal();
  const theme = useTheme();
  const isAuthenticated = user?.is_authenticated;
  const [tabValue, setTabValue] = useState(0);
  const getRelevantExchangeName = (pair) => {
    let exchange = 'Binance';

    const firstSelectedAccountDetails =
      selectedAccounts.length > 0 ? initialLoadValue.accounts[selectedAccounts[0]] : null;

    if (firstSelectedAccountDetails) {
      exchange = firstSelectedAccountDetails.exchangeName;
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

  const pair = selectedPair ? selectedPair.id : 'BTC:PERP-USDT';
  const exchangeName = getRelevantExchangeName(pair);

  useEffect(() => {
    if (selectedAccounts.length > 0) {
      setTabValue(exchangeName === 'OKXDEX' ? 1 : 0);
    }
  }, [exchangeName, selectedAccounts]);

  useEffect(() => {
    if (selectedPair?.market_type === 'dex') {
      const dexAccountsOnly = selectedAccounts.filter((acc) => accounts[acc].exchangeName === 'OKXDEX');
      setSelectedAccounts(dexAccountsOnly || []);
    } else {
      const cexAccountsOnly = selectedAccounts.filter((acc) => accounts[acc].exchangeName !== 'OKXDEX');
      setSelectedAccounts(cexAccountsOnly || []);
    }
  }, [selectedPair]);

  return (
    <>
      {/* Background image container */}
      <Box
        sx={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100vh',
          zIndex: -1,
        }}
      />

      {/* Content container */}
      <InitialLoadDataProvider>
        <DexTokenRankingProvider>
          <PriceDataProvider exchangeName={exchangeName} pair={pair}>
            <AccountBalanceProvider>
              <Container maxWidth='xs' sx={{ pt: 10, position: 'relative' }}>
                <Paper
                  elevation={0}
                  sx={{
                    filter: user?.is_authenticated ? 'none' : 'blur(2px)',
                    pointerEvents: user?.is_authenticated ? 'auto' : 'none',
                    opacity: user?.is_authenticated ? 1 : 0.8,
                  }}
                >
                  <Tabs
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                    value={tabValue}
                    variant='fullWidth'
                    onChange={(e, value) => setTabValue(value)}
                  >
                    <Tab label='Standard' value={0} />
                    <Tab label='DEX' value={1} />
                  </Tabs>
                  <Box sx={{ p: 4 }}>
                    <DataComponent isLoading={loading} loadingComponent={<SimpleOrderEntrySkeleton />}>
                      {tabValue === 0 && <SimpleOrderEntryForm isAuthenticated={isAuthenticated} />}
                      {tabValue === 1 && <DexOrderEntryForm isAuthenticated={isAuthenticated} />}
                    </DataComponent>
                  </Box>
                </Paper>
                {!isAuthenticated && (
                  <Button
                    fullWidth
                    size='large'
                    sx={{
                      mt: 2,
                      backgroundColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: theme.palette.brand?.[500] || theme.palette.primary.main,
                      },
                    }}
                    variant='contained'
                    onClick={openLoginModal}
                  >
                    <Typography sx={{ color: 'text.primary' }} variant='subtitle1'>
                      Login to trade
                    </Typography>
                  </Button>
                )}
              </Container>
            </AccountBalanceProvider>
          </PriceDataProvider>
        </DexTokenRankingProvider>
      </InitialLoadDataProvider>
    </>
  );
}

export default SwapEntryPage;
