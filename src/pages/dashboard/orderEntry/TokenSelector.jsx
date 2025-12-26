import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Popper,
  Paper,
  TextField,
  InputAdornment,
  Divider,
  Chip,
  Skeleton,
  useTheme,
} from '@mui/material';
import { ChainIcon, TokenIcon } from '@/shared/components/Icons';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Search } from '@mui/icons-material';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { debounce } from 'lodash';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';
import { styled } from '@mui/material/styles';
import { isolatedHolographicStyles } from '@/theme/holographicEffects';
import { useExchangeTicker } from '@/shared/context/ExchangeTickerProvider';
import { useDexTokenManager } from '@/shared/context/DexTokenManagerProvider';
import { useTokenBalances } from '@/hooks/useTokenBalances';
import { renderBalanceWithSubscript } from '@/util/priceFormatting';
import getDexTokenIcon from '../../../../images/dex_tokens';
import useDexTokenSelector from './hooks/useDexTokenSelector';

const HoloTokenRow = styled(Stack)(({ theme }) => ({
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

function TokenRow({ index, style, data }) {
  const { pairs, onSelectToken, isBase, tokenBalances } = data;
  const pair = pairs[index];
  let isDexToken = false;
  let icon;
  let label;
  let rightText;
  let balance = null;

  if (pair.market_type === 'dex' && pair.address && pair.chain_id) {
    isDexToken = true;
    icon = getDexTokenIcon(pair.address, pair.chain_id);
    label = pair.base; // Always show the symbol (base) as the main text
    const addr = pair.address;
    rightText = addr ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : '';
    // For DEX tokens, try to match by address, symbol, or base
    balance = tokenBalances[pair.address] || tokenBalances[pair.base] || tokenBalances[pair.id];
  } else {
    const [base, quote] = pair.id.split('-');
    label = isBase ? base : quote;
    rightText = '';
    // For regular tokens, match by symbol, base, or quote
    balance = tokenBalances[label] || tokenBalances[base] || tokenBalances[quote];
  }

  return (
    <Box style={{ ...style, borderRadius: 0, overflow: 'hidden', margin: 0 }} onClick={() => onSelectToken(pair)}>
      <HoloTokenRow
        alignItems='center'
        direction='row'
        spacing={1.5}
        sx={{
          cursor: 'pointer',
          px: 3.75,
          py: 1.5,
        }}
      >
        <TokenIcon
          logoUrl={pair.logo_url}
          style={{ height: '34px', width: '34px' }}
          tokenName={isDexToken ? pair.id : label}
        />

        <Stack direction='column' spacing={-1}>
          <Typography
            sx={{
              maxWidth: 220,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            variant='subtitle1'
          >
            {label}
            {balance && (
              <Typography
                component='span'
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  fontWeight: 200,
                  ml: 1,
                }}
                variant='body2'
              >
                ({renderBalanceWithSubscript(balance.balance)} {label})
              </Typography>
            )}
          </Typography>
          {isDexToken && pair.name && (
            <Typography
              sx={{
                maxWidth: 220,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'grey',
                fontSize: '0.75rem',
              }}
              variant='caption'
            >
              {pair.name}
            </Typography>
          )}
        </Stack>

        <Box sx={{ flexGrow: 1 }} />
        <Typography
          color='grey'
          sx={{
            fontSize: '0.75rem',
            maxWidth: 160,
            textAlign: 'right',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          variant='caption'
        >
          {rightText}
        </Typography>
      </HoloTokenRow>
    </Box>
  );
}

const TOKEN_TYPE_FILTERS = [
  { label: 'All', value: 'none' },
  { label: 'Spot', value: 'spot' },
  { label: 'Perp', value: 'perp' },
];

const CHAIN_CONFIGS = {
  1: { name: 'Ethereum', id: '1' },
  56: { name: 'BSC', id: '56' },
  8453: { name: 'Base', id: '8453' },
  501: { name: 'Solana', id: '501' },
};

function TokenSelector({
  isBase,
  isBuySide,
  onSelectToken,
  selectedToken,
  fullSelectedToken = null,
  isDexOnly = false,
  selectedChain: initialSelectedChain = null,
  onOpenChange,
}) {
  const { initialLoadValue } = useOrderForm();
  const { tokenPairs } = initialLoadValue;
  const theme = useTheme();

  const { tokenBalances } = useTokenBalances();

  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmedSearchQuery, setConfirmedSearchQuery] = useState('');
  const searchRef = useRef(null);
  const popperRef = useRef(null);
  const triggerRef = useRef(null);
  const [selectedTokenType, setSelectedTokenType] = useState(isDexOnly ? 'dex' : 'none');
  const [selectedChain, setSelectedChain] = useState(initialSelectedChain);
  const [balancedTokens, setBalancedTokens] = useState([]);
  const { loadTokens } = useDexTokenManager();
  const fullToken = fullSelectedToken || tokenPairs.find((pair) => pair.id === selectedToken);

  const { tokenList, tokenListLoading, handleSearchToken } = useDexTokenSelector(selectedChain ? [selectedChain] : []);

  const { tickerData } = useExchangeTicker();
  const open = Boolean(anchorEl);

  useEffect(() => {
    const fetchBalancedTokens = async () => {
      const tokens = await loadTokens(Object.keys(tokenBalances));
      setBalancedTokens(Object.values(tokens));
    };

    if (Object.keys(tokenBalances).length > 0) {
      fetchBalancedTokens();
    }
  }, [tokenBalances]);

  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(open);
    }
  }, [open, onOpenChange]);

  /**
   * Focus the search input when the modal opens
   */
  useEffect(() => {
    let timeoutId;
    if (open) {
      timeoutId = setTimeout(() => {
        if (searchRef.current) {
          searchRef.current.focus();
        }
      }, 0);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [open]);

  useEffect(() => {
    if (initialSelectedChain) {
      setSelectedChain(initialSelectedChain);
    }
  }, [initialSelectedChain]);

  const selectChainFilter = (chainId) => {
    setSelectedChain(chainId);
  };

  const handleClick = useCallback(
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

  const debouncedHandleSearchChange = useCallback(
    debounce((event) => {
      setConfirmedSearchQuery(event.target.value);
      handleSearchToken(event.target.value);
    }, 1000),
    []
  );

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    debouncedHandleSearchChange(event);
  };

  const onSelectTokenCallback = (pair) => {
    let token;
    if (pair.market_type === 'dex') {
      token = pair;
    } else {
      const [base, quote] = pair.id.split('-');
      token = isBase ? base : quote;
    }

    onSelectToken(token);
    setSearchQuery('');
    setConfirmedSearchQuery('');
    handleSearchToken('');
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

  const filteredPairs = useMemo(() => {
    const tradingPairs = [...tokenPairs, ...tokenList, ...balancedTokens];
    const pairsByVolume = tradingPairs
      .map((pair) => {
        const ticker = tickerData[pair.id];
        return {
          ...pair,
          ticker,
        };
      })
      .sort((a, b) => {
        const volumeA = a.ticker?.volume24h;
        const volumeB = b.ticker?.volume24h;
        if (volumeA === undefined) return 1;
        if (volumeB === undefined) return -1;
        return volumeB - volumeA;
      });

    let pairs = pairsByVolume.filter((pair) => {
      if (selectedTokenType === 'none') return true;
      if (selectedTokenType === 'spot') return pair.market_type === 'spot';
      if (selectedTokenType === 'perp') return pair.market_type === 'perp';
      if (selectedTokenType === 'dex') return pair.market_type === 'dex';
      return true;
    });

    if (isDexOnly && selectedChain) {
      pairs = pairs.filter((pair) => {
        return pair.chain_id === selectedChain;
      });
    }

    if (!isDexOnly) {
      pairs = pairs.filter((pair) => {
        return pair.market_type !== 'dex';
      });
    }

    if (confirmedSearchQuery) {
      pairs = pairs.filter((pair) => {
        if (pair.market_type === 'dex') {
          return (
            (pair.name && pair.name.toLowerCase().includes(confirmedSearchQuery.toLowerCase())) ||
            pair.base.toLowerCase().includes(confirmedSearchQuery.toLowerCase()) ||
            pair.quote.toLowerCase().includes(confirmedSearchQuery.toLowerCase()) ||
            (pair.address && pair.address.toLowerCase().includes(confirmedSearchQuery.toLowerCase()))
          );
        }
        return (
          pair.base.toLowerCase().includes(confirmedSearchQuery.toLowerCase()) ||
          pair.quote.toLowerCase().includes(confirmedSearchQuery.toLowerCase())
        );
      });
    }

    // Remove duplicates by token (base or quote)
    const seen = new Set();
    const uniquePairs = pairs.reduce((acc, pair) => {
      let token;
      if (pair.market_type === 'dex') {
        token = pair.id;
      } else {
        token = isBase ? pair.base : pair.quote;
      }

      if (!seen.has(token)) {
        seen.add(token);
        acc.push(pair);
      }

      return acc;
    }, []);

    // Sort by estimated notional value (balance * USD value)
    return uniquePairs.sort((a, b) => {
      let tokenA;
      let tokenB;
      if (a.market_type === 'dex') {
        tokenA = a.id;
      } else {
        tokenA = isBase ? a.base : a.quote;
      }
      if (b.market_type === 'dex') {
        tokenB = b.id;
      } else {
        tokenB = isBase ? b.base : b.quote;
      }

      const balanceA = tokenBalances[tokenA];
      const balanceB = tokenBalances[tokenB];

      // Calculate estimated notional value
      const notionalA = balanceA ? (balanceA.balance * balanceA.balanceUsd) / Math.max(balanceA.balance, 1) : 0;
      const notionalB = balanceB ? (balanceB.balance * balanceB.balanceUsd) / Math.max(balanceB.balance, 1) : 0;

      // Sort by notional value (highest first), then by volume
      if (notionalA !== notionalB) {
        return notionalB - notionalA;
      }

      // Fallback to volume sorting
      const volumeA = a.ticker?.volume24h || 0;
      const volumeB = b.ticker?.volume24h || 0;
      return volumeB - volumeA;
    });
  }, [
    tokenPairs,
    tokenList,
    confirmedSearchQuery,
    tickerData,
    selectedTokenType,
    isBase,
    selectedChain,
    tokenBalances,
  ]);

  return (
    <>
      <Stack
        alignItems='center'
        direction='row'
        ref={triggerRef}
        spacing={1}
        sx={{
          borderRadius: '50px',
          border: `1px solid ${theme.palette.primary.main}`,
          height: '24px',
          p: 1,
          pl: 2,
          cursor: 'pointer',
        }}
        onClick={handleClick}
      >
        <TokenIcon
          logoUrl={fullToken?.logo_url}
          style={{ height: '24px', width: '24px' }}
          tokenName={fullToken?.id || selectedToken}
        />
        {selectedToken ? (
          <Typography variant='subtitle1'>{fullToken?.label || selectedToken}</Typography>
        ) : (
          <Typography variant='subtitle2'>Select</Typography>
        )}
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
            width: '470px',
            backgroundColor: `${theme.palette.background.container}40`, // 25% opacity - much more transparent
            backdropFilter: 'blur(15px)',
            borderRadius: 0,
            border: 'none',
          }}
        >
          <Stack direction='column'>
            <Stack direction='column' spacing={2} sx={{ p: 6 }}>
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
                inputRef={searchRef}
                placeholder='Search'
                size='small'
                value={searchQuery}
                variant='outlined'
                onChange={handleSearchChange}
              />
            </Stack>
            <Divider />
            <Box sx={{ position: 'relative', height: '500px', py: 0 }}>
              {tokenListLoading ? (
                <Skeleton height='100%' variant='rectangular' width='100%' />
              ) : (
                <AutoSizer>
                  {({ height, width }) => (
                    <List
                      height={height - 48} // 48px for chip bar, no extra gap
                      itemCount={filteredPairs.length}
                      itemData={{ isBase, onSelectToken: onSelectTokenCallback, pairs: filteredPairs, tokenBalances }}
                      itemSize={() => 60} // Fixed height for balance display
                      width={width}
                    >
                      {TokenRow}
                    </List>
                  )}
                </AutoSizer>
              )}
              <Paper
                elevation={0}
                sx={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 2,
                  px: 2,
                  py: 1,
                  bgcolor: `${theme.palette.background.container}40`, // 25% opacity - much more transparent
                  backdropFilter: 'blur(8px)',
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                }}
              >
                <Stack alignItems='center' direction='row' justifyContent='flex-end' spacing={1} sx={{ width: '100%' }}>
                  {isDexOnly
                    ? Object.values(CHAIN_CONFIGS).map((chain) => (
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
                            ...(selectedChain === chain.id && {
                              borderColor: 'primary.main',
                              color: 'primary.main',
                              '&:hover': {
                                borderColor: 'primary.light',
                                color: 'primary.light',
                              },
                            }),
                          }}
                          variant='outlined'
                          onClick={() => selectChainFilter(chain.id)}
                        />
                      ))
                    : TOKEN_TYPE_FILTERS.map((filter) => (
                        <Chip
                          color='default'
                          key={filter.value}
                          label={filter.label}
                          size='small'
                          sx={
                            selectedTokenType === filter.value
                              ? {
                                  bgcolor: theme.palette.grey[900],
                                  border: 'none',
                                }
                              : {}
                          }
                          variant={selectedTokenType === filter.value ? 'filled' : 'outlined'}
                          onClick={() => setSelectedTokenType(filter.value)}
                        />
                      ))}
                </Stack>
              </Paper>
            </Box>
          </Stack>
        </Paper>
      </Popper>
    </>
  );
}

export default TokenSelector;
