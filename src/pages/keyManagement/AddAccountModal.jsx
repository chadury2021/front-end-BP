import React, { useEffect, useState } from 'react';

import { addExchangeAccount, addOKXDEXAccount } from '@/apiServices';
import { useTheme } from '@mui/material/styles';
import useConnectWallet from '@/shared/context/WalletProvider';
import { CHAIN_TYPES, okxDexWalletSign } from '@/shared/dexUtils';
import { ExchangeIcons } from '@/shared/iconUtil';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Checkbox, FormControlLabel, FormGroup, Link, Switch } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Modal from '@mui/material/Modal';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { CopyableValue } from '@/shared/components/CopyableValue';
import Alert from '@mui/material/Alert';
import ErrorIcon from '@mui/icons-material/Error';
import { useNavigate } from 'react-router-dom';
import WalletConnectionField from '../accountBalance/portfolio/WalletConnectionField';
import { addHyperliquidAccount } from './hyperliquidApprovals';
import { addAsterAccount } from './asterApprovals';
import { addPacificaAccount } from './pacificaApprovals';
import { addParadexAccount } from './paradexApprovals';
import { marketOptionDisplayValue } from './utils';

const EXCHANGE_REFERRAL_LINKS = {
  Binance: 'https://accounts.binance.com/register?ref=863805071',
  OKX: 'https://okx.com/join/63683336',
  Bybit: 'https://partner.bybit.com/b/92689',
  Bitget: 'https://partner.bitget.com/bg/G9RJSE',
  Aster: 'https://www.asterdex.com/en/referral/248Dbf',
  Pacifica: 'https://app.pacifica.fi?referral=treadfi',
  Paradex: 'https://app.paradex.trade/r/treadfi',
};

