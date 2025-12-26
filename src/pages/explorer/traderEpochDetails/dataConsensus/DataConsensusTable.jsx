import ConsensusDetailChip from '@/shared/components/ConsensusDetailChip';
import { CopyableValue } from '@/shared/components/CopyableValue';
import PrettyRelativeTimestamp from '@/shared/components/PrettyRelativeTimestamp';
import { AccountsContext } from '@/shared/context/AccountsProvider';
import { matchesTraderId } from '@/shared/cryptoUtil';
import { StyledTableCell } from '@/shared/orderTable/util';
import { useTheme } from '@emotion/react';
import ICONS from '@images/exchange_icons';
import { Alert, Box, Button, Link, Paper, Stack, TableRow, Typography } from '@mui/material';
import moment from 'moment';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import ProofLogoImg from '@/pages/explorer/proofUtils/ProofLogoImg';
import { ARWEAVE_BASE_URL } from '@/apiServices';
import { insertEllipsis } from '../../insertEllipsis';
import useDataConsensus from '../../proofUtils/useDataConsensus';
import { useProofsCache } from '../../proofUtils/useProofsCache';
import { useTradeBlobsPagination } from '../../tradeUtils/useTradesPagination';
import ConsensusTable, { createSkeletonRowRenderer } from '../components/TraderEpochConsensusTable';
import TradeBlobSelector from '../TradeBlobSelector';
import TradeHistoryTable from '../TradeHistoryTable';

/**
 * Optimized Data Consensus Table Component with improved loading
 *
 * @param {Object} props - Component props
 * @param {string} props.traderId - Trader ID
 * @param {string|number} props.epoch - Epoch number
 * @param {Object} props.config - Configuration object for blockchain connection
 * @returns {React.ReactElement} Data consensus table
 */
export default function DataConsensusTable({ traderId, epoch, config }) {
  const [consensusData, setConsensusData] = useState([]);
  const { proofs } = useProofsCache();
  const [txHashes, setTxHashes] = useState([]);
  const theme = useTheme();
  const { accounts } = useContext(AccountsContext);
  const [selectedTradeIndex, setSelectedTradeIndex] = useState(0);
  const navigate = useNavigate();

  // Find transaction hashes for this trader and epoch
  useEffect(() => {
    const proofDetails = proofs.find((p) => p.traderId === traderId && Number(p.epoch) === Number(epoch));

    if (proofDetails && proofDetails.dataEvents) {
      const hashes = proofDetails.dataEvents.map((e) => e.transactionHash) || [];
      setTxHashes(hashes);
    } else {
      setTxHashes([]);
    }
  }, [traderId, epoch, proofs]);

  // Use the data consensus hook to fetch data
  const { dataEvents, dataConsensus, loading: isLoading, error } = useDataConsensus(txHashes, config);

  // Fetch trade data using the pagination hook
  const {
    trades,
    loading: tradesLoading,
    error: tradesError,
    retryFetch: fetchTrades,
  } = useTradeBlobsPagination({
    traderId,
    epoch,
    // Not specifying pageSize to fetch all trades for this trader-epoch pair
  });

  // Check if user is authorized to view the trade data
  const isAuthorized = useMemo(
    () => accounts?.some((acc) => matchesTraderId(acc.hashed_api_key, traderId)),
    [accounts, traderId]
  );

  // Handle trade selection change
  const handleTradeSelectionChange = (event) => {
    setSelectedTradeIndex(event.target.value);
  };

  // Get the selected trade blob
  const selectedTradeBlob = useMemo(() => {
    if (!trades || trades.length === 0) return null;
    return trades[selectedTradeIndex];
  }, [trades, selectedTradeIndex]);

  // Transform data events into table rows
  useEffect(() => {
    if (!dataEvents || dataEvents.length === 0) {
      setConsensusData([]);
      return;
    }

    // Map data events to table rows
    const tableData = dataEvents.map((event, index) => {
      // Determine status based on event data
      let status = 'Proposed';
      if (event.skipped) {
        status = 'Skipped';
      } else if (dataConsensus?.hasConsensus && event.data?.merkleRoot === dataConsensus.record?.merkleRoot) {
        status = 'Confirmed';
      }

      // Store full attester address for copying
      const fullAttester = event.attester || 'N/A';
      const shortAttester = event.attester ? `${event.attester.slice(0, 6)}...${event.attester.slice(-4)}` : 'N/A';

      return {
        epoch: Number(event.epoch || epoch),
        status,
        attester: shortAttester,
        fullAttester,
        cid: event.data?.cid || '-',
        merkleRoot: event.data?.merkleRoot || '-',
        timestamp: event.timestamp || moment().unix(),
        txHash: event.transactionHash,
        index, // Add index for key generation
      };
    });

    setConsensusData(tableData);
  }, [dataEvents, dataConsensus, epoch]);

  return (
    <Stack spacing={4} sx={{ width: '100%' }}>
      <ConsensusTable
        data={consensusData}
        emptyMessage='No consensus data available for this epoch'
        error={error ? `Error loading data consensus information: ${error}` : null}
        loading={isLoading}
      />

      {/* Trade History Section */}
      <Paper elevation={0} sx={{ mb: 4 }}>
        <Box sx={{ px: 8, py: 6 }}>
          {/* Title and Trade Selection in the same row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 3,
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ mr: 5 }} variant='h5'>
                Tokenized Metrics
              </Typography>

              {tradesError && (
                <Alert severity='error' sx={{ ml: 2 }}>
                  Error loading trades: {tradesError.message}
                  <Button color='inherit' size='small' sx={{ ml: 2 }} onClick={fetchTrades}>
                    Retry
                  </Button>
                </Alert>
              )}
            </Box>
          </Box>

          <TradeHistoryTable
            hideTitle
            error={tradesError}
            isAuthorized={isAuthorized}
            loading={tradesLoading}
            retryFetch={fetchTrades}
            tradeBlob={selectedTradeBlob}
          />
        </Box>
      </Paper>
    </Stack>
  );
}
