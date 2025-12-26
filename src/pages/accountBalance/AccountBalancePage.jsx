import {
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Title,
  Tooltip as ChartTooltip,
} from 'chart.js';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-moment';
import moment from 'moment';
import { useContext, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AccountsContext } from '@/shared/context/AccountsProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { useKeyManagementModal } from '@/shared/context/KeyManagementModalProvider';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { fetchAccountData, updateVcefiStatus } from '@/apiServices';
import { isEmpty } from '@/util';
import DataComponent from '@/shared/DataComponent';
import { Loader } from '@/shared/Loader';
import useViewport from '@/shared/hooks/useViewport';
import { DateRange } from '@/pages/points/DateRangePicker';
import { TraderProofsTable } from '@/pages/explorer/ExplorerProofsTable';
import { useTradeConsensus } from '@/shared/context/TradeConsensusProvider';
import { formatTraderId } from '@/shared/cryptoUtil';

// Material-UI Components
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import { useTheme } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

// Material-UI Icons
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';

// Images and Other Components
import ICONS from '@images/exchange_icons';
import WALLET_ICONS from '@images/wallet_icons';
import CHAIN_ICONS from '@images/chain_icons';
import { TraderProfileComponent } from './profile/TraderProfileComponent';
import LOGOS from '../../../images/logos';
import {
  calculateTotalValue,
  getNetworkFromWalletType,
  getNetworkDisplayName,
  formatWalletAddress,
  getExplorerUrl,
  getNetworkExplorerName,
} from './util';
import AccountOverviewComponent from './portfolio/AccountOverviewComponent';
import { AccountBalanceLayout, MobileAccountBalanceLayout } from './AccountBalanceLayout';
import AccountSummaryTable from './AccountSummaryTable';
import DepositModal from './portfolio/DepositModal';
import WithdrawModal from './portfolio/WithdrawModal';
import {
  HyperliquidDepositModal,
  HyperliquidWithdrawModal,
  HyperliquidTransferModal,
} from './portfolio/HyperliquidDepositWithdrawModals';
import ExplorerChoiceDialog from './ExplorerChoiceDialog';
import RenameAccountDialog from './RenameAccountDialog';
import FundingDashboard from './portfolio/FundingDashboard';

Chart.register(
  ArcElement,
  TimeScale,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Title,
  ChartTooltip,
  Legend
);

Chart.defaults.font.family = 'IBM PLEX MONO';

// Function to generate a deterministic color from a string
const getColorFromHash = (str, theme) => {
  if (!str) return theme.palette.primary.main; // default color if no string
  const colors = [
    theme.palette.primary.main, // Primary brand color
    theme.palette.primary.dark, // Primary dark
    theme.palette.secondary.main, // Secondary color
    theme.palette.primary.main, // Primary color
    theme.palette.primary.dark, // Primary dark
    theme.palette.primary.dark, // Primary darker
    theme.palette.semantic.success, // Success green
    theme.palette.semantic.success, // Green dark
    theme.palette.semantic.success, // Green darker
    theme.palette.charts.blue, // Info blue
    theme.palette.charts.blue, // Blue dark
    theme.palette.charts.blue, // Blue darker
    theme.palette.semantic.error, // Error red
    theme.palette.error.main, // Red dark
    theme.palette.semantic.warning, // Warning color
    theme.palette.semantic.warning, // Warning dark
  ];

  // Simple hash function without bitwise operators
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + (hash * 31 - hash);
  }

  // Use absolute value to ensure positive index
  return colors[Math.abs(hash) % colors.length];
};

// Function to get characters from trader ID
const getCharsFromTraderId = (traderId) => {
  if (!traderId) return '???';
  // Get last 3 characters and convert to uppercase
  return traderId.slice(-3).toUpperCase();
};

const getExchangePriority = (exchangeName) => {
  const priority = {
    binance: 1,
    bybit: 2,
    okx: 3,
    hyperliquid: 4,
  };
  return priority[exchangeName?.toLowerCase()] || 999; // Default high number for other exchanges
};