// Exchange-specific form field configurations
const EXCHANGE_FIELD_CONFIGS = {
  // Standard exchanges with API key/secret
  default: {
    fields: [
      {
        type: 'text',
        key: 'apiKey',
        placeholder: 'API Key',
        required: true,
        autoComplete: 'off',
      },
      {
        type: 'text',
        key: 'apiSecret',
        placeholder: 'API Secret',
        required: true,
        autoComplete: 'off',
      },
    ],
    requiresPassword: false,
    requiresWallet: false,
    requiresMarketOptions: true,
    walletOnly: false,
    needsIpWhitelisting: true,
  },
  OKX: {
    fields: [
      {
        type: 'text',
        key: 'apiKey',
        placeholder: 'API Key',
        required: true,
        autoComplete: 'off',
      },
      {
        type: 'text',
        key: 'apiSecret',
        placeholder: 'API Secret',
        required: true,
        autoComplete: 'off',
      },
    ],
    requiresPassword: true,
    requiresWallet: false,
    requiresMarketOptions: true,
    walletOnly: false,
    needsIpWhitelisting: true,
  },
  Coinbase: {
    fields: [
      {
        type: 'text',
        key: 'apiKey',
        placeholder: 'API Key',
        required: true,
        autoComplete: 'off',
      },
      {
        type: 'text',
        key: 'apiSecret',
        placeholder: 'API Secret',
        required: true,
        autoComplete: 'off',
      },
    ],
    requiresPassword: true,
    requiresWallet: false,
    requiresMarketOptions: true,
    walletOnly: false,
    needsIpWhitelisting: true,
  },
  Bitget: {
    fields: [
      {
        type: 'text',
        key: 'apiKey',
        placeholder: 'API Key',
        required: true,
        autoComplete: 'off',
      },
      {
        type: 'text',
        key: 'apiSecret',
        placeholder: 'API Secret',
        required: true,
        autoComplete: 'off',
      },
    ],
    requiresPassword: true,
    requiresWallet: false,
    requiresMarketOptions: false,
    walletOnly: false,
    needsIpWhitelisting: true,
  },
  // Hyperliquid: wallet connect only
  Hyperliquid: {
    fields: [],
    requiresPassword: false,
    requiresWallet: true,
    requiresMarketOptions: false,
    walletOnly: true,
    walletConnectProps: {
      chainType: CHAIN_TYPES.ETHEREUM,
      infoLink: 'https://tread-labs.gitbook.io/api-docs/connecting-to-exchanges/hyperliquid',
      tooltipText: 'No wallet detected. Click for more info.',
    },
    walletTypeFilter: 'evm',
    needsIpWhitelisting: false,
  },
  // OKXDEX: wallet connect only
  OKXDEX: {
    fields: [],
    requiresPassword: false,
    requiresWallet: true,
    requiresMarketOptions: false,
    walletOnly: true,
    walletConnectProps: {
      multiChain: true,
      chains: [CHAIN_TYPES.ETHEREUM, CHAIN_TYPES.SOLANA],
      tooltipText: 'No wallet detected. Connect a wallet to proceed.',
    },
    needsIpWhitelisting: false,
  },
  // Aster
  Aster: {
    fields: [],
    requiresPassword: false,
    requiresWallet: true,
    requiresMarketOptions: false,
    walletOnly: true,
    walletConnectProps: {
      multiChain: true,
      chains: [CHAIN_TYPES.ETHEREUM, CHAIN_TYPES.SOLANA],
      infoLink: 'https://tread-labs.gitbook.io/api-docs/connecting-to-exchanges/aster',
      tooltipText: 'No wallet detected. Connect a wallet to proceed.',
    },
    needsIpWhitelisting: false,
  },
  // Pacifica
  Pacifica: {
    fields: [],
    requiresPassword: false,
    requiresWallet: true,
    requiresMarketOptions: false,
    walletOnly: true,
    walletConnectProps: {
      chainType: CHAIN_TYPES.SOLANA,
      infoLink: 'https://tread-labs.gitbook.io/api-docs/connecting-to-exchanges/pacifica',
      tooltipText: 'No wallet detected. Click for more info.',
    },
    walletTypeFilter: 'solana',
    needsIpWhitelisting: false,
  },
  // Paradex
  Paradex: {
    fields: [],
    requiresPassword: false,
    requiresWallet: true,
    requiresMarketOptions: false,
    walletOnly: true,
    walletConnectProps: {
      chainType: CHAIN_TYPES.ETHEREUM,
      // infoLink: 'https://tread-labs.gitbook.io/api-docs/connecting-to-exchanges/hyperliquid',
      tooltipText: 'No wallet detected. Click for more info.',
    },
    walletTypeFilter: 'evm',
    needsIpWhitelisting: false,
  },
  // Extended
  Extended: {
    fields: [
      {
        type: 'text',
        key: 'apiKey',
        placeholder: 'API Key',
        required: true,
        autoComplete: 'off',
      },
      {
        type: 'text',
        key: 'apiSecret',
        placeholder: 'Stark Key Private',
        required: true,
        autoComplete: 'off',
      },
      {
        type: 'text',
        key: 'password',
        placeholder: 'Vault Number',
        required: true,
        autoComplete: 'off',
      },
    ],
    requiresPassword: false,
    requiresMarketOptions: false,
    needsIpWhitelisting: false,
  },
};

