import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { Search, Star, StarBorder, ExpandLess, ExpandMore, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import debounce from 'lodash.debounce';
import { matchSorter } from 'match-sorter';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { shortenNumber, smartRound, prettyDollars } from '@/util';
import { TokenIcon } from '@/shared/components/Icons';
import { ExchangeIcons } from '@/shared/iconUtil';
import { useToast } from '@/shared/context/ToastProvider';
import { isolatedHolographicStyles } from '@/theme/holographicEffects';
import { addUserFavouritePairs, deleteUserFavouritePairs } from '@/apiServices';
import { useExchangeTicker } from '@/shared/context/ExchangeTickerProvider';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import useDexTokenSelector from '@/pages/dashboard/orderEntry/hooks/useDexTokenSelector';
import { getSupportedChains } from '@/shared/dexUtils';
import resolveExchangeName from '@/shared/utils/resolveExchangeName';
import { OrderTableColumnFilterButton } from '@/shared/orderTable/OrderTableColumnFilter';

const ROW_HEIGHT = 64;

// Column configuration for ExplorePairSelector
const EXPLORE_COLUMNS = [
  {
    id: 'trading_pair',
    label: 'Trading Pair',
    width: 2.6,
    align: 'left',
    showDefault: true,
    sortable: false,
  },
  {
    id: 'position',
    label: 'Position',
    width: 1.2,
    align: 'left',
    showDefault: true,
    sortable: true,
  },
  {
    id: 'change_24h',
    label: '24h Change',
    width: 1,
    align: 'left',
    showDefault: true,
    sortable: true,
  },
  {
    id: 'volume_24h',
    label: '24h Volume',
    width: 1.2,
    align: 'left',
    showDefault: true,
    sortable: true,
  },
  {
    id: 'exchange',
    label: 'Exchange',
    width: 1,
    align: 'left',
    showDefault: true,
    sortable: false,
  },
];

// Default visible columns (all customizable columns visible by default)
const DEFAULT_VISIBLE_EXPLORE_COLUMNS = {
  trading_pair: true,
  position: true,
  change_24h: true,
  volume_24h: true,
  exchange: true,
};

// Persistent state for column visibility
const visibleExploreColumnsAtom = atomWithStorage('visibleExploreColumns', DEFAULT_VISIBLE_EXPLORE_COLUMNS);

// Helper function to generate grid template columns based on visible columns
const getGridTemplateColumns = (visibleColumns) => {
  return EXPLORE_COLUMNS.filter((col) => visibleColumns[col.id])
    .map((col) => `${col.width}fr`)
    .join(' ');
};

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
  for (let i = 0; i < quotes.length; i += 1) {
    const quote = quotes[i];
    if (Q.endsWith(quote) && Q.length > quote.length) {
      const base = Q.slice(0, Q.length - quote.length);
      if (base) return { base, quote };
    }
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

  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    const inst = detectInstrument(t);
    if (inst && !out.instrument) {
      out.instrument = inst;
    } else {
      const isQuote = quotesSet.has(t);
      if (isQuote && !out.quote) {
        out.quote = t;
      }
    }
  }
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
  const vol = pair.ticker?.volume24hNotional;
  if (vol !== undefined && vol !== null && !Number.isNaN(Number(vol))) {
    // Log-scale bump: avoid dominating the score
    score += Math.min(10, Math.log10(Number(vol) + 1));
  }
  return { pair, score };
}

function parseTickerPairId(pairId) {
  if (!pairId) return { baseSymbol: '', quote: '', isPerp: false };
  if (pairId.includes(':PERP')) {
    const [basePart, rest] = pairId.split(':PERP');
    const [, maybeQuote = 'USDT'] = rest.split('-');
    return { baseSymbol: basePart, quote: maybeQuote, isPerp: true };
  }
  const [baseSymbol, quote = ''] = pairId.split('-');
  const isPerp = pairId.toUpperCase().includes('PERP');
  return { baseSymbol, quote, isPerp };
}

