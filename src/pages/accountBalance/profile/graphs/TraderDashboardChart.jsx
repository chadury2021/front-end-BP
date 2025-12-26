import React from 'react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import { Box, useTheme } from '@mui/material';
import { formatNumber } from '@/shared/utils/formatNumber';
import { getTimestampFromEpoch } from '@/pages/explorer/utils/epoch';

const oneDay = 24 * 60 * 60 * 1000;

function hashDate(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function transformToDailyDatapoints(events, datapoints) {
  const dailyValues = (events || []).reduce((acc, event) => {
    const { epoch, data } = event;
    const date = new Date(getTimestampFromEpoch(epoch));
    const dayTimestamp = hashDate(date);
    acc[dayTimestamp] = (acc[dayTimestamp] || 0) + data;
    return acc;
  }, {});

  const result = datapoints.map((ts) => {
    return [ts, dailyValues[ts] || 0];
  });

  return result;
}

export default function TraderDashboardChart({ consensusEvents, traderIdExchanges, dateRange }) {
  const theme = useTheme();

  // create daily datapoints
  const now = new Date();
  const datapoints = Array.from({ length: dateRange.days }, (_, i) => {
    const d = hashDate(now);
    return d - (dateRange.days - i - 1) * oneDay;
  });

  // bucket data by exchange
  const bucketByExchange = consensusEvents.reduce((acc, event) => {
    const [_, parsedTraderId] = event.traderId.split('0x');
    const { exchange } = traderIdExchanges[parsedTraderId] || 'Unknown';
    if (!acc[exchange]) {
      acc[exchange] = [];
    }

    acc[exchange].push(event);
    return acc;
  }, {});

  // create column series for each exchange
  const columnSeries = Object.entries(bucketByExchange).map(([exchange, data]) => {
    const chartData = transformToDailyDatapoints(data, datapoints);

    return {
      name: exchange,
      type: 'column',
      data: chartData,
      tooltip: {
        valueDecimals: 2,
      },
      dataGrouping: {
        enabled: true,
        forced: true,
        units: [['day', [dateRange.grouping]]],
      },
      color: theme.palette.text.secondary,
    };
  });

  // create chart data for cumulative volume areaspline
  const totalChartData = transformToDailyDatapoints(consensusEvents, datapoints).reduce((acc, val, i) => {
    const prev = acc[i - 1] || [0, 0];
    acc.push([val[0], val[1] + prev[1]]);
    return acc;
  }, []);

  const formatYAxis = (value) => {
    return formatNumber(value);
  };

  const options = {
    chart: {
      backgroundColor: 'transparent',
      zooming: {
        mouseWheel: false,
      },
    },
    title: {
      text: null,
    },
    series: [
      ...columnSeries.map((series) => ({
        ...series,
        yAxis: 0,
      })),
      {
        name: 'Volume',
        type: 'area',
        data: totalChartData,
        color: theme.palette.common.white,
        fillColor: {
          stops: [
            [0, `${theme.palette.common.white}80`],
            [1, `${theme.palette.common.white}00`],
          ],
        },
        dataGrouping: {
          enabled: true,
          forced: true,
          approximation: 'high',
          units: [['day', [dateRange.grouping]]],
        },
        marker: {
          enabled: false,
        },
        step: 'left',
        yAxis: 1,
      },
    ],
    yAxis: [
      {
        opposite: true,
        type: 'linear',
        gridLineWidth: 0,
        title: {
          text: null,
        },
        labels: {
          formatter() {
            const { value } = this;
            const absValue = Math.abs(value);
            let formattedValue;

            if (absValue >= 1000000000) {
              formattedValue = `${(value / 1000000000).toFixed(1)}B`;
            } else if (absValue >= 1000000) {
              formattedValue = `${(value / 1000000).toFixed(1)}M`;
            } else if (absValue >= 1000) {
              formattedValue = `${(value / 1000).toFixed(1)}K`;
            } else {
              formattedValue = value.toFixed(1);
            }

            return `$${formattedValue}`;
          },
        },
      },
      {
        opposite: false,
        type: 'linear',
        gridLineWidth: 0,
        title: {
          text: null,
        },
        labels: {
          formatter() {
            const { value } = this;
            const absValue = Math.abs(value);
            let formattedValue;

            if (absValue >= 1000000000) {
              formattedValue = `${(value / 1000000000).toFixed(1)}B`;
            } else if (absValue >= 1000000) {
              formattedValue = `${(value / 1000000).toFixed(1)}M`;
            } else if (absValue >= 1000) {
              formattedValue = `${(value / 1000).toFixed(1)}K`;
            } else {
              formattedValue = value.toFixed(1);
            }

            return `$${formattedValue}`;
          },
        },
      },
    ],
    xAxis: {
      type: 'datetime',
      labels: {
        format: '{value:%b %d}',
        style: { color: theme.palette.text.secondary },
      },
      lineWidth: 1,
      tickInterval: 7 * 24 * 3600 * 1000, // One week interval
    },
    plotOptions: {
      series: {
        animation: false,
      },
      column: {
        stacking: 'normal',
        borderRadius: 4,
        borderWidth: 0,
      },
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      outside: true,
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

  return (
    <Box sx={{ width: '100%', height: '200px' }}>
      <HighchartsReact
        containerProps={{ style: { height: '200px', width: '100%' } }}
        highcharts={Highcharts}
        options={options}
      />
    </Box>
  );
}
