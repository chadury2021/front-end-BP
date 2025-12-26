import useConnectWallet from '@/shared/context/WalletProvider';
import { CHAIN_TYPES } from '@/shared/dexUtils';
import { Avatar, Box, Button, Stack, Typography } from '@mui/material';
import React from 'react';

import ethChainIcon from '@images/chain_icons/1.webp';
import solChainIcon from '@images/chain_icons/501.webp';
import metamaskIcon from '@images/wallet_icons/metamask.svg';
import phantomIcon from '@images/wallet_icons/phantom.svg';
import solflareIcon from '@images/wallet_icons/solflare.svg';
import treadIcon from '@/../branding/logo.svg';

const WALLET_ICONS = {
  metamask: metamaskIcon,
  phantom: phantomIcon,
  phantom_eth: phantomIcon,
  solflare: solflareIcon,
  default: treadIcon,
};

const CHAIN_ICONS = {
  [CHAIN_TYPES.ETHEREUM]: ethChainIcon,
  [CHAIN_TYPES.SOLANA]: solChainIcon,
};

function WalletSelector({ onConnect, walletType = undefined }) {
  const { availableWallets, connectWallet } = useConnectWallet();

  const handleConnect = async (wallet, chainType) => {
    if (!wallet) return;

    try {
      const data = await connectWallet({ selectedChainType: chainType, walletProviderId: wallet.id });
      onConnect?.(data);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      onConnect?.(null);
    }
  };

  const handleWalletSelect = (wallet, chainType) => {
    handleConnect(wallet, chainType);
  };

  const getAllWallets = () => {
    const wallets = [];

    if (availableWallets[CHAIN_TYPES.ETHEREUM]) {
      availableWallets[CHAIN_TYPES.ETHEREUM].forEach((wallet) => {
        wallets.push({ ...wallet, chainType: CHAIN_TYPES.ETHEREUM });
      });
    }

    if (availableWallets[CHAIN_TYPES.SOLANA]) {
      availableWallets[CHAIN_TYPES.SOLANA].forEach((wallet) => {
        wallets.push({ ...wallet, chainType: CHAIN_TYPES.SOLANA });
      });
    }

    if (walletType) {
      return wallets.filter((wallet) => wallet.chainType === walletType);
    }

    return wallets;
  };

  const allWallets = getAllWallets();

  if (allWallets.length === 0) {
    return (
      <Box py={4} textAlign='center'>
        <Typography color='text.secondary' variant='body1'>
          No wallets detected
        </Typography>
        <Typography color='text.secondary' sx={{ mt: 1 }} variant='body2'>
          Please install a supported wallet like MetaMask, Phantom, or others
        </Typography>
      </Box>
    );
  }

  const getWalletIcon = (wallet) => {
    // If wallet has its own icon (from our enhanced detection)
    if (wallet.icon) {
      return wallet.icon;
    }

    // Fallback to our static icons
    return WALLET_ICONS[wallet.id];
  };

  return (
    <Stack spacing={2}>
      {allWallets.map((wallet) => (
        <Button
          fullWidth
          key={`${wallet.chainType}-${wallet.id}`}
          size='large'
          startIcon={
            <Box position='relative'>
              <Avatar
                alt={`${wallet.name} icon`}
                src={getWalletIcon(wallet)}
                sx={{
                  width: 40,
                  height: 40,
                  '& img': {
                    width: wallet.name === 'MetaMask' ? '80%' : '100%',
                    height: wallet.name === 'MetaMask' ? '80%' : '100%',
                    objectFit: 'contain',
                  },
                }}
              />
              <Avatar
                sx={{
                  position: 'absolute',
                  bottom: -8,
                  right: -8,
                  width: 20,
                  height: 20,
                  bgcolor: 'transparent',
                  border: 2,
                  borderColor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '& img': {
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  },
                }}
              >
                <img alt={`${wallet.chainType} icon`} src={CHAIN_ICONS[wallet.chainType]} />
              </Avatar>
            </Box>
          }
          sx={{
            justifyContent: 'flex-start',
            py: 2,
            px: 3,
            textTransform: 'none',
          }}
          variant='outlined'
          onClick={() => handleWalletSelect(wallet, wallet.chainType)}
        >
          <Box textAlign='left' width='100%'>
            <Typography variant='h6'>{wallet.name}</Typography>
            <Typography color='text.secondary' variant='body2'>
              {wallet.chainType === CHAIN_TYPES.ETHEREUM ? 'Ethereum' : 'Solana'} Wallet
            </Typography>
          </Box>
        </Button>
      ))}
    </Stack>
  );
}

export default WalletSelector;
