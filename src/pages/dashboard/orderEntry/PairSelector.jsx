import { Close, KeyboardArrowDown, KeyboardArrowUp, Search, Star, StarBorder } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Popper,
  Stack,
  TextField,
  Typography,
  Checkbox,
  FormControlLabel,
  Paper,
  Tabs,
  Tab,
  SwipeableDrawer,
  Tooltip,
  Chip,
  GlobalStyles,
  Skeleton,
} from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import KeyboardCommandKeyIcon from '@mui/icons-material/KeyboardCommandKey';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import debounce from 'lodash.debounce';
import { matchSorter } from 'match-sorter';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';
import useViewport from '@/shared/hooks/useViewport';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { useExchangeTicker } from '@/shared/context/ExchangeTickerProvider';
import { ChainIcon, TokenIcon, DexTokenIcon } from '@/shared/components/Icons';
import { getSupportedChains } from '@/shared/dexUtils';
import resolveExchangeName from '@/shared/utils/resolveExchangeName';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { renderBalanceWithSubscript } from '@/util/priceFormatting';
import { addUserFavouritePairs, deleteUserFavouritePairs } from '../../../apiServices';
import { prettyDollars, prettyPrice, smartRound, shortenNumber } from '../../../util';
import { useUserMetadata } from '../../../shared/context/UserMetadataProvider';
import { ExchangeIcons } from '../../../shared/iconUtil';
import { isolatedHolographicStyles, holographicShimmer } from '../../../theme/holographicEffects';
import useDexTokenSelector from './hooks/useDexTokenSelector';

// -----------------------------
// Token-aware Search Utilities
// -----------------------------
// These helpers implement parsing and scoring for more flexible search:
// - Single-letter base symbols (e.g., "H")
// - Collapsed base+quote (e.g., "HUSDT")
// - Fielded queries with ':' (e.g., "H:perp" or "H:usdt")

const INSTRUMENT_KEYWORDS = {
  perp: new Set(['PERP', 'PERPS', 'PERPETUAL', 'PERPETUALS', 'SWAP', 'SWAPS']),
  spot: new Set(['SPOT']),
  future: new Set(['FUTURE', 'FUTURES']),
};

function normalizeStr(s) {
  return (s || '').trim().toUpperCase();
}

function buildQuotesSet(pairs) {
  const quotes = new Set();
  (pairs || []).forEach((p) => {
    if (p && p.quote && p.chain_id === undefined) quotes.add(String(p.quote).toUpperCase());
  });
  return quotes;
}

function detectInstrument(token) {
  const t = normalizeStr(token);
  if (INSTRUMENT_KEYWORDS.perp.has(t)) return 'perp';
  if (INSTRUMENT_KEYWORDS.spot.has(t)) return 'spot';
  if (INSTRUMENT_KEYWORDS.future.has(t)) return 'future';
  return null;
}

function parseCollapsedBaseQuote(q, quotesSet) {
  const Q = normalizeStr(q);
  if (!Q) return null;
  // Try longest quote first to avoid USDC -> USD
  const quotes = Array.from(quotesSet);
  quotes.sort((a, b) => b.length - a.length);
  const foundQuote = quotes.find((quote) => {
    if (Q.endsWith(quote) && Q.length > quote.length) {
      const base = Q.slice(0, Q.length - quote.length);
      return base;
    }
    return false;
  });
  if (foundQuote) {
    const base = Q.slice(0, Q.length - foundQuote.length);
    return { base, quote: foundQuote };
  }
  return null;
}

function parseFielded(q, quotesSet) {
  // Examples: "H:perp", "H:usdt", "H:perp-usdt"
  const Q = normalizeStr(q);
  const [leftRaw, rightRaw] = Q.split(':');
  const left = normalizeStr(leftRaw);
  const right = normalizeStr(rightRaw || '');
  const out = { baseFilter: left || null, instrument: null, quote: null };
  if (!right) return out;

  // Split right side by common separators
  const tokens = right.replace(/[/-]/g, ' ').split(/\s+/).filter(Boolean);

  tokens.forEach((token) => {
    const inst = detectInstrument(token);
    if (inst && !out.instrument) {
      out.instrument = inst;
      return;
    }
    const isQuote = quotesSet.has(token);
    if (isQuote && !out.quote) {
      out.quote = token;
    }
  });
  return out;
}

function scorePairForQuery(pair, ctx) {
  // ctx: { type: 'single'|'collapsed'|'fielded'|'generic',
  //        Q, baseFilter, instrument, quote, collapsedBase, collapsedQuote }
  if (!pair || pair.chain_id !== undefined) return null; // Non-DEX only
  const base = String(pair.base || '').toUpperCase();
  const quote = String(pair.quote || '').toUpperCase();
  const instrument = pair.market_type; // 'perp' | 'spot' | 'future' | 'dex'

  let score = 0;

  if (ctx.type === 'single') {
    if (base === ctx.Q) score += 100;
    else if (base.startsWith(ctx.Q)) score += 80;
    else return null; // do not include broad substrings for 1-char
  } else if (ctx.type === 'collapsed') {
    // Require exact base match; prefer exact quote
    if (base !== ctx.collapsedBase) return null;
    score += 90; // base exact via collapsed intent
    if (quote === ctx.collapsedQuote) score += 30;
  } else if (ctx.type === 'fielded') {
    // Left side restricts base prefix
    if (ctx.baseFilter && !base.startsWith(ctx.baseFilter)) return null;
    if (ctx.baseFilter === base) score += 100;
    else if (ctx.baseFilter) score += 80; // prefix
    if (ctx.instrument && instrument === ctx.instrument) score += 30;
    if (ctx.quote && quote === ctx.quote) score += 30;
    if (ctx.instrument && ctx.quote && instrument === ctx.instrument && quote === ctx.quote) score += 10;
  } else if (ctx.type === 'generic') {
    // Generic fallback: mild preference for base/quote/instrument hits
    const { Q } = ctx;
    if (base.includes(Q)) score += base === Q ? 50 : 20;
    if (quote.includes(Q)) score += quote === Q ? 25 : 10;
    if (
      Q.length > 1 &&
      String(pair.id || '')
        .toUpperCase()
        .includes(Q)
    )
      score += 10;
    if (score === 0) return null;
  }

  // Small bump for volume to stabilize ordering among equals
  const vol = pair.ticker?.volume24hNotional || pair.price_info?.volume;
  if (vol !== undefined && vol !== null && !Number.isNaN(Number(vol))) {
    // Log-scale bump: avoid dominating the score
    score += Math.min(10, Math.log10(Number(vol) + 1));
  }
  return { pair, score };
}

