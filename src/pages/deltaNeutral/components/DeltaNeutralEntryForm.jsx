import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import {
  Alert,
  Paper,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Tooltip,
  styled,
  Popper,
  Box,
  CircularProgress,
  Divider,
  Portal,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { NumericFormatCustom } from '@/shared/fields/NumberFieldFormat';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { useAccountBalanceContext } from '@/pages/dashboard/orderEntry/AccountBalanceContext';
import MarketMakerConfiguration from '@/pages/marketMaker/components/MarketMakerConfiguration';
import { TokenIcon, ExchangeIcon } from '@/shared/components/Icons';
import {
  ExpandMore as ExpandMoreIcon,
  Search,
  ArrowUpward,
  ArrowDownward,
  SwapHoriz as SwapHorizIcon,
} from '@mui/icons-material';
import { getPairBase, getPairVariant } from '@/util';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';
import { debounce } from 'lodash';
import { isolatedHolographicStyles } from '@/theme/holographicEffects';
import { useLeverage, LeverageChip } from '@/shared/components/LeverageChip';
import { getFundingRates } from '@/apiServices';
import useViewport from '@/shared/hooks/useViewport';
import DeltaNeutralPreTradeAnalytics from './DeltaNeutralPreTradeAnalytics';
import useDeltaNeutralForm from '../hooks/useDeltaNeutralForm';

const currencyFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCurrency = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '0.00';
  return currencyFormatter.format(numericValue);
};

const HoloPairRow = styled(Stack)(({ theme }) => ({
  ...isolatedHolographicStyles(theme),
  margin: 0,
  borderRadius: 0,
  overflow: 'hidden',
  '&:hover': {
    ...isolatedHolographicStyles(theme)['&:hover'],
    backgroundColor: 'text.offBlack',
  },
  '&::before': {
    ...isolatedHolographicStyles(theme)['&::before'],
    transition: 'transform 0.6s ease 0.1s',
    borderRadius: 0,
  },
  '&::after': {
    ...isolatedHolographicStyles(theme)['&::after'],
    transition: 'opacity 0.3s ease 0.1s',
    borderRadius: 0,
  },
  '&:hover::before': {
    transform: 'translateX(200%)',
  },
  '&:hover::after': {
    opacity: 0.12,
    animation: 'holographic-shimmer 5s ease-in-out 0.1s forwards',
  },
}));

const MARKET_TYPE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'spot', label: 'Spot' },
  { value: 'perp', label: 'Perps' },
];

function PairRow({ index, style, data }) {
  const { pairs, onSelectPair, fundingRates } = data;
  const pair = pairs[index];
  const lastPrice = pair?.ticker?.lastPrice;

  const isPerpMarket = getPairVariant(pair.id) === 'PERP';

  // Get funding rate for this pair (only relevant for perpetual contracts)
  let fundingRate = null;
  if (isPerpMarket) {
    const basePairName = getPairBase(pair.id);
    const fundingRateData = fundingRates?.find((rate) => rate.pair === basePairName);
    const rawFundingRate = fundingRateData?.rate;
    // For long positions, invert the sign (longs pay when funding is positive)
    fundingRate = rawFundingRate !== null && rawFundingRate !== undefined ? -Number(rawFundingRate) : null;
  }

  return (
    <Box style={{ ...style, borderRadius: 0, overflow: 'hidden', margin: 0 }}>
      <HoloPairRow
        alignItems='center'
        direction='row'
        justifyContent='space-between'
        sx={{ cursor: 'pointer', height: 'inherit', px: 3.75 }}
        onClick={() => onSelectPair(pair.id)}
      >
        <Stack alignItems='center' direction='row' spacing={1}>
          <TokenIcon style={{ height: '34px', width: '34px' }} tokenName={pair.id} />
          <Stack direction='column' spacing={0.5}>
            <Typography
              sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              variant='body1'
            >
              {pair.id}
            </Typography>
            <Typography color='text.secondary' variant='body2'>
              {lastPrice ?? '-'}
            </Typography>
          </Stack>
        </Stack>

        {isPerpMarket && (
          <Stack alignItems='flex-end' direction='column' spacing={0}>
            <Typography color='text.secondary' variant='body2'>
              Funding Rate (Long)
            </Typography>
            <Typography
              sx={{
                color: (() => {
                  if (fundingRate === null || fundingRate === 0) return 'text.primary';
                  return fundingRate > 0 ? 'success.main' : 'error.main';
                })(),
              }}
              variant='body2'
            >
              {fundingRate !== null ? `${fundingRate.toFixed(4)}%` : '-'}
            </Typography>
          </Stack>
        )}
      </HoloPairRow>
    </Box>
  );
}

