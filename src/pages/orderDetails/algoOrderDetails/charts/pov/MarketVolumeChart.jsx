import { useTheme } from '@emotion/react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import React, { useLayoutEffect, useRef, useMemo } from 'react';
import chartWatermark from '../../../../../shared/chartWatermark';
import { useUserMetadata } from '../../../../../shared/context/UserMetadataProvider';
import { getUserTimezone, getTimezoneAbbreviation } from '../../../../../util/timezoneUtils';

const calculateTimeInterval = (origTimeEnd, timeStart) => {
  const timeDelta = Date.parse(origTimeEnd) - Date.parse(timeStart);
  const rawInterval = timeDelta / 5;
  const roundedInterval = Math.ceil(rawInterval / 60000) * 60000;
  return roundedInterval;
};

function MarketVolumeChart({ executedVolume, volume, origTimeEnd, timeStart }) {
  const theme = useTheme();
  const { primary } = theme.palette.text;
  const { blue, gray, green, red, gridLines } = theme.palette.charts;
  const chartComponent = useRef(null);
  const { user } = useUserMetadata();
  const userTimezone = useMemo(() => getUserTimezone(user?.preferences), [user?.preferences]);
  const tzAbbrev = useMemo(() => getTimezoneAbbreviation(userTimezone), [userTimezone]);

  useLayoutEffect(() => {
    function updateSize() {
      chartComponent.current.chart.reflow();
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

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
      marginRight: 60,
      spacingBottom: 10,
      marginLeft: 90,
    },
    series: [
      // show Market Volumn first, so that it's behind the Target Volume
      // ref: https://stackoverflow.com/questions/37179442/column-behind-column-highchart
      {
        type: 'column',
        name: 'Market Volume',
        data: volume,
        color: blue,
        tooltip: {
          valueDecimals: 4,
        },
      },
      {
        type: 'column',
        name: 'Executed Volume',
        data: executedVolume,
        color: gray,
        tooltip: {
          valueDecimals: 4,
        },
      },
      {
        name: 'Maker Fills',
        data: [],
        color: green,
      },
      {
        name: 'Taker Fills',
        data: [],
        color: red,
      },
      {
        type: 'spline',
        name: 'Realized Participation Rate',
        data: [[1711389780000, null]],
        color: primary,
      },
      {
        type: 'line',
        name: 'Target',
        data: [[1711389780000, null]],
        color: gray,
        dashStyle: 'Dash',
      },
    ],
    yAxis: {
      title: {
        text: 'Market Volume',
        style: {
          color: primary,
          fontSize: '12px',
        },
      },
      opposite: false,
      gridLineColor: gridLines,
      labels: {
        style: {
          color: primary,
          fontSize: '12px',
        },
      },
    },
    xAxis: {
      startOnTick: false,
      dateTimeLabelFormats: {
        minute: '%H:%M',
      },
      softMax: Date.parse(origTimeEnd),
      min: Date.parse(timeStart),
      endOnTick: false,
      tickInterval: calculateTimeInterval(origTimeEnd, timeStart), // 4 tick intervals
      type: 'datetime',
      labels: {
        style: {
          color: primary,
          fontSize: '12px',
        },
      },
    },
    plotOptions: {
      column: {
        pointStart: Date.parse(timeStart),
        pointPadding: 0, // Minimizes the space between points within the same category
        groupPadding: 0.1, // Adjust this to set the space between categories
        borderWidth: 0,
        borderRadius: 0, // Ensures the tops of the columns are flat
        grouping: false, // Ensures that the columns are on top of each other
      },
    },
    legend: {
      enabled: true,
      itemStyle: {
        color: primary,
        fontSize: '12px',
      },
    },
    tooltip: {
      outside: true,
      shared: true,
      useHTML: true,

      formatter() {
        try {
          const { x, points } = this;
          const timestampString = Highcharts.dateFormat('%H:%M:%S', x);
          const dateString = Highcharts.dateFormat('%Y-%m-%d', x);
          let s = `<b><i>${timestampString} ${tzAbbrev}</i></b> <b>${dateString}</b>`;

          return points.reduce((acc, { series, point }) => {
            const pointSeries = point.series;
            s += '<br/>';
            try {
              const legendHtml = pointSeries.legendItem.legendHTML;
              const legendSymbol = `<svg width='20' height='20'> ${legendHtml}</svg>`;
              s += `${legendSymbol} `;
            } catch (err) {
              console.error('Got error in legendSymbol: ', err);
            }
            // Add the series name and value
            s += `${pointSeries.name}: ${point.y.toFixed(4)}`;
            return s;
          }, s);
        } catch (err) {
          console.error('Error in MarketVolumeChart tooltip formatter: ', err);
          return false;
        }
      },
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

  const watermarkedOptions = chartWatermark({
    options,
    position: 'bottom-right',
  });

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

export { MarketVolumeChart };
