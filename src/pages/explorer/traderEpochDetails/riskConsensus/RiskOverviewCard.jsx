import { Box, Card, Typography, Stack } from '@mui/material';
import { CopyableValue } from '@/shared/components/CopyableValue';
import ProofLogoImg from '@/pages/explorer/proofUtils/ProofLogoImg';

/**
 * Risk Overview Card component that displays metric details
 * based on the Figma design
 *
 * @param {Object} props - Component properties
 * @param {string} props.metricValue - The value of the metric to display
 * @param {string} props.metricName - The name of the metric
 * @returns {React.ReactElement} The Risk Overview Card component
 */
export default function RiskOverviewCard({ metricValue = '20,000 USDT', metricName = 'Volume' }) {
  return (
    <Box sx={{ width: '100%' }}>
      <Card
        sx={{
          borderRadius: '8px',
          p: '20px 24px',
          mb: 3,
        }}
      >
        <Stack spacing={2.5}>
          {/* Title section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ProofLogoImg height='24px' variant='primary' />
            <Typography variant='h6'>Metric Details</Typography>
          </Box>

          {/* Metric details section */}
          <Box>
            <Stack alignItems='center' direction='row' spacing={2}>
              <Box width='280px'>
                <Typography color='text.secondary' variant='body1'>
                  {metricName}
                </Typography>
              </Box>
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CopyableValue displayValue={metricValue} value={metricValue} />
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Card>
    </Box>
  );
}
