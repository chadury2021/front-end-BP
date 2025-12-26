import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Skeleton,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DataComponent from '@/shared/DataComponent';
import { ExchangeIcons } from '@/shared/iconUtil';
import { TokenIcon } from '@/shared/components/Icons';
import { Star, StarBorder } from '@mui/icons-material';
import { atomWithStorage } from 'jotai/utils';
import { useAtom } from 'jotai';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { getFundingRates, getExchangeTickerData } from '@/apiServices';
import { smartRound } from '@/util';
import palette from '@/theme/colors';
import { calculatePeriodRate, getHeatmapColor, getSortIcon, getSortedSymbols } from '../utils';

const fundingRateFavoritesAtom = atomWithStorage('fundingRateFavorites', {});

const FundingRateRow = memo(({ data, index, style }) => {
  const {
    symbols,
    rateMap,
    exchanges,
    fundingRateFavorites,
    setFundingRateFavorites,
    fundingRatePeriod,
    handleFundingRateClick,
  } = data;
  const symbol = symbols[index];

  return (
    <TableRow key={symbol} style={{ ...style, display: 'flex', width: '100%' }}>
      <TableCell
        align='center'
        padding='none'
        sx={{
          width: 32,
          minWidth: 32,
          height: 35,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${palette.common.transparent}`,
        }}
      >
        <IconButton
          size='small'
          sx={{ p: 0, m: 0, height: 24, width: 24 }}
          onClick={() => setFundingRateFavorites((prev) => ({ ...prev, [symbol]: !prev[symbol] }))}
        >
          {fundingRateFavorites[symbol] ? (
            <Star sx={{ color: 'primary.main', fontSize: 18 }} />
          ) : (
            <StarBorder sx={{ color: 'grey.main', fontSize: 18 }} />
          )}
        </IconButton>
      </TableCell>
      <TableCell
        align='center'
        padding='none'
        sx={{
          width: 32,
          px: 0.5,
          height: 35,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${palette.common.transparent}`,
        }}
      >
        <TokenIcon style={{ width: '20px', height: '20px' }} tokenName={symbol} />
      </TableCell>
      <TableCell
        align='left'
        padding='none'
        sx={{
          width: 100,
          minWidth: 100,
          height: 35,
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${palette.common.transparent}`,
        }}
      >
        <Typography variant='body1'>{symbol}</Typography>
      </TableCell>
      {exchanges.map((ex) => {
        const rateData = rateMap[symbol]?.[ex];
        let color = 'text.primary';
        if (rateData?.rate > 0) color = 'success.light';
        else if (rateData?.rate < 0) color = 'error.main';
        return (
          <TableCell
            align='center'
            key={ex}
            sx={{
              width: 160,
              height: 35,
              backgroundColor: rateData ? getHeatmapColor(rateData.rate, true) : 'transparent',
              padding: 0,
              transition: 'all 0.2s',
              cursor: rateData ? 'pointer' : 'default',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: `1px solid ${palette.common.transparent}`,
              '&:hover': rateData
                ? { backgroundColor: 'action.hover', outline: '1px solid var(--ui-border)', outlineOffset: '-1px' }
                : {},
            }}
            onClick={() => rateData && handleFundingRateClick(symbol, ex)}
          >
            {rateData !== undefined ? (
              <Typography sx={{ color, lineHeight: '35px' }} variant='body1'>
                {rateData.rate > 0 ? '+' : ''}
                {smartRound(calculatePeriodRate(rateData.rate, rateData.interval, fundingRatePeriod), 3)}%
              </Typography>
            ) : (
              <Typography color='text.secondary' sx={{ lineHeight: '35px' }} variant='body1'>
                -
              </Typography>
            )}
          </TableCell>
        );
      })}
    </TableRow>
  );
});

FundingRateRow.displayName = 'FundingRateRow';

export default function FundingRate() {
  const { user } = useUserMetadata();
  const isAuthenticated = user && user.is_authenticated;

  const [loading, setLoading] = useState(true);
  const [fundingRates, setFundingRates] = useState([]);
  const [tickerDataMap, setTickerDataMap] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [fundingRateSearch, setFundingRateSearch] = useState('');
  const [fundingRateFavorites, setFundingRateFavorites] = useAtom(fundingRateFavoritesAtom);
  const [fundingRatePeriod, setFundingRatePeriod] = useState('year');
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const sortMenuOpen = Boolean(sortMenuAnchor);
  const filterLabel = React.useMemo(() => {
    if (sortConfig.key === '24h') return 'Trending';
    if (sortConfig.key === 'price') return 'Price';
    if (sortConfig.key === 'volume') return 'Volume';
    return 'APR';
  }, [sortConfig.key]);

  const handleFundingRatePeriod = (_event, newPeriod) => {
    if (newPeriod) setFundingRatePeriod(newPeriod);
  };

  const handleSort = (key) => {
    if (key === 'token') {
      setSortConfig({ key: null, direction: 'asc' });
      return;
    }
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') setSortConfig({ key, direction: 'desc' });
      else setSortConfig({ key: null, direction: 'asc' });
      return;
    }
    setSortConfig({ key, direction: 'asc' });
  };

  const handleFundingRateClick = (symbol, exchange) => {
    const quoteCurrency = exchange === 'Hyperliquid' ? 'USDC' : 'USDT';
    const url = `enter_multi_order?buy=${symbol}-${quoteCurrency}@${exchange}&sell=${symbol}:PERP-${quoteCurrency}@${exchange}`;
    window.open(`/${url}`, '_blank');
  };

  useEffect(() => {
    async function fetchFundingRates() {
      try {
        const data = await getFundingRates().catch(() => []);
        setFundingRates(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchFundingRates();
      // Load ticker data for volume/price/trending sorts
      (async () => {
        try {
          const exchanges = ['Binance', 'OKX', 'Bybit', 'Coinbase'];
          const results = await Promise.all(
            exchanges.map((exchange) =>
              getExchangeTickerData({ exchangeName: exchange })
                .then((rows) => rows.map((r) => ({ ...r, exchange })))
                .catch(() => [])
            )
          );
          const flat = results.flat();
          const map = {};
          flat.forEach((r) => {
            map[r.pair] = r;
          });
          setTickerDataMap(map);
        } catch (_e) {
          setTickerDataMap({});
        }
      })();
      const interval = setInterval(fetchFundingRates, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isAuthenticated]);

  const sortedFundingRateData = useMemo(() => {
    const rateMap = {};
    const symbolSet = new Set();
    const exchangesSet = new Set();
    fundingRates.forEach(({ pair, exchange, rate, funding_rate_interval }) => {
      if (!rateMap[pair]) rateMap[pair] = {};
      rateMap[pair][exchange] = {
        rate: Number(rate) || 0,
        interval: Number(funding_rate_interval) || 4,
      };
      symbolSet.add(pair);
      exchangesSet.add(exchange);
    });

    const priorityExchanges = ['Binance', 'Bybit', 'OKX', 'Hyperliquid'];
    const exchanges = Array.from(exchangesSet)
      .sort((a, b) => {
        const aIndex = priorityExchanges.indexOf(a);
        const bIndex = priorityExchanges.indexOf(b);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.localeCompare(b);
      })
      .filter((ex) => ex !== 'Deribit');

    const filtered = Array.from(symbolSet).reduce(
      (acc, symbol) => {
        const matchesSearch = symbol.toLowerCase().includes(fundingRateSearch.toLowerCase());
        if (!matchesSearch) return acc;
        if (fundingRateFavorites[symbol]) acc.favorites.push(symbol);
        else acc.others.push(symbol);
        return acc;
      },
      { favorites: [], others: [] }
    );

    const symbols = filtered.favorites.concat(
      getSortedSymbols(filtered.others, rateMap, sortConfig, fundingRatePeriod, tickerDataMap)
    );

    return { symbols, rateMap, exchanges };
  }, [fundingRates, fundingRateFavorites, fundingRateSearch, sortConfig, fundingRatePeriod]);

  const getItemSize = () => 35;

  return (
    <Paper
      elevation={0}
      sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}
    >
      <DataComponent isLoading={loading} loadingComponent={<Skeleton height='100%' variant='rectangular' />}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography gutterBottom variant='subtitle1'>
              Funding Yield
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                placeholder='Search token...'
                size='small'
                sx={{ width: 240 }}
                value={fundingRateSearch}
                onChange={(e) => setFundingRateSearch(e.target.value)}
              />
              <Box>
                <Button
                  endIcon={<KeyboardArrowDownIcon fontSize='small' />}
                  size='small'
                  sx={{ minWidth: 160, justifyContent: 'space-between', pl: 1, pr: 1, borderRadius: 1 }}
                  variant='outlined'
                  onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterListIcon fontSize='small' />
                    <Typography variant='body3'>{filterLabel}</Typography>
                  </Box>
                </Button>
                <Menu
                  anchorEl={sortMenuAnchor}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  open={sortMenuOpen}
                  PaperProps={{ sx: { minWidth: 180 } }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  onClose={() => setSortMenuAnchor(null)}
                >
                  <MenuItem
                    selected={sortConfig.key === 'Binance' || !sortConfig.key}
                    onClick={() => {
                      setSortConfig({ key: 'Binance', direction: 'desc' });
                      setSortMenuAnchor(null);
                    }}
                  >
                    APR
                  </MenuItem>
                  <MenuItem
                    selected={sortConfig.key === '24h'}
                    onClick={() => {
                      setSortConfig({ key: '24h', direction: 'desc' });
                      setSortMenuAnchor(null);
                    }}
                  >
                    Trending
                  </MenuItem>
                  <MenuItem
                    selected={sortConfig.key === 'price'}
                    onClick={() => {
                      setSortConfig({ key: 'price', direction: 'desc' });
                      setSortMenuAnchor(null);
                    }}
                  >
                    Price
                  </MenuItem>
                  <MenuItem
                    selected={sortConfig.key === 'volume'}
                    onClick={() => {
                      setSortConfig({ key: 'volume', direction: 'desc' });
                      setSortMenuAnchor(null);
                    }}
                  >
                    Volume
                  </MenuItem>
                </Menu>
              </Box>
              <ToggleButtonGroup exclusive size='small' value={fundingRatePeriod} onChange={handleFundingRatePeriod}>
                <ToggleButton value='day'>Day</ToggleButton>
                <ToggleButton value='week'>Week</ToggleButton>
                <ToggleButton value='month'>Month</ToggleButton>
                <ToggleButton value='year'>Year</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', width: '100%' }}>
            <Table
              size='small'
              sx={{
                tableLayout: 'fixed',
                width: 'auto',
                minWidth: '100%',
                '& .MuiTableCell-root': {
                  borderBottom: `1px solid ${palette.common.transparent}`,
                },
              }}
            >
              <TableHead>
                <TableRow sx={{ display: 'flex', width: '100%' }}>
                  <TableCell align='center' padding='none' sx={{ width: 32, minWidth: 32 }} />
                  <TableCell align='center' padding='none' sx={{ width: 32, minWidth: 32, px: 0.5 }} />
                  <TableCell align='left' padding='none' sx={{ width: 100, minWidth: 100 }} />
                  {sortedFundingRateData.exchanges.map((ex) => (
                    <TableCell
                      align='center'
                      key={ex}
                      sx={{ minWidth: 32, width: 32, cursor: 'pointer', userSelect: 'none', flex: 1 }}
                      onClick={() => handleSort(ex)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                        <ExchangeIcons exchanges={[ex]} pairId={ex} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography>{ex}</Typography>
                          {(() => {
                            const Icon = getSortIcon(sortConfig, ex);
                            return Icon ? <Icon sx={{ fontSize: 18 }} /> : null;
                          })()}
                        </Box>
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
            </Table>
          </Box>

          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <AutoSizer>
              {({ height, width }) => (
                <List
                  height={height}
                  itemCount={sortedFundingRateData.symbols.length}
                  itemData={{
                    symbols: sortedFundingRateData.symbols,
                    rateMap: sortedFundingRateData.rateMap,
                    exchanges: sortedFundingRateData.exchanges,
                    fundingRateFavorites,
                    setFundingRateFavorites,
                    fundingRatePeriod,
                    handleFundingRateClick,
                  }}
                  itemSize={getItemSize}
                  style={{ scrollbarGutter: 'stable' }}
                  width={width}
                >
                  {FundingRateRow}
                </List>
              )}
            </AutoSizer>
          </Box>
        </Box>
      </DataComponent>
    </Paper>
  );
}