const sortAndGroupAccounts = (accounts) => {
  // First sort by exchange priority
  const sortedAccounts = [...accounts].sort((a, b) => {
    const priorityA = getExchangePriority(a.exchange_name);
    const priorityB = getExchangePriority(b.exchange_name);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    // If same exchange, sort by account name
    return a.account_name.localeCompare(b.account_name);
  });

  // Group by exchange
  const groupedAccounts = sortedAccounts.reduce((acc, account) => {
    const exchange = account.exchange_name?.toLowerCase() || 'other';
    if (!acc[exchange]) {
      acc[exchange] = [];
    }
    acc[exchange].push(account);
    return acc;
  }, {});

  return groupedAccounts;
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

// Function to determine if an account is DEX
const isDexAccount = (exchangeName) => {
  const dexExchanges = ['OKXDEX'];
  return dexExchanges.includes(exchangeName);
};

function EmptyAccountBalancePage() {
  const { openModal: openKeyManagementModal } = useKeyManagementModal();

  return (
    <Stack alignItems='center' direction='column' justifyContent='center' spacing={6} sx={{ height: '100%' }}>
      <img alt='Tread Logo' src={LOGOS.treadRoundedSvg} style={{ height: '64px' }} />
      <Typography maxWidth='400px' sx={{ textAlign: 'center' }} variant='h6'>
        No exchange accounts connected yet. Link your accounts now to get started.
      </Typography>
      <Button size='large' variant='contained' onClick={openKeyManagementModal}>
        Link API Keys or Connect Wallets
      </Button>
    </Stack>
  );
}

const EMPTY_ACCOUNT_OBJ = {
  accountId: '',
  accountName: '',
  exchangeName: '',
  vcefi_enabled: false,
};

function CexHeader({
  selectedAccount,
  traderId,
  firstEpoch,
  filteredEvents,
  handleVcefiStatusChange,
  user,
  onRenameSuccess,
  setHlDepositModalOpen,
  setHlWithdrawModalOpen,
  setHlTransferModalOpen,
}) {
  const theme = useTheme();
  const truncateAccountName = (name, maxLength = 30) => {
    if (!name) return 'Main Account';
    const isTruncated = name.length > maxLength;
    const displayText = isTruncated ? `${name.slice(0, maxLength)}...` : name;
    return (
      <Tooltip arrow placement='top' title={isTruncated ? name : ''}>
        <Typography
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '200px',
          }}
          variant='h6'
        >
          {displayText}
        </Typography>
      </Tooltip>
    );
  };

  return (
    <Paper elevation={0} sx={{ bgcolor: 'background.paper', p: 3 }}>
      <Grid container spacing={3}>
        {/* Profile Column */}
        <Grid item md={3} sm={4} sx={{ minWidth: { xs: '280px', sm: 'auto' } }} xs={12}>
          <Stack alignItems='center' direction='row' spacing={3}>
            <Box
              alignItems='center'
              bgcolor={getColorFromHash(selectedAccount.accountId, theme)}
              borderRadius='50%'
              display='flex'
              height={64}
              justifyContent='center'
              minHeight={64}
              minWidth={64}
              position='relative'
              width={64}
            >
              <Typography color='common.pureBlack' variant='h5'>
                {getCharsFromTraderId(selectedAccount.accountId)}
              </Typography>
              <Box
                alignItems='center'
                borderRadius='50%'
                bottom={-4}
                display='flex'
                height={24}
                justifyContent='center'
                position='absolute'
                right={-4}
                width={24}
              >
                <img
                  alt={selectedAccount.exchangeName}
                  src={ICONS[selectedAccount.exchangeName?.toLowerCase()] || ICONS.default}
                  style={{ borderRadius: '50%', height: '24px', width: '24px' }}
                />
              </Box>
            </Box>
            <Stack spacing={0.5}>
              <Stack alignItems='center' direction='row' spacing={0.5}>
                {truncateAccountName(selectedAccount.accountName)}
                <Tooltip placement='top' title='Rename account'>
                  <IconButton
                    size='small'
                    sx={{
                      '& .MuiSvgIcon-root': {
                        fontSize: '0.875rem',
                        color: 'text.secondary',
                      },
                      padding: '2px',
                    }}
                    onClick={() => onRenameSuccess()}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Typography color='text.secondary' variant='body1'>
                {formatExchangeNameDisplay(selectedAccount.exchangeName)}
              </Typography>
              <Typography color='text.secondary' variant='body1'>
                {user?.email}
              </Typography>
            </Stack>
          </Stack>
        </Grid>

        {/* Trader ID Column */}
        <Grid item md={6} sm={8} sx={{ minWidth: { xs: '320px', sm: 'auto' } }} xs={12}>
          <Paper elevation={0} sx={{ bgcolor: 'background.paper', pl: 1.25 }}>
            <TableContainer>
              <Table size='small'>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ border: 'none', p: 0.5 }}>
                      <Stack alignItems='center' direction='row' spacing={1}>
                        <img
                          alt='Tread Logo'
                          src={LOGOS.treadRoundedSvg}
                          style={{ borderRadius: '50%', height: '22px', width: '22px' }}
                        />
                        <Typography color='text.secondary' variant='body1'>
                          <strong>vCeFi Status</strong>
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ border: 'none', p: 0.5 }}>
                      <Typography color='text.disabled' variant='body1'>
                        <Stack alignItems='center' direction='row' spacing={1}>
                          {selectedAccount.vcefi_enabled ? (
                            <Typography
                              color={selectedAccount.vault_enabled ? 'success.main' : 'text.primary'}
                              variant='body1'
                            >
                              {selectedAccount.vault_enabled ? 'Online' : 'Private'}
                            </Typography>
                          ) : (
                            <Typography color='text.disabled' variant='body1'>
                              Offline
                            </Typography>
                          )}
                          <Tooltip placement='top' title='Click to learn more about vCeFi'>
                            <IconButton
                              size='small'
                              sx={{
                                '& .MuiSvgIcon-root': {
                                  color: 'text.secondary',
                                  fontSize: '14px',
                                },
                                padding: '4px',
                              }}
                              onClick={() =>
                                window.open(
                                  'https://foul-wavelength-9af.notion.site/Introducing-vCeFi-1d060eedf44c8027b4d4c7592f3f9b00',
                                  '_blank'
                                )
                              }
                            >
                              <InfoIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ border: 'none', p: 0.5 }}>
                      <Stack alignItems='center' direction='row' spacing={1}>
                        <img
                          alt='Proof Logo'
                          src={ICONS.proof}
                          style={{ borderRadius: '50%', height: '20px', width: '20px' }}
                        />
                        <Typography color='text.secondary' variant='body1'>
                          <strong>Trader ID</strong>
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ border: 'none', p: 0.5 }}>
                      <Stack alignItems='center' direction='row' spacing={1}>
                        <Typography variant='body1'>
                          {traderId ? `0x${formatTraderId(traderId, 18, 18)}` : 'N/A'}
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ border: 'none', p: 0.5 }}>
                      <Stack alignItems='center' direction='row' spacing={1}>
                        <img
                          alt='Arweave Logo Light'
                          src={ICONS.arweave}
                          style={{ borderRadius: '50%', height: '20px', width: '20px' }}
                        />
                        <Typography color='text.secondary' variant='body1'>
                          <strong>Genesis Epoch</strong>
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ border: 'none', p: 0.5 }}>
                      <Typography color={firstEpoch === 'N/A' ? 'text.disabled' : 'text.primary'} variant='body1'>
                        {firstEpoch === 'N/A' ? (
                          '-'
                        ) : (
                          <Stack alignItems='center' direction='row' spacing={1}>
                            {firstEpoch}
                            <Typography color='text.secondary' variant='body2'>
                              ({filteredEvents.length} Epochs)
                            </Typography>
                          </Stack>
                        )}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Publish Column */}
        <Grid item xs={3}>
          <TableContainer>
            <Table size='small'>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ border: 'none', p: 1, paddingLeft: '16px', minWidth: '120px' }}>
                    <Stack direction='row' justifyContent='space-between'>
                      <Tooltip placement='top' title='Use private IPFS for trading history'>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={selectedAccount.vcefi_enabled}
                              size='small'
                              onChange={(e) => handleVcefiStatusChange(selectedAccount.accountId, e.target.checked)}
                            />
                          }
                          label='vCeFi'
                          sx={{
                            '& .MuiFormControlLabel-label': {
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                              marginLeft: '8px',
                            },
                          }}
                        />
                      </Tooltip>

                      {selectedAccount.exchangeName === 'Hyperliquid' && (
                        <Stack direction='row' spacing={1}>
                          <Tooltip placement='top' title='Deposit to Hyperliquid'>
                            <Button
                              color='primary'
                              sx={{
                                minWidth: '80px',
                              }}
                              variant='contained'
                              onClick={() => setHlDepositModalOpen(true)}
                            >
                              <Typography color='primary.contrastText' variant='button1'>
                                Deposit
                              </Typography>
                            </Button>
                          </Tooltip>
                          <Tooltip placement='top' title='Withdraw from Hyperliquid'>
                            <Button
                              sx={{
                                minWidth: '80px',
                              }}
                              variant='outlined'
                              onClick={() => setHlWithdrawModalOpen(true)}
                            >
                              <Typography variant='button1'>Withdraw</Typography>
                            </Button>
                          </Tooltip>
                        </Stack>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ border: 'none', p: 1, minWidth: '120px', paddingLeft: '16px' }}>
                    <Stack direction='row' justifyContent='space-between'>
                      <Tooltip placement='top' title='Convert into vault (Coming Soon)'>
                        <FormControlLabel
                          control={<Switch disabled size='small' />}
                          label='Vault'
                          sx={{
                            '& .MuiFormControlLabel-label': {
                              color: 'text.secondary',
                              fontSize: '0.75rem',
                              marginLeft: '8px',
                            },
                          }}
                        />
                      </Tooltip>

                      {selectedAccount.exchangeName === 'Hyperliquid' && (
                        <Tooltip placement='top' title='Transfer between Hyperliquid accounts'>
                          <Button
                            sx={{
                              width: '164px',
                            }}
                            variant='outlined'
                            onClick={() => setHlTransferModalOpen(true)}
                          >
                            <Typography variant='button1'>Transfer</Typography>
                          </Button>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Paper>
  );
}

