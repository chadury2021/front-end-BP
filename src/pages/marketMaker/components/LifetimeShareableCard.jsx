import React from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, useTheme } from '@mui/material';
// Import the graphics directly so Webpack resolves the path during build
import logoImageUrl from '@images/logos/full-logo-dark.png';
import lifetimeGraphic from '@images/lifetime-graphics/lifetime.png';
import { formatCurrency } from './utils/mmBotShareUtils';

// Component responsible for rendering the visual structure to be captured
const LifetimeShareableCard = React.forwardRef(({ lifetimeData }, ref) => {
  const theme = useTheme();
  const { volume, netFees, referralCode } = lifetimeData || {};

  // Colors
  const whiteColor = '#FFFFFF';
  const greyColor = '#A38F8F';
  const greenColor = theme.palette.semantic?.success || '#4CAF50';
  const redColor = theme.palette.semantic?.error || '#F44336';

  // Format data for display
  const formattedVolume = formatCurrency(volume);
  const formattedNetFees = formatCurrency(netFees);
  const netFeesColor = netFees >= 0 ? whiteColor : greenColor;

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
        backgroundImage: `url(${lifetimeGraphic})`,
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
            alt='Bitfrost Prime Logo'
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
        {/* Left Column: Main Content */}
        <Stack spacing={4} sx={{ width: '70%', pr: 4 }}>
          {/* Title Section */}
          <Stack spacing={1.5}>
            <Typography
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 400,
                fontSize: '24px',
                color: whiteColor,
                textAlign: 'left',
              }}
            >
              Lifetime Summary
            </Typography>
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

          {/* Secondary Metric: Net Fees */}
          <Stack spacing={1} sx={{ mt: 10 }}>
            <Typography sx={{ ...baseDataTextStyle, color: greyColor, fontSize: '24px' }}>Net Fees</Typography>
            <Typography
              component='div'
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 500,
                fontSize: '36px',
                lineHeight: 1.5,
                textAlign: 'left',
                color: netFeesColor,
              }}
            >
              {formattedNetFees}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* Referral Code (Bottom Left) */}
      {referralCode && (
        <Box
          sx={{
            position: 'absolute',
            bottom: '40px',
            left: '60px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: '12px',
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              fontSize: '20px',
              color: greyColor,
              textAlign: 'left',
            }}
          >
            Referral Code:
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: '24px',
              color: whiteColor,
              textAlign: 'left',
            }}
          >
            {referralCode}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

LifetimeShareableCard.displayName = 'LifetimeShareableCard';

LifetimeShareableCard.propTypes = {
  lifetimeData: PropTypes.shape({
    volume: PropTypes.number,
    netFees: PropTypes.number,
    referralCode: PropTypes.string,
  }),
};

LifetimeShareableCard.defaultProps = {
  lifetimeData: {},
};

export default LifetimeShareableCard;
