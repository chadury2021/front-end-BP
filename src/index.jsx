/* eslint-disable import/no-import-module-exports */

import { Box } from '@mui/material';
import { StyledEngineProvider, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import Highcharts from 'highcharts/highstock';
import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { OrderFormProvider } from '@/shared/context/OrderFormProvider';
import { WalletProvider } from '@/shared/context/WalletProvider';
import { Buffer } from 'buffer';
import { getVersionData } from './apiServices';
import AccountBalancePage from './pages/accountBalance/AccountBalancePage';
import AccountSettingsPage from './pages/accountSettings/AccountSettingsPage';
import ChainedOrderEntryPage from './pages/chainedOrders/ChainedOrdersEntryPage';
import OrderEntryPage from './pages/dashboard/OrderEntryPage';
import { InitialLoadDataProvider } from './shared/context/InitialLoadDataProvider';
import YieldPage from './pages/yield/YieldPage';

import MultiOrderEntryPage from './pages/multiOrder/MultiOrderEntryPage';
import SwapEntryPage from './pages/dashboard/SwapEntryPage';
import OrderDetailsPage from './pages/orderDetails/algoOrderDetails/OrderDetailsPage';
import OrderSuperDetailPage from './pages/orderDetails/algoOrderDetails/OrderSuperDetailPage';
import MultiOrderDetailsPage from './pages/orderDetails/multiOrderDetails/MultiOrderDetailsPage';
import SimpleOrderDetailsPage from './pages/orderDetails/simpleOrderDetails/SimpleOrderDetailsPage';
import OrderViewPage from './pages/orderView/OrderViewPage';
import PointsPageSeason1 from './pages/points/PointsPageSeason1';
import TransactionCostsPage from './pages/transactionCosts/TransactionCostsPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { ErrorProvider } from './shared/context/ErrorProvider';
import VersionUpdateModal from './shared/VersionUpdateModal';
import { ThemeProvider, useThemeContext } from './theme/ThemeContext';

import '../css/index.css';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { GroupsManagement } from './pages/admin/GroupsManagement';
import TermsAndConditions from './pages/agreements/TermsAndConditions';
import DicyPage from './pages/dicy/DicyPage';

import OptionOrderPage from './pages/optionOrderEntry/OptionOrderPage';
import ChainedOrderDetailsPage from './pages/orderDetails/chainedOrderDetails/ChainedOrderDetailsPage';
import ReferralPage from './pages/referral/ReferralPage';
import MarketMakerPage from './pages/marketMaker/MarketMakerPage';
import DeltaNeutralPage from './pages/deltaNeutral/DeltaNeutralPage';
import AgreementGatedRoute from './routing/AgreementGatedRoute';
import ErrorBoundary from './routing/ErrorBoundary';
import NavBar from './routing/navBar';
import PrivateRoute from './routing/PrivateRoute';
import StaffRoute from './routing/StaffRoute';
import { TitleProvider } from './shared/context/TitleProvider';
import { UserMetadataProvider, useUserMetadata } from './shared/context/UserMetadataProvider';
import { Loader } from './shared/Loader';
import * as OrderFormAtoms from './pages/dashboard/orderEntry/hooks/useFormReducer';
import * as ChainedOrderFormAtoms from './pages/chainedOrders/hooks/useAtomReducer';
import * as OptionOrderFormAtoms from './pages/optionOrderEntry/hooks/useFormReducer';
import useViewport from './shared/hooks/useViewport';
import { AccountsProvider } from './shared/context/AccountsProvider';
import AuthModal from './components/auth/AuthModal';
import { AuthModalProvider, useAuthModal } from './shared/context/AuthModalProvider';
import { TradeConsensusProvider } from './shared/context/TradeConsensusProvider';
import { DexTokenManagerProvider } from './shared/context/DexTokenManagerProvider';
import { DexTokenRankingProvider } from './shared/context/DexTokenRankingProvider';
import { FeatureFlagProvider } from './shared/context/FeatureFlagProvider';
import { KeyManagementModalProvider, useKeyManagementModal } from './shared/context/KeyManagementModalProvider';
import KeyManagementModal from './pages/keyManagement/KeyManagementModal';
import { AccountBalanceProvider } from './pages/dashboard/orderEntry/AccountBalanceContext';
import { ToastProvider } from './shared/context/ToastProvider';
import { AdminPanelDataProvider } from './shared/context/AdminPanelDataProvider';
import OpenOrdersPage from './pages/admin/OpenOrders';
import { AccountApprovalProvider } from './shared/context/AccountApprovalProvider';
import { SolanaWalletProvider } from './shared/context/SolanaWalletProvider';

globalThis.Buffer = Buffer;

Highcharts.setOptions({
  chart: {
    style: {
      fontFamily: 'IBM PLEX MONO',
    },
  },
});

const releaseNotesUrl = 'https://luminous-ganache-c828dc.netlify.app';

const ExplorePage = lazy(() => import('./pages/explore/ExplorePage'));
const ExplorerProofsPage = lazy(() => import('./pages/explorer/ExplorerProofsPage'));
const ExplorerTradesPage = lazy(() => import('./pages/explorer/ExplorerTradesPage'));
const ProofDetailsPage = lazy(() => import('./pages/explorer/proofDetails/ProofDetailsPage'));
const TradeDetailsPage = lazy(() => import('./pages/explorer/tradeDetails/TradeDetailsPage'));
const TraderEpochDetailsPage = lazy(() => import('./pages/explorer/traderEpochDetails/TraderEpochDetailsPage'));
const TraderEpochDataConsensusPage = lazy(
  () => import('./pages/explorer/traderEpochDetails/dataConsensus/TraderEpochDataConsensusPage')
);
const TraderEpochRiskConsensusPage = lazy(
  () => import('./pages/explorer/traderEpochDetails/riskConsensus/TraderEpochRiskConsensusPage')
);
const VaultPage = lazy(() => import('./pages/vaults/VaultPage'));
const VaultDetailsPage = lazy(() => import('./pages/vaults/VaultDetailsPage'));

function ThemeWrapper({ children = null }) {
  const { theme, isLoading } = useThemeContext();

  // Set CSS custom properties for main theme values
  React.useEffect(() => {
    if (isLoading || !theme || !theme.palette) return;

    const root = document.documentElement;

    // Safe access to theme properties with fallbacks
    const safeGet = (obj, path, fallback = '#000000') => {
      return path.split('.').reduce((current, key) => current?.[key], obj) || fallback;
    };

    // Background colors
    root.style.setProperty('--app-background-color', safeGet(theme, 'palette.background.app'));
    root.style.setProperty('--background-paper', safeGet(theme, 'palette.background.paper'));
    root.style.setProperty('--background-card', safeGet(theme, 'palette.background.card'));
    root.style.setProperty('--background-container', safeGet(theme, 'palette.background.container'));

    // Text colors
    root.style.setProperty('--text-primary', safeGet(theme, 'palette.text.primary'));
    root.style.setProperty('--text-secondary', safeGet(theme, 'palette.text.secondary'));
    root.style.setProperty('--text-disabled', safeGet(theme, 'palette.text.disabled'));
    root.style.setProperty('--text-subtitle', safeGet(theme, 'palette.text.subtitle'));

    // Brand colors
    root.style.setProperty('--primary-main', safeGet(theme, 'palette.primary.main'));
    root.style.setProperty('--primary-light', safeGet(theme, 'palette.primary.light'));
    root.style.setProperty('--primary-dark', safeGet(theme, 'palette.primary.dark'));

    // Semantic colors
    root.style.setProperty('--success-main', safeGet(theme, 'palette.success.main'));
    root.style.setProperty('--error-main', safeGet(theme, 'palette.error.main'));
    root.style.setProperty('--warning-main', safeGet(theme, 'palette.warning.main'));
    root.style.setProperty('--info-main', safeGet(theme, 'palette.info.main'));

    // UI colors
    root.style.setProperty('--ui-border', safeGet(theme, 'palette.ui.border'));
    root.style.setProperty('--ui-background-light', safeGet(theme, 'palette.ui.backgroundLight'));
    root.style.setProperty('--ui-background-medium', safeGet(theme, 'palette.ui.backgroundMedium'));
    root.style.setProperty('--ui-background-dark', safeGet(theme, 'palette.ui.backgroundDark'));
    root.style.setProperty('--ui-card-background', safeGet(theme, 'palette.ui.cardBackground'));
    root.style.setProperty('--ui-input-background', safeGet(theme, 'palette.ui.inputBackground'));
    root.style.setProperty('--ui-input-border', safeGet(theme, 'palette.ui.inputBorder'));

    // Chart colors
    root.style.setProperty('--chart-red', safeGet(theme, 'palette.charts.red'));
    root.style.setProperty('--chart-green', safeGet(theme, 'palette.charts.green'));
    root.style.setProperty('--chart-orange', safeGet(theme, 'palette.charts.orange'));
    root.style.setProperty('--chart-blue', safeGet(theme, 'palette.charts.blue'));
    root.style.setProperty('--chart-gray', safeGet(theme, 'palette.charts.gray'));

    // Common colors
    root.style.setProperty('--white', safeGet(theme, 'palette.common.pureWhite'));
    root.style.setProperty('--black', safeGet(theme, 'palette.common.pureBlack'));
    root.style.setProperty('--transparent', safeGet(theme, 'palette.common.transparent'));

    // Typography
    root.style.setProperty('--font-family', safeGet(theme, 'typography.fontFamily'));
    root.style.setProperty('--font-family-primary', safeGet(theme, 'typography.fontFamilyConfig.primary'));
    root.style.setProperty('--font-family-monospace', safeGet(theme, 'typography.fontFamilyConfig.monospace'));
    root.style.setProperty('--font-size-h1', safeGet(theme, 'typography.h1.fontSize'));
    root.style.setProperty('--font-size-h2', safeGet(theme, 'typography.h2.fontSize'));
    root.style.setProperty('--font-size-h3', safeGet(theme, 'typography.h3.fontSize'));
    root.style.setProperty('--font-size-body1', safeGet(theme, 'typography.body1.fontSize'));
    root.style.setProperty('--font-size-body2', safeGet(theme, 'typography.body2.fontSize'));
    root.style.setProperty('--font-size-small1', safeGet(theme, 'typography.small1.fontSize'));
    root.style.setProperty('--font-size-small2', safeGet(theme, 'typography.small2.fontSize'));

    // Spacing
    root.style.setProperty('--spacing-1', theme.spacing ? theme.spacing(1) : '8px');
    root.style.setProperty('--spacing-2', theme.spacing ? theme.spacing(2) : '16px');
    root.style.setProperty('--spacing-3', theme.spacing ? theme.spacing(3) : '24px');
    root.style.setProperty('--spacing-4', theme.spacing ? theme.spacing(4) : '32px');
    root.style.setProperty('--spacing-6', theme.spacing ? theme.spacing(6) : '48px');
    root.style.setProperty('--spacing-8', theme.spacing ? theme.spacing(8) : '64px');

    // Border radius
    root.style.setProperty('--border-radius-small', '4px');
    root.style.setProperty('--border-radius-medium', '8px');
    root.style.setProperty('--border-radius-large', '12px');

    // Shadows
    root.style.setProperty('--shadow-light', '0 2px 4px rgba(0,0,0,0.1)');
    root.style.setProperty('--shadow-medium', '0 4px 8px rgba(0,0,0,0.15)');
    root.style.setProperty('--shadow-heavy', '0 8px 16px rgba(0,0,0,0.2)');
  }, [theme, isLoading]);

  if (isLoading || !theme) {
    return <div>Loading...</div>;
  }

  return (
    <MuiThemeProvider theme={theme}>
      <StyledEngineProvider injectFirst>
        <ToastProvider>
          <ErrorProvider>{children}</ErrorProvider>
        </ToastProvider>
      </StyledEngineProvider>
    </MuiThemeProvider>
  );
}

function App() {
  const { user, version, isRetail, isDev, isMetadataLoading, captchaKey } = useUserMetadata();
  const isAuthenticated = user && user.is_authenticated;
  const storedVersionRef = useRef(localStorage.getItem('appVersion'));
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [versionContent, setVersionContent] = useState('');
  const { isMobile } = useViewport();
  const { openLoginModal, updateMessageDetails } = useAuthModal();
  const { isOpen, closeModal } = useKeyManagementModal();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const openModal = params.get('openModal');
    const messageType = params.get('messageType');
    const message = params.get('message');

    if (openModal === 'login') {
      updateMessageDetails({ messages: [message], messageType });
      openLoginModal();

      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, '/');
      }
    }
  }, [window.location, openLoginModal]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    async function checkVersion() {
      const storedVersion = localStorage.getItem('appVersion');
      const isVersionChecked = sessionStorage.getItem('isVersionChecked');

      let response;
      try {
        response = await getVersionData();
      } catch (error) {
        return;
      }

      if (isVersionChecked === 'true' && version === storedVersion) {
        return;
      }

      // If version from backend has changed
      if (version && version !== '0.0.0' && version !== storedVersion) {
        const newVersionContent = response.VERSION_FEATURES;
        setVersionContent(newVersionContent);
        setShowUpdateModal(true);
        storedVersionRef.current = version;
        localStorage.setItem('appVersion', version);
        sessionStorage.setItem('isVersionChecked', 'true');
      }
    }

    checkVersion();
  }, [version, user]);

  const minWidthProps = isMobile ? {} : { minWidth: '1440px' };
  const containerProps = isMobile
    ? { style: { width: '100%', height: 'calc(100% - 60px)' } }
    : {
        sx: {
          overflowY: 'auto',
          marginTop: '8px',
          paddingX: '8px',
          height: 'calc(100% - 78px)',
          width: 'calc(100% - 16px)',
        },
      };
  return (
    <Box height='100vh' width='100%' {...minWidthProps}>
      {!isMetadataLoading ? (
        <>
          <NavBar version={version} />
          <AuthModal captchaKey={captchaKey} />
          <Box {...containerProps}>
            <Suspense fallback={<Loader />}>
              <ErrorBoundary>
                <Routes>
                  {isAuthenticated ? (
                    <Route element={<AgreementGatedRoute />}>
                      <Route
                        element={
                          <OrderFormProvider FormAtoms={OrderFormAtoms}>
                            <OrderEntryPage />
                          </OrderFormProvider>
                        }
                        path='/'
                      />
                    </Route>
                  ) : (
                    <Route
                      element={
                        <OrderFormProvider FormAtoms={OrderFormAtoms}>
                          <OrderEntryPage />
                        </OrderFormProvider>
                      }
                      path='/'
                    />
                  )}

                  <Route
                    element={
                      <OrderFormProvider FormAtoms={OrderFormAtoms}>
                        <OrderDetailsPage />
                      </OrderFormProvider>
                    }
                    path='/order/:uuid'
                  />

                  <Route element={<MultiOrderDetailsPage />} path='/multi_order/:uuid' />
                  <Route element={<ChainedOrderDetailsPage />} path='/chained_orders/:uuid' />
                  <Route element={<SimpleOrderDetailsPage />} path='/simple_order/:uuid' />
                  <Route element={<OrderSuperDetailPage />} path='/order_detail/:uuid' />

                  <Route element={<PrivateRoute isAuthenticated={isAuthenticated} />}>
                    <Route element={<StaffRoute />}>
                      <Route element={<AdminLayout />} path='/admin_panel'>
                        <Route
                          index
                          element={
                            <AdminPanelDataProvider>
                              <Dashboard />
                            </AdminPanelDataProvider>
                          }
                        />
                        <Route
                          element={
                            <AdminPanelDataProvider>
                              <UserManagement />
                            </AdminPanelDataProvider>
                          }
                          path='users'
                        />
                        <Route
                          element={
                            <AdminPanelDataProvider>
                              <OpenOrdersPage />
                            </AdminPanelDataProvider>
                          }
                          path='open_orders'
                        />
                        <Route
                          element={
                            <AdminPanelDataProvider>
                              <GroupsManagement />
                            </AdminPanelDataProvider>
                          }
                          path='groups'
                        />
                      </Route>
                    </Route>
                  </Route>

                  <Route element={<TermsAndConditions />} path='/beta_agreement' />
                  {/* Public route for resetting password from email link */}
                  <Route element={<ResetPasswordPage />} path='/reset-password/:uidb64/:token' />
                  <Route element={<Navigate to='/' />} path='*' />
                  <Route element={<ReferralPage />} path='/referral/:code' />
                  <Route element={<PrivateRoute isAuthenticated={isAuthenticated} />}>
                    <Route element={<AgreementGatedRoute />}>
                      <Route
                        element={
                          <OrderFormProvider FormAtoms={OptionOrderFormAtoms}>
                            <OptionOrderPage />
                          </OrderFormProvider>
                        }
                        path='/enter_option_order'
                      />

                      <Route
                        element={
                          <OrderFormProvider FormAtoms={OrderFormAtoms}>
                            <InitialLoadDataProvider>
                              <AccountBalanceProvider>
                                <MultiOrderEntryPage />
                              </AccountBalanceProvider>
                            </InitialLoadDataProvider>
                          </OrderFormProvider>
                        }
                        path='/enter_multi_order'
                      />
                      <Route
                        element={
                          <OrderFormProvider FormAtoms={ChainedOrderFormAtoms}>
                            <AccountBalanceProvider>
                              <ChainedOrderEntryPage />
                            </AccountBalanceProvider>
                          </OrderFormProvider>
                        }
                        path='/enter_chained_order'
                      />
                      <Route
                        element={
                          <OrderFormProvider FormAtoms={OrderFormAtoms}>
                            <SwapEntryPage />
                          </OrderFormProvider>
                        }
                        path='/swap'
                      />
                      {isDev && (
                        <>
                          <Route element={<VaultPage />} path='/vault' />
                          <Route element={<VaultDetailsPage />} path='/vault/:vaultAddress' />
                        </>
                      )}
                      <Route
                        element={
                          <OrderFormProvider FormAtoms={OrderFormAtoms}>
                            <DexTokenRankingProvider>
                              <ExplorePage />
                            </DexTokenRankingProvider>
                          </OrderFormProvider>
                        }
                        path='/explore'
                      />
                      <Route element={<ExplorerProofsPage />} path='/explorer/proofs' />
                      <Route element={<ExplorerTradesPage />} path='/explorer/trades' />
                      <Route element={<TradeDetailsPage />} path='/explorer/trades/:id' />
                      <Route element={<ProofDetailsPage />} path='/explorer/proofs/:id' />
                      <Route element={<TraderEpochDetailsPage />} path='/explorer/trader-epoch/:traderId/:epoch' />
                      <Route
                        element={<TraderEpochDataConsensusPage />}
                        path='/explorer/trader-epoch/:traderId/:epoch/data-consensus'
                      />
                      <Route
                        element={<TraderEpochRiskConsensusPage />}
                        path='/explorer/trader-epoch/:traderId/:epoch/risk-consensus'
                      />
                      <Route element={<DicyPage />} path='/dicy' />
                      <Route
                        element={
                          <OrderFormProvider FormAtoms={OrderFormAtoms}>
                            <MarketMakerPage />
                          </OrderFormProvider>
                        }
                        path='/volume_bot'
                      />
                      <Route
                        element={
                          <OrderFormProvider FormAtoms={OrderFormAtoms}>
                            <DeltaNeutralPage />
                          </OrderFormProvider>
                        }
                        path='/delta_neutral_bot'
                      />
                    </Route>
                    <Route element={<AccountSettingsPage />} path='/settings' />
                    <Route
                      element={
                        <OrderFormProvider FormAtoms={OrderFormAtoms}>
                          <AccountBalanceProvider>
                            <OrderViewPage />
                          </AccountBalanceProvider>
                        </OrderFormProvider>
                      }
                      path='/view_orders'
                    />
                    <Route
                      element={
                        <AccountsProvider>
                          <TradeConsensusProvider>
                            <AccountBalancePage />
                          </TradeConsensusProvider>
                        </AccountsProvider>
                      }
                      path='/account_balances'
                    />
                    <Route element={<PointsPageSeason1 />} path='/points' />
                    <Route element={<PointsPageSeason1 />} path='/points/season1' />
                    <Route element={<ReferralPage />} path='/referral' />
                    <Route
                      element={
                        <OrderFormProvider FormAtoms={OrderFormAtoms}>
                          <AccountBalanceProvider>
                            <YieldPage />
                          </AccountBalanceProvider>
                        </OrderFormProvider>
                      }
                      path='/yield'
                    />
                    <Route element={<TransactionCostsPage />} path='/transaction_costs' />
                  </Route>
                </Routes>
              </ErrorBoundary>
            </Suspense>
          </Box>
          <KeyManagementModal open={isOpen} onClose={closeModal} />
        </>
      ) : (
        <Loader />
      )}
      <VersionUpdateModal
        open={showUpdateModal}
        version={version}
        versionContent={versionContent}
        onClose={() => setShowUpdateModal(false)}
        onReadMore={() => {
          window.open(releaseNotesUrl, '_blank');
          setShowUpdateModal(false);
        }}
      />
    </Box>
  );
}

const dashboardRoot = createRoot(document.getElementById('root'));
dashboardRoot.render(
  <ThemeProvider>
    <ThemeWrapper>
      <FeatureFlagProvider>
        <UserMetadataProvider>
          <DexTokenManagerProvider>
            <AuthModalProvider>
              <Router>
                <TitleProvider>
                  <SolanaWalletProvider>
                    <WalletProvider>
                      <KeyManagementModalProvider>
                        <AccountApprovalProvider>
                          <App />
                        </AccountApprovalProvider>
                      </KeyManagementModalProvider>
                    </WalletProvider>
                  </SolanaWalletProvider>
                </TitleProvider>
              </Router>
            </AuthModalProvider>
          </DexTokenManagerProvider>
        </UserMetadataProvider>
      </FeatureFlagProvider>
    </ThemeWrapper>
  </ThemeProvider>
);

if (module.hot) {
  module.hot.accept();
}
