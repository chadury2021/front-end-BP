import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  TableCell,
  TableRow,
  Popper,
  Card,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  KeyboardArrowUp,
  KeyboardArrowDown,
  KeyboardCommandKey,
  Star,
  StarBorder,
} from '@mui/icons-material';
import getBaseTokenIcon from '@images/tokens';
import ICONS from '@images/exchange_icons';
import { TokenIcon } from '@/shared/components/Icons';
import { getHeatmapColor, calculatePeriodRate } from '@/pages/explore/utils';
import { smartRound, getPairBase, getPairVariant } from '@/util';
import { useNavigate } from 'react-router-dom';
import useViewport from '@/shared/hooks/useViewport';
import { useAtom } from 'jotai';
import { useExchangeTicker } from '@/shared/context/ExchangeTickerProvider';
import MultiOrderPairSelector from '../MultiOrderPairSelector';
import { fundingRateFavoritesAtom } from '../hooks/multiOrderAtoms';

const FundingRateRow = React.memo(({ data, index, style }) => {
  const {
    symbols,
    rateMap,
    exchanges,
    fundingRateFavorites,
    setFundingRateFavorites,
    fundingRatePeriod,
    handleRateClick,
  } = data;

  const symbol = symbols[index];

  return (
    <div style={style}>
      <TableRow sx={{ display: 'flex', width: '100%' }}>
        <TableCell
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            padding: '2px 8px',
            width: 24,
            minWidth: 24,
            maxWidth: 24,
            textAlign: 'center',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <IconButton
            size='small'
            sx={{ p: 0, m: 0, height: 20, width: 20 }}
            onClick={() => setFundingRateFavorites((prev) => ({ ...prev, [symbol]: !prev[symbol] }))}
          >
            {fundingRateFavorites[symbol] ? (
              <Star sx={{ color: 'text.secondary', fontSize: 16 }} />
            ) : (
              <StarBorder sx={{ color: 'text.disabled', fontSize: 16 }} />
            )}
          </IconButton>
        </TableCell>
        <TableCell
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            padding: '2px 8px',
            width: 32,
            minWidth: 32,
            maxWidth: 32,
            textAlign: 'center',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          {symbol !== 'Portfolio' && (
            <TokenIcon style={{ width: '18px', height: '18px' }} tokenName={symbol.split('-')[0]} />
          )}
        </TableCell>
        <TableCell
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            padding: '2px 8px',
            width: 120,
            minWidth: 120,
            maxWidth: 120,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <Typography noWrap variant='body1'>
            {symbol}
          </Typography>
        </TableCell>
        {exchanges.map((exchangeName) => {
          const rateData = rateMap[symbol]?.[exchangeName];
          let color = 'text.primary';
          if (rateData?.rate > 0) color = 'success.light';
          else if (rateData?.rate < 0) color = 'error.main';

          return (
            <TableCell
              key={exchangeName}
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                cursor: rateData ? 'pointer' : 'default',
                padding: '2px 16px',
                backgroundColor: rateData ? getHeatmapColor(rateData.rate, true) : 'transparent',
                textAlign: 'center',
                opacity: rateData ? 1 : 0.5,
                '&:hover': rateData
                  ? {
                      backgroundColor: 'action.hover',
                    }
                  : {},
                pointerEvents: rateData ? 'auto' : 'none',
              }}
              onClick={() => rateData && handleRateClick(symbol, exchangeName)}
            >
              {rateData ? (
                <Typography sx={{ color }} variant='body1'>
                  {rateData.rate > 0 ? '+' : ''}
                  {smartRound(calculatePeriodRate(rateData.rate, rateData.interval, fundingRatePeriod), 3)}%
                </Typography>
              ) : (
                <Typography color='text.secondary' variant='body1'>
                  -
                </Typography>
              )}
            </TableCell>
          );
        })}
      </TableRow>
    </div>
  );
});

FundingRateRow.displayName = 'FundingRateRow';