function MarketMakerPairSelector({ pair, pairs, onSelectPair, onOpenChange, account, fundingRates }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmedSearchQuery, setConfirmedSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc' for funding rate
  const [marketTypeFilter, setMarketTypeFilter] = useState('all');
  const popperRef = useRef(null);
  const triggerRef = useRef(null);

  const open = Boolean(anchorEl);
  const dropdownWidth = triggerRef.current ? triggerRef.current.offsetWidth : undefined;

  // Filter funding rates by the selected account's exchange
  const filteredFundingRates = useMemo(() => {
    if (!account || !account.exchangeName) {
      return []; // Don't show any funding rates if no account is selected
    }
    return fundingRates.filter((rate) => rate.exchange?.toLowerCase() === account.exchangeName?.toLowerCase());
  }, [fundingRates, account]);

  const handleOpen = useCallback(
    (e) => {
      if (anchorEl) {
        setAnchorEl(null);
        return;
      }
      setAnchorEl(e.currentTarget);
    },
    [anchorEl]
  );

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectPair = (pairId) => {
    onSelectPair(pairId);
    handleClose();
  };

  const debouncedHandleSearchChange = useCallback(
    debounce((event) => {
      setConfirmedSearchQuery(event.target.value);
    }, 1000),
    []
  );

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    debouncedHandleSearchChange(event);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popperRef.current &&
        !popperRef.current.contains(event.target) &&
        !triggerRef.current.contains(event.target)
      ) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [popperRef]);

  useEffect(() => {
    if (open) {
      onOpenChange(open);
    }
  }, [open]);

  const filteredPairs = useMemo(() => {
    let tradingPairs = [...pairs];
    if (confirmedSearchQuery) {
      tradingPairs = tradingPairs.filter((p) => p.id.toLowerCase().includes(confirmedSearchQuery.toLowerCase()));
    }

    if (marketTypeFilter !== 'all') {
      tradingPairs = tradingPairs.filter((p) => p.market_type === marketTypeFilter);
    }

    // Sort by funding rate
    tradingPairs.sort((a, b) => {
      const basePairNameA = getPairBase(a.id);
      const basePairNameB = getPairBase(b.id);
      const fundingRateA = fundingRates?.find((rate) => rate.pair === basePairNameA);
      const fundingRateB = fundingRates?.find((rate) => rate.pair === basePairNameB);
      const rateA = fundingRateA?.rate !== null && fundingRateA?.rate !== undefined ? Number(fundingRateA.rate) : 0;
      const rateB = fundingRateB?.rate !== null && fundingRateB?.rate !== undefined ? Number(fundingRateB.rate) : 0;
      return sortOrder === 'desc' ? rateB - rateA : rateA - rateB;
    });

    return tradingPairs;
  }, [pairs, confirmedSearchQuery, fundingRates, sortOrder, marketTypeFilter]);

  return (
    <>
      <Stack
        alignItems='center'
        direction='row'
        ref={triggerRef}
        spacing={1}
        sx={{
          p: 2,
          width: '120%',
          borderRadius: '50px',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
        }}
        onClick={handleOpen}
      >
        <TokenIcon style={{ width: 24, height: 24 }} tokenName={pair} />
        <Typography variant='subtitle1'>{pair || 'Select Pair'}</Typography>
        <ExpandMoreIcon />
      </Stack>
      <Popper
        anchorEl={anchorEl}
        open={open}
        placement='bottom'
        ref={popperRef}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
        onClose={handleClose}
      >
        <Paper
          elevation={0}
          sx={{
            width: dropdownWidth,
            backgroundColor: `background.container40`,
            backdropFilter: 'blur(15px)',
            borderRadius: 0,
            border: 'none',
          }}
        >
          <Stack direction='column'>
            <Box sx={{ p: 2 }}>
              <Stack alignItems='center' direction='row' spacing={1}>
                <TextField
                  fullWidth
                  autoComplete='off'
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Search sx={{ color: 'grey' }} />
                      </InputAdornment>
                    ),
                  }}
                  placeholder='Search'
                  size='small'
                  value={searchQuery}
                  variant='outlined'
                  onChange={handleSearchChange}
                />
                <Tooltip
                  PopperProps={{ style: { zIndex: 10000 } }}
                  title={
                    sortOrder === 'desc' ? 'Sort by funding rate (high to low)' : 'Sort by funding rate (low to high)'
                  }
                >
                  <Button
                    size='small'
                    sx={{ minWidth: 'auto', px: 1.5 }}
                    variant='outlined'
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  >
                    {sortOrder === 'desc' ? <ArrowDownward fontSize='small' /> : <ArrowUpward fontSize='small' />}
                  </Button>
                </Tooltip>
              </Stack>
            </Box>
            <Box sx={{ px: 2, pb: 1 }}>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size='small'
                value={marketTypeFilter}
                onChange={(_, value) => {
                  if (value) setMarketTypeFilter(value);
                }}
              >
                {MARKET_TYPE_FILTERS.map((filter) => (
                  <ToggleButton key={filter.value} sx={{ textTransform: 'none', flex: 1 }} value={filter.value}>
                    {filter.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
            <Divider />
            <Box sx={{ position: 'relative', height: '400px', py: 0 }}>
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    itemCount={filteredPairs.length}
                    itemData={{
                      pairs: filteredPairs,
                      onSelectPair: handleSelectPair,
                      fundingRates: filteredFundingRates,
                    }}
                    itemSize={() => 60}
                    width={width}
                  >
                    {PairRow}
                  </List>
                )}
              </AutoSizer>
            </Box>
          </Stack>
        </Paper>
      </Popper>
    </>
  );
}

