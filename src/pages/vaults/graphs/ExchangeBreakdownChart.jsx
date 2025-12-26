import React from 'react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import { useTheme } from '@mui/material';
import { transformEventsToChartData } from './utils';

const oneDay = 24 * 60 * 60 * 1000;

function hashDate(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export default function ExchangeBreakdownChart({ chartData, dateRange }) {
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

  const now = new Date();
  const datapoints = Array.from({ length: dateRange.days }, (_, i) => {
    const d = hashDate(now);
    return d - (dateRange.days - i) * oneDay;
  });

  const series = Object.entries(chartData).map(([exchange, data]) => {
    const dailyValues = (transformEventsToChartData(data) || []).reduce((acc, [timestamp, value]) => {
      const date = new Date(timestamp);
      const dayTimestamp = hashDate(date);
      acc[dayTimestamp] = (acc[dayTimestamp] || 0) + value;
      return acc;
    }, {});

    const result = datapoints.map((ts) => {
      return [ts, dailyValues[ts] || 0];
    });

    return {
      name: exchange,
      type: 'column',
      data: result,
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
    series,
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
