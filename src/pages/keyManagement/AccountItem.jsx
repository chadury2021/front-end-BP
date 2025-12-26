import {
  Box,
  Icon,
  MenuItem,
  Select,
  Typography,
  Grid,
  IconButton,
  Link,
  Skeleton,
  Button,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/system';
import { useEffect, useState } from 'react';
import { Edit, Delete, ContentCopy } from '@mui/icons-material';
import { updateAccount, getOKXDEXWallets, fetchCachedAccountBalances } from '@/apiServices';
import { getExplorerUrl } from '@/pages/accountBalance/util';
import { ChainIcon } from '@/shared/components/Icons';
import ICONS from '@/../images/exchange_icons';
import WALLET_ICONS from '@/../images/wallet_icons';
import { marketOptionDisplayValue } from './utils';

const formatDateString = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', options);
};

// Function to format exchange name display
const formatExchangeNameDisplay = (name) => {
  if (name?.toLowerCase() === 'okx') {
    return 'OKX';
  }
  if (name?.toLowerCase() === 'okxdex') {
    return 'OKXDEX';
  }
  return name;
};

function AccountItem({
  id,
  accountName,
  exchangeName,
  apiKey,
  createdAt,
  marginMode,
  setOpenConfirmModal,
  setConfirmModalText,
  onUnlinkAccount,
  onEditAccount,
  showAlert,
  loadAccounts,
  exchangeSettings,
  hashedApiKey,
  credentialOptions,
  walletProvider,
  onOpenDepositModal,
  onOpenWithdrawModal,
  onOpenHlDepositModal,
  onOpenHlWithdrawModal,
  onOpenHlTransferModal,
}) {
  const theme = useTheme();
  const [dexWallets, setDexWallets] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(null);

  // Check if this is a DEX account
  const isDEXAccount = exchangeName === 'OKXDEX';

  // Fetch DEX wallet addresses
  useEffect(() => {
    const fetchDexWallets = async () => {
      if (!isDEXAccount) {
        setDexWallets(null);
        return;
      }

      setWalletLoading(true);
      try {
        const response = await getOKXDEXWallets(id);
        setDexWallets({
          parentWallet: response.origin_wallet_address,
          tradingWallet: response.wallets?.[0],
          walletType: response.wallet_type,
          walletProvider: response.wallet_provider,
        });
      } catch (error) {
        console.error('Failed to fetch DEX wallets:', error);
        setDexWallets(null);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchDexWallets();
  }, [id, isDEXAccount]);

  // For DEX accounts, get wallet addresses and network info
  const parentWalletAddress = isDEXAccount ? dexWallets?.parentWallet : null;
  const tradingWalletAddress = isDEXAccount ? dexWallets?.tradingWallet : null;

  let walletTypeDisplay = null;
  let networkChainId = null;

  if (isDEXAccount && dexWallets?.walletType) {
    const walletType = dexWallets?.walletType;
    if (walletType?.includes('solana')) {
      walletTypeDisplay = 'SOL';
      networkChainId = '501';
    } else {
      walletTypeDisplay = 'EVM';
      networkChainId = '1';
    }
  }

  const handleDeleteOnClick = async () => {
    setConfirmModalText(`Are you sure you want to unlink account ${accountName}?`);
    onUnlinkAccount({ accountId: id, accountName, exchangeName });
    setOpenConfirmModal(true);
  };

  const handleEditOnClick = () => {
    if (onEditAccount) {
      onEditAccount({
        id,
        accountName,
        exchangeName,
        credentialOptions,
      });
    }
  };

  const handleMarginModeChange = async (newMode) => {
    try {
      await updateAccount({ id, margin_mode: newMode });
    } catch (e) {
      showAlert({
        severity: 'error',
        message: `Could not update margin mode: ${e.message}`,
      });
    }

    loadAccounts();
  };

  const MARGIN_MODES = ['ISOLATED', 'CROSS', 'CASH', 'SPOT_ISOLATED'];

  const getIconComponent = () => {
    if (walletProvider) {
      return WALLET_ICONS[walletProvider.toLowerCase()] || WALLET_ICONS.default;
    }
    return ICONS[exchangeName.toLowerCase()] || ICONS.default;
  };

  const rewritePosMode = (value) => {
    if (value === 'net_mode') {
      return 'One-way Mode';
    }
    if (value === 'long_short_mode') {
      return 'Hedge Mode';
    }
    if (value === 'pair_level') {
      return 'Pair Level';
    }

    return 'Unknown';
  };

  const displaySettings = ['OKX', 'Binance', 'Bybit'].includes(exchangeName);
  const enabledOptions = Object.entries(credentialOptions).filter(([key, value]) => value);

  const enabledOptionsDisplay = credentialOptions.default
    ? 'All'
    : enabledOptions.map(([key]) => marketOptionDisplayValue(key)).join(', ');

  const getMarginModeDisplay = () => {
    if (exchangeName === 'OKX') {
      return marginMode || 'Cross';
    }
    return 'Cross'; // Default for other exchanges
  };

  // Check if there are any enabled markets to show
  const hasEnabledMarkets = enabledOptionsDisplay && enabledOptionsDisplay !== '';

  const handleCopyAddress = async (address, label) => {
    try {
      // For EVM addresses, ensure proper 0x prefix
      const fullAddress = networkChainId !== '501' && !address.startsWith('0x') ? `0x${address}` : address;
      await navigator.clipboard.writeText(fullAddress);
      setCopiedAddress(label);

      // Show success feedback
      showAlert({
        severity: 'success',
        message: `${label} copied to clipboard`,
      });

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      showAlert({
        severity: 'error',
        message: 'Failed to copy address',
      });
    }
  };

  const renderWalletAddress = (address, label) => {
    if (walletLoading && isDEXAccount) {
      return (
        <Box>
          <Typography color='text.secondary' sx={{ mb: 0.5 }} variant='body2'>
            {label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Skeleton height={16} variant='circular' width={16} />
            <Skeleton height={20} variant='text' width={120} />
          </Box>
        </Box>
      );
    }

    if (!address || address === '-') {
      return (
        <Box>
          <Typography color='text.secondary' sx={{ mb: 0.5 }} variant='body2'>
            {label}
          </Typography>
          <Typography variant='body1'>-</Typography>
        </Box>
      );
    }

    // Format address based on wallet type
    let truncatedAddress;
    if (networkChainId === '501') {
      // Solana addresses - no 0x prefix
      truncatedAddress = address.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
    } else {
      // EVM addresses - ensure 0x prefix for display
      const fullAddress = address.startsWith('0x') ? address : `0x${address}`;
      truncatedAddress =
        fullAddress.length > 10 ? `${fullAddress.slice(0, 6)}...${fullAddress.slice(-4)}` : fullAddress;
    }

    // For EVM wallets, provide multiple explorer options
    const renderEvmExplorerIcons = () => {
      const evmChains = [
        { id: '1', name: 'Ethereum', url: getExplorerUrl(address, '1') },
        { id: '56', name: 'BSC', url: getExplorerUrl(address, '56') },
        { id: '8453', name: 'Base', url: getExplorerUrl(address, '8453') },
      ];

      return evmChains.map((chain) => (
        <Link
          href={chain.url}
          key={chain.id}
          rel='noopener noreferrer'
          sx={{
            display: 'flex',
            alignItems: 'center',
            '&:hover': {
              opacity: 0.7,
            },
          }}
          target='_blank'
        >
          <ChainIcon chainId={chain.id} style={{ width: 16, height: 16 }} />
        </Link>
      ));
    };

    return (
      <Box>
        <Typography color='text.secondary' sx={{ mb: 0.5 }} variant='body2'>
          {label}
        </Typography>

        {/* Address and Chain Icons on the same row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Chain Icons as clickable links */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {networkChainId === '501' ? (
              // Solana - single explorer icon
              <Link
                href={getExplorerUrl(address, networkChainId)}
                rel='noopener noreferrer'
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': {
                    opacity: 0.7,
                  },
                }}
                target='_blank'
              >
                <ChainIcon chainId={networkChainId} style={{ width: 16, height: 16 }} />
              </Link>
            ) : (
              // EVM - multiple explorer icons
              renderEvmExplorerIcons()
            )}
          </Box>
          <Typography variant='body1'>{truncatedAddress}</Typography>

          {/* Copy Button */}
          <IconButton
            size='small'
            sx={{
              padding: '2px',
              color: copiedAddress === label ? 'success.main' : 'text.secondary',
              '&:hover': {
                color: 'primary.main',
              },
            }}
            onClick={() => handleCopyAddress(address, label)}
          >
            <ContentCopy sx={{ fontSize: '14px' }} />
          </IconButton>
        </Box>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '12px',
        p: 2,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      {/* Header Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Icon
            sx={{
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              mr: 1.5,
              '& img': {
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
              },
            }}
          >
            <img alt='exchange icon' src={getIconComponent()} />
          </Icon>
          <Box>
            <Typography sx={{ mb: 0 }} variant='h6'>
              {accountName}
            </Typography>
            <Typography color='text.secondary' variant='body2'>
              Added: {formatDateString(createdAt)}
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 0 }}>
          <IconButton size='small' onClick={handleEditOnClick}>
            <Edit fontSize='inherit' sx={{ fontSize: '16px' }} />
          </IconButton>
          <IconButton size='small' onClick={handleDeleteOnClick}>
            <Delete fontSize='inherit' sx={{ fontSize: '16px' }} />
          </IconButton>
        </Box>
      </Box>

      {/* Details Grid */}
      <Grid container spacing={2}>
        {isDEXAccount ? (
          // DEX Account Layout: Parent Wallet, Trading Wallet, Wallet Type, Action Buttons
          <>
            <Grid item xs={3}>
              {renderWalletAddress(parentWalletAddress, 'Parent Wallet')}
            </Grid>

            <Grid item xs={3}>
              {renderWalletAddress(tradingWalletAddress, 'Trading Wallet')}
            </Grid>

            <Grid item xs={3}>
              <Typography color='text.secondary' sx={{ mb: 0.5 }} variant='body2'>
                Wallet Type
              </Typography>
              {walletLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Skeleton height={16} variant='circular' width={16} />
                  <Skeleton height={20} variant='text' width={60} />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {networkChainId && <ChainIcon chainId={networkChainId} style={{ width: 16, height: 16 }} />}
                  <Typography variant='body1'>{walletTypeDisplay || 'Unknown'}</Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={3}>
              <Stack direction='row' spacing={1}>
                <Button
                  color='primary'
                  size='small'
                  sx={{ minWidth: '80px' }}
                  variant='contained'
                  onClick={() => onOpenDepositModal(id)}
                >
                  <Typography color='primary.contrastText' variant='body1'>
                    Deposit
                  </Typography>
                </Button>
                <Button
                  size='small'
                  sx={{ minWidth: '80px' }}
                  variant='outlined'
                  onClick={async () => {
                    try {
                      const cachedBalances = await fetchCachedAccountBalances([accountName]);
                      const balance = cachedBalances?.balances.find((b) => b.account_name === accountName);
                      onOpenWithdrawModal(id, balance?.assets);
                    } catch (error) {
                      showAlert({
                        severity: 'error',
                        message: `Failed to load balances: ${error.message}`,
                      });
                    }
                  }}
                >
                  <Typography variant='body1'>Withdraw</Typography>
                </Button>
              </Stack>
            </Grid>
          </>
        ) : (
          // CEX Account Layout: Key, Enabled Markets, Position Mode, Margin Mode
          <>
            <Grid item xs={3}>
              <Typography color='text.secondary' sx={{ mb: 0.5 }} variant='body2'>
                Key
              </Typography>
              <Typography variant='body1'>
                {apiKey ? apiKey.substring(0, 5) + '*'.repeat(8) : '*'.repeat(13)}
              </Typography>
            </Grid>

            {exchangeName !== 'Hyperliquid' && (
              <Grid item xs={3}>
                <Typography color='text.secondary' sx={{ mb: 0.5 }} variant='body2'>
                  Enabled Markets
                </Typography>
                <Typography variant='body1'>{hasEnabledMarkets ? enabledOptionsDisplay : ''}</Typography>
              </Grid>
            )}

            <Grid item xs={3}>
              <Typography color='text.secondary' sx={{ mb: 0.5 }} variant='body2'>
                Position Mode
              </Typography>
              <Typography variant='body1'>
                {exchangeSettings && exchangeSettings.pos_mode
                  ? rewritePosMode(exchangeSettings.pos_mode)
                  : 'One-way Mode'}
              </Typography>
            </Grid>

            <Grid item xs={3}>
              <Typography color='text.secondary' sx={{ mb: 0.5 }} variant='body2'>
                Margin Mode
              </Typography>
              {exchangeName === 'OKX' ? (
                <Select
                  size='small'
                  sx={{
                    minWidth: 80,
                    '& .MuiSelect-select': {
                      fontSize: '0.7rem',
                      py: 0,
                    },
                  }}
                  value={marginMode || 'CROSS'}
                  variant='standard'
                  onChange={(e) => handleMarginModeChange(e.target.value)}
                >
                  {MARGIN_MODES.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {mode}
                    </MenuItem>
                  ))}
                </Select>
              ) : (
                <Typography variant='body1'>{getMarginModeDisplay()}</Typography>
              )}
            </Grid>

            {exchangeName === 'Hyperliquid' && (
              <Grid item xs={3}>
                <Stack direction='column' spacing={1}>
                  <Stack direction='row' spacing={1}>
                    <Button
                      color='primary'
                      size='small'
                      sx={{ minWidth: '80px' }}
                      variant='contained'
                      onClick={() => onOpenHlDepositModal(apiKey)}
                    >
                      <Typography color='primary.contrastText' variant='body1'>
                        Deposit
                      </Typography>
                    </Button>
                    <Button
                      size='small'
                      sx={{ minWidth: '80px' }}
                      variant='outlined'
                      onClick={() => onOpenHlWithdrawModal(apiKey)}
                    >
                      <Typography variant='body1'>Withdraw</Typography>
                    </Button>
                  </Stack>
                  <Button
                    size='small'
                    sx={{ width: '164px' }}
                    variant='outlined'
                    onClick={() => onOpenHlTransferModal(apiKey)}
                  >
                    <Typography variant='body1'>Transfer</Typography>
                  </Button>
                </Stack>
              </Grid>
            )}
          </>
        )}
      </Grid>
    </Box>
  );
}

export { AccountItem };
