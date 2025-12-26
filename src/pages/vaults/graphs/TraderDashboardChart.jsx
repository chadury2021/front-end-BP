import React from 'react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import { useTheme } from '@mui/material';
import { transformEventsToChartData } from './utils';

const oneDay = 24 * 60 * 60 * 1000;

function hashDate(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function transformToDailyDatapoints(events, datapoints) {
  const dailyValues = (events || []).reduce((acc, event) => {
    const { timestamp, data } = event;
    const date = new Date(timestamp);
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

  const exchangeColors = {
    OKX: theme.palette.exchangeColors?.OKX || 'rgb(169, 169, 169)',
    Binance: theme.palette.exchangeColors?.Binance || 'rgb(230, 181, 26)',
    BinancePM: theme.palette.exchangeColors?.BinancePM || 'rgb(230, 181, 26)',
    Bybit: theme.palette.exchangeColors?.Bybit || 'rgb(230, 138, 26)',
    Deribit: theme.palette.exchangeColors?.Deribit || 'rgb(51, 204, 204)',
    Coinbase: theme.palette.exchangeColors?.Coinbase || 'rgb(26, 127, 229)',
    MockExchange: theme.palette.exchangeColors?.MockExchange || 'rgb(255, 255, 255)',
    OKXOTC: theme.palette.exchangeColors?.OKX || 'rgb(169, 169, 169)',
    Hyperliquid: theme.palette.exchangeColors?.Hyperliquid || '#95fce4',
    default: theme.palette.charts?.offWhite || '#ffffff',
  };

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
      color: exchangeColors[exchange] || exchangeColors.OKX,
    };
  });

  // create chart data for cumulative volume areaspline
  const totalChartData = transformToDailyDatapoints(consensusEvents, datapoints).reduce((acc, val, i) => {
    const prev = acc[i - 1] || [0, 0];
    acc.push([val[0], val[1] + prev[1]]);
    return acc;
  }, []);

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
      ...columnSeries,
      {
        name: 'Volume',
        type: 'area',
        data: totalChartData,
        color: theme.palette.primary.main,
        fillColor: {
          stops: [
            [0, `${theme.palette.primary.main}80`],
            [1, `${theme.palette.primary.main}00`],
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
      },
    ],
    yAxis: {
      opposite: false,
      type: 'linear',
      gridLineWidth: 0,
      labels: {
        style: {
          color: theme.palette.text.secondary,
        },
      },
      lineWidth: 1,
      tickWidth: 1,
      title: {
        text: null,
      },
    },
    xAxis: {
      type: 'datetime',
      labels: {
        format: '{value:%m-%d}',
        style: { color: theme.palette.text.secondary },
      },
      lineWidth: 1,
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
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'top',
      itemStyle: {
        color: theme.palette.text.secondary,
        fontFamily: ['IBM PLEX MONO'].join(','),
        fontSize: '11px',
      },
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

  return <HighchartsReact containerProps={{ style: { height: '100%' } }} highcharts={Highcharts} options={options} />;
}
