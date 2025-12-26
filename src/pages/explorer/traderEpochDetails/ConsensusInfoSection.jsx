import { Paper, Box, Typography } from '@mui/material';
import DataEventSection from './DataEventSection';

/**
 * Component that displays consensus information for a specific trader epoch.
 * Shows details like data consensus and risk attestations.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.traderId - Trader ID
 * @param {string} props.epoch - Epoch
 * @param {Array<string>} props.attestedDataEvents - Attested data events
 * @param {Array<string>} props.consensusDataEvents - Consensus data events
 * @returns {React.ReactElement} Consensus information section
 */
export default function ConsensusInfoSection({ title, traderId, epoch, attestedDataEvents, dataConsensus }) {
  return (
    <Box sx={{ px: 0, py: 1 }}>
      <Typography sx={{ mb: 2 }} variant='h5'>
        {title}
      </Typography>
      <DataEventSection
        dataConsensus={dataConsensus}
        dataEvents={attestedDataEvents}
        epoch={epoch}
        traderId={traderId}
      />
    </Box>
  );
}
