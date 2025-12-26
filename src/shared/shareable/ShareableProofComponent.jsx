import { getEpochStartAndEnd } from '@/pages/explorer/utils/epoch'; // Adjust path if needed
import bgImageUrl from '@images/bg/bg.png';
import ExchangeIcons from '@images/exchange_icons';
import logoImageUrl from '@images/logos/full-tread-dark.png';
import monadPrimary from '@images/logos/monad-primary.png';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import dayjs from 'dayjs'; // For timestamp formatting
import numbro from 'numbro'; // For currency formatting
import PropTypes from 'prop-types'; // Import PropTypes
import React from 'react'; // Import React for forwardRef
import QRCode from 'react-qr-code';
import { APP_BASE_URL } from '@/apiServices';

// Function to format exchange name display
const formatExchangeNameDisplay = (name) => {
  if (name?.toLowerCase() === 'okx') {
    return 'OKX';
  }
  if (name?.toLowerCase() === 'okxdex') {
    return 'OKXDEX';
  }
  return name;
};

// Component responsible for rendering the visual structure to be captured
const ShareableProofComponent = React.forwardRef(({ proofData, accountName, accountExchange }, ref) => {
  const theme = useTheme();
  const { traderId, epoch, blockNumber, dataEvents, riskEvents, referralLink } = proofData;

  // -- START: Styling Constants (Mirrored from ShareableImageComponent) --
  const whiteColor = '#FFFFFF';
  const greyColor = '#A38F8F'; // Original: #999, adjusted to match image component more closely
  const baseDataTextStyle = {
    fontFamily: '"Inter", sans-serif',
    fontWeight: 600,
    fontSize: '24px', // style_A5HYSF
    lineHeight: 1.2,
    textAlign: 'left',
  };
  // -- END: Styling Constants --

  // -- START: Data Processing & Formatting --
  const [epochStartTimestampSeconds] = getEpochStartAndEnd(Number(epoch));
  const epochStartDate = dayjs.unix(epochStartTimestampSeconds); // Use dayjs
  const formattedTimestamp = epochStartDate.isValid() ? epochStartDate.format('YYYY-MM-DD HH:mm:ss') : 'Invalid Date';

  // Determine Primary Value and Label (Simplified logic, adjust as needed)
  let primaryValue = 'N/A';
  let primaryLabel = 'Metric';
  let primaryColor = whiteColor; // Default color

  // First check riskEvents for volume data (matches how ProofRow displays it)
  if (riskEvents && riskEvents.length > 0 && riskEvents[0].data) {
    // Format the volume from riskEvents[0].data
    primaryValue = numbro(riskEvents[0].data).formatCurrency({ thousandSeparated: true });
    primaryLabel = 'Proof of Volume';
    primaryColor = theme.palette.semantic.success; // Green for volume
  }
  // Then try dataEvents if available
  else if (dataEvents && dataEvents.length > 0) {
    // Check if dataEvents has a totalVolumeUsd property
    const volumeEvent = dataEvents.find((e) => e.key === 'totalVolumeUsd' || e.key === 'volume');
    if (volumeEvent && (volumeEvent.value || volumeEvent.data)) {
      const volumeValue = volumeEvent.value || volumeEvent.data;
      primaryValue = numbro(volumeValue).formatCurrency({ thousandSeparated: true });
      primaryLabel = 'Proof of Volume';
      primaryColor = theme.palette.semantic.success; // Green for volume
    } else {
      // If no specific volume event, use the first data event
      const firstEvent = dataEvents[0];
      if (firstEvent && (firstEvent.value || firstEvent.data)) {
        const eventValue = firstEvent.value || firstEvent.data;
        primaryValue =
          typeof eventValue === 'number'
            ? numbro(eventValue).formatCurrency({ thousandSeparated: true })
            : String(eventValue);
        primaryLabel = firstEvent.key || 'Data';
        primaryColor = theme.palette.semantic.success; // Green for data
      } else {
        // Fallback to placeholder
        primaryValue = '$0';
        primaryLabel = 'Proof of Volume';
        primaryColor = greyColor; // Grey if no data
      }
    }
  } else {
    // No data available, use placeholder
    primaryValue = '$0';
    primaryLabel = 'Proof of Volume';
    primaryColor = greyColor; // Grey if no data
  }

  const formattedTraderId = traderId
    ? `${traderId.substring(0, 6)}...${traderId.substring(traderId.length - 4)}`
    : 'N/A';
  const exchangeName = accountExchange;
  const exchangeLogoUrl = exchangeName
    ? ExchangeIcons[exchangeName.toLowerCase()]
    : 'https://via.placeholder.com/80x80/CCCCCC/FFFFFF?text=N/A';
  // -- END: Data Processing & Formatting --

  return (
    <Box
      ref={ref}
      sx={{
        // Base container styles from ShareableImageComponent
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        width: '1200px',
        height: '675px',
        backgroundImage: `url(${bgImageUrl})`,
        backgroundColor: theme.palette.ui.cardBackground,
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
      {/* Logo (Absolute - from ShareableImageComponent) */}
      <Box
        alt='Tread Logo'
        component='img'
        src={logoImageUrl}
        sx={{
          position: 'absolute',
          top: '40px',
          left: '60px',
          width: '150px', // Match ShareableImageComponent
          height: 'auto',
        }}
      />

      {/* Main Content Area (Flex Row - from ShareableImageComponent) */}
      <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', alignItems: 'center' }}>
        {/* Left Column: Main Content (Stack - from ShareableImageComponent) */}
        <Stack spacing={2} sx={{ width: '70%', pr: 4 /* Add padding to prevent overlap */ }}>
          {/* Top Section: Exchange Name - Analogous to Pair Name */}

          <Stack alignItems='top' direction='row' spacing={1}>
            <div
              aria-label={accountExchange}
              style={{
                height: '100px',
                width: '100px',
                marginRight: '8px',
                backgroundImage: `url(${exchangeLogoUrl})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            <Stack direction='column' gap={5} justifyContent='left'>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 800,
                  fontSize: '40px', // Match Pair Name style
                  color: whiteColor,
                  textAlign: 'left',
                  textTransform: 'capitalize', // Nicer display for exchange name
                }}
              >
                {formatExchangeNameDisplay(exchangeName)}
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 800,
                  fontSize: '24px', // Match Pair Name style
                  color: whiteColor,
                  textAlign: 'left',
                  textTransform: 'capitalize', // Nicer display for exchange name
                }}
              >
                {primaryLabel}
              </Typography>
            </Stack>
          </Stack>

          {/* Primary Value Section - Analogous to PnL */}
          <Typography
            sx={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: '120px', // Slightly smaller than PnL due to potentially longer text
              lineHeight: 1.1,
              color: primaryColor, // Use determined color
              textAlign: 'left',
              mt: 1,
            }}
          >
            {primaryValue}
          </Typography>

          {/* Metadata Section (Flex Row - like Notional/Unrealized PnL) */}
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, mt: 3 }}>
            {/* Account Column */}
            <Stack spacing={0.5}>
              <Typography sx={{ ...baseDataTextStyle, color: greyColor }}>Account</Typography>
              <Typography sx={{ ...baseDataTextStyle, color: whiteColor }}>{accountName || 'N/A'}</Typography>
            </Stack>

            {/* Trader ID Column */}
            <Stack spacing={0.5}>
              <Typography sx={{ ...baseDataTextStyle, color: greyColor }}>Trader ID</Typography>
              <Typography sx={{ ...baseDataTextStyle, color: whiteColor }}>{formattedTraderId}</Typography>
            </Stack>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, mt: 3 }}>
            {/* Epoch Column */}
            <Stack spacing={0.5}>
              <Typography sx={{ ...baseDataTextStyle, color: greyColor }}>Epoch</Typography>
              <Typography sx={{ ...baseDataTextStyle, color: whiteColor }}>{epoch || 'N/A'}</Typography>
            </Stack>

            {/* Block Column */}
            <Stack spacing={0.5}>
              <Typography sx={{ ...baseDataTextStyle, color: greyColor }}>Block</Typography>
              <Typography sx={{ ...baseDataTextStyle, color: whiteColor }}>{blockNumber || 'N/A'}</Typography>
            </Stack>

            {/* Timestamp Column */}
            <Stack spacing={0.5}>
              <Typography sx={{ ...baseDataTextStyle, color: greyColor }}>Timestamp</Typography>
              <Typography sx={{ ...baseDataTextStyle, color: whiteColor }}>{formattedTimestamp}</Typography>
            </Stack>
          </Box>
        </Stack>

        {/* Right Column: QR Code linking to epoch details */}
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
              value={`${APP_BASE_URL}/explorer/trader-epoch/${traderId}/${epoch}`}
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
              <Box
                component='img'
                src={monadPrimary}
                sx={{
                  width: '16px',
                  height: '16px',
                }}
              />
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Footer Section (Absolute Positioning like ShareableImageComponent) */}
      {/* Referral Link Text (Bottom Left) */}
      {referralLink && referralLink !== 'N/A' && (
        <Box
          sx={{
            position: 'absolute',
            bottom: '40px',
            left: '60px',
          }}
        >
          <Typography sx={{ ...baseDataTextStyle, fontSize: '20px', color: greyColor }}>Referral code:</Typography>
          <Typography sx={{ ...baseDataTextStyle, fontSize: '20px', color: whiteColor }}>{referralLink}</Typography>
        </Box>
      )}

      {/* QR Code (Bottom Right) */}
      {referralLink && referralLink !== 'N/A' && (
        <Box
          sx={{
            position: 'absolute',
            bottom: '40px',
            right: '60px',
            backgroundColor: 'white',
            padding: '8px',
            borderRadius: '4px',
          }}
        >
          <QRCode bgColor={whiteColor} fgColor='#000000' level='M' size={80} value={referralLink} />
        </Box>
      )}
    </Box>
  );
});

// Set display name for React DevTools
ShareableProofComponent.displayName = 'ShareableProofComponent';

// Add PropTypes for proofData
ShareableProofComponent.propTypes = {
  proofData: PropTypes.shape({
    traderId: PropTypes.string,
    epoch: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    blockNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    dataEvents: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string,
        value: PropTypes.string,
      })
    ),
    riskEvents: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string,
        value: PropTypes.string,
      })
    ),
    referralLink: PropTypes.string,
  }).isRequired,
  accountName: PropTypes.string.isRequired,
  accountExchange: PropTypes.string.isRequired,
};

export default ShareableProofComponent;