const PairRowContainer = styled(Box)(({ theme, visibleColumns }) => ({
  ...isolatedHolographicStyles(theme),
  display: 'grid',
  gridTemplateColumns: getGridTemplateColumns(visibleColumns),
  alignItems: 'center',
  columnGap: theme.spacing(1.5),
  padding: theme.spacing(1, 1.5),
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    ...isolatedHolographicStyles(theme)['&:hover'],
    backgroundColor: theme.palette.text.offBlack,
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
  },
  '&:hover .MuiIconButton-root': {
    pointerEvents: 'auto',
  },
}));

const HeaderRow = styled(Box)(({ theme, visibleColumns }) => ({
  display: 'grid',
  gridTemplateColumns: getGridTemplateColumns(visibleColumns),
  alignItems: 'center',
  columnGap: theme.spacing(1.5),
  padding: theme.spacing(0, 1.5),
  height: 32,
  color: theme.palette.text.secondary,
  fontSize: theme.typography?.small1?.fontSize || theme.typography.caption.fontSize,
  textTransform: 'uppercase',
}));

function ColumnHeader({ label, sortable, sortKey, sortDirection, onSort }) {
  const theme = useTheme();

  const handleClick = () => {
    if (sortable && onSort) {
      onSort();
    }
  };

  const getSortIcon = () => {
    // Map label to column ID for comparison
    const labelToId = {
      Position: 'position',
      '24h Change': 'change_24h',
      '24h Volume': 'volume_24h',
    };

    const columnId = labelToId[label];
    if (!sortable || sortKey !== columnId) {
      return null;
    }

    if (sortDirection === 'desc') {
      return <ArrowDownward sx={{ fontSize: 16, ml: 0.5 }} />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUpward sx={{ fontSize: 16, ml: 0.5 }} />;
    }
    return null;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        cursor: sortable ? 'pointer' : 'default',
        '&:hover': sortable
          ? {
              color: theme.palette.primary.main,
            }
          : {},
      }}
      onClick={handleClick}
    >
      <Typography noWrap color='inherit' variant='small1'>
        {label}
      </Typography>
      {getSortIcon()}
    </Box>
  );
}