export function AddAccountModal({
  open,
  setOpen,
  formData,
  loadAccounts,
  showAlert,
  serverIp,
  excludeExchanges = [],
  preSelectedExchange = null,
  onChanged = null,
}) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [selectedExchange, setSelectedExchange] = useState(preSelectedExchange || '');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMarketOptions, setSelectedMarketOptions] = useState({});
  const [preSubmitProcessing, setPreSubmitProcessing] = useState(false);
  const [showOKXDEXSuccess, setShowOKXDEXSuccess] = useState(false);
  const [okxDEXAccountName, setOKXDEXAccountName] = useState('');
  const [showVaultAddress, setShowVaultAddress] = useState(false);
  const [vaultAddress, setVaultAddress] = useState(null);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const { disconnectWallet } = useConnectWallet();
  const navigate = useNavigate();
  const getExchangeConfig = (exchange) => {
    return EXCHANGE_FIELD_CONFIGS[exchange] || EXCHANGE_FIELD_CONFIGS.default;
  };

  const exchangeConfig = getExchangeConfig(selectedExchange);
  const isHyperLiquid = selectedExchange === 'Hyperliquid';
  const isOKXDEX = selectedExchange === 'OKXDEX';

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    minWidth: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    pt: 6, // Add extra top padding to prevent close button overlap
    borderRadius: 3,
  };

  const buttonStyle = {
    width: 70,
    height: 40,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 3,
  };

  const closeButtonStyle = {
    position: 'absolute',
    right: 8,
    top: 16, // Increased from 8 to account for the extra padding
  };

  const handleOKXDEXWalletConnect = async ({ walletType, address, walletProviderName, walletProvider }) => {
    if (!address) {
      showAlert({
        severity: 'error',
        message: `Could not find ${walletType} address: please try again.`,
      });
      return null;
    }

    try {
      const { message, signature } = await okxDexWalletSign(walletType, address, walletProvider);
      return { message, signature, address, walletType, walletProvider: walletProviderName };
    } catch (e) {
      showAlert({
        severity: 'error',
        message: `Could not connect to OKXDEX: ${e.message}`,
      });
      return null;
    }
  };

  const handleHyperliquidWalletConnect = async ({ provider }) => {
    if (!provider) {
      showAlert({
        severity: 'error',
        message: 'Could not find wallet provider: please try again.',
      });
      return null;
    }

    try {
      const { apiKey: ak, apiSecret: as } = await addHyperliquidAccount({
        builderAddress: formData.builder_address,
        provider,
        isMainnet: formData.is_mainnet,
        vaultAddress,
      });

      return { apiKey: ak, apiSecret: as };
    } catch (error) {
      // Handle specific Hyperliquid errors with helpful messages
      const errorMessage = error.message || '';

      if (errorMessage.includes('Must deposit before performing actions')) {
        showAlert({
          severity: 'warning',
          message:
            'Hyperliquid requires a deposit before connecting. Please deposit funds to your Hyperliquid account first, then try connecting again. Visit https://app.hyperliquid.xyz to deposit.',
        });
      } else if (errorMessage.includes('Signature request was rejected')) {
        showAlert({
          severity: 'error',
          message: 'Wallet signature was rejected. Please try again and approve the signature request in your wallet.',
        });
      } else if (errorMessage.includes('Hyperliquid request failed')) {
        // Extract the specific error from the response
        const specificError = errorMessage.replace('Hyperliquid request failed: ', '');
        showAlert({
          severity: 'error',
          message: `Hyperliquid connection failed: ${specificError}. Please ensure your wallet is connected to the correct network and try again.`,
        });
      } else {
        // Generic error handling
        showAlert({
          severity: 'error',
          message: `Could not connect to Hyperliquid: ${errorMessage}`,
        });
      }
      return null;
    }
  };

  const handleAsterWalletConnect = async ({ address, provider, walletType }) => {
    if (!provider) {
      showAlert({
        severity: 'error',
        message: 'Could not find wallet provider: please try again.',
      });
      return null;
    }

    try {
      const { apiKey: ak, apiSecret: as } = await addAsterAccount({ address, provider, walletType });

      return { apiKey: ak, apiSecret: as };
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Could not connect to Aster: ${error.message}`,
      });
      return null;
    }
  };

  const handlePacificaWalletConnect = async ({ provider }) => {
    if (!provider) {
      showAlert({
        severity: 'error',
        message: 'Could not find wallet provider: please try again.',
      });
      return null;
    }

    try {
      const { publicKey, secretKey } = await addPacificaAccount({ provider, isMainnet: formData.is_mainnet });
      return { apiKey: publicKey, apiSecret: secretKey };
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Could not connect to Pacifica: ${error.message}`,
      });
      return null;
    }
  };

  const handleParadexWalletConnect = async ({ provider }) => {
    if (!provider) {
      showAlert({
        severity: 'error',
        message: 'Could not find wallet provider: please try again.',
      });
      return null;
    }

    try {
      const { apiKey: ak, apiSecret: as } = await addParadexAccount({ provider, isMainnet: formData.is_mainnet });
      return { apiKey: ak, apiSecret: as };
    } catch (error) {
      showAlert({
        severity: 'error',
        message: `Could not connect to Paradex: ${error.message}`,
      });
      return null;
    }
  };

  const onWalletConnected = (wallet) => {
    setConnectedWallet(wallet);
  };

  const onCloseModal = () => {
    setOpen(false);
    setPreSubmitProcessing(false);
    setShowOKXDEXSuccess(false);
    setOKXDEXAccountName('');
    setConnectedWallet(null);
    disconnectWallet();
  };

  const handleGoToPortfolio = () => {
    onCloseModal();
    // Navigate to portfolio page with the account name to auto-select
    navigate(`/account_balances?selectedAccount=${encodeURIComponent(okxDEXAccountName)}`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (isOKXDEX) {
        const okxdexResult = await handleOKXDEXWalletConnect({
          address: connectedWallet.address,
          walletType: connectedWallet.chainType,
          walletProviderName: connectedWallet.walletProvider,
          walletProvider: connectedWallet.provider,
        });

        if (!okxdexResult) {
          showAlert({
            severity: 'error',
            message: 'Could not connect to OKXDEX: Try connecting again.',
          });
          return;
        }
        const accountName = name || okxdexResult.address;
        await addOKXDEXAccount({ ...okxdexResult, name: accountName });

        // For OKXDEX, show success flow instead of closing immediately
        setOKXDEXAccountName(accountName);
        setShowOKXDEXSuccess(true);
      } else if (isHyperLiquid) {
        const hyperliquidResult = await handleHyperliquidWalletConnect({
          provider: connectedWallet.provider,
        });
        if (!hyperliquidResult) {
          return;
        }

        const accountName = name || hyperliquidResult.apiKey;
        await addExchangeAccount(
          accountName,
          selectedExchange,
          hyperliquidResult.apiKey,
          hyperliquidResult.apiSecret,
          password,
          selectedMarketOptions,
          vaultAddress
        );

        showAlert({
          severity: 'success',
          message: `Successfully linked ${selectedExchange} account`,
        });
      } else if (selectedExchange === 'Aster') {
        const asterResult = await handleAsterWalletConnect({
          address: connectedWallet.address,
          provider: connectedWallet.provider,
          walletType: connectedWallet.chainType,
        });
        if (!asterResult) {
          return;
        }

        const accountName = name || connectedWallet?.address;
        await addExchangeAccount(
          accountName,
          selectedExchange,
          asterResult.apiKey,
          asterResult.apiSecret,
          password,
          selectedMarketOptions,
          vaultAddress
        );

        showAlert({
          severity: 'success',
          message: `Successfully linked ${selectedExchange} account`,
        });
      } else if (selectedExchange === 'Pacifica') {
        const pacificaResult = await handlePacificaWalletConnect({
          provider: connectedWallet.provider,
        });
        if (!pacificaResult) {
          return;
        }

        const accountName = name || connectedWallet?.address;
        await addExchangeAccount(
          accountName,
          selectedExchange,
          pacificaResult.apiKey,
          pacificaResult.apiSecret,
          password,
          selectedMarketOptions,
          vaultAddress
        );

        showAlert({
          severity: 'success',
          message: `Successfully linked ${selectedExchange} account`,
        });
      } else if (selectedExchange === 'Paradex') {
        const paradexResult = await handleParadexWalletConnect({
          provider: connectedWallet.provider,
        });
        if (!paradexResult) {
          return;
        }

        const accountName = name || connectedWallet?.address;
        await addExchangeAccount(
          accountName,
          selectedExchange,
          paradexResult.apiKey,
          paradexResult.apiSecret,
          password,
          selectedMarketOptions,
          vaultAddress
        );

        showAlert({
          severity: 'success',
          message: `Successfully linked ${selectedExchange} account`,
        });
      } else {
        await addExchangeAccount(name, selectedExchange, apiKey, apiSecret, password, selectedMarketOptions);

        showAlert({
          severity: 'success',
          message: `Successfully linked ${selectedExchange} account`,
        });
      }
      loadAccounts();
      if (onChanged) onChanged();
    } catch (e) {
      if (selectedExchange === 'Pacifica' && e.message.includes('Account not found')) {
        showAlert({
          severity: 'error',
          message: 'Pacifica account not found. Deposit funds into Pacifica to get started.',
        });
        return;
      }

      showAlert({
        severity: 'error',
        message: `Could not link account: ${e.message}`,
      });
    } finally {
      setIsSubmitting(false);
      onCloseModal();
    }
  };

  const UNSUPPORTED_MARKET_OPTIONS = ['coin_futures'];
  const filterCredentialMarketOptions = (options) => {
    return options.filter((option) => !UNSUPPORTED_MARKET_OPTIONS.includes(option));
  };

  const marketOptionDescription = (exchange) => {
    const displayMessages = {
      Binance:
        'Binance separates Spot, Futures, and Options markets.\n' +
        'Select the ones you want to enable for this account.\n' +
        'Important: Portfolio margin accounts are not supported yet.',
      OKX: 'OKX optionally supports OTC through OKX RFQ + Nitro',
      Gate:
        'Make sure to coordinate checkboxes with your Gate account type.\n' +
        'Keep Futures unchecked if you have not enabled it on your account.',
    };

    return displayMessages[exchange] || '';
  };

  const isSubmitDisabled =
    isSubmitting ||
    showOKXDEXSuccess ||
    (exchangeConfig.walletOnly && !connectedWallet) ||
    (!exchangeConfig.walletOnly && name === '') ||
    preSubmitProcessing;

  // Filter exchanges based on props
  const getAvailableExchanges = () => {
    if (preSelectedExchange) {
      return [preSelectedExchange];
    }

    const allExchanges = formData?.active_exchanges || [];
    return allExchanges.filter((exchange) => !excludeExchanges.includes(exchange));
  };

  const availableExchanges = getAvailableExchanges();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (preSelectedExchange) {
        setSelectedExchange(preSelectedExchange);
      } else if (availableExchanges.length === 1) {
        // Auto-select if there's only one available exchange
        setSelectedExchange(availableExchanges[0]);
      } else {
        setSelectedExchange('');
      }
      setName('');
      setApiKey('');
      setApiSecret('');
      setPassword('');
      setSelectedMarketOptions({});
      setPreSubmitProcessing(false);
      setShowOKXDEXSuccess(false);
      setOKXDEXAccountName('');
    }
  }, [open, preSelectedExchange]); // Removed availableExchanges from dependencies

  // Handle exchange selection changes
  useEffect(() => {
    if (formData.credential_market_options && formData.credential_market_options[selectedExchange]) {
      const initialOptions = Object.fromEntries(
        filterCredentialMarketOptions(formData.credential_market_options[selectedExchange]).map((option) => {
          // Make OKX OTC false by default, options false by default, and everything else true
          if (selectedExchange === 'OKX' && option === 'otc') {
            return [option, false];
          }

          if (selectedExchange === 'Gate' && (option === 'unified' || option === 'futures')) {
            return [option, false];
          }

          if (option === 'options') {
            return [option, false];
          }

          return [option, true];
        })
      );
      setSelectedMarketOptions(initialOptions);
    }

    // Don't disconnect wallet for CEX exchanges to prevent form resets
    // Only disconnect when switching between different wallet-only exchanges

    setShowOKXDEXSuccess(false); // Reset success state when exchange changes
    setOKXDEXAccountName('');
  }, [selectedExchange]);

  const renderExchangeFields = () => {
    if (!selectedExchange) return null;
    const config = exchangeConfig;

    if (config.walletOnly) {
      if (selectedExchange === 'Hyperliquid') {
        return (
          <Stack direction='column' spacing={2}>
            <WalletConnectionField walletType={config.walletTypeFilter} onWalletConnected={onWalletConnected} />
            <Stack direction='row' justifyContent='space-between' spacing={2}>
              <Typography variant='body1'>Subaccount or vault</Typography>
              <Switch checked={showVaultAddress} size='small' onChange={(e) => setShowVaultAddress(e.target.checked)} />
            </Stack>
            <Box sx={{ height: 50 }}>
              {showVaultAddress && (
                <TextField
                  fullWidth
                  autoComplete='off'
                  placeholder='Subaccount or vault address '
                  required={false}
                  onChange={(e) => setVaultAddress(e.target.value)}
                />
              )}
            </Box>
          </Stack>
        );
      }
      return <WalletConnectionField walletType={config.walletTypeFilter} onWalletConnected={onWalletConnected} />;
    }

    return config.fields.map((field) => (
      <TextField
        fullWidth
        autoComplete={field.autoComplete}
        key={field.key}
        placeholder={field.placeholder}
        required={field.required}
        onChange={(e) => {
          if (field.key === 'apiKey') setApiKey(e.target.value);
          if (field.key === 'apiSecret') setApiSecret(e.target.value);
          if (field.key === 'password') setPassword(e.target.value);
        }}
      />
    ));
  };

  let namePlaceholder = 'Account Name';
  if (exchangeConfig.walletOnly && connectedWallet?.address) {
    namePlaceholder = connectedWallet?.address;
  }

  const resolveExchangeNameLabel = (exchange) => {
    if (exchange === 'Coinbase') {
      return 'Coinbase Exchange';
    }
    if (exchange === 'BinancePM') {
      return 'Binance (Portfolio Margin)';
    }
    return exchange;
  };

  const renderOKXDEXSuccess = () => (
    <Box display='flex' flexDirection='column' justifyContent='center' sx={modalStyle}>
      <IconButton aria-label='close' sx={closeButtonStyle} onClick={onCloseModal}>
        <CloseIcon />
      </IconButton>

      <Stack alignItems='center' spacing={3} sx={{ py: 2 }}>
        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main' }} />

        <Typography sx={{ textAlign: 'center', fontWeight: 600 }} variant='h5'>
          DEX Account Linked!
        </Typography>

        <Typography sx={{ textAlign: 'center', color: 'text.secondary' }} variant='body1'>
          Your account {okxDEXAccountName} is ready to use.
        </Typography>

        <Stack
          direction='column'
          spacing={2}
          sx={{
            bgcolor: 'primary.dark2',
            border: '1px solid',
            borderColor: 'primary.main',
            borderRadius: 2,
            p: 3,
            mx: 4,
          }}
        >
          <Typography sx={{ color: 'primary.main' }} variant='h6'>
            Next Steps
          </Typography>
          <Typography maxWidth={400}>
            A wallet tied to your connected wallet has been generated for you. Go to portfolio and deposit funds into
            this wallet to start trading.
          </Typography>
        </Stack>

        <Stack direction='row' spacing={2} sx={{ width: '100%' }}>
          <Button sx={{ flex: 1 }} variant='contained' onClick={handleGoToPortfolio}>
            Go to Portfolio &gt;
          </Button>
        </Stack>
      </Stack>
    </Box>
  );

  return (
    <div>
      <Modal
        closeAfterTransition
        aria-describedby='transition-modal-description'
        aria-labelledby='transition-modal-title'
        open={open}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
        slots={{ backdrop: Backdrop }}
      >
        <Fade in={open}>
          {showOKXDEXSuccess ? (
            renderOKXDEXSuccess()
          ) : (
            <Box display='flex' flexDirection='column' justifyContent='center' sx={modalStyle}>
              <Typography sx={{ pb: 3 }} variant='subtitle1'>
                Link Account
              </Typography>
              <IconButton aria-label='close' sx={closeButtonStyle} onClick={onCloseModal}>
                <CloseIcon />
              </IconButton>
              <form onSubmit={handleSubmit}>
                <Stack flexDirection='column' spacing={3}>
                  {/* Exchange Selection - Only show if more than one option AND not pre-selected OKXDEX */}
                  {availableExchanges.length > 1 && preSelectedExchange !== 'OKXDEX' && (
                    <FormControl>
                      <InputLabel id='exchange-label'>Exchange</InputLabel>
                      <Select
                        required
                        label='Exchange'
                        labelId='exchange-label'
                        value={selectedExchange}
                        onChange={(e) => setSelectedExchange(e.target.value)}
                      >
                        {availableExchanges.map((exchange) => (
                          <MenuItem key={exchange} value={exchange}>
                            <Stack alignItems='center' direction='row'>
                              <ExchangeIcons exchanges={[exchange]} style={{ width: 24, height: 24, marginRight: 1 }} />
                              <Typography>{resolveExchangeNameLabel(exchange)}</Typography>
                            </Stack>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {/* Hyperliquid Information Alert */}
                  {selectedExchange === 'Hyperliquid' && (
                    <Alert severity='info' sx={{ mb: 2 }}>
                      <Typography variant='body2'>
                        <strong>Important:</strong> Ensure your Hyperliquid account has funds before connecting.
                      </Typography>
                      <Typography variant='body2'>Visit Hyperliquid to deposit if needed.</Typography>
                    </Alert>
                  )}

                  {selectedExchange === 'Gate' && (
                    <Alert severity='info' sx={{ mb: 2 }}>
                      <Typography variant='body2'>
                        <strong>Important:</strong> Ensure permissions for Spot Trade, Perpetual Futures,
                        <br />
                        and Margin Trading (Unified Account) are enabled on your API key.
                      </Typography>
                    </Alert>
                  )}

                  {selectedExchange === 'Pacifica' && (
                    <Alert severity='info' sx={{ mb: 2 }}>
                      <Typography variant='body2'>
                        <strong>Important:</strong> Ensure your Pacifica account is created and has funds before
                        connecting.
                      </Typography>
                      <Typography variant='body2'>Visit Pacifica to deposit if needed.</Typography>
                    </Alert>
                  )}

                  {serverIp && selectedExchange && exchangeConfig.needsIpWhitelisting && (
                    <Box sx={{ marginTop: 2 }}>
                      <CopyableValue
                        displayValue={
                          <>
                            <span style={{ color: theme.palette.grey[400] }}>Whitelist IP address:</span>{' '}
                            <span style={{ color: theme.palette.common.pureWhite }}>{serverIp}</span>
                          </>
                        }
                        value={serverIp}
                      />
                      <Stack
                        alignItems='flex-start'
                        direction='row'
                        justifyContent='flex-start'
                        spacing={1}
                        sx={{ mt: 1 }}
                      >
                        <ErrorIcon fontSize='small' sx={{ color: theme.palette.semantic.warning }} />
                        <Typography
                          sx={{ color: theme.palette.semantic.warning, textAlign: 'center' }}
                          variant='small1'
                        >
                          Whitelisting this IP address is required.
                        </Typography>
                      </Stack>
                    </Box>
                  )}
                  <TextField
                    fullWidth
                    autoComplete='off'
                    placeholder={namePlaceholder}
                    required={!exchangeConfig.walletOnly}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {renderExchangeFields()}
                  {exchangeConfig.requiresPassword && (
                    <TextField
                      fullWidth
                      autoComplete='off'
                      placeholder='Password'
                      required={false}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  )}
                  {exchangeConfig.requiresMarketOptions &&
                    formData.credential_market_options &&
                    formData.credential_market_options[selectedExchange] &&
                    selectedExchange !== 'Hyperliquid' && (
                      <Box>
                        <Typography variant='h6'>Enabled Markets</Typography>
                        <Typography variant='body2'>
                          {marketOptionDescription(selectedExchange)
                            .split('\n')
                            .map((line, i) => (
                              <React.Fragment key={line}>
                                {line}
                                <br />
                              </React.Fragment>
                            ))}
                        </Typography>
                        <FormGroup>
                          {filterCredentialMarketOptions(formData.credential_market_options[selectedExchange]).map(
                            (option) => (
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={selectedMarketOptions[option] ?? true}
                                    labelId='market-option-label'
                                    onChange={(e) =>
                                      setSelectedMarketOptions({
                                        ...selectedMarketOptions,
                                        [option]: e.target.checked,
                                      })
                                    }
                                  />
                                }
                                key={option}
                                label={marketOptionDisplayValue(option)}
                              />
                            )
                          )}
                        </FormGroup>
                      </Box>
                    )}
                  {EXCHANGE_REFERRAL_LINKS[selectedExchange] && (
                    <Typography color='text.secondary' sx={{ mt: 2, fontStyle: 'italic' }} variant='body1'>
                      If you do not have a {selectedExchange} account, sign up{' '}
                      <Link href={EXCHANGE_REFERRAL_LINKS[selectedExchange]} rel='noopener noreferrer' target='_blank'>
                        here.
                      </Link>
                    </Typography>
                  )}
                  <Box display='flex' sx={{ marginTop: 1 }}>
                    <Button
                      color='primary'
                      disabled={isSubmitDisabled}
                      sx={buttonStyle}
                      type='submit'
                      variant='contained'
                    >
                      {isSubmitting ? <CircularProgress size={24} /> : 'Submit'}
                    </Button>
                  </Box>
                </Stack>
              </form>
            </Box>
          )}
        </Fade>
      </Modal>
    </div>
  );
}
