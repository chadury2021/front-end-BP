import React, { useState } from 'react';
import ConsensusChip from '@/shared/components/ConsensusChip';
import { Alert, Box, Button, Collapse, Divider, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import moment from 'moment';
import { aggregateRiskConsensus } from '../proofUtils/useRiskConsensus';
import ConsensusTable from './components/TraderEpochConsensusTable';

/**
 * Component that displays a simplified view of risk consensus for a parameter
 * @param {Object} props - Component props
 * @param {Array<Object>} props.riskEvents - Risk events for this parameter
 * @param {Array<Object>} props.riskConsensus - Risk consensus for this parameter
 * @param {string} props.traderId - Trader ID for navigation
 * @param {string|number} props.epoch - Epoch number for navigation
 * @returns {React.ReactElement} Simplified risk consensus view
 */
function ParameterConsensusView({ title, riskEvents, riskConsensus, traderId, epoch }) {
  const aggregatedConsensus = aggregateRiskConsensus(riskEvents, riskConsensus);
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const handleMatchedClick = (event) => {
    setIsTableExpanded(!isTableExpanded);
  };

  const tableData = riskEvents.map((event, index) => {
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
      parameterId: event.parameterId,
      parameterName: `Parameter ${event.parameterId}`,
      status,
      attester: shortAttester,
      fullAttester,
      value: event.data,
      timestamp: event.timestamp || moment().unix(),
      txHash: event.transactionHash,
      index, // Add index for key generation
    };
  });

  const hasConsensus = riskConsensus?.hasConsensus || false; // todo
  const value = aggregatedConsensus?.value?.toLocaleString() || 'Unknown';
  const matchedCount = aggregatedConsensus?.count || 0;
  const totalCount = aggregatedConsensus?.total || 0;

  const consensusContent = (
    <Box>
      <Stack alignItems='center' direction='row' spacing={2}>
        <ConsensusChip hasConsensus={hasConsensus} />
        <Button
          endIcon={isTableExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          size='small'
          sx={{
            color: 'primary.main',
            minWidth: 'auto',
            padding: '0',
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
    <Grid container alignItems='center' spacing={2} sx={{ py: 2 }}>
      <Grid item xs={3}>
        <Typography color='text.secondary' variant='body1'>
          {title}
        </Typography>
      </Grid>
      <Grid item xs={9}>
        {!riskEvents || riskEvents.length === 0 ? (
          <Alert severity='info'>No risk attestation data found.</Alert>
        ) : (
          <Stack alignItems='center' direction='row' spacing={2}>
            <Typography>{`${value} USDT`}</Typography>
            {consensusContent}
          </Stack>
        )}
      </Grid>
      <Grid item xs={12}>
        <Collapse in={isTableExpanded} timeout='auto'>
          <ConsensusTable data={tableData} eventType='risk' traderId={traderId} />
        </Collapse>
      </Grid>
      <Grid item xs={3} />
      <Grid item xs={9}>
        <Divider />
      </Grid>
    </Grid>
  );
}

/**
 * Component that displays risk attestation events grouped by parameter
 */
export default function RiskEventsSection({ config, riskEvents, riskConsensus, traderId, epoch }) {
  const parameters = { 0: 'Volume', 2: 'Total Equity', 3: 'Unrealized PnL', 4: 'Notional Exposure' };

  return (
    <Box>
      {Object.keys(parameters).map((pid) => {
        const events = riskEvents.filter((event) => event.parameterId === Number(pid));

        return (
          <ParameterConsensusView
            config={config}
            epoch={epoch}
            key={pid}
            riskConsensus={riskConsensus[pid]}
            riskEvents={events}
            title={parameters[pid]}
            traderId={traderId}
          />
        );
      })}
    </Box>
  );
}
