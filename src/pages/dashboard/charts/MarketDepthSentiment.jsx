import { useTheme } from '@emotion/react';
import { Box, Typography, Tooltip } from '@mui/material';
import React, { useMemo } from 'react';

function MarketDepthSentiment({ orderBookData, containerWidth = 0 }) {
  const theme = useTheme();

  // Calculate buy/sell sentiment from order book data
  const sentimentData = useMemo(() => {
    if (!orderBookData || !orderBookData.bids || !orderBookData.asks) {
      return { buyPercentage: 50, sellPercentage: 50, buyVolume: 0, sellVolume: 0 };
    }

    // Calculate total volume for bids (buy orders)
    const buyVolume = orderBookData.bids.reduce((total, bid) => total + (bid.y || 0), 0);

    // Calculate total volume for asks (sell orders)
    const sellVolume = orderBookData.asks.reduce((total, ask) => total + (ask.y || 0), 0);

    const totalVolume = buyVolume + sellVolume;

    if (totalVolume === 0) {
      return { buyPercentage: 50, sellPercentage: 50, buyVolume: 0, sellVolume: 0 };
    }

    const buyPercentage = (buyVolume / totalVolume) * 100;
    const sellPercentage = (sellVolume / totalVolume) * 100;

    return {
      buyPercentage: Math.round(buyPercentage * 100) / 100, // Round to 2 decimal places
      sellPercentage: Math.round(sellPercentage * 100) / 100,
      buyVolume,
      sellVolume,
    };
  }, [orderBookData]);

  return (
    <Tooltip
      placement='bottom'
      title='Data shows the percentage and volume of buy (B) vs sell (S) trades, updated in real time from the order book.'
    >
      <Box
        sx={{
          width: '100%',
          mt: 2,
          mb: 1,
          pt: containerWidth < 250 ? 1 : 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          cursor: 'pointer',
        }}
      >
        {/* Main container with bar and labels on same line */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            width: '100%',
          }}
        >
          {/* Buy label (left) */}
          <Typography
            sx={{
              color: theme.palette.charts.green || theme.palette.success[500],
              fontWeight: 400,
              fontSize: '0.75rem',
              fontFamily: theme.typography.fontFamilyConfig.data, // Use IBM Plex Mono for data
              minWidth: 'fit-content',
            }}
          >
            B {sentimentData.buyPercentage.toFixed(2)}%
          </Typography>

          {/* Horizontal bar container */}
          <Box
            sx={{
              position: 'relative',
              flex: 1,
              height: '8px',
              backgroundColor: theme.palette.background.paper,
              borderRadius: '4px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            {/* Buy segment (left, green) */}
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${sentimentData.buyPercentage}%`,
                backgroundColor: theme.palette.charts.green || theme.palette.success[500],
                transition: 'width 0.3s ease-in-out',
                zIndex: 1,
              }}
            />

            {/* Sell segment (right, red) */}
            <Box
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                height: '100%',
                width: `${sentimentData.sellPercentage}%`,
                backgroundColor: theme.palette.charts.red || theme.palette.error[500],
                transition: 'width 0.3s ease-in-out',
                zIndex: 1,
              }}
            />
          </Box>

          {/* Sell label (right) */}
          <Typography
            sx={{
              color: theme.palette.charts.red || theme.palette.error[500],
              fontWeight: 400,
              fontSize: '0.75rem',
              fontFamily: theme.typography.fontFamilyConfig.data, // Use IBM Plex Mono for data
              minWidth: 'fit-content',
            }}
          >
            {sentimentData.sellPercentage.toFixed(2)}% S
          </Typography>
        </Box>

        {/* Optional: Volume information (smaller text) */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            mt: 0.5,
          }}
        >
          <Typography
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.65rem',
              fontFamily: theme.typography.fontFamilyConfig.data, // Use IBM Plex Mono for data
              opacity: 0.6,
            }}
          >
            Total:{' '}
            {sentimentData.buyVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>

          <Typography
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.65rem',
              fontFamily: theme.typography.fontFamilyConfig.data, // Use IBM Plex Mono for data
              opacity: 0.6,
            }}
          >
            Total:{' '}
            {sentimentData.sellVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
}

export default React.memo(MarketDepthSentiment);
