import {
  ApiError,
  deleteAccount,
  deleteOKXDEXAccount,
  getAccountExchangeSettings,
  getAccounts,
  getKeyManagementFormData,
  getServerIp,
} from '@/apiServices';
import { ExchangeIcons } from '@/shared/iconUtil';
import CloseIcon from '@mui/icons-material/Close';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  GlobalStyles,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Modal,
  Stack,
  Typography,
  Skeleton,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { useCallback, useContext, useEffect, useState } from 'react';
import TutorialHighlight from '@/shared/onboarding/TutorialHighlight';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { useDexModals } from '../../hooks/useDexModals';
import { ChainIcon, ExchangeIcon } from '../../shared/components/Icons';
import { ErrorContext } from '../../shared/context/ErrorProvider';
import { BasicModal } from '../../shared/Modal';
import { holographicShimmer, isolatedHolographicStyles } from '../../theme/holographicEffects';
import DepositModal from '../accountBalance/portfolio/DepositModal';
import WithdrawModal from '../accountBalance/portfolio/WithdrawModal';
import { AccountItem } from './AccountItem';
import { AddAccountModal } from './AddAccountModal';
import { ArchivedAccountItem } from './ArchivedAccountItem';
import { EditAccountModal } from './EditAccountModal';
import { UnarchiveAccountModal } from './UnarchiveAccountModal';
import {
  HyperliquidDepositModal,
  HyperliquidWithdrawModal,
  HyperliquidTransferModal,
} from '../accountBalance/portfolio/HyperliquidDepositWithdrawModals';

const EXCHANGE_CATEGORIES = {
  DEX: ['OKXDEX'],
  CEX: [
    'Binance',
    'Bybit',
    'OKX',
    'Hyperliquid',
    'Aster',
    'Pacifica',
    'Paradex',
    'Extended',
    'Deribit',
    'Coinbase',
    'Gate',
  ],
};

// Wallet type display names and their corresponding chain IDs for icons
const WALLET_TYPE_DISPLAY = {
  evm: 'EVM Wallets',
  solana: 'Solana Wallets',
};

const WALLET_TYPE_CHAIN_IDS = {
  evm: '1', // Ethereum
  solana: '501', // Solana
};

const ONBOARDING_KEY_MANAGEMENT_CONNECT = 'key_management_connect';

