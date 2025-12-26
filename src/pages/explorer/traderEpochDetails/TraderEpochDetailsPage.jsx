import { AccountsProvider } from '@/shared/context/AccountsProvider';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { Box, Stack, Typography, Paper, Grid, Divider } from '@mui/material';
import { CopyableValue } from '@/shared/components/CopyableValue';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DataComponent from '@/shared/DataComponent';
import ICONS from '@images/exchange_icons';
import { getEpochStartAndEnd } from '../utils/epoch';
import TraderEpochDetailsTable, { TraderEpochDetailsTableSkeleton } from './TraderEpochDetailsTable';
import { fetchGraphQLRecordsByEpoch } from '../proofUtils/ProofGraphQL';
import { fetchDataRecord, fetchRiskRecord } from '../proofUtils/ProofFetchers';
import { selectConfig } from '../utils/chainConfig';
import { insertEllipsis } from '../insertEllipsis';

/**
 * Page component for displaying trader epoch details
 */
export default function TraderEpochDetailsPage() {
  const { showAlert } = useContext(ErrorContext);
  const { traderId, epoch } = useParams();
  const [events, setEvents] = useState({});
  const [loading, setLoading] = useState(true);

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
      return;
    }

    async function loadEvents() {
      try {
        setLoading(true);
        const { attestedDataEvents, attestedRiskEvents, consensusDataEvents, consensusRiskEvents } =
          await fetchGraphQLRecordsByEpoch(epoch, traderId);

        const cidsByParameterId = {};
        attestedDataEvents.forEach((event) => {
          const { parameterId, data } = event;
          const { cid } = data;

          if (cid && !(parameterId in cidsByParameterId)) {
            cidsByParameterId[parameterId] = cid;
          }
        });

        const config = await selectConfig();
        const riskParameterIds = [0, 2, 3, 4];
        const riskConsensusEntries = await Promise.all(
          riskParameterIds.map(async (parameterId) => [
            parameterId,
            await fetchRiskRecord(config, traderId, epoch, parameterId),
          ])
        );
        const riskConsensus = Object.fromEntries(riskConsensusEntries);

        const parameterIds = [0, 1, 2];
        const dataConsensusEntries = await Promise.all(
          parameterIds.map(async (parameterId) => [
            parameterId,
            await fetchDataRecord(config, traderId, epoch, parameterId),
          ])
        );
        const dataConsensus = Object.fromEntries(dataConsensusEntries);

        setEvents({
          attestedDataEvents,
          attestedRiskEvents,
          consensusDataEvents,
          consensusRiskEvents,
          cidsByParameterId,
          riskConsensus,
          dataConsensus,
        });
      } catch (error) {
        showAlert({
          severity: 'error',
          message: `Error fetching events: ${error.message}`,
        });
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [traderId, epoch]);

  const [epochStart, _] = getEpochStartAndEnd(Number(epoch));

  const formatEpochTime = (epochNumber) => {
    const m = moment.unix(epochNumber).utc();
    return `${m.format('YYYY-MM-DD HH:mm:ss')} UTC`;
  };

  return (
    <Stack direction='column' spacing={0} sx={{ width: '80%', margin: '0 auto', pt: 4 }}>
      <Stack direction='column' spacing={2}>
        <Box sx={{ pb: 4 }}>
          <Stack alignItems='center' direction='row' spacing={2}>
            <img alt='Tread' src={ICONS.tread} style={{ height: '32px' }} />
            <Typography variant='h2'>vCeFi Epoch Details</Typography>
          </Stack>
        </Box>
      </Stack>

      <Paper elevation={0} sx={{ px: 8, py: 4, mb: 4 }}>
        <Stack spacing={0}>
          <Grid container sx={{ py: 2 }}>
            <Grid item xs={3}>
              <Typography color='text.secondary' variant='body1'>
                Epoch
              </Typography>
            </Grid>
            <Grid item xs={9}>
              <Typography variant='body1'>#{epoch}</Typography>
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
                Trader ID
              </Typography>
            </Grid>
            <Grid item xs={9}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CopyableValue displayValue={`${traderId}`} value={`${traderId}`} />
              </Box>
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
                Timestamp
              </Typography>
            </Grid>
            <Grid item xs={9}>
              <Typography variant='body1'>
                {moment.unix(epochStart).fromNow()} ({formatEpochTime(epochStart)})
              </Typography>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <DataComponent isLoading={loading} loadingComponent={<TraderEpochDetailsTableSkeleton />}>
        <AccountsProvider>
          <TraderEpochDetailsTable epoch={epoch} events={events} traderId={traderId} />
        </AccountsProvider>
      </DataComponent>
    </Stack>
  );
}
