import React from 'react';
import { Box, Paper, Stack, Typography, Tabs, Tab, IconButton } from '@mui/material';
import { Star } from '@mui/icons-material';
import getBaseTokenIcon from '@images/tokens';
import { getPairBase } from '@/util';

function MultiFavoritePairs({ fundingRateFavorites, tokenPairs, buyOrderItems, sellOrderItems, handleFavoriteClick }) {
  // Filter favorites to only include those that have both spot and perp pairs
  const favoriteBases = Object.keys(fundingRateFavorites).filter((base) => {
    if (!fundingRateFavorites[base]) return false;

    // Check if this base has both spot and perp pairs
    const hasSpotPair = tokenPairs.some((pair) => pair.id === `${base}-USDT` && !pair.id.includes(':PERP'));
    const hasPerpPair = tokenPairs.some((pair) => pair.id === `${base}:PERP-USDT`);

    return hasSpotPair && hasPerpPair;
  });

  // Get the base token from the current buy order pair
  const currentBase = getPairBase(buyOrderItems[0]?.pair?.id);

  if (favoriteBases.length === 0) {
    return (
      <Paper elevation={0} sx={{ boxSizing: 'border-box' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', height: '30px', justifyContent: 'center' }}>
          <Typography color='grey.main' variant='body2'>
            No funding arb favorite pairs
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ boxSizing: 'border-box' }}>
      <Stack direction='row' sx={{ minHeight: '30px', height: '30px' }}>
        <IconButton sx={{ color: 'text.secondary' }}>
          <Star sx={{ fontSize: '0.8rem' }} />
        </IconButton>
        <Tabs
          aria-label='scrollable tabs'
          scrollButtons='auto'
          sx={{
            minHeight: '30px',
            height: '30px',
          }}
          value={currentBase || false}
          variant='scrollable'
          onChange={(e, newValue) => handleFavoriteClick(newValue)}
        >
          {favoriteBases.map((base) => (
            <Tab
              key={base}
              label={
                <Stack alignItems='center' direction='row' spacing={1}>
                  <img alt={base} src={getBaseTokenIcon(base)} style={{ height: '16px', width: '16px' }} />
                  <Typography>{`${base} Funding Arb`}</Typography>
                </Stack>
              }
              sx={{
                paddingTop: '0px',
                paddingBottom: '0px',
                minHeight: '30px',
                height: '30px',
                fontSize: '12px',
              }}
              value={base}
            />
          ))}
        </Tabs>
      </Stack>
    </Paper>
  );
}

export default MultiFavoritePairs;
