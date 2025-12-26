import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Dialog, DialogTitle, Typography, DialogContent, Chip, Avatar, Button, Stack, Tooltip } from '@mui/material';
import { needsApproval } from '@/apiServices';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import useConnectWallet from '@/shared/context/WalletProvider';
import WALLET_ICONS from '@images/wallet_icons';
import { insertEllipsis } from '@/util';
import WalletSelector from '@/shared/components/WalletSelector';
import { useToast } from '@/shared/context/ToastProvider';
import { signAndPostBuilderCode } from '@/pages/keyManagement/pacificaApprovals';
import { ExchangeIcon } from '@/shared/components/Icons';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';

const AccountApprovalContext = createContext();
const truncateAddress = (address) => {
  return insertEllipsis(address, 6, 4);
};

function ApprovalModal({ open, onClose, account }) {
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const { isMainnet } = useUserMetadata();
  const { showToastMessage } = useToast();
  const {
    connectedWallet,
    walletProviderObject: provider,
    disconnectWallet,
    connectedWalletObject: wallet,
  } = useConnectWallet();

  const handleWalletConnect = (walletData) => {
    if (walletData) {
      setShowWalletSelector(false);
    } else {
      showToastMessage({
        message: 'Failed to connect relevant wallet. Please try again.',
        type: 'error',
        anchor: 'bottom-center',
      });
    }
  };

  const requiredAddress = account.api_key;
  const disabled = !connectedWallet || connectedWallet !== requiredAddress;
  const unableToSubmitMessage = disabled ? `Please connect wallet with address: ${requiredAddress} to continue.` : '';
  const handleApproveRequest = useCallback(async () => {
    if (connectedWallet !== requiredAddress) {
      showToastMessage({
        message: `Please connect wallet with address: ${requiredAddress} to continue.`,
        type: 'error',
        anchor: 'bottom-center',
      });
      return;
    }

    const nonce = Date.now();
    try {
      const success = await signAndPostBuilderCode({
        provider,
        nonce,
        address: connectedWallet,
        isMainnet,
      });
      if (success) {
        showToastMessage({
          message: 'Request approved successfully.',
          type: 'success',
          anchor: 'bottom-center',
        });
        onClose();
      } else {
        showToastMessage({
          message: 'Failed to approve request. Please try again.',
          type: 'error',
          anchor: 'bottom-center',
        });
      }
    } catch (error) {
      showToastMessage({
        message: 'Failed to approve request. Please try again.',
        type: 'error',
        anchor: 'bottom-center',
      });
    }
  }, [connectedWallet, requiredAddress, provider, isMainnet]);

  if (showWalletSelector) {
    return (
      <Dialog fullWidth maxWidth='sm' open={open} onClose={() => setShowWalletSelector(false)}>
        <DialogTitle>
          Connect Wallet
          <Typography color='text.secondary' sx={{ mt: 1 }} variant='body2'>
            Please connect your wallet with address: {requiredAddress}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <WalletSelector walletType='solana' onConnect={handleWalletConnect} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog maxWidth='sm' open={open} onClose={onClose}>
      <DialogTitle>
        <Stack alignItems='center' direction='row' justifyContent='space-between'>
          <Typography variant='h6'>Account Approval</Typography>
          {connectedWallet ? (
            <Chip
              avatar={<Avatar src={wallet?.icon || WALLET_ICONS[wallet?.id]} />}
              deleteIcon={<LinkOffIcon sx={{ color: 'error.main' }} />}
              label={truncateAddress(connectedWallet)}
              onDelete={disconnectWallet}
            />
          ) : (
            <Button
              variant='outlined'
              onClick={() => {
                setShowWalletSelector(true);
              }}
            >
              Connect Wallet
            </Button>
          )}
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack alignItems='center' direction='column' justifyContent='center' spacing={2}>
          <Typography color='text.secondary' sx={{ mt: 1, textAlign: 'center' }} variant='body1'>
            Builder code approval for Pacifica account is required to proceed.
          </Typography>
          <Stack alignItems='center' direction='row' justifyContent='center' spacing={2}>
            <ExchangeIcon exchangeName='Pacifica' style={{ height: '20px', width: '20px' }} />
            <Typography
              sx={{
                color: 'exchangeColors.Pacifica',
                fontFamily: 'monospace',
              }}
              variant='body1'
            >
              {requiredAddress}
            </Typography>
          </Stack>

          <Tooltip title={unableToSubmitMessage}>
            <span style={{ width: '100%', marginTop: '32px' }}>
              <Button fullWidth disabled={disabled} variant='contained' onClick={handleApproveRequest}>
                Approve Request
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export function AccountApprovalProvider({ children }) {
  const [accountApproval, setAccountApproval] = useState(null);
  const [open, setOpen] = useState(false);

  const openModal = (account) => {
    setAccountApproval(account);
    setOpen(true);
  };
  const closeModal = () => setOpen(false);

  const accountNeedsApproval = async (account) => {
    if (account?.exchangeName !== 'Pacifica' || !account?.api_key) {
      return false;
    }

    const approvalResponse = await needsApproval(account.api_key);
    return approvalResponse;
  };

  const openApprovalModal = (account) => {
    openModal(account);
  };

  const value = useMemo(
    () => ({ openModal, closeModal, accountNeedsApproval, openApprovalModal }),
    [openModal, closeModal, accountNeedsApproval]
  );

  return (
    <AccountApprovalContext.Provider value={value}>
      {children}
      {open && <ApprovalModal account={accountApproval} open={open} onClose={closeModal} />}
    </AccountApprovalContext.Provider>
  );
}

export function useAccountApproval() {
  return useContext(AccountApprovalContext);
}
