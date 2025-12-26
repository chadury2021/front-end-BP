import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import bgImageUrl from '@images/bg/bg.png';
import logoImageUrl from '@images/logos/full-tread-dark.png';
import { formatNumber } from '@/shared/utils/formatNumber';
import QRCode from 'react-qr-code';
import ProofLogoImg from '@/pages/explorer/proofUtils/ProofLogoImg';
import ExchangeIcons from '@images/exchange_icons';
import { TokenIcon } from '@/shared/components/Icons';

const whiteColor = '#FFFFFF';
const greyColor = '#A38F8F';

function ShareableBalanceComponent({ balanceData, headerTitle }, ref) {
  const theme = useTheme();
  const { notional, tokenName, accountExchange } = balanceData;

  const formatNotional = (value) => {
    if (value === null || value === undefined) return 'N/A';
    const absValue = Math.abs(value);
    if (absValue >= 1e9) return `${(absValue / 1e9).toFixed(1)}B`;
    if (absValue >= 1e6) return `${(absValue / 1e6).toFixed(1)}M`;
    if (absValue >= 1e3) return `${(absValue / 1e3).toFixed(1)}K`;
    return absValue.toFixed(1);
  };

  const formattedNotional = notional ? `$${formatNotional(notional)}` : 'N/A';

  // Shared style for Data Labels/Values
  const baseDataTextStyle = {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '24px',
    lineHeight: 1.2,
    textAlign: 'left',
  };

  return (
    <Box
      ref={ref}
      sx={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        width: '1200px',
        height: '675px',
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
      {/* Logo */}
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
                Proof of Balance
              </Typography>
            </Stack>
          </Box>

          {/* Token Section (Icon + Name) */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TokenIcon
              useFallback
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                objectFit: 'cover',
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
              {tokenName}
            </Typography>
          </Box>

          {/* Notional Balance Section */}
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: '120px',
              lineHeight: 1.1,
              color: whiteColor,
              textAlign: 'left',
              mt: 2,
            }}
          >
            {formattedNotional}
          </Typography>
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
              backgroundColor: theme.palette.background.white,
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
}

ShareableBalanceComponent.propTypes = {
  balanceData: PropTypes.shape({
    notional: PropTypes.number.isRequired,
    tokenName: PropTypes.string.isRequired,
    referralLink: PropTypes.string,
    accountExchange: PropTypes.string.isRequired,
  }).isRequired,
  headerTitle: PropTypes.string.isRequired,
};

export default React.forwardRef(ShareableBalanceComponent);
