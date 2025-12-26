import ConsensusDetailChip from '@/shared/components/ConsensusDetailChip';
import { CopyableValue } from '@/shared/components/CopyableValue';
import PrettyRelativeTimestamp from '@/shared/components/PrettyRelativeTimestamp';
import { StyledTableCell } from '@/shared/orderTable/util';
import { useTheme } from '@emotion/react';
import ICONS from '@images/exchange_icons';
import monadLight from '@images/logos/monad-light.png';
import { Box, Button, Link, Stack, TableRow, Typography } from '@mui/material';
import moment from 'moment';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MONAD_BASE_URL } from '@/apiServices';
import { useProofsCache } from '../../proofUtils/useProofsCache';
import useRiskConsensus from '../../proofUtils/useRiskConsensus';
import ConsensusTable, { createSkeletonRowRenderer } from '../components/TraderEpochConsensusTable';

// Define columns with tooltips
const columns = [
  {
    id: 'epoch',
    label: (
      <Stack alignItems='center' direction='row' gap={1}>
        <img alt='Tread' src={ICONS.tread} style={{ height: '16px', marginRight: '4px' }} />
        Block
      </Stack>
    ),
    // tooltip: 'Click on an epoch to view detailed information',
    width: '8%',
    align: 'left',
  },
  {
    id: 'parameter',
    label: 'Parameter',
    tooltip: 'Risk parameter being attested to',
    width: '12%',
    align: 'left',
  },
  {
    id: 'status',
    label: 'Status',
    width: '10%',
    align: 'left',
  },
  {
    id: 'attester',
    label: 'Attester',
    width: '12%',
    align: 'left',
  },
  {
    id: 'value',
    label: 'Value',
    tooltip: 'Risk value attested by the validators',
    width: '15%',
    align: 'left',
  },
  {
    id: 'timestamp',
    label: 'Timestamp',
    width: '15%',
    align: 'left',
  },
  {
    id: 'actions',
    label: 'Actions',
    width: '10%',
    align: 'right',
  },
];

/**
 * Risk Consensus Table Row Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.row - Row data
 * @param {string} props.traderId - Trader ID
 * @returns {React.ReactElement} Risk consensus table row
 */
function RiskConsensusTableRow({ row, traderId }) {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleEpochClick = (e) => {
    e.preventDefault();
    navigate(`/explorer/trader-epoch/${traderId}/${row.epoch}`);
  };

  return (
    <TableRow
      hover
      key={`row-${row.txHash || `index-${row.index}`}`}
      sx={{
        '&:last-child td, &:last-child th': {
          border: 0,
        },
      }}
    >
      <StyledTableCell>
        <Typography
          sx={{
            textAlign: 'left',
            p: 0,
            display: 'inline-block',
          }}
        >
          {row.epoch?.toLocaleString()}
        </Typography>
      </StyledTableCell>
      <StyledTableCell>
        <Typography variant='body2'>{row.parameterName}</Typography>
      </StyledTableCell>
      <StyledTableCell>
        <ConsensusDetailChip status={row.status} variant='status' />
      </StyledTableCell>
      <StyledTableCell>
        <CopyableValue
          displayValue={row.attester}
          value={row.attester.includes('...') ? row.fullAttester : row.attester}
        />
      </StyledTableCell>
      <StyledTableCell>
        <Typography variant='body2'>{row.value !== undefined ? row.value.toLocaleString() : '-'}</Typography>
      </StyledTableCell>
      <StyledTableCell>
        <PrettyRelativeTimestamp timestamp={row.timestamp}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <PrettyRelativeTimestamp.ISO variant='body2' />
            <PrettyRelativeTimestamp.Relative variant='body2' />
          </Box>
        </PrettyRelativeTimestamp>
      </StyledTableCell>
      <StyledTableCell align='right'>
        <Button
          size='small'
          sx={{
            borderRadius: '4px',
            minWidth: 'auto',
            padding: '4px 8px',
            textTransform: 'none',
            borderColor: 'white',
            '&:hover': {
              borderColor: 'white',
            },
          }}
          variant='outlined'
          onClick={() => {
            const url = `${MONAD_BASE_URL}${row.txHash || 'unknown'}`;
            window.open(url, '_blank');
          }}
        >
          <Stack alignItems="center" direction="row" spacing={1}>
            <Typography variant='body1'>Proof</Typography>
            <img alt='Monad Logo' src={monadLight} style={{ height: '16px' }} />
          </Stack>
        </Button>
      </StyledTableCell>
    </TableRow>
  );
}

/**
 * Component to process risk events for a specific parameter
 * This component properly uses the useRiskConsensus hook
 */
