import React, { useMemo, useState } from 'react';
import { Box, Stack, Typography, Paper, Card, CardContent, Tabs, Tab, Divider } from '@mui/material';
import FundingDashboard from '@/pages/accountBalance/portfolio/FundingDashboard';
import { ExchangeTickerProvider } from '@/shared/context/ExchangeTickerProvider';
import { Loader } from '@/shared/Loader';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import YieldOrderForm from './YieldOrderForm';
import { YieldPageProvider, useYieldPage } from './context/YieldPageContext';
import { useYieldPageData } from './hooks/useYieldPageData';
import FundingPerpAnalytics from './components/YieldAnalytics';
import FundingRateMatrix from './components/FundingRateMatrix';

function YieldPageContent() {
  const TAB_KEYS = useMemo(
    () => ({
      PERP: 'perp-analytics',
      PORTFOLIO: 'portfolio-analytics',
      FUNDING_MATRIX: 'funding-matrix',
    }),
    []
  );

  const [activeTab, setActiveTab] = useState(TAB_KEYS.PERP);
  const { isDev } = useUserMetadata();
  const {
    accounts,
    selectedAccountName,
    setSelectedAccountName,
    selectedAccount,
    loading,
    error,
    orderAccountsMap,
    tokenPairs,
    defaultStrategyId,
    strategiesMap,
    orderFormLoading,
    orderFormError,
    fundingRates,
    fundingRatesLoading,
    fundingRatesError,
    selectedPerpOption,
  } = useYieldPage();

  // Load data using the custom hook
  useYieldPageData();

  // Check if yield trading is available (dev only)
  if (!isDev) {
    return (
      <Box height='100%'>
        <Card>
          <CardContent>
            <Typography color='text.secondary' variant='h6'>
              Yield trading is not available
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Determine if the page is still loading
  const isPageLoading = loading || orderFormLoading || fundingRatesLoading;

  const handleTabChange = (_event, newValue) => {
    setActiveTab(newValue);
  };

  const renderPerpAnalytics = () => (
    <ExchangeTickerProvider exchangeName={selectedAccount?.exchangeName}>
      <FundingPerpAnalytics
        fundingRates={fundingRates}
        isLoading={isPageLoading && activeTab === TAB_KEYS.PERP}
        selectedAccount={selectedAccount}
        selectedOption={selectedPerpOption}
      />
    </ExchangeTickerProvider>
  );

  const renderPortfolioAnalytics = () => {
    if (!selectedAccount || loading || error) {
      return (
        <Card elevation={0} sx={{ bgcolor: 'background.paper' }}>
          <CardContent>
            {loading ? (
              <Loader />
            ) : (
              <Typography color='text.secondary'>Select an account to view portfolio analytics.</Typography>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <FundingDashboard
        accountId={selectedAccount.accountId}
        exchangeName={selectedAccount.exchangeName}
        totalEquity={selectedAccount.totalEquity}
      />
    );
  };

  const renderFundingRateMatrix = () => (
    <FundingRateMatrix fundingRates={fundingRates} isLoading={isPageLoading && activeTab === TAB_KEYS.FUNDING_MATRIX} />
  );

  if (isPageLoading) {
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
    <Box sx={{ height: '100vh', width: '100%' }}>
      {/* Header */}
      <Box sx={{ p: { xs: 2, md: 4 }, pb: 2 }}>
        <Typography variant='h4'>Funding Dashboard</Typography>
      </Box>

      {/* Main Layout - 75%/25% split like OrderEntryPage */}
      <Stack
        alignItems='stretch'
        direction='row'
        spacing={2}
        sx={{
          height: 'calc(100vh - 120px)', // Account for header height
          px: { xs: 2, md: 4 },
        }}
      >
        {/* Left Side - 75% width */}
        <Stack direction='column' spacing={2} sx={{ width: '75%', height: '100%' }}>
          <Paper
            elevation={0}
            sx={{
              flexGrow: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
            }}
          >
            <Tabs allowScrollButtonsMobile value={activeTab} variant='scrollable' onChange={handleTabChange}>
              <Tab label='Perp Analytics' value={TAB_KEYS.PERP} />
              <Tab label='Portfolio' value={TAB_KEYS.PORTFOLIO} />
              <Tab label='Rate Matrix' value={TAB_KEYS.FUNDING_MATRIX} />
            </Tabs>
            <Divider />
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {activeTab === TAB_KEYS.PERP && renderPerpAnalytics()}
              {activeTab === TAB_KEYS.PORTFOLIO && renderPortfolioAnalytics()}
              {activeTab === TAB_KEYS.FUNDING_MATRIX && renderFundingRateMatrix()}
            </Box>
          </Paper>
        </Stack>

        {/* Right Side - 25% width (Order Form Sidebar) */}
        <Paper
          elevation={0}
          sx={{
            width: '25%',
            height: '100%',
          }}
        >
          <ExchangeTickerProvider exchangeName={selectedAccount?.exchangeName}>
            <YieldOrderForm
              accounts={accounts}
              accountsError={error}
              accountsLoading={loading}
              accountsMap={orderAccountsMap}
              defaultStrategyId={defaultStrategyId}
              error={orderFormError || fundingRatesError}
              fundingRates={fundingRates}
              loading={orderFormLoading || fundingRatesLoading}
              selectedAccount={selectedAccount}
              selectedAccountName={selectedAccountName}
              strategies={strategiesMap}
              tokenPairs={tokenPairs}
              onAccountSelect={setSelectedAccountName}
            />
          </ExchangeTickerProvider>
        </Paper>
      </Stack>
    </Box>
  );
}

function YieldPage() {
  return (
    <YieldPageProvider>
      <YieldPageContent />
    </YieldPageProvider>
  );
}

export default YieldPage;
