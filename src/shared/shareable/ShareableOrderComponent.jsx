import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Chip, Stack, Typography, useTheme } from '@mui/material';
import numbro from 'numbro';
import getBaseTokenIcon from '@images/tokens';
import { getUnderlying, smartRound } from '@/util';
import { svgUrlToPngDataUrl } from '@/shared/utils/svgToPng';
import ExchangeIcons from '@images/exchange_icons';
import Svg2PngVenueIcon from '@/shared/components/Svg2PngVenueIcon';
import { TokenIcon } from '@/shared/components/Icons';
import QRCode from 'react-qr-code';
import { APP_BASE_URL } from '@/apiServices';

// Import the images directly so Webpack resolves the path during build
import bgImageUrl from '@images/bg/bg.png'; // Default fallback
import buyDownImageUrl from '@images/bg/buy-down.png';
import buyUpImageUrl from '@images/bg/buy-up.png';
import sellDownImageUrl from '@images/bg/sell-down.png';
import sellUpImageUrl from '@images/bg/sell-up.png';
import logoImageUrl from '@images/logos/full-tread-dark.png';

// Mock data structure for initial development / fallback
const defaultMockData = {
  executed_notional: 41314.63, // Primary Metric: Executed Notional ($)
  executed_qty: 15.23, // Secondary Metric: Executed Quantity (Token)
  pair: 'ETH/USDT', // Token Pair
  side: 'buy', // Side (Buy/Sell)
  super_strategy: 'TWAP', // Strategy
  slippage: 0.25, // Total Slippage ($)
  vwap_slippage: 5.2, // VWAP Slippage (bps & %)
  maker_percentage: 70, // Maker percentage
  taker_percentage: 30, // Taker percentage
  account_name: 'Main Trading Account', // Account Name
  trader_id: 'abc123xyz456', // Trader ID (Obfuscated)
  time_start: '2025-04-25T12:30:45Z', // Trade Start Time
  time_end: '2025-04-25T13:45:30Z', // Trade End Time
  order_id: '12345', // Order ID for QR code
  referralLink: 'https://app.tread.fi/referral/H7GNIL3U', // Referral Link
  accountId: '7e2d62a5-a826-40a1-a20f-2e6684413465', // Add accountId
  arrival_cost: 0.5, // In BPS
  vwap_cost: 0.75, // In BPS
  arrival_bps_notional: 100, // In $ value
  arrival_price: null, // Add arrival_price
  last_fill_price: null, // Add last_fill_price
  unique_venues: [], // Add unique_venues
  arweave_tx_url: null, // Add arweave_tx_url
};

const mapSideToPosition = (side) => {
  const lowerSide = side.toLowerCase();
  if (lowerSide === 'buy') return 'Long';
  if (lowerSide === 'sell') return 'Short';
  return 'N/A';
};

// Helper to format cost in BPS
const formatBps = (value) => {
  if (value === undefined || value === null) return 'N/A';
  const rounded = smartRound(value, 2);
  return `${rounded}`;
};

