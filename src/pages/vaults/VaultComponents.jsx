import LabelTooltip from '@/shared/components/LabelTooltip';
import DataComponent from '@/shared/DataComponent';
import { OrderInfoTypography } from '@/shared/orderDetail/OrderInfo';
import { titleCase } from '@/util';
import { Box, Button, ButtonGroup, Divider, Paper, Skeleton, Stack, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2/Grid2';
import numbro from 'numbro';
import { useEffect, useState } from 'react';
import { useTraderSum } from './data/useTraderSum';
import SingleSplineChart from './graphs/SingleSplineChart';
import ExchangeBreakdownChart from './graphs/ExchangeBreakdownChart';
import TraderDashboardChart from './graphs/TraderDashboardChart';
import { transformEventsToChartData } from './graphs/utils';

const vaultButtonLabels = {
  tvl: 'TVL',
  pnl: 'PNL',
};

const timeButtonLabels = {
  '7D': '7D',
  '1M': '1M',
  '3M': '3M',
  '6M': '6M',
};

/**
 * Renders a group of buttons with the selected button highlighted
 *
 * @param {Object} props - Component properties
 * @param {string} props.value - Currently selected button value
 * @param {Function} props.setter - State setter function for button value
 * @param {Object} props.buttonConstants - Map of button keys to display labels
 * @param {string} props.keyName - Unique identifier for this button group
 * @param {string} props.groupVariant - MUI ButtonGroup variant
 * @param {string|number} props.height - Height of the button group
 * @param {Object} props.tooltips - Optional map of button keys to tooltip text
 * @returns {JSX.Element} Rendered button group component
 */
const renderButtonGroups = ({
  value,
  setter,
  buttonConstants,
  keyName,
  groupVariant,
  height = 'auto',
  tooltips = {},
}) => {
  return (
    <ButtonGroup sx={{ height }} variant={groupVariant}>
      {Object.keys(buttonConstants).map((key) => {
        // Get the label for this specific button
        const buttonLabel = buttonConstants[key]
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        const button = (
          <Button
            key={`${keyName}_button_${key}`}
            sx={{
              backgroundColor: value === key ? 'primary.main' : 'transparent',
              color: value === key ? 'text.offBlack' : 'test.primary',
            }}
            onClick={() => {
              console.log('[renderButtonGroups] Clicked button:', key);
              setter(key);
            }}
          >
            {buttonLabel}
          </Button>
        );

        // If there's a tooltip for this button, wrap it in LabelTooltip
        if (tooltips[key]) {
          return <LabelTooltip key={`${keyName}_tooltip_${key}`} label={button} title={tooltips[key]} />;
        }

        return button;
      })}
    </ButtonGroup>
  );
};

const hardcoded_data = {
  conentration_risk: '45.5%',
  max_drawdown: '4.35%',
  leverage: '3.5x',
  tvl: '$248.31M',
  pnl: '$12.4M',
  market_pnl: '$50.83M',
  market_exposure: '$100',
  turnover: '3.5x',
};

export function PerformancePaper() {
  const [timeButtonValue, setTimeButtonValue] = useState('7D');

  return (
    <Paper elevation={0} sx={{ p: 4 }}>
      <Stack direction='column' spacing={4}>
        <Stack direction='row' justifyContent='space-between' spacing={16}>
          <Stack direction='row' spacing={16}>
            <OrderInfoTypography header='My Deposit' value='$0.00' valueVariant='h3' />
            <OrderInfoTypography header='All-time Earned' value='$0.00' valueVariant='h3' />
          </Stack>
          {renderButtonGroups({
            value: timeButtonValue,
            setter: setTimeButtonValue,
            buttonConstants: timeButtonLabels,
            keyName: 'performance_time',
            groupVariant: 'outlined',
            height: '34px',
          })}
        </Stack>
        <SingleSplineChart
          dataA={[
            [Date.UTC(2024, 2, 1), 0],
            [Date.UTC(2024, 2, 2), 0],
            [Date.UTC(2024, 2, 3), 0],
            [Date.UTC(2024, 2, 4), 0],
            [Date.UTC(2024, 2, 5), 0],
            [Date.UTC(2024, 2, 6), 0],
            [Date.UTC(2024, 2, 7), 0],
          ]}
        />
      </Stack>
    </Paper>
  );
}

// Helper function to format parameter name for display
const formatParamName = (paramId) => {
  // Convert snake_case to Title Case
  return paramId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export function MarketDataErrorComponent({ error }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography align='center' color='error'>
        Error loading market data: {error?.message}
      </Typography>
    </Box>
  );
}

export function MarketDataEmptyComponent() {
  return (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography align='center' color='text.secondary'>
        No market data parameters available
      </Typography>
    </Box>
  );
}

// Helper function to get current value and metadata based on selected parameter
const getCurrentValueAndMetadataHelper = (groupedConsensusEvents, groupedEvents, marketButtonValue) => {
  const currentParamConsensus = groupedConsensusEvents ? groupedConsensusEvents[marketButtonValue] : null;
  const currentParamAttestation = groupedEvents ? groupedEvents[marketButtonValue] : null;

  // Use consensus metadata if available, otherwise fallback to attestation
  const metadataToUse = currentParamConsensus?.metadata || currentParamAttestation?.metadata;

  // Calculate currentValue based on the *attestation* data's latest event
  const latestAttestationEvent =
    currentParamAttestation?.events?.length > 0
      ? [...currentParamAttestation.events].sort((a, b) => b.epoch - a.epoch)[0]
      : null;
  const currentValue = latestAttestationEvent
    ? `$${Math.abs(latestAttestationEvent.data).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$0';

  return {
    value: currentValue,
    metadata: metadataToUse,
  };
};

/**
 * Component to display market data charts and stats for one or more traders.
 * Uses the useTraderSum hook to fetch and aggregate data.
 * @param {Object} props - Component props
 * @param {string[]} props.traderIds - Array of trader IDs to fetch and aggregate data for.
 * @returns {React.Component}
 */
export function MarketDataComponent({ traderIds }) {
  // Get available parameters from groupedEvents
  const [timeButtonValue, setTimeButtonValue] = useState('7D');
  // Pass the traderIds array to the hook
  const {
    loading: isLoading,
    error,
    groupedEvents,
    parameterStats,
    namedEvents,
    // Destructure consensus data
    totalConsensusCount,
    namedConsensusEvents,
    groupedConsensusEvents, // Get grouped consensus events for potential future use or metadata access
  } = useTraderSum(traderIds, timeButtonValue);

  // Determine available parameters primarily from consensus, fallback to attestations
  const consensusParamIds = Object.keys(groupedConsensusEvents || {});
  const attestationParamIds = Object.keys(groupedEvents || {});
  const availableParams = consensusParamIds.length > 0 ? consensusParamIds : attestationParamIds;

  const [marketButtonValue, setMarketButtonValue] = useState(availableParams[0] || '0');

  // Update marketButtonValue when availableParams changes and has values
  useEffect(() => {
    if (availableParams.length > 0 && !availableParams.includes(marketButtonValue)) {
      setMarketButtonValue(availableParams[0]);
    }
  }, [availableParams, marketButtonValue]);

  // Create dynamic button constants and tooltips from available parameters
  const marketButtonLabels = {};
  const marketButtonTooltips = {};
  availableParams.forEach((paramId) => {
    const metadata = groupedEvents[paramId]?.metadata || {};
    // Use metadata name if available, otherwise format the parameter ID
    marketButtonLabels[paramId] = metadata.name || formatParamName(paramId);

    // Create a detailed tooltip with parameter info
    const tooltipContent = (
      <>
        <Typography sx={{ mb: 1 }} variant='subtitle2'>
          Parameter #{paramId}
        </Typography>
        <Typography sx={{ mb: 0.5 }} variant='body2'>
          Name: {metadata.name || formatParamName(paramId)}
        </Typography>
        {metadata.description && <Typography variant='body2'>Description: {metadata.description}</Typography>}
      </>
    );
    marketButtonTooltips[paramId] = tooltipContent;
  });

  const timeButtonTooltips = {
    '7D': (
      <>
        <Typography sx={{ mb: 1 }} variant='subtitle2'>
          Time Period: 7 Days
        </Typography>
        <Typography variant='body2'>Show data for the last 7 days</Typography>
      </>
    ),
    '1M': (
      <>
        <Typography sx={{ mb: 1 }} variant='subtitle2'>
          Time Period: 1 Month
        </Typography>
        <Typography variant='body2'>Show data for the last month</Typography>
      </>
    ),
    '3M': (
      <>
        <Typography sx={{ mb: 1 }} variant='subtitle2'>
          Time Period: 3 Months
        </Typography>
        <Typography variant='body2'>Show data for the last 3 months</Typography>
      </>
    ),
    '6M': (
      <>
        <Typography sx={{ mb: 1 }} variant='subtitle2'>
          Time Period: 6 Months
        </Typography>
        <Typography variant='body2'>Show data for the last 6 months</Typography>
      </>
    ),
  };

  // Transform grouped events data into the format needed for SingleSplineChart

  // Create mapping of data for each market metric using CONSENSUS events
  const graphDataMapping = availableParams.reduce((acc, paramId) => {
    // Use namedConsensusEvents for graph data if available
    const consensusEventsForParam = namedConsensusEvents && namedConsensusEvents[paramId]?.events;
    acc[paramId] = transformEventsToChartData(consensusEventsForParam || []);
    return acc;
  }, {});

  // Get current value and metadata from the selected parameter (prioritizing consensus meta if available)
  const { value: currentValue, metadata: currentMetadata } = getCurrentValueAndMetadataHelper(
    groupedConsensusEvents,
    groupedEvents,
    marketButtonValue
  );

  // Use CONSENSUS named events for volume calculation and chart
  const volumeEvents = transformEventsToChartData(namedConsensusEvents?.volume?.events || []);
  const totalVolume = volumeEvents.reduce((sum, val) => {
    return sum + (val[1] || 0); // Ensure value exists
  }, 0);
  const titleCaseName = titleCase(currentMetadata?.name || `Parameter ${currentMetadata?.parameterId} Value`);
  const seriesName = `Total ${titleCaseName || 'Volume'}`;

  return (
    <DataComponent
      emptyComponent=<MarketDataEmptyComponent />
      errorComponent=<MarketDataErrorComponent error={error} />
      hasError={error}
      isEmpty={availableParams.length === 0}
      isLoading={isLoading}
      loadingComponent=<Skeleton sx={{ height: '100%', width: '100%' }} variant='rounded' />
    >
      <Grid container sx={{ height: '100%', py: 3 }}>
        <Grid sx={{ height: '100%', borderRight: '1px solid rgba(255, 255, 255, 0.12);', pr: 4 }} xs={9}>
          <Stack direction='column' spacing={4} sx={{ height: '100%' }}>
            <Stack direction='row' justifyContent='flex-end' sx={{ pl: 5 }}>
              {renderButtonGroups({
                value: timeButtonValue,
                setter: setTimeButtonValue,
                buttonConstants: timeButtonLabels,
                keyName: 'time',
                groupVariant: 'outlined',
                tooltips: timeButtonTooltips,
              })}
            </Stack>
            <Box style={{ height: '100%' }}>
              <SingleSplineChart
                dataA={volumeEvents}
                description={`[MarketDataComponent] ${marketButtonValue} for ${traderIds.join(', ')}`}
                nameA={seriesName}
              />
            </Box>
          </Stack>
        </Grid>
        <Grid sx={{ px: 4 }} xs={3}>
          <Stack direction='column' spacing={4}>
            <Typography color='text.secondary' variant='subtitle1'>
              My Trades (Consensus)
            </Typography>
            <Stack direction='column' spacing={1}>
              <Typography color='text.secondary' variant='body3'>
                Total Volume (Consensus, {timeButtonValue})
              </Typography>
              <Typography variant='h5'>{numbro(totalVolume).formatCurrency({ thousandSeparated: true })}</Typography>
            </Stack>
            <Divider />
            <Stack direction='column' spacing={1}>
              <Typography color='text.secondary' variant='body3'>
                Total Trades (Consensus)
              </Typography>
              <Typography variant='h5'>{totalConsensusCount ?? 'N/A'}</Typography>
            </Stack>
            <Divider />
            <Stack direction='column' spacing={1}>
              <Typography color='text.secondary' variant='body3'>
                Exchange Accounts
              </Typography>
              <Typography variant='h5'>{traderIds?.length}</Typography>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </DataComponent>
  );
}

export function TraderDashboardComponent({ traderIds, traderIdExchanges, consensusEvents, dateRange }) {
  const totalVolume = consensusEvents.reduce((sum, val) => {
    return sum + (val.data || 0); // Ensure value exists
  }, 0);
  const totalConsensusCount = consensusEvents.length;

  return (
    <Grid container sx={{ height: '100%', py: 3 }}>
      <Grid sx={{ height: '100%', borderRight: '1px solid rgba(255, 255, 255, 0.12);', pr: 4 }} xs={9}>
        <Box style={{ height: '100%' }}>
          <TraderDashboardChart
            consensusEvents={consensusEvents}
            dateRange={dateRange}
            traderIdExchanges={traderIdExchanges}
          />
        </Box>
      </Grid>
      <Grid sx={{ px: 4 }} xs={3}>
        <Stack direction='column' spacing={4}>
          <Typography color='text.secondary' variant='subtitle1'>
            My Trades
          </Typography>
          <Stack direction='column' spacing={1}>
            <Typography color='text.secondary' variant='body3'>
              Total Volume
            </Typography>
            <Typography variant='h5'>{numbro(totalVolume).formatCurrency({ thousandSeparated: true })}</Typography>
          </Stack>
          <Divider />
          <Stack direction='column' spacing={1}>
            <Typography color='text.secondary' variant='body3'>
              Total Trades
            </Typography>
            <Typography variant='h5'>{totalConsensusCount ?? 'N/A'}</Typography>
          </Stack>
          <Divider />
          <Stack direction='column' spacing={1}>
            <Typography color='text.secondary' variant='body3'>
              Exchange Accounts
            </Typography>
            <Typography variant='h5'>{traderIds?.length}</Typography>
          </Stack>
        </Stack>
      </Grid>
    </Grid>
  );
}

export function ExchangeBreakdownComponent({ consensusEvents, traderIdExchanges, dateRange }) {
  const bucketByExchange = consensusEvents.reduce((acc, event) => {
    const [_, parsedTraderId] = event.traderId.split('0x');
    const { exchange } = traderIdExchanges[parsedTraderId] || 'Unknown';
    if (!acc[exchange]) {
      acc[exchange] = [];
    }

    acc[exchange].push(event);
    return acc;
  }, {});

  return (
    <Stack direction='column' spacing={4} sx={{ boxSizing: 'border-box', p: 4, height: '100%' }}>
      <Typography variant='h5'>Exchange Breakdown</Typography>
      <Box style={{ height: '100%' }}>
        <ExchangeBreakdownChart chartData={bucketByExchange} dateRange={dateRange} />
      </Box>
    </Stack>
  );
}

export function VaultDataComponent() {
  const [vaultButtonValue, setVaultButtonValue] = useState('tvl');
  const [timeButtonValue, setTimeButtonValue] = useState('7D');

  return (
    <Paper elevation={0} sx={{ p: 4 }}>
      <Stack direction='column' spacing={4}>
        <Stack
          alignItems='center'
          direction='row'
          justifyContent='space-between'
          sx={{ height: 'auto', width: '100%' }}
        >
          {renderButtonGroups({
            value: vaultButtonValue,
            setter: setVaultButtonValue,
            buttonConstants: vaultButtonLabels,
            keyName: 'market',
            groupVariant: 'text',
          })}
          {renderButtonGroups({
            value: timeButtonValue,
            setter: setTimeButtonValue,
            buttonConstants: timeButtonLabels,
            keyName: 'time',
            groupVariant: 'outlined',
          })}
        </Stack>
        <Typography variant='h2'>{hardcoded_data[vaultButtonValue]}</Typography>
        <SingleSplineChart
          dataA={[
            [Date.UTC(2024, 2, 1), 900000],
            [Date.UTC(2024, 2, 2), 2800000],
            [Date.UTC(2024, 2, 3), 1800000],
            [Date.UTC(2024, 2, 4), 4500000],
            [Date.UTC(2024, 2, 5), 3800000],
            [Date.UTC(2024, 2, 6), 6500000],
            [Date.UTC(2024, 2, 7), 5500000],
            [Date.UTC(2024, 2, 8), 8700000],
            [Date.UTC(2024, 2, 9), 7500000],
          ]}
          nameA={vaultButtonLabels[vaultButtonValue]}
        />
      </Stack>
    </Paper>
  );
}
