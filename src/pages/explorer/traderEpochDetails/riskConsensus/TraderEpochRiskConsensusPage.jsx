import ProofLogoImg from '@/pages/explorer/proofUtils/ProofLogoImg';
import { CopyableValue } from '@/shared/components/CopyableValue';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { Loader } from '@/shared/Loader';
import { Box, Breadcrumbs, Link, Stack, Typography } from '@mui/material';
import moment from 'moment';
import { useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { insertEllipsis } from '../../insertEllipsis';
import { useProofsCache } from '../../proofUtils/useProofsCache';
import { getEpochStartAndEnd } from '../../utils/epoch';
import { useChainConfig } from '../../utils/useChainConfig';
import RiskConsensusTable from './RiskConsensusTable';
import RiskOverviewCard from './RiskOverviewCard';

/**
 * Page component for displaying trader epoch risk consensus details
 */
export default function TraderEpochRiskConsensusPage() {
  const navigate = useNavigate();
  const { showAlert } = useContext(ErrorContext);
  const { traderId, epoch } = useParams();
  const { proofs } = useProofsCache();
  const { isDev } = useUserMetadata();
  const { config, loading: configLoading } = useChainConfig(isDev);

  useEffect(() => {
    if (!traderId || !epoch) {
      showAlert({
        severity: 'error',
        message: 'Invalid trader ID or epoch',
      });
      return;
    }

    // Validate epoch is a number
    if (Number.isNaN(Number(epoch))) {
      showAlert({
        severity: 'error',
        message: 'Invalid epoch - must be a number',
      });
    }
  }, [traderId, epoch, showAlert, navigate]);

  const [epochStart, epochEnd] = getEpochStartAndEnd(Number(epoch));
  const epochStr = Number(epoch).toLocaleString();

  const formatEpochTime = (epochNumber) => {
    const m = moment.unix(epochNumber).utc();
    return `${m.format('YYYY-MM-DD, HH:mm:ss')} UTC`;
  };

  if (configLoading) {
    return <Loader />;
  }

  return (
    <Stack direction='column' spacing={0} sx={{ width: '80%', margin: '0 auto' }}>
      <Stack direction='column' spacing={2}>
        <Box sx={{ py: 4 }}>
          <Breadcrumbs aria-label='breadcrumb'>
            <Link
              color='inherit'
              component='button'
              href='/explorer'
              underline='hover'
              onClick={(e) => {
                e.preventDefault();
                navigate('/explorer');
              }}
            >
              Trade Explorer
            </Link>
            <Link
              color='inherit'
              href={`/explorer/trader-epoch/${traderId}/${epoch}`}
              underline='hover'
              onClick={(e) => {
                e.preventDefault();
                navigate(`/explorer/trader-epoch/${traderId}/${epoch}`);
              }}
            >
              {epochStr}
            </Link>
            <Typography color='text.primary'>Aggregated Metrics Consensus</Typography>
          </Breadcrumbs>
        </Box>
        <Box sx={{ pb: 4 }}>
          <Typography variant='h2'>Aggregated Metrics Consensus</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Typography color='text.secondary' sx={{ mr: 1 }} variant='body1'>
              Trader ID:
            </Typography>
            <CopyableValue
              displayValue={`0x${insertEllipsis(traderId, 6, 4, true)}`}
              value={`0x${insertEllipsis(traderId, 6, 4, true)}`}
            />
          </Box>
          <Stack direction='row' spacing={4} sx={{ mt: 1 }}>
            <Typography color='text.secondary' variant='body1'>
              Epoch started {formatEpochTime(epochStart)} ({moment.unix(epochStart).fromNow()})
            </Typography>
          </Stack>
        </Box>
      </Stack>

      <RiskOverviewCard metricName='Volume' metricValue='20,000 USDT' />

      <RiskConsensusTable config={config} epoch={epoch} traderId={traderId} />
    </Stack>
  );
}
