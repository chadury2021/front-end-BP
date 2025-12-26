import React from 'react';
import { useTheme } from '@mui/material/styles';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';

function PointsChart({ pointsData, dateRange }) {
  const theme = useTheme();

  // Safety check to prevent rendering if dateRange is not properly defined
  if (!dateRange) {
    return null;
  }

  // Safety check to ensure pointsData is an array, but allow empty arrays
  if (!Array.isArray(pointsData)) {
    return null;
  }

  // Format the data, handling empty arrays gracefully
  const formattedPointsData = pointsData.map((point) => [
    new Date(point.earned_date).getTime(),
    parseFloat(point.points_earned),
  ]);

  const options = {
    chart: {
      backgroundColor: 'transparent',
      zooming: {
        mouseWheel: false,
      },
    },
    series: [
      {
        type: 'column',
        name: 'Points',
        data: formattedPointsData,
        tooltip: {
          valueDecimals: 2,
        },
        dataGrouping: {
          enabled: true,
          forced: true,
          units: [['day', [dateRange?.grouping || 1]]],
        },
      },
    ],
    yAxis: {
      opposite: false,
      type: 'linear',
      gridLineWidth: 0,
      labels: {
        style: {
          color: theme.palette.charts.gray,
        },
      },
      lineWidth: 2,
      tickWidth: 2,
    },
    xAxis: {
      type: 'datetime',
      labels: {
        format: '{value:%m-%d}',
        style: {
          color: theme.palette.charts.gray,
        },
      },
      lineWidth: 2,
    },
    plotOptions: {
      series: {
        animation: false,
      },
      column: {
        color: theme.palette.charts.points,
        borderRadius: 8,
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

  return (
    <HighchartsReact
      constructorType='stockChart'
      containerProps={{ style: { height: '100%' } }}
      highcharts={Highcharts}
      options={options}
    />
  );
}

export default PointsChart;
