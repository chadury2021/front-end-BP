import React, { useEffect, useContext, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  Dialog,
  DialogContent,
} from '@mui/material';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import useConnectWallet from '@/shared/context/WalletProvider';
import WalletSelector from '@/shared/components/WalletSelector';

function WalletConnectionField({ onWalletConnected = () => {}, walletType = undefined, title = 'Connect Wallet' }) {
  const { showAlert } = useContext(ErrorContext);
  const [openSelector, setOpenSelector] = useState(false);
  const { isConnectingWallet, connectedWallet, connectingError, disconnectWallet } = useConnectWallet();

  const handleDisconnect = () => {
    disconnectWallet();
  };

  const handleClose = () => {
    setOpenSelector(false);
  };

  const handleWalletConnect = (result) => {
    if (result) {
      onWalletConnected(result);
    }
    setOpenSelector(false);
  };

  useEffect(() => {
    if (connectingError) {
      showAlert({ message: connectingError, severity: 'error' });
    }
  }, [connectingError]);

  return (
    <Box sx={{ my: 2 }}>
      <Stack spacing={2}>
        <Typography color='text.primary' variant='subtitle2'>
          {title}
        </Typography>

        <TextField
          fullWidth
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position='end'>
                <Button
                  color={connectedWallet ? 'error' : 'primary'}
                  disabled={isConnectingWallet}
                  size='small'
                  startIcon={isConnectingWallet ? <CircularProgress size={14} /> : null}
                  sx={{ minWidth: 80, height: 32 }}
                  variant={connectedWallet ? 'outlined' : 'contained'}
                  onClick={connectedWallet ? handleDisconnect : () => setOpenSelector(true)}
                >
                  {connectedWallet ? 'Disconnect' : 'Connect'}
                </Button>
              </InputAdornment>
            ),
          }}
          placeholder='No wallet connected'
          value={connectedWallet}
        />
      </Stack>

      <Dialog fullWidth maxWidth='sm' open={openSelector} onClose={handleClose}>
        <DialogContent>
          <WalletSelector walletType={walletType} onConnect={handleWalletConnect} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default WalletConnectionField;
