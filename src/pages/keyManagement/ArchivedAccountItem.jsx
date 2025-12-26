import { Box, Icon, Typography, Grid, IconButton, Link, Skeleton, Button } from '@mui/material';
import { useTheme } from '@mui/system';
import { useEffect, useState } from 'react';
import { Unarchive, ContentCopy } from '@mui/icons-material';
import { TreadTooltip } from '@/shared/components/LabelTooltip';
import { getOKXDEXWallets } from '@/apiServices';
import { getExplorerUrl } from '@/pages/accountBalance/util';
import { ChainIcon } from '@/shared/components/Icons';
import ICONS from '../../../images/exchange_icons';
import WALLET_ICONS from '../../../images/wallet_icons';
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

function ArchivedAccountItem({
  id,
  accountName,
  exchangeName,
  apiKey,
  createdAt,
  onUnarchiveAccount,
  hashedApiKey,
  credentialOptions,
  walletProvider,
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

  const handleUnarchiveOnClick = async () => {
    onUnarchiveAccount({ accountId: id, accountName, exchangeName });
  };

  const getIconComponent = () => {
    if (walletProvider) {
      return WALLET_ICONS[walletProvider.toLowerCase()] || WALLET_ICONS.default;
    }
    return ICONS[exchangeName.toLowerCase()] || ICONS.default;
  };

  // For DEX accounts, get wallet addresses and network info
  const parentWalletAddress = isDEXAccount ? dexWallets?.parentWallet : null;
  const tradingWalletAddress = isDEXAccount ? dexWallets?.tradingWallet : null;

  let walletTypeDisplay = null;
  let networkChainId = null;

  if (isDEXAccount && (dexWallets?.walletType || walletProvider)) {
    const provider = dexWallets?.walletProvider || walletProvider;
    if (provider?.includes('solana') || provider?.includes('phantom')) {
      walletTypeDisplay = 'SOL';
      networkChainId = '501';
    } else {
      walletTypeDisplay = 'EVM';
      networkChainId = '1';
    }
  }

  const handleCopyAddress = async (address, label) => {
    try {
      // For EVM addresses, ensure proper 0x prefix
      const fullAddress = networkChainId !== '501' && !address.startsWith('0x') ? `0x${address}` : address;
      await navigator.clipboard.writeText(fullAddress);
      setCopiedAddress(label);

      // Reset copied state after 2 seconds (no showAlert for archived accounts)
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const displaySettings = ['OKX', 'Binance', 'Bybit'].includes(exchangeName);
  const enabledOptions = Object.entries(credentialOptions).filter(([key, value]) => value);

  const enabledOptionsDisplay = credentialOptions.default
    ? 'All'
    : enabledOptions.map(([key]) => marketOptionDisplayValue(key)).join(', ');

  // Check if there are any enabled markets to show
  const hasEnabledMarkets = enabledOptionsDisplay && enabledOptionsDisplay !== '';

  const renderWalletAddress = (address, label) => {
    if (walletLoading && isDEXAccount) {
      return (
        <Box>
          <Typography color="text.secondary" sx={{ mb: 0.5 }} variant="body2">
            {label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Skeleton height={16} variant="circular" width={16} />
            <Skeleton height={20} variant="text" width={120} />
          </Box>
        </Box>
      );
    }

    if (!address || address === '-') {
      return (
        <Box>
          <Typography color="text.secondary" sx={{ mb: 0.5 }} variant="body2">
            {label}
          </Typography>
          <Typography variant="body1">-</Typography>
        </Box>
      );
    }

    // Format address based on wallet type
    let truncatedAddress;
    if (networkChainId === '501') {
      // Solana addresses - no 0x prefix
      truncatedAddress = address.length > 10 ?
        `${address.slice(0, 6)}...${address.slice(-4)}` : address;
    } else {
      // EVM addresses - ensure 0x prefix for display
      const fullAddress = address.startsWith('0x') ? address : `0x${address}`;
      truncatedAddress = fullAddress.length > 10 ?
        `${fullAddress.slice(0, 6)}...${fullAddress.slice(-4)}` : fullAddress;
    }

    // For EVM wallets, provide multiple explorer options
    const renderEvmExplorerIcons = () => {
      const evmChains = [
        { id: '1', name: 'Ethereum', url: getExplorerUrl(address, '1') },
        { id: '56', name: 'BSC', url: getExplorerUrl(address, '56') },
        { id: '8453', name: 'Base', url: getExplorerUrl(address, '8453') }
      ];

      return evmChains.map((chain) => (
        <Link
          href={chain.url}
          key={chain.id}
          rel="noopener noreferrer"
          sx={{
            display: 'flex',
            alignItems: 'center',
            '&:hover': {
              opacity: 0.7,
            },
          }}
          target="_blank"
        >
          <ChainIcon chainId={chain.id} style={{ width: 16, height: 16 }} />
        </Link>
      ));
    };

    return (
      <Box>
        <Typography color="text.secondary" sx={{ mb: 0.5 }} variant="body2">
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
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  '&:hover': {
                    opacity: 0.7,
                  },
                }}
                target="_blank"
              >
                <ChainIcon chainId={networkChainId} style={{ width: 16, height: 16 }} />
              </Link>
            ) : (
              // EVM - multiple explorer icons
              renderEvmExplorerIcons()
            )}
          </Box>
          <Typography variant="body1">{truncatedAddress}</Typography>

          {/* Copy Button */}
          <IconButton
            size="small"
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

  // Clean account name (remove archived suffix)
  const cleanAccountName = accountName.includes('_archived_') ?
    accountName.split('_archived_')[0] : accountName;

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '12px',
        p: 2,
        opacity: 0.7, // Make archived accounts appear slightly faded
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          opacity: 0.85,
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
            <img alt="exchange icon" src={getIconComponent()} />
          </Icon>
          <Box>
            <Typography sx={{ mb: 0 }} variant="h6">
              {cleanAccountName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography color="text.secondary" variant="body2">
                Added: {formatDateString(createdAt)}
              </Typography>
              <Typography color="warning.main" sx={{ fontStyle: 'italic', fontSize: '0.75rem' }} variant="body2">
                • Archived
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Unarchive Button */}
        <Button
          size="small"
          startIcon={<Unarchive variant="body1" />}
          sx={{
            color: theme.palette.primary.main,
            borderColor: theme.palette.primary.main,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              backgroundColor: `${theme.palette.primary.main}10`,
            },
          }}
          variant="outlined"
          onClick={handleUnarchiveOnClick}
        >
          Unarchive
        </Button>
      </Box>

      {/* Details Grid */}
      <Grid container spacing={2}>
        {isDEXAccount ? (
          // DEX Account Layout: Parent Wallet, Trading Wallet, Wallet Type, Empty
          <>
            <Grid item xs={3}>
              {renderWalletAddress(parentWalletAddress, 'Parent Wallet')}
            </Grid>

            <Grid item xs={3}>
              {renderWalletAddress(tradingWalletAddress, 'Trading Wallet')}
            </Grid>

            <Grid item xs={3}>
              <Typography color="text.secondary" sx={{ mb: 0.5 }} variant="body2">
                Wallet Type
              </Typography>
              {walletLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Skeleton height={16} variant="circular" width={16} />
                  <Skeleton height={20} variant="text" width={60} />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {networkChainId && (
                    <ChainIcon chainId={networkChainId} style={{ width: 16, height: 16 }} />
                  )}
                  <Typography variant="body1">
                    {walletTypeDisplay || 'Unknown'}
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* Empty 4th column to match CEX layout width */}
            <Grid item xs={3} />
          </>
        ) : (
          // CEX Account Layout: Key, Enabled Markets, Position Mode, Margin Mode
          <>
            <Grid item xs={3}>
              <Typography color="text.secondary" sx={{ mb: 0.5 }} variant="body2">
                Key
              </Typography>
              <Typography variant="body1">
                {apiKey ? apiKey.substring(0, 5) + '*'.repeat(8) : '*'.repeat(13)}
              </Typography>
            </Grid>

            {exchangeName !== 'Hyperliquid' && (
              <Grid item xs={3}>
                <Typography color="text.secondary" sx={{ mb: 0.5 }} variant="body2">
                  Enabled Markets
                </Typography>
                <Typography variant="body1">
                  {hasEnabledMarkets ? enabledOptionsDisplay : ''}
                </Typography>
              </Grid>
            )}

            <Grid item xs={3}>
              <Typography color="text.secondary" sx={{ mb: 0.5 }} variant="body2">
                Position Mode
              </Typography>
              <Typography variant="body1">
                One-way Mode
              </Typography>
            </Grid>

            <Grid item xs={3}>
              <Typography color="text.secondary" sx={{ mb: 0.5 }} variant="body2">
                Margin Mode
              </Typography>
              <Typography variant="body1">
                Cross
              </Typography>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}

export { ArchivedAccountItem };