// ---------------------------------
// Hyperliquid Label/Filter Utilities
// ---------------------------------
function isHyperliquidPerp(pair) {
  return pair && pair.market_type === 'perp' && Array.isArray(pair.exchanges) && pair.exchanges.includes('Hyperliquid');
}

function getHyperliquidPrefix(pair) {
  if (!isHyperliquidPerp(pair)) return null;
  const id = String(pair.id || '');
  const basePart = id.split(':')[0] || '';
  const underscoreIndex = basePart.indexOf('_');
  if (underscoreIndex <= 0) return null;
  return basePart.slice(0, underscoreIndex).toLowerCase();
}

function getHyperliquidDisplayLabel(pair) {
  if (!isHyperliquidPerp(pair)) return pair.label;
  const id = String(pair.id || pair.label || '');
  const [basePart, rest] = id.split(':');
  if (!basePart || basePart.indexOf('_') <= 0) return pair.label;
  const strippedBase = basePart.split('_').slice(1).join('_');
  return [strippedBase, rest].filter(Boolean).join(':');
}

const MARKET_TYPE_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Favorites', value: 'favorites' },
  { label: 'Spot', value: 'spot' },
  { label: 'Perps', value: 'perp' },
  { label: 'DEX', value: 'dex' },
  { label: 'Futures', value: 'future' },
];

// Chain configuration for DEX filtering
const CHAIN_CONFIGS = {
  1: { name: 'Ethereum', id: '1' },
  56: { name: 'BSC', id: '56' },
  8453: { name: 'Base', id: '8453' },
  501: { name: 'Solana', id: '501' },
};

const Cell = styled(Box)(() => ({
  fontSize: '0.85rem',
  padding: 1,
  justifySelf: 'center',
  alignSelf: 'center',
}));

const PairRow = styled(Stack)(({ theme }) => ({
  ...isolatedHolographicStyles(theme),
  '&:hover': {
    ...isolatedHolographicStyles(theme)['&:hover'],
    backgroundColor: 'text.offBlack',
  },
  '&::before': {
    ...isolatedHolographicStyles(theme)['&::before'],
    transition: 'transform 0.6s ease 0.1s',
  },
  '&::after': {
    ...isolatedHolographicStyles(theme)['&::after'],
    transition: 'opacity 0.3s ease 0.1s',
  },
  '&:hover::before': {
    transform: 'translateX(200%)',
  },
  '&:hover::after': {
    opacity: 0.12,
    animation: 'holographic-shimmer 5s ease-in-out 0.1s forwards',
  },
  // Override the pointer-events: none for the favorites button
  '&:hover .MuiIconButton-root': {
    pointerEvents: 'auto',
  },
}));

