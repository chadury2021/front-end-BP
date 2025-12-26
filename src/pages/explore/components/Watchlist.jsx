import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Grid, Paper, Typography, IconButton, TextField, Chip, Button } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Star, StarBorder } from '@mui/icons-material';
import { TokenIcon } from '@/shared/components/Icons';
import { shortenNumber, formatQty, smartRound } from '@/util';
import palette from '@/theme/colors';
import EmptyState from '@/shared/components/EmptyState';
import getDexTokenIcon from '../../../../images/dex_tokens';

/**
 * Watchlist component for displaying and managing favorite trading pairs
 * @param {Object} props - Component props
 * @param {Array} props.displayPairs - Array of trading pairs to display
 * @param {string} props.watchlistSearch - Current search query
 * @param {Function} props.setWatchlistSearch - Function to update search query
 * @param {string} props.watchlistSortBy - Current sort method ('volume' or 'price')
 * @param {Function} props.setWatchlistSortBy - Function to update sort method
 * @param {Object} props.favouritePairs - Object mapping pair keys to favorite status
 * @param {Function} props.toggleFavorite - Function to toggle favorite status
 * @param {Function} props.handlePairClick - Function to handle pair selection
 */
function Watchlist({
  displayPairs,
  watchlistSearch,
  setWatchlistSearch,
  watchlistSortBy,
  setWatchlistSortBy,
  favouritePairs,
  toggleFavorite,
  handlePairClick,
}) {
  const [expandedMarkets, setExpandedMarkets] = useState({
    perp: true,
    spot: true,
    dex: true,
  });

  const [showAllPairs, setShowAllPairs] = useState({
    perp: false,
    spot: false,
    dex: false,
  });

  const toggleExpandedMarket = (market) => {
    setExpandedMarkets((prev) => ({ ...prev, [market]: !prev[market] }));
  };

  const toggleShowAllPairs = (market) => {
    setShowAllPairs((prev) => ({ ...prev, [market]: !prev[market] }));
  };

  // Group pairs by market type
  const groupedPairs = React.useMemo(() => {
    const resolveMarketType = (pair) => {
      if (pair.market_type === 'dex') return 'dex';
      if (pair.market_type === 'perp' || pair.isPerp) return 'perp';
      return 'spot';
    };

    const perps = displayPairs.filter((p) => resolveMarketType(p) === 'perp');
    const spots = displayPairs.filter((p) => resolveMarketType(p) === 'spot');
    const dex = displayPairs.filter((p) => resolveMarketType(p) === 'dex');

    const result = [];

    // Helper to add a category block to the result, avoiding repetition
    const addCategory = (items, title, marketKey) => {
      if (items.length === 0) return;
      const showAll = showAllPairs[marketKey];
      const displayed = showAll ? items : items.slice(0, 5);
      const hasMore = items.length > 5;

      // Add vertical space between groups (except before the first group)
      if (result.length > 0) {
        result.push({ spacer: true, key: `spacer-before-${marketKey}` });
      }

      result.push({
        header: `${title}(${items.length})`,
        expanded: expandedMarkets[marketKey],
        onClick: () => toggleExpandedMarket(marketKey),
      });

      if (expandedMarkets[marketKey]) {
        result.push(...displayed);
        if (hasMore && !showAll) {
          result.push({
            showMore: true,
            market: marketKey,
            remaining: items.length - 5,
            onClick: () => toggleShowAllPairs(marketKey),
          });
        }
      }
    };

    // Add category headers and pairs using the helper
    addCategory(perps, 'Perpetual', 'perp');
    addCategory(spots, 'Spot', 'spot');
    addCategory(dex, 'DEX', 'dex');

    return result;
  }, [displayPairs, expandedMarkets, showAllPairs]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 2 }}>
        <Typography gutterBottom variant='subtitle1'>
          Watchlist
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography color='text.secondary' variant='caption'>
            Sort by:
          </Typography>
          <Typography
            sx={{
              color: watchlistSortBy === 'volume' ? 'primary.main' : 'text.secondary',
              cursor: 'pointer',
              '&:hover': { color: 'primary.light' },
            }}
            variant='body3'
            onClick={() => setWatchlistSortBy('volume')}
          >
            Volume
          </Typography>
          <Typography
            sx={{
              color: watchlistSortBy === 'price' ? 'primary.main' : 'text.secondary',
              cursor: 'pointer',
              '&:hover': { color: 'primary.light' },
            }}
            variant='body3'
            onClick={() => setWatchlistSortBy('price')}
          >
            Price
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            ),
          }}
          placeholder='Search pairs or address'
          size='small'
          value={watchlistSearch}
          onChange={(e) => setWatchlistSearch(e.target.value)}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 0.5,
          mb: 1,
          position: 'sticky',
          top: 64,
          zIndex: 1,
          backgroundColor: 'background.paper',
        }}
      >
        <Typography color='text.secondary' variant='caption'>
          Pair/Volume
        </Typography>
        <Typography color='text.secondary' variant='caption'>
          Price / 24h Change
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          pb: 0,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {groupedPairs.length === 0 ? (
          <EmptyState message='No favorite pairs' />
        ) : (
          <Grid container spacing={1}>
            {groupedPairs.map((item, index) => {
              // Render category header
              if (item.header) {
                return (
                  <Grid item key={`header-${item.header}`} xs={12}>
                    <Button
                      fullWidth
                      endIcon={item.expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'transparent',
                        color: 'text.secondary',
                        textTransform: 'none',
                        p: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                      variant='text'
                      onClick={item.onClick}
                    >
                      <Typography color='text.secondary' variant='small1'>
                        {item.header}
                      </Typography>
                    </Button>
                  </Grid>
                );
              }

              // Render spacer between groups
              if (item.spacer) {
                return (
                  <Grid item key={item.key} xs={12}>
                    <Box sx={{ height: 16 }} />
                  </Grid>
                );
              }

              // Render "Show More" button
              if (item.showMore) {
                return (
                  <Grid item key={`show-more-${item.market}`} xs={12}>
                    <Button
                      fullWidth
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'transparent',
                        color: 'primary.main',
                        textTransform: 'none',
                        p: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                      variant='text'
                      onClick={item.onClick}
                    >
                      <Typography color='primary.main' variant='body3'>
                        Show {item.remaining} more
                      </Typography>
                    </Button>
                  </Grid>
                );
              }

              // Render pair item
              const pair = item;
              const pricePctChange = pair.pricePctChange24h;

              let priceChangeColor;
              if (pricePctChange) {
                priceChangeColor = pricePctChange > 0 ? 'success.light' : 'error.main';
              }

              // Generate appropriate pair key based on market type
              const fallbackQuote = pair.quote || 'USDT';
              let { pairKey } = pair;
              if (!pairKey) {
                if (pair.market_type === 'dex') {
                  pairKey = pair.dexToken?.id || pair.dexToken?.symbol || pair.base;
                } else if (pair.isPerp) {
                  pairKey = `${pair.base}:PERP-${fallbackQuote}`;
                } else {
                  pairKey = `${pair.base}-${fallbackQuote}`;
                }
              }

              return (
                <Grid item key={`watchlist-${pairKey || `${pair.base}-${pair.market_type || 'default'}`}`} xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      height: 60,
                      borderRadius: 0,
                      background: 'transparent',
                      borderBottom: `1px solid ${palette.common.transparent}`,
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                    onClick={() =>
                      handlePairClick({
                        ...pair,
                        pair: pair.pair ?? pairKey,
                        pairKey,
                      })
                    }
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, pl: 0 }}>
                      <IconButton
                        size='small'
                        sx={{ p: 0, m: 0, height: 24, width: 24 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (pairKey) {
                            toggleFavorite(pairKey);
                          }
                        }}
                      >
                        {pairKey && favouritePairs[pairKey] ? (
                          <Star sx={{ color: 'primary.main', fontSize: 18 }} />
                        ) : (
                          <StarBorder sx={{ color: 'grey.main', fontSize: 18 }} />
                        )}
                      </IconButton>
                    </Box>

                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {pair.market_type === 'dex' && pair.dexToken ? (
                          (() => {
                            const iconSrc =
                              getDexTokenIcon(pair.dexToken.address, pair.dexToken.chain_id) || pair.dexToken.logo_url;
                            if (iconSrc) {
                              return (
                                <img
                                  alt='Token Icon'
                                  src={iconSrc}
                                  style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                                />
                              );
                            }
                            return <TokenIcon style={{ width: '20px', height: '20px' }} tokenName={pair.base} />;
                          })()
                        ) : (
                          <TokenIcon style={{ width: '20px', height: '20px' }} tokenName={pair.base} />
                        )}
                        <Typography sx={{ fontWeight: 500 }} variant='body3'>
                          {pair.base}
                        </Typography>
                      </Box>
                      <Typography color='text.secondary' variant='body3'>
                        <span style={{ color: 'text.secondary' }}>Volume: </span>
                        <span style={{ color: 'var(--text-primary)' }}>${shortenNumber(pair.volume24h)}</span>
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        gap: 0.5,
                      }}
                    >
                      <Typography sx={{ fontWeight: 500 }} variant='body3'>
                        {formatQty(pair.lastPrice, true)}
                      </Typography>
                      <Typography
                        sx={{ color: priceChangeColor, fontWeight: 500 }}
                        title='24h price change'
                        variant='body3'
                      >
                        {pricePctChange ? `${smartRound(pricePctChange, 2)}%` : '-'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Box>
  );
}

Watchlist.propTypes = {
  displayPairs: PropTypes.arrayOf(
    PropTypes.shape({
      base: PropTypes.string.isRequired,
      volume24h: PropTypes.number.isRequired,
      lastPrice: PropTypes.number.isRequired,
      pricePctChange24h: PropTypes.number.isRequired,
      isPerp: PropTypes.bool.isRequired,
    })
  ).isRequired,
  watchlistSearch: PropTypes.string.isRequired,
  setWatchlistSearch: PropTypes.func.isRequired,
  watchlistSortBy: PropTypes.oneOf(['volume', 'price']).isRequired,
  setWatchlistSortBy: PropTypes.func.isRequired,
  favouritePairs: PropTypes.objectOf(PropTypes.bool).isRequired,
  toggleFavorite: PropTypes.func.isRequired,
  handlePairClick: PropTypes.func.isRequired,
};

export default memo(Watchlist);
