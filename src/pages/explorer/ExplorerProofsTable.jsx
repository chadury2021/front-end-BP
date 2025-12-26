import ShareableImageModal from '@/shared/shareable/ShareableImageModal';
import LabelTooltip from '@/shared/components/LabelTooltip';
import PrettyRelativeTimestamp from '@/shared/components/PrettyRelativeTimestamp';
import { AccountsContext } from '@/shared/context/AccountsProvider';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { matchesTraderId, matchesTraderIds } from '@/shared/cryptoUtil';
import { StyledHeaderTableCellWithLine, StyledTableCell } from '@/shared/orderTable/util';
import { formatNumber } from '@/shared/utils/formatNumber';
import { useTheme } from '@emotion/react';
import ExchangeIcons from '@images/exchange_icons';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BarChartIcon from '@mui/icons-material/BarChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShareIcon from '@mui/icons-material/Share';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  Grid,
} from '@mui/material';
import { Box, Stack } from '@mui/system';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScaleLoader from 'react-spinners/ScaleLoader';
import ProofLogoImg from './proofUtils/ProofLogoImg';
import { useProofsPagination } from './proofUtils/useProofsPagination';
import { TraderIdAutocomplete } from './TraderIdAutocomplete';
import { getEpochStartAndEnd } from './utils/epoch';
import { PAGINATION_CONFIG, REFRESH_CONFIG } from './utils/uiConfig';

const columns = [
  {
    id: 'exchangeAccount',
    label: 'Exchange Account',
    width: 150,
    align: 'left',
  },
  {
    id: 'data',
    label: 'Data',
    width: 150,
    align: 'left',
  },
  {
    id: 'epoch',
    label: (
      <Stack alignItems='center' direction='row' gap={1}>
        <img alt='Tread' src={ExchangeIcons.tread} style={{ height: '14px' }} />
        Block
      </Stack>
    ),
    width: 120,
    align: 'left',
  },
  {
    id: 'tradeWindow',
    label: 'Trade Window',
    width: 300,
    align: 'left',
  },
  {
    id: 'epoch',
    label: '',
    // tooltip: 'Click on an epoch to view detailed information',
    width: 100,
    align: 'left',
  },
  {
    id: 'share',
    label: '',
    width: 50,
    align: 'center',
  },
];

/**
 * Transforms a list of proof events into a grouped structure by epoch
 * @param {Array} proofs - Array of proof events with epoch, parameterId, and value
 * @returns {Array} Array of objects with structure { epoch, data: {parameterId: value}, ...otherFields }
 */
const groupProofsByEpoch = (proofs) => {
  const groupedByEpoch = {};

  proofs.forEach((proof) => {
    const { epoch, parameterId, data: value, ...otherFields } = proof;

    if (!groupedByEpoch[epoch]) {
      groupedByEpoch[epoch] = {
        epoch,
        data: {},
        ...otherFields, // Preserve all other fields from the first proof of this epoch
      };
    }

    // Add parameterId-value pair to the data object
    if (parameterId !== undefined && value !== undefined) {
      groupedByEpoch[epoch].data[parameterId] = value;
    }
  });

  // Convert to array and sort by epoch (descending)
  return Object.values(groupedByEpoch).sort((a, b) => Number(b.epoch) - Number(a.epoch));
};

/**
 * Row component that displays proof event data
 */
