import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import {
  Paper,
  Stack,
  Typography,
  Box,
  InputAdornment,
  Divider,
  Button,
  TextField,
  styled,
  Popper,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  Tooltip,
  Portal,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Link as LinkIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import Grid from '@mui/material/Unstable_Grid2';
import LabelTooltip, { TreadTooltip } from '@/shared/components/LabelTooltip';
import { alpha, useTheme } from '@mui/material/styles';
import { NumericFormatCustom } from '@/shared/fields/NumberFieldFormat';
import { TokenIcon, ExchangeIcon } from '@/shared/components/Icons';
import { isolatedHolographicStyles } from '@/theme/holographicEffects';
import { debounce } from 'lodash';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';
import { formatQty, msAndKs } from '@/util';
import { useLeverage, LeverageChip } from '@/shared/components/LeverageChip';
import { useAccountBalanceContext } from '@/pages/dashboard/orderEntry/AccountBalanceContext';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import useViewport from '@/shared/hooks/useViewport';
import useMarketMakerForm from '../hooks/useMarketMakerForm';
import MarketMakerPreTradeAnalytics from './MarketMakerPreTradeAnalytics';
import MarketMakerConfiguration from './MarketMakerConfiguration';
import LifetimeStats from './LifetimeStats';

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

function PairRow({ index, style, data }) {
  const { pairs, onSelectPair } = data;
  const pair = pairs[index];
  const volumeNotional = pair?.ticker?.volume24hNotional;
  const lastPrice = pair?.ticker?.lastPrice;

  return (
    <Box style={{ ...style, borderRadius: 0, overflow: 'hidden', margin: 0 }}>
      <HoloPairRow
        alignItems='center'
        direction='row'
        justifyContent='space-between'
        sx={{
          cursor: 'pointer',
          height: 'inherit',
          px: 3.75,
        }}
        onClick={() => onSelectPair(pair.id)}
      >
        <Stack alignItems='center' direction='row' spacing={1}>
          <TokenIcon style={{ height: '34px', width: '34px' }} tokenName={pair.id} />
          <Stack direction='column' spacing={0.5}>
            <Typography
              sx={{
                maxWidth: 220,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              variant='body1'
            >
              {pair.id}
            </Typography>
            <Typography color='text.secondary' variant='body2'>
              {formatQty(lastPrice, true)}
            </Typography>
          </Stack>
        </Stack>

        <Stack alignItems='flex-end' direction='column' spacing={0}>
          <Typography color='text.secondary' variant='body2'>
            24h Volume
          </Typography>
          <Typography variant='body2'>
            <span>$</span>
            {msAndKs(volumeNotional)}
          </Typography>
        </Stack>
      </HoloPairRow>
    </Box>
  );
}

const getDirectionalBiasColor = (theme, value) => {
  if (value > 0) {
    return theme.palette.orderUrgency?.ULTRA_LOW ?? theme.palette.success.main;
  }
  if (value < 0) {
    return theme.palette.orderUrgency?.HIGH ?? theme.palette.error.main;
  }
  return theme.palette.text.primary;
};

function MarketMakerPairSelector({ pair, pairs, onSelectPair, onOpenChange, directionalBias }) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmedSearchQuery, setConfirmedSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc' for volume
  const popperRef = useRef(null);
  const triggerRef = useRef(null);

  const open = Boolean(anchorEl);
  const dropdownWidth = triggerRef.current ? triggerRef.current.offsetWidth : undefined;

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

    // Sort by volume
    tradingPairs.sort((a, b) => {
      const volumeA = a.ticker?.volume24hNotional ?? 0;
      const volumeB = b.ticker?.volume24hNotional ?? 0;
      return sortOrder === 'desc' ? volumeB - volumeA : volumeA - volumeB;
    });

    return tradingPairs;
  }, [pairs, confirmedSearchQuery, sortOrder]);

  return (
    <>
      <Stack
        alignItems='center'
        direction='row'
        ref={triggerRef}
        spacing={1}
        sx={{
          p: 3,
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
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
        onClose={handleClose}
      >
        <Paper
          elevation={0}
          sx={{
            width: dropdownWidth,
            backgroundColor: `background.container40`, // 25% opacity - much more transparent
            backdropFilter: 'blur(15px)',
            borderRadius: 0,
            border: 'none',
          }}
        >
          <Stack direction='column'>
            <Box sx={{ p: 3 }}>
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
                  title={sortOrder === 'desc' ? 'Sort by volume (high to low)' : 'Sort by volume (low to high)'}
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
            <Divider />
            <Box sx={{ position: 'relative', height: '500px', py: 0 }}>
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    itemCount={filteredPairs.length}
                    itemData={{ pairs: filteredPairs, onSelectPair: handleSelectPair }}
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

const DIRECTIONAL_BIAS_OPTIONS = [
  { label: 'Short', value: -1, ariaLabel: 'Short bias' },
  { label: 'Neutral', value: 0, ariaLabel: 'Neutral bias' },
  { label: 'Long', value: 1, ariaLabel: 'Long bias' },
];

const EXECUTION_MODE_TOOLTIP =
  'Execution mode controls the speed at which the market maker bot will run, aggressive will optimize for speed and quote tighter spreads while passive will optimize for larger spreads for better fill quality.';

const CHASE_DECAY_TOOLTIP =
  'Reaction time controls how frequently limit orders are refreshed: Quick chases more frequently, Normal uses defaults, Patient chases less frequently. When the market is moving quickly, you may reduce exposure and get consistent results with low. If the market is illiquid, slow results in less chasing behavior.';

function ReferencePairSelector({ referencePrice, availablePairs, selectedValue, onSelect, triggerRef }) {
  const popperRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const shouldShow = referencePrice === 'other_exchange' && Boolean(triggerRef?.current);
  const anchorEl = triggerRef?.current || null;

  // Open dropdown when referencePrice changes to 'other_exchange'
  useEffect(() => {
    if (shouldShow) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [shouldShow]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (
        popperRef.current &&
        !popperRef.current.contains(event.target) &&
        !triggerRef?.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, triggerRef]);

  const dropdownWidth = triggerRef?.current ? triggerRef.current.offsetWidth : undefined;

  if (!isOpen || !shouldShow) return null;

  return (
    <Popper
      anchorEl={anchorEl}
      open={isOpen}
      placement='bottom-start'
      ref={popperRef}
      sx={{
        zIndex: 9999,
        width: dropdownWidth,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: dropdownWidth,
          backgroundColor: 'background.container40',
          backdropFilter: 'blur(15px)',
          borderRadius: 0,
          border: 'none',
          maxHeight: '400px',
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.3)',
            },
          },
        }}
      >
        <Stack direction='column'>
          {availablePairs.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography color='text.secondary' variant='body2'>
                No matching pairs found on other exchanges
              </Typography>
            </Box>
          ) : (
            availablePairs.map((opt) => (
              <HoloPairRow
                alignItems='center'
                direction='row'
                key={opt.value}
                spacing={1.5}
                sx={{
                  cursor: 'pointer',
                  height: '48px',
                  px: 3.75,
                  flexShrink: 0,
                }}
                onClick={() => {
                  onSelect(opt.value);
                  setIsOpen(false);
                }}
              >
                <ExchangeIcon exchangeName={opt.exchange} style={{ height: '24px', width: '24px' }} />
                <Stack direction='column' spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap variant='body1'>
                    {opt.exchange}
                  </Typography>
                  <Typography noWrap color='text.secondary' variant='body2'>
                    {opt.pairName}
                  </Typography>
                </Stack>
              </HoloPairRow>
            ))
          )}
        </Stack>
      </Paper>
    </Popper>
  );
}

function DirectionalBiasButtons({ directionalBias, setDirectionalBias, sx }) {
  const theme = useTheme();

  return (
    <Stack alignItems='stretch' direction='column' spacing={1} sx={{ width: '100%', ...sx }}>
      <Box sx={{ alignSelf: 'flex-start' }}>
        <TreadTooltip
          color='text.secondary'
          labelTextVariant='body1'
          placement='left'
          underline={false}
          variant='directional_bias'
        />
      </Box>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size='small'
        sx={{ width: '100%' }}
        value={directionalBias}
        onChange={(_, newValue) => {
          if (newValue === null) {
            return;
          }
          setDirectionalBias(Number(newValue));
        }}
      >
        {DIRECTIONAL_BIAS_OPTIONS.map((option) => (
          <ToggleButton
            aria-label={option.ariaLabel}
            key={option.value}
            sx={(muiTheme) => {
              const biasColor = getDirectionalBiasColor(muiTheme, option.value);
              const isNeutral = option.value === 0;
              const hoverBackground = isNeutral ? muiTheme.palette.action.hover : alpha(biasColor, 0.08);
              const selectedBackground = isNeutral ? muiTheme.palette.action.selected : alpha(biasColor, 0.16);

              return {
                flex: 1,
                textTransform: 'none',
                fontWeight: muiTheme.typography.fontWeightRegular,
                borderColor: muiTheme.palette.divider,
                color: muiTheme.palette.text.primary,
                '&.Mui-selected': {
                  backgroundColor: selectedBackground,
                  color: muiTheme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: selectedBackground,
                  },
                },
                '&:hover': {
                  backgroundColor: hoverBackground,
                },
              };
            }}
            value={option.value}
          >
            <Stack alignItems='center' direction='column' spacing={0}>
              <Typography
                sx={(muiTheme) => ({
                  color: getDirectionalBiasColor(muiTheme, option.value),
                  fontWeight: muiTheme.typography.fontWeightBold,
                })}
                variant='body2'
              >
                {option.label}
              </Typography>
            </Stack>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
}

function MarketMaketAccountSelector({ account, onSelectAccount, accounts }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const popperRef = useRef(null);
  const triggerRef = useRef(null); // keeps inner content ref if needed
  const containerRef = useRef(null); // the visible Select Account field
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

  return (
    <Paper
      elevation={1}
      ref={containerRef}
      sx={{
        p: 3,
        pr: 4,
        cursor: 'pointer',
        overflow: 'hidden',
        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
        backgroundColor: 'rgba(10, 12, 24, 0.45)',
        backdropFilter: 'blur(15px)',
      }}
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
      <Popper
        anchorEl={anchorEl}
        open={open}
        placement='bottom-start'
        ref={popperRef}
        sx={{
          zIndex: 9999,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: dropdownWidth,
            backgroundColor: `background.container40`, // 25% opacity - much more transparent
            backdropFilter: 'blur(15px)',
            borderRadius: 0,
            border: 'none',
          }}
        >
          <Stack direction='column'>
            {Object.values(accounts).map((a) => (
              <HoloPairRow
                alignItems='center'
                direction='row'
                key={a.id}
                spacing={1.5}
                sx={{
                  cursor: 'pointer',
                  height: '40px',
                  px: 3.75,
                }}
                onClick={() => handleSelectAccount(a)}
              >
                <ExchangeIcon exchangeName={a.exchangeName} style={{ height: '25px', width: '25px' }} />
                <Typography
                  sx={{
                    maxWidth: 220,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
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

function MarketMakerModeSelector({ mode, setMode, tradeableModes }) {
  const theme = useTheme();

  const displayDuration = (duration, modeValue) => {
    if (!duration) return '-';

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    const minuteStr = minutes === 1 ? 'minute' : 'minutes';

    if (hours === 0) {
      return `~${minutes} ${minuteStr}`;
    }

    return `${hours} hours ${minutes} ${minuteStr}`;
  };

  return (
    <Stack direction='column' spacing={2} sx={{ width: '100%' }}>
      <Stack direction='column' spacing={1}>
        <Box sx={{ alignSelf: 'flex-start' }}>
          <LabelTooltip
            color='text.secondary'
            label='Execution Mode'
            labelTextVariant='body1'
            placement='left'
            title={
              <Typography sx={{ maxWidth: 320 }} variant='body2'>
                {EXECUTION_MODE_TOOLTIP}
              </Typography>
            }
            underline={false}
          />
        </Box>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size='small'
          sx={{ width: '100%' }}
          value={mode}
          onChange={(_, value) => value && setMode(value)}
        >
          {tradeableModes.map((m) => {
            const buttonColor = `orderUrgency.${m.urgency}`;

            return (
              <ToggleButton
                key={m.value}
                sx={{
                  color: buttonColor,
                  flex: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'orderUrgency.background',
                    color: buttonColor,
                    '&:hover': {
                      backgroundColor: 'orderUrgency.background',
                    },
                  },
                }}
                value={m.value}
              >
                <Stack alignItems='center' direction='column' spacing={0.5}>
                  <Typography color='inherit' fontWeight='bold' variant='body2'>
                    {m.label}
                  </Typography>
                  <Typography color='text.secondary' variant='body2'>
                    {displayDuration(m.duration, m.value)}
                  </Typography>
                </Stack>
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>
      </Stack>
    </Stack>
  );
}

function MarketMakerChaseDecaySelector({ chaseDecayMode, setChaseDecayMode, durationMinutes }) {
  const theme = useTheme();
  const isQuickDisabled = durationMinutes != null && durationMinutes > 30;

  return (
    <Stack direction='column' spacing={1} sx={{ width: '100%', flex: 1 }}>
      <Box sx={{ alignSelf: 'flex-start' }}>
        <LabelTooltip
          color='text.secondary'
          label='Reaction Time'
          labelTextVariant='body1'
          placement='left'
          title={
            <Typography sx={{ maxWidth: 320 }} variant='body2'>
              {CHASE_DECAY_TOOLTIP}
            </Typography>
          }
          underline={false}
        />
      </Box>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size='small'
        sx={{ width: '100%' }}
        value={chaseDecayMode}
        onChange={(_, value) => value != null && setChaseDecayMode(value)}
      >
        <ToggleButton
          disabled={isQuickDisabled}
          sx={{
            color: theme.palette.error.main,
            opacity: isQuickDisabled ? 0.5 : 1,
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.error.main, 0.16),
              color: theme.palette.error.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.16),
              },
            },
            '&.Mui-disabled': {
              opacity: 0.5,
              color: 'text.disabled',
            },
          }}
          value='quick'
        >
          <Typography fontWeight={isQuickDisabled ? 'normal' : 'bold'} variant='body2'>
            Quick
          </Typography>
        </ToggleButton>
        <ToggleButton value='normal'>
          <Typography fontWeight='bold' variant='body2'>
            Normal
          </Typography>
        </ToggleButton>
        <ToggleButton
          sx={{
            color: theme.palette.success.main,
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.success.main, 0.16),
              color: theme.palette.success.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.success.main, 0.16),
              },
            },
          }}
          value='slow'
        >
          <Typography fontWeight='bold' variant='body2'>
            Patient
          </Typography>
        </ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
}

export default function MarketMakerEntryForm({ lifetime, activeOrders = [], onSubmitted }) {
  const { isMobile } = useViewport();
  const { initialLoadValue } = useOrderForm();
  const { isDev } = useUserMetadata();
  const referencePairTriggerRef = useRef(null);
  const {
    feeAmount,
    setFeeAmount,
    volumeAmount,
    setVolumeAmount,
    handleFeeBlur,
    handleVolumeBlur,
    isSyncing,
    activeField,
    derivedNotional,
    account,
    setAccount,
    pair,
    setPair,
    mode,
    setMode,
    chaseDecayMode,
    setChaseDecayMode,
    directionalBias,
    setDirectionalBias,
    referencePrice,
    setReferencePrice,
    referenceExchange,
    setReferenceExchange,
    spreadBps,
    setSpreadBps,
    spreadOptionsByReference,
    availableReferenceExchanges,
    derivedDurationMinutes,
    derivedPassiveness,
    derivedParticipationRate,
    handleSubmit,
    isSubmitting,
    canSubmit,
    tradeablePairs,
    tradableAccounts,
    tradeableModes,
    exceedsVolumeLimit,
    pairTicker,
  } = useMarketMakerForm({ onSubmitted });

  const { calculateMarginBalance, calculateAssetBalance } = useAccountBalanceContext();

  const currentPair = useMemo(() => tradeablePairs.find((p) => p.id === pair), [tradeablePairs, pair]);
  const { leverage, adjustLeverage, maxLeverage } = useLeverage({ pair: currentPair, account });

  // Extract base asset from pair ID (handles BTC:PERP-USDT, BTC:PERP_USDM-USD, BTC/USDT, BTCUSDT formats)
  const extractBaseFromPairId = useCallback((pairId) => {
    if (!pairId) return null;

    // Handle formats with colon separator (BTC:PERP-USDT, BTC:PERP_USDM-USD, etc.)
    if (pairId.includes(':')) {
      const parts = pairId.split(':');
      if (parts.length > 0) {
        return parts[0];
      }
    }

    // Handle BTC/USDT format -> BTC
    if (pairId.includes('/')) {
      return pairId.split('/')[0];
    }

    // Handle BTCUSDT format -> BTC (remove common quote currencies)
    const quoteCurrencies = ['USDT', 'USD', 'USDC', 'BUSD', 'DAI'];
    const matchingQuote = quoteCurrencies.find((quote) => pairId.endsWith(quote));
    if (matchingQuote) {
      return pairId.slice(0, -matchingQuote.length);
    }

    // Fallback: use the pair's base field if available
    return null;
  }, []);

  // Extract asset class from pair ID (e.g., "PERP" from "BTC:PERP-USDT", "SPOT" from "BTC/USDT")
  const extractAssetClassFromPairId = useCallback((pairId, marketType) => {
    if (!pairId) return null;

    // First, check market_type if available (most reliable)
    if (marketType) {
      const normalized = marketType.toUpperCase();
      if (normalized === 'SPOT') return 'SPOT';
      if (normalized === 'PERPETUAL' || normalized === 'PERP') return 'PERP';
      if (normalized === 'FUTURES' || normalized === 'FUTURE') return 'FUTURES';
      // Return normalized if it's a known type
      if (['SPOT', 'PERP', 'PERPETUAL', 'FUTURES', 'FUTURE'].includes(normalized)) {
        return normalized === 'PERPETUAL' ? 'PERP' : normalized;
      }
    }

    // Fallback: extract from pair ID format
    const upperPairId = pairId.toUpperCase();

    // Handle various PERP formats:
    // BTC:PERP-USDT, BTC:PERP-USDC, BTC:PERP_USDM-USD, etc.
    // Check for PERP after a colon or before a dash/underscore
    if (upperPairId.includes(':PERP') || upperPairId.match(/PERP[-_]/) || upperPairId.match(/[-_]PERP/)) {
      return 'PERP';
    }

    // Handle various FUTURES formats
    if (upperPairId.includes(':FUTURES') || upperPairId.match(/FUTURES[-_]/) || upperPairId.match(/[-_]FUTURES/)) {
      return 'FUTURES';
    }

    // If it has a colon separator (like BTC:PERP-USDT), it's likely a derivative
    // Check if the part after the colon contains PERP or FUTURES
    if (pairId.includes(':')) {
      const parts = pairId.split(':');
      if (parts.length >= 2) {
        const secondPart = parts[1].toUpperCase();
        if (secondPart.includes('PERP') || secondPart.includes('PERPETUAL')) {
          return 'PERP';
        }
        if (secondPart.includes('FUTURES') || secondPart.includes('FUTURE')) {
          return 'FUTURES';
        }
      }
    }

    // Default to SPOT if no indicator found
    return 'SPOT';
  }, []);

  // Find matching pairs from other exchanges for reference price dropdown (match on base asset and asset class)
  const availableReferencePairs = useMemo(() => {
    if (!currentPair || !initialLoadValue?.tokenPairs || !account?.exchangeName) return [];

    // Extract base and asset class from current pair
    // Prefer the base field from the pair object as it's more reliable
    const currentBase = currentPair.base || extractBaseFromPairId(currentPair.id);
    const currentAssetClass = extractAssetClassFromPairId(currentPair.id, currentPair.market_type);

    console.log('[ReferencePairs] Current pair info:', {
      pairId: currentPair.id,
      base: currentPair.base,
      extractedBase: extractBaseFromPairId(currentPair.id),
      marketType: currentPair.market_type,
      extractedAssetClass: extractAssetClassFromPairId(currentPair.id, currentPair.market_type),
      currentBase,
      currentAssetClass,
      accountExchange: account.exchangeName,
    });

    if (!currentBase || !currentAssetClass) {
      console.log('[ReferencePairs] Cannot extract base or asset class, returning empty');
      return [];
    }

    // First, log all BTC pairs to see what we're working with
    const btcPairs = initialLoadValue.tokenPairs.filter((p) => {
      const pairBase = p.base || extractBaseFromPairId(p.id);
      return pairBase && pairBase.toUpperCase() === currentBase.toUpperCase();
    });
    console.log(
      '[ReferencePairs] All BTC pairs found:',
      btcPairs.map((p) => ({
        pairId: p.id,
        base: p.base,
        marketType: p.market_type,
        extractedBase: extractBaseFromPairId(p.id),
        extractedAssetClass: extractAssetClassFromPairId(p.id, p.market_type),
        exchanges: p.exchanges,
      }))
    );

    const allPairs = initialLoadValue.tokenPairs
      .map((p) => {
        if (!p.exchanges || p.exchanges.length === 0) return null;

        // Extract base and asset class from pair
        // Prefer the base field from the pair object as it's more reliable
        const pairBase = p.base || extractBaseFromPairId(p.id);
        const pairAssetClass = extractAssetClassFromPairId(p.id, p.market_type);

        const baseMatch = pairBase && pairBase.toUpperCase() === currentBase.toUpperCase();
        const assetClassMatch = pairAssetClass && pairAssetClass === currentAssetClass;
        const differentExchange = !p.exchanges.includes(account.exchangeName);

        const matches = baseMatch && assetClassMatch && differentExchange;

        // Log details for debugging - log all BTC pairs, not just candidates
        if (baseMatch) {
          console.log('[ReferencePairs] Pair candidate:', {
            pairId: p.id,
            pairBase,
            currentBase,
            baseMatch,
            pairAssetClass,
            currentAssetClass,
            assetClassMatch,
            exchanges: p.exchanges,
            accountExchange: account.exchangeName,
            differentExchange,
            matches,
            marketType: p.market_type,
          });
        }

        if (!pairBase || !pairAssetClass || !matches) return null;

        return p.exchanges
          .filter((ex) => ex !== account.exchangeName)
          .map((ex) => ({
            value: `${p.id}@${ex}`,
            pairId: p.id,
            exchange: ex,
            pairName: p.id,
          }));
      })
      .filter((p) => p !== null)
      .flat()
      .sort((a, b) => a.exchange.localeCompare(b.exchange));

    // Log PERP pairs specifically to see their exchanges
    const perpPairs = btcPairs.filter((p) => {
      const assetClass = extractAssetClassFromPairId(p.id, p.market_type);
      return assetClass === 'PERP';
    });
    console.log(
      '[ReferencePairs] PERP pairs with exchanges:',
      perpPairs.map((p) => ({
        pairId: p.id,
        exchanges: p.exchanges,
        accountExchange: account.exchangeName,
        hasDifferentExchange: !p.exchanges.includes(account.exchangeName),
      }))
    );

    console.log('[ReferencePairs] All available pairs:', allPairs);
    console.log('[ReferencePairs] Total token pairs checked:', initialLoadValue.tokenPairs.length);
    console.log('[ReferencePairs] Total BTC pairs found:', btcPairs.length);
    console.log('[ReferencePairs] PERP pairs found:', perpPairs.length);

    return allPairs;
  }, [
    currentPair,
    initialLoadValue?.tokenPairs,
    account?.exchangeName,
    extractBaseFromPairId,
    extractAssetClassFromPairId,
  ]);

  // Find the selected reference pair
  const selectedReferencePair = useMemo(() => {
    if (!referenceExchange || referencePrice !== 'other_exchange') return null;
    return availableReferencePairs.find((p) => p.value === referenceExchange) || null;
  }, [referenceExchange, referencePrice, availableReferencePairs]);

  // Set default reference pair when pair or account changes
  useEffect(() => {
    if (referencePrice === 'other_exchange' && availableReferencePairs.length > 0 && !referenceExchange) {
      setReferenceExchange(availableReferencePairs[0].value);
    }
  }, [pair, account, availableReferencePairs, referencePrice, referenceExchange, setReferenceExchange]);
  const quoteSymbol = useMemo(() => {
    if (currentPair?.quote) return currentPair.quote;
    const id = currentPair?.id || '';
    const lastSep = Math.max(id.lastIndexOf('-'), id.lastIndexOf(':'));
    if (lastSep >= 0) return id.substring(lastSep + 1);
    return 'USDT';
  }, [currentPair]);

  const baseAvailableMargin = useMemo(() => {
    try {
      if (!account || !currentPair || !initialLoadValue?.accounts) return null;

      const baseBalance = (() => {
        const marginBal = calculateMarginBalance(quoteSymbol, {
          selectedAccounts: [account.name],
          selectedPair: currentPair,
          accounts: initialLoadValue.accounts,
        });

        if (marginBal && marginBal > 0) return marginBal;

        const assetBal = calculateAssetBalance(quoteSymbol, {
          selectedAccounts: [account.name],
          selectedPair: currentPair,
          accounts: initialLoadValue.accounts,
        });

        return assetBal || 0;
      })();

      return baseBalance;
    } catch (_) {
      return null;
    }
  }, [account, currentPair, quoteSymbol, calculateMarginBalance, calculateAssetBalance, initialLoadValue]);

  const availableMargin = useMemo(() => {
    if (baseAvailableMargin == null) return null;
    if (!currentPair || currentPair.market_type === 'spot') return baseAvailableMargin;

    const leverageValue = Number(leverage?.leverage);
    if (!Number.isFinite(leverageValue) || leverageValue <= 0) return baseAvailableMargin;
    return baseAvailableMargin * leverageValue;
  }, [baseAvailableMargin, currentPair, leverage?.leverage]);

  // Calculate inventory (actual asset balance)
  const inventory = useMemo(() => {
    try {
      if (!account || !currentPair || !initialLoadValue?.accounts) return null;

      const assetBal = calculateAssetBalance(quoteSymbol, {
        selectedAccounts: [account.name],
        selectedPair: currentPair,
        accounts: initialLoadValue.accounts,
      });

      return assetBal || 0;
    } catch (_) {
      return null;
    }
  }, [account, currentPair, quoteSymbol, calculateAssetBalance, initialLoadValue]);

  const showSpotWarning = useMemo(() => {
    return Boolean(currentPair && currentPair.market_type === 'spot');
  }, [currentPair]);

  const showBudgetWarning = useMemo(() => {
    if (!feeAmount || availableMargin == null) return false;
    const numericFee = parseFloat(String(feeAmount).replace(/,/g, ''));
    return numericFee > availableMargin;
  }, [feeAmount, availableMargin]);

  // Calculate exposure tolerance based on mode (same logic as useMarketMakerForm)
  const exposureTolerance = useMemo(() => {
    const passiveness = 0.04;
    return passiveness * 2 + 0.01;
  }, []);

  // Calculate recommended inventory (same logic as in analytics component)
  const recommendedMargin = useMemo(() => {
    const numericVolume = parseFloat(String(volumeAmount).replace(/,/g, ''));
    if (!numericVolume || !currentPair) return null;

    // For long/short bias (non-zero directional bias), use fixed calculation across all modes
    if (directionalBias !== 0) {
      const baseMargin = 0.06 * numericVolume * 1.5;
      return baseMargin;
    }

    let baseMargin;

    // Spot: exposure * notional target
    if (currentPair.market_type === 'spot') {
      baseMargin = numericVolume * exposureTolerance;
    } else {
      // Derivatives: notional / leverage with safety buffer
      if (!leverage?.leverage) return null;

      // Safety buffer based on mode
      const safetyBufferByMode = {
        aggressive: 2.0,
        normal: 1.0,
        passive: 0.5,
      };
      const safetyBuffer = safetyBufferByMode[mode] || 1.0;

      baseMargin = (numericVolume / leverage.leverage) * safetyBuffer;
    }

    return baseMargin;
  }, [volumeAmount, currentPair, leverage, mode, directionalBias, exposureTolerance]);

  const numericDerivedNotional = useMemo(() => {
    const value = parseFloat(String(derivedNotional || '').replace(/,/g, ''));
    return Number.isFinite(value) ? value : null;
  }, [derivedNotional]);

  const highLeverageWarningMessage = useMemo(() => {
    const leverageValue = Number(leverage?.leverage);
    if (!Number.isFinite(leverageValue) || leverageValue <= 20) return null;

    return 'The MM bot will not accept leverage higher than 20x.';
  }, [leverage?.leverage]);

  const highLeverageVolatilityWarningMessage = useMemo(() => {
    if (!numericDerivedNotional || !recommendedMargin) return null;

    const leverageValue = Number(leverage?.leverage);
    if (!Number.isFinite(leverageValue) || leverageValue <= 10 || leverageValue > 20) return null;

    const baseMarginWithoutBuffer = numericDerivedNotional / leverageValue;
    const twoXBufferMargin = baseMarginWithoutBuffer * 2;
    if (recommendedMargin >= twoXBufferMargin) return null;

    const riskPercent = 2 * (100 / leverageValue);
    const formattedRisk =
      riskPercent % 1 === 0 ? `${riskPercent.toFixed(0)}%` : `${riskPercent.toFixed(2).replace(/\.?0+$/, '')}%`;

    return `A higher leverage will be more capital efficient, but there is a higher chance of liquidation during times of higher volatility (${formattedRisk}).`;
  }, [numericDerivedNotional, recommendedMargin, leverage?.leverage]);

  const isLeverageTooHigh = useMemo(() => {
    const leverageValue = Number(leverage?.leverage);
    return Number.isFinite(leverageValue) && leverageValue > 20;
  }, [leverage?.leverage]);

  // Check if inventory is critically low (< 25% of recommended inventory)
  // Compare recommended inventory to actual inventory (asset balance)
  const showMarginWarning = useMemo(() => {
    if (!recommendedMargin || inventory == null) return false;
    return inventory < recommendedMargin * 0.25;
  }, [recommendedMargin, inventory]);

  // Count active orders (statuses: ACTIVE, RUNNING, PAUSED, PENDING, FINISHER)
  const activeOrderCount = useMemo(() => {
    if (!Array.isArray(activeOrders)) return 0;
    const activeStatuses = ['ACTIVE', 'RUNNING', 'PAUSED', 'FINISHER', 'PENDING'];
    return activeOrders.filter((order) => activeStatuses.includes(String(order?.status || '').toUpperCase())).length;
  }, [activeOrders]);

  // Check if user has 10 or more active orders
  const hasMaxActiveOrders = useMemo(() => {
    return activeOrderCount >= 10;
  }, [activeOrderCount]);

  // Check if there's an active order with the same account and symbol
  const hasDuplicateOrder = useMemo(() => {
    if (!account || !pair || !Array.isArray(activeOrders)) return false;

    const activeStatuses = ['ACTIVE', 'RUNNING', 'PAUSED', 'FINISHER', 'PENDING'];

    return activeOrders.some((order) => {
      // Check if order is active
      if (!activeStatuses.includes(order.status)) return false;

      // Check if same account
      const orderAccounts = order.accounts || order.account_names || [];
      const hasMatchingAccount = orderAccounts.includes(account.name);

      // Check if same symbol (pair)
      const orderPairs = (order.pairs || '').split(',').map((p) => p.trim());
      const hasMatchingPair = orderPairs.includes(pair);

      return hasMatchingAccount && hasMatchingPair;
    });
  }, [account, pair, activeOrders]);

  // Check minimum fee requirement ($1)
  const meetsMinimumFee = useMemo(() => {
    if (!feeAmount) return false;
    const numericFee = parseFloat(String(feeAmount).replace(/,/g, ''));
    return numericFee >= 1;
  }, [feeAmount]);

  // Check minimum margin requirement ($500)
  const meetsMinimumMargin = useMemo(() => {
    if (availableMargin == null) return false;
    return availableMargin >= 500;
  }, [availableMargin]);

  // Check if requirements are not met (only show if all fields are filled in)
  const showMinimumRequirementsWarning = useMemo(() => {
    // Only show warning if all fields are filled in
    if (!account || !feeAmount || !volumeAmount || !pair) {
      return false;
    }
    // Don't show warning if available margin is not available or 0
    if (availableMargin == null || availableMargin === 0) {
      return false;
    }
    return !meetsMinimumFee || !meetsMinimumMargin;
  }, [meetsMinimumFee, meetsMinimumMargin, account, feeAmount, volumeAmount, pair, availableMargin]);

  // Generate minimum requirements warning message
  const minimumRequirementsMessage = useMemo(() => {
    if (!meetsMinimumFee && !meetsMinimumMargin) {
      return 'Minimum requirements not met: Budget must be at least $1 and Available Margin must be at least $500.';
    }
    if (!meetsMinimumFee) {
      return 'Minimum budget requirement not met: Budget must be at least $1.';
    }
    return 'Minimum margin requirement not met: Available Margin must be at least $500.';
  }, [meetsMinimumFee, meetsMinimumMargin]);

  // Check if volume warning should be shown (only if volume is not empty)
  const showVolumeWarning = useMemo(() => {
    return Boolean(exceedsVolumeLimit && derivedNotional && pair && volumeAmount);
  }, [exceedsVolumeLimit, derivedNotional, pair, volumeAmount]);

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
      root.style.removeProperty('--market-maker-footer-gap');
      return undefined;
    }

    root.style.setProperty('--market-maker-footer-gap', mobileContentPaddingBottom);
    return () => {
      root.style.removeProperty('--market-maker-footer-gap');
    };
  }, [isMobile, mobileContentPaddingBottom]);

  if (isMobile) {
    return (
      <>
        <Stack direction='column' spacing={2} sx={{ width: '100%', pb: mobileContentPaddingBottom }}>
          {/* Account Selection */}
          <Stack direction='column' spacing={1}>
            <Tooltip arrow title='Select the exchange account to use for market making.'>
              <Typography variant='small1'>Account</Typography>
            </Tooltip>
            <MarketMaketAccountSelector account={account} accounts={tradableAccounts} onSelectAccount={setAccount} />
          </Stack>

          {/* Budget & Volume Row */}
          <Stack direction='column' spacing={1}>
            <Stack alignItems='center' direction='row' spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TreadTooltip
                  color='text.secondary'
                  labelTextVariant='body1'
                  placement='left'
                  title='Amount of money to spend on fees to run the bot.'
                  underline={false}
                  variant='market_maker_budget'
                />
              </Box>
              <Tooltip arrow title='Budget and Volume are linked based on estimated trading fees'>
                <LinkIcon sx={{ color: 'text.secondary' }} />
              </Tooltip>
              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <TreadTooltip
                  color='text.secondary'
                  labelTextVariant='body1'
                  placement='left'
                  underline={false}
                  variant='market_maker_volume'
                />
              </Box>
            </Stack>
            <Stack alignItems='center' direction='row' spacing={2}>
              <Paper
                elevation={1}
                sx={{ p: 2, minHeight: 56, display: 'flex', alignItems: 'center', position: 'relative', flex: 1 }}
              >
                {isSyncing && activeField === 'volume' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                    }}
                  >
                    <CircularProgress size={20} />
                  </Box>
                )}
                <TextField
                  fullWidth
                  autoComplete='off'
                  disabled={isSyncing && activeField === 'volume'}
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
                  value={feeAmount}
                  variant='standard'
                  onBlur={handleFeeBlur}
                  onChange={(e) => setFeeAmount(e.target.value)}
                />
              </Paper>

              <Paper
                elevation={1}
                sx={{ p: 2, minHeight: 56, display: 'flex', alignItems: 'center', position: 'relative', flex: 1 }}
              >
                {isSyncing && activeField === 'fee' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                    }}
                  >
                    <CircularProgress size={20} />
                  </Box>
                )}
                <TextField
                  fullWidth
                  autoComplete='off'
                  disabled={isSyncing && activeField === 'fee'}
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
                  value={volumeAmount}
                  variant='standard'
                  onBlur={handleVolumeBlur}
                  onChange={(e) => setVolumeAmount(e.target.value)}
                />
              </Paper>
            </Stack>
          </Stack>

          {/* Pair & Leverage */}
          <Stack direction='column' spacing={1}>
            <Tooltip arrow title='Select the trading pair and leverage multiplier (for derivatives only).'>
              <Typography variant='small1'>Pair & Leverage</Typography>
            </Tooltip>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                minHeight: 56,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Stack
                alignItems='center'
                direction='row'
                spacing={1}
                sx={{ justifyContent: 'space-between', width: '100%' }}
              >
                <Box sx={{ flex: 1, pr: 2 }}>
                  <MarketMakerPairSelector
                    pair={pair}
                    pairs={tradeablePairs}
                    onOpenChange={() => {}}
                    onSelectPair={setPair}
                  />
                </Box>
                <Box sx={{ width: 64 }}>
                  <LeverageChip
                    adjustLeverage={adjustLeverage}
                    disabled={!account || !currentPair || currentPair.market_type === 'spot'}
                    exchange={leverage?.exchange}
                    leverage={leverage?.leverage}
                    maxLeverage={maxLeverage}
                    pairId={pair}
                  />
                </Box>
              </Stack>
            </Paper>
          </Stack>

          {/* Strategy, Chase Decay & Bias */}
          <MarketMakerModeSelector mode={mode} setMode={setMode} tradeableModes={tradeableModes} />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: '100%' }}>
            <DirectionalBiasButtons
              directionalBias={directionalBias}
              setDirectionalBias={setDirectionalBias}
              sx={{ flex: 1 }}
            />
            <MarketMakerChaseDecaySelector
              chaseDecayMode={chaseDecayMode}
              durationMinutes={derivedDurationMinutes}
              setChaseDecayMode={setChaseDecayMode}
            />
          </Stack>
          {/* Warnings */}
          {showMinimumRequirementsWarning && (
            <Alert
              severity='error'
              sx={{ borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}
              variant='outlined'
            >
              <Typography variant='body2'>{minimumRequirementsMessage}</Typography>
            </Alert>
          )}
          {showMarginWarning && (
            <Alert
              severity='error'
              sx={{ borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}
              variant='outlined'
            >
              <Typography variant='body2'>
                Insufficient margin: Available margin is less than 25% of recommended. Please choose a smaller budget,
                increase leverage, or add more margin.
              </Typography>
            </Alert>
          )}
          {showSpotWarning && (
            <Alert
              icon={false}
              severity='warning'
              sx={{ borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}
              variant='outlined'
            >
              <Typography variant='body2'>
                For SPOT pairs, ensure you hold at least half of the recommended inventory in the SPOT token.
              </Typography>
            </Alert>
          )}
          {showVolumeWarning && (
            <Alert
              severity='error'
              sx={{ borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}
              variant='outlined'
            >
              <Typography variant='body2'>
                Order volume exceeds 20% of 24h volume. Please reduce the volume amount to proceed.
              </Typography>
            </Alert>
          )}
          {highLeverageWarningMessage && (
            <Alert
              icon={false}
              severity='warning'
              sx={{ borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}
              variant='outlined'
            >
              <Typography variant='body2'>{highLeverageWarningMessage}</Typography>
            </Alert>
          )}
          {highLeverageVolatilityWarningMessage && (
            <Alert
              icon={false}
              severity='warning'
              sx={{ borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}
              variant='outlined'
            >
              <Typography variant='body2'>{highLeverageVolatilityWarningMessage}</Typography>
            </Alert>
          )}
          {hasDuplicateOrder && (
            <Alert
              severity='error'
              sx={{ borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}
              variant='outlined'
            >
              <Typography variant='body2'>You cannot run the bot on the same symbol with the same account.</Typography>
            </Alert>
          )}
          {hasMaxActiveOrders && (
            <Alert
              severity='error'
              sx={{ borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}
              variant='outlined'
            >
              <Typography variant='body2'>
                You cannot have more than 10 bots running at once, please cancel a bot or wait for them to finish
              </Typography>
            </Alert>
          )}
        </Stack>

        {/* Combined Summary + CTA container */}
        <Portal>
          <Box
            sx={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1600,
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
                  {summaryOpen ? <ExpandMoreIcon /> : <ExpandLessIcon />}
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
                      <MarketMakerPreTradeAnalytics
                        amount={derivedNotional}
                        availableMargin={availableMargin}
                        baseAvailableMargin={baseAvailableMargin}
                        directionalBias={directionalBias}
                        estimatedFees={feeAmount}
                        exposureTolerance={exposureTolerance}
                        inventory={inventory}
                        isLoading={isSyncing && (activeField === 'fee' || activeField === 'volume')}
                        isSpot={Boolean(currentPair && currentPair.market_type === 'spot')}
                        leverage={leverage}
                        mode={mode}
                      />
                      <MarketMakerConfiguration
                        durationMinutes={derivedDurationMinutes}
                        participationRate={derivedParticipationRate}
                        passiveness={derivedPassiveness}
                      />
                      <LifetimeStats lifetime={lifetime} />
                    </Stack>
                  </Box>
                )}
                <Button
                  fullWidth
                  color='primary'
                  disabled={isSubmitting || !canSubmit || isLeverageTooHigh || hasMaxActiveOrders || hasDuplicateOrder}
                  sx={{ height: 48, mt: 0 }}
                  variant='contained'
                  onClick={handleSubmit}
                >
                  {isSubmitting ? <CircularProgress size={30} /> : 'Start Trading'}
                </Button>
                {hasMaxActiveOrders && (
                  <Alert
                    severity='error'
                    sx={{ borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}
                    variant='outlined'
                  >
                    <Typography variant='body2'>
                      You cannot have more than 5 bots running at once, please cancel a bot or wait for them to finish
                    </Typography>
                  </Alert>
                )}
                {showVolumeWarning && (
                  <Alert
                    severity='error'
                    sx={{ borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}
                    variant='outlined'
                  >
                    <Typography variant='body2'>
                      Order volume exceeds 10% of 24h volume. Please reduce the volume amount to proceed.
                    </Typography>
                  </Alert>
                )}
              </Stack>
            </Paper>
          </Box>
        </Portal>
      </>
    );
  }

  return (
    <Stack direction='row' spacing={4} sx={{ width: '100%' }}>
      {/* Left Section - Trading Controls */}
      <Stack direction='column' spacing={3} sx={{ flex: 7, minWidth: 0 }}>
        {/* Account Selection */}
        <Stack direction='column' spacing={1}>
          <Tooltip arrow title='Select the exchange account to use for market making.'>
            <Typography variant='small1'>Account</Typography>
          </Tooltip>
          <MarketMaketAccountSelector account={account} accounts={tradableAccounts} onSelectAccount={setAccount} />
        </Stack>

        {/* Trading Parameters Row - Fee | Volume | Pair */}
        <Stack direction='row' spacing={3} sx={{ width: '100%', alignItems: 'flex-end' }}>
          {/* Fee Budget */}
          <Stack direction='column' spacing={1} sx={{ flex: 1 }}>
            <TreadTooltip
              color={showBudgetWarning ? 'error.main' : 'text.secondary'}
              labelTextVariant='body1'
              placement='left'
              title={
                showBudgetWarning
                  ? `Budget exceeds available margin ($${availableMargin?.toFixed(2) || '0.00'})`
                  : 'Amount of money to spend on fees to run the bot.'
              }
              underline={false}
              variant='market_maker_budget'
            />
            <Paper
              elevation={1}
              sx={{ p: 2, minHeight: 56, display: 'flex', alignItems: 'center', position: 'relative' }}
            >
              {isSyncing && activeField === 'volume' && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}
                >
                  <CircularProgress size={20} />
                </Box>
              )}
              <TextField
                fullWidth
                autoComplete='off'
                disabled={isSyncing && activeField === 'volume'}
                InputProps={{
                  disableUnderline: true,
                  inputComponent: NumericFormatCustom,
                  inputProps: {
                    inputMode: 'decimal',
                  },
                  sx: {
                    input: {
                      textAlign: 'left',
                      fontSize: '1.5rem',
                      lineHeight: '1.875rem',
                      fontWeight: 400,
                      color: showBudgetWarning ? 'error.main' : 'inherit',
                    },
                  },
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Typography color='grey' variant='h3'>
                        $
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                placeholder='0'
                value={feeAmount}
                variant='standard'
                onBlur={handleFeeBlur}
                onChange={(e) => setFeeAmount(e.target.value)}
              />
            </Paper>
          </Stack>

          {/* Link Icon */}
          <Box sx={{ pb: '28px', display: 'flex', alignItems: 'center' }}>
            <Tooltip arrow title='Budget and Volume are linked based on estimated trading fees'>
              <LinkIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
            </Tooltip>
          </Box>

          {/* Volume */}
          <Stack direction='column' spacing={1} sx={{ flex: 1 }}>
            <TreadTooltip
              color='text.secondary'
              labelTextVariant='body1'
              placement='left'
              underline={false}
              variant='market_maker_volume'
            />
            <Paper
              elevation={1}
              sx={{ p: 2, minHeight: 56, display: 'flex', alignItems: 'center', position: 'relative' }}
            >
              {isSyncing && activeField === 'fee' && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                  }}
                >
                  <CircularProgress size={20} />
                </Box>
              )}
              <TextField
                fullWidth
                autoComplete='off'
                disabled={isSyncing && activeField === 'fee'}
                InputProps={{
                  disableUnderline: true,
                  inputComponent: NumericFormatCustom,
                  inputProps: {
                    inputMode: 'decimal',
                  },
                  sx: {
                    input: {
                      textAlign: 'left',
                      fontSize: '1.5rem',
                      lineHeight: '1.875rem',
                      fontWeight: 400,
                    },
                  },
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Typography color='grey' variant='h3'>
                        $
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                placeholder='0'
                value={volumeAmount}
                variant='standard'
                onBlur={handleVolumeBlur}
                onChange={(e) => setVolumeAmount(e.target.value)}
              />
            </Paper>
          </Stack>

          {/* Pair & Leverage */}
          <Stack direction='column' spacing={1} sx={{ flex: 2 }}>
            <Tooltip arrow title='Select the trading pair and leverage multiplier (for derivatives only).'>
              <Typography variant='small1'>Pair & Leverage</Typography>
            </Tooltip>
            <Paper elevation={1} sx={{ p: 2, minHeight: 56, display: 'flex', alignItems: 'center' }}>
              <Stack
                alignItems='center'
                direction='row'
                spacing={1}
                sx={{ justifyContent: 'space-between', width: '100%' }}
              >
                <Box sx={{ flex: 1, pr: 2 }}>
                  <MarketMakerPairSelector
                    directionalBias={directionalBias}
                    pair={pair}
                    pairs={tradeablePairs}
                    onOpenChange={() => {}}
                    onSelectPair={setPair}
                  />
                </Box>
                <Box sx={{ width: 64 }}>
                  <LeverageChip
                    adjustLeverage={adjustLeverage}
                    disabled={!account || !currentPair || currentPair.market_type === 'spot'}
                    exchange={leverage?.exchange}
                    leverage={leverage?.leverage}
                    maxLeverage={maxLeverage}
                    pairId={pair}
                  />
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Stack>

        {/* Strategy Selection, Chase Decay & Directional Bias */}
        <MarketMakerModeSelector mode={mode} setMode={setMode} tradeableModes={tradeableModes} />
        {/* Reference Price & Spread */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: '100%' }}>
          <Stack direction='column' spacing={1} sx={{ flex: 1, position: 'relative' }}>
            <Typography color='text.secondary' variant='small1'>
              Reference Price
            </Typography>
            <Box ref={referencePairTriggerRef}>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size='small'
                value={referencePrice}
                onChange={(_, val) => val && setReferencePrice(val)}
              >
                <Tooltip enterDelay={300} title='Mid Price: Uses native exchange mid price'>
                  <ToggleButton sx={{ cursor: 'pointer' }} value='mid'>
                    <Typography sx={{ fontWeight: (theme) => theme.typography.fontWeightBold }} variant='body2'>
                      Mid Price
                    </Typography>
                  </ToggleButton>
                </Tooltip>
                <Tooltip enterDelay={300} title='Grid Mode: Uses opposing leg execution price'>
                  <ToggleButton sx={{ cursor: 'pointer' }} value='grid'>
                    <Typography
                      color='warning.main'
                      sx={{ fontWeight: (theme) => theme.typography.fontWeightBold }}
                      variant='body2'
                    >
                      Grid Mode
                    </Typography>
                  </ToggleButton>
                </Tooltip>
                {isDev && (
                  <Tooltip enterDelay={300} title='Reference Exchange: Uses price from another exchange'>
                    <ToggleButton sx={{ cursor: 'pointer' }} value='other_exchange'>
                      {selectedReferencePair ? (
                        <Stack
                          alignItems='center'
                          direction='row'
                          spacing={1}
                          sx={{ width: '100%', justifyContent: 'center' }}
                        >
                          <ExchangeIcon
                            exchangeName={selectedReferencePair.exchange}
                            style={{ height: '16px', width: '16px', flexShrink: 0 }}
                          />
                          <Typography
                            noWrap
                            sx={{ fontWeight: (theme) => theme.typography.fontWeightBold }}
                            variant='body2'
                          >
                            {selectedReferencePair.pairName}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography sx={{ fontWeight: (theme) => theme.typography.fontWeightBold }} variant='body2'>
                          Reference
                        </Typography>
                      )}
                    </ToggleButton>
                  </Tooltip>
                )}
              </ToggleButtonGroup>
            </Box>
            <ReferencePairSelector
              availablePairs={availableReferencePairs}
              referencePrice={referencePrice}
              selectedValue={referenceExchange}
              triggerRef={referencePairTriggerRef}
              onSelect={setReferenceExchange}
            />
          </Stack>
          <Stack direction='column' spacing={1} sx={{ flex: 1 }}>
            <Typography color='text.secondary' variant='small1'>
              Spread
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size='small'
              value={spreadBps}
              onChange={(_, val) => val != null && setSpreadBps(val)}
            >
              {(spreadOptionsByReference[referencePrice] || []).map((option) => {
                const label = option > 0 ? `+${option}` : `${option}`;
                const color = (() => {
                  if (option > 0) return 'success.main';
                  if (option < 0) return 'error.main';
                  return 'text.primary';
                })();
                return (
                  <ToggleButton key={option} value={option}>
                    <Typography color={color} variant='body2'>{`${label} bps`}</Typography>
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          </Stack>
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: '100%' }}>
          <DirectionalBiasButtons
            directionalBias={directionalBias}
            setDirectionalBias={setDirectionalBias}
            sx={{ flex: 1 }}
          />
          <MarketMakerChaseDecaySelector
            chaseDecayMode={chaseDecayMode}
            durationMinutes={derivedDurationMinutes}
            setChaseDecayMode={setChaseDecayMode}
          />
        </Stack>

        {/* Warnings */}
        {hasMaxActiveOrders && (
          <Alert
            severity='error'
            sx={{ borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}
            variant='outlined'
          >
            <Typography variant='body2'>
              You cannot have more than 5 bots running at once, please cancel a bot or wait for them to finish
            </Typography>
          </Alert>
        )}
        {showMinimumRequirementsWarning && (
          <Alert
            severity='error'
            sx={{ borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}
            variant='outlined'
          >
            <Typography variant='body2'>{minimumRequirementsMessage}</Typography>
          </Alert>
        )}

        {showVolumeWarning && (
          <Alert
            severity='error'
            sx={{ borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}
            variant='outlined'
          >
            <Typography variant='body2'>
              Order volume exceeds 10% of 24h volume. Please reduce the volume amount to proceed.
            </Typography>
          </Alert>
        )}

        {showMarginWarning && (
          <Alert
            severity='error'
            sx={{ borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}
            variant='outlined'
          >
            <Typography variant='body2'>
              Insufficient margin: Available margin is less than 25% of recommended. Please choose a smaller budget,
              increase leverage, or add more margin.
            </Typography>
          </Alert>
        )}

        {showSpotWarning && (
          <Alert
            icon={false}
            severity='warning'
            sx={{ borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}
            variant='outlined'
          >
            <Typography variant='body2'>
              For SPOT pairs, ensure you hold at least half of the recommended inventory in the SPOT token.
            </Typography>
          </Alert>
        )}

        {highLeverageWarningMessage && (
          <Alert
            icon={false}
            severity='warning'
            sx={{ borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}
            variant='outlined'
          >
            <Typography variant='body2'>{highLeverageWarningMessage}</Typography>
          </Alert>
        )}

        {highLeverageVolatilityWarningMessage && (
          <Alert
            icon={false}
            severity='warning'
            sx={{ borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}
            variant='outlined'
          >
            <Typography variant='body2'>{highLeverageVolatilityWarningMessage}</Typography>
          </Alert>
        )}

        {hasDuplicateOrder && (
          <Alert
            severity='error'
            sx={{ borderRadius: 1, border: '1px solid', borderColor: 'error.main' }}
            variant='outlined'
          >
            <Typography variant='body2'>You cannot run the bot on the same symbol with the same account.</Typography>
          </Alert>
        )}
      </Stack>

      {/* Right Section - Analytics and Configuration */}
      <Stack direction='column' spacing={3} sx={{ flex: 2.7, minWidth: 0 }}>
        <MarketMakerPreTradeAnalytics
          amount={derivedNotional}
          availableMargin={availableMargin}
          baseAvailableMargin={baseAvailableMargin}
          directionalBias={directionalBias}
          estimatedFees={feeAmount}
          exposureTolerance={exposureTolerance}
          inventory={inventory}
          isLoading={isSyncing && (activeField === 'fee' || activeField === 'volume')}
          isSpot={Boolean(currentPair && currentPair.market_type === 'spot')}
          leverage={leverage}
          mode={mode}
        />

        <MarketMakerConfiguration
          durationMinutes={derivedDurationMinutes}
          participationRate={derivedParticipationRate}
          passiveness={derivedPassiveness}
        />

        <Divider />

        <LifetimeStats lifetime={lifetime} />

        <Button
          fullWidth
          color='primary'
          disabled={
            isSubmitting ||
            !canSubmit ||
            showMinimumRequirementsWarning ||
            isLeverageTooHigh ||
            hasMaxActiveOrders ||
            hasDuplicateOrder
          }
          sx={{ height: 48 }}
          variant='contained'
          onClick={handleSubmit}
        >
          {isSubmitting ? <CircularProgress size={30} /> : 'Start Trading'}
        </Button>
      </Stack>
    </Stack>
  );
}
