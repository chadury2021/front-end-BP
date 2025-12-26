import { getTimestampFromEpoch } from '@/pages/explorer/utils/epoch';
import LabelTooltip from '@/shared/components/LabelTooltip';
import { formatQty } from '@/util';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import AssetAreaChart from '../portfolio/AssetAreaChart';
import TraderDashboardChart from './graphs/TraderDashboardChart';

const transformEventsForCharting = (events, parameterId) => {
  return events
    .filter((event) => event.parameterId === parameterId)
    .sort((a, b) => b.epoch - a.epoch)
    .map((event) => ({
      ...event,
      date: new Date(getTimestampFromEpoch(event.epoch)),
    }));
};

function SubTitleTypography(props) {
  return <Typography color='text.subtitle' fontWeight={300} variant='body1' {...props} />;
}

function CurrencyTitleTypography(props) {
  return <Typography fontWeight={300} variant='subtitle1' {...props} />;
}

function getValueColor(value) {
  if (value > 0) return 'success.main';
  if (value < 0) return 'error.main';
  return 'text.primary';
}

function displayValue(value) {
  const color = getValueColor(value);
  return (
    <Stack alignItems='baseline' direction='row' spacing={4}>
      <Typography color={color} fontWeight={400} variant='h4'>
        {value > 0 ? '+' : ''}
        {formatQty(value)}
      </Typography>
      <CurrencyTitleTypography>USDT</CurrencyTitleTypography>
    </Stack>
  );
}

function displayValueNoColor(value) {
  return (
    <Stack alignItems='baseline' direction='row' spacing={4}>
      <Typography fontWeight={400} variant='h4'>
        {formatQty(value)}
      </Typography>
      <CurrencyTitleTypography>USDT</CurrencyTitleTypography>
    </Stack>
  );
}

export function TraderProfileComponent({ consensusEvents, traderIdExchanges, dateRange }) {
  const volumeEvents = transformEventsForCharting(consensusEvents, 0);

  const totalEquityEvents = transformEventsForCharting(consensusEvents, 2);
  const unrealizedPnlEvents = transformEventsForCharting(consensusEvents, 3);
  const notionalExposureEvents = transformEventsForCharting(consensusEvents, 4);

  const totalVolume = volumeEvents?.reduce((sum, val) => {
    return sum + (Number(val.data) || 0);
  }, 0);
  const lastUnrealizedPnl = unrealizedPnlEvents[0]?.data || 0;
  const lastTotalEquity = totalEquityEvents[0]?.data || 0;
  const lastNotionalExposure = notionalExposureEvents[0]?.data || 0;

  return (
    <Stack direction='column' spacing={2} sx={{ p: 2 }}>
      <Stack direction='row' spacing={2} sx={{ width: '100%' }}>
        <Card sx={{ bgcolor: 'background.paper', flex: 1, height: '90px' }}>
          <CardContent>
            <Stack direction='column' spacing={1}>
              <SubTitleTypography>
                <LabelTooltip
                  label='Total Equity'
                  link='https://tread-labs.gitbook.io/api-docs/portfolio'
                  title='Your current overall portfolio value, representing the sum of your cash, spot asset holdings, and the net profit or loss from all your open perpetual futures positions.'
                />
              </SubTitleTypography>
              {displayValueNoColor(lastTotalEquity)}
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: 'background.paper', flex: 1, height: '90px' }}>
          <CardContent>
            <Stack direction='column' spacing={1}>
              <SubTitleTypography>
                <LabelTooltip
                  label='Unrealized PnL'
                  link='https://tread-labs.gitbook.io/api-docs/portfolio'
                  title='The current profit or loss on your open positions.'
                />
              </SubTitleTypography>
              {displayValue(lastUnrealizedPnl)}
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: 'background.paper', flex: 1, height: '90px' }}>
          <CardContent>
            <Stack direction='column' spacing={1}>
              <SubTitleTypography>
                <LabelTooltip
                  label='Notional Exposure'
                  link='https://tread-labs.gitbook.io/api-docs/portfolio'
                  title='The total notional value of all your open positions, indicating your total market exposure.'
                />
              </SubTitleTypography>
              {displayValue(lastNotionalExposure)}
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Stack direction='row' spacing={2} sx={{ width: '100%' }}>
        <Card sx={{ bgcolor: 'background.paper', flex: 1 }}>
          <CardContent>
            <Stack direction='column' spacing={2}>
              <SubTitleTypography>
                <LabelTooltip
                  label='Unrealized PnL'
                  link='https://tread-labs.gitbook.io/api-docs/portfolio'
                  title='The current profit or loss on your open positions over time.'
                />
              </SubTitleTypography>
              <Box sx={{ height: '200px' }}>
                <AssetAreaChart balanceData={unrealizedPnlEvents} dataField='data' />
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: 'background.paper', flex: 1 }}>
          <CardContent>
            <Stack direction='column' spacing={2}>
              <SubTitleTypography>
                <LabelTooltip
                  label='Notional Exposure'
                  link='https://tread-labs.gitbook.io/api-docs/portfolio'
                  title='The total notional value of all your open positions over time, indicating your total market exposure.'
                />
              </SubTitleTypography>
              <Box sx={{ height: '200px' }}>
                <AssetAreaChart balanceData={notionalExposureEvents} dataField='data' />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Stack direction='row' spacing={2} sx={{ width: '100%' }}>
        <Card sx={{ bgcolor: 'background.paper', flex: 1 }}>
          <CardContent>
            <Stack direction='column' spacing={2}>
              <SubTitleTypography sx={{ noWrap: true, display: 'flex', alignItems: 'center' }}>
                <Stack alignItems='center' direction='row' spacing={1}>
                  <LabelTooltip
                    label='Cumulative Volume'
                    link='https://tread-labs.gitbook.io/api-docs/portfolio'
                    title='The total trading volume over the selected time period, showing your trading activity.'
                  />
                  <Typography component='span'>- {formatQty(totalVolume)} USDT</Typography>
                </Stack>
              </SubTitleTypography>
              <Box sx={{ height: '200px' }}>
                <TraderDashboardChart
                  consensusEvents={volumeEvents}
                  dateRange={dateRange}
                  traderIdExchanges={traderIdExchanges}
                />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
}
