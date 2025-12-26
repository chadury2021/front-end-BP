import React, { useState } from 'react';
import moment from 'moment';
import ConsensusChip from '@/shared/components/ConsensusChip';
import { CopyableValue } from '@/shared/components/CopyableValue';
import { Alert, Box, Button, Stack, Collapse, Grid, Typography, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { aggregateDataConsensus } from '../proofUtils/useDataConsensus';
import AttestationDetailRow from './components/AttestationDetailRow';
import ConsensusTable from './components/TraderEpochConsensusTable';

/**
 * Component that displays data attestation events for a specific trader epoch.
 * Shows details like merkle hash, CID, block number, transaction hash and attester address.
 * Aggregates data from multiple transactions to determine consensus.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.traderId] - Optional trader ID to use for navigation
 * @param {string|number} [props.epoch] - Optional epoch to use for navigation
 * @param {Array<string>} props.dataEvents - Array of data events
 * @param {Array<string>} props.dataConsensus - Array of data consensus events
 * @returns {React.ReactElement} Data attestation section
 */
export default function DataEventSection({ traderId, epoch, dataEvents, dataConsensus }) {
  const aggregatedConsensus = aggregateDataConsensus(dataEvents, dataConsensus);
  const [isTableExpanded, setIsTableExpanded] = useState(false);

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

  const handleMatchedClick = (event) => {
    setIsTableExpanded(!isTableExpanded);
  };

  const renderContent = () => {
    if (!dataEvents || dataEvents.length === 0) {
      return <Alert severity='info'>No data attestation data found.</Alert>;
    }

    // Determine consensus status
    const hasConsensus = dataConsensus?.hasConsensus || false; // todo
    const matchedCount = aggregatedConsensus?.count || 0;
    const totalCount = aggregatedConsensus?.total || 0;

    let merkleRoot = aggregatedConsensus?.merkleRoot;
    if (merkleRoot && merkleRoot.startsWith('0x')) {
      const formattedRoot = merkleRoot.toLowerCase();
      merkleRoot = formattedRoot;
    }

    // Ensure we have a string
    merkleRoot = String(merkleRoot || 'No merkle root available');

    const ConsensusComponent = (
      <Box>
        <Stack alignItems='center' direction='row' spacing={2}>
          <ConsensusChip hasConsensus={hasConsensus} />
          <Button
            endIcon={isTableExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            size='small'
            sx={{
              padding: '0',
              minWidth: 'auto',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'transparent',
                textDecoration: 'underline',
              },
            }}
            variant='text'
            onClick={handleMatchedClick}
          >
            {matchedCount}/{totalCount} Validators
          </Button>
        </Stack>
      </Box>
    );

    return (
      <Box>
        <Stack direction='column' spacing={2}>
          <Grid container sx={{ py: 2 }}>
            <Grid item xs={3}>
              <Typography color='text.secondary' variant='body1'>
                Merkle Root
              </Typography>
            </Grid>
            <Grid item xs={9}>
              <CopyableValue value={merkleRoot} />
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={3} />
            <Grid item xs={9}>
              <Divider />
            </Grid>
          </Grid>

          <Grid container sx={{ py: 2 }}>
            <Grid item xs={3}>
              <Typography color='text.secondary' variant='body1'>
                Status
              </Typography>
            </Grid>
            <Grid item xs={9}>
              {ConsensusComponent}
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={3} />
            <Grid item xs={9}>
              <Divider />
            </Grid>
          </Grid>

          <Collapse in={isTableExpanded} timeout='auto'>
            <ConsensusTable data={tableData} eventType='data' traderId={traderId} />
          </Collapse>
        </Stack>
      </Box>
    );
  };

  return renderContent();
}
