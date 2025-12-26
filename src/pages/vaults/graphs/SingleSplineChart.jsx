import React from 'react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import { useTheme } from '@mui/material';
import { transformEventsToChartData } from './utils';

Highcharts.setOptions({
  chart: {
    backgroundColor: 'transparent',
  },
});

// secondary color will be defined inside the component

const splineOptions = ({ theme, dataA = [], dataB = [], nameA = 'Series A', nameB = 'Series B' }) => {
  const secondary = theme.palette.primary.dark;
  return {
    chart: {
      type: 'areaspline',
      backgroundColor: 'transparent',
    },

    title: {
      text: null,
    },

    xAxis: {
      title: {
        text: null,
      },
      type: 'datetime',
      gridLineWidth: 0,
      lineWidth: 1,
      tickInterval: 24 * 3600 * 1000,
      labels: {
        formatter() {
          return Highcharts.dateFormat('%a %e', this.value);
        },
        style: { color: theme.palette.text.secondary },
      },
      gridLineColor: 'rgba(255, 255, 255, 0.2)',
    },
    yAxis: {
      title: {
        text: null,
      },
      gridLineWidth: 0,
      lineWidth: 1,
      labels: {
        formatter() {
          const { value } = this;
          if (Math.abs(value >= 1000000)) {
            return `${this.value / 1000000}M`;
          }
          return value;
        },
        style: { color: theme.palette.text.secondary },
      },
      gridLineColor: 'rgba(255, 255, 255, 0.2)',
    },
    legend: {
      enabled: false,
    },
    credits: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      shared: true,
      crosshairs: true,
      valueDecimals: 2,
      xDateFormat: '%A, %b %e, %Y',
    },
    plotOptions: {
      series: {
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: true,
            },
          },
        },
        states: {
          hover: {
            lineWidthPlus: 1,
          },
        },
      },
      areaspline: {
        fillOpacity: 0.3,
      },
    },
    series: [
      {
        name: nameA,
        data: dataA,
        color: theme.palette.primary.main,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, `${theme.palette.primary.main}80`],
            [1, `${theme.palette.primary.main}00`],
          ],
        },
      },
      dataB && {
        name: nameB,
        data: dataB,
        color: secondary,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, `${secondary}80`],
            [1, `${secondary}00`],
          ],
        },
      },
    ],
  };
};
/**
 * A component that renders a spline chart using Highcharts.
 *
 * @component
 * @param {Object} props - The component props
 * @param {Array} props.dataA - Primary data series for the chart in format [[timestamp, value], ...].
 *                             Will be rendered with the primary theme color.
 * @param {string} [props.nameA="Series A"] - Name for the primary data series.
 * @param {Array} [props.dataB] - Optional secondary data series in the same format as dataA.
 *                               Will be rendered with a secondary color if provided.
 * @param {string} [props.nameB="Series B"] - Name for the secondary data series.
 * @param {string} [props.description=null] - Optional description for debugging.
 * @returns {React.ReactElement} A Highcharts spline chart component
 */
function SplineChart({ dataA, dataB, nameA = 'Series A', nameB = 'Series B', description = null }) {
  const theme = useTheme();

  // Ensure we have valid data arrays
  const validDataA = Array.isArray(dataA) ? dataA : [];
  const validDataB = Array.isArray(dataB) ? dataB : [];

  if (validDataA.length === 0) {
    // No data to render
  } else {
    const firstDataPoint = validDataA[0];
    const lastDataPoint = validDataA[validDataA.length - 1];
    // Debug first timestamp & last timestamp
    const firstTimestamp = firstDataPoint[0];
    const lastTimestamp = lastDataPoint[0];
    // Debug timestamps
  }

  // Transform to have cumulative datapoints
  const cumulativeData = transformEventsToChartData(validDataA).reduce((acc, val, i) => {
    const prev = acc[i - 1] || [0, 0];
    acc.push([val[0], val[1] + prev[1]]);
    return acc;
  }, []);

  console.debug('[SplineChart] rendering description:', description, 'with dataA', validDataA, 'and dataB', validDataB);

  return (
    <HighchartsReact
      containerProps={{ style: { height: '100%' } }}
      highcharts={Highcharts}
      options={splineOptions({
        theme,
        dataA: cumulativeData,
        dataB: validDataB,
        nameA,
        nameB,
      })}
    />
  );
}

export default SplineChart;
