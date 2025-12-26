import React, { useMemo, memo, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
} from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import { atomWithStorage } from 'jotai/utils';
import { useAtom } from 'jotai';
import { TokenIcon } from '@/shared/components/Icons';
import { ExchangeIcons } from '@/shared/iconUtil';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';
import { smartRound } from '@/util';
import { calculatePeriodRate, getHeatmapColor, getSortIcon, getSortedSymbols } from '@/pages/explore/utils';
import { useYieldPage } from '../context/YieldPageContext';
import { normalize, getQuoteCurrency, normalizeExchangeName } from '../utils/yieldUtils';

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
    availabilityMap,
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
        }}
      >
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
        }}
      >
        <Typography variant='body1'>{symbol}</Typography>
      </TableCell>
      {exchanges.map((ex) => {
        const rateData = rateMap[symbol]?.[ex];
        const availability = availabilityMap?.[symbol]?.[ex] || { spot: null, perp: null };
        const spotKnown = availability.spot !== null;
        const perpKnown = availability.perp !== null;
        const hasSpot = availability.spot === true;
        const hasPerp = availability.perp === true;
        const hasBoth = hasSpot && hasPerp;
        const showFundingRate = rateData !== undefined && availability.perp !== false;
        const isClickable = Boolean(rateData) && hasBoth;
        const shouldGreyOut = (spotKnown && !hasSpot) || (perpKnown && !hasPerp);

        let textColor = 'text.disabled';
        if (showFundingRate) {
          if (shouldGreyOut) {
            textColor = 'text.disabled';
          } else if (rateData.rate > 0) {
            textColor = 'success.light';
          } else if (rateData.rate < 0) {
            textColor = 'error.main';
          } else {
            textColor = 'text.primary';
          }
        }

        const backgroundColor = showFundingRate && hasBoth ? getHeatmapColor(rateData.rate, true) : 'transparent';
        const opacity = shouldGreyOut ? 0.6 : 1;

        return (
          <TableCell
            align='center'
            key={ex}
            sx={{
              width: 160,
              height: 35,
              backgroundColor,
              padding: 0,
              transition: 'all 0.2s',
              cursor: isClickable ? 'pointer' : 'default',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity,
              '&:hover': isClickable
                ? {
                    backgroundColor: 'action.hover',
                    outline: '1px solid var(--ui-border)',
                    outlineOffset: '-1px',
                  }
                : {},
            }}
            onClick={isClickable ? () => handleFundingRateClick(symbol, ex) : undefined}
          >
            {showFundingRate ? (
              <Typography sx={{ color: textColor, lineHeight: '35px' }} variant='body1'>
                {rateData.rate > 0 ? '+' : ''}
                {smartRound(calculatePeriodRate(rateData.rate, rateData.interval, fundingRatePeriod), 3)}%
              </Typography>
            ) : (
              <Typography color='text.disabled' sx={{ lineHeight: '35px' }} variant='body1'>
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

export default function FundingRateMatrix({ fundingRates, isLoading }) {
  const [fundingRateFavorites, setFundingRateFavorites] = useAtom(fundingRateFavoritesAtom);
  const [fundingRatePeriod, setFundingRatePeriod] = useState('year');
  const [fundingRateSearch, setFundingRateSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const { accounts, selectedAccountName, setSelectedAccountName, setPendingMatrixSelection, tokenPairs } =
    useYieldPage();

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
    const normalizedExchange = normalize(exchange);
    const matchingAccounts = accounts.filter((account) => normalize(account.exchangeName) === normalizedExchange);

    if (matchingAccounts.length) {
      const activeAccount =
        matchingAccounts.find((account) => account.name === selectedAccountName) || matchingAccounts[0];

      if (activeAccount && activeAccount.name !== selectedAccountName) {
        setSelectedAccountName(activeAccount.name);
      }

      setPendingMatrixSelection({
        baseSymbol: symbol,
        exchange: activeAccount?.exchangeName || exchange,
      });
      return;
    }

    const quoteCurrency = getQuoteCurrency(exchange);
    const url = `enter_multi_order?buy=${symbol}-${quoteCurrency}@${exchange}&sell=${symbol}:PERP-${quoteCurrency}@${exchange}`;
    window.open(`/${url}`, '_blank');
  };

  const sortedFundingRateData = useMemo(() => {
    if (!fundingRates || fundingRates.length === 0) {
      return { symbols: [], rateMap: {}, exchanges: [], availabilityMap: {} };
    }

    const rateMap = {};
    const symbolSet = new Set();
    const exchangesSet = new Set();

    fundingRates.forEach(({ pair, exchange, rate, funding_rate_interval }) => {
      if (!pair || !exchange) return;
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
      .filter((ex) => ex !== 'Deribit' && ex !== 'Bitget');

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
      getSortedSymbols(filtered.others, rateMap, sortConfig, fundingRatePeriod)
    );

    const exchangePairsLookup = {};
    if (Array.isArray(tokenPairs)) {
      tokenPairs.forEach((pair) => {
        if (!pair?.id || !Array.isArray(pair.exchanges)) return;
        pair.exchanges.forEach((exchangeName) => {
          const variants = [exchangeName, normalizeExchangeName(exchangeName)];

          variants.forEach((variant) => {
            if (!variant) return;
            const base = normalize(variant);
            if (!base) return;
            const keys = new Set([base]);

            const noSpaces = base.replace(/\s+/g, '');
            if (noSpaces) keys.add(noSpaces);

            if (noSpaces.endsWith('spot')) {
              keys.add(noSpaces.replace(/spot$/, ''));
            }
            if (noSpaces.endsWith('perp')) {
              keys.add(noSpaces.replace(/perp$/, ''));
            }

            keys.forEach((key) => {
              if (!key) return;
              if (!exchangePairsLookup[key]) {
                exchangePairsLookup[key] = new Set();
              }
              exchangePairsLookup[key].add(pair.id);
            });
          });
        });
      });
    }

    const availabilityMap = symbols.reduce((acc, symbol) => {
      if (!acc[symbol]) acc[symbol] = {};
      exchanges.forEach((exchange) => {
        const normalizedExchange = normalize(exchange);
        const pairsForExchange = exchangePairsLookup[normalizedExchange];
        const hasLookup = Boolean(pairsForExchange);
        const quoteCurrency = getQuoteCurrency(exchange);
        const spotId = `${symbol}-${quoteCurrency}`;
        const perpId = `${symbol}:PERP-${quoteCurrency}`;
        const spot = hasLookup ? pairsForExchange.has(spotId) : null;
        const perp = hasLookup ? pairsForExchange.has(perpId) : null;
        acc[symbol][exchange] = { spot, perp };
      });
      return acc;
    }, {});

    return {
      symbols,
      rateMap,
      exchanges,
      availabilityMap,
    };
  }, [fundingRates, fundingRateFavorites, fundingRateSearch, sortConfig, fundingRatePeriod, tokenPairs]);

  const getItemSize = () => 35;

  if (isLoading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color='text.secondary'>Loading funding rates...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            placeholder='Search token...'
            size='small'
            sx={{ width: 150 }}
            value={fundingRateSearch}
            onChange={(e) => setFundingRateSearch(e.target.value)}
          />
          <ToggleButtonGroup exclusive size='small' value={fundingRatePeriod} onChange={handleFundingRatePeriod}>
            <ToggleButton value='day'>Day</ToggleButton>
            <ToggleButton value='week'>Week</ToggleButton>
            <ToggleButton value='month'>Month</ToggleButton>
            <ToggleButton value='year'>Year</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', width: '100%' }}>
        <Table size='small' sx={{ tableLayout: 'fixed', width: 'auto', minWidth: '100%' }}>
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
                availabilityMap: sortedFundingRateData.availabilityMap,
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