function Row({ index, style, data }) {
  const {
    pairs,
    favourites,
    toggleFavorite,
    balanceEnabled,
    selectedItemIndex,
    onSelectPair,
    isMobile,
    pairColumnWidth,
    exchangeColumnWidth,
    balanceColumnWidth,
    dailyChangeColumnWidth,
    volumeColumnWidth,
    selectedAccounts,
    accounts,
    selectedMarketType,
  } = data;
  const pair = pairs[index];
  if (pair.header) {
    return (
      <Button
        fullWidth
        endIcon={pair.expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{
          ...style,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: selectedItemIndex === index ? 'text.offBlack' : '',
        }}
        variant='secondary'
        onClick={pair.onClick}
      >
        <Typography color='grey' variant='body1'>
          {pair.header}
        </Typography>
      </Button>
    );
  }

  const isToken = pair.chain_id !== undefined;
  const iconStyle = { height: '1.4rem', width: '1.4rem', borderRadius: '50%' };

  const pairDisplayIcon = isToken
    ? DexTokenIcon({
        tokenAddress: pair.address,
        chainId: pair.chain_id,
        style: iconStyle,
        logoUrl: pair.logo_url,
      })
    : TokenIcon({ tokenName: pair.id, style: iconStyle });

  const renderBalance = () => {
    // For DexTab, use existing utility for better formatting of small values
    if (selectedMarketType === 'dex' && pair.balance > 0) {
      return (
        <Stack direction='row' gap={1}>
          <Typography variant='body3'>${renderBalanceWithSubscript(pair.balance)}</Typography>
        </Stack>
      );
    }

    return (
      <Stack direction='row' gap={1}>
        <Typography variant='body3'>{pair.balance > 0 ? prettyDollars(pair.balance) : '-'}</Typography>
      </Stack>
    );
  };

  const favouriteOnClick = (event) => {
    event.stopPropagation();
    toggleFavorite(pair.id);
  };

  const isFavourited = favourites[pair.id];
  const volume = pair.ticker?.volume24hNotional || pair.price_info?.volume;
  const pricePctChange = pair.ticker?.pricePctChange24h || pair.price_info?.change;

  let priceChangeColor;
  if (pricePctChange) {
    priceChangeColor = pricePctChange > 0 ? 'side.buy' : 'side.sell';
  }

  const { isAvailable } = pair;

  const rowContent = (
    <PairRow
      direction='row'
      spacing={1}
      style={{ ...style, width: '100%' }}
      sx={{
        backgroundColor: selectedItemIndex === index ? 'text.offBlack' : '',
        cursor: isAvailable ? 'pointer' : 'not-allowed',
        opacity: isAvailable ? 1 : 0.4,
        '&:hover': {
          backgroundColor: isAvailable ? 'text.offBlack' : 'inherit',
        },
      }}
      onClick={() => isAvailable && onSelectPair(pair)}
    >
      <Cell width={pairColumnWidth}>
        <Stack alignItems='center' direction='row' spacing={1}>
          <IconButton
            disabled={!pair.isAvailable}
            sx={{
              color: isFavourited ? 'primary.main' : 'grey.main',
            }}
            onClick={favouriteOnClick}
          >
            {isFavourited ? <Star sx={{ fontSize: '1rem' }} /> : <StarBorder sx={{ fontSize: '1rem' }} />}
          </IconButton>
          <Box
            sx={{
              height: '1.4rem',
              width: '1.4rem',
              minHeight: '1.4rem',
              minWidth: '1.4rem',
              position: 'relative',
            }}
          >
            {pairDisplayIcon}
            {isToken && (
              <Box bottom={0} position='absolute' right={0} sx={{ transform: 'translate(25%, 25%)' }}>
                <ChainIcon chainId={pair.chain_id} style={{ height: '0.75rem', width: '0.75rem' }} />
              </Box>
            )}
          </Box>

          <Tooltip
            arrow
            PopperProps={{
              sx: {
                zIndex: 9999,
              },
            }}
            title={isToken && pair.address}
          >
            <Typography
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              variant='body3'
            >
              {pair.displayLabel || pair.label} {isToken && <span style={{ color: 'gray' }}>{pair.name}</span>}
            </Typography>
          </Tooltip>
        </Stack>
      </Cell>
      {!isMobile && <Cell width={balanceColumnWidth}>{balanceEnabled && renderBalance()}</Cell>}
      {!isMobile && (
        <Cell width={dailyChangeColumnWidth}>
          <Typography color={priceChangeColor} variant='body3'>
            {pricePctChange ? `${smartRound(pricePctChange, 2)}%` : '-'}
          </Typography>
        </Cell>
      )}
      <Cell width={volumeColumnWidth}>
        <Typography variant='body3'>{volume ? `$${shortenNumber(volume)}` : '-'}</Typography>
      </Cell>
      <Cell width={exchangeColumnWidth}>
        {isToken ? (
          <Typography variant='body3'>
            {pair.price_info?.market_cap ? `$${shortenNumber(pair.price_info.market_cap)}` : '-'}
          </Typography>
        ) : (
          <ExchangeIcons exchanges={pair.exchanges} pairId={pair.id} />
        )}
      </Cell>
    </PairRow>
  );

  // Simple tooltip for disabled DEX tokens - no wrapper needed

  return rowContent;
}

function TableHeader({ text, width, onSort = null, asc = null, textStyle = {} }) {
  const [hover, setHover] = useState(false);
  const sortProps = onSort
    ? {
        sx: { cursor: 'pointer' },
        onClick: onSort,
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
      }
    : {};

  let SortIcon = null;
  if (asc !== null) {
    SortIcon = asc ? ExpandLessIcon : ExpandMoreIcon;
  }

  return (
    <Cell align='left' width={width} {...sortProps}>
      <Stack alignItems='center' direction='row' justifyContent='flex-start' spacing={1}>
        <Typography variant='small1' {...textStyle}>
          {text}
        </Typography>
        {hover && SortIcon === null ? (
          <ExpandMoreIcon fontSize='small' sx={{ color: 'info' }} />
        ) : (
          SortIcon !== null && <SortIcon fontSize='small' sx={{ color: 'info' }} />
        )}
      </Stack>
    </Cell>
  );
}

