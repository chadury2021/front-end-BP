import React, { useState, useEffect } from 'react';
import { Stack, Typography, Paper, Box, Link, Button } from '@mui/material';
import { useTheme } from '@mui/system';
import { AccountBalanceWalletRounded } from '@mui/icons-material';
import DataComponent from '@/shared/DataComponent';
import EmptyBar from '@/shared/components/EmptyBar';
import { formatQty } from '@/util';
import { ChainIcon } from '@/shared/components/Icons';
import { CHAIN_CONFIGS, NATIVE_TOKENS } from '@/shared/dexUtils';
import { formatWalletAddress, getExplorerUrl } from '@/pages/accountBalance/util';
import { getOKXDEXWallets } from '@/apiServices';
import DepositModal from '@/pages/accountBalance/portfolio/DepositModal';
import WithdrawModal from '@/pages/accountBalance/portfolio/WithdrawModal';
import { useKeyManagementModal } from '../../../shared/context/KeyManagementModalProvider';

function WalletInfoPanel({ selectedAccounts, accounts, balances, selectedChain, quoteLoading }) {
  const theme = useTheme();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [depositAccountId, setDepositAccountId] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletAddressLoading, setWalletAddressLoading] = useState(false);
  const { openModal: openKeyManagementModal } = useKeyManagementModal();

  const selectedAccount = accounts[selectedAccounts?.[0]];

  // Get chain configuration
  const networkConfig = selectedChain ? CHAIN_CONFIGS[selectedChain] : null;

  // Calculate total balance across selected accounts
  const totalBalance = selectedAccounts.reduce((total, accountName) => {
    const account = accounts[accountName];
    const balance = balances[account?.id]; // Use account.id to access balances

    if (balance && balance.assets) {
      const nativeToken = balance.assets.find((asset) => {
        // Get the native token address for the current chain
        const nativeTokenAddress = NATIVE_TOKENS[selectedChain];

        // Check if this asset is the native token for the current chain (case-insensitive)
        // Add null checks to prevent toLowerCase() errors
        if (!asset.symbol || !nativeTokenAddress) return false;

        const isNative =
          asset.symbol.toLowerCase() === nativeTokenAddress.toLowerCase() ||
          asset.symbol.toLowerCase() === `${nativeTokenAddress.toLowerCase()}:${selectedChain}`;

        return isNative;
      });

      return total + (nativeToken?.amount || 0);
    }
    return total;
  }, 0);

  // Fetch real wallet address for DEX accounts
  useEffect(() => {
    const fetchWalletAddress = async () => {
      if (!selectedAccount || selectedAccount.exchangeName !== 'OKXDEX') {
        setWalletAddress(null);
        return;
      }

      setWalletAddressLoading(true);
      try {
        const response = await getOKXDEXWallets(selectedAccount.id);
        // Use the first wallet address (trading wallet) for display
        const address = response.wallets?.[0];
        setWalletAddress(address || null);
      } catch (error) {
        console.error('Failed to fetch wallet address:', error);
        setWalletAddress(null);
      } finally {
        setWalletAddressLoading(false);
      }
    };

    fetchWalletAddress();
  }, [selectedAccount]);

  // Get wallet address - use real address for DEX accounts, fallback for others
  const getWalletAddress = () => {
    if (!selectedAccount) return '-';

    // For DEX accounts, use the fetched real wallet address
    if (selectedAccount.exchangeName === 'OKXDEX') {
      return walletAddress || '-';
    }

    // For non-DEX accounts, use the api_secret (which may be masked)
    if (selectedAccount.api_secret) {
      return selectedAccount.api_secret;
    }

    // Fallback to account fields if api_secret is not available
    const address = selectedAccount.address || selectedAccount.id || '-';
    return address;
  };

  const address = getWalletAddress();

  // Check if any account is selected
  const hasSelectedAccount = selectedAccounts && selectedAccounts.length > 0 && selectedAccount;

  const handleConnectWallet = () => {
    openKeyManagementModal();
  };

  return (
    <>
      <Paper elevation={1} sx={{ py: 1, px: 2, bgcolor: theme.palette.background.card }}>
        <Stack direction='column' spacing={1}>
          {/* Header */}
          <Stack alignItems='center' direction='row' spacing={1}>
            <AccountBalanceWalletRounded sx={{ fontSize: '1rem', color: 'text.secondary' }} />
            <Typography variant='body1Strong'>Trading Wallet Info</Typography>
          </Stack>

          {/* Show message when no account is selected */}
          {!hasSelectedAccount && (
            <Stack spacing={2} sx={{ py: 2 }}>
              <Typography color='text.secondary' sx={{ textAlign: 'center' }} variant='small1'>
                Select an account to view wallet information
              </Typography>
              <Button fullWidth color='primary' size='x-small' variant='contained' onClick={handleConnectWallet}>
                <Typography color='primary.contrastText' variant='button2'>
                  Connect Wallet
                </Typography>
              </Button>
            </Stack>
          )}

          {/* Network Info - only show when account is selected */}
          {hasSelectedAccount && (
            <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography color='text.secondary' variant='small1'>
                Network
              </Typography>
              <DataComponent isLoading={quoteLoading} loadingComponent={<EmptyBar />}>
                <Stack alignItems='center' direction='row' spacing={1}>
                  <Typography variant='small1'>{networkConfig?.name || '-'}</Typography>
                  {selectedChain && <ChainIcon chainId={selectedChain} style={{ width: '16px', height: '16px' }} />}
                </Stack>
              </DataComponent>
            </Stack>
          )}

          {/* Native Token Balance - only show when account is selected */}
          {hasSelectedAccount && (
            <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography color='text.secondary' variant='small1'>
                Available Gas
              </Typography>
              <DataComponent isLoading={quoteLoading} loadingComponent={<EmptyBar />}>
                <Stack alignItems='center' direction='row' spacing={1}>
                  <Typography variant='small1'>{formatQty(totalBalance, false, 4)}</Typography>
                  {networkConfig?.symbol && (
                    <Typography color='text.secondary' variant='small1'>
                      {networkConfig.symbol}
                    </Typography>
                  )}
                </Stack>
              </DataComponent>
            </Stack>
          )}

          {/* Wallet Address - only show when account is selected */}
          {hasSelectedAccount && (
            <Stack direction='row' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography color='text.secondary' variant='small1'>
                Address
              </Typography>
              <DataComponent isLoading={quoteLoading || walletAddressLoading} loadingComponent={<EmptyBar />}>
                {address && address !== '-' ? (
                  <Link
                    href={getExplorerUrl(address, selectedChain)}
                    rel='noopener noreferrer'
                    sx={{
                      color: 'text.primary',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                    target='_blank'
                  >
                    <Typography variant='small1'>
                      {(() => {
                        const fullAddress = address.startsWith('0x') ? address : `0x${address}`;
                        if (fullAddress.length <= 10) return fullAddress;
                        return `${fullAddress.slice(0, 6)}...${fullAddress.slice(-4)}`;
                      })()}
                    </Typography>
                  </Link>
                ) : (
                  <Typography variant='small1'>-</Typography>
                )}
              </DataComponent>
            </Stack>
          )}

          {/* Deposit and Withdraw Buttons - only show when account is selected */}
          {hasSelectedAccount && (
            <Stack direction='row' spacing={1} sx={{ mt: 1 }}>
              <Button
                color='primary'
                size='small'
                sx={{ flex: 1 }}
                variant='contained'
                onClick={() => {
                  setDepositAccountId(selectedAccount?.id);
                  setDepositModalOpen(true);
                }}
              >
                <Typography color='primary.contrastText' variant='button1'>
                  Deposit
                </Typography>
              </Button>
              <Button size='small' sx={{ flex: 1 }} variant='outlined' onClick={() => setWithdrawModalOpen(true)}>
                <Typography variant='button1'>Withdraw</Typography>
              </Button>
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* Deposit Modal */}
      <DepositModal
        accountId={depositAccountId}
        open={depositModalOpen}
        onClose={() => {
          setDepositModalOpen(false);
          setDepositAccountId(null);
        }}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        accountId={selectedAccount?.id}
        balances={balances[selectedAccount?.id]?.assets || []}
        open={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
      />
    </>
  );
}

export default WalletInfoPanel;
