import { useDecryptTrade } from '@/pages/explorer/tradeUtils/useDecryptTrade';
import { CopyableValue } from '@/shared/components/CopyableValue';
import { AccountsContext } from '@/shared/context/AccountsProvider';
import { useTheme } from '@emotion/react';
import { Alert, Box, Card, CardContent, CardHeader, Grid, Link, Stack, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ScaleLoader from 'react-spinners/ScaleLoader';
import { getArweaveData, getArweaveTransactionRaw } from '../../../apiServices';
import { renderTradeId } from '../utils/tradeId';

// Helper function moved to top
function formatValue(value) {
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
}

/**
 * Component that displays a row of trade metadata
 * Looks like: Label: <Link>Value</Link>
 * @param {string} label - The label to display
 * @param {string} value - The value to display
 * @param {boolean} isLink - Whether the value is a link
 */
function DetailRow({ label, value, isLink }) {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={3}>
        <Typography color='textSecondary' variant='subtitle1'>
          {label}:
        </Typography>
      </Grid>
      <Grid item xs={9}>
        {isLink ? (
          <Typography variant='body1'>
            <Link href={`//arweave.app/tx/${value}`} target='_blank'>
              {formatValue(value)}
            </Link>
          </Typography>
        ) : (
          <Typography variant='body1'>{formatValue(value)}</Typography>
        )}
      </Grid>
    </Grid>
  );
}

function ErrorContent({ error, msg = 'Error when fetching trade data' }) {
  const theme = useTheme();
  return (
    <Alert severity='error' sx={{ mt: 4, mb: 2 }}>
      {msg}
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
          {JSON.stringify(error, null, 2)}
        </Typography>
      </Box>
    </Alert>
  );
}

function UnauthorizedContent({ originalId, actualIds }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Alert severity='warning' sx={{ mt: 4, mb: 2 }}>
        You are not authorized to view the decrypted data for this trade. Only the original trader can decrypt this
        information.
      </Alert>
      <Typography variant='subtitle1'>Comparing your trader ID vs original:</Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <ul>
          <li>
            <Typography>Your IDs: {actualIds.join(', ') || 'None'}</Typography>
          </li>
          <li>
            <Typography>Original ID: {originalId}</Typography>
          </li>
        </ul>
      </Box>
    </Box>
  );
}