// DEX Header Component
function DexHeader({
  selectedAccount,
  credMetaById,
  setDepositModalOpen,
  setWithdrawModalOpen,
  user,
  onRenameSuccess,
}) {
  const theme = useTheme();
  const accountMeta = credMetaById[selectedAccount.accountId] || {};
  const walletType = accountMeta.wallet_type;
  const walletProvider = accountMeta.wallet_provider;
  const linkedWalletAddress = accountMeta.api_key;
  const tradingWalletAddress = accountMeta.api_secret;
  const network = getNetworkFromWalletType(walletType);
  const networkDisplayName = getNetworkDisplayName(walletType);

  const [explorerDialogOpen, setExplorerDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedAddressType, setSelectedAddressType] = useState(null);

  // Detect viewport size for responsive behaviour
  const { isMobile, isTablet } = useViewport();

  const truncateAccountName = (name, maxLength = 30) => {
    if (!name) return 'Main Account';
    const isTruncated = name.length > maxLength;
    const displayText = isTruncated ? `${name.slice(0, maxLength)}...` : name;
    return (
      <Tooltip arrow placement='top' title={isTruncated ? name : ''}>
        <Typography
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '200px',
          }}
          variant='h6'
        >
          {displayText}
        </Typography>
      </Tooltip>
    );
  };

  const getWalletProviderName = (provider) => {
    if (!provider) return 'N/A';
    // Extract wallet name from provider string (e.g., "metamask.ethereum" -> "metamask")
    const walletName = provider.split('.')[0];
    if (walletName.toLowerCase().includes('metamask')) return 'MetaMask';
    if (walletName.toLowerCase().includes('phantom')) return 'Phantom';
    if (walletName.toLowerCase().includes('solflare')) return 'Solflare';
    if (walletName.toLowerCase().includes('walletconnect')) return 'WalletConnect';
    if (walletName.toLowerCase().includes('coinbase')) return 'Coinbase';
    return walletName.charAt(0).toUpperCase() + walletName.slice(1);
  };

  const getWalletIcon = (provider) => {
    if (!provider) return WALLET_ICONS.default;
    return WALLET_ICONS[provider.toLowerCase()] || WALLET_ICONS.default;
  };

  const handleAddressClick = (address, addressType) => {
    if (!address) return;

    // For Solana, directly open Solscan
    if (network === '501') {
      const url = getExplorerUrl(address, network);
      if (url) {
        window.open(url, '_blank');
      }
      return;
    }

    // For ETH networks, show popup to choose between Base and Ethereum
    if (network === '1' || network === '8453') {
      setSelectedAddress(address);
      setSelectedAddressType(addressType);
      setExplorerDialogOpen(true);
    }
  };

  const handleExplorerChoice = (explorerNetwork) => {
    const url = getExplorerUrl(selectedAddress, explorerNetwork);
    if (url) {
      window.open(url, '_blank');
    }
    setExplorerDialogOpen(false);
  };

  return (
    <>
      <Paper elevation={0} sx={{ bgcolor: 'background.paper', p: 3 }}>
        <Grid container spacing={3} sx={{ minWidth: 0 }}>
          {/* Profile Column */}
          <Grid item md={3} sm={4} sx={{ minWidth: { xs: '280px', sm: 'auto' } }} xs={12}>
            <Stack alignItems='center' direction='row' spacing={3}>
              <Box
                alignItems='center'
                bgcolor={getColorFromHash(selectedAccount.accountId, theme)}
                borderRadius='50%'
                display='flex'
                height={64}
                justifyContent='center'
                minHeight={64}
                minWidth={64}
                position='relative'
                width={64}
              >
                <Typography color='common.pureBlack' variant='h5'>
                  {getCharsFromTraderId(selectedAccount.accountId)}
                </Typography>
                <Box
                  alignItems='center'
                  borderRadius='50%'
                  bottom={-4}
                  display='flex'
                  height={24}
                  justifyContent='center'
                  position='absolute'
                  right={-4}
                  width={24}
                >
                  <img
                    alt={selectedAccount.exchangeName}
                    src={ICONS[selectedAccount.exchangeName?.toLowerCase()] || ICONS.default}
                    style={{ borderRadius: '50%', height: '24px', width: '24px' }}
                  />
                </Box>
              </Box>
              <Stack spacing={0.5}>
                <Stack alignItems='center' direction='row' spacing={0.5}>
                  {truncateAccountName(selectedAccount.accountName)}
                  <Tooltip placement='top' title='Rename account'>
                    <IconButton
                      size='small'
                      sx={{
                        '& .MuiSvgIcon-root': {
                          fontSize: '0.875rem',
                          color: 'text.secondary',
                        },
                        padding: '2px',
                      }}
                      onClick={() => onRenameSuccess()}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Typography color='text.secondary' variant='body1'>
                  {formatExchangeNameDisplay(selectedAccount.exchangeName)}
                </Typography>
                <Typography color='text.secondary' variant='body1'>
                  {user?.email}
                </Typography>
              </Stack>
            </Stack>
          </Grid>

          {/* Wallet Info Column */}
          <Grid item md={7} sm={8} sx={{ minWidth: { xs: '320px', sm: 'auto' } }} xs={12}>
            <Paper elevation={0} sx={{ bgcolor: 'background.paper', pl: 1.25 }}>
              <TableContainer>
                <Table size='small'>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ border: 'none', p: 0.5, width: '30%', textAlign: 'left' }}>
                        <Typography color='text.secondary' variant='body1'>
                          <strong>Wallet Type</strong>
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: 'none', p: 0.5 }}>
                        <Stack alignItems='center' direction='row' spacing={1}>
                          <img
                            alt='Network'
                            src={CHAIN_ICONS[network?.toLowerCase()] || CHAIN_ICONS.default}
                            style={{ borderRadius: '50%', height: '20px', width: '20px' }}
                          />
                          <Typography>{networkDisplayName}</Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ border: 'none', p: 0.5, width: '30%', textAlign: 'left' }}>
                        <Typography color='text.secondary' variant='body1'>
                          <strong>Linked Wallet</strong>
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: 'none', p: 0.5 }}>
                        <Stack alignItems='center' direction='row' spacing={1}>
                          <img
                            alt='Wallet Provider'
                            src={getWalletIcon(walletProvider)}
                            style={{ borderRadius: '50%', height: '20px', width: '20px' }}
                          />
                          <Typography
                            sx={{
                              cursor: linkedWalletAddress ? 'pointer' : 'default',
                              '&:hover': {
                                color: linkedWalletAddress ? 'primary.main' : 'inherit',
                              },
                            }}
                            variant='body1'
                            onClick={() => handleAddressClick(linkedWalletAddress, 'Linked Wallet')}
                          >
                            {linkedWalletAddress || 'N/A'}
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ border: 'none', p: 0.5, width: '30%', textAlign: 'left' }}>
                        <Typography color='text.secondary' variant='body1'>
                          <strong>Trading Wallet</strong>
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ border: 'none', p: 0.5 }}>
                        <Stack alignItems='center' direction='row' spacing={1}>
                          <img
                            alt='Wallet Provider'
                            src={LOGOS.treadRoundedSvg}
                            style={{ borderRadius: '50%', height: '20px', width: '20px' }}
                          />
                          <Typography
                            sx={{
                              cursor: tradingWalletAddress ? 'pointer' : 'default',
                              '&:hover': {
                                color: tradingWalletAddress ? 'primary.main' : 'inherit',
                              },
                            }}
                            variant='body1'
                            onClick={() => handleAddressClick(tradingWalletAddress, 'Trading Wallet')}
                          >
                            {tradingWalletAddress || 'N/A'}
                          </Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Action Buttons Column – render only on desktop */}
          {!isMobile && !isTablet && (
            <Grid item xs={2}>
              <Stack direction='column' spacing={2}>
                <Button
                  color='primary'
                  sx={{
                    minWidth: '120px',
                  }}
                  variant='contained'
                  onClick={() => setDepositModalOpen(true)}
                >
                  <Typography color='primary.contrastText' variant='button1'>
                    Deposit
                  </Typography>
                </Button>
                <Button
                  sx={{
                    minWidth: '120px',
                  }}
                  variant='outlined'
                  onClick={() => setWithdrawModalOpen(true)}
                >
                  <Typography variant='button1'>Withdraw</Typography>
                </Button>
              </Stack>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Explorer Choice Dialog */}
      <ExplorerChoiceDialog
        open={explorerDialogOpen}
        selectedAddressType={selectedAddressType}
        onClose={() => setExplorerDialogOpen(false)}
        onExplorerChoice={handleExplorerChoice}
      />
    </>
  );
}

