import React, { useEffect, useState } from 'react';

import { unarchiveCredential } from '@/apiServices';
import useConnectWallet from '@/shared/context/WalletProvider';
import { CHAIN_TYPES, okxDexWalletSign } from '@/shared/dexUtils';
import CloseIcon from '@mui/icons-material/Close';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import WalletConnectionField from '../accountBalance/portfolio/WalletConnectionField';
import { addHyperliquidAccount } from './hyperliquidApprovals';

export function UnarchiveAccountModal({
  open,
  setOpen,
  credential,
  formData,
  loadAccounts,
  showAlert,
  onChanged = null,
}) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [okxDEXLoginData, setOKXDEXLoginData] = useState(null);
  const [preSubmitProcessing, setPreSubmitProcessing] = useState(false);

  const { connectedWallet, disconnectWallet } = useConnectWallet();
  const isHyperLiquid = credential?.exchange === 'Hyperliquid';
  const isOKXDEX = credential?.exchange === 'OKXDEX';

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    minWidth: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
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
    top: 8,
  };

  const handleOKXDEXWalletConnect = async ({ walletType, address, walletProvider }) => {
    if (!address) {
      showAlert({
        severity: 'error',
        message: `Could not find ${walletType} address: please try again.`,
      });
      return false;
    }

    try {
      let translatedWalletType = walletType;

      if (walletType === CHAIN_TYPES.ETHEREUM) {
        translatedWalletType = 'evm';
      }

      const { message, signature } = await okxDexWalletSign(walletType, address, walletProvider);

      setOKXDEXLoginData({ message, signature, address, walletType: translatedWalletType });
    } catch (e) {
      showAlert({
        severity: 'error',
        message: `Could not connect to OKXDEX: ${e.message}`,
      });
      return false;
    }
    return true;
  };

  const handleHyperliquidWalletConnect = async ({ provider }) => {
    if (!provider) {
      showAlert({
        severity: 'error',
        message: 'Could not find wallet provider: please try again.',
      });
      return false;
    }

    const { apiKey: ak, apiSecret: as } = await addHyperliquidAccount({
      builderAddress: formData.builder_address,
      provider,
      isMainnet: formData.is_mainnet,
    });
    setApiKey(ak);
    setApiSecret(as);
    return true;
  };

  const onWalletConnected = (wallet) => {
    setPreSubmitProcessing(true);
    let promise;
    if (isOKXDEX) {
      promise = handleOKXDEXWalletConnect({
        address: wallet.address,
        walletType: wallet.chainType,
        walletProvider: wallet.provider,
      });
    } else if (isHyperLiquid) {
      promise = handleHyperliquidWalletConnect({ provider: wallet.provider });
    }
    promise
      .then((result) => {
        if (!result) {
          disconnectWallet();
        }
      })
      .finally(() => setPreSubmitProcessing(false));
  };

  const onCloseModal = () => {
    setOpen(false);
    setOKXDEXLoginData(null);
    setPreSubmitProcessing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (isHyperLiquid) {
        // For Hyperliquid, we need to generate new keys via wallet connection
        const { apiKey: ak, apiSecret: as } = await addHyperliquidAccount({
          builderAddress: formData.builder_address,
          provider: window.ethereum, // Fallback for unarchive
          isMainnet: formData.is_mainnet,
        });
        await unarchiveCredential({ credential_id: credential.id, api_key: ak, api_secret: as, password });
      } else if (isOKXDEX) {
        // For OKXDEX, we just unarchive with the wallet address as API key
        if (!okxDEXLoginData) {
          showAlert({
            severity: 'error',
            message: 'Could not connect to OKXDEX: Try connecting again.',
          });
          return;
        }
        await unarchiveCredential({
          credential_id: credential.id,
          api_key: okxDEXLoginData.address,
          api_secret: '',
          password: '',
        });
        showAlert({
          severity: 'warning',
          message: `OKXDEX account unarchived. You may need to re-authenticate with OKXDEX separately if tokens are expired.`,
        });
      } else {
        // For other exchanges, use the provided API credentials
        await unarchiveCredential({
          credential_id: credential.id,
          api_key: apiKey,
          api_secret: apiSecret,
          password,
        });
      }
      if (onChanged) {
        onChanged();
      }
      showAlert({
        severity: 'success',
        message: `Successfully unarchived ${credential.exchange} account.`,
      });
    } catch (e) {
      showAlert({
        severity: 'error',
        message: `Could not unarchive account: ${e.message}`,
      });
    } finally {
      loadAccounts();
      setOpen(false);
      setIsSubmitting(false);
      setOKXDEXLoginData(null);
    }
  };

  const isPasswordUsed = ['OKX', 'Coinbase'].includes(credential?.exchange);
  const isSubmitDisabled =
    isSubmitting ||
    (isHyperLiquid && !connectedWallet) ||
    (isOKXDEX && !okxDEXLoginData) ||
    (!isHyperLiquid && !isOKXDEX && !apiKey) ||
    preSubmitProcessing;

  // Reset state when credential changes
  useEffect(() => {
    if (credential) {
      setApiKey('');
      setApiSecret('');
      setPassword('');
      setOKXDEXLoginData(null);
    }
    disconnectWallet();
  }, [credential]);

  if (!credential) return null;

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
          <Box display='flex' flexDirection='column' justifyContent='center' sx={modalStyle}>
            <IconButton aria-label='close' sx={closeButtonStyle} onClick={onCloseModal}>
              <CloseIcon />
            </IconButton>
            <Typography sx={{ marginBottom: 4 }} variant='h5'>
              Unarchive {credential.exchange} Account
            </Typography>
            <Box sx={{ marginBottom: 4 }}>
              <Typography color='primary.main' variant='h6'>
                {credential.name.includes('_archived_') ? (
                  <>
                    {credential.name.split('_archived_')[0]}
                    <Typography color='text.secondary' component='span' variant='h6'>
                      _archived_{credential.name.split('_archived_')[1]}
                    </Typography>
                  </>
                ) : (
                  credential.name
                )}
              </Typography>
            </Box>
            <Typography color='text.secondary' maxWidth='360px' sx={{ marginBottom: 4 }} variant='body2'>
              Note: If there&apos;s already an active account with the same name, this account will be unarchived with a
              number suffix (e.g., &quot;AccountName_1&quot;)
            </Typography>
            <form onSubmit={handleSubmit}>
              <Stack flexDirection='column' spacing={3}>
                {!isHyperLiquid && !isOKXDEX && (
                  <>
                    <TextField
                      fullWidth
                      required
                      autoComplete='off'
                      placeholder='API Key'
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      required
                      autoComplete='off'
                      placeholder='API Secret'
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                    />
                  </>
                )}
                {(isOKXDEX || isHyperLiquid) && <WalletConnectionField onWalletConnected={onWalletConnected} />}
                {isPasswordUsed && (
                  <TextField
                    fullWidth
                    autoComplete='off'
                    placeholder='Password'
                    required={false}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                )}
                <Box display='flex' sx={{ marginTop: 1 }}>
                  <Button
                    color='primary'
                    disabled={isSubmitDisabled}
                    sx={buttonStyle}
                    type='submit'
                    variant='contained'
                  >
                    {isSubmitting ? <CircularProgress size={24} /> : 'Unarchive'}
                  </Button>
                </Box>
              </Stack>
            </form>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
}
