import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Stack, useTheme } from '@mui/material';
import { formatNumber } from '@/shared/utils/formatNumber';
import QRCode from 'react-qr-code';
import ProofLogoImg from '@/pages/explorer/proofUtils/ProofLogoImg';
import ExchangeIcons from '@images/exchange_icons';
import { TokenIcon } from '@/shared/components/Icons';

// Import the images directly so Webpack resolves the path during build
import bgImageUrl from '@images/bg/bg.png';
import logoImageUrl from '@images/logos/full-tread-dark.png';

// Component responsible for rendering the visual structure to be captured
const ShareableImageComponent = React.forwardRef(({ positionData, headerTitle }, ref) => {
  const theme = useTheme();
  const { pnlPercentage, pairName, notional, unrealizedProfit, accountExchange } = positionData;

  // -- START: Styling Constants --
  const whiteColor = '#FFFFFF';
  const greyColor = '#A38F8F';
  const baseDataTextStyle = {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '24px',
    lineHeight: 1.2,
    textAlign: 'left',
  };
  // -- END: Styling Constants --

  // -- START: Data Processing & Formatting --
  const pnlColor = pnlPercentage >= 0 ? theme.palette.success.main : theme.palette.error.main;
  const pnlString = `${pnlPercentage >= 0 ? '+' : ''}${formatNumber(pnlPercentage)}%`;
  const formattedNotional = notional ? `$${formatNumber(notional)}` : 'N/A';
  const formattedUnrealizedProfit = unrealizedProfit ? `$${formatNumber(unrealizedProfit)}` : 'N/A';

  // Extract token name from pair
  const tokenName = pairName ? pairName.split('-')[0].split(':')[0] : '';
  // -- END: Data Processing & Formatting --

  return (
    <Box
      ref={ref}
      sx={{
        position: 'absolute',
        left: '-9999px', // Position off-screen
        top: '-9999px',
        width: '1200px', // Target width for high-res image
        height: '675px', // Target height (16:9 ratio)
        backgroundImage: `url(${bgImageUrl})`,
        backgroundColor: '#212121',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: '"Inter", sans-serif',
        color: whiteColor,
        padding: '40px 60px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {/* Logo (Absolute) */}
      <Box
        alt='Tread Logo'
        component='img'
        src={logoImageUrl}
        sx={{
          position: 'absolute',
          top: '40px',
          left: '60px',
          width: '150px',
          height: 'auto',
        }}
      />

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%' }}>
        {/* Left Column: Main Content */}
        <Stack spacing={3} sx={{ width: '70%', my: 'auto' }}>
          {/* Exchange Section */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Box
              sx={{
                height: '110px',
                width: '110px',
                backgroundImage: `url(${ExchangeIcons[accountExchange?.toLowerCase()]})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                flexShrink: 0,
              }}
            />
            <Stack spacing={1}>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 800,
                  fontSize: '40px',
                  color: whiteColor,
                  lineHeight: 1.2,
                }}
              >
                {accountExchange}
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 800,
                  fontSize: '24px',
                  color: whiteColor,
                  lineHeight: 1.2,
                }}
              >
                {headerTitle}
              </Typography>
            </Stack>
          </Box>

          {/* Token Section (Icon + Name) */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Use TokenIcon component for consistency and fallback handling */}
            <TokenIcon
              useFallback
              style={{
                height: '60px',
                width: '60px',
              }}
              tokenName={tokenName}
            />
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 800,
                fontSize: '40px',
                color: whiteColor,
                textAlign: 'left',
                ml: 4,
              }}
            >
              {pairName}
            </Typography>
          </Box>

          {/* PnL (ROI) Section */}
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: '120px',
              lineHeight: 1.1,
              color: pnlColor,
              textAlign: 'left',
              mt: 2,
            }}
          >
            {pnlString}
          </Typography>

          {/* Data Section (Notional + Unrealized PnL) */}
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 6, mt: 2 }}>
            {/* Notional Column */}
            <Stack spacing={0.5}>
              <Typography
                sx={{
                  ...baseDataTextStyle,
                  color: greyColor,
                }}
              >
                Value
              </Typography>
              <Typography
                sx={{
                  ...baseDataTextStyle,
                  color: whiteColor,
                }}
              >
                {formattedNotional}
              </Typography>
            </Stack>

            {/* Unrealized PnL Column */}
            <Stack spacing={0.5}>
              <Typography
                sx={{
                  ...baseDataTextStyle,
                  color: greyColor,
                }}
              >
                Unrealized PnL
              </Typography>
              <Typography
                sx={{
                  ...baseDataTextStyle,
                  color: formattedUnrealizedProfit.includes('-')
                    ? theme.palette.error.main
                    : theme.palette.success.main,
                }}
              >
                {formattedUnrealizedProfit}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        {/* Right Column: QR Code */}
        <Box
          sx={{
            width: '30%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 2,
          }}
        >
          {/* QR Code */}
          <Box
            sx={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <QRCode
              bgColor={whiteColor}
              fgColor='#000000'
              level='M'
              size={200}
              // TODO: Replace with actual Monad proof URL when available
              value='https://app.tread.fi'
            />
            <Typography
              sx={{
                ...baseDataTextStyle,
                color: '#000000',
                fontSize: '16px',
                maxWidth: '200px',
                mt: 1,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              View proof on Monad
              <ProofLogoImg height='16px' variant='primary' />
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

ShareableImageComponent.displayName = 'ShareableImageComponent';

ShareableImageComponent.propTypes = {
  positionData: PropTypes.shape({
    pnlPercentage: PropTypes.number.isRequired,
    pairName: PropTypes.string.isRequired,
    notional: PropTypes.number.isRequired,
    unrealizedProfit: PropTypes.number.isRequired,
    referralLink: PropTypes.string,
    accountExchange: PropTypes.string.isRequired,
  }).isRequired,
  headerTitle: PropTypes.string.isRequired,
};

export default ShareableImageComponent;
