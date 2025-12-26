import { CircularProgress, Stack, Typography, Box, Skeleton, IconButton, Tooltip } from '@mui/material';
import WalletIcon from '@mui/icons-material/Wallet';
import RefreshIcon from '@mui/icons-material/Refresh';
import React, { useState, useEffect } from 'react';
import { numberWithCommas, smartRound } from '../../util';
import { refreshAccountBalanceCache } from '../../apiServices';

export default function BalancePreview({
  isBase,
  isBalanceLoading,
  isReadyToPickQty,
  selectedPair,
  totalBaseAsset,
  totalQuoteAsset,
  selectedAccounts,
  accounts,
  setBalances,
  balances,
}) {
  const [showLoadingSkeleton, setShowLoadingSkeleton] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Show loading skeleton when user selects account
  useEffect(() => {
    if (isReadyToPickQty) {
      setShowLoadingSkeleton(true);
      // Hide skeleton after a short delay to simulate loading
      const timer = setTimeout(() => {
        setShowLoadingSkeleton(false);
      }, 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isReadyToPickQty]);

  const renderBalance = () => {
    if (!selectedPair) {
      return '0.00';
    }

    if (!isReadyToPickQty) {
      const pair = isBase ? selectedPair.base : selectedPair.quote;
      return `0.00 ${pair}`;
    }

    const balance = isBase ? totalBaseAsset() : totalQuoteAsset();

    if (!balance) {
      const pair = isBase ? selectedPair.base : selectedPair.quote;
      return `0.00 ${pair}`;
    }

    const pair = isBase ? selectedPair.base : selectedPair.quote;

    return `${numberWithCommas(smartRound(balance))} ${pair}`;
  };

  const shouldShowLoadingMask = isBalanceLoading || showLoadingSkeleton || isRefreshing;

  const handleRefreshBalances = async () => {
    if (!selectedAccounts || selectedAccounts.length === 0) return;

    setIsRefreshing(true);

    try {
      // Refresh balance cache for all selected accounts
      const refreshPromises = selectedAccounts.map((accountName) => {
        const account = accounts[accountName];
        if (account) {
          return refreshAccountBalanceCache(account.id);
        }
        return Promise.resolve();
      });

      await Promise.all(refreshPromises);

      // Trigger a re-fetch of balances by updating the balances state
      // This will cause the parent component to re-fetch the balance data
      if (setBalances) {
        // Force a refresh by setting a temporary value and then clearing it
        setBalances({ ...balances, _refresh: Date.now() });
        setTimeout(() => {
          setBalances((prev) => {
            const { _refresh, ...rest } = prev;
            return rest;
          });
        }, 100);
      }
    } catch (error) {
      console.error('Failed to refresh balances:', error);
    } finally {
      // Keep the loading state active for a bit longer to show the refresh happened
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  return (
    <Stack alignItems='center' direction='row' gap={0} justifyContent='flex-end'>
      <WalletIcon
        sx={{
          height: '16px',
          width: '16px',
          color: !isReadyToPickQty || isBalanceLoading ? 'grey.main' : 'grey.disabled',
          pr: 0.5,
        }}
      />
      {shouldShowLoadingMask ? (
        <Skeleton animation='wave' height='16px' variant='rounded' width='80px' />
      ) : (
        <Typography variant='body2'>{renderBalance()}</Typography>
      )}
      {selectedAccounts && selectedAccounts.length > 0 && (
        <Tooltip title='Refresh account balances'>
          <IconButton
            disabled={isRefreshing || isBalanceLoading || !isReadyToPickQty}
            size='small'
            sx={{
              ml: 0.5,
              p: 0.25,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
            onClick={handleRefreshBalances}
          >
            <RefreshIcon
              sx={{
                fontSize: '14px',
                color: !isReadyToPickQty || isRefreshing || isBalanceLoading ? 'grey.main' : 'grey.disabled',
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': {
                    transform: 'rotate(0deg)',
                  },
                  '100%': {
                    transform: 'rotate(360deg)',
                  },
                },
              }}
            />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}
