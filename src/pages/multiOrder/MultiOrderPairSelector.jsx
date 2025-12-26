import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Stack,
  useTheme,
} from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import { useAtom } from 'jotai';
import { TokenIcon } from '@/shared/components/Icons';
import { ExchangeIcons } from '@/shared/iconUtil';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';
import { useNavigate } from 'react-router-dom';
import { calculatePeriodRate, getHeatmapColor, getSortIcon, getSortedSymbols } from '../explore/utils';
import { fundingRateFavoritesAtom } from './hooks/multiOrderAtoms';

const FundingRateRow = React.memo(({ data, index, style }) => {
  const {
    symbols,
    rateMap,
    exchanges,
    fundingRateFavorites,
    setFundingRateFavorites,
    fundingRatePeriod,
    handleFundingRateClick,
    tokenPairs,
    tickerData,
    theme,
  } = data;

  const symbol = symbols[index];

  return (
    <TableRow key={symbol} style={style}>
      <TableCell align='center' padding='none' style={{ width: '2.5%', minWidth: 24, height: 35 }}>
        <IconButton
          size='small'
          sx={{ p: 0, m: 0, height: 24, width: 24 }}
          onClick={() => setFundingRateFavorites((prev) => ({ ...prev, [symbol]: !prev[symbol] }))}
        >
          {fundingRateFavorites[symbol] ? (
            <Star sx={{ color: 'text.secondary', fontSize: 18 }} />
          ) : (
            <StarBorder sx={{ color: 'text.disabled', fontSize: 18 }} />
          )}
        </IconButton>
      </TableCell>
      <TableCell align='center' padding='none' style={{ width: '5%', minWidth: 40, height: 35 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          {symbol !== 'Portfolio' && <TokenIcon style={{ width: '20px', height: '20px' }} tokenName={symbol} />}
        </Box>
      </TableCell>
      <TableCell align='left' padding='none' style={{ width: '15%', minWidth: 100, height: 35 }}>
        <Typography variant='body1'>{symbol}</Typography>
      </TableCell>

      {exchanges.map((ex) => {
        const rateData = rateMap[symbol]?.[ex];
        const quoteCurrency = ex === 'Hyperliquid' ? 'USDC' : 'USDT';
        const spotPair = `${symbol}-${quoteCurrency}`;
        const perpPair = `${symbol}:PERP-${quoteCurrency}`;

        const spotPairExists = tokenPairs.some((pair) => pair.id === spotPair && pair.exchanges.includes(ex));
        const perpPairExists = tokenPairs.some((pair) => pair.id === perpPair && pair.exchanges.includes(ex));
        const exchangeSupported = spotPairExists && perpPairExists;

        let color = 'text.primary';
        if (!exchangeSupported) color = 'text.disabled';
        else if (rateData?.rate > 0) color = 'success.light';
        else if (rateData?.rate < 0) color = 'error.main';
        return (
          <TableCell
            align='center'
            key={ex}
            style={{
              width: '20%',
              minWidth: 120,
              maxWidth: 120,
              height: 35,
              backgroundColor: rateData && exchangeSupported ? getHeatmapColor(rateData.rate, true) : 'transparent',
              padding: 0,
              transition: 'all 0.2s',
              cursor: rateData ? 'pointer' : 'default',
            }}
            onClick={() => {
              if (rateData) handleFundingRateClick(symbol, ex);
            }}
            onMouseOut={
              rateData && exchangeSupported
                ? (e) => {
                    e.currentTarget.style.backgroundColor = getHeatmapColor(rateData.rate, true);
                  }
                : undefined
            }
            onMouseOver={
              rateData && exchangeSupported
                ? (e) => {
                    e.currentTarget.style.backgroundColor = `${theme.palette.grey[600]}08`; // ~3% opacity
                  }
                : undefined
            }
          >
            {rateData !== undefined ? (
              <Typography sx={{ color, lineHeight: '35px', textAlign: 'center', width: '100%' }} variant='body1'>
                {rateData.rate > 0 ? '+' : ''}
                {calculatePeriodRate(rateData.rate, rateData.interval, fundingRatePeriod).toFixed(3)}%
              </Typography>
            ) : (
              <Typography
                color='text.secondary'
                sx={{ lineHeight: '35px', textAlign: 'center', width: '100%' }}
                variant='body1'
              >
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

export default function MultiOrderPairSelector({ fundingRates, onPairSelect, tokenPairs, tickerData }) {
  const theme = useTheme();
  const [fundingRateFavorites, setFundingRateFavorites] = useAtom(fundingRateFavoritesAtom);
  const [fundingRateSearch, setFundingRateSearch] = React.useState('');
  const [fundingRatePeriod, setFundingRatePeriod] = React.useState('year');
  const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' });

  const handleFundingRatePeriod = (event, newPeriod) => {
    if (newPeriod) setFundingRatePeriod(newPeriod);
  };

  const handleSort = (key) => {
    if (key === 'token') {
      setSortConfig({ key: null, direction: 'asc' });
      return;
    }

    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        setSortConfig({ key, direction: 'desc' });
      } else {
        setSortConfig({ key: null, direction: 'asc' });
      }
      return;
    }

    setSortConfig({ key, direction: 'asc' });
  };

  const handleFundingRateClick = (symbol, exchange) => {
    onPairSelect(symbol, exchange);
  };

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

        if (fundingRateFavorites[symbol]) {
          acc.favorites.push(symbol);
        } else {
          acc.others.push(symbol);
        }
        return acc;
      },
      { favorites: [], others: [] }
    );

    const symbols = filtered.favorites.concat(
      getSortedSymbols(filtered.others, rateMap, sortConfig, fundingRatePeriod, tickerData)
    );

    return {
      symbols,
      rateMap,
      exchanges,
    };
  }, [fundingRates, fundingRateFavorites, fundingRateSearch, sortConfig, fundingRatePeriod, tickerData]);

  const getItemSize = () => 35;

  const exchangeColWidth = useMemo(() => {
    const n = sortedFundingRateData.exchanges.length;
    return n > 0 ? (100 - 2.5 - 2.5 - 15) / n : 0;
  }, [sortedFundingRateData.exchanges.length]);

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          placeholder='Search pairs'
          size='small'
          value={fundingRateSearch}
          variant='outlined'
          onChange={(e) => setFundingRateSearch(e.target.value)}
        />
      </Box>
      <TableContainer>
        <Table size='small' style={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell align='left' padding='none' style={{ width: '2.5%', minWidth: 24 }} />
              <TableCell align='left' padding='none' style={{ width: '5%', minWidth: 40 }} />
              <TableCell align='left' padding='none' style={{ width: '15%', minWidth: 100 }} />
              {sortedFundingRateData.exchanges.map((ex) => (
                <TableCell
                  align='center'
                  key={ex}
                  style={{
                    width: `${exchangeColWidth}%`,
                    minWidth: 120,
                    maxWidth: 120,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => handleSort(ex)}
                >
                  <Stack alignItems='center' direction='row' justifyContent='center' spacing={1}>
                    <ExchangeIcons exchanges={[ex]} pairId={ex} />
                    <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, gap: 0.5 }}>
                      <Typography>{formatExchangeNameDisplay(ex)}</Typography>
                      {(() => {
                        const Icon = getSortIcon(sortConfig, ex);
                        return Icon ? <Icon sx={{ fontSize: 18 }} /> : null;
                      })()}
                    </Box>
                  </Stack>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
        </Table>
      </TableContainer>
      <Box sx={{ flex: 1, minHeight: 0 }}>
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
                tokenPairs,
                theme,
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
  );
}