function VirtualizedRow({ index, style, data }) {
  const { items, favourites, onToggleFavorite, onPairClick, visibleColumns } = data;
  const pair = items[index];
  const theme = useTheme();

  // Handle header rows (grouping headers)
  if (pair.header) {
    return (
      <Button
        fullWidth
        endIcon={pair.expanded ? <ExpandLess /> : <ExpandMore />}
        sx={{
          ...style,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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

  const isFavourite = Boolean(favourites?.[pair.id]);
  const priceChange = Number(pair.ticker?.pricePctChange24h ?? 0);
  const volume = Number(pair.ticker?.volume24hNotional ?? 0);
  const position = pair.balance ?? null;

  let priceChangeColor = 'text.secondary';
  if (priceChange > 0) {
    priceChangeColor = 'side.buy';
  } else if (priceChange < 0) {
    priceChangeColor = 'side.sell';
  }

  const handleFavouriteClick = (event) => {
    event.stopPropagation();
    onToggleFavorite(pair.id, isFavourite);
  };

  const handleRowClick = () => {
    if (typeof onPairClick === 'function') {
      onPairClick(pair);
    }
  };

  return (
    <Box style={style} sx={{ px: 0.5 }}>
      <PairRowContainer visibleColumns={visibleColumns} onClick={handleRowClick}>
        {/* Trading Pair Column */}
        {visibleColumns.trading_pair && (
          <Stack alignItems='center' direction='row' spacing={1.5}>
            <IconButton
              aria-label={isFavourite ? 'Remove from favorites' : 'Add to favorites'}
              size='small'
              sx={{
                color: isFavourite ? 'primary.main' : 'text.disabled',
                pointerEvents: 'auto',
              }}
              onClick={handleFavouriteClick}
            >
              {isFavourite ? <Star fontSize='small' /> : <StarBorder fontSize='small' />}
            </IconButton>
            <TokenIcon style={{ width: 22, height: 22 }} tokenName={pair.base} />
            <Typography noWrap variant='body3'>
              {pair.label}
            </Typography>
          </Stack>
        )}

        {/* Position Column */}
        {visibleColumns.position && (
          <Typography noWrap color='text.primary' variant='body3'>
            {(() => {
              if (position <= 0) return '-';
              if (position < 0.01) return `~$${shortenNumber(position)}`;
              return `$${shortenNumber(position)}`;
            })()}
          </Typography>
        )}

        {/* 24h Change Column */}
        {visibleColumns.change_24h && (
          <Typography noWrap color={priceChangeColor} variant='body3'>
            {(() => {
              if (!priceChange) return '-';
              const sign = priceChange > 0 ? '+' : '';
              return `${sign}${smartRound(priceChange, 2)}%`;
            })()}
          </Typography>
        )}

        {/* 24h Volume Column */}
        {visibleColumns.volume_24h && (
          <Typography noWrap color='text.primary' variant='body3'>
            {volume ? `$${shortenNumber(volume)}` : '-'}
          </Typography>
        )}

        {/* Exchange Column */}
        {visibleColumns.exchange &&
          (pair.exchanges.length > 0 ? (
            <ExchangeIcons exchanges={pair.exchanges} pairId={pair.id} />
          ) : (
            <Typography noWrap color='text.secondary' variant='body3'>
              -
            </Typography>
          ))}
      </PairRowContainer>
    </Box>
  );
}

const listItemKey = (index, data) => {
  return data.items[index]?.id || index;
};

function ExplorePairSelector({ onPairClick }) {
  const theme = useTheme();
  const { showToastMessage } = useToast();
  const [activeTab, setActiveTab] = useState('favorites');
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [autoSwitched, setAutoSwitched] = useState(false);
  const [expandedMarkets, setExpandedMarkets] = useState({
    perp: false,
    spot: false,
    future: false,
    dex: false,
  });

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useAtom(visibleExploreColumnsAtom);

  // Sorting state - default to volume_24h descending
  const [sortKey, setSortKey] = useState('volume_24h');
  const [sortDirection, setSortDirection] = useState('desc');

  // Get data from the same sources as PairSelector
  const { tickerData } = useExchangeTicker();
  const { balances, favouritePairs, initialLoadValue, selectedAccounts, setFavouritePairs } = useOrderForm();
  const { tokenBalances } = useTokenBalances(selectedAccounts, false);

  // Extract data from initialLoadValue (same as PairInfoBar does)
  const { accounts, tokenPairs } = initialLoadValue;
  const pairs = tokenPairs;
  const favourites = favouritePairs;

  // Get DEX token data
  const [selectedChains, setSelectedChains] = useState([]);
  const { tokenList, tokenListLoading, handleSearchToken } = useDexTokenSelector(selectedChains);

  const debouncedUpdate = useMemo(
    () =>
      debounce((value) => {
        setDebouncedSearch(value);
      }, 300),
    []
  );

  useEffect(() => {
    return () => debouncedUpdate.cancel();
  }, [debouncedUpdate]);

  // Initialize selected chains based on connected accounts (same logic as PairSelector)
  // Note: Disabled auto-selection to default to showing all chains unfiltered
  useEffect(() => {
    if (selectedAccounts && selectedAccounts.length > 0) {
      const allConnectedChains = new Set();
      selectedAccounts.forEach((accountId) => {
        const account = accounts[accountId];
        if (account?.exchangeName === 'OKXDEX') {
          const supportedChains = getSupportedChains(account.walletType);
          supportedChains.forEach((chainId) => allConnectedChains.add(chainId));
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

  const toggleExpandedMarket = useCallback((market) => {
    setExpandedMarkets((prev) => ({ ...prev, [market]: !prev[market] }));
  }, []);

  // Calculate balance for pairs (same logic as PairSelector)
  const calculateNotionalBalance = useCallback(
    (symbol, exchanges, isDexToken = false, tokenAddress = null, chainId = null) => {
      if (isDexToken) {
        const tokenKey = tokenAddress && chainId ? `${tokenAddress}:${chainId}` : symbol;
        const dexBalance = tokenBalances[tokenKey];
        return dexBalance ? dexBalance.notional : 0;
      }

      let totalAmount = 0;
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
    [balances, accounts, selectedAccounts, tokenBalances]
  );

  // Process pairs with real data (same logic as PairSelector)
  const processedPairs = useMemo(() => {
    let tradingPairs = [...(pairs || []), ...(tokenList || [])];

    // Augment balance to pair
    tradingPairs = tradingPairs.map((pair) => {
      const isDexToken = pair.chain_id !== undefined;
      const balance = calculateNotionalBalance(
        pair.is_contract ? pair.id : pair.base,
        pair.exchanges || [],
        isDexToken,
        pair.address,
        pair.chain_id
      );

      return {
        ...pair,
        balance,
      };
    });

    // Augment ticker data to pair
    if (tickerData) {
      tradingPairs = tradingPairs.map((pair) => {
        const ticker = tickerData[pair.id];
        return {
          ...pair,
          ticker,
        };
      });
    }

    // Add isAvailable property based on selected accounts
    if (selectedAccounts && selectedAccounts.length > 0) {
      tradingPairs = tradingPairs.map((pair) => {
        const isAvailable = selectedAccounts.some((accountId) => {
          const account = accounts[accountId];
          if (account?.exchangeName === 'OKXDEX') {
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

    return tradingPairs;
  }, [pairs, tokenList, tickerData, selectedAccounts, accounts, balances, calculateNotionalBalance]);

  const orderedPairs = useMemo(() => {
    const sortable = [...processedPairs].sort((a, b) => {
      const volA = Number(a.ticker?.volume24hNotional) || 0;
      const volB = Number(b.ticker?.volume24hNotional) || 0;
      return volB - volA;
    });
    const favouriteList = sortable.filter((pair) => favourites?.[pair.id]);
    const nonFavourites = sortable.filter((pair) => !favourites?.[pair.id]);
    return [...favouriteList, ...nonFavourites];
  }, [processedPairs, favourites]);

  // Helper function to sort pairs within a group
  const sortPairsWithinGroup = useCallback(
    (pairsToSort) => {
      if (!sortKey || !sortDirection) {
        return pairsToSort;
      }

      return [...pairsToSort].sort((a, b) => {
        let valueA;
        let valueB;
        let hasValueA;
        let hasValueB;

        switch (sortKey) {
          case 'position':
            // Treat 0, null, and undefined as "no position" (consistent with display logic)
            hasValueA = a.balance !== null && a.balance !== undefined && a.balance > 0;
            hasValueB = b.balance !== null && b.balance !== undefined && b.balance > 0;
            valueA = hasValueA ? a.balance : -Infinity; // Push zero/null/undefined to bottom
            valueB = hasValueB ? b.balance : -Infinity;

            break;
          case 'volume_24h':
            hasValueA = a.ticker?.volume24hNotional !== null && a.ticker?.volume24hNotional !== undefined;
            hasValueB = b.ticker?.volume24hNotional !== null && b.ticker?.volume24hNotional !== undefined;
            valueA = hasValueA ? Number(a.ticker.volume24hNotional) : -Infinity;
            valueB = hasValueB ? Number(b.ticker.volume24hNotional) : -Infinity;
            break;
          case 'change_24h':
            hasValueA = a.ticker?.pricePctChange24h !== null && a.ticker?.pricePctChange24h !== undefined;
            hasValueB = b.ticker?.pricePctChange24h !== null && b.ticker?.pricePctChange24h !== undefined;
            valueA = hasValueA ? Number(a.ticker.pricePctChange24h) : -Infinity;
            valueB = hasValueB ? Number(b.ticker.pricePctChange24h) : -Infinity;
            break;
          default:
            return 0;
        }

        // Handle null/undefined values - always push to bottom
        if (!hasValueA && !hasValueB) return 0;
        if (!hasValueA) return 1; // a goes to bottom
        if (!hasValueB) return -1; // b goes to bottom

        // Sort actual values
        if (sortDirection === 'desc') {
          return valueB - valueA;
        }
        if (sortDirection === 'asc') {
          return valueA - valueB;
        }
        return 0;
      });
    },
    [sortKey, sortDirection]
  );

  // Add grouping mechanism for 'All' and 'Favorites' tabs
  const groupedPairs = useMemo(() => {
    if (activeTab === 'all' || activeTab === 'favorites') {
      // Filter pairs based on active tab
      const pairsToGroup =
        activeTab === 'favorites' ? orderedPairs.filter((pair) => favourites?.[pair.id]) : orderedPairs;

      const perps = sortPairsWithinGroup(pairsToGroup.filter((p) => p.market_type === 'perp'));
      const spots = sortPairsWithinGroup(pairsToGroup.filter((p) => p.market_type === 'spot'));
      const futures = sortPairsWithinGroup(pairsToGroup.filter((p) => p.market_type === 'future'));
      const dex = sortPairsWithinGroup(pairsToGroup.filter((p) => p.market_type === 'dex'));

      // For DEX grouping, only show count when searching (to avoid showing inaccurate limited count)
      const showDexCount = activeTab === 'favorites' || debouncedSearch;

      // Auto-expand all groupings when searching to show search results
      const isSearching = Boolean(debouncedSearch?.trim());
      const effectiveExpandedMarkets = isSearching
        ? { perp: true, spot: true, future: true, dex: true }
        : expandedMarkets;

      return [
        {
          header: `Perpetual(${perps.length})`,
          expanded: effectiveExpandedMarkets.perp,
          onClick: () => toggleExpandedMarket('perp'),
        },
        ...(effectiveExpandedMarkets.perp ? perps : []),
        {
          header: `Spot(${spots.length})`,
          expanded: effectiveExpandedMarkets.spot,
          onClick: () => toggleExpandedMarket('spot'),
        },
        ...(effectiveExpandedMarkets.spot ? spots : []),
        {
          header: `Future(${futures.length})`,
          expanded: effectiveExpandedMarkets.future,
          onClick: () => toggleExpandedMarket('future'),
        },
        ...(effectiveExpandedMarkets.future ? futures : []),
        {
          header: showDexCount ? `DEX(${dex.length})` : 'DEX',
          expanded: effectiveExpandedMarkets.dex,
          onClick: () => toggleExpandedMarket('dex'),
        },
        ...(effectiveExpandedMarkets.dex ? dex : []),
      ];
    }
    return orderedPairs;
  }, [orderedPairs, activeTab, expandedMarkets, debouncedSearch, favourites, sortPairsWithinGroup]);

  const quotesSet = useMemo(() => buildQuotesSet(orderedPairs), [orderedPairs]);

  const applySearch = useCallback(
    (items, query) => {
      const trimmed = query.trim();
      if (!trimmed) return items;

      const Q = normalizeStr(trimmed);
      const isSingle = Q.length === 1 && /[A-Z]/.test(Q);
      const hasColon = Q.includes(':');

      // Partition into non-DEX and DEX
      const nonDex = items.filter((p) => p.chain_id === undefined);
      const dex = items.filter((p) => p.chain_id !== undefined);

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
      const dexMatched = matchSorter(dex, trimmed, {
        keys: ['label', 'name', 'id', 'base'],
        threshold: matchSorter.rankings.CONTAINS,
      });

      const fallback = scored.length + dexMatched.length === 0;
      return fallback
        ? matchSorter(items, trimmed, {
            keys: ['id', 'label', 'base'],
            threshold: matchSorter.rankings.CONTAINS,
          })
        : [...scored, ...dexMatched];
    },
    [quotesSet]
  );

  const favouritesList = useMemo(
    () => orderedPairs.filter((pair) => favourites?.[pair.id]),
    [orderedPairs, favourites]
  );

  const filteredPairs = useMemo(() => {
    const baseList = groupedPairs;

    // If no search query, return the grouped pairs as-is
    if (!debouncedSearch?.trim()) {
      return baseList;
    }

    // Apply search within each group and maintain grouping structure
    const searchResults = applySearch(baseList, debouncedSearch);

    // If we have search results, we need to reconstruct the grouped structure
    if (searchResults.length > 0) {
      // Filter pairs based on active tab
      const pairsToGroup =
        activeTab === 'favorites' ? orderedPairs.filter((pair) => favourites?.[pair.id]) : orderedPairs;

      const perps = pairsToGroup.filter((p) => p.market_type === 'perp');
      const spots = pairsToGroup.filter((p) => p.market_type === 'spot');
      const futures = pairsToGroup.filter((p) => p.market_type === 'future');
      const dex = pairsToGroup.filter((p) => p.market_type === 'dex');

      // Apply search to each group
      const filteredPerps = sortPairsWithinGroup(applySearch(perps, debouncedSearch));
      const filteredSpots = sortPairsWithinGroup(applySearch(spots, debouncedSearch));
      const filteredFutures = sortPairsWithinGroup(applySearch(futures, debouncedSearch));
      const filteredDex = sortPairsWithinGroup(applySearch(dex, debouncedSearch));

      // For DEX grouping, only show count when searching
      const showDexCount = activeTab === 'favorites' || debouncedSearch;

      // Build grouped structure with search results
      const result = [];

      if (filteredPerps.length > 0) {
        result.push({
          header: `Perpetual(${filteredPerps.length})`,
          expanded: true,
          onClick: () => toggleExpandedMarket('perp'),
        });
        result.push(...filteredPerps);
      }

      if (filteredSpots.length > 0) {
        result.push({
          header: `Spot(${filteredSpots.length})`,
          expanded: true,
          onClick: () => toggleExpandedMarket('spot'),
        });
        result.push(...filteredSpots);
      }

      if (filteredFutures.length > 0) {
        result.push({
          header: `Future(${filteredFutures.length})`,
          expanded: true,
          onClick: () => toggleExpandedMarket('future'),
        });
        result.push(...filteredFutures);
      }

      if (filteredDex.length > 0) {
        result.push({
          header: showDexCount ? `DEX(${filteredDex.length})` : 'DEX',
          expanded: true,
          onClick: () => toggleExpandedMarket('dex'),
        });
        result.push(...filteredDex);
      }

      return result;
    }

    return searchResults;
  }, [groupedPairs, applySearch, debouncedSearch, activeTab, orderedPairs, favourites, sortPairsWithinGroup]);

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setAutoSwitched(false);
      return;
    }
    if (activeTab !== 'favorites') {
      setAutoSwitched(false);
      return;
    }

    // Get favorites from orderedPairs for this check
    const favoritesOnly = orderedPairs.filter((pair) => favourites?.[pair.id]);
    if (!favoritesOnly.length) {
      return;
    }

    const results = applySearch(favoritesOnly, debouncedSearch);
    if (results.length === 0 && !autoSwitched) {
      setActiveTab('all');
      setAutoSwitched(true);
    }
  }, [activeTab, orderedPairs, favourites, debouncedSearch, applySearch, autoSwitched, showToastMessage]);

  const handleSearchChange = (event) => {
    const { value } = event.target;
    setSearchValue(value);
    debouncedUpdate(value);
    if (value === '') {
      setActiveTab('favorites');
      setAutoSwitched(false);
    }
  };

  const handleTabChange = (_, value) => {
    setActiveTab(value);
    setAutoSwitched(false);
    // Reset sorting to default (volume_24h desc) when switching tabs
    setSortKey('volume_24h');
    setSortDirection('desc');
  };

  const handleToggleFavorite = useCallback(
    async (pairId, currentlyFavourite) => {
      if (!setFavouritePairs) return;
      const nextValue = !currentlyFavourite;
      setFavouritePairs((prev) => ({ ...prev, [pairId]: nextValue }));
      try {
        if (nextValue) {
          await addUserFavouritePairs([pairId]);
        } else {
          await deleteUserFavouritePairs([pairId]);
        }
      } catch (error) {
        setFavouritePairs((prev) => ({ ...prev, [pairId]: currentlyFavourite }));
        showToastMessage({
          message: 'Failed to update favorites. Please try again.',
          type: 'error',
        });
      }
    },
    [setFavouritePairs, showToastMessage]
  );

  const handleSort = useCallback(
    (columnId) => {
      if (sortKey === columnId) {
        // Cycle through: desc -> asc -> null
        if (sortDirection === 'desc') {
          setSortDirection('asc');
        } else if (sortDirection === 'asc') {
          setSortDirection(null);
          setSortKey(null);
        }
      } else {
        // New column, start with desc
        setSortKey(columnId);
        setSortDirection('desc');
      }
    },
    [sortKey, sortDirection]
  );

  const renderList = () => {
    if (tokenListLoading) {
      return <Skeleton height='100%' variant='rectangular' width='100%' />;
    }
    if (!filteredPairs.length) {
      return (
        <Stack alignItems='center' height='100%' justifyContent='center' spacing={1}>
          <Typography color='text.secondary' variant='body2'>
            {debouncedSearch ? 'No pairs match your search.' : 'No pairs available.'}
          </Typography>
        </Stack>
      );
    }

    return (
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            itemCount={filteredPairs.length}
            itemData={{
              items: filteredPairs,
              favourites,
              onToggleFavorite: handleToggleFavorite,
              onPairClick,
              visibleColumns,
            }}
            itemKey={listItemKey}
            itemSize={ROW_HEIGHT}
            style={{ scrollbarGutter: 'stable' }}
            width={width}
          >
            {VirtualizedRow}
          </List>
        )}
      </AutoSizer>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TextField
        autoComplete='off'
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <Search sx={{ color: theme.palette.grey[600] }} />
            </InputAdornment>
          ),
        }}
        placeholder='Search pairs'
        size='small'
        value={searchValue}
        variant='outlined'
        onChange={handleSearchChange}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label='Favorites' value='favorites' />
          <Tab label='All' value='all' />
        </Tabs>
        <OrderTableColumnFilterButton
          columns={EXPLORE_COLUMNS.filter((col) => col.id !== 'trading_pair')}
          dashboardView={false}
          setVisibleColumns={setVisibleColumns}
          visibleColumns={visibleColumns}
        />
      </Box>
      <Divider sx={{ mt: 1 }} />
      <HeaderRow sx={{ mt: 1 }} visibleColumns={visibleColumns}>
        {/* Trading Pair Column */}
        {visibleColumns.trading_pair && <ColumnHeader label='Trading Pair' sortable={false} />}

        {/* Position Column */}
        {visibleColumns.position && (
          <ColumnHeader
            sortable
            label='Position'
            sortDirection={sortDirection}
            sortKey={sortKey}
            onSort={() => handleSort('position')}
          />
        )}

        {/* 24h Change Column */}
        {visibleColumns.change_24h && (
          <ColumnHeader
            sortable
            label='24h Change'
            sortDirection={sortDirection}
            sortKey={sortKey}
            onSort={() => handleSort('change_24h')}
          />
        )}

        {/* 24h Volume Column */}
        {visibleColumns.volume_24h && (
          <ColumnHeader
            sortable
            label='24h Volume'
            sortDirection={sortDirection}
            sortKey={sortKey}
            onSort={() => handleSort('volume_24h')}
          />
        )}

        {/* Exchange Column */}
        {visibleColumns.exchange && <ColumnHeader label='Exchange' sortable={false} />}
      </HeaderRow>
      <Divider sx={{ mt: 1 }} />
      <Box sx={{ flex: 1, mt: 1, overflow: 'hidden' }}>{renderList()}</Box>
    </Box>
  );
}

export default ExplorePairSelector;