function AccountBalancePage() {
  const [accountBalances, setAccountBalances] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(EMPTY_ACCOUNT_OBJ);
  const [pageToggle, setPageToggle] = useState('overview');
  const [pastSnapshots, setPastSnapshots] = useState({});
  const [loading, setLoading] = useState(true);
  const { showAlert } = useContext(ErrorContext);
  const { user } = useUserMetadata();
  const { isMobile } = useViewport();
  const theme = useTheme();

  // Set Chart.js default color to theme color
  // eslint-disable-next-line prefer-destructuring
  Chart.defaults.color = theme.palette.grey[200];

  const [timeActiveButton, setTimeActiveButton] = useState('1M');
  const [dateRange, setDateRange] = useState(DateRange.MONTH);
  const { loading: accountLoading, accounts, traderIdExchanges } = useContext(AccountsContext);
  const { fetchTradeConsensus } = useTradeConsensus();
  const [volumeLoading, setVolumeLoading] = useState(false);
  const isAccountSelected = Boolean(selectedAccount.accountId);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [hlDepositModalOpen, setHlDepositModalOpen] = useState(false);
  const [hlWithdrawModalOpen, setHlWithdrawModalOpen] = useState(false);
  const [hlTransferModalOpen, setHlTransferModalOpen] = useState(false);
  const [credMetaById, setCredMetaById] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [accountToRename, setAccountToRename] = useState(null);

  const selectedExchangeAccount = selectedAccount.accountId
    ? accounts.find((a) => a.id === selectedAccount.accountId)
    : null;

  const handleSelectedAccountBalance = (accountBalance) => {
    setSelectedAccount({
      accountId: accountBalance.account_id,
      accountName: accountBalance.account_name,
      exchangeName: accountBalance.exchange_name,
      vcefi_enabled: accountBalance.vcefi_enabled || false,
    });
  };

  const getAccountBalances = async (initial = true) => {
    const startTime = moment.utc().subtract(8, 'days');
    const endTime = moment.utc();
    try {
      const response = await fetchAccountData({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
      const sortedAccountBalances = response.account_balances.sort((a, b) =>
        a.account_name.localeCompare(b.account_name)
      );

      sortedAccountBalances.forEach((balance) => {
        if (balance.exchange_name === 'BinancePM') {
          // eslint-disable-next-line no-param-reassign
          balance.exchange_name = 'Binance';
        }
      });

      const parsedAccountBalancesWithTotal = sortedAccountBalances.map((balance) => {
        const newBalance = balance;
        newBalance.totalValue = calculateTotalValue(balance);
        return newBalance;
      });

      setAccountBalances(parsedAccountBalancesWithTotal);
      setPastSnapshots(response.past_snapshots);
      setCredMetaById(response.cred_meta_by_id);

      // Check for selectedAccount URL parameter first
      const selectedAccountParam = searchParams.get('selectedAccount');
      if (initial && selectedAccountParam && sortedAccountBalances.length > 0) {
        // Find account matching the URL parameter by account name
        const matchingAccount = sortedAccountBalances.find((account) => account.account_name === selectedAccountParam);
        if (matchingAccount) {
          handleSelectedAccountBalance(matchingAccount);
          // Clear the URL parameter after selection
          setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('selectedAccount');
            return newParams;
          });
        }
      }
      // Only set the initial account if we don't have one selected, no URL param, and we're on desktop
      else if (initial && !isMobile && !selectedAccount.accountId && sortedAccountBalances.length > 0) {
        handleSelectedAccountBalance(sortedAccountBalances[0]);
      }

      const orderingByAccount = {};

      sortedAccountBalances.forEach((balance) => {
        balance.assets.sort((a, b) => Math.abs(b.notional) - Math.abs(a.notional));
        orderingByAccount[balance.account_name] = balance.assets.map((a) => a.symbol);
      });

      setLoading(false);
    } catch (e) {
      showAlert({ severity: 'error', message: e.message });
    }
  };

  const handleVcefiStatusChange = async (accountId, enabled) => {
    try {
      await updateVcefiStatus(accountId, enabled);
      // Only update the UI after successful API response
      setSelectedAccount((prev) => ({
        ...prev,
        vcefi_enabled: enabled,
      }));
      // Refresh account data to get updated vCeFi status
      await getAccountBalances();
    } catch (error) {
      showAlert({
        severity: 'error',
        message: error.message,
      });
    }
  };

  const handleRenameClick = () => {
    if (selectedAccount.accountId) {
      setAccountToRename({
        accountId: selectedAccount.accountId,
        name: selectedAccount.accountName,
      });
      setRenameDialogOpen(true);
    }
  };

  const handleRenameSuccess = () => {
    getAccountBalances(false);
    showAlert({ severity: 'success', message: 'Account renamed successfully' });
  };

  const handleRenameClose = () => {
    setRenameDialogOpen(false);
    setAccountToRename(null);
  };

  useEffect(() => {
    getAccountBalances();
  }, []);

  const traderId = useMemo(() => {
    if (!selectedAccount.accountId) return null;
    return accounts.find((a) => a.id === selectedAccount.accountId)?.hashed_api_key;
  }, [selectedAccount, accounts]);

  useEffect(() => {
    async function fetch() {
      if (traderId && selectedAccount.vcefi_enabled) {
        try {
          setVolumeLoading(true);
          const { riskEvents } = await fetchTradeConsensus(traderId, dateRange);
          setFilteredEvents(riskEvents);
        } finally {
          setVolumeLoading(false);
        }
      } else {
        setFilteredEvents([]);
      }
    }
    fetch();
  }, [selectedAccount, traderId, dateRange]);

  const firstEpoch = filteredEvents.length > 0 ? filteredEvents[filteredEvents.length - 1].epoch : 'N/A';

  const selectedAccountFull = selectedAccount.accountId
    ? accountBalances.find((a) => a.account_id === selectedAccount.accountId)
    : {};

  const selectedAssets = selectedAccount.accountId ? selectedAccountFull.assets : [];

  const Layout = isMobile ? MobileAccountBalanceLayout : AccountBalanceLayout;

  // Determine if selected account is DEX
  const isDex = isDexAccount(selectedAccount.exchangeName);
  const isFundingHistoryExchange = ['Bybit', 'Binance', 'Hyperliquid', 'OKX', 'Bitget'].includes(
    selectedAccount.exchangeName
  );
  return (
    <Layout
      isAccountSelected={isAccountSelected}
      leftPanel={
        <DataComponent
          emptyComponent={<EmptyAccountBalancePage />}
          isEmpty={isEmpty(accountBalances)}
          isLoading={loading}
          loadingComponent={<Loader />}
        >
          <Stack direction='column' spacing={4} sx={{ p: 4 }}>
            <Typography variant='h5'>Accounts</Typography>
            <Divider />
            {Object.entries(sortAndGroupAccounts(accountBalances)).map(([exchange, exchangeAccounts]) => (
              <Box key={exchange}>
                <Typography
                  sx={{
                    textTransform: 'capitalize',
                    color: 'text.secondary',
                    mb: 1,
                  }}
                  variant='subtitle1'
                >
                  {formatExchangeNameDisplay(exchange)}
                </Typography>
                <AccountSummaryTable
                  accountsById={credMetaById}
                  balances={exchangeAccounts}
                  getAccounts={getAccountBalances}
                  pastSnapshots={pastSnapshots}
                  selectedAccount={selectedAccount}
                  setSelectedAccount={handleSelectedAccountBalance}
                  showAlert={showAlert}
                />
                <Box sx={{ mb: 2 }} />
              </Box>
            ))}
          </Stack>
        </DataComponent>
      }
      onClose={() => setSelectedAccount(EMPTY_ACCOUNT_OBJ)}
    >
      <DataComponent isLoading={loading} loadingComponent={<Loader />}>
        {isAccountSelected && (
          <>
            {isDex ? (
              <DexHeader
                credMetaById={credMetaById}
                selectedAccount={selectedAccount}
                setDepositModalOpen={setDepositModalOpen}
                setWithdrawModalOpen={setWithdrawModalOpen}
                user={user}
                onRenameSuccess={handleRenameClick}
              />
            ) : (
              <CexHeader
                filteredEvents={filteredEvents}
                firstEpoch={firstEpoch}
                handleVcefiStatusChange={handleVcefiStatusChange}
                selectedAccount={selectedAccount}
                setHlDepositModalOpen={setHlDepositModalOpen}
                setHlTransferModalOpen={setHlTransferModalOpen}
                setHlWithdrawModalOpen={setHlWithdrawModalOpen}
                showAlert={showAlert}
                traderId={traderId}
                user={user}
                onRenameSuccess={handleRenameClick}
              />
            )}
            <Divider />
            <Tabs
              aria-label='scrollable tabs'
              scrollButtons='auto'
              value={pageToggle}
              variant='scrollable'
              onChange={(e, newValue) => setPageToggle(newValue)}
            >
              <Tab label='Portfolio' value='overview' />
              {!isDex && <Tab label='Funding' value='funding' />}
              {!isDex && <Tab label='vCeFi' value='volume' />}
            </Tabs>
            <Divider />
            {pageToggle === 'volume' && !isDex && (
              <DataComponent
                emptyComponent={<EmptyAccountBalancePage />}
                isEmpty={isEmpty(accountBalances)}
                isLoading={accountLoading || volumeLoading}
                loadingComponent={<Skeleton sx={{ height: '100%', width: '100%' }} variant='rounded' />}
              >
                <Stack direction='column' spacing={2}>
                  <Paper elevation={0}>
                    <TraderProfileComponent
                      consensusEvents={filteredEvents}
                      dateRange={dateRange}
                      traderIdExchanges={traderIdExchanges}
                    />
                  </Paper>
                  <Paper elevation={0} sx={{ p: 2 }}>
                    <TraderProofsTable proofs={filteredEvents} />
                  </Paper>
                </Stack>
              </DataComponent>
            )}
            {pageToggle === 'funding' && (
              <Box sx={{ p: 2 }}>
                {isFundingHistoryExchange ? (
                  <FundingDashboard
                    accountId={selectedAccount.accountId}
                    exchangeName={selectedAccount.exchangeName}
                    totalEquity={selectedAccountFull?.totalValue || 0}
                  />
                ) : (
                  <Box alignItems='center' display='flex' justifyContent='center'>
                    <Typography color='text.disabled' variant='subtitle1'>
                      Funding history is not available for this exchange
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            {pageToggle === 'overview' && (
              <AccountOverviewComponent
                accountBalances={accountBalances}
                assets={selectedAssets}
                getAccounts={getAccountBalances}
                pastSnapshots={pastSnapshots}
                selectedAccount={selectedAccount}
                setTimeActiveButton={setTimeActiveButton}
                timeActiveButton={timeActiveButton}
              />
            )}
            <DepositModal
              accountId={selectedAccount.accountId}
              open={depositModalOpen}
              onClose={() => setDepositModalOpen(false)}
            />
            <WithdrawModal
              accountId={selectedAccount.accountId}
              balances={selectedAssets}
              open={withdrawModalOpen}
              onClose={() => setWithdrawModalOpen(false)}
            />
            <RenameAccountDialog
              account={accountToRename}
              open={renameDialogOpen}
              onClose={handleRenameClose}
              onSuccess={handleRenameSuccess}
            />
            {hlDepositModalOpen && (
              <HyperliquidDepositModal
                address={selectedExchangeAccount.api_key}
                open={hlDepositModalOpen}
                onClose={() => setHlDepositModalOpen(false)}
              />
            )}
            {hlWithdrawModalOpen && (
              <HyperliquidWithdrawModal
                address={selectedExchangeAccount.api_key}
                open={hlWithdrawModalOpen}
                onClose={() => setHlWithdrawModalOpen(false)}
              />
            )}
            {hlTransferModalOpen && (
              <HyperliquidTransferModal
                address={selectedExchangeAccount.api_key}
                open={hlTransferModalOpen}
                onClose={() => setHlTransferModalOpen(false)}
              />
            )}
          </>
        )}
      </DataComponent>
    </Layout>
  );
}

export default AccountBalancePage;
