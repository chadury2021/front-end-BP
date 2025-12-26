import { claimFeatureCode } from '@/apiServices';
import { MaxLeverageProvider } from '@/context/MaxLeverageContext';
import { AccountBalanceProvider } from '@/pages/dashboard/orderEntry/AccountBalanceContext';
import { ExchangeTickerProvider } from '@/shared/context/ExchangeTickerProvider';
import { useFeatureFlag } from '@/shared/context/FeatureFlagProvider';
import { InitialLoadDataProvider } from '@/shared/context/InitialLoadDataProvider';
import { useToast } from '@/shared/context/ToastProvider';
import pixelLogo from '@images/graphics/pixel_logo.png';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Portal,
  Stack,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import BackgroundAnimationWrapper, {
  useBackgroundAnimation,
  BackgroundToggle,
} from '@/shared/components/BackgroundAnimationWrapper';
import MarketMakerEntryForm from './components/MarketMakerEntryForm';
import MarketMakerHistory from './components/MarketMakerHistory';
import { useMarketMakerHistory } from './hooks/useMarketMakerHistory';

export default function MarketMakerPage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { isFeatureEnabled } = useFeatureFlag();
  const isEnabled = isFeatureEnabled('market_maker');
  const { showToastMessage } = useToast();
  const [code, setCode] = useState('');
  const [isClaimingFeature, setIsClaimingFeature] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showAnimation, setShowAnimation] = useBackgroundAnimation();

  const statusFilter = useMemo(() => (showActiveOnly ? ['ACTIVE', 'PAUSED', 'FINISHER'] : []), [showActiveOnly]);
  const history = useMarketMakerHistory(statusFilter);

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
              alt='MM Bot Logo'
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
                  maxWidth: '1220px', // 10% less wide than previous 1355px
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
                    <MarketMakerEntryForm
                      activeOrders={history?.marketMakerOrders || []}
                      lifetime={history?.lifetimeStats}
                      onSubmitted={history?.refresh}
                    />
                    <Divider />
                    <MarketMakerHistory
                      history={history}
                      setShowActiveOnly={setShowActiveOnly}
                      showActiveOnly={showActiveOnly}
                    />
                    <Box
                      sx={{
                        display: { xs: 'block', md: 'none' },
                        height: 'var(--market-maker-footer-gap, calc(120px + env(safe-area-inset-bottom, 0px)))',
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
