import { useTheme } from '@mui/material/styles';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import React, { useLayoutEffect, useRef, useEffect, useState, useMemo } from 'react';
import { buildPausePlotBands, filterPausedData, numberWithSpaces } from '../../../../util';
import chartWatermark from '../../../../shared/chartWatermark';
import { useUserMetadata } from '../../../../shared/context/UserMetadataProvider';
import { getUserTimezone, getTimezoneAbbreviation } from '../../../../util/timezoneUtils';

function FillOrderChart({ data, orderData }) {
  const theme = useTheme();
  const { primary } = theme.palette.text;
  const { red, green, gridLines, grayTransparent } = theme.palette.charts;

  const chartComponent = useRef(null);
  const { user } = useUserMetadata();
  const userTimezone = useMemo(() => getUserTimezone(user?.preferences), [user?.preferences]);
  const tzAbbrev = useMemo(() => getTimezoneAbbreviation(userTimezone), [userTimezone]);

  const [updateOTCOnce, setUpdateOTCOnce] = useState(false);

  useLayoutEffect(() => {
    function updateSize() {
      if (chartComponent.current) {
        chartComponent.current.chart.reflow();
      }
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const isPaused = orderData.status === 'PAUSED';

  const pausePlotBands = buildPausePlotBands(data.order_pause_windows, isPaused, orderData.paused_at, theme);

  let { time_end, orig_time_end, time_start } = orderData;
  time_end = Date.parse(time_end);
  orig_time_end = Date.parse(orig_time_end);
  time_start = Date.parse(time_start);

  const last_fill_data_time =
    data.cumulative_fills_data && data.cumulative_fills_data.length > 0
      ? data.cumulative_fills_data[data.cumulative_fills_data.length - 1].x
      : 0;
  const xAxisMax = Math.max(time_end, last_fill_data_time);

  const lastOTCFillData = data.cumulative_otc_fills_data.reduce(
    (last, item) => {
      return item.x > last.x ? item : last;
    },
    { x: 0, y: 0 }
  );

  const lastOTCFillTime = lastOTCFillData.x;
  const lastOTCYValue = lastOTCFillData.y;

  const allFillsData = [...data.cumulative_passive_fills_data, ...data.cumulative_aggressive_fills_data];

  const lastFillY = allFillsData.reduce((max, item) => {
    return item.y > max ? item.y : max;
  }, 0);

  const bidAskMaxLength = time_end < orig_time_end ? orig_time_end : time_end;

  useEffect(() => {
    const { chart } = chartComponent.current;

    if (chart && lastOTCYValue !== undefined && data.cumulative_otc_fills_data.length > 0 && !updateOTCOnce) {
      const yAxis = chart.yAxis[0];
      const xPos1 = chart.xAxis[0].toPixels(lastOTCFillTime);
      const xPos2 = chart.xAxis[0].toPixels(time_end);
      const yPos1 = yAxis.toPixels(lastFillY);
      const yPos2 = yAxis.toPixels(lastOTCYValue);

      const rect = chart.renderer
        .rect(xPos1, yPos2, xPos2 - xPos1, yPos1 - yPos2)
        .attr({
          fill: 'rgba(255, 115, 0, 0.25)',
          zIndex: 3,
        })
        .add();

      setUpdateOTCOnce(true);

      return () => {
        if (rect && rect.element) {
          rect.destroy();
        }
      };
    }
    return undefined;
  }, [lastOTCFillTime, time_end, lastOTCYValue, data.cumulative_otc_fills_data.length, updateOTCOnce]); // More specific dependencies to avoid unnecessary redraws

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
      marginLeft: 80,
      marginBottom: 30,
    },
    series: [
      {
        type: 'spline',
        color: theme.palette.grey.main,
        data: filterPausedData(data.schedule_target_data, pausePlotBands),
        lineWidth: 1,
        enableMouseTracking: false,
      },
      {
        type: 'spline',
        color: theme.palette.primary.main,
        data: filterPausedData(data.schedule_target_dicy_upper, pausePlotBands),
        dashStyle: 'Dash',
        lineWidth: 1,
        enableMouseTracking: false,
      },
      {
        name: 'Cumulative Fill',
        type: 'line',
        color: primary,
        data: data.cumulative_fills_data,
        step: 'left',
        lineWidth: 1,
        enableMouseTracking: false,
      },
      {
        type: 'spline',
        color: primary,
        data: filterPausedData(data.schedule_target_lower, pausePlotBands),
        lineWidth: 1,
        dashStyle: 'Dash',
        enableMouseTracking: false,
      },
      {
        type: 'spline',
        color: primary,
        data: filterPausedData(data.schedule_target_upper, pausePlotBands),
        lineWidth: 1,
        dashStyle: 'Dash',
        enableMouseTracking: false,
      },
      {
        name: 'Maker Fill',
        type: 'scatter',
        color: green,
        borderColor: primary,
        data: data.cumulative_passive_fills_data,
        marker: {
          lineWidth: 1,
          enabled: true,
          radius: 4,
          symbol: 'circle',
        },
      },
      {
        name: 'Taker Fill',
        type: 'scatter',
        color: red,
        borderColor: primary,
        data: data.cumulative_aggressive_fills_data,
        marker: {
          lineWidth: 1,
          enabled: true,
          radius: 4,
          symbol: 'circle',
        },
      },
      {
        name: 'Cross Fills',
        type: 'scatter',
        color: theme.palette.primary.main,
        borderColor: primary,
        data: data.cumulative_cross_fills_data,
        enableMouseTracking: true,
        marker: {
          lineWidth: 1,
          enabled: true,
          radius: 4,
          symbol: 'circle',
        },
      },
      {
        name: 'OTC Fills',
        type: 'scatter',
        color: theme.palette.primary.main,
        borderColor: primary,
        data: data.cumulative_otc_fills_data,
        enableMouseTracking: true,
        marker: {
          lineWidth: 1,
          enabled: true,
          radius: 4,
          symbol: 'square',
        },
      },
    ],
    yAxis: {
      title: {
        text: 'Amount',
        style: {
          color: primary,
          fontSize: '12px',
        },
      },
      max: Number(orderData.target_order_qty),
      opposite: false,
      gridLineColor: gridLines,
      labels: {
        style: {
          color: primary,
          fontSize: '12px',
        },
        formatter() {
          // eslint-disable-next-line react/no-this-in-sfc
          return numberWithSpaces(Number(this.value));
        },
      },
    },
    xAxis: {
      type: 'datetime',
      startOnTick: false,
      endOnTick: false,
      softMax: bidAskMaxLength,
      min: time_start,
      max: xAxisMax,
      plotBands: [...pausePlotBands],
      dateTimeLabelFormats: {
        minute: '%H:%M',
      },
      labels: {
        style: {
          color: primary,
          fontSize: '12px',
        },
      },
      ordinal: false,
    },
    legend: {
      enabled: false,
      itemStyle: {
        color: primary,
        fontSize: '12px',
      },
    },
    plotOptions: {
      series: {
        allowPointSelect: false,
        states: {
          hover: {
            enabled: false,
          },
          inactive: {
            enabled: false,
          },
          select: {
            enabled: false,
          },
        },
      },
    },
    tooltip: {
      outside: true,
      shared: true,
      useHTML: true,
      formatter(point) {
        try {
          const { x, series, point: tooltipPoint } = point;
          let s = `<b><i>${Highcharts.dateFormat('%H:%M:%S', x)} ${tzAbbrev}</i></b> <b>${Highcharts.dateFormat('%Y-%m-%d', x)}</b>`;

          if (series.type === 'scatter') {
            s += `<br/>${tooltipPoint.series.name}: ${tooltipPoint.y}`;
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

  const watermarkedOptions = chartWatermark({ options });

  return (
    <HighchartsReact
      constructorType='stockChart'
      // minus pixels to account for the 38px toggle button, calc is not applicable
      containerProps={{ style: { height: '95%', marginY: '8px' } }}
      highcharts={Highcharts}
      options={watermarkedOptions}
      ref={chartComponent}
    />
  );
}

export { FillOrderChart };