// Component responsible for rendering the visual structure to be captured
const ShareableOrderComponent = React.forwardRef(({ orderData = defaultMockData }, ref) => {
  const theme = useTheme();
  const {
    executed_notional,
    executed_buy_qty,
    executed_qty,
    pair,
    side,
    super_strategy,
    slippage,
    vwap_slippage,
    maker_percentage,
    taker_percentage,
    account_name,
    trader_id,
    time_start,
    time_end,
    order_id,
    referralLink,
    accountId,
    unique_venues,
    arrival_cost,
    vwap_cost,
    arrival_bps_notional,
    arrival_price,
    last_fill_price,
    arweave_tx_url,
    accountExchange,
  } = orderData;

  // Colors
  const sideColor = side?.toLowerCase() === 'buy' ? theme.palette.semantic.success : theme.palette.semantic.error; // Green for buy, Red for sell
  const whiteColor = theme.palette.background.white;
  const greyColor = theme.palette.text.subtitle;
  const redColor = theme.palette.semantic.error;
  const greenColor = theme.palette.semantic.success;

  // Format data for display
  const formattedNotional = executed_notional
    ? `$${numbro(executed_notional).format({ thousandSeparated: true, mantissa: 2 })}`
    : 'N/A';
  const formattedQty = (() => {
    // if side='buy', and executed_buy_qty exists, return executed_buy_qty
    if (side?.toLowerCase() === 'buy' && executed_buy_qty) {
      return numbro(executed_buy_qty).format({ thousandSeparated: true, average: true, mantissa: 2 });
    }
    // if side='sell', and executed_qty exists, return executed_qty
    if (side?.toLowerCase() === 'sell' && executed_qty) {
      return numbro(executed_qty).format({ thousandSeparated: true, average: true, mantissa: 2 });
    }
    // if side is neither buy nor sell, or if executed_buy_qty or executed_qty does not exist, return 'N/A'
    return 'N/A';
  })();
  const formattedSlippage = slippage ? `$${numbro(slippage).format({ thousandSeparated: true, mantissa: 2 })}` : 'N/A';
  const formattedVwapSlippage = vwap_slippage ? `${vwap_slippage} bps (${(vwap_slippage / 100).toFixed(2)}%)` : 'N/A';

  // Determine if price went up (handle missing data)
  const isPriceUp = arrival_price != null && last_fill_price != null ? last_fill_price >= arrival_price : null;

  // Select background image dynamically
  const getDynamicBgUrl = () => {
    const lowerSide = side?.toLowerCase();
    if (lowerSide === 'buy') {
      if (isPriceUp === true) return buyUpImageUrl;
      if (isPriceUp === false) return buyDownImageUrl;
    } else if (lowerSide === 'sell') {
      if (isPriceUp === true) return sellUpImageUrl;
      if (isPriceUp === false) return sellDownImageUrl;
    }
    return bgImageUrl; // Fallback to default
  };
  const dynamicBgImageUrl = getDynamicBgUrl();

  // Format new benchmark data
  const formattedArrivalCostPercentage = arrival_cost ? `${(arrival_cost / 100).toFixed(2)}%` : 'N/A';
  const formattedArrivalCostNotional = arrival_bps_notional ? `($${smartRound(arrival_bps_notional, 2)})` : '';
  const formattedVwapCost = formatBps(vwap_cost);

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const startTime = formatDate(time_start);
  const endTime = formatDate(time_end);

  // Calculate duration if both times exist
  const calculateDuration = () => {
    if (!time_start || !time_end) return 'N/A';

    const start = new Date(time_start);
    const end = new Date(time_end);
    const durationMs = end - start;

    if (durationMs < 0) return 'Invalid duration';

    const seconds = Math.floor(durationMs / 1000) % 60;
    const minutes = Math.floor(durationMs / (1000 * 60)) % 60;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));

    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`;
  };

  const duration = calculateDuration();

  // Format trader ID (obfuscated)
  const formattedTraderId = trader_id
    ? `${trader_id.substring(0, 6)}...${trader_id.substring(trader_id.length - 4)}`
    : 'N/A';

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
    fontSize: '32px', // Increased font size for values
  };

  // QR code URL - use Arweave URL if available, otherwise use order URL
  const qrCodeUrl = arweave_tx_url || (order_id ? `${APP_BASE_URL}/orders/${order_id}` : '');

  return (
    <Box
      ref={ref}
      sx={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        width: '1200px',
        height: '675px',
        backgroundImage: `url(${dynamicBgImageUrl})`,
        backgroundColor: 'var(--background-paper)',
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
        <Box
          sx={{
            position: 'relative',
            width: '16px',
            height: '16px',
            margin: '0 8px',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '1px',
              backgroundColor: greyColor,
              transform: 'rotate(45deg)',
              top: '50%',
              left: '0',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '1px',
              backgroundColor: greyColor,
              transform: 'rotate(-45deg)',
              top: '50%',
              left: '0',
            }}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: '100%',
          }}
        >
          {unique_venues?.slice(0, 5).map((venue) => (
            <Box
              key={venue}
              sx={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <Svg2PngVenueIcon size={40} venueName={venue} />
            </Box>
          ))}
          {unique_venues?.length > 5 && (
            <Typography component='span' sx={{ color: greyColor, fontSize: '20px' }}>
              ...
            </Typography>
          )}
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
          {/* Exchange Section */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                height: '110px',
                width: '110px',
                mr: 4,
                backgroundImage: `url(${ExchangeIcons[accountExchange?.toLowerCase()]})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                flexShrink: 0,
              }}
            />
            <Stack spacing={4} sx={{ my: 'auto' }}>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 800,
                  fontSize: '40px',
                  color: whiteColor,
                  textAlign: 'left',
                  textTransform: 'capitalize',
                  lineHeight: 1,
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
                  textAlign: 'left',
                  textTransform: 'capitalize',
                  lineHeight: 1,
                }}
              >
                Proof of Order
              </Typography>
            </Stack>
          </Box>

          {/* Order Identity Section */}
          <Stack spacing={2}>
            <Stack alignItems='center' direction='row' spacing={4}>
              {pair && (
                <TokenIcon
                  useFallback
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                  tokenName={getUnderlying(pair)}
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
              <Chip
                label={mapSideToPosition(side)}
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 700,
                  fontSize: '24px',
                  color: 'var(--text-primary)',
                  backgroundColor: sideColor,
                  textTransform: 'uppercase',
                  height: 'auto',
                  '& .MuiChip-label': {
                    paddingX: '12px',
                    paddingY: '4px',
                  },
                }}
              />
            </Stack>
            {/* Secondary Metric: Venues, Maker & Taker */}
            <Stack spacing={0.5}>
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 600,
                  fontSize: '28px',
                  lineHeight: 1.1,
                  textAlign: 'left',
                  mt: 1,
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Box component='span' sx={{ color: greenColor, m: 2 }}>
                  {maker_percentage ?? 0}% Maker
                </Box>
                {' / '}
                <Box component='span' sx={{ color: redColor, m: 2 }}>
                  {taker_percentage ?? 0}% Taker
                </Box>
              </Typography>
            </Stack>
          </Stack>

          {/* Primary Metric: Executed Notional */}
          <Stack spacing={1}>
            <Typography sx={{ ...baseDataTextStyle, color: greyColor, fontSize: '24px' }}>Executed Notional</Typography>
            <Typography
              component='div'
              sx={{
                fontFamily: '"Inter", sans-serif',
                fontWeight: 600,
                fontSize: '96px',
                lineHeight: 1.1,
                textAlign: 'left',
              }}
            >
              <Box component='span' sx={{ color: side?.toLowerCase() === 'buy' ? greenColor : redColor }}>
                {formattedNotional}
              </Box>
            </Typography>
          </Stack>

          {/* Execution Quality Section */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 4,
              mt: 2,
            }}
          >
            {/* Column 1 */}
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography sx={{ ...baseDataTextStyle, color: greyColor, fontSize: '20px' }}>
                  Avg Executed Price
                </Typography>
                <Typography sx={{ ...valueTextStyle, color: whiteColor, fontSize: '32px' }}>
                  {arrival_price ? `$${numbro(arrival_price).format({ thousandSeparated: true, mantissa: 2 })}` : 'N/A'}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography sx={{ ...baseDataTextStyle, color: greyColor, fontSize: '20px' }}>Duration</Typography>
                <Typography sx={{ ...valueTextStyle, color: whiteColor, fontSize: '32px' }}>{duration}</Typography>
              </Stack>
            </Stack>

            {/* Column 2 */}
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography sx={{ ...baseDataTextStyle, color: greyColor, fontSize: '20px' }}>Executed Qty</Typography>
                <Typography sx={{ ...valueTextStyle, color: whiteColor, fontSize: '32px' }}>{formattedQty}</Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography sx={{ ...baseDataTextStyle, color: greyColor, fontSize: '20px' }}>Slippage</Typography>
                <Typography sx={{ ...valueTextStyle, color: whiteColor, fontSize: '32px' }}>
                  {formattedArrivalCostPercentage === 'N/A' ? (
                    <Box component='span' sx={{ ...baseDataTextStyle, color: greyColor }}>
                      -
                    </Box>
                  ) : (
                    <Box component='span' sx={{ color: arrival_cost < 0 ? greenColor : redColor }}>
                      {formattedArrivalCostPercentage}
                    </Box>
                  )}
                </Typography>
              </Stack>
            </Stack>

            {/* Column 3 */}
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography sx={{ ...baseDataTextStyle, color: greyColor, fontSize: '20px' }}>Strategy</Typography>
                <Typography sx={{ ...valueTextStyle, color: whiteColor, fontSize: '32px' }}>
                  {super_strategy || 'N/A'}
                </Typography>
              </Stack>
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
          <Stack spacing={2.5} sx={{ alignItems: 'center' }}>
            {/* QR Code */}
            {qrCodeUrl && (
              <Box
                sx={{
                  backgroundColor: theme.palette.background.white,
                  padding: '24px',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <QRCode bgColor={whiteColor} fgColor='#000000' level='M' size={200} value={qrCodeUrl} />
                <Typography
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 500,
                    fontSize: '16px',
                    color: '#000000',
                    textAlign: 'center',
                    maxWidth: '200px',
                  }}
                >
                  On-Chain Proof of Order
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
});

