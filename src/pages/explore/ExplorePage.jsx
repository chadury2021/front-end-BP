import React from 'react';
import { Box, Grid, Paper, Typography, IconButton, Tabs, Tab, Skeleton } from '@mui/material';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { useTitle } from '@/shared/context/TitleProvider';
import { smartRound, shortenNumber, formatQty } from '@/util';
import {
  getExchangeTickerData,
  getUserFavouritePairs,
  addUserFavouritePairs,
  deleteUserFavouritePairs,
  getTokenTradingInfo,
} from '@/apiServices';
import { Star, StarBorder } from '@mui/icons-material';
import { useAtom } from 'jotai';
import DataComponent from '@/shared/DataComponent';
import { TokenIcon } from '@/shared/components/Icons';
import { CASH_ASSETS } from '@/constants';
import { favouritePairsAtom } from '@/pages/dashboard/orderEntry/hooks/useFormReducer';
import { buildTokenId } from '@/shared/dexUtils';
import { useDexTokenRanking } from '@/shared/context/DexTokenRankingProvider';
import Watchlist from './components/Watchlist';
import VolumeGainersLosers from './components/VolumeGainersLosers';
import FundingRate from './components/FundingRate';
import DexTable from './components/DexTable';
import { extractBase, extractQuote, getHeatmapColor } from './utils';