function MultiPairInfoBar({
  pair,
  exchange,
  fundingRates,
  fundingRatesLoading,
  buyOrderItems,
  sellOrderItems,
  onPairSelect,
  tokenPairs,
  timeframe = 'day',
  setTimeframe,
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isMobile } = useViewport();
  const [anchorEl, setAnchorEl] = useState(null);
  const [virtualAnchorEl, setVirtualAnchorEl] = useState(null);
  const [fundingRatePeriod, setFundingRatePeriod] = useState('year');
  const [sortConfig, setSortConfig] = useState({ key: 'Binance', direction: 'desc' });
  const [fundingRateSearch, setFundingRateSearch] = useState('');
  const popperRef = useRef(null);
  const pairDisplayRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fundingRateFavorites, setFundingRateFavorites] = useAtom(fundingRateFavoritesAtom);
  const [spread, setSpread] = useState(null);
  const [spotVolume, setSpotVolume] = useState(null);
  const [perpVolume, setPerpVolume] = useState(null);
  const [spotPriceChange, setSpotPriceChange] = useState(null);

  const handleClick = (event) => {
    const isOpen = Boolean(anchorEl) || Boolean(virtualAnchorEl);
    if (isOpen) {
      setAnchorEl(null);
      setVirtualAnchorEl(null);
      return;
    }

    const trigger = event?.currentTarget || pairDisplayRef.current;
    if (!trigger) return;

    if (isMobile) {
      setAnchorEl(trigger);
    } else {
      const rect = trigger.getBoundingClientRect();
      const y = rect.bottom; // viewport y where we want the popper to start
      // Create a Popper virtual element anchored at the left edge of the viewport
      const virtualEl = {
        getBoundingClientRect: () => ({
          x: 0,
          y,
          top: y,
          left: 0,
          right: 0,
          bottom: y,
          width: 0,
          height: 0,
          toJSON: () => {},
        }),
      };
      setVirtualAnchorEl(virtualEl);
    }

    if (pairDisplayRef.current) {
      pairDisplayRef.current.focus();
    }
  };

  const handlePairSelect = (base, ex) => {
    onPairSelect(base, ex);
    handleClick();
  };

  const open = Boolean(anchorEl) || Boolean(virtualAnchorEl);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popperRef.current &&
        pairDisplayRef.current &&
        !popperRef.current.contains(event.target) &&
        !pairDisplayRef.current.contains(event.target)
      ) {
        setAnchorEl(null);
      }
    };

    const handleKeyDown = (event) => {
      // Command/Ctrl + K to toggle pair selector
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        handleClick();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [popperRef, open]);

  // Sync fundingRatePeriod with timeframe prop
  useEffect(() => {
    if (timeframe && timeframe !== fundingRatePeriod) {
      setFundingRatePeriod(timeframe);
    }
  }, [timeframe, fundingRatePeriod]);

  const sortedFundingRateData = useMemo(() => {
    if (!pair) return { symbols: [], rateMap: {}, exchanges: [] };

    const rateMap = {};
    const symbolSet = new Set();
    const exchangesSet = new Set();
    fundingRates.forEach(({ pair: pairId, exchange: exchangeName, rate, funding_rate_interval }) => {
      if (!rateMap[pairId]) rateMap[pairId] = {};
      rateMap[pairId][exchangeName] = {
        rate: Number(rate) || 0,
        interval: Number(funding_rate_interval) || 4,
      };
      symbolSet.add(pairId);
      exchangesSet.add(exchangeName);
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
      filtered.others.sort((a, b) => {
        if (sortConfig.key) {
          const aRate = rateMap[a]?.[sortConfig.key]?.rate || 0;
          const bRate = rateMap[b]?.[sortConfig.key]?.rate || 0;
          return sortConfig.direction === 'asc' ? aRate - bRate : bRate - aRate;
        }
        return a.localeCompare(b);
      })
    );

    return {
      symbols,
      rateMap,
      exchanges,
    };
  }, [fundingRates, pair, fundingRateSearch, sortConfig, fundingRateFavorites]);

  // Add new useEffect for keyboard navigation after sortedFundingRateData is defined
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Up/Down arrow keys when pair selector is open
      if (open && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
        event.preventDefault();
        const filteredSymbols = sortedFundingRateData.symbols;
        if (filteredSymbols.length === 0) return;

        let newIndex;
        if (event.key === 'ArrowUp') {
          newIndex = selectedIndex > 0 ? selectedIndex - 1 : filteredSymbols.length - 1;
        } else {
          newIndex = selectedIndex < filteredSymbols.length - 1 ? selectedIndex + 1 : 0;
        }
        setSelectedIndex(newIndex);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, selectedIndex, sortedFundingRateData.symbols]);

  const handleFundingRatePeriod = (event, newPeriod) => {
    if (newPeriod) {
      setFundingRatePeriod(newPeriod);
      if (setTimeframe) {
        setTimeframe(newPeriod);
      }
    }
  };

  // Determine display label and extract buyBase/sellBase early for use in hooks
  let displayLabel = 'Portfolio Trade';
  let pairDisplayIcon = null;
  let buyBase = null;
  let sellBase = null;
  let isFundingArb = false;
  let fundingArbExchange = null;
  const isPortfolio = buyOrderItems?.length > 1 || sellOrderItems?.length > 1;

  if (
    !isPortfolio &&
    buyOrderItems?.length === 1 &&
    sellOrderItems?.length === 1 &&
    buyOrderItems[0]?.pair?.id &&
    sellOrderItems[0]?.pair?.id
  ) {
    buyBase = getPairBase(buyOrderItems[0].pair.id);
    sellBase = getPairBase(sellOrderItems[0].pair.id);
    if (buyBase === sellBase) {
      const buyIsSpot = !buyOrderItems[0].pair.id.includes(':PERP');
      const sellIsPerp = sellOrderItems[0].pair.id.includes(':PERP');
      const buyIsPerp = buyOrderItems[0].pair.id.includes(':PERP');
      const sellIsSpot = !sellOrderItems[0].pair.id.includes(':PERP');
      if (isFundingArb || (buyIsPerp && sellIsPerp) || (buyIsSpot && sellIsPerp) || (buyIsPerp && sellIsSpot)) {
        isFundingArb = true;
        const buyExchange = buyOrderItems[0]?.accounts?.[0]?.exchangeName;
        const sellExchange = sellOrderItems[0]?.accounts?.[0]?.exchangeName;
        fundingArbExchange = buyExchange === sellExchange ? buyExchange : `${buyExchange}/${sellExchange}`;
      } else {
        displayLabel = buyBase;
      }
      pairDisplayIcon = getBaseTokenIcon(buyBase);
    }
  }
  if (!pairDisplayIcon && pair?.id) {
    // fallback to current pair icon if available
    const base = getPairBase(pair.id);
    pairDisplayIcon = getBaseTokenIcon(base);
  }

  if (
    buyOrderItems.length === 0 ||
    sellOrderItems.length === 0 ||
    isPortfolio ||
    buyBase !== sellBase ||
    (!buyBase && !sellBase)
  ) {
    displayLabel = (
      <Box alignItems='center' display='flex'>
        <Typography color='text.primary' sx={{ fontWeight: 600, fontSize: '1rem', marginLeft: '10px' }} variant='h6'>
          Portfolio Trade
        </Typography>
      </Box>
    );
  } else if (buyBase === sellBase) {
    const sellIsPerp = getPairVariant(sellOrderItems[0].pair.id) === 'PERP';
    const buyIsPerp = getPairVariant(buyOrderItems[0].pair.id) === 'PERP';

    if (isFundingArb || (buyIsPerp && sellIsPerp)) {
      isFundingArb = true;
      const buyExchange = buyOrderItems[0]?.accounts?.[0]?.exchangeName;
      const sellExchange = sellOrderItems[0]?.accounts?.[0]?.exchangeName;
      fundingArbExchange = buyExchange === sellExchange ? buyExchange : `${buyExchange}/${sellExchange}`;
      displayLabel = (
        <Box alignItems='center' display='flex'>
          <Typography color='text.primary' sx={{ fontWeight: 600, fontSize: '1rem' }} variant='h6'>
            {fundingArbExchange} {buyBase}
          </Typography>
          <Typography color='text.secondary' sx={{ fontWeight: 400, fontSize: '1rem', ml: 1 }} variant='h6'>
            {buyIsPerp && sellIsPerp ? 'PERP Arb' : 'Funding Arb'}
          </Typography>
        </Box>
      );
    } else {
      displayLabel = (
        <Box alignItems='center' display='flex'>
          <Typography color='text.primary' sx={{ fontWeight: 600, fontSize: '1rem' }} variant='h6'>
            {buyBase}
          </Typography>
        </Box>
      );
    }
  }

  // Helper for spread color
  const getSpreadColor = (value) => {
    if (value > 0) return 'success.light';
    if (value < 0) return 'error.main';
    return 'text.primary';
  };

  const getRateColor = (rate) => {
    if (rate > 0) return 'success.light';
    if (rate < 0) return 'error.main';
    return 'text.primary';
  };

  const shortenNumber = (value) => {
    if (value >= 10 ** 6) {
      return value / 10 ** 6;
    }
    if (value >= 10 ** 3) {
      return value / 10 ** 3;
    }
    return value;
  };

  const getUnit = (value) => {
    if (value >= 10 ** 6) {
      return 'M';
    }
    if (value >= 10 ** 3) {
      return 'K';
    }
    return '';
  };

  const { tickerData } = useExchangeTicker();

  // Update fetchPrices function
  useEffect(() => {
    let isMounted = true;
    async function fetchPrices() {
      if (buyBase && sellBase && buyBase === sellBase) {
        try {
          const spotSymbol = `${buyBase}-USDT`;
          const perpSymbol = `${buyBase}:PERP-USDT`;

          if (isMounted) {
            const spotValue = tickerData[spotSymbol]?.lastPrice;
            const perpValue = tickerData[perpSymbol]?.lastPrice;
            // Set volumes from ticker data and convert to base quantity
            const spotVol = tickerData[spotSymbol]?.volume24hNotional
              ? parseFloat(tickerData[spotSymbol].volume24hNotional) / spotValue
              : null;
            const perpVol = tickerData[perpSymbol]?.volume24hNotional
              ? parseFloat(tickerData[perpSymbol].volume24hNotional) / perpValue
              : null;
            setSpotVolume(spotVol);
            setPerpVolume(perpVol);
            // Set price change
            const priceChange = tickerData[spotSymbol]?.pricePctChange24h
              ? parseFloat(tickerData[spotSymbol].pricePctChange24h)
              : null;
            setSpotPriceChange(priceChange);
            if (spotValue != null && perpValue != null) {
              const spreadPct = ((perpValue - spotValue) / spotValue) * 100;
              setSpread(spreadPct);
            } else {
              setSpread(null);
            }
          }
        } catch (error) {
          if (isMounted) {
            setSpread(null);
            setSpotVolume(null);
            setPerpVolume(null);
            setSpotPriceChange(null);
          }
        }
      } else {
        setSpread(null);
        setSpotVolume(null);
        setPerpVolume(null);
        setSpotPriceChange(null);
      }
    }
    fetchPrices();
    return () => {
      isMounted = false;
    };
  }, [buyBase, sellBase, tickerData]);

  const isSameBase = useMemo(() => {
    if (!buyOrderItems.length || !sellOrderItems.length) return false;
    const buyBaseSymbol = getPairBase(buyOrderItems[0]?.pair?.id);
    const sellBaseSymbol = getPairBase(sellOrderItems[0]?.pair?.id);
    return buyBaseSymbol && sellBaseSymbol && buyBaseSymbol === sellBaseSymbol;
  }, [buyOrderItems, sellOrderItems]);

  const fundingRateDifference = useMemo(() => {
    if (!isSameBase || !fundingRates.length) return null;

    const getFundingRate = (orderItems) => {
      return orderItems.reduce((acc, item) => {
        const pairId = item.pair.id;
        const exchangeName = item.accounts?.[0]?.exchangeName;
        const baseToken = getPairBase(pairId);
        const fundingRate = fundingRates.find((fr) => fr.exchange_pair === `${exchangeName}#${baseToken}`);
        if (!fundingRate) return acc;
        const rate = Number(fundingRate.rate);
        const interval = Number(fundingRate.funding_rate_interval);
        const adjustedRate = calculatePeriodRate(rate, interval, fundingRatePeriod);
        return acc + adjustedRate;
      }, 0);
    };

    // Check if this is a PERP/PERP arbitrage
    const isPerpPerpArb =
      getPairVariant(buyOrderItems[0]?.pair?.id) === 'PERP' && getPairVariant(sellOrderItems[0]?.pair?.id) === 'PERP';

    if (isPerpPerpArb) {
      // For PERP/PERP, show the difference
      const buyFundingRate = getFundingRate(buyOrderItems);
      const sellFundingRate = getFundingRate(sellOrderItems);
      return sellFundingRate - buyFundingRate;
    }
    // For funding arb (SPOT/PERP or PERP/SPOT), show just the PERP's funding rate
    const perpOrder = getPairVariant(buyOrderItems[0]?.pair?.id) === 'PERP' ? buyOrderItems : sellOrderItems;
    return getFundingRate(perpOrder);
  }, [isSameBase, buyOrderItems, sellOrderItems, fundingRates, fundingRatePeriod]);

  if (!pair) return null;

  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  return (
    <Card
      sx={{
        height: '40px',
        boxShadow: 1,
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        minWidth: 0,
        py: 1,
      }}
    >
      <Box
        display='flex'
        flexDirection='row'
        gap={2}
        height='100%'
        sx={{
          overflowX: 'auto',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          '-ms-overflow-style': 'none',
          backgroundColor: 'transparent',
          minHeight: '30px',
          p: 0,
          width: '100%',
          justifyContent: 'space-between',
        }}
      >
        <Box alignItems='center' display='flex' gap={2}>
          {pairDisplayIcon && !isPortfolio && (
            <Box alignItems='center' display='flex' paddingX='8px' position='relative'>
              <img alt='Token Icon' src={pairDisplayIcon} style={{ height: '30px', width: '30px' }} />
              {fundingArbExchange && (
                <Box alignItems='center' bottom={0} display='flex' position='absolute' right={0}>
                  {fundingArbExchange.includes('/') ? (
                    <Box position='relative' sx={{ width: '20px', height: '15px' }}>
                      <img
                        alt={fundingArbExchange.split('/')[0]}
                        src={ICONS[fundingArbExchange.split('/')[0].toLowerCase()]}
                        style={{
                          height: '15px',
                          width: '15px',
                          borderRadius: '50%',
                          position: 'absolute',
                          right: '0',
                          zIndex: 1,
                        }}
                      />
                      <img
                        alt={fundingArbExchange.split('/')[1]}
                        src={ICONS[fundingArbExchange.split('/')[1].toLowerCase()]}
                        style={{
                          height: '15px',
                          width: '15px',
                          borderRadius: '50%',
                          position: 'absolute',
                          right: '8px',
                          zIndex: 2,
                        }}
                      />
                    </Box>
                  ) : (
                    <img
                      alt={fundingArbExchange}
                      src={ICONS[fundingArbExchange.toLowerCase()]}
                      style={{ height: '15px', width: '15px', borderRadius: '50%' }}
                    />
                  )}
                </Box>
              )}
            </Box>
          )}
          <Stack
            alignItems='center'
            direction='row'
            ref={pairDisplayRef}
            spacing={1}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              },
            }}
            tabIndex={0}
            onClick={handleClick}
          >
            {displayLabel}
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            {!isMobile && (
              <Typography
                color='grey'
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid',
                  borderRadius: '4px',
                  padding: '1px',
                  ml: 1,
                }}
                variant='small1'
              >
                {isMac ? <KeyboardCommandKey sx={{ fontSize: 'inherit' }} /> : 'Ctrl+'}K
              </Typography>
            )}
          </Stack>
        </Box>

        <Stack alignItems='center' direction='row' flexGrow={1} gap={4} justifyContent='start'>
          {isSameBase && fundingRateDifference !== null && !isPortfolio && (
            <Box
              alignItems='center'
              alignSelf='center'
              display='flex'
              gap={2}
              paddingX='10px'
              sx={{
                overflowX: 'auto',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                '-ms-overflow-style': 'none',
                minWidth: 0,
                flex: 1,
              }}
            >
              <Typography
                color={getRateColor(fundingRateDifference)}
                fontFamily={theme.typography.fontFamilyConfig.data} // Use IBM Plex Mono for data
                sx={{ pr: 3, whiteSpace: 'nowrap' }}
                textAlign='left'
                variant='h3'
              >
                {fundingRateDifference > 0 ? '+' : ''}
                {smartRound(fundingRateDifference, 3)}%
              </Typography>
              {/* Only show funding rate details for PERP/PERP arb with same base */}
              {buyOrderItems[0]?.pair?.id?.includes(':PERP') &&
                sellOrderItems[0]?.pair?.id?.includes(':PERP') &&
                isSameBase && (
                  <>
                    {/* Buy Funding Rate display */}
                    <Tooltip title='Buy Funding Rate'>
                      <Box
                        display='flex'
                        flexDirection='column'
                        flexGrow='0'
                        sx={{ px: 2, py: 2, whiteSpace: 'nowrap' }}
                      >
                        <Typography
                          color='grey.main'
                          sx={{
                            textDecoration: 'underline dotted',
                            textDecorationThickness: '2px',
                            textUnderlineOffset: '2px',
                          }}
                          textAlign='left'
                          textOverflow='ellipsis'
                          variant='body2'
                          whiteSpace='nowrap'
                        >
                          Buy Funding
                        </Typography>
                        <Typography
                          color={getRateColor(
                            buyOrderItems
                              .map((item) => {
                                const pairId = item.pair.id;
                                const exchangeName = item.accounts?.[0]?.exchangeName;
                                const baseToken = pairId.split(':')[0].split('-')[0];
                                const fundingRate = fundingRates.find(
                                  (fr) => fr.exchange_pair === `${exchangeName}#${baseToken}`
                                );
                                if (!fundingRate) return 0;
                                const rate = -1 * Number(fundingRate.rate);
                                const interval = Number(fundingRate.funding_rate_interval);
                                const adjustedRate = calculatePeriodRate(rate, interval, fundingRatePeriod);
                                return adjustedRate;
                              })
                              .reduce((a, b) => a + b, 0)
                          )}
                          fontFamily={theme.typography.fontFamilyConfig.data} // Use IBM Plex Mono for data
                          sx={{
                            paddingRight: '15px',
                          }}
                          textAlign='left'
                          variant='body1'
                        >
                          {buyOrderItems
                            .map((item) => {
                              const pairId = item.pair.id;
                              const exchangeName = item.accounts?.[0]?.exchangeName;
                              const baseToken = pairId.split(':')[0].split('-')[0];
                              const fundingRate = fundingRates.find(
                                (fr) => fr.exchange_pair === `${exchangeName}#${baseToken}`
                              );
                              if (!fundingRate) return '0.0000';
                              const rate = -1 * Number(fundingRate.rate);
                              const interval = Number(fundingRate.funding_rate_interval);
                              const adjustedRate = calculatePeriodRate(rate, interval, fundingRatePeriod);
                              return (adjustedRate > 0 ? '+' : '') + adjustedRate.toFixed(4);
                            })
                            .join(', ')}
                          %
                        </Typography>
                      </Box>
                    </Tooltip>
                    {/* Sell Funding Rate display */}
                    <Tooltip title='Sell Funding Rate'>
                      <Box
                        display='flex'
                        flexDirection='column'
                        flexGrow='0'
                        sx={{ px: 2, py: 2, whiteSpace: 'nowrap' }}
                      >
                        <Typography
                          color='grey.main'
                          sx={{
                            textDecoration: 'underline dotted',
                            textDecorationThickness: '2px',
                            textUnderlineOffset: '2px',
                          }}
                          textAlign='left'
                          textOverflow='ellipsis'
                          variant='body2'
                          whiteSpace='nowrap'
                        >
                          Sell Funding
                        </Typography>
                        <Typography
                          color={getRateColor(
                            sellOrderItems
                              .map((item) => {
                                const pairId = item.pair.id;
                                const exchangeName = item.accounts?.[0]?.exchangeName;
                                const baseToken = pairId.split(':')[0].split('-')[0];
                                const fundingRate = fundingRates.find(
                                  (fr) => fr.exchange_pair === `${exchangeName}#${baseToken}`
                                );
                                if (!fundingRate) return 0;
                                const rate = Number(fundingRate.rate);
                                const interval = Number(fundingRate.funding_rate_interval);
                                const adjustedRate = calculatePeriodRate(rate, interval, fundingRatePeriod);
                                return adjustedRate;
                              })
                              .reduce((a, b) => a + b, 0)
                          )}
                          fontFamily={theme.typography.fontFamilyConfig.data} // Use IBM Plex Mono for data
                          sx={{
                            paddingRight: '15px',
                          }}
                          textAlign='left'
                          variant='body1'
                        >
                          {sellOrderItems
                            .map((item) => {
                              const pairId = item.pair.id;
                              const exchangeName = item.accounts?.[0]?.exchangeName;
                              const baseToken = pairId.split(':')[0].split('-')[0];
                              const fundingRate = fundingRates.find(
                                (fr) => fr.exchange_pair === `${exchangeName}#${baseToken}`
                              );
                              if (!fundingRate) return '0.0000';
                              const rate = Number(fundingRate.rate);
                              const interval = Number(fundingRate.funding_rate_interval);
                              const adjustedRate = calculatePeriodRate(rate, interval, fundingRatePeriod);
                              return (adjustedRate > 0 ? '+' : '') + adjustedRate.toFixed(4);
                            })
                            .join(', ')}
                          %
                        </Typography>
                      </Box>
                    </Tooltip>
                  </>
                )}

              {/* Spread and Funding Rate display */}
              {spread !== null && (
                <Tooltip title='Price spread between SPOT and PERP legs'>
                  <Box display='flex' flexDirection='column' flexGrow='0' sx={{ px: 2, py: 2, whiteSpace: 'nowrap' }}>
                    <Typography
                      color='grey.main'
                      sx={{
                        textDecoration: 'underline dotted',
                        textDecorationThickness: '2px',
                        textUnderlineOffset: '2px',
                      }}
                      textAlign='left'
                      textOverflow='ellipsis'
                      variant='body2'
                      whiteSpace='nowrap'
                    >
                      Spread
                    </Typography>
                    <Stack direction='row' spacing={1}>
                      <Typography
                        color={getSpreadColor(spread)}
                        fontFamily={theme.typography.fontFamilyConfig.data} // Use IBM Plex Mono for data
                        sx={{
                          paddingRight: '15px',
                        }}
                        textAlign='left'
                        variant='body1'
                      >
                        {`${spread > 0 ? '+' : ''}${smartRound(spread, 3)}%`}
                      </Typography>
                    </Stack>
                  </Box>
                </Tooltip>
              )}
              {/* SPOT Volume display */}
              {spotVolume !== null && (
                <Tooltip title={`24H ${buyOrderItems[0]?.accounts?.[0]?.exchangeName} Volume`}>
                  <Box display='flex' flexDirection='column' flexGrow='0' sx={{ px: 2, py: 2, whiteSpace: 'nowrap' }}>
                    <Typography
                      color='grey.main'
                      sx={{
                        textDecoration: 'underline dotted',
                        textDecorationThickness: '2px',
                        textUnderlineOffset: '2px',
                      }}
                      textAlign='left'
                      textOverflow='ellipsis'
                      variant='body2'
                      whiteSpace='nowrap'
                    >
                      24H {buyOrderItems[0]?.accounts?.[0]?.exchangeName} Volume
                    </Typography>
                    <Typography
                      color='info.main'
                      fontFamily={theme.typography.fontFamilyConfig.data} // Use IBM Plex Mono for data
                      sx={{
                        paddingRight: '15px',
                      }}
                      textAlign='left'
                      variant='body1'
                    >
                      {shortenNumber(spotVolume).toFixed(2)}
                      {getUnit(spotVolume)} {buyBase}
                    </Typography>
                  </Box>
                </Tooltip>
              )}
              {/* PERP Volume display */}
              {perpVolume !== null && (
                <Tooltip title={`24H ${sellOrderItems[0]?.accounts?.[0]?.exchangeName} Volume`}>
                  <Box display='flex' flexDirection='column' flexGrow='0' sx={{ px: 2, py: 2, whiteSpace: 'nowrap' }}>
                    <Typography
                      color='grey.main'
                      sx={{
                        textDecoration: 'underline dotted',
                        textDecorationThickness: '2px',
                        textUnderlineOffset: '2px',
                      }}
                      textAlign='left'
                      textOverflow='ellipsis'
                      variant='body2'
                      whiteSpace='nowrap'
                    >
                      24H {sellOrderItems[0]?.accounts?.[0]?.exchangeName} Volume
                    </Typography>
                    <Typography
                      color='info.main'
                      fontFamily={theme.typography.fontFamilyConfig.data} // Use IBM Plex Mono for data
                      sx={{
                        paddingRight: '15px',
                      }}
                      textAlign='left'
                      variant='body1'
                    >
                      {shortenNumber(perpVolume).toFixed(2)}
                      {getUnit(perpVolume)} {buyBase}
                    </Typography>
                  </Box>
                </Tooltip>
              )}
            </Box>
          )}
        </Stack>

        {/* Period selector moved to the right */}
        <Box sx={{ display: 'flex', alignItems: 'center', pr: 2 }}>
          <ToggleButtonGroup
            exclusive
            color='primary'
            size='small'
            value={timeframe}
            onChange={handleFundingRatePeriod}
          >
            <ToggleButton value='day'>Day</ToggleButton>
            <ToggleButton value='week'>Week</ToggleButton>
            <ToggleButton value='month'>Month</ToggleButton>
            <ToggleButton value='year'>Year</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Popper
          anchorEl={isMobile ? anchorEl : virtualAnchorEl}
          open={open}
          placement='top-start'
          ref={popperRef}
          sx={{
            zIndex: 9999,
            overflow: 'hidden',
            width: isMobile ? '100%' : 'auto',
            left: isMobile ? 0 : 'auto',
            right: isMobile ? 0 : 'auto',
            '& .MuiPaper-root': {
              backgroundColor: 'transparent !important',
              boxShadow: 'none !important',
              border: 'none !important',
              outline: 'none !important',
              borderRadius: 0,
            },
          }}
        >
          <Paper
            square
            elevation={0}
            sx={{
              width: isMobile ? '100%' : 850,
              height: isMobile ? '80vh' : 650,
              maxWidth: '100vw',
              maxHeight: '100vh',
              backgroundColor: 'transparent',
              boxShadow: 'none',
              border: 'none',
              outline: 'none',
              borderRadius: 0,
            }}
            variant='elevation'
          >
            <Box sx={{ height: '100%', width: '100%' }}>
              <MultiOrderPairSelector
                fundingRates={fundingRates}
                tickerData={tickerData}
                tokenPairs={tokenPairs}
                onPairSelect={handlePairSelect}
              />
            </Box>
          </Paper>
        </Popper>
      </Box>
    </Card>
  );
}

export default MultiPairInfoBar;