export default function KeyManagementModal({ open, onClose }) {
  const { onboarding, markOnboarding } = useUserMetadata();
  const [accounts, setAccounts] = useState([]);
  const [archivedAccounts, setArchivedAccounts] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState('All');
  const [onlyShowActive, setOnlyShowActive] = useState(true);
  const [openAddAccountModal, setOpenAddAccountModal] = useState(false);
  const [openAddWalletModal, setOpenAddWalletModal] = useState(false);
  const [openAddHyperliquidModal, setOpenAddHyperliquidModal] = useState(false);
  const [openAddAsterModal, setOpenAddAsterModal] = useState(false);
  const [openAddPacificaModal, setOpenAddPacificaModal] = useState(false);
  const [openAddParadexModal, setOpenAddParadexModal] = useState(false);
  const [openAddExtendedModal, setOpenAddExtendedModal] = useState(false);
  const [openEditAccountModal, setOpenEditAccountModal] = useState(false);
  const [editAccountData, setEditAccountData] = useState(null);
  const [openUnarchiveAccountModal, setOpenUnarchiveAccountModal] = useState(false);
  const [accountToUnarchive, setAccountToUnarchive] = useState(null);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [confirmModalText, setConfirmModalText] = useState('');
  const [deleteAccountInfo, setDeleteAccountInfo] = useState({
    id: '',
    name: '',
    exchange: '',
  });
  const [serverIp, setServerIp] = useState('');
  const [exchangeSettings, setExchangeSettings] = useState('');
  const [formData, setFormData] = useState({});
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [hlDepositModalOpen, setHlDepositModalOpen] = useState(false);
  const [selectedHlAccountAddress, setSelectedHlAccountAddress] = useState(null);
  const [hlWithdrawModalOpen, setHlWithdrawModalOpen] = useState(false);
  const [hlTransferModalOpen, setHlTransferModalOpen] = useState(false);
  const theme = useTheme();

  const { showAlert } = useContext(ErrorContext);
  const dexModals = useDexModals();
  const openHlDepositModal = (accountAddress) => {
    setHlDepositModalOpen(true);
    setSelectedHlAccountAddress(accountAddress);
  };

  const closeHlDepositModal = () => {
    setHlDepositModalOpen(false);
    setSelectedHlAccountAddress(null);
  };

  const openHlWithdrawModal = (accountAddress) => {
    setHlWithdrawModalOpen(true);
    setSelectedHlAccountAddress(accountAddress);
  };

  const closeHlWithdrawModal = () => {
    setHlWithdrawModalOpen(false);
    setSelectedHlAccountAddress(null);
  };

  const openHlTransferModal = (accountAddress) => {
    setHlTransferModalOpen(true);
    setSelectedHlAccountAddress(accountAddress);
  };

  const closeHlTransferModal = () => {
    setHlTransferModalOpen(false);
    setSelectedHlAccountAddress(null);
  };

  const loadExchangeSettings = async (account_ids) => {
    let settings = null;
    try {
      settings = await getAccountExchangeSettings(account_ids);
    } catch (e) {
      showAlert({
        severity: 'error',
        message: `Could not load exchange settings: ${e.message}`,
      });
    }

    if (!settings) {
      return;
    }

    setExchangeSettings(settings);
  };

  const loadFormData = async () => {
    try {
      const data = await getKeyManagementFormData();
      setFormData(data);
    } catch (e) {
      showAlert({
        severity: 'error',
        message: `Could not load form data: ${e.message}`,
      });
    }
  };

  const loadAccounts = async () => {
    setAccountsLoading(true);
    let fetchedAccounts = null;
    try {
      fetchedAccounts = await getAccounts(true);
    } catch (e) {
      setAccountsLoading(false);
      if (e instanceof ApiError) {
        showAlert({
          severity: 'error',
          message: `Could not load accounts: ${e.message}`,
        });
      } else {
        throw e;
      }
    }

    if (!fetchedAccounts) {
      return;
    }

    const activeAccounts = fetchedAccounts.filter((x) => !x.archived);
    const fetchedArchivedAccounts = fetchedAccounts.filter((x) => x.archived);

    activeAccounts.sort((a, b) => a.name.localeCompare(b.name));
    fetchedArchivedAccounts.sort((a, b) => a.name.localeCompare(b.name));

    setAccounts(activeAccounts);
    setArchivedAccounts(fetchedArchivedAccounts);

    if (activeAccounts.length > 0) {
      loadExchangeSettings(activeAccounts.map((x) => x.id));
    }
    setAccountsLoading(false);
  };

  const handleConnectCEXAccount = async (event) => {
    setOpenAddAccountModal(true);
  };

  const handleConnectWallet = useCallback((event) => {
    setOpenAddWalletModal(true);
  }, []);

  const handleConnectHyperliquid = async (event) => {
    setOpenAddHyperliquidModal(true);
  };

  const handleConnectAster = async (event) => {
    setOpenAddAsterModal(true);
  };

  const handleConnectPacifica = async (event) => {
    setOpenAddPacificaModal(true);
  };

  const handleConnectParadex = async (event) => {
    setOpenAddParadexModal(true);
  };

  const handleConnectExtended = async (event) => {
    setOpenAddExtendedModal(true);
  };

  const handleEditAccount = (accountData) => {
    setEditAccountData({
      id: accountData.id,
      accountName: accountData.accountName,
      exchangeName: accountData.exchangeName,
      credentialOptions: accountData.credentialOptions,
    });
    setOpenEditAccountModal(true);
  };

  const handleDeleteConfirmation = async () => {
    try {
      if (deleteAccountInfo.exchange === 'OKXDEX') {
        await deleteOKXDEXAccount(deleteAccountInfo.id);
      } else {
        await deleteAccount(deleteAccountInfo.name);
      }
      setHasChanges(true);
      showAlert({
        severity: 'success',
        message: `Successfully unlinked account ${deleteAccountInfo.name}`,
      });
    } catch (e) {
      if (e instanceof ApiError) {
        showAlert({
          severity: 'error',
          message: `Could not unlink account: ${e.message}`,
        });
      } else {
        throw e;
      }
    } finally {
      setOpenConfirmModal(false);
      loadAccounts();
      setDeleteAccountInfo({
        id: '',
        name: '',
        exchange: '',
      });
    }
  };

  const handleUnarchiveAccount = ({ accountId, accountName, exchangeName }) => {
    const archivedAccount = archivedAccounts.find((acc) => acc.id === accountId);
    if (archivedAccount) {
      setAccountToUnarchive(archivedAccount);
      setOpenUnarchiveAccountModal(true);
    }
  };

  const loadServerIp = async () => {
    try {
      const result = await getServerIp();
      setServerIp(result.server_ip);
    } catch (e) {
      // Silently ignore if server IP fails to load
    }
  };

  useEffect(() => {
    if (open) {
      loadAccounts();
      loadFormData();
      loadServerIp();
    }
  }, [open]);

  const onUnlinkAccount = ({ accountId, accountName, exchangeName }) => {
    setConfirmModalText(`Are you sure you want to unlink account ${accountName}?`);
    setDeleteAccountInfo({
      id: accountId,
      name: accountName,
      exchange: exchangeName,
    });
    setOpenConfirmModal(true);
  };

  const getAccountsByExchange = (exchangeName) => {
    const allAccountsList = [...accounts, ...archivedAccounts];
    const accountsList = onlyShowActive ? accounts : allAccountsList;

    if (exchangeName === 'All') {
      return accountsList;
    }

    // Handle wallet type grouping for DEX
    if (exchangeName.includes('Wallets')) {
      const walletType = exchangeName === 'EVM Wallets' ? 'evm' : 'solana';
      return accountsList.filter((acc) => acc.exchange === 'OKXDEX' && acc.wallet_type === walletType);
    }

    return accountsList.filter((acc) => acc.exchange === exchangeName);
  };

  const getAccountCountForExchange = (exchangeName) => {
    const allAccountsList = [...accounts, ...archivedAccounts];
    const accountsList = onlyShowActive ? accounts : allAccountsList;

    if (exchangeName === 'All') {
      return accountsList.length;
    }

    // Handle wallet type grouping for DEX
    if (exchangeName.includes('Wallets')) {
      const walletType = exchangeName === 'EVM Wallets' ? 'evm' : 'solana';
      return accountsList.filter((acc) => acc.exchange === 'OKXDEX' && acc.wallet_type === walletType).length;
    }

    return accountsList.filter((acc) => acc.exchange === exchangeName).length;
  };

  const getDEXWalletTypes = () => {
    const allAccountsList = [...accounts, ...archivedAccounts];
    const accountsList = onlyShowActive ? accounts : allAccountsList;
    const dexAccounts = accountsList.filter((acc) => acc.exchange === 'OKXDEX');
    const walletTypes = [...new Set(dexAccounts.map((acc) => acc.wallet_type))];
    return walletTypes.filter(Boolean); // Remove any null/undefined values
  };

  const getCEXExchanges = () => {
    const allAccountsList = [...accounts, ...archivedAccounts];
    const accountsList = onlyShowActive ? accounts : allAccountsList;
    return EXCHANGE_CATEGORIES.CEX.filter((exchange) => accountsList.some((acc) => acc.exchange === exchange));
  };

  const renderExchangeListItem = (exchangeName, label, isDex = false) => {
    const accountCount = getAccountCountForExchange(exchangeName);
    const isSelected = selectedExchange === exchangeName;

    // Determine if this is a wallet type and get the appropriate icon
    const isWalletType = exchangeName.includes('Wallets');
    let walletType = null;
    if (isWalletType) {
      walletType = exchangeName === 'EVM Wallets' ? 'evm' : 'solana';
    }

    // Helper function to render the appropriate icon
    const renderIcon = () => {
      if (isWalletType && walletType) {
        return <ChainIcon chainId={WALLET_TYPE_CHAIN_IDS[walletType]} style={{ height: '20px', width: '20px' }} />;
      }

      if (exchangeName !== 'All' && !isWalletType) {
        return <ExchangeIcon exchangeName={exchangeName} style={{ height: '20px', width: '20px' }} />;
      }

      return null;
    };

    return (
      <ListItem disablePadding key={exchangeName}>
        <ListItemButton
          selected={isSelected}
          sx={{
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
            ...(isSelected ? isolatedHolographicStyles(theme) : {}),
            '&.Mui-selected': {
              bgcolor: isSelected ? 'transparent' : 'primary.main',
              '&:hover': {
                bgcolor: isSelected ? 'transparent' : 'primary.dark',
              },
            },
            '&:hover': {
              ...(isSelected ? isolatedHolographicStyles(theme)['&:hover'] : {}),
            },
          }}
          onClick={() => setSelectedExchange(exchangeName)}
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {renderIcon()}
                  <Typography variant='body1'>{label}</Typography>
                </Box>
                {accountCount > 0 && (
                  <Badge
                    badgeContent={accountCount}
                    color='secondary'
                    max={999}
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: theme.palette.primary.transparent,
                        color: theme.palette.primary.main,
                        px: 3,
                        py: 0.5,
                      },
                    }}
                  />
                )}
              </Box>
            }
          />
        </ListItemButton>
      </ListItem>
    );
  };

  const renderAccountGrid = () => {
    if (accountsLoading) {
      return (
        <Stack spacing={1}>
          {[...Array(6)].map((index) => (
            <Skeleton
              animation='wave'
              height='100px'
              key={`account-item-skeleton-${index}`}
              sx={{ borderRadius: '12px' }}
              variant='rectangular'
              width='100%'
            />
          ))}
        </Stack>
      );
    }
    const accountsToShow = getAccountsByExchange(selectedExchange);

    if (accountsToShow.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Typography color='text.secondary' variant='body2'>
            {onlyShowActive ? 'No active accounts' : 'No accounts'}
            {selectedExchange !== 'All' ? ` for ${selectedExchange}` : ''}
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={1}>
        {accountsToShow.map((acc) => (
          <Grid key={acc.name} xs={12}>
            {acc.archived ? (
              <ArchivedAccountItem
                accountName={acc.name}
                apiKey={acc.api_key}
                createdAt={acc.created_at}
                credentialOptions={acc.credential_options}
                exchangeName={acc.exchange}
                hashedApiKey={acc.hashed_api_key}
                id={acc.id}
                walletProvider={acc.wallet_provider}
                onUnarchiveAccount={handleUnarchiveAccount}
              />
            ) : (
              <AccountItem
                accountName={acc.name}
                apiKey={acc.api_key}
                createdAt={acc.created_at}
                credentialOptions={acc.credential_options}
                exchangeName={acc.exchange}
                exchangeSettings={exchangeSettings[acc.id]}
                hashedApiKey={acc.hashed_api_key}
                id={acc.id}
                loadAccounts={loadAccounts}
                marginMode={acc.margin_mode}
                setConfirmModalText={setConfirmModalText}
                setOpenConfirmModal={setOpenConfirmModal}
                showAlert={showAlert}
                walletProvider={acc.wallet_provider}
                onEditAccount={handleEditAccount}
                onOpenDepositModal={dexModals.openDepositModal}
                onOpenHlDepositModal={openHlDepositModal}
                onOpenHlTransferModal={openHlTransferModal}
                onOpenHlWithdrawModal={openHlWithdrawModal}
                onOpenWithdrawModal={dexModals.openWithdrawModal}
                onUnlinkAccount={onUnlinkAccount}
              />
            )}
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <>
      <GlobalStyles
        styles={{
          '@keyframes holographic-shimmer': holographicShimmer['@keyframes holographic-shimmer'],
        }}
      />
      <Modal
        closeAfterTransition
        open={open}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: `${theme.palette.common.pureBlack}80`, // 50% opacity
              backdropFilter: 'blur(12px)',
            },
            timeout: 500,
          },
        }}
        onClose={() => {
          onClose();
          if (hasChanges) {
            window.location.reload();
          }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: `${theme.palette.common.pureBlack}99`, // 60% opacity
            backdropFilter: 'blur(16px)',
            borderRadius: '8px',
            overflow: 'hidden',
            maxHeight: '90vh',
            height: { xs: 'auto', md: '800px' },
            width: '90%',
            maxWidth: '1200px',
            boxSizing: 'border-box',
            border: 'none',
            boxShadow: `0 8px 32px ${theme.palette.common.pureBlack}80`, // 50% opacity
            outline: 'none',
          }}
        >
          <IconButton
            aria-label='close'
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              zIndex: 1,
              color: 'var(--text-primary)',
            }}
            onClick={() => {
              onClose();
              if (hasChanges) {
                window.location.reload();
              }
            }}
          >
            <CloseIcon />
          </IconButton>

          <Box sx={{ p: 0, height: '100%', backgroundColor: 'transparent' }}>
            <Box sx={{ display: 'flex', height: '100%' }}>
              {/* Left Sidebar - Exchange List */}
              <Box
                sx={{
                  width: 280,
                  borderRight: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'transparent',
                }}
              >
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', backgroundColor: 'transparent' }}>
                  <Typography gutterBottom variant='h6'>
                    Exchange Accounts
                  </Typography>
                </Box>

                <Box sx={{ flex: 1, overflow: 'auto', backgroundColor: 'transparent' }}>
                  <List sx={{ py: 0 }}>
                    {/* All Accounts */}
                    {renderExchangeListItem('All', 'All Accounts')}

                    {/* DEX Section - Grouped by Wallet Type */}
                    {getDEXWalletTypes().length > 0 && (
                      <>
                        <Box sx={{ px: 2, py: 0 }}>
                          <Typography color='text.secondary' variant='caption'>
                            DEX
                          </Typography>
                        </Box>
                        {getDEXWalletTypes().map((walletType) =>
                          renderExchangeListItem(WALLET_TYPE_DISPLAY[walletType], WALLET_TYPE_DISPLAY[walletType], true)
                        )}
                      </>
                    )}

                    {/* CEX Section */}
                    {getCEXExchanges().length > 0 && (
                      <>
                        <Box sx={{ px: 2, py: 0, mt: 1 }}>
                          <Typography color='text.secondary' variant='caption'>
                            CEX
                          </Typography>
                        </Box>
                        {getCEXExchanges().map((exchange) => renderExchangeListItem(exchange, exchange))}
                      </>
                    )}
                  </List>
                </Box>

                {/* Connect Buttons - Moved to Bottom */}
                <Box
                  sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    backgroundColor: 'transparent',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <TutorialHighlight
                    open={!onboarding[ONBOARDING_KEY_MANAGEMENT_CONNECT]}
                    placement='left'
                    text='Connect your CEX and DEX accounts to start trading'
                    onClose={() => markOnboarding({ [ONBOARDING_KEY_MANAGEMENT_CONNECT]: true })}
                  >
                    <Stack spacing={1}>
                      <Button
                        fullWidth
                        color='primary'
                        size='small'
                        variant='outlined'
                        onClick={handleConnectCEXAccount}
                      >
                        <Typography variant='body1'>Connect CEX Account</Typography>
                      </Button>
                      <Button
                        fullWidth
                        color='primary'
                        size='small'
                        variant='outlined'
                        onClick={handleConnectHyperliquid}
                      >
                        <Stack alignItems='center' direction='row' spacing={1}>
                          <Typography sx={{ pr: 1 }} variant='body1'>
                            Connect Hyperliquid
                          </Typography>
                          <ExchangeIcons exchanges={['Hyperliquid']} style={{ width: 20, height: 20 }} />
                        </Stack>
                      </Button>
                      <Button fullWidth color='primary' size='small' variant='outlined' onClick={handleConnectAster}>
                        <Stack alignItems='center' direction='row' spacing={1}>
                          <Typography sx={{ pr: 1 }} variant='body1'>
                            Connect Aster
                          </Typography>
                          <ExchangeIcons exchanges={['Aster']} style={{ width: 20, height: 20 }} />
                        </Stack>
                      </Button>
                      <Button fullWidth color='primary' size='small' variant='outlined' onClick={handleConnectPacifica}>
                        <Stack alignItems='center' direction='row' spacing={1}>
                          <Typography sx={{ pr: 1 }} variant='body1'>
                            Connect Pacifica
                          </Typography>
                          <ExchangeIcons exchanges={['Pacifica']} style={{ width: 20, height: 20 }} />
                        </Stack>
                      </Button>
                      <Button fullWidth color='primary' size='small' variant='outlined' onClick={handleConnectParadex}>
                        <Stack alignItems='center' direction='row' spacing={1}>
                          <Typography sx={{ pr: 1 }} variant='body1'>
                            Connect Paradex
                          </Typography>
                          <ExchangeIcons exchanges={['Paradex']} style={{ width: 20, height: 20 }} />
                        </Stack>
                      </Button>
                      <Button fullWidth color='primary' size='small' variant='outlined' onClick={handleConnectExtended}>
                        <Stack alignItems='center' direction='row' spacing={1}>
                          <Typography sx={{ pr: 1 }} variant='body1'>
                            Connect Extended
                          </Typography>
                          <ExchangeIcons exchanges={['Extended']} style={{ width: 20, height: 20 }} />
                        </Stack>
                      </Button>

                      <Button fullWidth color='primary' size='small' variant='outlined' onClick={handleConnectWallet}>
                        <Typography variant='body1'>Connect DEX Wallet</Typography>
                      </Button>
                    </Stack>
                  </TutorialHighlight>
                </Box>
              </Box>

              {/* Right Content - Account Details */}
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'transparent',
                  position: 'relative',
                }}
              >
                {/* Header */}
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', backgroundColor: 'transparent' }}>
                  <Stack alignItems='center' direction='row' justifyContent='space-between'>
                    <Typography variant='h6'>
                      {selectedExchange === 'All' ? 'All Accounts' : `${selectedExchange} Accounts`}
                    </Typography>
                  </Stack>
                </Box>

                {/* Content */}
                <Box
                  sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 3,
                    backgroundColor: 'transparent',
                  }}
                >
                  {renderAccountGrid()}
                </Box>

                {/* Fixed gradient overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 58, // Account for bottom bar height
                    left: 0,
                    right: 0,
                    height: '40px',
                    background: `linear-gradient(to bottom, transparent, ${theme.palette.background.app}E6)`, // 90% opacity
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                />

                {/* Bottom Bar */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', backgroundColor: 'transparent' }}>
                  <Stack alignItems='center' direction='row' justifyContent='flex-end'>
                    {/* Help Link - Left Aligned */}
                    {/* <Link */}
                    {/*   href='' */}
                    {/*   rel='noopener noreferrer' */}
                    {/*   target='_blank' */}
                    {/*   variant='body2' */}
                    {/* > */}
                    {/*   Learn how to connect accounts */}
                    {/* </Link> */}

                    {/* Only Show Active Checkbox - Right Aligned */}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={onlyShowActive}
                          sx={{
                            color: 'text.secondary',
                            '&.Mui-checked': {
                              color: 'primary.main',
                            },
                          }}
                          onChange={(e) => setOnlyShowActive(e.target.checked)}
                        />
                      }
                      label={
                        <Typography color='text.primary' variant='body2'>
                          Only show active accounts
                        </Typography>
                      }
                    />
                  </Stack>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* CEX Account Modal - Excludes OKXDEX and Hyperliquid */}
      <AddAccountModal
        excludeExchanges={['OKXDEX', 'Hyperliquid', 'Paradex', 'Pacifica', 'Aster']}
        formData={formData}
        loadAccounts={loadAccounts}
        open={openAddAccountModal}
        serverIp={serverIp}
        setOpen={setOpenAddAccountModal}
        showAlert={showAlert}
        onChanged={() => setHasChanges(true)}
      />

      {/* Hyperliquid Account Modal */}
      <AddAccountModal
        formData={formData}
        loadAccounts={loadAccounts}
        open={openAddHyperliquidModal}
        preSelectedExchange='Hyperliquid'
        serverIp={serverIp}
        setOpen={setOpenAddHyperliquidModal}
        showAlert={showAlert}
        onChanged={() => setHasChanges(true)}
      />

      {/* Wallet Connection Modal - Only OKXDEX */}
      <AddAccountModal
        formData={formData}
        loadAccounts={loadAccounts}
        open={openAddWalletModal}
        preSelectedExchange='OKXDEX'
        serverIp={serverIp}
        setOpen={setOpenAddWalletModal}
        showAlert={showAlert}
        onChanged={() => setHasChanges(true)}
      />

      {/* Aster Account Modal */}
      <AddAccountModal
        formData={formData}
        loadAccounts={loadAccounts}
        open={openAddAsterModal}
        preSelectedExchange='Aster'
        serverIp={serverIp}
        setOpen={setOpenAddAsterModal}
        showAlert={showAlert}
        onChanged={() => setHasChanges(true)}
      />

      {/* Pacifica Account Modal */}
      <AddAccountModal
        formData={formData}
        loadAccounts={loadAccounts}
        open={openAddPacificaModal}
        preSelectedExchange='Pacifica'
        serverIp={serverIp}
        setOpen={setOpenAddPacificaModal}
        showAlert={showAlert}
        onChanged={() => setHasChanges(true)}
      />

      {/* Paradex Account Modal */}
      <AddAccountModal
        formData={formData}
        loadAccounts={loadAccounts}
        open={openAddParadexModal}
        preSelectedExchange='Paradex'
        serverIp={serverIp}
        setOpen={setOpenAddParadexModal}
        showAlert={showAlert}
        onChanged={() => setHasChanges(true)}
      />

      {/* Extended Account Modal */}
      <AddAccountModal
        formData={formData}
        loadAccounts={loadAccounts}
        open={openAddExtendedModal}
        preSelectedExchange='Extended'
        serverIp={serverIp}
        setOpen={setOpenAddExtendedModal}
        showAlert={showAlert}
        onChanged={() => setHasChanges(true)}
      />

      {/* Edit Account Modal */}
      <EditAccountModal
        accountData={editAccountData}
        formData={formData}
        loadAccounts={loadAccounts}
        open={openEditAccountModal}
        setOpen={setOpenEditAccountModal}
        showAlert={showAlert}
      />

      {/* Existing modals */}
      <UnarchiveAccountModal
        credential={accountToUnarchive}
        formData={formData}
        loadAccounts={loadAccounts}
        open={openUnarchiveAccountModal}
        setOpen={setOpenUnarchiveAccountModal}
        showAlert={showAlert}
        onChanged={() => setHasChanges(true)}
      />

      <BasicModal
        confirmButtonText='Yes'
        handleConfirm={handleDeleteConfirmation}
        message={confirmModalText}
        open={openConfirmModal}
        setOpen={setOpenConfirmModal}
      />

      {/* DEX Deposit Modal */}
      <DepositModal
        accountId={dexModals.selectedAccountId}
        open={dexModals.depositModalOpen}
        onClose={dexModals.closeDepositModal}
      />

      {/* DEX Withdraw Modal */}
      <WithdrawModal
        accountId={dexModals.selectedAccountId}
        balances={dexModals.selectedAccountBalances}
        open={dexModals.withdrawModalOpen}
        onClose={dexModals.closeWithdrawModal}
      />

      {/* Hyperliquid Deposit Modal */}
      {hlDepositModalOpen && (
        <HyperliquidDepositModal
          address={selectedHlAccountAddress}
          open={hlDepositModalOpen}
          onClose={closeHlDepositModal}
        />
      )}

      {/* Hyperliquid Withdraw Modal */}
      {hlWithdrawModalOpen && (
        <HyperliquidWithdrawModal
          address={selectedHlAccountAddress}
          open={hlWithdrawModalOpen}
          onClose={closeHlWithdrawModal}
        />
      )}

      {/* Hyperliquid Transfer Modal */}
      {hlTransferModalOpen && (
        <HyperliquidTransferModal
          address={selectedHlAccountAddress}
          open={hlTransferModalOpen}
          onClose={closeHlTransferModal}
        />
      )}
    </>
  );
}
