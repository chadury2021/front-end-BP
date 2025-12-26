import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import debounce from 'lodash.debounce';
import {
  Box,
  Button,
  Menu,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  IconButton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Pagination,
  MenuItem,
} from '@mui/material';
import { Star, StarBorder, KeyboardArrowDown } from '@mui/icons-material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import {
  getTokenRanking,
  searchTokens,
  addUserFavouritePairs,
  deleteUserFavouritePairs,
  getUserFavouritePairs,
} from '@/apiServices';
import { TokenIcon, ChainIcon } from '@/shared/components/Icons';
import palette from '@/theme/colors';
import { smartRound, shortenNumber } from '@/util';
import { renderPriceWithSubscriptString } from '@/util/priceFormatting';
import { useAtom } from 'jotai';
import { favouritePairsAtom } from '@/pages/dashboard/orderEntry/hooks/useFormReducer';
import { buildTokenId } from '@/shared/dexUtils';

const CHAIN_CONFIGS = {
  1: { name: 'Ethereum', color: '#627EEA' },
  56: { name: 'BSC', color: '#F3BA2F' },
  8453: { name: 'Base', color: '#0052FF' },
  501: { name: 'Solana', color: '#14F195' },
};

const NETWORK_OPTIONS = [
  { value: 'all', label: 'All Networks', chainId: null },
  { value: '501', label: 'Solana', chainId: 501 },
  { value: '1', label: 'Ethereum', chainId: 1 },
  { value: '8453', label: 'Base', chainId: 8453 },
  { value: '56', label: 'BNB Chain', chainId: 56 },
];

const DEFAULT_SORT_CODE = '5';
const ITEMS_PER_PAGE = 20;
const SORT_BY_MAP = {
  volume: '5',
  marketCap: '6',
  priceChange: '2',
};

