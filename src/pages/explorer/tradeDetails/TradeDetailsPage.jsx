import { AccountsProvider } from '@/shared/context/AccountsProvider';
import arweaveLight from '@images/logos/arweave-light.png';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TradeDetailsTable from './TradeDetailsTable';

export default function TradeDetailsPage() {
  const navigate = useNavigate();

  return (
    <Box
      spacing={2}
      sx={{
        height: '95vh',
        width: '80%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box spacing={2} sx={{ padding: '2rem 0', flexShrink: 0 }}>
        <Button startIcon={<ArrowBackIcon />} sx={{ mb: 4 }} onClick={() => navigate('/explorer/trades')}>
          Back to Trades
        </Button>
        <Stack alignItems='center' direction='row' spacing={2} style={{ flexShrink: 0 }}>
          <img alt='Arweave Logo Light' src={arweaveLight} style={{ height: '3rem' }} />
          <Typography fontFamily='Jost' fontSize={32} fontWeight={400} variant='h2'>
            Trade Details
          </Typography>
        </Stack>
        <Typography sx={{ mt: 3 }} variant='subtitle1'>
          Detailed view of the tokenized trade record stored on Arweave.
        </Typography>
        <Divider sx={{ mt: 4 }} />
      </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AccountsProvider>
          <TradeDetailsTable />
        </AccountsProvider>
      </Box>
    </Box>
  );
}