function PairSelector({
  accounts,
  balances,
  favourites,
  multiOrder = false,
  ChainedOrders = false,
  pairs,
  tokens,
  selectedAccounts,
  selectedPairName,
  setFavourites,
  setSelectedPair,
  showAlert,
  handlePairSelect = undefined,
}) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmedSearchQuery, setConfirmedSearchQuery] = useState('');
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);

  // Get the currently selected pair to determine default market type
  const { selectedPair } = useOrderForm();

  // Default tab: Favorites if user has any favorites, else All
  const hasAnyFavorites = useMemo(() => Object.values(favourites || {}).some(Boolean), [favourites]);
  const [selectedMarketType, setSelectedMarketType] = useState(hasAnyFavorites ? 'favorites' : 'all');

  const listRef = useRef(null);
  const searchRef = useRef(null);
  const popperRef = useRef(null);
  const pairDisplayRef = useRef(null);
  const { isMobile } = useViewport();

  const { setBaseQtyPlaceholder, setQuoteQtyPlaceholder, resetForm } = useOrderForm();

  const pairColumnWidth = isMobile ? '50%' : '30%';
  const exchangeColumnWidth = isMobile ? '25%' : '15%';
  const balanceColumnWidth = '20%';
  const dailyChangeColumnWidth = '15%';
  const volumeColumnWidth = isMobile ? '25%' : '20%';

  const [expandedMarkets, setExpandedMarkets] = useState({
    perp: true,
    spot: true,
    future: true,
    dex: true,
  });
  const [columnSort, setColumnSort] = useState({
    column: 'volume',
    asc: false,
  });
  const [hideZeroBalances, setHideZeroBalances] = useState(false);
  const [selectedChains, setSelectedChains] = useState([]);
  const [selectedExchanges, setSelectedExchanges] = useState([]);

  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  const { user } = useUserMetadata();

  const { tokenList, tokenListLoading, handleSearchToken } = useDexTokenSelector(selectedChains);

  const handleSearchTokenCallback = useCallback(
    (s) => {
      if (ChainedOrders || multiOrder) {
        return;
      }
      handleSearchToken(s);
    },
    [handleSearchToken, ChainedOrders, multiOrder]
  );

  // Use the existing useTokenBalances hook for DEX token balances
  // For DexTab, include all DEX accounts regardless of selection state
  const { tokenBalances } = useTokenBalances(selectedAccounts, selectedMarketType === 'dex');

  // Prefer transformed label for selected Hyperliquid pairs
  const currentSelectedDisplayName = useMemo(() => {
    if (selectedPair) {
      return getHyperliquidDisplayLabel(selectedPair) || selectedPairName;
    }
    return selectedPairName;
  }, [selectedPair, selectedPairName]);

  const toggleExpandedMarket = (market) => {
    setExpandedMarkets((prev) => ({ ...prev, [market]: !prev[market] }));
  };

  const toggleColumnSort = (toggledColumn) => {
    const { column, asc } = columnSort;
    setColumnSort({
      column: toggledColumn,
      asc: toggledColumn === column ? !asc : true,
    });
  };

  const toggleHideZeroBalances = (event) => {
    setHideZeroBalances((prev) => !prev);
  };

  const toggleChainFilter = (chainId) => {
    setSelectedChains((prev) => {
      if (prev.includes(chainId)) {
        return prev.filter((id) => id !== chainId);
      }
      return [...prev, chainId];
    });
  };

  const toggleExchangeFilter = (exchangeName) => {
    setSelectedExchanges((prev) => {
      if (prev.includes(exchangeName)) {
        return prev.filter((name) => name !== exchangeName);
      }
      return [...prev, exchangeName];
    });
  };
  const saveToBackend = (pair, isFavorited) => {
    // Replace with your actual backend call
    if (isFavorited) {
      try {
        addUserFavouritePairs([pair]);
      } catch (error) {
        showAlert({
          severity: 'error',
          message: `Failed to add pair to favorites: ${error.message}`,
        });
        return false;
      }
    } else {
      try {
        deleteUserFavouritePairs([pair]);
      } catch (error) {
        showAlert({
          severity: 'error',
          message: `Failed to remove pair from favorites: ${error.message}`,
        });
        return false;
      }
    }

    return true;
  };

  const toggleFavorite = (pair) => {
    setFavourites((prevFavorites) => {
      const newFavorites = { ...prevFavorites, [pair]: !prevFavorites[pair] };
      const saveSuccess = saveToBackend(pair, newFavorites[pair]);

      if (!saveSuccess) {
        return prevFavorites;
      }

      return newFavorites;
    });
  };

  const handleClick = (event) => {
    if (anchorEl) {
      setAnchorEl(null);
      return;
    }

    setAnchorEl(event?.currentTarget || pairDisplayRef.current);
    if (pairDisplayRef.current) {
      pairDisplayRef.current.focus();
    }
  };

  const handleMarketTypeButtonClick = (buttonType) => {
    setSelectedMarketType(buttonType);
    setSelectedExchanges([]);
    // Reset sorting to default (volume desc) when switching tabs
    setColumnSort({
      column: 'volume',
      asc: false,
    });
  };

  const debouncedHandleSearchChange = useCallback(
    debounce((event) => {
      setConfirmedSearchQuery(event.target.value);
      handleSearchTokenCallback(event.target.value);
      if (event.target.value !== '') {
        setAnchorEl(pairDisplayRef.current);
      }
    }, 1000),
    [handleSearchTokenCallback]
  );

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    debouncedHandleSearchChange(event);
  };

  const open = Boolean(anchorEl);

  const handleClose = () => {
    setAnchorEl(null);
  };

  /**
   * Set selected chains based on selected accounts
   * Filter DEX chains based on wallet types of selected accounts
   */
  useEffect(() => {
    if (selectedAccounts && selectedAccounts.length > 0) {
      const allConnectedChains = new Set();
      selectedAccounts.forEach((accountId) => {
        const account = accounts[accountId];
        if (account?.exchangeName === 'OKXDEX') {
          const supportedChains = getSupportedChains(account.walletType);
          supportedChains.forEach((chainId) => allConnectedChains.add(chainId));
        }

        if (account?.exchangeName === 'Hyperliquid') {
          const unitPairName = `U${selectedPairName}`;
          const unitPair = pairs?.find((pair) => pair.id === unitPairName);
          if (unitPair) {
            showAlert({
              severity: 'warning',
              message: `Did you mean ${unitPairName}?`,
            });
          }
        }
      });

      // Only update if we have DEX accounts with supported chains
      if (allConnectedChains.size > 0) {
        setSelectedChains(Array.from(allConnectedChains));
      }
    } else {
      // If no accounts selected, show all chains (current behavior)
      setSelectedChains([]);
    }
  }, [selectedAccounts, accounts]);

  /**
   * Update selected market type when selected pair changes
   */
  useEffect(() => {
    if (selectedPair && selectedPair.market_type) {
      setSelectedMarketType(selectedPair.market_type);
    } else if (!selectedPair) {
      // If no pair is selected, default to Favorites if any, else All
      setSelectedMarketType(hasAnyFavorites ? 'favorites' : 'all');
    }
    // Reset sorting to default (volume desc) when market type changes
    setColumnSort({
      column: 'volume',
      asc: false,
    });
  }, [selectedPair, hasAnyFavorites]);

  /**
   * Focus on search bar if ref is rendered
   */
  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  }, [searchRef.current]);

  /**
   * Short ctrl/cmd + k to open pair selector
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!multiOrder && !ChainedOrders && (event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        handleClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [anchorEl, multiOrder, ChainedOrders]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popperRef.current &&
        !popperRef.current.contains(event.target) &&
        !pairDisplayRef.current.contains(event.target)
      ) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [popperRef]);

  const { tickerData } = useExchangeTicker();

  // Get unique exchanges from pairs for the current market type
  const getUniqueExchanges = useMemo(() => {
    if (selectedMarketType === 'dex' || selectedMarketType === 'all' || selectedMarketType === 'favorites') {
      return [];
    }

    const marketPairs = pairs.filter((pair) => pair.market_type === selectedMarketType);
    const allExchanges = marketPairs.flatMap((pair) => pair.exchanges || []);

    // Include derived builder prefixes (e.g., 'xyz') for Hyperliquid perps
    const derivedPrefixes = new Set();
    if (selectedMarketType === 'perp') {
      marketPairs.forEach((p) => {
        const prefix = getHyperliquidPrefix(p);
        if (prefix) derivedPrefixes.add(prefix);
      });
    }

    return [...new Set([...allExchanges, ...derivedPrefixes])].sort();
  }, [pairs, selectedMarketType]);

  const calculateNotionalBalance = useCallback(
    (symbol, exchanges, isDexToken = false, tokenAddress = null, chainId = null) => {
      if (isDexToken) {
        // For DEX tokens, always use the aggregated balance from all connected wallets
        // The useTokenBalances hook with includeAllDexAccounts=true handles this aggregation
        const tokenKey = tokenAddress && chainId ? `${tokenAddress}:${chainId}` : symbol;
        const dexBalance = tokenBalances[tokenKey];

        return dexBalance ? dexBalance.notional : 0; // Use notional value for USD display
      }

      // Existing logic for regular trading pairs
      let totalAmount = 0;

      // Calculate qualified accounts inside the callback to avoid stale closure issues
      let qualifiedAccounts = [];
      if (accounts !== undefined) {
        qualifiedAccounts =
          selectedAccounts && selectedAccounts.length === 0
            ? Object.values(accounts)
            : selectedAccounts.map((accountId) => accounts[accountId]);
      }

      qualifiedAccounts
        .filter((account) => account?.exchangeName && exchanges.includes(account.exchangeName))
        .forEach((account) => {
          if (!balances[account.id]) {
            return;
          }

          balances[account.id].assets.forEach((asset) => {
            if (asset.symbol === symbol) {
              totalAmount += asset.notional;
            }
          });
        });

      return totalAmount;
    },
    [balances, accounts, selectedAccounts, tokenBalances, selectedMarketType]
  );

  const filteredPairs = useMemo(() => {
    let tradingPairs = [...pairs, ...tokenList];

    /**
     * Augment balance to pair
     */
    tradingPairs = tradingPairs.map((pair) => {
      const isDexToken = pair.chain_id !== undefined;
      const balance = calculateNotionalBalance(
        pair.is_contract ? pair.id : pair.base,
        pair.exchanges,
        isDexToken,
        pair.address,
        pair.chain_id
      );

      return {
        ...pair,
        balance,
      };
    });

    /**
     * Augment ticker data to pair
     */
    if (tickerData) {
      tradingPairs = tradingPairs.map((pair) => {
        const ticker = tickerData[pair.id];

        return {
          ...pair,
          ticker,
        };
      });
    }
    /**
     * Add isAvailable property based on selected accounts
     */
    if (selectedAccounts && selectedAccounts.length > 0) {
      tradingPairs = tradingPairs.map((pair) => {
        const isAvailable = selectedAccounts.some((accountId) => {
          const account = accounts[accountId];
          if (account?.exchangeName === 'OKXDEX') {
            // For DEX tokens, check if chain_id matches wallet type
            return getSupportedChains(account.walletType).includes(pair.chain_id);
          }
          return account?.exchangeName ? pair.exchanges.includes(resolveExchangeName(account.exchangeName)) : false;
        });

        return {
          ...pair,
          isAvailable,
        };
      });
    } else {
      tradingPairs = tradingPairs.map((pair) => {
        return {
          ...pair,
          isAvailable: true,
        };
      });
    }

    /**
     * Filter based on tab selection of [...market type, all, favourite]
     */
    if (selectedMarketType) {
      if (selectedMarketType === 'favorites') {
        tradingPairs = tradingPairs.filter((pair) => favourites[pair.id]);
      } else if (selectedMarketType !== 'all') {
        tradingPairs = tradingPairs.filter((pair) => pair.market_type === selectedMarketType);
      }
    }

    /**
     * Filter out 0 balances if selected
     */
    if (hideZeroBalances) {
      tradingPairs = tradingPairs.filter((pair) => pair.balance !== 0);
    }

    /**
     * Filter by selected chains for DEX tokens
     */
    if (selectedMarketType === 'dex' && selectedChains.length > 0) {
      tradingPairs = tradingPairs.filter((pair) => {
        const isToken = pair.chain_id !== undefined;
        return isToken && selectedChains.includes(pair.chain_id);
      });
    }

    /**
     * Filter by selected exchanges for non-DEX tokens
     */
    if (selectedMarketType !== 'dex' && selectedExchanges.length > 0) {
      tradingPairs = tradingPairs.filter((pair) => {
        // Direct exchange match
        if (pair.exchanges.some((exchange) => selectedExchanges.includes(exchange))) return true;
        // Derived builder prefix match for Hyperliquid perps
        if (selectedMarketType === 'perp') {
          const prefix = getHyperliquidPrefix(pair);
          if (prefix && selectedExchanges.includes(prefix)) return true;
        }
        return false;
      });
    }

    /**
     * Filter via search query (token-aware for non-DEX pairs)
     */
    if (confirmedSearchQuery) {
      const quotesSet = buildQuotesSet(pairs);
      const Q = normalizeStr(confirmedSearchQuery);
      const isSingle = Q.length === 1 && /[A-Z]/.test(Q);
      const hasColon = Q.includes(':');

      // Partition into non-DEX and DEX
      const nonDex = tradingPairs.filter((p) => p.chain_id === undefined);
      const dex = tradingPairs.filter((p) => p.chain_id !== undefined);

      let ctx = { type: 'generic', Q };
      if (isSingle) {
        ctx = { type: 'single', Q };
      } else if (hasColon) {
        const parsed = parseFielded(Q, quotesSet);
        ctx = { type: 'fielded', ...parsed };
      } else {
        const collapsed = parseCollapsedBaseQuote(Q, quotesSet);
        if (collapsed) ctx = { type: 'collapsed', collapsedBase: collapsed.base, collapsedQuote: collapsed.quote };
      }

      const scored = nonDex
        .map((p) => scorePairForQuery(p, ctx))
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.pair);

      // For DEX tokens or when token-aware scoring yields no results, fall back to matchSorter
      const dexMatched = matchSorter(dex, confirmedSearchQuery, {
        keys: ['label', 'name', 'id', 'base'],
        threshold: matchSorter.rankings.CONTAINS,
      });

      const fallback = scored.length + dexMatched.length === 0;
      tradingPairs = fallback
        ? matchSorter(tradingPairs, confirmedSearchQuery, {
            keys: ['id', 'label', 'base'],
            threshold: matchSorter.rankings.CONTAINS,
          })
        : [...scored, ...dexMatched];
    }

    /**
     * Sort pairs based on column sort selection
     */
    // Preserve search ranking when searching; otherwise apply column sort
    if (!confirmedSearchQuery) {
      const { column, asc } = columnSort;
      if (column === 'label') {
        tradingPairs.sort((a, b) => {
          const aLabel = a.displayLabel || a.label || '';
          const bLabel = b.displayLabel || b.label || '';
          return asc ? aLabel.localeCompare(bLabel) : bLabel.localeCompare(aLabel);
        });
      }
      if (column === 'balance') {
        tradingPairs.sort((a, b) => (asc ? a.balance - b.balance : b.balance - a.balance));
      }
      if (column === 'volume') {
        tradingPairs.sort((a, b) => {
          const volumeA = a.ticker?.volume24hNotional || a.price_info?.volume;
          const volumeB = b.ticker?.volume24hNotional || b.price_info?.volume;
          if (volumeA === undefined) return asc ? -1 : 1;
          if (volumeB === undefined) return asc ? 1 : -1;
          return asc ? volumeA - volumeB : volumeB - volumeA;
        });
      }
    }

    /**
     * Compute displayLabel for Hyperliquid perps with prefixed bases
     */
    tradingPairs = tradingPairs.map((pair) => ({
      ...pair,
      displayLabel: getHyperliquidDisplayLabel(pair),
    }));

    /**
     * Sort pairs to put favourites at beginning
     */
    const favouritePairs = tradingPairs.filter((pair) => favourites[pair.id]);
    const nonFavouritePairs = tradingPairs.filter((pair) => !favourites[pair.id]);
    tradingPairs = [...favouritePairs, ...nonFavouritePairs];

    /**
     * Add category groupings by market type for 'All' and 'Favorites' tabs
     * Sort pairs to group for category
     * Inject expandable button for each market type
     */
    if (selectedMarketType === 'all' || selectedMarketType === 'favorites') {
      const perps = tradingPairs.filter((p) => p.market_type === 'perp');
      const spots = tradingPairs.filter((p) => p.market_type === 'spot');
      const futures = tradingPairs.filter((p) => p.market_type === 'future');
      const dex = tradingPairs.filter((p) => p.market_type === 'dex');

      // For DEX grouping, only show count when searching (to avoid showing inaccurate limited count)
      const showDexCount = selectedMarketType === 'favorites' || confirmedSearchQuery;

      tradingPairs = [
        {
          header: `Perpetual(${perps.length})`,
          expanded: expandedMarkets.perp,
          onClick: () => toggleExpandedMarket('perp'),
        },
        ...(expandedMarkets.perp ? perps : []),
        {
          header: `Spot(${spots.length})`,
          expanded: expandedMarkets.spot,
          onClick: () => toggleExpandedMarket('spot'),
        },
        ...(expandedMarkets.spot ? spots : []),
        {
          header: `Future(${futures.length})`,
          expanded: expandedMarkets.future,
          onClick: () => toggleExpandedMarket('future'),
        },
        ...(expandedMarkets.future ? futures : []),
        {
          header: showDexCount ? `DEX(${dex.length})` : 'DEX',
          expanded: expandedMarkets.dex,
          onClick: () => toggleExpandedMarket('dex'),
        },
        ...(expandedMarkets.dex ? dex : []),
      ];
    }
    return tradingPairs;
  }, [
    pairs,
    selectedMarketType,
    confirmedSearchQuery,
    selectedAccounts,
    expandedMarkets,
    favourites,
    balances,
    columnSort,
    hideZeroBalances,
    selectedChains,
    selectedExchanges,
    tickerData,
    tokenList,
  ]);

  const handlePairChange = (pair) => {
    if (pair) {
      setBaseQtyPlaceholder(pair.base);
      setQuoteQtyPlaceholder(pair.quote);
    }
    setSelectedPair(pair);
    resetForm();
  };

  const onSelectPair = (pair) => {
    if (handlePairSelect) {
      handlePairSelect(pair);
    } else {
      handlePairChange(pair);
    }
    setSearchQuery('');
    setConfirmedSearchQuery('');
    handleSearchTokenCallback('');
    setAnchorEl(null);
  };

  /**
   * Hot keys to navigate pair selector
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        // Navigate tabs left
        event.preventDefault();
        const index = MARKET_TYPE_TABS.findIndex((mt) => mt.value === selectedMarketType);
        const newMarketType = MARKET_TYPE_TABS[Math.max(0, index - 1)].value;
        setSelectedMarketType(newMarketType);
        // Reset sorting to default (volume desc) when switching tabs
        setColumnSort({
          column: 'volume',
          asc: false,
        });
      } else if (event.key === 'ArrowRight') {
        // Navigate tabs right
        event.preventDefault();
        const index = MARKET_TYPE_TABS.findIndex((mt) => mt.value === selectedMarketType);
        const newMarketType = MARKET_TYPE_TABS[Math.min(MARKET_TYPE_TABS.length - 1, index + 1)].value;
        setSelectedMarketType(newMarketType);
        // Reset sorting to default (volume desc) when switching tabs
        setColumnSort({
          column: 'volume',
          asc: false,
        });
      } else if (event.key === 'ArrowUp') {
        // Navigate items up
        event.preventDefault();
        setSelectedItemIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === 'ArrowDown') {
        // Navigate items down
        event.preventDefault();
        setSelectedItemIndex((prev) => Math.min(prev + 1, filteredPairs.length - 1));
      } else if (event.key === 'Enter') {
        // Select pair. Collapse toggle on headers.
        event.preventDefault();
        if (selectedItemIndex < 0 || selectedItemIndex >= filteredPairs.length) return;
        const pair = filteredPairs[selectedItemIndex];
        if (!pair) return;
        if (pair.header) pair.onClick();
        else onSelectPair(pair);
      } else if (event.code === 'Space') {
        // Favourites pair. Collapse toggle on headers.
        event.preventDefault();

        if (selectedItemIndex < 0 || selectedItemIndex >= filteredPairs.length) return;
        const pair = filteredPairs[selectedItemIndex];
        if (!pair) return;
        if (pair.header) pair.onClick();
        else if (pair.id) toggleFavorite(pair.id);
      }
    };

    if (anchorEl) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [anchorEl, filteredPairs, selectedItemIndex, selectedAccounts, accounts]);

  const getItemSize = () => 30; // Row height

  /**
   * Scroll with item navigation
   */
  useEffect(() => {
    if (listRef.current) {
      const list = listRef.current;
      const itemSize = getItemSize();
      const visibleStart = list.state.scrollOffset;
      const visibleEnd = visibleStart + list.props.height;

      const itemTop = selectedItemIndex * itemSize;
      const itemBottom = itemTop + itemSize;

      if (itemTop < visibleStart + itemSize) {
        list.scrollTo(visibleStart - itemSize);
      } else if (itemBottom > visibleEnd - itemSize) {
        list.scrollTo(visibleStart + itemSize);
      }
    }
  }, [selectedItemIndex]);

  const renderPairDisplay = () => {
    if (multiOrder || ChainedOrders) {
      return (
        <Stack
          alignItems='center'
          direction='row'
          height='100%'
          justifyContent='space-between'
          marginX='8px'
          ref={pairDisplayRef}
          onClick={handleClick}
        >
          <Typography variant='body1'>{selectedPairName || 'Select Pair'}</Typography>
          <Box alignItems='center' display='flex' flexDirection='row'>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </Box>
        </Stack>
      );
    }
    return (
      <Stack
        alignItems='center'
        direction='row'
        gap={1}
        height='100%'
        justifyContent='center'
        ref={pairDisplayRef}
        onClick={handleClick}
      >
        <Typography
          sx={{
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          variant='subtitle1'
        >
          {currentSelectedDisplayName}
        </Typography>
        <Box alignItems='center' display='flex' flexDirection='row'>
          {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </Box>
        {!isMobile && !multiOrder && !ChainedOrders && (
          <Typography
            color='grey'
            sx={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid',
              borderRadius: '4px',
              padding: '1px',
            }}
            variant='small1'
          >
            {isMac ? <KeyboardCommandKeyIcon sx={{ fontSize: 'inherit' }} /> : 'Ctrl+'}K
          </Typography>
        )}
      </Stack>
    );
  };

  const selectorProps = isMobile ? {} : { sx: { width: 850, height: 650 } };
  const Content = (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: `${theme.palette.background.container}40`, // 25% opacity - much more transparent
        backdropFilter: 'blur(15px)',
        border: 'none',
        borderRadius: 0,
      }}
    >
      <Stack direction='column' {...selectorProps}>
        <Stack direction='row' justifyContent='space-between' spacing={1} sx={{ p: 1 }}>
          <TextField
            autoComplete='off'
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Search sx={{ color: 'grey' }} />
                </InputAdornment>
              ),
              sx: {
                padding: '4px 8px',
                backgroundColor: `${theme.palette.ui.inputBackground}40`, // 25% opacity - more transparent
                backdropFilter: 'blur(8px)',
                borderRadius: 0,
              },
            }}
            inputRef={searchRef}
            placeholder='Search pair'
            size='small'
            sx={{
              width: '75%',
              p: 0,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  border: 'none',
                },
                '&:hover fieldset': {
                  border: 'none',
                },
                '&.Mui-focused fieldset': {
                  border: 'none',
                },
              },
              '& .MuiInputBase-input': {
                fontSize: isMobile ? '16px' : 'inherit',
              },
            }}
            value={searchQuery}
            variant='outlined'
            onChange={handleSearchChange}
          />
          {isMobile ? (
            <IconButton onClick={handleClick}>
              <Close fontSize='small' />
            </IconButton>
          ) : (
            <FormControlLabel
              control={<Checkbox checked={hideZeroBalances} onClick={toggleHideZeroBalances} />}
              label={<Typography variant='small1'>Hide zero balances</Typography>}
              sx={{ width: '25%', justifyContent: 'flex-start' }}
            />
          )}
        </Stack>
        <Box sx={{ px: 2 }}>
          <Tabs
            sx={{ minHeight: '40px', height: '40px' }}
            value={selectedMarketType}
            variant='scrollable'
            onChange={(_, newValue) => {
              handleMarketTypeButtonClick(newValue);
            }}
          >
            {MARKET_TYPE_TABS.map((mt) => {
              // Hide DEX tab entirely for multi-order and chained orders
              if (mt.value === 'dex' && (multiOrder || ChainedOrders)) {
                return null;
              }

              return <Tab key={mt.value} label={mt.label} sx={{ fontSize: '0.75rem' }} value={mt.value} />;
            })}
          </Tabs>
        </Box>

        {/* Filter Chips */}
        {selectedMarketType === 'dex' && (
          <>
            <Divider />
            <Box>
              <Box sx={{ px: 2, py: 2 }}>
                <Stack useFlexGap direction='row' flexWrap='wrap' justifyContent='flex-start' spacing={1}>
                  {Object.values(CHAIN_CONFIGS).map((chain) => (
                    <Chip
                      color='default'
                      disabled={tokenListLoading}
                      icon={<ChainIcon chainId={chain.id} style={{ height: '14px', width: '14px' }} />}
                      key={chain.id}
                      label={chain.name}
                      size='small'
                      sx={{
                        fontSize: '0.75rem',
                        padding: '3px',
                        ...(selectedChains.includes(chain.id) && {
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          '&:hover': {
                            borderColor: 'primary.light',
                            color: 'primary.light',
                          },
                        }),
                      }}
                      variant='outlined'
                      onClick={() => toggleChainFilter(chain.id)}
                    />
                  ))}
                </Stack>
              </Box>
              <Divider />
            </Box>
          </>
        )}

        {selectedMarketType !== 'dex' &&
          selectedMarketType !== 'all' &&
          selectedMarketType !== 'favorites' &&
          getUniqueExchanges.length > 0 && (
            <>
              <Divider />
              <Box>
                <Box sx={{ px: 2, py: 2 }}>
                  <Stack useFlexGap direction='row' flexWrap='wrap' justifyContent='flex-start' spacing={1}>
                    {getUniqueExchanges.map((exchange) => (
                      <Chip
                        color='default'
                        icon={
                          <ExchangeIcons
                            exchanges={[exchange]}
                            pairId={exchange}
                            style={{ height: '14px', width: '14px' }}
                          />
                        }
                        key={exchange}
                        label={exchange}
                        size='small'
                        sx={{
                          fontSize: '0.75rem',
                          padding: '3px',
                          ...(selectedExchanges.includes(exchange) && {
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            '&:hover': {
                              borderColor: 'primary.light',
                              color: 'primary.light',
                            },
                          }),
                        }}
                        variant='outlined'
                        onClick={() => toggleExchangeFilter(exchange)}
                      />
                    ))}
                  </Stack>
                </Box>
                <Divider />
              </Box>
            </>
          )}

        <Stack direction='column' flexGrow={1}>
          <Stack direction='row' height='32px' spacing={1} sx={{ paddingRight: '10px' }}>
            <TableHeader
              asc={columnSort.column === 'label' ? columnSort.asc : null}
              text='Trading Pair'
              textStyle={{ paddingLeft: '10px' }}
              width={pairColumnWidth}
              onSort={() => {
                toggleColumnSort('label');
              }}
            />
            {!isMobile && (
              <TableHeader
                asc={columnSort.column === 'balance' ? columnSort.asc : null}
                text='Position'
                width={balanceColumnWidth}
                onSort={() => {
                  toggleColumnSort('balance');
                }}
              />
            )}
            {!isMobile && <TableHeader text='24h Change' width={dailyChangeColumnWidth} />}
            <TableHeader
              asc={columnSort.column === 'volume' ? columnSort.asc : null}
              text='24h Volume'
              width={volumeColumnWidth}
              onSort={() => {
                toggleColumnSort('volume');
              }}
            />
            <TableHeader text={selectedMarketType === 'dex' ? 'Market Cap' : 'Exchange'} width={exchangeColumnWidth} />
          </Stack>
          <Stack direction='column' height='480px' width='100%'>
            {selectedMarketType === 'dex' && tokenListLoading ? (
              <Skeleton height='100%' variant='rectangular' width='100%' />
            ) : (
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    itemCount={filteredPairs.length}
                    itemData={{
                      pairs: filteredPairs,
                      favourites,
                      toggleFavorite,
                      balanceEnabled: user && user.is_authenticated,
                      selectedItemIndex,
                      onSelectPair,
                      isMobile,
                      pairColumnWidth,
                      exchangeColumnWidth,
                      balanceColumnWidth,
                      dailyChangeColumnWidth,
                      volumeColumnWidth,
                      selectedAccounts,
                      accounts,
                      selectedMarketType,
                    }}
                    itemSize={getItemSize}
                    ref={listRef}
                    style={{ scrollbarGutter: 'stable' }}
                    width={width}
                  >
                    {Row}
                  </List>
                )}
              </AutoSizer>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
  return (
    <Box alignItems='center' direction='row' height='100%' width='100%'>
      <GlobalStyles
        styles={{
          '@keyframes holographic-shimmer': holographicShimmer['@keyframes holographic-shimmer'],
        }}
      />
      {renderPairDisplay()}
      {isMobile ? (
        <SwipeableDrawer anchor='top' anchorEl={anchorEl} open={open} onClose={handleClick}>
          {Content}
        </SwipeableDrawer>
      ) : (
        <Popper
          anchorEl={anchorEl}
          modifiers={[
            {
              name: 'offset',
              options: {
                offset: [0, 10],
              },
            },
          ]}
          open={open}
          placement='bottom'
          ref={popperRef}
          sx={{
            zIndex: 9999,
            overflow: 'hidden',
            '& .MuiPaper-root': {
              backgroundColor: `${theme.palette.background.container}40`, // 25% opacity - much more transparent
              backdropFilter: 'blur(15px)',
              border: 'none',
              boxShadow: 'none',
            },
          }}
        >
          {Content}
        </Popper>
      )}
    </Box>
  );
}

export default PairSelector;