function ExplorePageContent() {
  const { setTitle } = useTitle();
  const { user } = useUserMetadata();
  const isAuthenticated = user && user.is_authenticated;
  const [tickerData, setTickerData] = React.useState([]);
  const [dexTokenData, setDexTokenData] = React.useState([]);
  const [detailedDexTokenData, setDetailedDexTokenData] = React.useState({});
  const [favouritePairs, setFavouritePairs] = useAtom(favouritePairsAtom);
  const [watchlistSortBy, setWatchlistSortBy] = React.useState('volume');
  const [loading, setLoading] = React.useState(true);
  const maxRecords = 50;
  const [activeTab, setActiveTab] = React.useState('gainerslosers');
  const [watchlistSearch, setWatchlistSearch] = React.useState('');
  const [volumeTab, setVolumeTab] = React.useState('perp');
  const { fetchTokenRanking } = useDexTokenRanking();
  // Left panel shows only the Watchlist per request
  const hasAttemptedDexDefaultsRef = React.useRef(false);

  // Disable global scroll while Explore is mounted
  React.useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  // Calculate aggregated data once and reuse it everywhere
  const aggregatedData = React.useMemo(() => {
    if (tickerData.length === 0) return [];

    const dataMap = tickerData.reduce((acc, pair) => {
      const lastPrice = parseFloat(pair.lastPrice);
      if (Number.isNaN(lastPrice) || !Number.isFinite(lastPrice) || lastPrice === 0) {
        return acc;
      }

      const base = extractBase(pair.pair);
      const quote = extractQuote(pair.pair);
      const isPerp = pair.pair.includes('PERP');
      const isFuture = pair.pair.includes(':FUTURE') || base.includes('FUTURE');
      if (isFuture) {
        return acc;
      }
      const marketType = isPerp ? 'perp' : 'spot';
      const key = `${base}-${marketType}`;

      const volumeNotional = parseFloat(pair.volume24hNotional) || 0;
      const pctChange24h = parseFloat(pair.pricePctChange24h) || 0;

      if (volumeNotional <= 0) {
        // skip bad data
        return acc;
      }

      if (!CASH_ASSETS.includes(quote)) {
        // skip non-stable coins
        return acc;
      }

      if (!acc[key]) {
        acc[key] = {
          base,
          volume24h: 0,
          // we'll compute volume-weighted average change using this running sum
          weightedChangeSum: 0,
          lastPrice: 0,
          count: 0,
          isPerp,
          market_type: marketType,
          quote,
          quotePriority: CASH_ASSETS.indexOf(quote),
          exchanges: new Set(),
        };
      } else {
        const quotePriority = CASH_ASSETS.indexOf(quote);
        const currentPriority =
          acc[key].quotePriority === undefined ? Number.POSITIVE_INFINITY : acc[key].quotePriority;
        if (quotePriority !== -1 && quotePriority < currentPriority) {
          acc[key].quote = quote;
          acc[key].quotePriority = quotePriority;
        }
      }

      acc[key].volume24h += volumeNotional;
      acc[key].weightedChangeSum += pctChange24h * volumeNotional;
      acc[key].lastPrice += lastPrice;
      acc[key].count += 1;
      acc[key].market_type = marketType;
      acc[key].exchanges.add(pair.exchange);
      return acc;
    }, {});

    const processedData = Object.values(dataMap)
      .map((item) => {
        const avgLastPrice = item.count > 0 ? item.lastPrice / item.count : 0;
        const quote = item.quote || 'USDT';
        const marketType = item.market_type || (item.isPerp ? 'perp' : 'spot');
        const pairKey = `${item.base}-${quote}`;

        return {
          ...item,
          // volume-weighted average 24h change
          pricePctChange24h: item.volume24h > 0 ? item.weightedChangeSum / item.volume24h : 0,
          lastPrice: avgLastPrice,
          exchanges: Array.from(item.exchanges || []),
          quote,
          market_type: marketType,
          pairKey,
          id: pairKey,
        };
      })
      .filter((item) => {
        return !Number.isNaN(item.lastPrice) && Number.isFinite(item.lastPrice) && item.lastPrice !== 0;
      });

    return processedData;
  }, [tickerData]);

  // Derive all the different views from the same aggregated data
  const sortedByVolume = React.useMemo(() => {
    return [...aggregatedData].sort((a, b) => b.volume24h - a.volume24h);
  }, [aggregatedData]);

  const sortedByPriceChange = React.useMemo(() => {
    return [...aggregatedData].sort((a, b) => Math.abs(b.pricePctChange24h) - Math.abs(a.pricePctChange24h));
  }, [aggregatedData]);

  const perpPairs = React.useMemo(() => {
    return sortedByVolume.filter((pair) => pair.market_type === 'perp' && !pair.base.toUpperCase().includes('USD'));
  }, [sortedByVolume]);

  const spotPairs = React.useMemo(() => {
    return sortedByVolume.filter((pair) => pair.market_type === 'spot' && !pair.base.toUpperCase().includes('USD'));
  }, [sortedByVolume]);

  const sortedByGain = React.useMemo(() => {
    return sortedByPriceChange.filter((pair) => pair.pricePctChange24h > 0);
  }, [sortedByPriceChange]);

  const sortedByLoss = React.useMemo(() => {
    return sortedByPriceChange.filter((pair) => pair.pricePctChange24h < 0);
  }, [sortedByPriceChange]);

  const sortedWatchlist = React.useMemo(() => {
    const watchlistData = aggregatedData.filter((item) => item.pairKey && favouritePairs[item.pairKey]);

    return watchlistData.sort((a, b) => {
      if (watchlistSortBy === 'volume') {
        return b.volume24h - a.volume24h;
      }
      return b.lastPrice - a.lastPrice;
    });
  }, [aggregatedData, favouritePairs, watchlistSortBy]);

  // Sorting for funding rates moved into FundingRate component

  const handlePairClick = (pair) => {
    if (!pair) return;

    if (pair.chain_id !== undefined) {
      let pairId = null;
      if (typeof pair.id === 'string' && pair.id.length > 0) {
        pairId = pair.id;
      } else if (pair.address && pair.chain_id !== undefined) {
        pairId = buildTokenId(pair.address, pair.chain_id);
      }
      if (pairId) {
        window.open(`/?pair=${pairId}`, '_blank');
      }
      return;
    }

    let pairKey =
      (typeof pair.pairKey === 'string' && pair.pairKey.length > 0 && pair.pairKey) ||
      (typeof pair.id === 'string' && pair.id.length > 0 ? pair.id : null) ||
      (typeof pair.pair === 'string' && pair.pair.length > 0 ? pair.pair : null);

    const base = pair.base || pair.symbol || '';
    const quote = pair.quote || 'USDT';

    if (!pairKey && base) {
      const isPerp = pair.isPerp || (typeof pair.pair === 'string' && pair.pair.includes(':PERP'));
      pairKey = isPerp ? `${base}:PERP-${quote}` : `${base}-${quote}`;
    }

    if (pairKey) {
      window.open(`/?pair=${pairKey}`, '_blank');
    }
  };

  const toggleFavorite = React.useCallback(
    async (pairKey) => {
      if (!pairKey) return;

      const isCurrentlyFavourite = Boolean(favouritePairs[pairKey]);
      setFavouritePairs((prev) => ({ ...prev, [pairKey]: !isCurrentlyFavourite }));

      try {
        if (isCurrentlyFavourite) {
          await deleteUserFavouritePairs([pairKey]);
        } else {
          await addUserFavouritePairs([pairKey]);
        }
      } catch (_error) {
        setFavouritePairs((prev) => ({ ...prev, [pairKey]: isCurrentlyFavourite }));
      }
    },
    [favouritePairs, setFavouritePairs]
  );

  const loadFavouritePairs = React.useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const result = await getUserFavouritePairs();
      const { pairs } = result;
      const formatted = pairs.reduce((acc, pair) => {
        acc[pair] = true;
        return acc;
      }, {});
      setFavouritePairs(formatted);
    } catch (_error) {
      // silently ignore in UI; network tab will show details
    }
  }, [isAuthenticated, setFavouritePairs]);

  React.useEffect(() => {
    setTitle('Explore');
  }, [setTitle]);

  React.useEffect(() => {
    if (isAuthenticated) {
      loadFavouritePairs();
    }
  }, [isAuthenticated, loadFavouritePairs]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const exchanges = ['Binance', 'OKX', 'Bybit', 'Deribit', 'Coinbase'];
        const tickerDataPromises = exchanges.map((exchange) =>
          getExchangeTickerData({ exchangeName: exchange })
            .then((data) => data.map((item) => ({ ...item, exchange })))
            .catch((_error) => {
              return [];
            })
        );

        const tickerDataResult = await Promise.all(tickerDataPromises).then((results) => results.flat());

        setTickerData(tickerDataResult);
        setLoading(false);
      } catch (_error) {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isAuthenticated]);

  // Fetch DEX token data for watchlist
  React.useEffect(() => {
    const fetchDexData = async () => {
      if (!isAuthenticated || !fetchTokenRanking) return;

      try {
        const supportedChains = [1, 56, 8453, 501]; // Ethereum, BSC, Base, Solana
        const dexData = await fetchTokenRanking(supportedChains, '5', '2'); // volume sort, 1h timeframe
        setDexTokenData(Array.isArray(dexData) ? dexData : []);
      } catch (_error) {
        // Silently handle error
      }
    };

    fetchDexData();
  }, [isAuthenticated, fetchTokenRanking]);

  // Fetch detailed token data for favorited DEX tokens only
  React.useEffect(() => {
    const fetchDetailedDexData = async () => {
      if (!dexTokenData.length || !Object.keys(favouritePairs).length) return;

      try {
        // Only fetch detailed data for favorited DEX tokens
        const favoritedTokenIds = dexTokenData
          .filter((token) => {
            const pairKey =
              token.id ||
              (token.address && token.chain_id ? buildTokenId(token.address, token.chain_id) : token.symbol);
            return favouritePairs[pairKey];
          })
          .map((token) => token.id)
          .filter(Boolean);

        if (favoritedTokenIds.length === 0) return;

        const detailedInfo = await getTokenTradingInfo(favoritedTokenIds);
        setDetailedDexTokenData(detailedInfo);
      } catch (_error) {
        // Silently handle error
      }
    };

    fetchDetailedDexData();
  }, [dexTokenData, favouritePairs]);

  // Add default DEX tokens to favorites if none exist
  React.useEffect(() => {
    const addDefaultDexTokens = async () => {
      if (!isAuthenticated || !dexTokenData.length) return;

      // Prevent re-running due to unrelated state changes
      if (hasAttemptedDexDefaultsRef.current) return;

      // Check if user has any DEX tokens favorited
      const hasDexFavorites = Object.keys(favouritePairs).some((key) =>
        dexTokenData.some((token) => {
          const pairKey =
            token.id || (token.address && token.chain_id ? buildTokenId(token.address, token.chain_id) : token.symbol);
          return pairKey === key && favouritePairs[key];
        })
      );

      if (hasDexFavorites) {
        hasAttemptedDexDefaultsRef.current = true;
        return;
      }

      // Add top 5 DEX tokens as default favorites
      const topDexTokens = dexTokenData
        .filter((token) => token.symbol && token.price > 0)
        .sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0))
        .slice(0, 5);

      if (topDexTokens.length === 0) {
        hasAttemptedDexDefaultsRef.current = true;
        return;
      }

      try {
        const pairKeys = topDexTokens.map(
          (token) =>
            token.id || (token.address && token.chain_id ? buildTokenId(token.address, token.chain_id) : token.symbol)
        );
        await addUserFavouritePairs(pairKeys);

        // Update local state using functional set to avoid stale closure
        setFavouritePairs((prev) => {
          const updated = { ...prev };
          pairKeys.forEach((key) => {
            updated[key] = true;
          });
          return updated;
        });
      } catch (_error) {
        // Silently handle error
      } finally {
        hasAttemptedDexDefaultsRef.current = true;
      }
    };

    addDefaultDexTokens();
  }, [isAuthenticated, dexTokenData]);

  const renderPairsTable = (pairs, title) => {
    const displayPairs = pairs.slice(0, maxRecords);

    const getTableType = (tableTitle) => {
      const lowerTitle = tableTitle.toLowerCase();
      if (lowerTitle.includes('perp')) return 'perp';
      if (lowerTitle.includes('spot')) return 'spot';
      if (lowerTitle.includes('gainers')) return 'gainers';
      if (lowerTitle.includes('losers')) return 'losers';
      return 'price';
    };

    const tableType = getTableType(title);

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography gutterBottom variant='subtitle1'>
            {title}
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
          }}
        >
          <Grid container spacing={1}>
            {displayPairs.map((pair) => {
              const priceChangeColor = pair.pricePctChange24h > 0 ? 'success.light' : 'error.main';
              const fallbackQuote = pair.quote || 'USDT';
              const resolvedPairKey =
                pair.pairKey || (pair.isPerp ? `${pair.base}:PERP-${fallbackQuote}` : `${pair.base}-${fallbackQuote}`);
              const uniqueKey = `${tableType}-${resolvedPairKey || pair.base}`;

              return (
                <Grid item key={uniqueKey} xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      height: 60,
                      background:
                        (tableType === 'perp' || tableType === 'spot' || tableType === 'price') &&
                        pair.pricePctChange24h
                          ? getHeatmapColor(pair.pricePctChange24h / 100, false)
                          : 'transparent',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        outline: '1px solid var(--ui-border)',
                        outlineOffset: '-1px',
                      },
                    }}
                    onClick={() => handlePairClick(pair)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, pl: 0 }}>
                      <IconButton
                        size='small'
                        sx={{ p: 0, m: 0, height: 24, width: 24 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (resolvedPairKey) {
                            toggleFavorite(resolvedPairKey);
                          }
                        }}
                      >
                        {resolvedPairKey && favouritePairs[resolvedPairKey] ? (
                          <Star sx={{ color: 'primary.main', fontSize: 18 }} />
                        ) : (
                          <StarBorder sx={{ color: 'grey.main', fontSize: 18 }} />
                        )}
                      </IconButton>
                    </Box>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TokenIcon style={{ width: '20px', height: '20px' }} tokenName={pair.base} />
                        <Typography sx={{ fontWeight: 500 }} variant='body1'>
                          {pair?.pair?.includes(':PERP') ? pair.pair : pair?.base || ''}
                        </Typography>
                      </Box>
                      <Typography color='text.secondary' variant='body2'>
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
                      <Typography sx={{ fontWeight: 500 }} variant='body1'>
                        {formatQty(pair.lastPrice, true)}
                      </Typography>
                      <Typography sx={{ color: priceChangeColor, fontWeight: 500 }} variant='body2'>
                        {pair.pricePctChange24h > 0 ? '+' : ''}
                        {smartRound(pair.pricePctChange24h, 2)}%
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Box>
    );
  };

  // Get favorited DEX tokens
  const getFavoritedDexTokens = React.useCallback(() => {
    if (!dexTokenData.length) return [];

    return dexTokenData
      .map((token) => {
        const pairKey =
          token.id || (token.address && token.chain_id ? buildTokenId(token.address, token.chain_id) : token.symbol);
        return { token, pairKey };
      })
      .filter(({ pairKey }) => pairKey && favouritePairs[pairKey])
      .map(({ token, pairKey }) => {
        // Get detailed token data if available
        const detailedData = detailedDexTokenData[token.id];

        // Use the same field resolution logic as DexTable
        const volumeFields = [
          'volume',
          'volume_usd',
          'volumeUsd',
          'volume_24h',
          'volume24h',
          'volume24H',
          'dex_volume',
          'dexVolume',
        ];
        const priceFields = ['price', 'price_usd', 'priceUsd', 'lastPrice', 'last_price'];
        const changeFields = [
          'priceChange24H',
          'priceChange24h',
          'price_change_24h',
          'change24H',
          'change24h',
          'change_24h',
          'priceChange',
          'change',
        ];

        const getFirstAvailableValue = (sources, fields) => {
          return sources.reduce((result, source) => {
            if (result !== null || !source) return result;
            return fields.reduce((fieldResult, field) => {
              if (fieldResult !== null) return fieldResult;
              return source[field] !== undefined && source[field] !== null ? source[field] : null;
            }, null);
          }, null);
        };

        // Try multiple sources like DexTable does
        const sources = [detailedData?.price_info, detailedData, token.price_info, token];

        const volume = getFirstAvailableValue(sources, volumeFields) || 0;
        const price = getFirstAvailableValue(sources, priceFields) || 0;
        const priceChange = getFirstAvailableValue(sources, changeFields) || 0;

        const result = {
          base: token.symbol,
          volume24h: volume,
          lastPrice: price,
          pricePctChange24h: priceChange,
          isPerp: false,
          market_type: 'dex',
          dexToken: token,
          pairKey,
        };

        return result;
      });
  }, [dexTokenData, detailedDexTokenData, favouritePairs]);

  // Memoized selector for watchlist display items
  const displayWatchlistPairs = React.useMemo(() => {
    // If searching, search across ALL aggregated tokens; otherwise only favorites
    const source = watchlistSearch ? aggregatedData : sortedWatchlist;
    let list = source;
    let searchTerm = null;
    if (watchlistSearch) {
      searchTerm = watchlistSearch.toLowerCase();
      list = list.filter((p) => p.base?.toLowerCase().includes(searchTerm));
    }

    // Add favorited DEX tokens
    const favoritedDexTokens = getFavoritedDexTokens();
    const filteredDexTokens = searchTerm
      ? favoritedDexTokens.filter((token) => token.base?.toLowerCase().includes(searchTerm))
      : favoritedDexTokens;
    const combinedList = [...list, ...filteredDexTokens];

    // Remove duplicates across combined sources
    const dedupedList = [];
    const seen = new Set();
    combinedList.forEach((item) => {
      const key = item.pairKey || `${item.base}-${item.market_type || ''}`;
      if (!key || seen.has(key)) return;
      seen.add(key);
      dedupedList.push(item);
    });

    // Apply same sorting as favorites view
    const sortedList = [...dedupedList].sort((a, b) => {
      if (watchlistSortBy === 'volume') return b.volume24h - a.volume24h;
      return b.lastPrice - a.lastPrice;
    });
    return sortedList.slice(0, maxRecords);
  }, [aggregatedData, sortedWatchlist, watchlistSearch, watchlistSortBy, getFavoritedDexTokens]);

  const renderWatchlist = () => (
    <Watchlist
      displayPairs={displayWatchlistPairs}
      favouritePairs={favouritePairs}
      handlePairClick={handlePairClick}
      setWatchlistSearch={setWatchlistSearch}
      setWatchlistSortBy={setWatchlistSortBy}
      toggleFavorite={toggleFavorite}
      watchlistSearch={watchlistSearch}
      watchlistSortBy={watchlistSortBy}
    />
  );

  const renderTabsBar = () => (
    <Box sx={{ px: 2, pt: 1, display: 'flex', justifyContent: 'flex-start' }}>
      <Tabs
        allowScrollButtonsMobile
        sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40 } }}
        value={activeTab}
        variant='scrollable'
        onChange={(e, v) => setActiveTab(v)}
      >
        <Tab label='Gainers & Losers' value='gainerslosers' />
        <Tab label='Funding Yield' value='funding' />
        <Tab label='Dex Explore' value='dex' />
      </Tabs>
    </Box>
  );

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          p: 2,
          pt: 1,
          flex: 1,
          minHeight: 0,
          boxSizing: 'border-box',
        }}
      >
        <Grid container spacing={2} sx={{ height: '100%', minHeight: 0 }}>
          {/* Left fixed watchlist */}
          <Grid item md={3} sx={{ height: '100%' }} xs={12}>
            <DataComponent isLoading={loading} loadingComponent={<Skeleton height='100%' variant='rectangular' />}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxSizing: 'border-box',
                  position: 'sticky',
                  top: 0,
                  overflow: 'auto',
                  backgroundColor: 'background.paper',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ flex: 1, minHeight: 0 }}>{renderWatchlist()}</Box>
                </Box>
              </Paper>
            </DataComponent>
          </Grid>

          {/* Right scrollable content */}
          <Grid item md={9} sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }} xs={12}>
            {renderTabsBar()}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                ...(activeTab === 'dex'
                  ? {
                      backgroundColor: 'background.card',
                      p: 2,
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                    }
                  : {}),
              }}
            >
              {activeTab === 'gainerslosers' && (
                <VolumeGainersLosers
                  loading={loading}
                  perpPairs={perpPairs}
                  renderPairsTable={renderPairsTable}
                  setVolumeTab={setVolumeTab}
                  sortedByGain={sortedByGain}
                  sortedByLoss={sortedByLoss}
                  spotPairs={spotPairs}
                  volumeTab={volumeTab}
                />
              )}

              {activeTab === 'funding' && <FundingRate />}

              {activeTab === 'dex' && <DexTable onPairClick={handlePairClick} />}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

function ExplorePage() {
  return <ExplorePageContent />;
}

export default ExplorePage;