function DexTable({ onPairClick }) {
  const [tokenRanking, setTokenRanking] = useState([]);
  const [tokenRankingLoading, setTokenRankingLoading] = useState(true);
  const [tokenSearchResults, setTokenSearchResults] = useState([]);
  const [tokenSearchLoading, setTokenSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFrame, setTimeFrame] = useState('2'); // 1=5m, 2=1h, 3=4h, 4=24h
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  const [sortBy, setSortBy] = useState('volume'); // volume, marketCap, priceChange
  const [currentPage, setCurrentPage] = useState(1);
  const [favouritePairs, setFavouritePairs] = useAtom(favouritePairsAtom);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState('all');
  const [networkMenuAnchor, setNetworkMenuAnchor] = useState(null);

  const rankingRequestId = useRef(0);
  const searchRequestId = useRef(0);

  const supportedChains = useMemo(() => Object.keys(CHAIN_CONFIGS).map((id) => Number(id)), []);
  const selectedChains = useMemo(() => {
    if (selectedNetwork === 'all') {
      return supportedChains;
    }
    const networkId = Number(selectedNetwork);
    return Number.isNaN(networkId) ? supportedChains : [networkId];
  }, [selectedNetwork, supportedChains]);

  const hasSearchTerm = Boolean(searchTerm.trim());
  const baseTokenList = hasSearchTerm ? tokenSearchResults : tokenRanking;
  const activeLoading = hasSearchTerm ? tokenSearchLoading : tokenRankingLoading;

  const sortTokens = useCallback(
    (tokens) => {
      if (!Array.isArray(tokens)) return [];
      if (!sortConfig.key) return tokens;

      const getValue = (token) => {
        const info = token.price_info || {};
        switch (sortConfig.key) {
          case 'priceChange':
            return parseFloat(info.change ?? info.price_change ?? token.change ?? 0);
          case 'marketCap':
            return parseFloat(info.marketCap ?? info.market_cap ?? token.marketCap ?? 0);
          case 'volume':
            return parseFloat(info.volume ?? info.volume24h ?? token.volume24h ?? 0);
          default:
            return 0;
        }
      };

      const direction = sortConfig.direction === 'asc' ? 1 : -1;

      return [...tokens].sort((a, b) => {
        const aVal = getValue(a);
        const bVal = getValue(b);

        const safeA = Number.isFinite(aVal) ? aVal : Number.NEGATIVE_INFINITY;
        const safeB = Number.isFinite(bVal) ? bVal : Number.NEGATIVE_INFINITY;

        if (safeA === safeB) {
          return (a.symbol || '').localeCompare(b.symbol || '');
        }

        return safeA > safeB ? direction : -direction;
      });
    },
    [sortConfig]
  );

  const activeTokenList = useMemo(() => sortTokens(baseTokenList), [baseTokenList, sortTokens]);

  useEffect(() => {
    let cancelled = false;
    const loadFavorites = async () => {
      try {
        const response = await getUserFavouritePairs();
        if (response && response.pairs && !cancelled) {
          const favoritesMap = {};
          response.pairs.forEach((pair) => {
            favoritesMap[pair] = true;
          });
          setFavouritePairs(favoritesMap);
        }
      } catch (_error) {
        // Failed to load favorites - continue with empty state
      }
    };

    loadFavorites();
    return () => {
      cancelled = true;
    };
  }, [setFavouritePairs]);

  useEffect(() => {
    rankingRequestId.current += 1;
    const requestId = rankingRequestId.current;
    const sortCode = DEFAULT_SORT_CODE;

    const fetchRanking = async () => {
      setTokenRankingLoading(true);
      try {
        const response = await getTokenRanking(selectedChains, sortCode, timeFrame);
        if (rankingRequestId.current === requestId) {
          const data = Array.isArray(response) ? response : [];
          setTokenRanking(data);
        }
      } catch (_error) {
        if (rankingRequestId.current === requestId) {
          setTokenRanking([]);
        }
      } finally {
        if (rankingRequestId.current === requestId) {
          setTokenRankingLoading(false);
        }
      }
    };

    fetchRanking();
  }, [selectedChains, timeFrame]);

  // legacy token selector removed; search now handled by executeTokenSearch below

  const executeTokenSearch = useCallback(
    (value) => {
      const term = value.trim();
      searchRequestId.current += 1;
      const requestId = searchRequestId.current;

      if (!term) {
        if (searchRequestId.current === requestId) {
          setTokenSearchResults([]);
          setTokenSearchLoading(false);
        }
        return;
      }

      const fetchSearch = async () => {
        setTokenSearchLoading(true);
        try {
          const results = await searchTokens(selectedChains, term);
          if (searchRequestId.current === requestId) {
            const data = Array.isArray(results) ? results : [];
            setTokenSearchResults(data);
          }
        } catch (_error) {
          if (searchRequestId.current === requestId) {
            setTokenSearchResults([]);
          }
        } finally {
          if (searchRequestId.current === requestId) {
            setTokenSearchLoading(false);
          }
        }
      };

      fetchSearch();
    },
    [selectedChains]
  );

  const debouncedSearch = useMemo(() => debounce(executeTokenSearch, 500), [executeTokenSearch]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchTermChange = useCallback(
    (event) => {
      const { value } = event.target;
      setSearchTerm(value);
      setCurrentPage(1);

      if (!value.trim()) {
        debouncedSearch.cancel();
        executeTokenSearch(value);
        return;
      }

      debouncedSearch(value);
    },
    [debouncedSearch, executeTokenSearch]
  );

  useEffect(() => {
    if (hasSearchTerm) {
      executeTokenSearch(searchTerm);
    }
  }, [executeTokenSearch, hasSearchTerm, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedNetwork, sortConfig.key, sortConfig.direction, timeFrame, hasSearchTerm]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(activeTokenList.length / ITEMS_PER_PAGE));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [activeTokenList, currentPage]);

  const totalPages = Math.max(1, Math.ceil(activeTokenList.length / ITEMS_PER_PAGE));
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return activeTokenList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [activeTokenList, currentPage]);

  const selectedNetworkOption =
    NETWORK_OPTIONS.find((option) => option.value === selectedNetwork) || NETWORK_OPTIONS[0];

  const handleTimeFrameChange = (_event, newTimeFrame) => {
    if (newTimeFrame) {
      setTimeFrame(newTimeFrame);
    }
  };

  const handlePageChange = (_event, page) => {
    setCurrentPage(page);
  };

  const handleColumnSort = (columnKey) => {
    setSortConfig((prev) => {
      if (prev.key === columnKey) {
        if (prev.direction === 'asc') {
          return { key: columnKey, direction: 'desc' };
        }
        return { key: null, direction: 'desc' };
      }
      return { key: columnKey, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const renderSortableHeader = (label, columnKey, width) => {
    const isActive = sortConfig.key === columnKey;
    let IconComponent = UnfoldMoreIcon;
    if (isActive) {
      IconComponent = sortConfig.direction === 'asc' ? KeyboardArrowUpIcon : KeyboardArrowDownIcon;
    }
    return (
      <TableCell align='right' sx={{ width }}>
        <Box
          role='button'
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            userSelect: 'none',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            transition: 'background-color 0.2s ease',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
          tabIndex={0}
          onClick={() => handleColumnSort(columnKey)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleColumnSort(columnKey);
            }
          }}
        >
          <Typography component='span' sx={{ color: isActive ? 'text.primary' : 'text.secondary' }} variant='body3'>
            {label}
          </Typography>
          <IconComponent
            fontSize='small'
            sx={{
              color: isActive ? 'text.primary' : 'text.secondary',
            }}
          />
        </Box>
      </TableCell>
    );
  };

  const generatePairKey = (token) => {
    return token.id || (token.address && token.chain_id ? buildTokenId(token.address, token.chain_id) : token.symbol);
  };

  const toggleFavorite = async (token) => {
    const pairKey = generatePairKey(token);
    const isCurrentlyFavorite = favouritePairs[pairKey];

    try {
      if (isCurrentlyFavorite) {
        await deleteUserFavouritePairs([pairKey]);
      } else {
        await addUserFavouritePairs([pairKey]);
      }

      setFavouritePairs((prev) => ({
        ...prev,
        [pairKey]: !prev[pairKey],
      }));
    } catch (_error) {
      // Failed to update favorite - could show user feedback here
    }
  };

  const handleOpenNetworkMenu = (event) => {
    setNetworkMenuAnchor(event.currentTarget);
  };

  const handleCloseNetworkMenu = () => {
    setNetworkMenuAnchor(null);
  };

  const handleSelectNetwork = (value) => {
    setSelectedNetwork(value);
    setNetworkMenuAnchor(null);
  };

  const handleQuickBuy = useCallback(
    (event, token) => {
      event.stopPropagation();
      if (onPairClick) {
        onPairClick(token);
        return;
      }

      const pairId =
        token?.id || (token?.address && token?.chain_id !== undefined ? `${token.address}:${token.chain_id}` : null);

      if (pairId) {
        window.open(`/?pair=${pairId}`, '_blank');
      }
    },
    [onPairClick]
  );

  const formatPriceChange = (change) => {
    if (change === null || change === undefined) return '-';
    const value = parseFloat(change);
    if (Number.isNaN(value)) return '-';
    return `${value >= 0 ? '+' : ''}${smartRound(value, 2)}%`;
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return '-';
    const numericValue = parseFloat(value);
    if (Number.isNaN(numericValue)) return '-';
    return `$${shortenNumber(numericValue)}`;
  };

  if (tokenRankingLoading && !tokenRanking.length) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography gutterBottom variant='h6'>
          DEX Tokens
        </Typography>
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton height={60} key={`skeleton-${index}`} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6'>DEX Tokens</Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder='Search tokens...'
            size='small'
            sx={{ width: 200 }}
            value={searchTerm}
            onChange={handleSearchTermChange}
          />

          <ToggleButtonGroup exclusive size='small' value={timeFrame} onChange={handleTimeFrameChange}>
            <ToggleButton value='1'>5m</ToggleButton>
            <ToggleButton value='2'>1h</ToggleButton>
            <ToggleButton value='3'>4h</ToggleButton>
            <ToggleButton value='4'>24h</ToggleButton>
          </ToggleButtonGroup>

          <Button
            size='small'
            sx={{ textTransform: 'none', width: 200, justifyContent: 'space-between', px: 2 }}
            variant='outlined'
            onClick={handleOpenNetworkMenu}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedNetworkOption.chainId ? (
                <ChainIcon chainId={selectedNetworkOption.chainId} style={{ height: '1rem', width: '1rem' }} />
              ) : null}
              <Typography variant='body2'>{selectedNetworkOption.label}</Typography>
            </Box>
            <KeyboardArrowDown fontSize='small' />
          </Button>
          <Menu
            anchorEl={networkMenuAnchor}
            open={Boolean(networkMenuAnchor)}
            PaperProps={{ sx: { width: 200 } }}
            onClose={handleCloseNetworkMenu}
          >
            {NETWORK_OPTIONS.map((option) => (
              <MenuItem
                key={option.value}
                selected={option.value === selectedNetwork}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  ...(option.chainId ? { gap: 1.5 } : {}),
                }}
                onClick={() => handleSelectNetwork(option.value)}
              >
                {option.chainId ? (
                  <ChainIcon chainId={option.chainId} style={{ height: '1rem', width: '1rem' }} />
                ) : null}
                <Typography variant='body2'>{option.label}</Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      <TableContainer component={Box} sx={{ mb: 4 }}>
        <Table
          size='small'
          sx={{
            '& .MuiTableCell-root': {
              borderBottom: `1px solid ${palette.common.transparent}`,
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell align='left'>Token</TableCell>
              <TableCell align='right' sx={{ width: 140 }}>
                Price
              </TableCell>
              {renderSortableHeader('Change %', 'priceChange', 110)}
              {renderSortableHeader('Market Cap', 'marketCap', 140)}
              <TableCell align='right' sx={{ width: 140 }}>
                Liquidity
              </TableCell>
              {renderSortableHeader('Volume', 'volume', 140)}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((token) => {
              const rowKey = `${token.id || token.symbol}-${token.chain_id}-${token.address || 'unknown'}`;
              const price = token.price_info?.price;
              const priceChange = token.price_info?.change;
              const marketCap = token.price_info?.marketCap;
              const liquidity = token.price_info?.liquidity;
              const volume = token.price_info?.volume;
              const pairKey = generatePairKey(token);
              const isFavorite = Boolean(favouritePairs[pairKey]);

              return (
                <TableRow
                  hover
                  key={rowKey}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => onPairClick && onPairClick(token)}
                  onMouseEnter={() => setHoveredRow(rowKey)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <TableCell align='left'>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size='small'
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(token);
                        }}
                      >
                        {isFavorite ? (
                          <Star sx={{ color: 'primary.main', fontSize: 18 }} />
                        ) : (
                          <StarBorder sx={{ color: 'grey.main', fontSize: 18 }} />
                        )}
                      </IconButton>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          minWidth: 0,
                          flexShrink: 1,
                          overflow: 'hidden',
                        }}
                      >
                        <TokenIcon
                          logoUrl={token.logo_url}
                          style={{ width: '20px', height: '20px' }}
                          tokenName={token.id || token.symbol}
                        />
                        <Typography
                          noWrap
                          sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          variant='body3'
                        >
                          {token.symbol}
                        </Typography>
                      </Box>
                      <Button
                        color='primary'
                        size='small'
                        sx={{
                          ml: 2,
                          textTransform: 'none',
                          fontSize: '0.65rem',
                          px: 1.5,
                          py: 0.25,
                          opacity: hoveredRow === rowKey ? 1 : 0,
                          visibility: hoveredRow === rowKey ? 'visible' : 'hidden',
                          pointerEvents: hoveredRow === rowKey ? 'auto' : 'none',
                          transition: 'opacity 0.2s ease',
                        }}
                        variant='contained'
                        onClick={(event) => handleQuickBuy(event, token)}
                      >
                        Quick Buy
                      </Button>
                    </Box>
                  </TableCell>

                  <TableCell align='right' sx={{ width: 140 }}>
                    <Typography
                      sx={{
                        fontFeatureSettings: 'tnum',
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1.2,
                        display: 'inline-block',
                        verticalAlign: 'baseline',
                        paddingTop: '2px',
                      }}
                      variant='body3'
                    >
                      {(() => {
                        if (price === null || price === undefined) return '-';

                        const numericPrice = Number(price);
                        if (Number.isNaN(numericPrice)) return '-';

                        // For prices greater than or equal to 1 (or non-positive), keep existing formatting
                        if (numericPrice >= 1 || numericPrice <= 0) {
                          return `$${smartRound(numericPrice, 6)}`;
                        }

                        // For prices between 0 and 1, use subscript notation like $0.0₅38835
                        const formatted = renderPriceWithSubscriptString(numericPrice);
                        return `$${formatted}`;
                      })()}
                    </Typography>
                  </TableCell>

                  <TableCell align='right' sx={{ width: 110 }}>
                    <Typography
                      sx={{
                        color: priceChange > 0 ? 'success.light' : 'error.main',
                        fontWeight: 500,
                        fontFeatureSettings: 'tnum',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                      variant='body3'
                    >
                      {formatPriceChange(priceChange)}
                    </Typography>
                  </TableCell>

                  <TableCell align='right' sx={{ width: 140 }}>
                    <Typography
                      sx={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums' }}
                      variant='body3'
                    >
                      {formatNumber(marketCap)}
                    </Typography>
                  </TableCell>

                  <TableCell align='right' sx={{ width: 140 }}>
                    <Typography
                      sx={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums' }}
                      variant='body3'
                    >
                      {formatNumber(liquidity)}
                    </Typography>
                  </TableCell>

                  <TableCell align='right' sx={{ width: 140 }}>
                    <Typography
                      sx={{ fontFeatureSettings: 'tnum', fontVariantNumeric: 'tabular-nums' }}
                      variant='body3'
                    >
                      {formatNumber(volume)}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {activeTokenList.length === 0 && !activeLoading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color='text.secondary'>No tokens found</Typography>
        </Box>
      )}

      {activeTokenList.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 2, px: 1, pb: 6 }}>
          <Pagination
            showFirstButton
            showLastButton
            color='primary'
            count={totalPages}
            page={currentPage}
            size='small'
            onChange={handlePageChange}
          />
        </Box>
      )}
    </Box>
  );
}

export default DexTable;