function ProofRow({ proof, onShareClick }) {
  const theme = useTheme();
  const { traderId, epoch, data } = proof;
  const { accounts } = useContext(AccountsContext);

  // Get timestamp from epoch
  const [epochStart, epochEnd] = getEpochStartAndEnd(Number(epoch));

  // Find the account name matching the traderId
  const accountName = useMemo(() => {
    if (!accounts || !traderId) return 'N/A';
    const matchingAccount = accounts.find(
      (account) => account.hashed_api_key && matchesTraderId(account.hashed_api_key, traderId)
    );
    return matchingAccount ? matchingAccount.name : 'N/A';
  }, [accounts, traderId]);

  // Find the exchange name for the icon
  const accountExchange = useMemo(() => {
    if (!accounts || !traderId) return null;
    const matchingAccount = accounts.find(
      (account) => account.hashed_api_key && matchesTraderId(account.hashed_api_key, traderId)
    );
    return matchingAccount ? matchingAccount.exchange : null;
  }, [accounts, traderId]);

  // Calculate the exchange icon source safely
  const exchangeIconSrc = useMemo(() => {
    if (typeof accountExchange === 'string' && accountExchange.length > 0) {
      const key = accountExchange.toLowerCase();
      // Check if the key exists in ExchangeIcons to avoid undefined src
      return ExchangeIcons[key] || null; // Return null if key doesn't exist
    }
    return null; // Return null if accountExchange is not a valid string
  }, [accountExchange]);

  // Navigate to details page
  const handleEpochClick = (e) => {
    e.preventDefault();
    window.open(`/explorer/trader-epoch/${traderId}/${epoch}`, '_blank');
  };

  const volume = data[0];
  const totalEquity = data[2];
  const unrealizedPnl = data[3];
  const notionalExposure = data[4];

  return (
    <TableRow hover>
      <StyledTableCell>
        <Stack alignItems='center' direction='row' spacing={1}>
          {/* Use the derived exchangeIconSrc for check and src */}
          {exchangeIconSrc && (
            <img
              alt={accountExchange || 'Exchange'} // Use accountExchange or a default alt text
              src={exchangeIconSrc}
              style={{
                height: '16px',
                width: '16px',
                borderRadius: '50%',
                marginRight: '8px',
              }}
            />
          )}
          <Typography variant='body2'>{accountName}</Typography>
        </Stack>
      </StyledTableCell>

      <StyledTableCell>
        <Grid container spacing={1} sx={{ width: 'fit-content' }}>
          <Grid item>
            <Tooltip title={volume !== undefined ? `Volume (${formatNumber(volume)})` : 'Volume (N/A)'}>
              <BarChartIcon
                sx={{
                  fontSize: '16px',
                  color: volume !== undefined ? 'primary.main' : theme.palette.grey[600],
                }}
              />
            </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip
              title={totalEquity !== undefined ? `Total Equity (${formatNumber(totalEquity)})` : 'Total Equity (N/A)'}
            >
              <AccountBalanceIcon
                sx={{
                  fontSize: '16px',
                  color: totalEquity !== undefined ? 'success.main' : theme.palette.grey[600],
                }}
              />
            </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip
              title={
                unrealizedPnl !== undefined ? `Unrealized PnL (${formatNumber(unrealizedPnl)})` : 'Unrealized PnL (N/A)'
              }
            >
              <TrendingUpIcon
                sx={{
                  fontSize: '16px',
                  color: unrealizedPnl !== undefined ? 'success.main' : theme.palette.grey[600],
                }}
              />
            </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip
              title={
                notionalExposure !== undefined
                  ? `Notional Exposure (${formatNumber(notionalExposure)})`
                  : 'Notional Exposure (N/A)'
              }
            >
              <ShowChartIcon
                sx={{
                  fontSize: '16px',
                  color: notionalExposure !== undefined ? 'warning.main' : theme.palette.grey[600],
                }}
              />
            </Tooltip>
          </Grid>
        </Grid>
      </StyledTableCell>

      <StyledTableCell>
        <Typography
          sx={{
            textAlign: 'left',
            p: 0,
            display: 'inline-block',
          }}
        >
          {epoch}
        </Typography>
      </StyledTableCell>

      <StyledTableCell>
        <Stack alignItems='center' direction='row' spacing={2}>
          <PrettyRelativeTimestamp sx={{ minWidth: '100px' }} timestamp={epochStart}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <PrettyRelativeTimestamp.ISO variant='body2' />
              <PrettyRelativeTimestamp.Relative variant='body2' />
            </Box>
          </PrettyRelativeTimestamp>
          <Typography>→</Typography>
          <PrettyRelativeTimestamp sx={{ minWidth: '100px' }} timestamp={epochEnd}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <PrettyRelativeTimestamp.ISO variant='body2' />
              <PrettyRelativeTimestamp.Relative variant='body2' />
            </Box>
          </PrettyRelativeTimestamp>
        </Stack>
      </StyledTableCell>

      <StyledTableCell align='right'>
        <Button
          color='info'
          startIcon={<ProofLogoImg height='12px' variant='primary' />}
          variant='outlined'
          onClick={handleEpochClick}
        >
          Proof
        </Button>
      </StyledTableCell>

      <StyledTableCell align='center'>
        <IconButton size='small' sx={{ color: 'text.secondary' }} onClick={() => onShareClick(proof)}>
          <ShareIcon fontSize='inherit' />
        </IconButton>
      </StyledTableCell>
    </TableRow>
  );
}

/**
 * Component that displays a table of proof events from the blockchain
 * @param {boolean} isPreviewOnly - Whether to display a preview of the proofs
 */
