import { AccountsProvider } from '@/shared/context/AccountsProvider';
import arweaveLight from '@images/logos/arweave-light.png';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Typography } from '@mui/material';
import Divider from '@mui/material/Divider';
import { Stack } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import ExplorerTradesTable from './ExplorerTradesTable';

/**
 * Page component for displaying tokenized trades
 */
export default function ExplorerTradesPage() {
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
        <Button startIcon={<ArrowBackIcon />} sx={{ mb: 4 }} onClick={() => navigate('/explorer')}>
          Back to Explorer
        </Button>
        <Stack alignItems='center' direction='row' spacing={2} style={{ flexShrink: 0 }}>
          <img alt='Arweave Logo Light' src={arweaveLight} style={{ height: '3rem' }} />
          <Typography fontFamily='Jost' fontSize={32} fontWeight={400} variant='h2'>
            Tokenized Trades
          </Typography>
        </Stack>
        <Typography sx={{ mt: 3 }} variant='subtitle1'>
          Trades are securely stored on Arweave for permanent and transparent record-keeping.
        </Typography>
        <Divider sx={{ mt: 4 }} />
      </Box>
      <AccountsProvider>
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ExplorerTradesTable isPreviewOnly={false} />
        </Box>
      </AccountsProvider>
    </Box>
  );
}
