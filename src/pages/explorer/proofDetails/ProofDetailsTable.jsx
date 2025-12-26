import { useChainConfig } from '@/pages/explorer/utils/useChainConfig';
import { replaceBigInts } from '@/shared/bigIntUtils';
import { AccountsContext } from '@/shared/context/AccountsProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { matchesTraderId } from '@/shared/cryptoUtil';
import DataComponent from '@/shared/DataComponent';
import { Loader } from '@/shared/Loader';
import { Alert, Box, Card, CardContent, Chip, Grid, Link, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { insertEllipsis } from '../insertEllipsis';
import useProofDetails from '../proofUtils/useProofDetails';

function DetailRow({ label, value }) {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={3}>
        <Typography color='textSecondary' variant='subtitle1'>
          {label}:
        </Typography>
      </Grid>
      <Grid item xs={9}>
        <Typography variant='body1'>{value}</Typography>
      </Grid>
    </Grid>
  );
}

/**
 * Formats proof data for DetailRow based on event type
 * @param {Object} proofData - The proof data object containing eventName and data
 * @returns {string|JSX.Element} Formatted string or JSX for displaying the data
 */
const formatDataValue = (proofData) => {
  switch (proofData.eventName) {
    case 'Risk':
      return `Volume: ${proofData.data.toLocaleString()}`;
    case 'Data':
      return (
        <>
          Merkle Hash: {insertEllipsis(proofData.data.merkleRoot, 8, 6)}
          <br />
          CID: {insertEllipsis(proofData.data.cid, 8, 6)}
        </>
      );
    case 'Error':
      return 'Error loading data';
    default:
      return 'Unknown event type';
  }
};

/**
 * Creates a clickable transaction hash link to the explorer
 * @param {string} txHash - The transaction hash to link to
 * @param {string} explorerUrl - Base URL of the blockchain explorer
 * @returns {JSX.Element} Link component with truncated transaction hash
 */
function TransactionHashLink({ txHash, explorerUrl }) {
  return (
    <Link href={`${explorerUrl}/tx/${txHash}`} target='_blank'>
      {insertEllipsis(txHash, 8, 6)}
    </Link>
  );
}

/**
 * Shows a row with a transaction link that you can click
 * @param {string} label - The text shown on the left side
 * @param {string} txHash - The transaction ID to link to
 * @param {string} explorerUrl - The website address where you can view blockchain transactions
 * @returns {JSX.Element} A row showing the label and a clickable transaction link
 */
function TransactionDetailRow({ label, txHash, explorerUrl }) {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={3}>
        <Typography color='textSecondary' variant='subtitle1'>
          {label}:
        </Typography>
      </Grid>
      <Grid item xs={9}>
        <Typography variant='body1'>
          <TransactionHashLink explorerUrl={explorerUrl} txHash={txHash} />
        </Typography>
      </Grid>
    </Grid>
  );
}

/**
 * Displays raw event data in a formatted box with loading and error states
 * @param {Object} props - Component props
 * @param {boolean} props.loading - Whether the data is currently loading
 * @param {Object} props.eventData - The event data to display, containing name and other properties
 * @returns {JSX.Element} Component showing event data in a formatted box
 */
function EventDataDisplay({ loading, eventData }) {
  const theme = useTheme();
  return (
    <DataComponent
      emptyComponent={
        <Alert severity='info' sx={{ mt: 4, mb: 2 }}>
          No event data available for this proof.
        </Alert>
      }
      errorComponent={
        <Alert severity='error' sx={{ mt: 4, mb: 2 }}>
          Failed to load event data. Please try again later.
        </Alert>
      }
      hasError={!eventData && !loading}
      isEmpty={!eventData}
      isLoading={loading}
      loadingComponent={<Loader />}
    >
      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Chip color='primary' label={eventData?.name || 'Unknown Event'} sx={{ borderRadius: 1 }} />
          <Typography variant='h6'>Raw Event Data</Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: 1,
            maxHeight: '300px',
            overflow: 'auto',
            p: 2,
          }}
        >
          <Typography
            component='pre'
            sx={{
              fontFamily: theme.typography.fontFamilyConfig.data, // Use IBM Plex Mono for data
              m: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
            variant='body2'
          >
            {JSON.stringify(replaceBigInts(eventData), null, 2)}
          </Typography>
        </Box>
      </Box>
    </DataComponent>
  );
}

/**
 * Component that displays detailed proof information from the blockchain
 * @param {Object} config - Configuration object for the blockchain connection
 * @param {string} config.rpcUrl - RPC endpoint URL
 * @param {string} config.explorerUrl - Explorer URL
 * @param {string} config.attestationAddress - Contract address to query
 * @param {number} config.numberOfBlocks - Number of blocks to query in each batch
 * @param {number} config.retry - Number of retry attempts
 * @param {number} config.paginationNumber - Pagination offset
 */
function ProofDetailsTable() {
  const { isDev } = useUserMetadata();
  const { id } = useParams();
  const { accounts } = useContext(AccountsContext);
  const { config, loading: configLoading } = useChainConfig(isDev);

  const { proofData, eventData, loading: proofLoading } = useProofDetails(id, config);

  const loading = configLoading || proofLoading;

  if (loading) {
    return <Loader />;
  }

  if (!proofData) {
    return (
      <Typography align='center' variant='h6'>
        Proof not found
      </Typography>
    );
  }

  const isAuthorized = accounts?.some((account) => matchesTraderId(account.hashed_api_key, proofData.traderId));

  return (
    <Box height='100%' sx={{ overflowY: 'auto' }}>
      <Card sx={{ maxWidth: 800, mx: 'auto', height: '100%' }}>
        <CardContent>
          <Typography sx={{ mb: 4 }} variant='h4'>
            Proof Details
          </Typography>

          <TransactionDetailRow
            explorerUrl={config.explorerUrl}
            label='Transaction Hash'
            txHash={proofData.transactionHash || 'N/A'}
          />
          <DetailRow label='Block Number' value={proofData.blockNumber?.toLocaleString() || 'N/A'} />
          <DetailRow label='Epoch' value={proofData.epoch?.toLocaleString() || 'N/A'} />
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <Typography color='textSecondary' variant='subtitle1'>
                Event Type:
              </Typography>
            </Grid>
            <Grid item xs={9}>
              <Chip color={proofData.eventColor} label={proofData.eventName} size='small' />
            </Grid>
          </Grid>
          <DetailRow label='Data' value={formatDataValue(proofData)} />
          <DetailRow label='Trader ID' value={insertEllipsis(proofData.traderId) || 'N/A'} />
          <DetailRow label='Attester' value={insertEllipsis(proofData.attester) || 'N/A'} />

          {/* TODO: Link trade details to the ProofDetailsTable */}
          {!isAuthorized && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity='warning' sx={{ mt: 4, mb: 2 }}>
                You are not authorized to view additional details for this proof. Only the original trader can access
                this information.
              </Alert>
              <Typography variant='subtitle1'>Comparing your trader ID vs original:</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography>Your IDs: {accounts.map((acc) => acc.hashed_api_key).join(', ') || 'None'}</Typography>
                <Typography>Original ID: {proofData.traderId}</Typography>
              </Box>
            </Box>
          )}
          <EventDataDisplay eventData={eventData} loading={loading} />
        </CardContent>
      </Card>
    </Box>
  );
}

export default ProofDetailsTable;