ShareableOrderComponent.displayName = 'ShareableOrderComponent';

ShareableOrderComponent.propTypes = {
  orderData: PropTypes.shape({
    executed_notional: PropTypes.number, // Primary Metric: Executed Notional ($)
    executed_qty: PropTypes.number, // Secondary Metric: Executed Quantity (Token)
    pair: PropTypes.string, // Token Pair
    side: PropTypes.string, // Side (Buy/Sell)
    super_strategy: PropTypes.string, // Strategy
    slippage: PropTypes.number, // Total Slippage ($)
    vwap_slippage: PropTypes.number, // VWAP Slippage (bps & %)
    maker_percentage: PropTypes.number, // Maker percentage
    taker_percentage: PropTypes.number, // Taker percentage
    account_name: PropTypes.string, // Account Name
    trader_id: PropTypes.string, // Trader ID (Obfuscated)
    time_start: PropTypes.string, // Trade Start Time
    time_end: PropTypes.string, // Trade End Time
    order_id: PropTypes.string, // Order ID for QR code
    referralLink: PropTypes.string, // Referral Link
    accountId: PropTypes.string, // Add accountId prop type
    unique_venues: PropTypes.arrayOf(PropTypes.string), // Add unique_venues prop type
    arrival_cost: PropTypes.number, // In BPS
    vwap_cost: PropTypes.number, // In BPS
    arrival_bps_notional: PropTypes.number, // In $
    arrival_price: PropTypes.number, // Add arrival_price prop type
    last_fill_price: PropTypes.number, // Add last_fill_price prop type
    arweave_tx_url: PropTypes.string, // Add arweave_tx_url prop type
    accountExchange: PropTypes.string, // Add accountExchange prop type
  }),
};

ShareableOrderComponent.defaultProps = {
  orderData: defaultMockData,
};

export default ShareableOrderComponent;