// New component to handle decryption
function DecryptedTradeCard({ id, traderId, rawData, accounts }) {
  const theme = useTheme();
  const {
    decryptedData,
    isAuthorized,
    loading: decryptLoading,
    error: decryptError,
    decrypt,
  } = useDecryptTrade(id, traderId, rawData, accounts);

  useEffect(() => {
    decrypt();
  }, [accounts, decrypt]);

  if (decryptLoading) {
    return <ScaleLoader color={theme.palette.text.offWhite} />;
  }

  if (!isAuthorized) {
    return <UnauthorizedContent actualIds={accounts.map((acc) => acc.hashed_api_key)} originalId={traderId} />;
  }

  if (decryptError) {
    return <ErrorContent error={decryptError} msg='Error when decrypting trade data' />;
  }

  if (decryptedData) {
    return (
      <Stack spacing={2}>
        {decryptedData.map((trade, index) => (
          <Card key={trade.trade_id || `trade-${index}`} sx={{ mb: 2 }}>
            <CardHeader
              sx={{
                backgroundColor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
              }}
              title={
                <Box
                  sx={{
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: 1,
                    fontFamily: theme.typography.fontFamilyConfig.data, // Use IBM Plex Mono for data
                    p: 0.5,
                  }}
                >
                  <small>
                    Trade #{index + 1}:{' '}
                    <CopyableValue displayValue={renderTradeId(trade.trade_id)} value={trade.trade_id} />
                  </small>
                </Box>
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item md={6} xs={12}>
                  <Stack spacing={1}>
                    <Box>
                      <Typography color='text.secondary' variant='caption'>
                        Symbol
                      </Typography>
                      <Typography variant='h6'>{trade.symbol || 'N/A'}</Typography>
                    </Box>
                    <Box>
                      <Typography color='text.secondary' variant='caption'>
                        Side
                      </Typography>
                      <Typography color={trade.side === 'Buy' ? 'success.main' : 'error.main'} variant='h6'>
                        {trade.side || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography color='text.secondary' variant='caption'>
                        Price
                      </Typography>
                      <Typography variant='h6'>
                        $
                        {trade.price?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) || 'N/A'}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item md={6} xs={12}>
                  <Stack spacing={1}>
                    <Box>
                      <Typography color='text.secondary' variant='caption'>
                        Amount
                      </Typography>
                      <Typography variant='h6'>{trade.amount?.toLocaleString() || 'N/A'}</Typography>
                    </Box>
                    <Box>
                      <Typography color='text.secondary' variant='caption'>
                        Timestamp
                      </Typography>
                      <Typography variant='h6'>{new Date(trade.timestamp).toLocaleString() || 'N/A'}</Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  }

  return null;
}

function TradeDetailsPage() {
  const theme = useTheme();
  const { id } = useParams();
  // Trade data
  const [tradeLoading, setTradeLoading] = useState(true);
  const [tradeData, setTradeData] = useState(null);
  // Raw data
  const [rawLoading, setRawLoading] = useState(true);
  const [rawData, setRawData] = useState(null);
  // Authorized
  const { accounts } = useContext(AccountsContext);

  // When page first loads, fetch trade data and raw data in parallel
  useEffect(() => {
    const fetchTradeData = async () => {
      setTradeLoading(true);
      try {
        const graphqlResult = await getArweaveData(1, null, { ids: [id] });

        if (!graphqlResult.edges?.length) {
          return;
        }

        const trade = graphqlResult.edges[0].node;
        const tags = trade.tags.reduce((acc, tag) => {
          acc[tag.name] = tag.value;
          return acc;
        }, {});

        const tradeInfo = { ...trade, ...tags };
        setTradeData(tradeInfo);
      } catch (err) {
        console.error('Error loading trade details:', err);
      } finally {
        setTradeLoading(false);
      }
    };

    const fetchRawData = async () => {
      setRawLoading(true);
      try {
        const rawResponse = await getArweaveTransactionRaw(id);
        if (rawResponse?.raw_data) {
          setRawData(rawResponse.raw_data);
        } else {
          throw new Error(`Failed to fetch raw transaction data. Got: ${JSON.stringify(rawResponse)}`);
        }
      } catch (err) {
        console.error('Error loading raw transaction data:', err);
      } finally {
        setRawLoading(false);
      }
    };

    if (id) {
      fetchTradeData();
      fetchRawData();
    }
  }, [id]);

  const renderTradeMetadata = () => {
    if (tradeLoading) {
      return <ScaleLoader color={theme.palette.text.offWhite} />;
    }
    if (!tradeData) {
      return (
        <Typography align='center' variant='h6'>
          Trade not found
        </Typography>
      );
    }
    return (
      <>
        <DetailRow isLink label='Transaction ID' value={tradeData.id} />
        <DetailRow
          label='Exchange'
          value={tradeData.exchange_name.charAt(0).toUpperCase() + tradeData.exchange_name.slice(1)}
        />
        <DetailRow label='Trader ID' value={tradeData.trader_id} />
        <DetailRow label='Epoch' value={tradeData.epoch} />
        <DetailRow label='Merkle Root' value={tradeData.merkle_root} />
      </>
    );
  };

  const renderRawDump = () => {
    if (rawLoading) {
      return <ScaleLoader color={theme.palette.text.offWhite} />;
    }
    if (rawData) {
      return (
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
            {rawData}
          </Typography>
        </Box>
      );
    }
    return (
      <ErrorContent
        error={new Error('Failed to load raw transaction data')}
        msg='Failed to load raw transaction data'
      />
    );
  };

  const renderDecryptedTradeCard = (traderId) => {
    if (tradeLoading || rawLoading) {
      return <ScaleLoader color={theme.palette.text.offWhite} />;
    }

    if (!traderId) {
      return <ErrorContent error={new Error('Failed to load trade data')} />;
    }

    return <DecryptedTradeCard accounts={accounts} id={id} rawData={rawData} traderId={traderId} />;
  };

  return (
    <Card
      sx={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          '&:last-child': { pb: 2 },
        }}
      >
        {renderTradeMetadata()}

        <Typography sx={{ mt: 4, mb: 2 }} variant='h6'>
          Raw Transaction Data
        </Typography>
        {renderRawDump()}

        <Typography sx={{ mt: 4, mb: 2 }} variant='h6'>
          Decrypted Data
        </Typography>
        {renderDecryptedTradeCard(tradeData?.trader_id)}
      </CardContent>
    </Card>
  );
}

export default TradeDetailsPage;
