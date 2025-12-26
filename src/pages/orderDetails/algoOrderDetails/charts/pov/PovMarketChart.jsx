import { useTheme } from '@emotion/react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { buildPausePlotBands } from '../../../../../util';
import chartWatermark from '../../../../../shared/chartWatermark';
import { useUserMetadata } from '../../../../../shared/context/UserMetadataProvider';
import { getUserTimezone } from '../../../../../util/timezoneUtils';

const calculateTimeInterval = (origTimeEnd, timeStart) => {
  const timeDelta = Date.parse(origTimeEnd) - Date.parse(timeStart);
  const rawInterval = timeDelta / 5;
  const roundedInterval = Math.ceil(rawInterval / 60000) * 60000;
  return roundedInterval;
};

function PovMarketChart({ fills, pov, povTargetLine, origTimeEnd, timeStart, povTarget, orderData, analytics }) {
  const theme = useTheme();
  const { red, green, orange, offWhite, gray, gridLines } = theme.palette.charts;
  const { primary } = theme.palette.text;
  const chartComponent = useRef(null);
  const { user } = useUserMetadata();
  const userTimezone = useMemo(() => getUserTimezone(user?.preferences), [user?.preferences]);

  useLayoutEffect(() => {
    function updateSize() {
      chartComponent.current.chart.reflow();
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const isPaused = orderData.status === 'PAUSED';

  const pausePlotBands = buildPausePlotBands(analytics.order_pause_windows, isPaused, orderData.paused_at, theme);

  const options = {
    time: {
      timezone: userTimezone,
      useUTC: false,
    },
    chart: {
      animation: false,
      backgroundColor: 'transparent',
      zooming: {
        mouseWheel: false,
      },
      zoomType: null,
      marginLeft: 90,
      marginRight: 60,
      style: {
        fontSize: '12px',
      },
    },
    series: [
      {
        type: 'column',
        name: 'Take',
        yAxis: 0,
        data: fills.take,
        color: red,
        tooltip: {
          valueDecimals: 4,
        },
      },
      {
        type: 'column',
        name: 'Make',
        yAxis: 0,
        data: fills.make,
        color: green,
        tooltip: {
          valueDecimals: 4,
        },
      },
      {
        type: 'column',
        name: 'Cross',
        yAxis: 0,
        data: fills.cross,
        color: orange,
        tooltip: {
          valueDecimals: 4,
        },
      },
      {
        type: 'spline',
        name: 'Participation Rate',
        data: pov,
        yAxis: 1,
        color: offWhite,
        tooltip: {
          valueDecimals: 2,
        },
      },
      {
        type: 'line',
        name: 'Target',
        yAxis: 1,
        data: povTargetLine,
        color: gray,
        tooltip: {
          valueDecimals: 2,
        },
        dashStyle: 'Dash',
      },
    ],
    yAxis: [
      {
        title: {
          text: 'Fill Quantity',
          style: {
            color: primary,
          },
        },
        opposite: false,
        gridLineColor: gridLines,
        labels: {
          style: {
            color: primary,
          },
        },
        startOnTick: false,
      },
      {
        title: {
          text: 'Participation Rate (%)',
          rotation: 270,
          margin: 15,
          style: {
            color: primary,
          },
        },
        min: 0,
        max: povTarget * 100 * 2,
        opposite: true,
        gridLineColor: gridLines,
        labels: {
          style: {
            color: primary,
          },
        },
        startOnTick: false,
      },
    ],
    xAxis: {
      startOnTick: false,
      dateTimeLabelFormats: {
        minute: '%H:%M',
      },
      ordinal: false,
      softMax: Date.parse(origTimeEnd),
      min: Date.parse(timeStart),
      endOnTick: false,
      tickInterval: calculateTimeInterval(origTimeEnd, timeStart), // 4 tick intervals
      plotBands: pausePlotBands,
      type: 'datetime',
      labels: {
        useHTML: true,
        style: {
          color: primary,
        },
      },
    },
    plotOptions: {
      column: {
        pointStart: Date.parse(timeStart),
        stacking: 'normal',
        dataLabels: {
          enabled: false,
        },
        pointPadding: 0, // Minimizes the space between points within the same category
        groupPadding: 0.1, // Adjust this to set the space between categories (0.1 is just an example)
        borderWidth: 0,
        borderRadius: 0, // Ensures the tops of the columns are flat
      },
    },
    tooltip: {
      outside: true,
      shared: true,
      useHTML: true,
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

  const watermarkedOptions = chartWatermark({ options });

  return (
    <HighchartsReact
      constructorType='stockChart'
      containerProps={{ style: { height: '100%' } }}
      highcharts={Highcharts}
      options={watermarkedOptions}
      ref={chartComponent}
    />
  );
}

export { PovMarketChart };
