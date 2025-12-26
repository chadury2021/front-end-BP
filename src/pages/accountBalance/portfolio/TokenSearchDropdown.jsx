import React, { useState, useEffect, useMemo, useCallback, useLayoutEffect } from 'react';
import { Box, TextField, MenuItem, Typography, Popover, InputAdornment, CircularProgress, Stack } from '@mui/material';
import { DexTokenIcon, TokenIcon } from '@/shared/components/Icons';
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useWalletTokenBalances } from '@/hooks/useWalletTokenBalances';
import { useDexTokenManager } from '@/shared/context/DexTokenManagerProvider';
import { formatQty } from '@/util';
import { buildTokenId } from '@/shared/dexUtils';

function TokenSearchDropdown({ chainId, value, onChange, disabled, connectedWallet, chainType }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [search, setSearch] = useState('');
  const [popoverWidth, setPopoverWidth] = useState(300);
  const [balancedTokens, setBalancedTokens] = useState({});
  const { loadTokens } = useDexTokenManager();

  // Measure anchor width when popover opens
  useLayoutEffect(() => {
    if (anchorEl) {
      requestAnimationFrame(() => {
        const rect = anchorEl.getBoundingClientRect();
        const width = rect.width || anchorEl.offsetWidth || 300;
        setPopoverWidth(width);
      });
    }
  }, [anchorEl]);

  const {
    balances,
    loading: balanceLoading,
    error: balanceError,
  } = useWalletTokenBalances(connectedWallet, chainId, chainType);

  useEffect(() => {
    const fetchBalancedTokens = async (tokenIds) => {
      const tokens = await loadTokens(tokenIds);
      setBalancedTokens(tokens);
    };

    if (balances?.length > 0) {
      const tokenIds = balances.map((balance) => buildTokenId(balance.address, balance.chain_id));
      fetchBalancedTokens(tokenIds);
    }
  }, [balances]);

  const parsedChainId = parseInt(chainId, 10);

  const displayTokens = useMemo(() => {
    // If we have balances, show only tokens with balances
    let tokensToFilter = balances.filter((balance) => {
      return balancedTokens[buildTokenId(balance.address, balance.chain_id)];
    });
    tokensToFilter = tokensToFilter.map((balance) => {
      const tokenInfo = balancedTokens[buildTokenId(balance.address, balance.chain_id)];
      return {
        ...balance,
        ...tokenInfo,
      };
    });

    if (!search) return tokensToFilter;
    return tokensToFilter.filter(
      (token) =>
        token.symbol.toLowerCase().includes(search.toLowerCase()) ||
        (token.name && token.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, parsedChainId, connectedWallet, balances, balancedTokens]);

  const showNoBalanceWarning = connectedWallet && balances.length === 0 && !balanceLoading && !balanceError;

  const getPlaceholderText = () => {
    if (!chainId) return 'Select network first';
    if (!connectedWallet) return 'Select token';
    if (showNoBalanceWarning) return 'Select token (no balances detected)';
    return 'Select token from balance';
  };

  const getSearchPlaceholderText = () => {
    if (!connectedWallet) return 'Search token name';
    if (showNoBalanceWarning) return 'Search all tokens';
    return 'Search tokens from balance';
  };

  const handleOpen = (event) => {
    if (!disabled) setAnchorEl(event.currentTarget);
    onChange(null);
  };
  const handleClose = () => setAnchorEl(null);

  const renderTokenIcon = (token, style = { width: 30, height: 30 }) => {
    return (
      <DexTokenIcon
        chainId={token.chain_id}
        fallbackIcon={<TokenIcon style={style} tokenName={token.symbol} />}
        logoUrl={token.logo_url}
        showChainIcon={false}
        style={style}
        tokenAddress={token.address}
      />
    );
  };

  const renderTokenItem = (token) => {
    return (
      <MenuItem
        key={token.address}
        selected={token.address === value}
        onClick={() => {
          onChange(token);
          handleClose();
        }}
      >
        <Stack direction='row' spacing={2} sx={{ alignItems: 'center', width: '100%' }}>
          {renderTokenIcon(token)}
          <Box sx={{ flex: 1 }}>
            <Typography>
              {token.symbol}
              {token.name === token.symbol ? '' : ` (${token.name})`}
            </Typography>
            <Typography color='text.secondary' variant='caption'>
              Balance: {parseFloat(token.balance).toFixed(6)}
            </Typography>
          </Box>
        </Stack>
      </MenuItem>
    );
  };

  const isLoading = balanceLoading;

  let dropdownContent;
  if (isLoading) {
    dropdownContent = (
      <Box alignItems='center' display='flex' height='100%' justifyContent='center'>
        <CircularProgress size={24} />
        {balanceLoading && (
          <Typography sx={{ ml: 1 }} variant='caption'>
            Loading wallet balances...
          </Typography>
        )}
      </Box>
    );
  } else if (balanceError) {
    dropdownContent = (
      <MenuItem disabled>
        <em>Error loading balances: {balanceError}</em>
      </MenuItem>
    );
  } else if (displayTokens.length === 0) {
    const noTokensMessage = connectedWallet ? 'No tokens with balance found' : 'No tokens found';
    dropdownContent = (
      <MenuItem disabled>
        <em>{noTokensMessage}</em>
      </MenuItem>
    );
  } else {
    dropdownContent = displayTokens.map(renderTokenItem);
  }

  return (
    <>
      {showNoBalanceWarning && chainId && (
        <Box>
          <Typography color='warning.dark' variant='caption'>
            ⚠️ No token balances found in funding wallet, showing all tokens.
          </Typography>
        </Box>
      )}
      <Box
        sx={{
          cursor: 'pointer',
          border: '1px solid',
          borderColor: disabled ? 'divider' : 'text.secondary',
          borderRadius: 1,
          px: '14px',
          py: 1,
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
          bgcolor: disabled ? 'background.paper' : 'inherit',
          transition: 'border-color 0.2s',
          '&:hover': {
            borderColor: disabled ? 'divider' : 'text.primary',
          },
        }}
        onClick={handleOpen}
      >
        {value ? (
          <Stack direction='row' spacing={2} width='100%'>
            {renderTokenIcon(value, { width: 20, height: 20 })}
            <Typography sx={{ flex: 1 }}>{value.symbol}</Typography>
            <Typography color='text.secondary' variant='caption'>
              Balance: {formatQty(value.balance)}
              {value.balanceUsd && ` (${formatQty(value.balanceUsd, true)})`}
            </Typography>
          </Stack>
        ) : (
          <Typography sx={{ flex: 1, color: 'text.disabled' }}>{getPlaceholderText()}</Typography>
        )}
        <ArrowDropDownIcon color='action' />
      </Box>
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        open={!!anchorEl}
        slotProps={{
          paper: {
            style: {
              width: popoverWidth,
              maxHeight: 400,
            },
          },
        }}
        onClose={handleClose}
      >
        <Box p={2}>
          <TextField
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            placeholder={getSearchPlaceholderText()}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>{dropdownContent}</Box>
      </Popover>
    </>
  );
}

export default TokenSearchDropdown;