function ParameterRiskConsensus({ parameterId, events, config, epoch, onProcessed }) {
  // Use the risk consensus hook to get consensus data for this parameter
  const { riskEvents, riskConsensus, aggregatedConsensus, parameterName, loading, error } = useRiskConsensus({
    config,
    parameterId,
    providedRiskEvents: events,
  });

  // Process events into table rows when data is available
  useEffect(() => {
    if (loading || error) return;

    const tableRows = events.map((event, index) => {
      // Determine status based on event data
      let status = 'Proposed';
      if (event.skipped) {
        status = 'Skipped';
      } else if (riskConsensus?.hasConsensus && event.data === riskConsensus.record?.value) {
        status = 'Confirmed';
      }

      // Store full attester address for copying
      const fullAttester = event.attester || 'N/A';
      const shortAttester = event.attester ? `${event.attester.slice(0, 6)}...${event.attester.slice(-4)}` : 'N/A';

      return {
        epoch: Number(event.epoch || epoch),
        parameterId,
        parameterName: parameterName || `Parameter ${parameterId}`,
        status,
        attester: shortAttester,
        fullAttester,
        value: event.data,
        timestamp: event.timestamp || moment().unix(),
        txHash: event.transactionHash,
        index, // Add index for key generation
      };
    });

    // Call the callback with processed rows
    onProcessed(parameterId, tableRows);
  }, [events, riskConsensus, parameterName, loading, error, parameterId, epoch, onProcessed]);

  // This component doesn't render anything directly
  return null;
}

/**
 * Optimized Risk Consensus Table Component with improved loading
 *
 * @param {Object} props - Component props
 * @param {string} props.traderId - Trader ID
 * @param {string|number} props.epoch - Epoch number
 * @param {Object} props.config - Configuration object for blockchain connection
 * @returns {React.ReactElement} Risk consensus table
 */
export default function RiskConsensusTable({ traderId, epoch, config }) {
  const [consensusData, setConsensusData] = useState([]);
  const { proofs } = useProofsCache();
  const [riskEventsByParameterId, setRiskEventsByParameterId] = useState({});
  const [processedParameters, setProcessedParameters] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Find and group risk events by parameter ID for this trader and epoch
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setProcessedParameters({});

    const proofDetails = proofs.find((p) => p.traderId === traderId && Number(p.epoch) === Number(epoch));

    if (proofDetails && proofDetails.riskEvents) {
      // Group risk events by parameter ID
      const eventsByParameter = proofDetails.riskEvents.reduce((acc, event) => {
        const parameterId = event.parameterId !== undefined ? event.parameterId.toString() : 'unknown';
        if (!acc[parameterId]) {
          acc[parameterId] = [];
        }
        acc[parameterId].push(event);
        return acc;
      }, {});

      setRiskEventsByParameterId(eventsByParameter);
    } else {
      setRiskEventsByParameterId({});
    }

    setIsLoading(false);
  }, [traderId, epoch, proofs]);

  // Handle processed parameter data - memoized to prevent infinite renders
  const handleParameterProcessed = useCallback((parameterId, rows) => {
    setProcessedParameters((prev) => ({
      ...prev,
      [parameterId]: rows,
    }));
  }, []);

  // Combine all processed parameter data into a single table dataset
  useEffect(() => {
    const allRows = Object.values(processedParameters).flat();
    setConsensusData(allRows);
  }, [processedParameters]);

  // Create a row renderer function - memoized to prevent recreation on each render
  const renderRow = useCallback(
    (row) => <RiskConsensusTableRow key={`row-${row.txHash || `index-${row.index}`}`} row={row} traderId={traderId} />,
    [traderId]
  );

  // Create a skeleton row renderer
  const renderSkeletonRow = useMemo(() => createSkeletonRowRenderer(columns), []);

  // Determine if we're still loading parameter data
  const isProcessingParameters =
    Object.keys(riskEventsByParameterId).length > 0 &&
    Object.keys(processedParameters).length < Object.keys(riskEventsByParameterId).length;

  return (
    <>
      {/* Render parameter processors (these don't output any UI) */}
      {Object.entries(riskEventsByParameterId).map(([parameterId, events]) => (
        <ParameterRiskConsensus
          config={config}
          epoch={epoch}
          events={events}
          key={parameterId}
          parameterId={parameterId}
          onProcessed={handleParameterProcessed}
        />
      ))}

      <ConsensusTable
        columns={columns}
        data={consensusData}
        emptyMessage='No risk consensus data available for this epoch'
        error={error ? `Error loading risk consensus information: ${error}` : null}
        loading={isLoading || isProcessingParameters}
        renderRow={renderRow}
        renderSkeletonRow={renderSkeletonRow}
      />
    </>
  );
}
