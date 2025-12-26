import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { TokenIcon, ExchangeIcon } from '@/shared/components/Icons';
// Import the graphics directly so Webpack resolves the path during build
import bgImageUrl from '@images/bg/bg.png';
import logoImageUrl from '@images/logos/full-tread-dark.png';
import graphic1 from '@images/mmbot-graphics/MMBot1.png';
import graphic2 from '@images/mmbot-graphics/MMBot2.png';
import graphic3 from '@images/mmbot-graphics/MMBot3.png';
import { formatCurrency, formatDuration, selectGraphic } from './utils/mmBotShareUtils';

// Component responsible for rendering the visual structure to be captured
const MarketMakerShareableCard = React.forwardRef(({ mmBotData }, ref) => {
  const theme = useTheme();
  const { volume, netFees, mmPnL, exchange, pair, duration, referralCode } = mmBotData || {};

  // Colors
  const whiteColor = '#FFFFFF';
  const greyColor = '#A38F8F';
  const greenColor = theme.palette.semantic?.success || '#4CAF50';
  const redColor = theme.palette.semantic?.error || '#F44336';

  // Format data for display
  const formattedVolume = formatCurrency(volume);
  const formattedNetFees = formatCurrency(netFees);
  const formattedMMPnL = formatCurrency(Math.abs(mmPnL || 0));
  const formattedDuration = formatDuration(duration);
  const mmPnLColor = mmPnL >= 0 ? greenColor : redColor;
  const mmPnLSign = mmPnL >= 0 ? '' : '-';

  // Select graphic based on PnL
  const graphics = {
    graphic1,
    graphic2,
    graphic3,
  };
  const selectedGraphic = selectGraphic(mmPnL, graphics);

  // Extract token name from pair for icon
  const tokenName = pair ? pair.split('-')[0].split(':')[0] : '';

  // Base text style for data labels
  const baseDataTextStyle = {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '18px',
    lineHeight: 1.2,
    textAlign: 'left',
  };

  // Style for the data values (larger font)
  const valueTextStyle = {
    ...baseDataTextStyle,
    fontSize: '32px',
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
        backgroundImage: `url(${graphic3})`,
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
      {/* Logo at the top */}
      <Box
        sx={{
          position: 'absolute',
          top: '40px',
          left: '60px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Box
          sx={{
            width: '150px',
            height: 'auto',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <img
            alt='Tread.fi Logo'
            src={logoImageUrl}
            style={{
              width: '100%',
              height: 'auto',
            }}
          />
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          marginTop: '40px',
        }}
      >
        {/* Left Column: Main Content (70%) */}
        <Stack spacing={4} sx={{ width: '70%', pr: 4 }}>
          {/* Title Section */}
          <Stack spacing={1.5}>
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 400,
                fontSize: '24px',
                color: greyColor,
                textAlign: 'left',
              }}
            >
              Market Maker Bot
            </Typography>
            <Stack alignItems='center' direction='row' spacing={2}>
              {pair && (
                <TokenIcon
                  useFallback
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                  tokenName={tokenName}
                />
              )}
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 800,
                  fontSize: '40px',
                  color: whiteColor,
                  textAlign: 'left',
                }}
              >
                {pair || 'N/A'}
              </Typography>
            </Stack>
            <Stack alignItems='center' direction='row' spacing={1}>
              {exchange && (
                <ExchangeIcon
                  exchangeName={exchange}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              )}
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 600,
                  fontSize: '24px',
                  color: greyColor,
                  textAlign: 'left',
                }}
              >
                {exchange || 'N/A'}
              </Typography>
            </Stack>
          </Stack>

          {/* Primary Metric: Volume */}
          <Stack spacing={1}>
            <Typography sx={{ ...baseDataTextStyle, color: greyColor, fontSize: '24px' }}>Volume</Typography>
            <Typography
              component='div'
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 600,
                fontSize: '96px',
                lineHeight: 1.1,
                textAlign: 'left',
                color: whiteColor,
              }}
            >
              {formattedVolume}
            </Typography>
          </Stack>

          {/* Secondary Metrics Section */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 4,
              mt: 2,
            }}
          >
            {/* Net Fees */}
            <Stack spacing={0.5}>
              <Typography sx={{ ...baseDataTextStyle, color: greyColor, fontSize: '20px' }}>Net Fees</Typography>
              <Typography sx={{ ...valueTextStyle, color: whiteColor }}>{formattedNetFees}</Typography>
            </Stack>

            {/* MM PnL */}
            <Stack spacing={0.5}>
              <Typography sx={{ ...baseDataTextStyle, color: greyColor, fontSize: '20px' }}>MM PnL</Typography>
              <Typography sx={{ ...valueTextStyle, color: mmPnLColor }}>
                {mmPnL !== null && mmPnL !== undefined ? (
                  <>
                    {mmPnLSign}
                    {formattedMMPnL}
                  </>
                ) : (
                  'N/A'
                )}
              </Typography>
            </Stack>

            {/* Duration */}
            <Stack spacing={0.5}>
              <Typography sx={{ ...baseDataTextStyle, color: greyColor, fontSize: '20px' }}>Duration</Typography>
              <Typography sx={{ ...valueTextStyle, color: whiteColor }}>{formattedDuration}</Typography>
            </Stack>
          </Box>

          {/* Referral Code (Bottom) */}
          {referralCode && (
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 500,
                fontSize: '16px',
                color: greyColor,
                textAlign: 'left',
                mt: 2,
              }}
            >
              Referral Code: {referralCode}
            </Typography>
          )}
        </Stack>
      </Box>
    </Box>
  );
});

MarketMakerShareableCard.displayName = 'MarketMakerShareableCard';

MarketMakerShareableCard.propTypes = {
  mmBotData: PropTypes.shape({
    volume: PropTypes.number,
    netFees: PropTypes.number,
    mmPnL: PropTypes.number,
    exchange: PropTypes.string,
    pair: PropTypes.string,
    duration: PropTypes.number,
    referralCode: PropTypes.string,
  }),
};

MarketMakerShareableCard.defaultProps = {
  mmBotData: {},
};

export default MarketMakerShareableCard;
