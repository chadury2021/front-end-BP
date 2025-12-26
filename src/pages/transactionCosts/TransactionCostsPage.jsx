/* eslint-disable no-param-reassign */
import { useTheme } from '@emotion/react';
import { Button, CardHeader, Stack, Pagination, Box, Paper, Skeleton, Select, MenuItem } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import heatmap from 'highcharts/modules/heatmap';
import treemap from 'highcharts/modules/treemap';
import React, { useRef, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { TCA_STATS_URL } from '@/apiServices';
import useViewport from '@/shared/hooks/useViewport';
import { useOrderSearch } from '@/shared/hooks/useOrderSearch';
import DataComponent from '@/shared/DataComponent';
import { OrderSearch } from '../orderView/OrderSearch';
import { TransactionBenchmark } from './TransactionBenchmark';
import { TransactionSummaryRender } from './TransactionSummary';

heatmap(Highcharts);
treemap(Highcharts);

const getCardWidth = (size, isMobile) => {
  return isMobile ? 12 : size;
};

function LoadingSkeleton({ isMobile }) {
  return (
    <Grid container alignItems='stretch' spacing={1} sx={{ height: 'calc(100% - 80px)', width: '100%' }}>
      {/* Left Column */}
      <Grid style={{ height: '90%' }} xs={getCardWidth(3, isMobile)}>
        <Stack direction='column' height='100%' spacing={1}>
          {/* Transaction Summary Card */}
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Skeleton height={32} variant='text' width={200} />
                <Grid container spacing={2}>
                  {[1, 2, 3, 4].map((i) => (
                    <Grid item key={`summary-${i}`} xs={6}>
                      <Skeleton height={24} variant='text' width={120} />
                      <Skeleton height={20} variant='text' width={80} />
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </CardContent>
          </Card>
          {/* Benchmark Card */}
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Skeleton height={32} variant='text' width={160} />
                <Grid container spacing={2}>
                  {[1, 2, 3].map((i) => (
                    <Grid item key={`benchmark-${i}`} xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Skeleton height={24} variant='text' width={140} />
                        <Skeleton height={24} variant='text' width={80} />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Grid>

      {/* Right Column */}
      <Grid style={{ height: '90%' }} xs={getCardWidth(9, isMobile)}>
        <Stack direction='column' height='100%' spacing={1}>
          {/* Order Breakdown Card */}
          <Card>
            <Typography sx={{ marginTop: '10px', marginLeft: '10px' }} variant='h6'>
              Order Breakdown
            </Typography>
            <CardContent>
              <Box display='flex' sx={{ height: '250px', width: '100%' }}>
                <Skeleton
                  height='100%'
                  sx={{ transform: 'scale(1, 1)' }} // Prevent skeleton shrinkage variant="rectangular"
                  width='100%'
                />
              </Box>
            </CardContent>
          </Card>

          {/* Fill Breakdown and Traded Notional Cards */}
          {!isMobile && (
            <Stack direction='row' height='50%' spacing={1}>
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Skeleton height={32} variant='text' width={160} />
                    <Box sx={{ height: '200px', width: '100%' }}>
                      <Skeleton height='100%' variant='rectangular' width='100%' />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Skeleton height={32} variant='text' width={160} />
                    <Box sx={{ height: '200px', width: '100%' }}>
                      <Skeleton height='100%' variant='rectangular' width='100%' />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          )}
        </Stack>
      </Grid>

      {isMobile && (
        <Grid style={{ height: '100%' }} xs={getCardWidth(4, isMobile)}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Skeleton height={32} variant='text' width={160} />
                <Box sx={{ height: '200px', width: '100%' }}>
                  <Skeleton height='100%' variant='rectangular' width='100%' />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      )}
      {isMobile && (
        <Grid style={{ height: '300px' }} xs={getCardWidth(4, isMobile)}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Skeleton height={32} variant='text' width={160} />
                <Box sx={{ height: '200px', width: '100%' }}>
                  <Skeleton height='100%' variant='rectangular' width='100%' />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Bottom Row Cards */}
      <Grid style={{ height: isMobile ? '300px' : '40%' }} xs={getCardWidth(4, isMobile)}>
        <Card>
          <CardContent sx={{ height: '80%' }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton height={32} variant='text' width={200} />
                <Skeleton height={36} variant='rectangular' width={100} />
              </Box>
              <Box sx={{ height: '200px', width: '100%' }}>
                <Skeleton height='100%' variant='rectangular' width='100%' />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid style={{ height: '40%' }} xs={getCardWidth(4, isMobile)}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Skeleton height={32} variant='text' width={160} />
              <Box sx={{ height: '200px', width: '100%' }}>
                <Skeleton height='100%' variant='rectangular' width='100%' />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid style={{ height: '40%' }} xs={getCardWidth(4, isMobile)}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Skeleton height={32} variant='text' width={160} />
              <Box sx={{ height: '200px', width: '100%' }}>
                <Skeleton height='100%' variant='rectangular' width='100%' />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function TransactionCostsPage() {
  const [data, setData] = useState({
    summary: {},
    breakdowns: {
      side: { labels: [] },
      strategy: { labels: [] },
      fill_role: { labels: [] },
      fill_exchange: { labels: [] },
    },
    timeseries: {
      notional: {
        labels: [],
        data: [],
      },
    },
    distributions: {},
  });

  const [showLongShortCard, setShowLongShortCard] = useState(true);
  const theme = useTheme();
  const chartComponent = useRef(null);

  const handleSearchComplete = (response) => {
    setData({
      summary: response.summary,
      breakdowns: response.breakdowns,
      timeseries: response.timeseries,
      distributions: response.distributions,
      pagination: response.pagination,
    });
  };

  const {
    searchParams,
    updateSearchParams,
    orderSearchFormData,
    loading: searchLoading,
    handleSearch,
  } = useOrderSearch(TCA_STATS_URL, handleSearchComplete);

  const handlePageChange = (event, value) => {
    updateSearchParams({ pageNumber: value });
  };

  const toggleLongShortCard = () => {
    setShowLongShortCard(!showLongShortCard);
  };

  const { isMobile } = useViewport();

  const FILL_ROLE_COLORS = {
    MAKE: theme.palette.semantic.success,
    TAKE: theme.palette.semantic.error,
  };

  const exchangeColors = {
    OKX: theme.palette.exchangeColors?.OKXTransparent || 'rgba(169, 169, 169, 0.75)',
    Binance: theme.palette.exchangeColors?.BinanceTransparent || 'rgba(230, 181, 26, 0.75)',
    BinancePM: theme.palette.exchangeColors?.BinancePMTransparent || 'rgba(230, 181, 26, 0.75)',
    Bybit: theme.palette.exchangeColors?.BybitTransparent || 'rgba(230, 138, 26, 0.75)',
    Deribit: theme.palette.exchangeColors?.DeribitTransparent || 'rgba(51, 204, 204, 0.75)',
    Coinbase: theme.palette.exchangeColors?.CoinbaseTransparent || 'rgba(26, 127, 229, 0.75)',
    MockExchange: theme.palette.exchangeColors?.MockExchangeTransparent || 'rgba(255, 255, 255, 0.75)',
  };

  const horizontalBarOptions = {
    indexAxis: 'y',
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false,
        stacked: true,
        offset: true,
        ticks: {
          max: 100,
        },
      },
      y: {
        afterFit(scale) {
          scale.width = 70;
        },
        stacked: true,
      },
    },
    animation: false,
  };

  const safeReadBreakdown = (breakdown) => {
    return breakdown === undefined || breakdown === null ? { labels: [], data: {} } : breakdown;
  };

  const strategyBreakdown = safeReadBreakdown(data.breakdowns.strategy);
  const fillRoleBreakdown = safeReadBreakdown(data.breakdowns.fill_role);
  const fillExchangeBreakdown = safeReadBreakdown(data.breakdowns.fill_exchange);

  // winsorize data, lower n upper percentiles can be adjusted
  const winsorize = (_data, lowerPercentile = 10, upperPercentile = 90) => {
    if (!_data) return _data;

    const sortedData = [..._data].sort((a, b) => a - b);
    const lowerBound = sortedData[Math.floor((lowerPercentile / 100) * sortedData.length)];
    const upperBound = sortedData[Math.ceil((upperPercentile / 100) * sortedData.length - 1)];
    return _data.map((value) => Math.min(Math.max(value, lowerBound), upperBound));
  };

  const role_data = {
    labels: fillRoleBreakdown.labels,
    datasets: [
      {
        label: 'Role',
        data: fillRoleBreakdown.data && Object.values(fillRoleBreakdown.data).map((value) => value[0]),
        borderColor: Object.values(FILL_ROLE_COLORS),
        backgroundColor: Object.values(FILL_ROLE_COLORS),
      },
    ],
    radius: '90%',
  };

  const exchange_data = {
    labels: fillExchangeBreakdown.labels,
    datasets: [
      {
        label: 'Exchange',
        data: fillExchangeBreakdown.data && Object.values(fillExchangeBreakdown.data).map((value) => value[0]),
        borderColor: Object.values(exchangeColors),
        backgroundColor: Object.values(exchangeColors),
      },
    ],
    radius: '90%',
  };

  const timeseries_data = {
    labels: data.timeseries.notional.labels,
    datasets: [
      {
        label: 'Traded Notional',
        borderColor: theme.palette.charts.blue,
        data: data.timeseries.notional.data,
        fill: false,
        pointRadius: (context) => {
          const value = context.raw;
          return value === 0 ? 0 : 3;
        },
      },
    ],
  };

  const numberOfBins = 11;

  // Helper function to calculate bin counts based on pov data
  const calculateBinCounts = (povData, binInterval, maxParticipationRate) => {
    const binCounts = new Array(numberOfBins).fill(0);

    povData.forEach((value) => {
      let binIndex = Math.floor(value / binInterval);
      // Ensure the highest value falls into the last bin
      if (binIndex === numberOfBins) {
        binIndex = numberOfBins - 1;
      }
      binCounts[binIndex] += 1;
    });

    return binCounts;
  };

  // Calculate data for participation rate chart
  const calculateParticipationRateData = () => {
    if (!data.distributions.buy_pov_data || !data.distributions.sell_pov_data) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const winsorizedBuyData = winsorize(data.distributions.buy_pov_data);
    const winsorizedSellData = winsorize(data.distributions.sell_pov_data);

    const maxParticipationRate = Math.max(...winsorizedBuyData, ...winsorizedSellData);

    const binInterval = maxParticipationRate / numberOfBins;

    const buyData = calculateBinCounts(winsorizedBuyData, binInterval, maxParticipationRate);
    const sellData = calculateBinCounts(winsorizedSellData, binInterval, maxParticipationRate);

    const labels = Array.from(
      { length: numberOfBins },
      (_, index) =>
        `${(index * binInterval).toFixed(2)}% - ${(index === numberOfBins - 1
          ? maxParticipationRate
          : (index + 1) * binInterval
        ).toFixed(2)}%`
    );

    return {
      labels,
      datasets: [
        {
          label: 'Buy',
          data: buyData,
          backgroundColor: theme.palette.primary.main,
          barThickness: 10,
          categoryPercentage: 1.0,
          barPercentage: 0.4,
        },
        {
          label: 'Sell',
          data: sellData,
          backgroundColor: theme.palette.secondary.main,
          barThickness: 10,
          categoryPercentage: 1.0,
          barPercentage: 0.4,
        },
      ],
    };
  };

  const participationRateOptions = {
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: 20,
        },
        drawOnChartArea: true,
        border: {
          display: false,
        },
        title: {
          display: true,
          text: 'Participation Rate',
        },
      },
      y: {
        border: {
          display: false,
        },
        afterFit(scale) {
          scale.width = 60;
        },
        title: {
          display: true,
          text: 'Number of Orders',
        },
      },
    },
    legend: {
      display: false,
    },
    maintainAspectRatio: false,
  };

  const order_distro_data = {
    labels: data.distributions.order_distro_labels || [],
    datasets: [
      {
        label: 'Buy', // previously long
        data: data.distributions.buy_order_distro_data || [],
        backgroundColor: theme.palette.primary.main,
        barThickness: 10, // Make bars thinner
        categoryPercentage: 1.0, // Ensure bars take up the full category width
        barPercentage: 0.4, // Set the bar width
      },
      {
        label: 'Sell', // previously short
        data: (data.distributions.sell_order_distro_data || []).map((value) => Math.abs(value)), // Ensure positive values
        backgroundColor: theme.palette.grey.main,
        barThickness: 10, // Make bars thinner
        categoryPercentage: 1.0, // Ensure bars take up the full category width
        barPercentage: 0.4, // Set the bar width
      },
    ],
  };

  const vwap_cost_distro_data = {
    labels: data.distributions.vwap_slippage_labels,
    datasets: [
      {
        label: 'VWAP',
        radius: 1,
        tension: 0.6,
        data: data.distributions.vwap_slippage_data,
        backgroundColor: `${theme.palette.primary.main}80`, // 50% opacity
        fill: true,
      },
    ],
  };

  const arrival_cost_distro_data = {
    labels: data.distributions.arrival_slippage_labels,
    datasets: [
      {
        label: 'Arrival',
        radius: 1,
        tension: 0.6,
        data: data.distributions.arrival_slippage_data,
        backgroundColor: `${theme.palette.brand?.[500] || theme.palette.primary.main}80`, // 50% opacity
        fill: true,
      },
    ],
  };
  const notionalOptions = {
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: 20,
        },
        drawOnChartArea: true,
        border: {
          display: false,
        },
        grid: {
          color: theme.palette.text.subtitle,
        },
      },
      y: {
        border: {
          display: false,
        },
        afterFit(scale) {
          scale.width = 60;
        },
        ticks: {
          // Format large numbers with K, M, B suffixes
          callback: (value) => {
            if (Math.abs(value) >= 1e9) {
              return `${value / 1e9}B`;
            }
            if (Math.abs(value) >= 1e6) {
              return `${value / 1e6}M`;
            }
            if (Math.abs(value) >= 1e3) {
              return `${value / 1e3}K`;
            }
            return value;
          },
        },
        grid: {
          color: theme.palette.text.subtitle,
        },
      },
    },
    legend: {
      display: false,
    },
    maintainAspectRatio: false,
  };

  const orderDistroConfig = {
    scales: {
      x: {
        stacked: false,
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Order Notional',
        },
        title: {
          display: true,
          text: 'Order Notional',
        },
      },
      y: {
        stacked: false,
        display: true,
        scaleLabel: {
          display: true,
          labelString: 'Number of Orders',
        },
        title: {
          display: true,
          text: 'Number of Orders',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
      },
    },
    maintainAspectRatio: false,
  };
  const costDistroConfig = {
    scales: {
      x: {
        scaleLabel: {
          display: true,
          labelString: 'Cost (z-score)',
        },
      },
      y: {
        scaleLabel: {
          display: false,
        },
      },
    },
    legend: {
      display: false,
    },
    maintainAspectRatio: false,
  };

  const fillRoleConfig = {
    data: role_data,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Role',
        align: 'start',
      },
      legend: {
        position: 'right',
      },
    },
    animation: false,
  };
  const fillExchangeConfig = {
    data: exchange_data,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Exchange',
        align: 'start',
      },
      legend: {
        position: 'right',
      },
    },
    animation: false,
  };
  const a = strategyBreakdown.data
    ? [
        ...Object.keys(strategyBreakdown.data).map((e) => {
          return {
            id: e,
            name: e,
            color: theme.palette.text.primary,
          };
        }),
        ...Object.keys(strategyBreakdown.data).flatMap((e) => {
          return Object.keys(strategyBreakdown.data[e]).flatMap((symbol) => {
            const value = strategyBreakdown.data[e][symbol][0];
            if (value === 0) {
              return [];
            }
            return {
              parent: e,
              name: symbol,
              value,
              colorValue: strategyBreakdown.data[e][symbol][1] ? strategyBreakdown.data[e][symbol][1] : null,
            };
          });
        }),
      ]
    : [];
  const strategyTreeMapOptions = {
    chart: {
      animation: false,
      backgroundColor: 'transparent',
      zooming: {
        mouseWheel: false,
      },
      zoomType: null,
      marginBottom: 80,
    },
    series: [
      {
        type: 'treemap',
        layoutAlgorithm: 'stripes',
        alternateStartingDirection: true,
        borderColor: theme.palette.text.offBlack,
        borderRadius: 6,
        borderWidth: 2,
        dataLabels: {
          style: {
            fontSize: '15px',
            fontFamily: 'IBM Plex Mono',
            color: theme.palette.text.offBlack,
          },
        },
        levels: [
          {
            level: 1,
            layoutAlgorithm: 'squarified',
            dataLabels: {
              enabled: true,
              align: 'left',
              verticalAlign: 'top',
              style: {
                fontSize: '15px',
                fontFamily: 'IBM Plex Mono',
              },
            },
          },
        ],
        data: a,
      },
    ],
    colorAxis: {
      min: -20,
      max: 20,
      labels: {
        enabled: true,
        step: 20,
        style: {
          color: theme.palette.text.offWhite,
        },
      },
      stops: theme.palette.tcaScheme,
      layout: 'vertical',
    },
    tooltip: {
      enabled: true,
      useHTML: true,
      formatter() {
        const point = this;
        if (!point.point.parent) {
          return false;
        }
        return `Strategy: <b>${point.point.parent}</b><br/>
          Notional: <b>${point.point.value}</b><br/>
          Slippage: <b>${point.point.colorValue ? point.point.colorValue : 0}</b>`;
      },
    },
    legend: {
      enabled: false,
    },
    rangeSelector: {
      enabled: false,
    },
    navigator: {
      enabled: false,
    },
    scrollbar: {
      enabled: false,
    },
    credits: {
      enabled: false,
    },
  };

  const FillBreakdownCard = (
    <Card sx={{ width: isMobile ? '100%' : '50%' }}>
      <Typography sx={{ marginTop: '10px', marginLeft: '10px' }} variant='h6'>
        Fill Breakdown
      </Typography>
      <CardContent>
        <Stack direction='row' style={{ height: 'calc(100% - 60px)' }}>
          <Box display='flex' sx={{ height: '100%', width: '50%' }}>
            <Doughnut data={role_data} options={fillRoleConfig} />
          </Box>
          <Box display='flex' sx={{ height: '100%', width: '50%' }}>
            <Doughnut data={exchange_data} options={fillExchangeConfig} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  const TradedNotionalCard = (
    <Card sx={{ width: isMobile ? '100%' : '50%' }}>
      <CardContent
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box display='flex' sx={{ height: '90%', width: '90%', position: 'relative' }}>
          <Line data={timeseries_data} options={notionalOptions} width='90%' />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Stack direction='column' height='100%' spacing={1} sx={{ overflowY: 'auto' }}>
      <OrderSearch
        formData={orderSearchFormData}
        searchParams={searchParams}
        onSearchParamsChange={updateSearchParams}
      />
      <Paper elevation={0} sx={{ display: 'flex', justifyContent: 'center', width: '100%', padding: 2 }}>
        <Grid container alignItems='center' justifyContent='center' spacing={4} sx={{ maxWidth: '800px' }}>
          <Grid item>
            <Select
              size='small'
              value={searchParams.pageSize}
              onChange={(e) => updateSearchParams({ pageSize: e.target.value, pageNumber: 1 })}
            >
              <MenuItem value={100}>100 per page</MenuItem>
              <MenuItem value={500}>500 per page</MenuItem>
              <MenuItem value={1000}>1000 per page</MenuItem>
            </Select>
          </Grid>
          <Grid item>
            <Pagination
              showFirstButton
              showLastButton
              color='primary'
              count={data.pagination?.total_pages || 1}
              page={searchParams.pageNumber}
              size='small'
              onChange={handlePageChange}
            />
          </Grid>
        </Grid>
      </Paper>

      <Grid container alignItems='stretch' spacing={1} sx={{ height: 'calc(100% - 140px)' }}>
        <DataComponent isLoading={searchLoading} loadingComponent={<LoadingSkeleton isMobile={isMobile} />}>
          <Grid style={{ height: '90%' }} xs={getCardWidth(3, isMobile)}>
            <Stack direction='column' height='100%' spacing={1}>
              <Card>
                <CardContent>
                  <TransactionSummaryRender TransactionSummaryData={data.summary} />
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <TransactionBenchmark benchmarkData={data.summary} />
                </CardContent>
              </Card>
            </Stack>
          </Grid>
          <Grid style={{ height: '90%' }} xs={getCardWidth(9, isMobile)}>
            <Stack direction='column' height='100%' spacing={1}>
              <Card>
                <Typography sx={{ marginTop: '10px', marginLeft: '10px' }} variant='h6'>
                  Order Breakdown
                </Typography>
                <CardContent>
                  <Box display='flex' sx={{ height: '100%' }}>
                    <HighchartsReact
                      constructorType='stockChart'
                      containerProps={{
                        style: { height: '100%', width: '100%' },
                      }}
                      highcharts={Highcharts}
                      options={strategyTreeMapOptions}
                      ref={chartComponent}
                    />
                  </Box>
                </CardContent>
              </Card>
              {!isMobile && (
                <Stack direction='row' height='50%' spacing={1}>
                  {FillBreakdownCard}
                  {TradedNotionalCard}
                </Stack>
              )}
            </Stack>
          </Grid>
          {isMobile && (
            <Grid style={{ height: '100%' }} xs={getCardWidth(4, isMobile)}>
              {FillBreakdownCard}
            </Grid>
          )}
          {isMobile && (
            <Grid style={{ height: '300px' }} xs={getCardWidth(4, isMobile)}>
              {TradedNotionalCard}
            </Grid>
          )}
          <Grid style={{ height: isMobile ? '300px' : '40%' }} xs={getCardWidth(4, isMobile)}>
            <Card>
              <CardContent sx={{ height: '80%' }}>
                <CardHeader action={<Button onClick={toggleLongShortCard}>Switch Graph</Button>} />
                <Stack height='85%'>
                  <Typography sx={{ marginTop: '-40px' }} variant='h6'>
                    Order Size Distribution
                  </Typography>
                  <Typography sx={{ marginBottom: '16px' }} variant='body2'>
                    * Winsorized (5%/95%)
                  </Typography>
                  {showLongShortCard ? (
                    <Bar data={order_distro_data} options={orderDistroConfig} />
                  ) : (
                    <Bar data={calculateParticipationRateData()} options={participationRateOptions} />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid style={{ height: '40%' }} xs={getCardWidth(4, isMobile)}>
            <Card>
              <CardContent>
                <Line data={vwap_cost_distro_data} options={costDistroConfig} />
              </CardContent>
            </Card>
          </Grid>
          <Grid style={{ height: '40%' }} xs={getCardWidth(4, isMobile)}>
            <Card>
              <CardContent>
                <Line data={arrival_cost_distro_data} options={costDistroConfig} />
              </CardContent>
            </Card>
          </Grid>
        </DataComponent>
      </Grid>
    </Stack>
  );
}

export default TransactionCostsPage;