export default function ExplorerProofsTable({ isPreviewOnly, selectedAccounts = null }) {
  const pageSize = isPreviewOnly ? PAGINATION_CONFIG.PREVIEW_ROWS : PAGINATION_CONFIG.DEFAULT_ROWS;
  const [traderIdFilter, setTraderIdFilter] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const { accounts } = useContext(AccountsContext);
  const { showAlert } = useContext(ErrorContext);
  const { user } = useUserMetadata(); // Needed for potential referral link
  const [nextRefreshSeconds, setNextRefreshSeconds] = useState(Math.floor(REFRESH_CONFIG.INTERVAL / 1000));

  // State for shareable image generation
  const [modalOpen, setModalOpen] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [selectedProofData, setSelectedProofData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const shareableImageRef = useRef(null);

  const { proofs, page, loading, handlePageChange, totalItems, refreshProofs } = useProofsPagination({ pageSize });

  // Filter proofs by trader ID if filter is set
  const filteredProofs = traderIdFilter
    ? proofs.filter((proof) => {
        if (Array.isArray(traderIdFilter)) {
          return matchesTraderIds(proof.traderId, traderIdFilter);
        }
        return matchesTraderId(proof.traderId, traderIdFilter);
      })
    : proofs;

  const handleRefresh = () => {
    refreshProofs();
    setNextRefreshSeconds(Math.floor(REFRESH_CONFIG.INTERVAL / 1000));
  };

  // Update traderIdFilter if trader ID is given by parent
  useEffect(() => {
    setTraderIdFilter(selectedAccounts);
  }, [selectedAccounts]);

  // Update the countdown timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNextRefreshSeconds((prevSeconds) => {
        if (prevSeconds <= 1) {
          return Math.floor(REFRESH_CONFIG.INTERVAL / 1000);
        }
        return prevSeconds - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format the countdown for display
  const formatCountdown = () => {
    const minutes = Math.floor(nextRefreshSeconds / 60);
    const seconds = nextRefreshSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleShareClick = (proof) => {
    // Add the account name and exchange to the proof data if available
    const account = accounts.find((acc) => acc.traderId === proof.traderId);
    const proofWithAccount = {
      ...proof,
      accountName: account ? account.name : 'Unknown Account',
      // Add exchange information for the logo
      accountExchange: account ? account.exchange : 'binance', // Default to binance if not found
      // Add referral link if user is logged in (assuming 'user' has 'referralLink')
      referralLink: user?.referralLink || null,
      // Add a type indicator for the modal to know which component to render
      shareType: 'proof',
    };
    setSelectedProofData(proofWithAccount); // Set the data needed for the shareable component
    setImageDataUrl(null); // Reset previous image if any
    setIsGenerating(true); // Indicate that generation should start once modal opens
    setModalOpen(true); // Open the modal immediately
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProofData(null);
    setImageDataUrl(null);
    setIsGenerating(false);
  };

  return (
    <Stack direction='column' spacing={3}>
      <Typography variant='h6'>Proof of Volume</Typography>
      {!isPreviewOnly && (
        <Stack alignItems='center' direction='row' justifyContent='space-between'>
          <TraderIdAutocomplete
            accounts={accounts}
            value={traderIdFilter}
            onChange={(event, newValue) => {
              setTraderIdFilter(newValue || '');
            }}
            onInputChange={(event, newInputValue) => {
              setTraderIdFilter(newInputValue);
            }}
          />
          <Tooltip title={`Refresh proofs (Auto-refresh in ${formatCountdown()})`}>
            <IconButton
              aria-label='refresh proofs'
              color='primary'
              disabled={loading}
              sx={{ ml: 1 }}
              onClick={handleRefresh}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
      <Paper elevation={0}>
        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <StyledHeaderTableCellWithLine align={column.align} key={column.id} sx={{ width: column.width }}>
                    {column.tooltip ? (
                      <LabelTooltip label={column.label} labelTextVariant='body3' title={column.tooltip} />
                    ) : (
                      <Typography color='text.secondary' variant='body3'>
                        {column.label}
                      </Typography>
                    )}
                  </StyledHeaderTableCellWithLine>
                ))}
              </TableRow>
            </TableHead>
            <TableBody sx={{ overflow: 'auto' }}>
              {loading && (
                <TableRow>
                  <StyledTableCell align='center' colSpan={columns.length}>
                    <Box display='flex' justifyContent='center' width='100%'>
                      <ScaleLoader color={theme.palette.primary.main} />
                    </Box>
                  </StyledTableCell>
                </TableRow>
              )}
              {!loading && filteredProofs.length === 0 && (
                <TableRow>
                  <StyledTableCell align='center' colSpan={columns.length}>
                    No proofs found
                  </StyledTableCell>
                </TableRow>
              )}
              {!loading &&
                filteredProofs.length > 0 &&
                filteredProofs.map((proof) => (
                  <ProofRow key={`${proof.traderId}-${proof.epoch}`} proof={proof} onShareClick={handleShareClick} />
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {isPreviewOnly ? (
          <Box sx={{ flexShrink: 0, mt: 2 }}>
            <Button
              sx={{
                width: '100%',
                height: '50px',
                border: 0,
                color: theme.palette.text.offWhite,
                borderColor: theme.palette.text.offWhite,
              }}
              variant='outlined'
              onClick={() => navigate(`/explorer/proofs${traderIdFilter ? `?traderId=${traderIdFilter}` : ''}`)}
            >
              View all proofs
            </Button>
          </Box>
        ) : (
          <TablePagination
            component='div'
            count={-1}
            page={page}
            rowsPerPage={pageSize}
            rowsPerPageOptions={[PAGINATION_CONFIG.PREVIEW_ROWS]}
            sx={{ flexShrink: 0 }}
            onPageChange={handlePageChange}
          />
        )}
      </Paper>
      {/* Modal for displaying the generated image */}
      <ShareableImageModal
        accounts={accounts}
        imageDataUrl={imageDataUrl} // Still needed to display the generated image
        isGenerating={isGenerating} // Let the modal know if generation is in progress
        open={modalOpen}
        setImageDataUrl={setImageDataUrl} // Allow modal to set the image URL
        setIsGenerating={setIsGenerating} // Allow modal to reset generating state
        shareableRef={shareableImageRef} // Pass the ref here
        shareData={selectedProofData} // Pass the proof data (includes shareType)
        showAlert={showAlert} // Pass showAlert for error handling within the modal
        onClose={handleCloseModal}
      />
    </Stack>
  );
}

const TRADER_PROOFS_PAGE_SIZE = 25;

export function TraderProofsTable({ proofs }) {
  const { accounts } = useContext(AccountsContext);
  const { showAlert } = useContext(ErrorContext);
  const { user } = useUserMetadata();

  // Pagination state
  const [page, setPage] = useState(0);

  // State for shareable image generation
  const [modalOpen, setModalOpen] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [selectedProofData, setSelectedProofData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const shareableImageRef = useRef(null);

  const handleShareClick = (proof) => {
    // Add the account name and exchange to the proof data if available
    const account = accounts.find((acc) => acc.traderId === proof.traderId);
    const proofWithAccount = {
      ...proof,
      accountName: account ? account.name : 'Unknown Account',
      // Add exchange information for the logo
      accountExchange: account ? account.exchange : 'binance', // Default to binance if not found
      // Add referral link if user is logged in (assuming 'user' has 'referralLink')
      referralLink: user?.referralLink || null,
      // Add a type indicator for the modal to know which component to render
      shareType: 'proof',
    };
    setSelectedProofData(proofWithAccount); // Set the data needed for the shareable component
    setImageDataUrl(null); // Reset previous image if any
    setIsGenerating(true); // Indicate that generation should start once modal opens
    setModalOpen(true); // Open the modal immediately
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProofData(null);
    setImageDataUrl(null);
    setIsGenerating(false);
  };

  const groupedProofs = groupProofsByEpoch(proofs);

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Calculate paginated data
  const paginatedProofs = groupedProofs.slice(
    page * TRADER_PROOFS_PAGE_SIZE,
    page * TRADER_PROOFS_PAGE_SIZE + TRADER_PROOFS_PAGE_SIZE
  );

  return (
    <Stack direction='column' spacing={3}>
      <Paper elevation={0}>
        <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <StyledHeaderTableCellWithLine align={column.align} key={column.id} sx={{ width: column.width }}>
                    {column.tooltip ? (
                      <LabelTooltip label={column.label} labelTextVariant='body3' title={column.tooltip} />
                    ) : (
                      <Typography color='text.secondary' variant='body3'>
                        {column.label}
                      </Typography>
                    )}
                  </StyledHeaderTableCellWithLine>
                ))}
              </TableRow>
            </TableHead>
            <TableBody sx={{ overflow: 'auto' }}>
              {groupedProofs.length === 0 && (
                <TableRow>
                  <StyledTableCell align='center' colSpan={columns.length}>
                    No proofs found
                  </StyledTableCell>
                </TableRow>
              )}
              {groupedProofs.length > 0 &&
                paginatedProofs.map((proof) => (
                  <ProofRow key={`${proof.traderId}-${proof.epoch}`} proof={proof} onShareClick={handleShareClick} />
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component='div'
          count={groupedProofs.length}
          page={page}
          rowsPerPage={TRADER_PROOFS_PAGE_SIZE}
          rowsPerPageOptions={[]}
          onPageChange={handleChangePage}
        />
      </Paper>
      {/* Modal for displaying the generated image */}
      <ShareableImageModal
        accounts={accounts}
        imageDataUrl={imageDataUrl} // Still needed to display the generated image
        isGenerating={isGenerating} // Let the modal know if generation is in progress
        open={modalOpen}
        setImageDataUrl={setImageDataUrl} // Allow modal to set the image URL
        setIsGenerating={setIsGenerating} // Allow modal to reset generating state
        shareableRef={shareableImageRef} // Pass the ref here
        shareData={selectedProofData} // Pass the proof data (includes shareType)
        showAlert={showAlert} // Pass showAlert for error handling within the modal
        onClose={handleCloseModal}
      />
    </Stack>
  );
}
