import { getOKXDEXWallets, okxDexWithdraw } from '@/apiServices';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import useConnectWallet from '@/shared/context/WalletProvider';
import WalletSelector from '@/shared/components/WalletSelector';
import { okxDexWalletSign } from '@/shared/dexUtils';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
  MenuItem,
  Popover,
  InputAdornment,
  Chip,
  Avatar,
} from '@mui/material';
import WalletIcon from '@mui/icons-material/Wallet';
import SearchIcon from '@mui/icons-material/Search';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { WalletProviderIcon, DexTokenIcon, TokenIcon } from '@/shared/components/Icons';
import { formatQty, insertEllipsis } from '@/util';
import { NumericFormatCustom } from '@/shared/fields/NumberFieldFormat';
import WALLET_ICONS from '@images/wallet_icons';
import { makeTransactionHashesClickable } from '../TransactionHashLink';

const truncateAddress = (address) => {
  return insertEllipsis(address, 6, 4);
};

function TokenSelector({ balances = null, value, onChange, disabled, sx, walletType }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [search, setSearch] = useState('');

  const displayTokens = useMemo(() => {
    if (!balances) {
      return [];
    }

    let tokensToShow = [];
    if (balances.length > 0) {
      tokensToShow = balances.map((balanceItem) => {
        const [address, chainId] = balanceItem.symbol.split(':');

        return {
          address,
          chainId: parseInt(chainId, 10),
          symbol: balanceItem.token_symbol,
          name: balanceItem.name || address,
          balance: balanceItem.amount,
          balanceUsd: balanceItem.notional,
          logoUrl: balanceItem.logo_url,
        };
      });
    }

    if (!search) return tokensToShow;
    return tokensToShow.filter(
      (token) =>
        token.symbol.toLowerCase().includes(search.toLowerCase()) ||
        (token.name && token.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [balances, search]);

  // Auto-select first token or native token based on wallet type
  useEffect(() => {
    if (displayTokens.length === 0 || !balances) return;

    // Only auto-select if no token is currently selected
    if (value && value.address) return;

    let defaultToken = null;

    if (balances && balances.length > 0) {
      [defaultToken] = displayTokens;
    } else {
      const nativeTokenSymbols = {
        evm: 'ETH',
        solana: 'SOL',
      };

      const nativeSymbol = nativeTokenSymbols[walletType?.toLowerCase()];
      defaultToken = displayTokens.find((token) => token.symbol === nativeSymbol) || displayTokens[0];
    }

    if (defaultToken && onChange) {
      onChange(defaultToken);
    }
  }, [displayTokens, balances]);

  const handleOpen = useCallback(
    (event) => {
      if (!disabled) setAnchorEl(event.currentTarget);
    },
    [disabled]
  );

  const handleClose = useCallback(() => setAnchorEl(null), []);

  const renderTokenIcon = useCallback((token, style = { width: 20, height: 20 }) => {
    return <DexTokenIcon chainId={token.chainId} logoUrl={token.logoUrl} style={style} tokenAddress={token.address} />;
  }, []);

  const renderTokenItem = useCallback(
    (token) => (
      <MenuItem
        key={token.address}
        selected={token.address === value?.address}
        sx={{ py: 1.5 }}
        onClick={() => {
          onChange(token);
          handleClose();
        }}
      >
        <Stack direction='row' spacing={2} sx={{ alignItems: 'center', width: '100%' }}>
          {renderTokenIcon(token, { width: 24, height: 24 })}
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 500 }} variant='body2'>
              {token.symbol}
              {token.name?.toLowerCase() !== token.symbol?.toLowerCase() ? ` (${token.name})` : ''}
            </Typography>
            {token.balance && token.balance > 0 && (
              <Typography color='text.secondary' variant='caption'>
                Balance: {formatQty(token.balance)}
              </Typography>
            )}
          </Box>
          {token.balanceUsd > 0 && (
            <Typography color='text.secondary' sx={{ textAlign: 'right' }} variant='caption'>
              ${formatQty(token.balanceUsd)}
            </Typography>
          )}
        </Stack>
      </MenuItem>
    ),
    [value?.address, onChange, handleClose, renderTokenIcon]
  );

  return (
    <>
      <Button
        disabled={disabled}
        sx={{
          height: 40,
          minWidth: '100%',
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          '&:hover': {
            borderColor: 'text.secondary',
            backgroundColor: 'background.paper',
          },
          ...sx,
        }}
        variant='outlined'
        onClick={handleOpen}
      >
        <Stack alignItems='center' direction='row' spacing={1}>
          {value ? (
            <>
              {renderTokenIcon(value)}
              <Typography>{value.symbol}</Typography>
            </>
          ) : (
            <Typography color='text.secondary'>Token</Typography>
          )}
        </Stack>
        <ArrowDropDownIcon color='action' />
      </Button>

      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={!!anchorEl}
        slotProps={{
          paper: {
            style: {
              width: 400,
              maxHeight: 400,
              marginTop: 8,
            },
          },
        }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
            placeholder='Search tokens'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {(() => {
            if (displayTokens.length === 0) {
              return (
                <MenuItem disabled>
                  <em>No tokens found</em>
                </MenuItem>
              );
            }

            return displayTokens.map(renderTokenItem);
          })()}
        </Box>
      </Popover>
    </>
  );
}

function WalletDisplayBox({ address, walletProvider, label, walletType }) {
  return (
    <Box>
      <Typography sx={{ mb: 1 }} variant='subtitle2'>
        {label}
      </Typography>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          backgroundColor: 'background.paper',
        }}
      >
        <WalletProviderIcon
          style={{ height: '30px', width: '30px' }}
          walletProvider={walletProvider}
          walletType={walletType}
        />
        <Stack direction='column' flex={1} minWidth={0} spacing={0.5}>
          <Typography>{address}</Typography>
          <Typography color='text.secondary' variant='caption'>
            {walletProvider}
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}

function WithdrawModal({ open, onClose, accountId, balances }) {
  const { showAlert } = useContext(ErrorContext);
  const { connectedWallet, connectedWalletObject, walletProviderObject, disconnectWallet } = useConnectWallet();
  const [wallets, setWallets] = useState([]);
  const [walletMetadata, setWalletMetadata] = useState({});
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  const sourceWallet = wallets[0];
  const destinationWallet = walletMetadata.originWalletAddress;

  const loadWallets = async () => {
    try {
      const response = await getOKXDEXWallets(accountId);
      setWallets(response.wallets || []);
      setWalletMetadata({
        originWalletAddress: response.origin_wallet_address,
        walletType: response.wallet_type,
        walletProvider: response.wallet_provider,
      });
    } catch (err) {
      showAlert({ message: `Failed to load wallets: ${err.message}`, severity: 'error' });
    }
  };

  useEffect(() => {
    if (open && accountId) {
      loadWallets();
    }
  }, [open, accountId]);

  const handleClose = () => {
    setSelectedAsset(null);
    setAmount('');
    setShowWalletSelector(false);
    onClose();
  };

  const handleWalletConnect = (walletData) => {
    if (walletData) {
      setShowWalletSelector(false);
    } else {
      showAlert({
        message: 'Failed to connect relevant wallet. Please try again.',
        severity: 'error',
      });
    }
  };

  const handleTokenSelect = useCallback((token) => {
    setSelectedAsset(token);
    setAmount('');
  }, []);

  const handleAmountChange = useCallback((e) => {
    const { value } = e.target;
    setAmount(value);
  }, []);

  const handleMaxClick = useCallback(() => {
    if (selectedAsset?.balance) {
      setAmount(selectedAsset.balance.toString());
    }
  }, [selectedAsset?.balance]);

  const submitWithdraw = async () => {
    if (!selectedAsset?.chainId) {
      showAlert({ message: 'Unable to determine network for this token.', severity: 'error' });
      return;
    }

    setProcessing(true);

    try {
      if (!walletProviderObject) {
        throw new Error('No wallet connected. Please connect your wallet first.');
      }

      const requiredAddress = walletMetadata.originWalletAddress?.toLowerCase();
      if (!requiredAddress) {
        throw new Error('Origin wallet address not found');
      }

      const currentAddress = connectedWallet?.toLowerCase();
      if (currentAddress !== requiredAddress) {
        throw new Error(
          `Withrawal requires approval from the origin wallet. Please connect your wallet with address ${walletMetadata.originWalletAddress} and try again. `
        );
      }

      const { message, signature } = await okxDexWalletSign(
        walletMetadata.walletType,
        destinationWallet,
        walletProviderObject
      );

      const withdrawResult = await okxDexWithdraw({
        account_id: accountId,
        source_wallet_address: sourceWallet,
        dest_wallet_address: destinationWallet,
        amount, // NumericFormatCustom provides clean numeric value
        chain_id: selectedAsset.chainId,
        token_address: selectedAsset.address,
        message,
        signature,
        address: walletMetadata.originWalletAddress,
        wallet_type: walletMetadata.walletType,
      });

      const successMessage = `Withdrawal successful! Transaction Hash: ${withdrawResult.data.transactionId}`;
      const clickableMessage = makeTransactionHashesClickable(successMessage, selectedAsset.chainId);
      showAlert({
        message: clickableMessage,
        severity: 'success',
      });
      handleClose();
    } catch (err) {
      showAlert({ message: `Failed to withdraw: ${err.message}`, severity: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const canSubmit = sourceWallet && destinationWallet && selectedAsset && amount && parseFloat(amount) > 0;
  const assetAmountAvailable = selectedAsset && selectedAsset.balance !== '0';

  if (showWalletSelector) {
    return (
      <Dialog fullWidth maxWidth='sm' open={open} onClose={() => setShowWalletSelector(false)}>
        <DialogTitle>
          Connect Wallet
          <Typography color='text.secondary' sx={{ mt: 1 }} variant='body2'>
            Please connect your wallet with address: {walletMetadata.originWalletAddress}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <WalletSelector walletType={walletMetadata.walletType} onConnect={handleWalletConnect} />
        </DialogContent>
      </Dialog>
    );
  }

  if (open && (!sourceWallet || !destinationWallet)) {
    return (
      <Dialog fullWidth maxWidth='sm' open={open} onClose={handleClose}>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog fullWidth maxWidth='sm' open={open} onClose={handleClose}>
      <DialogTitle>
        <Stack alignItems='center' direction='row' justifyContent='space-between'>
          <Typography variant='h6'>Withdraw</Typography>
          {connectedWallet ? (
            <Chip
              avatar={<Avatar src={connectedWalletObject?.icon || WALLET_ICONS[connectedWalletObject.id]} />}
              deleteIcon={<LinkOffIcon sx={{ color: 'error.main' }} />}
              label={truncateAddress(connectedWallet)}
              onDelete={disconnectWallet}
            />
          ) : (
            <Button variant='outlined' onClick={() => setShowWalletSelector(true)}>
              Connect Wallet
            </Button>
          )}
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Divider />
        <Stack spacing={3} sx={{ mt: 3 }}>
          <WalletDisplayBox
            address={sourceWallet}
            label='From'
            walletProvider='tread.fi'
            walletType={walletMetadata.walletType}
          />

          <Paper elevation={1} sx={{ p: 2 }}>
            <Stack alignItems='center' direction='row' justifyContent='space-between' spacing={2}>
              <Stack direction='column' spacing={1} sx={{ p: 2 }}>
                <Typography color='text.secondary' variant='body2'>
                  Withdraw Amount
                </Typography>
                <TextField
                  fullWidth
                  InputProps={{
                    inputComponent: NumericFormatCustom,
                  }}
                  placeholder='0.00'
                  sx={{
                    '& .MuiOutlinedInput-input': {
                      fontSize: '1.5rem',
                      fontWeight: 500,
                      padding: 0,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      display: 'none',
                    },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        border: 'none',
                      },
                      '&:hover fieldset': {
                        border: 'none',
                      },
                      '&.Mui-focused fieldset': {
                        border: 'none',
                      },
                    },
                  }}
                  value={amount}
                  variant='outlined'
                  onChange={handleAmountChange}
                />
                {amount && selectedAsset && parseFloat(amount) > parseFloat(selectedAsset.balance) && (
                  <Typography color='error' sx={{ mt: 1 }} variant='caption'>
                    Withdraw amount exceeds available balance.
                  </Typography>
                )}
              </Stack>
              <Stack alignItems='right' direction='column' justifyContent='space-between' spacing={1}>
                <Stack alignItems='center' direction='row' spacing={1.5}>
                  <WalletIcon sx={{ height: '16px', width: '16px', color: 'text.secondary' }} />
                  <Typography color='text.secondary' variant='caption'>
                    {assetAmountAvailable ? `${formatQty(selectedAsset.balance)} ${selectedAsset.symbol}` : '0.00'}
                  </Typography>
                  <Button
                    disabled={!assetAmountAvailable}
                    size='small'
                    sx={{ minWidth: 'auto', px: 1, py: 0.5, fontSize: '0.75rem' }}
                    variant='outlined'
                    onClick={handleMaxClick}
                  >
                    <Typography color='text.secondary' variant='body2'>
                      Max
                    </Typography>
                  </Button>
                </Stack>
                <TokenSelector
                  balances={balances}
                  disabled={!balances}
                  value={selectedAsset}
                  walletType={walletMetadata.walletType}
                  onChange={handleTokenSelect}
                />
              </Stack>
            </Stack>
          </Paper>

          <WalletDisplayBox
            address={destinationWallet}
            label='To'
            walletProvider={walletMetadata.walletProvider}
            walletType={walletMetadata.walletType}
          />

          <Button
            fullWidth
            disabled={!canSubmit || processing}
            size='large'
            startIcon={processing ? <CircularProgress size={16} /> : null}
            sx={{
              mt: 2,
              py: 1.5,
              fontSize: '1rem',
            }}
            variant='contained'
            onClick={submitWithdraw}
          >
            {processing ? 'Processing...' : 'Confirm in wallet'}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default WithdrawModal;
