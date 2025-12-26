import { useTheme } from '@emotion/react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { buildPausePlotBands, smartRound } from '@/util';
import chartWatermark from '@/shared/chartWatermark';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { getUserTimezone, getTimezoneAbbreviation } from '@/util/timezoneUtils';

const calculateTimeInterval = (origTimeEnd, timeStart) => {
  const timeDelta = Date.parse(origTimeEnd) - Date.parse(timeStart);
  const rawInterval = timeDelta / 5;
  const roundedInterval = Math.ceil(rawInterval / 60000) * 60000;
  return roundedInterval;
};

function BidAskChart({
  bidState,
  askState,
  passiveFillState,
  aggroFillState,
  crossFillState,
  orderStats,
  limitHistory,
  isPov,
  avgPriceLine,
  vwapLine,
  orderData,
  analytics,
  activePlacements,
}) {
  let { time_end, orig_time_end, time_start } = orderStats;
  time_end = Date.parse(time_end);
  orig_time_end = Date.parse(orig_time_end);
  time_start = Date.parse(time_start);

  const chartComponent = useRef(null);
  const theme = useTheme();
  const { user } = useUserMetadata();
  const userTimezone = useMemo(() => getUserTimezone(user?.preferences), [user?.preferences]);
  const tzAbbrev = useMemo(() => getTimezoneAbbreviation(userTimezone), [userTimezone]);

  const isPaused = orderData && orderData.status === 'PAUSED';
  const pausePlotBands =
    orderData && Object.keys(analytics).length > 0
      ? buildPausePlotBands(analytics.order_pause_windows, isPaused, orderData.paused_at, theme)
      : [];

  useLayoutEffect(() => {
    function updateSize() {
      chartComponent.current.chart.reflow();
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const bidAskMaxLength = time_end < orig_time_end ? orig_time_end : time_end;

  const parseOTCFills = (OTCanalytics) => {
    if (OTCanalytics.cumulative_otc_fills_data && analytics.cumulative_otc_fills_data.length > 0) {
      return OTCanalytics.cumulative_otc_fills_data.map((e) => [e.x, e.price]);
    }
    return [];
  };

  const otcFillData = parseOTCFills(analytics);

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
      marginRight: isPov ? 80 : 0,
      spacing: [10, 10, -5, 10],
      marginLeft: 100,
    },
    series: [
      {
        name: 'Maker Fill',
        type: 'scatter',
        color: theme.palette.success.main,
        data: passiveFillState,
        marker: {
          enabled: true,
          radius: 3,
          symbol: 'circle',
        },
      },
      {
        name: 'Taker Fill',
        type: 'scatter',
        color: theme.palette.error.main,
        data: aggroFillState,
        marker: {
          enabled: true,
          radius: 3,
          symbol: 'circle',
        },
      },
      {
        name: 'OTC Fill',
        type: 'scatter',
        color: theme.palette.charts.OTC,
        data: otcFillData,
        showInLegend: otcFillData.length > 0,
        marker: {
          enabled: true,
          radius: 4,
          symbol: 'square',
        },
      },
      {
        name: 'Cross Fill',
        type: 'scatter',
        color: theme.palette.charts.OTC,
        data: crossFillState,
        showInLegend: crossFillState.length > 0,
        marker: {
          enabled: true,
          radius: 3,
          symbol: 'circle',
        },
      },
      {
        name: 'Bid',
        type: 'line',
        data: bidState,
        color: theme.palette.charts.greenTransparent,
        step: 'left',
        enableMouseTracking: true,
        lineWidth: 1,
      },
      {
        name: 'Ask',
        type: 'line',
        data: askState,
        color: theme.palette.charts.redTransparent,
        step: 'left',
        enableMouseTracking: true,
        lineWidth: 1,
      },
      {
        name: 'Average Executed Price',
        type: 'line',
        color: theme.palette.charts.gray,
        data: orderStats.executed_price
          ? [
              [time_start, Number(orderStats.executed_price)],
              ...avgPriceLine,
              [bidAskMaxLength, Number(orderStats.executed_price)],
            ]
          : [],
        connectNulls: true,
        dashStyle: 'Dash',
        enableMouseTracking: true,
        lineWidth: 1,
      },
      {
        name: 'VWAP',
        type: 'line',
        color: theme.palette.charts.pinkTransparent,
        data: [[time_start, Number(orderStats.vwap)], ...vwapLine, [bidAskMaxLength, Number(orderStats.vwap)]],
        connectNulls: true,
        dashStyle: 'Dash',
        enableMouseTracking: true,
        lineWidth: 1,
      },
      {
        name: 'Active Placements',
        type: 'scatter',
        data: activePlacements.map((e) => ({
          x: e[0],
          y: e[1],
          marker: {
            symbol: e[2] === 'buy' ? 'triangle' : 'triangle-down',
          },
        })),
        color: theme.palette.charts.orange,
        marker: {
          enabled: true,
          radius: 4,
        },
        legend: true,
      },
      ...(limitHistory
        ? [
            {
              name: 'Limit Price',
              type: 'line',
              color: theme.palette.charts.orangeTransparent,
              data: limitHistory,
              step: 'before',
              lineWidth: 1,
            },
          ]
        : []),
    ],
    yAxis: {
      title: {
        text: 'Price',
        style: {
          color: theme.palette.text.primary,
          fontSize: '12px',
        },
      },
      opposite: false,
      gridLineColor: theme.palette.charts.gridLines,
      labels: {
        style: {
          color: theme.palette.text.primary,
          fontSize: '12px',
        },
      },
    },
    xAxis: {
      type: 'datetime',
      startOnTick: false,
      endOnTick: false,
      softMax: bidAskMaxLength,
      plotBands: pausePlotBands,
      min: time_start,
      dateTimeLabelFormats: {
        minute: '%H:%M',
      },
      tickInterval: calculateTimeInterval(orderStats.orig_time_end, orderStats.time_start), // 4 tick intervals
      labels: {
        style: {
          color: theme.palette.text.primary,
        },
      },
      ordinal: false,
    },
    legend: {
      enabled: true,
      itemStyle: {
        color: theme.palette.text.primary,
        fontSize: '12px',
      },
    },
    // plotOptions: {},
    tooltip: {
      outside: true,
      shared: true,
      useHTML: true,
      formatter() {
        try {
          const { series, x } = this;
          let s = `<b><i>${Highcharts.dateFormat('%H:%M:%S', x)} ${tzAbbrev}</i></b> <b>${Highcharts.dateFormat('%Y-%m-%d', x)}</b>`;

          if (series.type === 'scatter') {
            const { point } = this;
            s += `<br/>${point.series.name}: ${smartRound(point.y, 2)}`;
            s += `<br/>Average Executed Price: ${smartRound(Number(orderStats.executed_price), 2)}`;
            s += `<br/>VWAP: ${smartRound(Number(orderStats.vwap), 2)}`;
            return s;
          }

          if (series.type === 'line') {
            const { points } = this;
            // so that ask goes on top of bid
            points.reverse();
            points.forEach((point) => {
              if (point && point.y !== null) {
                s += `<br/>${point.series.name}: ${smartRound(point.y, 2)}`;
              }
            });
            return s;
          }

          return '';
        } catch (err) {
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
    marginRight: isPov ? 80 : 0,
  });

  return (
    <HighchartsReact
      constructorType='stockChart'
      /* Temporary fix,
      Has to be a flat amount until we have a parent container that passes
      both the width of y axis labels and height of chart so it can half of it
      */
      containerProps={{ style: { height: '90%' } }}
      highcharts={Highcharts}
      options={watermarkedOptions}
      ref={chartComponent}
    />
  );
}

export { BidAskChart };
