import { Alert, Divider, Paper, Box, Stack, Typography, Chip } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import RiskEventsSection from './RiskEventsSection';

export default function AggregatedMetricsCard({ traderId, epoch, riskEvents, riskConsensus }) {
  if (riskEvents.length === 0) {
    return <Alert severity='error'>Failed to load consensus information. Please try again later.</Alert>;
  }

  const ComingSoonChip = (
    <Chip
      label='Coming Soon'
      sx={{
        backgroundColor: 'button.grey',
        color: 'text.disabled',
        fontWeight: 'medium',
        px: 1,
      }}
    />
  );

  return (
    <Paper elevation={0} sx={{ px: 8, py: 6, mb: 4 }}>
      <Stack spacing={2}>
        <RiskEventsSection epoch={epoch} riskConsensus={riskConsensus} riskEvents={riskEvents} traderId={traderId} />
      </Stack>
    </Paper>
  );
}
