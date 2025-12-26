import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Portal,
  Stack,
  Tabs,
  Tab,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { claimFeatureCode } from '@/apiServices';
import { MaxLeverageProvider } from '@/context/MaxLeverageContext';
import { AccountBalanceProvider } from '@/pages/dashboard/orderEntry/AccountBalanceContext';
import { ExchangeTickerProvider } from '@/shared/context/ExchangeTickerProvider';
import { InitialLoadDataProvider } from '@/shared/context/InitialLoadDataProvider';
import { useFeatureFlag } from '@/shared/context/FeatureFlagProvider';
import { useToast } from '@/shared/context/ToastProvider';
import pixelLogo from '@images/graphics/pixel_logo.png';
import BackgroundAnimationWrapper, {
  useBackgroundAnimation,
  BackgroundToggle,
} from '@/shared/components/BackgroundAnimationWrapper';
import DeltaNeutralEntryForm from './components/DeltaNeutralEntryForm';
import DeltaNeutralHistory from './components/DeltaNeutralHistory';
import { useDeltaNeutralHistory } from './hooks/useDeltaNeutralHistory';
import { useDeltaNeutralPositions } from './hooks/useDeltaNeutralPositions';
import DeltaNeutralPositions from './components/DeltaNeutralPositions';

export default function DeltaNeutralPage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { isFeatureEnabled } = useFeatureFlag();
  const isEnabled = isFeatureEnabled('market_maker');
  const { showToastMessage } = useToast();
  const [code, setCode] = useState('');
  const [isClaimingFeature, setIsClaimingFeature] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = Positions, 1 = Orders
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showAnimation, setShowAnimation] = useBackgroundAnimation();
  const enabledHistory = useMemo(() => activeTab === 1, [activeTab]);
  const statusFilter = useMemo(() => [], []);
  const history = useDeltaNeutralHistory(statusFilter, { enabled: enabledHistory }); // Orders use orders API only when on Orders tab
  const { positions: dnPositions, loading: positionsLoading } = useDeltaNeutralPositions({
    enabled: activeTab === 0,
    activeOnly: showActiveOnly,
  });

  const claimFeature = async (claimCode) => {
    setIsClaimingFeature(true);
    try {
      const response = await claimFeatureCode(claimCode);
      showToastMessage({
        type: 'success',
        message: response.message,
      });

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      showToastMessage({
        type: 'error',
        message: error.message,
      });
      setIsClaimingFeature(false);
    }
  };

  if (!isEnabled) {
    return (
      <>
        <BackgroundAnimationWrapper isFeatureEnabled={false} showAnimation={showAnimation} />
        <Container
          height='100%'
          maxWidth='xl'
          sx={{
            height: '100%',
            py: 4,
            backgroundColor: 'transparent',
            backdropFilter: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Background toggle: desktop only, hidden on mobile */}
          {isDesktop && (
            <Box
              sx={{
                position: 'fixed',
                bottom: 100,
                right: 16,
                zIndex: 10,
              }}
            >
              <BackgroundToggle showAnimation={showAnimation} onToggle={setShowAnimation} />
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <img
              alt='Delta Neutral Logo'
              src={pixelLogo}
              style={{
                width: '500px',
                height: '500px',
                objectFit: 'contain',
              }}
            />
          </Box>
          <Box sx={{ width: '500px', mx: 'auto' }}>
            <Stack direction='row' spacing={2}>
              <TextField
                fullWidth
                label='Enter Alpha Code'
                value={code}
                variant='outlined'
                onChange={(e) => setCode(e.target.value)}
              />
              <Button
                disabled={isClaimingFeature || !code.trim()}
                sx={{ minWidth: '100px' }}
                variant='contained'
                onClick={() => claimFeature(code)}
              >
                {isClaimingFeature ? <CircularProgress size={20} /> : 'Access'}
              </Button>
            </Stack>
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <BackgroundAnimationWrapper isFeatureEnabled showAnimation={showAnimation} />
      <InitialLoadDataProvider>
        <ExchangeTickerProvider exchangeName='Hyperliquid'>
          <MaxLeverageProvider>
            <AccountBalanceProvider>
              <Container
                maxWidth={false}
                sx={{
                  maxWidth: '1230px',
                  p: 0,
                  my: 4,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    backgroundColor: 'background.container',
                    borderRadius: 4,
                    position: 'relative',
                    pb: { xs: 8, md: 4 },
                  }}
                >
                  <Stack direction='column' spacing={3}>
                    <DeltaNeutralEntryForm activeOrders={history?.deltaNeutralOrders || []} />
                    <Divider />
                    <Box>
                      <Tabs
                        aria-label='Delta Neutral tabs'
                        sx={{ mb: 2, width: '100%' }}
                        value={activeTab}
                        variant='fullWidth'
                        onChange={(_, v) => setActiveTab(v)}
                      >
                        <Tab label='Positions' />
                        <Tab label='History' />
                      </Tabs>
                      {activeTab === 0 && (
                        <DeltaNeutralPositions
                          loading={positionsLoading}
                          positions={dnPositions}
                          showActiveOnly={showActiveOnly}
                          onToggleActiveOnly={setShowActiveOnly}
                        />
                      )}
                      {activeTab === 1 && <DeltaNeutralHistory history={history} />}
                    </Box>
                    {/* Mobile footer spacer to avoid overlap with fixed Summary footer */}
                    <Box
                      sx={{
                        display: { xs: 'block', md: 'none' },
                        height: 'var(--delta-neutral-footer-gap, calc(120px + env(safe-area-inset-bottom, 0px)))',
                      }}
                    />
                  </Stack>
                </Paper>
              </Container>
              {/* Desktop: fixed positioning using Portal to ensure it's above everything */}
              {isDesktop && (
                <Portal>
                  <Box
                    sx={{
                      position: 'fixed',
                      bottom: 16,
                      right: 16,
                      zIndex: 2000,
                      pointerEvents: 'auto',
                    }}
                  >
                    <BackgroundToggle showAnimation={showAnimation} onToggle={setShowAnimation} />
                  </Box>
                </Portal>
              )}
            </AccountBalanceProvider>
          </MaxLeverageProvider>
        </ExchangeTickerProvider>
      </InitialLoadDataProvider>
    </>
  );
}
