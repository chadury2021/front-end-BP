import { AccountsProvider } from '@/shared/context/AccountsProvider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Typography } from '@mui/material';
import Divider from '@mui/material/Divider';
import { Stack } from '@mui/system';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ExplorerProofsTable from './ExplorerProofsTable';
import ProofLogoImg from './proofUtils/ProofLogoImg';

/**
 * Page component for displaying proof events
 */
export default function ExplorerProofsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const traderId = searchParams.get('traderId');

  return (
    <Box
      spacing={2}
      sx={{
        height: '100%',
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
          <ExplorerProofsTable isPreviewOnly={false} selectedAccounts={traderId} />
        </Box>
      </AccountsProvider>
    </Box>
  );
}