function MarketMaketAccountSelector({ account, onSelectAccount, accounts }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const popperRef = useRef(null);
  const triggerRef = useRef(null);
  const containerRef = useRef(null);
  const open = Boolean(anchorEl);

  const handleOpen = useCallback(() => {
    if (anchorEl) {
      setAnchorEl(null);
      return;
    }
    setAnchorEl(containerRef.current);
  }, [anchorEl]);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelectAccount = (a) => {
    onSelectAccount(a);
    // Ensure the visible field remains in view and is focused on mobile after selection
    requestAnimationFrame(() => {
      try {
        if (containerRef.current) {
          containerRef.current.focus?.();
          containerRef.current.scrollIntoView?.({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      } catch (_) {
        // no-op
      }
    });
    handleClose();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popperRef.current &&
        !popperRef.current.contains(event.target) &&
        !triggerRef.current.contains(event.target)
      ) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [popperRef]);

  const dropdownWidth = containerRef.current ? containerRef.current.offsetWidth : undefined;

  const accountList = useMemo(() => (Array.isArray(accounts) ? accounts : Object.values(accounts || {})), [accounts]);

  return (
    <Paper
      elevation={1}
      ref={containerRef}
      sx={{
        p: 2,
        pr: 3,
        cursor: 'pointer',
        overflow: 'hidden',
        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
        backgroundColor: 'rgba(10, 12, 24, 0.45)',
        backdropFilter: 'blur(15px)',
      }}
      tabIndex={-1}
      onClick={handleOpen}
    >
      <Stack alignItems='center' direction='row' ref={triggerRef} spacing={1} sx={{ width: '100%', maxWidth: '100%' }}>
        {account ? (
          <>
            <ExchangeIcon exchangeName={account.exchangeName} style={{ height: '25px', width: '25px' }} />
            <Typography
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
              variant='body1'
            >
              {account.name}
            </Typography>
          </>
        ) : (
          <Box sx={{ height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <Typography textAlign='center' variant='subtitle2'>
              Select Account
            </Typography>
          </Box>
        )}
      </Stack>
      <Popper anchorEl={anchorEl} open={open} placement='bottom-start' ref={popperRef} sx={{ zIndex: 9999 }}>
        <Paper
          elevation={0}
          sx={{
            width: dropdownWidth,
            backgroundColor: `background.container40`,
            backdropFilter: 'blur(15px)',
            borderRadius: 0,
            border: 'none',
          }}
        >
          <Stack direction='column'>
            {accountList.map((a) => (
              <HoloPairRow
                alignItems='center'
                direction='row'
                key={a.id}
                spacing={1.5}
                sx={{ cursor: 'pointer', height: '40px', px: 3.75 }}
                onClick={() => handleSelectAccount(a)}
              >
                <ExchangeIcon exchangeName={a.exchangeName} style={{ height: '25px', width: '25px' }} />
                <Typography
                  sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  variant='body1'
                >
                  {a.name}
                </Typography>
              </HoloPairRow>
            ))}
          </Stack>
        </Paper>
      </Popper>
    </Paper>
  );
}

export default function DeltaNeutralEntryForm({ activeOrders = [] }) {
  const { isMobile } = useViewport();
  const { initialLoadValue } = useOrderForm();
  const {
    longAccount,
    setLongAccount,
    shortAccount,
    setShortAccount,
    longPair,
    setLongPair,
    shortPair,
    setShortPair,
    notional,
    setNotional,
    notionalError,
    mode,
    setMode,
    perLegNotional,
    tradeablePairsLong,
    tradeablePairsShort,
    tradableAccounts,
    tradeableModes,
    combinedEstimatedFees,
    longFees,
    shortFees,
    longPovRate,
    shortPovRate,
    derivedDurationMinutes,
    derivedPassiveness,
    canSubmit,
    isSubmitting,
    handleSubmit,
    handleSwapAccountsAndPairs,
    swapPending,
    longExceedsVolumeLimit,
    shortExceedsVolumeLimit,
    exceedsVolumeLimit,
  } = useDeltaNeutralForm();

  // Fetch funding rates for both legs
  const [fundingRates, setFundingRates] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchFundingRates = async () => {
      try {
        const data = await getFundingRates();
        if (!isMounted) return;
        setFundingRates(Array.isArray(data) ? data : []);
      } catch {
        if (!isMounted) return;
        setFundingRates([]);
      }
    };

    // Fetch immediately on mount so funding data is available without delay
    fetchFundingRates();

    const interval = setInterval(fetchFundingRates, 30000); // Refresh every 30 seconds
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const { calculateMarginBalance, calculateAssetBalance, balances } = useAccountBalanceContext();

  const currentPairLong = useMemo(
    () => tradeablePairsLong.find((p) => p.id === longPair),
    [tradeablePairsLong, longPair]
  );
  const currentPairShort = useMemo(
    () => tradeablePairsShort.find((p) => p.id === shortPair),
    [tradeablePairsShort, shortPair]
  );
  const {
    leverage: longLeverage,
    adjustLeverage: adjustLongLeverage,
    maxLeverage: longMaxLeverage,
    exchange: longExchange,
  } = useLeverage({ pair: currentPairLong, account: longAccount });
  const {
    leverage: shortLeverage,
    adjustLeverage: adjustShortLeverage,
    maxLeverage: shortMaxLeverage,
    exchange: shortExchange,
  } = useLeverage({ pair: currentPairShort, account: shortAccount });

  const quoteSymbolLong = useMemo(() => {
    const pairObj = tradeablePairsLong.find((p) => p.id === longPair);
    if (pairObj?.quote) return pairObj.quote;
    // Fallback parsing
    const id = longPair || '';
    const lastSep = Math.max(id.lastIndexOf('-'), id.lastIndexOf(':'));
    if (lastSep >= 0) return id.substring(lastSep + 1);
    return 'USDT';
  }, [longPair, tradeablePairsLong]);

  const quoteSymbolShort = useMemo(() => {
    const pairObj = tradeablePairsShort.find((p) => p.id === shortPair);
    if (pairObj?.quote) return pairObj.quote;
    // Fallback parsing
    const id = shortPair || '';
    const lastSep = Math.max(id.lastIndexOf('-'), id.lastIndexOf(':'));
    if (lastSep >= 0) return id.substring(lastSep + 1);
    return 'USDT';
  }, [shortPair, tradeablePairsShort]);

  const availableLongMargin = useMemo(() => {
    try {
      if (!longAccount || !longPair || !initialLoadValue?.accounts) {
        return null;
      }
      const selectedPairObj = tradeablePairsLong.find((p) => p.id === longPair);

      const marginBal = calculateMarginBalance(quoteSymbolLong, {
        selectedAccounts: [longAccount.name],
        selectedPair: selectedPairObj,
        accounts: initialLoadValue.accounts,
      });

      if (marginBal && marginBal > 0) return marginBal;

      const assetBal = calculateAssetBalance(quoteSymbolLong, {
        selectedAccounts: [longAccount.name],
        selectedPair: selectedPairObj,
        accounts: initialLoadValue.accounts,
      });
      return assetBal || 0;
    } catch (e) {
      return null;
    }
  }, [
    longAccount,
    longPair,
    quoteSymbolLong,
    tradeablePairsLong,
    initialLoadValue,
    calculateMarginBalance,
    calculateAssetBalance,
    balances,
  ]);

  const availableShortMargin = useMemo(() => {
    try {
      if (!shortAccount || !shortPair || !initialLoadValue?.accounts) {
        return null;
      }
      const selectedPairObj = tradeablePairsShort.find((p) => p.id === shortPair);

      const marginBal = calculateMarginBalance(quoteSymbolShort, {
        selectedAccounts: [shortAccount.name],
        selectedPair: selectedPairObj,
        accounts: initialLoadValue.accounts,
      });

      if (marginBal && marginBal > 0) return marginBal;

      const assetBal = calculateAssetBalance(quoteSymbolShort, {
        selectedAccounts: [shortAccount.name],
        selectedPair: selectedPairObj,
        accounts: initialLoadValue.accounts,
      });
      return assetBal || 0;
    } catch (e) {
      return null;
    }
  }, [
    shortAccount,
    shortPair,
    quoteSymbolShort,
    tradeablePairsShort,
    initialLoadValue,
    calculateMarginBalance,
    calculateAssetBalance,
    balances,
  ]);

  const leveragedAvailableLongMargin = useMemo(() => {
    if (availableLongMargin == null) return null;
    const leverageValue = Number(longLeverage?.leverage);
    if (!Number.isFinite(leverageValue) || leverageValue <= 0) return availableLongMargin;
    return availableLongMargin * leverageValue;
  }, [availableLongMargin, longLeverage]);

  const leveragedAvailableShortMargin = useMemo(() => {
    if (availableShortMargin == null) return null;
    const leverageValue = Number(shortLeverage?.leverage);
    if (!Number.isFinite(leverageValue) || leverageValue <= 0) return availableShortMargin;
    return availableShortMargin * leverageValue;
  }, [availableShortMargin, shortLeverage]);

  const insufficientMarginLegs = useMemo(() => {
    if (!Number.isFinite(perLegNotional) || perLegNotional <= 0) {
      return [];
    }

    const legs = [];

    if (
      longAccount &&
      longPair &&
      Number.isFinite(leveragedAvailableLongMargin) &&
      leveragedAvailableLongMargin + 1e-6 < perLegNotional
    ) {
      legs.push({
        key: 'long',
        label: 'Long leg',
        available: leveragedAvailableLongMargin,
        required: perLegNotional,
      });
    }

    if (
      shortAccount &&
      shortPair &&
      Number.isFinite(leveragedAvailableShortMargin) &&
      leveragedAvailableShortMargin + 1e-6 < perLegNotional
    ) {
      legs.push({
        key: 'short',
        label: 'Short leg',
        available: leveragedAvailableShortMargin,
        required: perLegNotional,
      });
    }

    return legs;
  }, [
    perLegNotional,
    longAccount,
    longPair,
    shortAccount,
    shortPair,
    leveragedAvailableLongMargin,
    leveragedAvailableShortMargin,
  ]);

  const isHighLeverageSelected = useMemo(() => {
    const longValue = Number(longLeverage?.leverage);
    const shortValue = Number(shortLeverage?.leverage);
    const longHigh = Number.isFinite(longValue) && longValue > 10;
    const shortHigh = Number.isFinite(shortValue) && shortValue > 10;
    return longHigh || shortHigh;
  }, [longLeverage?.leverage, shortLeverage?.leverage]);

  const highLeverageWarningContent = useMemo(() => {
    if (!isHighLeverageSelected) return null;
    return (
      <Alert
        severity='warning'
        sx={{ borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}
        variant='outlined'
      >
        <Typography variant='body2'>
          Please mind margin health on the exchange as the delta neutral bot does not auto-unwind low margin positions
          yet.
        </Typography>
      </Alert>
    );
  }, [isHighLeverageSelected]);

  const marginWarningContent = useMemo(() => {
    if (insufficientMarginLegs.length === 0) return null;

    return (
      <Alert
        severity='error'
        sx={{ borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}
        variant='outlined'
      >
        <Stack direction='column' spacing={0.5}>
          {insufficientMarginLegs.map((leg) => (
            <Typography key={leg.key} variant='body2'>
              {`${leg.label}: requires $${formatCurrency(leg.required)} but only $${formatCurrency(
                leg.available
              )} available.`}
            </Typography>
          ))}
          <Typography variant='body2'>
            Reduce notional, adjust leverage, or add funds before starting the bot.
          </Typography>
        </Stack>
      </Alert>
    );
  }, [insufficientMarginLegs]);

  // Check if volume warning should be shown (only if volume is not empty)
  const showVolumeWarning = useMemo(() => {
    return Boolean(exceedsVolumeLimit && perLegNotional && (longPair || shortPair) && notional);
  }, [exceedsVolumeLimit, perLegNotional, longPair, shortPair, notional]);

  const volumeWarningContent = useMemo(() => {
    if (!showVolumeWarning) return null;

    const warnings = [];
    if (longExceedsVolumeLimit) {
      warnings.push('Long leg');
    }
    if (shortExceedsVolumeLimit) {
      warnings.push('Short leg');
    }

    return (
      <Alert
        severity='error'
        sx={{ borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}
        variant='outlined'
      >
        <Typography variant='body2'>
          {warnings.length > 1
            ? `${warnings.join(' and ')} volumes exceed 20% of 24h volume. Please reduce the notional amount to proceed.`
            : `${warnings[0]} volume exceeds 20% of 24h volume. Please reduce the notional amount to proceed.`}
        </Typography>
      </Alert>
    );
  }, [showVolumeWarning, longExceedsVolumeLimit, shortExceedsVolumeLimit]);

  // Calculate funding rates for both legs
  const longFundingRate = useMemo(() => {
    if (!longPair || !longAccount?.exchangeName) return null;
    const basePairName = getPairBase(longPair);
    const fundingRateData = fundingRates.find(
      (rate) => rate.pair === basePairName && rate.exchange?.toLowerCase() === longAccount.exchangeName?.toLowerCase()
    );
    const rate = fundingRateData?.rate;
    const interval = fundingRateData?.funding_rate_interval;
    return rate != null && interval != null ? parseFloat(rate) / parseFloat(interval) : null;
  }, [longPair, longAccount, fundingRates]);

  const shortFundingRate = useMemo(() => {
    if (!shortPair || !shortAccount?.exchangeName) return null;
    const basePairName = getPairBase(shortPair);
    const fundingRateData = fundingRates.find(
      (rate) => rate.pair === basePairName && rate.exchange?.toLowerCase() === shortAccount.exchangeName?.toLowerCase()
    );
    const rate = fundingRateData?.rate;
    const interval = fundingRateData?.funding_rate_interval;
    return rate != null && interval != null ? parseFloat(rate) / parseFloat(interval) : null;
  }, [shortPair, shortAccount, fundingRates]);

  const [modeInternal, setModeInternal] = useState(mode);

  const handleModeChange = (_, value) => {
    if (!value) return;
    setMode(value);
    setModeInternal(value);
  };

  const renderModeSelector = () => (
    <ToggleButtonGroup exclusive fullWidth size='small' value={modeInternal} onChange={handleModeChange}>
      {tradeableModes.map((m) => (
        <ToggleButton
          key={m.value}
          sx={{
            color: `orderUrgency.${m.urgency}`,
            flex: 1,
            '&.Mui-selected': { backgroundColor: 'orderUrgency.background', color: `orderUrgency.${m.urgency}` },
          }}
          value={m.value}
        >
          <Stack alignItems='center' direction='column' spacing={0.5}>
            <Typography color='inherit' fontWeight='bold' variant='body2'>
              {m.label}
            </Typography>
            <Typography color='text.secondary' variant='body2'>
              {(() => {
                const d = m.duration;
                if (!d) return '-';
                const h = Math.floor(d / 60);
                const mins = d % 60;
                if (h === 0) return `~${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
                return `${h} hours ${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
              })()}
            </Typography>
          </Stack>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );

  // Fixed summary footer handling (mobile)
  const [summaryOpen, setSummaryOpen] = useState(false);
  const summaryFooterRef = useRef(null);
  const [summaryHeight, setSummaryHeight] = useState(0);

  const mobileContentPaddingBottom = useMemo(() => {
    if (!isMobile) return '0px';
    const safeArea = 'env(safe-area-inset-bottom, 0px)';
    return summaryHeight ? `calc(${summaryHeight + 8}px + ${safeArea})` : `calc(120px + ${safeArea})`;
  }, [isMobile, summaryHeight]);

  useEffect(() => {
    if (!isMobile) return undefined;
    if (typeof window === 'undefined') return undefined;
    const element = summaryFooterRef.current;
    if (!element) return undefined;

    const measure = () => {
      setSummaryHeight(element.getBoundingClientRect().height);
    };

    measure();

    if ('ResizeObserver' in window) {
      const observer = new window.ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isMobile, summaryOpen, isSubmitting, canSubmit]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const root = document.documentElement;
    if (!isMobile) {
      root.style.removeProperty('--delta-neutral-footer-gap');
      return undefined;
    }

    root.style.setProperty('--delta-neutral-footer-gap', mobileContentPaddingBottom);
    return () => {
      root.style.removeProperty('--delta-neutral-footer-gap');
    };
  }, [isMobile, mobileContentPaddingBottom]);

  if (isMobile) {
    return (
      <>
        <Stack direction='column' spacing={3} sx={{ width: '100%', pb: mobileContentPaddingBottom }}>
          {/* Accounts & Pairs (stacked) */}
          <Stack direction='column' spacing={1}>
            <Typography variant='small1'>Accounts & Pairs</Typography>
            {/* Long */}
            <Paper
              elevation={1}
              sx={{ p: 2, border: '1px solid', borderColor: 'divider', backgroundColor: 'rgba(10, 12, 24, 0.3)' }}
            >
              <Stack direction='column' spacing={2}>
                <Typography color='success.main' variant='subtitle1'>
                  Long
                </Typography>
                <MarketMaketAccountSelector
                  account={longAccount}
                  accounts={tradableAccounts}
                  onSelectAccount={setLongAccount}
                />
                <Paper elevation={1} sx={{ p: 2, minHeight: 56, display: 'flex', alignItems: 'center' }}>
                  <Stack
                    alignItems='center'
                    direction='row'
                    spacing={1}
                    sx={{ justifyContent: 'space-between', width: '100%' }}
                  >
                    <Box sx={{ flex: 1, pr: 2 }}>
                      <MarketMakerPairSelector
                        account={longAccount}
                        fundingRates={fundingRates}
                        pair={longPair}
                        pairs={tradeablePairsLong}
                        onOpenChange={() => {}}
                        onSelectPair={setLongPair}
                      />
                    </Box>
                    <Box sx={{ width: 64 }}>
                      <LeverageChip
                        adjustLeverage={adjustLongLeverage}
                        disabled={!longAccount || !currentPairLong || currentPairLong?.market_type === 'spot'}
                        exchange={longLeverage?.exchange}
                        leverage={longLeverage?.leverage}
                        maxLeverage={longMaxLeverage}
                        pairId={longPair}
                      />
                    </Box>
                  </Stack>
                </Paper>
              </Stack>
            </Paper>

            {/* Short */}
            <Paper
              elevation={1}
              sx={{ p: 2, border: '1px solid', borderColor: 'divider', backgroundColor: 'rgba(10, 12, 24, 0.3)' }}
            >
              <Stack direction='column' spacing={2}>
                <Typography color='error.main' variant='subtitle1'>
                  Short
                </Typography>
                <MarketMaketAccountSelector
                  account={shortAccount}
                  accounts={tradableAccounts}
                  onSelectAccount={setShortAccount}
                />
                <Paper elevation={1} sx={{ p: 2, minHeight: 56, display: 'flex', alignItems: 'center' }}>
                  <Stack
                    alignItems='center'
                    direction='row'
                    spacing={1}
                    sx={{ justifyContent: 'space-between', width: '100%' }}
                  >
                    <Box sx={{ flex: 1, pr: 2 }}>
                      <MarketMakerPairSelector
                        account={shortAccount}
                        fundingRates={fundingRates}
                        pair={shortPair}
                        pairs={tradeablePairsShort}
                        onOpenChange={() => {}}
                        onSelectPair={setShortPair}
                      />
                    </Box>
                    <Box sx={{ width: 64 }}>
                      <LeverageChip
                        adjustLeverage={adjustShortLeverage}
                        disabled={!shortAccount || !currentPairShort || currentPairShort?.market_type === 'spot'}
                        exchange={shortLeverage?.exchange}
                        leverage={shortLeverage?.leverage}
                        maxLeverage={shortMaxLeverage}
                        pairId={shortPair}
                      />
                    </Box>
                  </Stack>
                </Paper>
              </Stack>
            </Paper>
          </Stack>

          {/* Notional */}
          <Stack direction='column' spacing={2}>
            <Typography variant='small1'>Notional</Typography>
            <Paper elevation={1} sx={{ p: 2, minHeight: 56, display: 'flex', alignItems: 'center' }}>
              <Tooltip
                arrow
                disableFocusListener
                disableHoverListener
                disableTouchListener
                open={Boolean(notionalError)}
                placement='top'
                title={notionalError || ''}
              >
                <TextField
                  fullWidth
                  autoComplete='off'
                  InputProps={{
                    disableUnderline: true,
                    inputComponent: NumericFormatCustom,
                    inputProps: {
                      inputMode: 'decimal',
                    },
                    sx: { input: { textAlign: 'left', fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: 400 } },
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Typography color='grey' variant='h3'>
                          $
                        </Typography>
                      </InputAdornment>
                    ),
                  }}
                  placeholder='0'
                  value={notional}
                  variant='standard'
                  onChange={(e) => setNotional(e.target.value)}
                />
              </Tooltip>
            </Paper>
          </Stack>

          {/* Mode */}
          {renderModeSelector()}

          {highLeverageWarningContent}
          {marginWarningContent}
          {volumeWarningContent}
        </Stack>

        {/* Fixed Summary + CTA */}
        <Portal>
          <Box
            sx={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              px: 2,
              pb: 2,
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Paper
              elevation={3}
              ref={summaryFooterRef}
              sx={{
                width: '100%',
                maxWidth: 520,
                pointerEvents: 'auto',
                borderRadius: 1,
                backgroundColor: 'rgba(10, 12, 24, 0.90)',
                backdropFilter: 'blur(12px)',
                borderTop: '1px solid',
                borderColor: 'divider',
                boxShadow: '0 -6px 18px rgba(0,0,0,0.35)',
              }}
            >
              <Stack direction='column' spacing={1} sx={{ px: 2.5, py: 1.5 }}>
                <Stack
                  alignItems='center'
                  direction='row'
                  justifyContent='space-between'
                  sx={{ px: 1, py: 0.5, cursor: 'pointer' }}
                  onClick={() => setSummaryOpen((v) => !v)}
                >
                  <Typography variant='subtitle2'>Summary</Typography>
                  {summaryOpen ? <ExpandMoreIcon /> : <ExpandMoreIcon sx={{ transform: 'rotate(180deg)' }} />}
                </Stack>
                {summaryOpen && (
                  <Box sx={{ px: 1 }}>
                    <Stack
                      direction='column'
                      spacing={2}
                      sx={{
                        maxHeight: '45vh',
                        overflow: 'auto',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        '&::-webkit-scrollbar': { display: 'none' },
                      }}
                    >
                      <DeltaNeutralPreTradeAnalytics
                        availableLongMargin={leveragedAvailableLongMargin}
                        availableShortMargin={leveragedAvailableShortMargin}
                        longFees={longFees}
                        longFundingRate={longFundingRate}
                        longLeverage={longLeverage?.leverage}
                        longPair={longPair}
                        longPovRate={longPovRate}
                        mode={mode}
                        perLegNotional={perLegNotional}
                        shortFees={shortFees}
                        shortFundingRate={shortFundingRate}
                        shortLeverage={shortLeverage?.leverage}
                        shortPair={shortPair}
                        shortPovRate={shortPovRate}
                      />
                      <MarketMakerConfiguration
                        durationMinutes={derivedDurationMinutes}
                        passiveness={derivedPassiveness}
                      />
                    </Stack>
                  </Box>
                )}
                <Button
                  fullWidth
                  color='primary'
                  disabled={isSubmitting || !canSubmit}
                  sx={{ height: 48, mt: 0 }}
                  variant='contained'
                  onClick={handleSubmit}
                >
                  {isSubmitting ? <CircularProgress size={30} /> : 'Start Trading'}
                </Button>
              </Stack>
            </Paper>
          </Box>
        </Portal>
      </>
    );
  }

  return (
    <Stack direction='row' spacing={4} sx={{ width: '100%' }}>
      {/* Left: Controls */}
      <Stack direction='column' spacing={3} sx={{ flex: 7, minWidth: 0 }}>
        {/* Accounts & Pairs Section */}
        <Stack direction='column' spacing={1}>
          <Typography variant='small1'>Accounts & Pairs</Typography>
          <Grid container alignItems='stretch' spacing={2}>
            {/* Long Column */}
            <Grid md={5.5} xs={12}>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'rgba(10, 12, 24, 0.3)',
                }}
              >
                <Stack direction='column' spacing={2}>
                  <Typography color='success.main' variant='subtitle1'>
                    Long
                  </Typography>

                  {/* Long Account */}
                  <Stack direction='column' spacing={1}>
                    <MarketMaketAccountSelector
                      account={longAccount}
                      accounts={tradableAccounts}
                      onSelectAccount={setLongAccount}
                    />
                  </Stack>

                  {/* Long Pair & Leverage */}
                  <Stack direction='column' spacing={1}>
                    <Paper elevation={1} sx={{ p: 2, minHeight: 56, display: 'flex', alignItems: 'center' }}>
                      <Stack
                        alignItems='center'
                        direction='row'
                        spacing={1}
                        sx={{ justifyContent: 'space-between', width: '100%' }}
                      >
                        <Box sx={{ flex: 1, pr: 2 }}>
                          <MarketMakerPairSelector
                            account={longAccount}
                            fundingRates={fundingRates}
                            pair={longPair}
                            pairs={tradeablePairsLong}
                            onOpenChange={() => {}}
                            onSelectPair={setLongPair}
                          />
                        </Box>
                        <Box sx={{ width: 64 }}>
                          <LeverageChip
                            adjustLeverage={adjustLongLeverage}
                            disabled={!longAccount || !currentPairLong || currentPairLong?.market_type === 'spot'}
                            exchange={longLeverage?.exchange}
                            leverage={longLeverage?.leverage}
                            maxLeverage={longMaxLeverage}
                            pairId={longPair}
                          />
                        </Box>
                      </Stack>
                    </Paper>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>

            {/* Swap Button */}
            <Grid md={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} xs={12}>
              <Tooltip title='Swap long and short legs (accounts & pairs)'>
                <span>
                  <Button
                    color='secondary'
                    disabled={isSubmitting || swapPending}
                    startIcon={<SwapHorizIcon sx={{ fontSize: 28, ml: 3 }} />}
                    variant='text'
                    onClick={handleSwapAccountsAndPairs}
                  />
                </span>
              </Tooltip>
            </Grid>

            {/* Short Column */}
            <Grid md={5.5} xs={12}>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'rgba(10, 12, 24, 0.3)',
                }}
              >
                <Stack direction='column' spacing={2}>
                  <Typography color='error.main' variant='subtitle1'>
                    Short
                  </Typography>

                  {/* Short Account */}
                  <Stack direction='column' spacing={1}>
                    <MarketMaketAccountSelector
                      account={shortAccount}
                      accounts={tradableAccounts}
                      onSelectAccount={setShortAccount}
                    />
                  </Stack>

                  {/* Short Pair & Leverage */}
                  <Stack direction='column' spacing={1}>
                    <Paper elevation={1} sx={{ p: 2, minHeight: 56, display: 'flex', alignItems: 'center' }}>
                      <Stack
                        alignItems='center'
                        direction='row'
                        spacing={1}
                        sx={{ justifyContent: 'space-between', width: '100%' }}
                      >
                        <Box sx={{ flex: 1, pr: 2 }}>
                          <MarketMakerPairSelector
                            account={shortAccount}
                            fundingRates={fundingRates}
                            pair={shortPair}
                            pairs={tradeablePairsShort}
                            onOpenChange={() => {}}
                            onSelectPair={setShortPair}
                          />
                        </Box>
                        <Box sx={{ width: 64 }}>
                          <LeverageChip
                            adjustLeverage={adjustShortLeverage}
                            disabled={!shortAccount || !currentPairShort || currentPairShort?.market_type === 'spot'}
                            exchange={shortLeverage?.exchange}
                            leverage={shortLeverage?.leverage}
                            maxLeverage={shortMaxLeverage}
                            pairId={shortPair}
                          />
                        </Box>
                      </Stack>
                    </Paper>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>

        {/* Notional */}
        <Stack direction='column' spacing={2} sx={{ pt: 3 }}>
          <Typography variant='small1'>Notional</Typography>
          <Paper elevation={1} sx={{ p: 2, minHeight: 56, display: 'flex', alignItems: 'center' }}>
            <Tooltip
              arrow
              disableFocusListener
              disableHoverListener
              disableTouchListener
              open={Boolean(notionalError)}
              placement='top'
              title={notionalError || ''}
            >
              <TextField
                fullWidth
                autoComplete='off'
                InputProps={{
                  disableUnderline: true,
                  inputComponent: NumericFormatCustom,
                  inputProps: {
                    inputMode: 'decimal',
                  },
                  sx: { input: { textAlign: 'left', fontSize: '1.5rem', lineHeight: '1.875rem', fontWeight: 400 } },
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Typography color='grey' variant='h3'>
                        $
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                placeholder='0'
                value={notional}
                variant='standard'
                onChange={(e) => setNotional(e.target.value)}
              />
            </Tooltip>
          </Paper>
        </Stack>

        {/* Mode */}
        {renderModeSelector()}

        {/* Start Trading */}
        <Button
          fullWidth
          color='primary'
          disabled={isSubmitting || !canSubmit}
          sx={{ height: 48 }}
          variant='contained'
          onClick={handleSubmit}
        >
          {isSubmitting ? <CircularProgress size={30} /> : 'Start Trading'}
        </Button>

        {highLeverageWarningContent}
        {marginWarningContent}
        {volumeWarningContent}
      </Stack>

      {/* Right: Analytics & Config */}
      <Stack direction='column' spacing={3} sx={{ flex: 3, minWidth: 0 }}>
        <DeltaNeutralPreTradeAnalytics
          availableLongMargin={leveragedAvailableLongMargin}
          availableShortMargin={leveragedAvailableShortMargin}
          longFees={longFees}
          longFundingRate={longFundingRate}
          longLeverage={longLeverage?.leverage}
          longPair={longPair}
          longPovRate={longPovRate}
          mode={mode}
          perLegNotional={perLegNotional}
          shortFees={shortFees}
          shortFundingRate={shortFundingRate}
          shortLeverage={shortLeverage?.leverage}
          shortPair={shortPair}
          shortPovRate={shortPovRate}
        />

        <MarketMakerConfiguration durationMinutes={derivedDurationMinutes} passiveness={derivedPassiveness} />
      </Stack>
    </Stack>
  );
}
