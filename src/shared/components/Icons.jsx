import React from 'react';
import { Icon, Box, useTheme } from '@mui/material';
import getBaseTokenIcon from '@images/tokens';
import EXCHANGE_ICONS from '@images/exchange_icons';
import CHAIN_ICONS from '@images/chain_icons';
import getDexTokenIcon from '@images/dex_tokens';
import WALLET_TYPE_ICONS from '@images/wallet_icons';

function TokenIcon({ tokenName, style = {}, useFallback = false, logoUrl = null, chainId = null }) {
  const theme = useTheme();

  if (!tokenName) {
    return null;
  }

  const [base, quote] = tokenName.split('-');
  const [parsedTokenName, parsedChainId] = base.split(':'); // parse for perp tokens or for dex tokens
  if (parsedChainId && !Number.isNaN(Number(parsedChainId))) {
    return <DexTokenIcon chainId={parsedChainId} logoUrl={logoUrl} style={style} tokenAddress={parsedTokenName} />;
  }

  const tokenIconSrc = getBaseTokenIcon(parsedTokenName) || logoUrl;

  if (!tokenIconSrc) {
    // Fallback icon for missing tokens
    if (useFallback) {
      // Simple gray circle fallback (for shareable components)
      return (
        <Box
          sx={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.palette.grey[700],
            borderRadius: '50%',
          }}
        />
      );
    }
    // Default behavior for the rest of the app
    return <div style={{ ...style, borderRadius: '50%' }} />;
  }

  if (chainId) {
    return (
      <Box
        sx={{
          height: style.height || '1.4rem',
          width: style.width || '1.4rem',
          minHeight: style.minHeight || '1.4rem',
          minWidth: style.minWidth || '1.4rem',
          position: 'relative',
          ...style,
        }}
      >
        <img
          alt={`${parsedTokenName} icon`}
          src={tokenIconSrc}
          style={{ height: 'inherit', width: 'inherit', borderRadius: '50%', objectFit: 'cover' }}
        />
        <Box bottom={0} position='absolute' right={0} sx={{ transform: 'translate(25%, 25%)' }}>
          <ChainIcon chainId={chainId} style={{ height: '0.75rem', width: '0.75rem' }} />
        </Box>
      </Box>
    );
  }

  return <img alt={`${parsedTokenName} icon`} src={tokenIconSrc} style={{ ...style, borderRadius: '50%' }} />;
}

function ExchangeIcon({ exchangeName, style = {} }) {
  return (
    <Box sx={{ ...style }}>
      <img
        alt={`${exchangeName} icon`}
        src={EXCHANGE_ICONS[exchangeName?.toLowerCase()] || EXCHANGE_ICONS.default}
        style={{ height: 'inherit', width: 'inherit', borderRadius: '50%', objectFit: 'cover' }}
      />
    </Box>
  );
}

function ChainIcon({ chainId, style = {} }) {
  return (
    <img
      alt={`${chainId} icon`}
      src={CHAIN_ICONS[chainId] || CHAIN_ICONS.default}
      style={{ borderRadius: '50%', ...style }}
    />
  );
}

function DexTokenIcon({
  tokenAddress,
  chainId,
  style = {},
  useFallback = false,
  showChainIcon = true,
  fallbackIcon = null,
  logoUrl = null,
}) {
  const theme = useTheme();
  const tokenIconSrc = getDexTokenIcon(tokenAddress, chainId) || logoUrl;
  if (!tokenIconSrc) {
    // Fallback icon for missing tokens
    if (useFallback) {
      // Simple gray circle fallback (for shareable components)
      return (
        <Box
          sx={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.palette.grey[700],
            borderRadius: '50%',
            height: style.height || '20px',
            width: style.width || '20px',
            minHeight: style.minHeight || style.height || '20px',
            minWidth: style.minWidth || style.width || '20px',
            flexShrink: 0,
          }}
        />
      );
    }
    // Default behavior for the rest of the app
    return fallbackIcon || <div style={style} />;
  }

  if (showChainIcon && chainId) {
    return (
      <Box
        sx={{
          height: style.height || '1.4rem',
          width: style.width || '1.4rem',
          minHeight: style.minHeight || '1.4rem',
          minWidth: style.minWidth || '1.4rem',
          position: 'relative',
          ...style,
        }}
      >
        <img
          alt='icon'
          src={tokenIconSrc}
          style={{ height: 'inherit', width: 'inherit', borderRadius: '50%', objectFit: 'cover' }}
        />
        <Box bottom={0} position='absolute' right={0} sx={{ transform: 'translate(25%, 25%)' }}>
          <ChainIcon chainId={chainId} style={{ height: '0.75rem', width: '0.75rem' }} />
        </Box>
      </Box>
    );
  }

  return <img alt={`${tokenAddress} icon`} src={tokenIconSrc} style={{ borderRadius: '50%', ...style }} />;
}

function WalletProviderIcon({ walletProvider, walletType, style = {} }) {
  const walletIcon = (
    <img
      alt={`${walletProvider} icon`}
      src={WALLET_TYPE_ICONS[walletProvider] || WALLET_TYPE_ICONS.default}
      style={{ borderRadius: '50%', ...style }}
    />
  );

  // If walletType is provided, show it as a smaller overlay icon
  if (walletType) {
    const getChainIdForWalletType = (type) => {
      switch (type?.toLowerCase()) {
        case 'evm':
        case 'ethereum':
          return '1'; // Ethereum
        case 'solana':
          return '501'; // Solana
        default:
          return null;
      }
    };

    const chainId = getChainIdForWalletType(walletType);

    if (chainId) {
      return (
        <Box
          sx={{
            height: style.height || '1.4rem',
            width: style.width || '1.4rem',
            minHeight: style.minHeight || '1.4rem',
            minWidth: style.minWidth || '1.4rem',
            position: 'relative',
            ...style,
          }}
        >
          <img
            alt={`${walletProvider} icon`}
            src={WALLET_TYPE_ICONS[walletProvider] || WALLET_TYPE_ICONS.default}
            style={{ height: 'inherit', width: 'inherit', borderRadius: '50%' }}
          />
          <Box bottom={0} position='absolute' right={0} sx={{ transform: 'translate(40%, 40%)' }}>
            <ChainIcon chainId={chainId} style={{ height: '0.75rem', width: '0.75rem' }} />
          </Box>
        </Box>
      );
    }
  }

  return walletIcon;
}

export { TokenIcon, ExchangeIcon, ChainIcon, DexTokenIcon, WalletProviderIcon };
