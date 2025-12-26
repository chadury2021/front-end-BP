import { useTheme } from '@emotion/react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import React, { useLayoutEffect, useRef, useMemo } from 'react';
import { buildPausePlotBands } from '../../../../util';
import chartWatermark from '../../../../shared/chartWatermark';
import { useUserMetadata } from '../../../../shared/context/UserMetadataProvider';
import { getUserTimezone } from '../../../../util/timezoneUtils';

const calculateTimeInterval = (origTimeEnd, timeStart) => {
  const timeDelta = Date.parse(origTimeEnd) - Date.parse(timeStart);
  const rawInterval = timeDelta / 5;
  const roundedInterval = Math.ceil(rawInterval / 60000) * 60000;
  return roundedInterval;
};

const timestampSplicer = (splicee, timestamps) => {
  return timestamps.map((ts, index) => {
    if (index >= splicee.length) {
      return [ts, null];
    }
    return [ts, splicee[index]];
  });
};

function PriceDifferenceChart({ data, timeStart, origTimeEnd, height }) {
  const theme = useTheme();
  const chartComponent = useRef(null);
  const { user } = useUserMetadata();
  const userTimezone = useMemo(() => getUserTimezone(user?.preferences), [user?.preferences]);

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

  if (Object.keys(data).length === 0) {
    return <div />;
  }

  const calculateYAxisBounds = () => {
    // Calculate bounds for exposure (yAxis 0)
    let exposureMax = 0;
    let exposureMin = 0;

    // Check exposure tolerance bands
    if (data.exposure_tolerance_max && data.exposure_tolerance_max.length > 0) {
      data.exposure_tolerance_max.forEach(([_, value]) => {
        if (value > exposureMax) exposureMax = value;
      });
    }

    if (data.exposure_tolerance_min && data.exposure_tolerance_min.length > 0) {
      data.exposure_tolerance_min.forEach(([_, value]) => {
        if (value < exposureMin) exposureMin = value;
      });
    }

    // Check net exposure data
    if (data.net_exposure) {
      data.net_exposure.forEach(([_, value]) => {
        if (value > exposureMax) exposureMax = value;
        if (value < exposureMin) exposureMin = value;
      });
    }

    // Calculate bounds for fills (yAxis 1)
    let fillsMax = 0;
    let fillsMin = 0;

    // Check buy fills
    if (data.fills.breakdowns.buy) {
      data.fills.breakdowns.buy.takes.forEach((value) => {
        if (value > fillsMax) fillsMax = value;
        if (value < fillsMin) fillsMin = value;
      });
      data.fills.breakdowns.buy.makes.forEach((value) => {
        if (value > fillsMax) fillsMax = value;
        if (value < fillsMin) fillsMin = value;
      });
    }

    // Check sell fills
    if (data.fills.breakdowns.sell) {
      data.fills.breakdowns.sell.takes.forEach((value) => {
        if (value > fillsMax) fillsMax = value;
        if (value < fillsMin) fillsMin = value;
      });
      data.fills.breakdowns.sell.makes.forEach((value) => {
        if (value > fillsMax) fillsMax = value;
        if (value < fillsMin) fillsMin = value;
      });
    }

    // Calculate padding for each axis
    const exposurePadding = Math.max(Math.abs(exposureMax), Math.abs(exposureMin)) * 0.1;
    const fillsPadding = Math.max(Math.abs(fillsMax), Math.abs(fillsMin)) * 0.1;

    // Ensure min and max have equal absolute values for each axis
    const exposureAbsMax = Math.max(Math.abs(exposureMax), Math.abs(exposureMin));
    const fillsAbsMax = Math.max(Math.abs(fillsMax), Math.abs(fillsMin));

    return {
      exposure: {
        min: -exposureAbsMax - exposurePadding,
        max: exposureAbsMax + exposurePadding,
      },
      fills: {
        min: -fillsAbsMax - fillsPadding,
        max: fillsAbsMax + fillsPadding,
      },
    };
  };

  const yAxisBounds = calculateYAxisBounds();

  const isPaused = data.order.status === 'PAUSED';
  const pausePlotBands = buildPausePlotBands(data.multi_order_pause_windows, isPaused, data.order.paused_at, theme);

  // Excludes first bucket to have graph be close to y axis...
  // first bucket data is usually small, which displays as a hidden bucket
  const slicedBuyFills = data.fills.breakdowns.buy
    ? {
        takes: timestampSplicer(data.fills.breakdowns.buy.takes, data.fills.timestamps).slice(1),
        makes: timestampSplicer(data.fills.breakdowns.buy.makes, data.fills.timestamps).slice(1),
      }
    : {
        takes: [],
        makes: [],
      };

  const slicedSellFills = data.fills.breakdowns.sell
    ? {
        takes: timestampSplicer(data.fills.breakdowns.sell.takes, data.fills.timestamps).slice(1),
        makes: timestampSplicer(data.fills.breakdowns.sell.makes, data.fills.timestamps).slice(1),
      }
    : {
        takes: [],
        makes: [],
      };

  const options = {
    time: {
      timezone: userTimezone,
      useUTC: false,
    },
    chart: {
      alignThresholds: true,
      animation: false,
      backgroundColor: 'transparent',
      zooming: {
        mouseWheel: false,
      },
      zoomType: null,
      marginLeft: 100,
      padding: 0,
      height,
    },
    series: [
      {
        type: 'column',
        name: 'Take',
        id: 'take-series',
        yAxis: 1,
        data: slicedBuyFills.takes,
        color: theme.palette.charts.redTransparent,
        tooltip: {
          valueDecimals: 2,
        },
        enableMouseTracking: false,
      },
      {
        type: 'column',
        name: 'Make',
        id: 'make-series',
        yAxis: 1,
        data: slicedBuyFills.makes,
        color: theme.palette.charts.greenTransparent,
        tooltip: {
          valueDecimals: 2,
        },
        enableMouseTracking: false,
      },
      {
        type: 'column',
        name: 'Take',
        yAxis: 1,
        data: slicedSellFills.takes,
        color: theme.palette.charts.redTransparent,
        id: 'take-series-sell',
        linkedTo: 'take-series', // hide/show with the primary Take series
        tooltip: {
          valueDecimals: 2,
        },
        showInLegend: false,
        enableMouseTracking: false,
      },
      {
        type: 'column',
        name: 'Make',
        yAxis: 1,
        data: slicedSellFills.makes,
        color: theme.palette.charts.greenTransparent,
        id: 'make-series-sell',
        linkedTo: 'make-series', // hide/show with the primary Make series
        tooltip: {
          valueDecimals: 2,
        },
        showInLegend: false,
        enableMouseTracking: false,
      },
      {
        type: 'line',
        name: 'Net Exposure',
        data: [...data.net_exposure],
        yAxis: 0,
        xAxis: 1,
        color: theme.palette.charts.offWhite,
        tooltip: {
          valueDecimals: 2,
        },
        step: 'left',
        lineWidth: 1.5,
      },
      ...(data.base_qty_exposure && data.base_qty_exposure.length > 0
        ? [
            {
              type: 'line',
              name: 'Base Qty Exposure',
              data: [...data.base_qty_exposure],
              yAxis: 0,
              xAxis: 1,
              color: theme.palette.charts.blue,
              tooltip: {
                valueDecimals: 2,
              },
              step: 'left',
              dashStyle: 'ShortDashDot',
            },
          ]
        : []),
      {
        type: 'line',
        name: 'Target Exposure',
        data: [...(data.exposure_center ?? [])],
        yAxis: 0,
        xAxis: 1,
        color: theme.palette.charts.warning,
        dashStyle: 'ShortDot',
      },
      {
        type: 'line',
        name: 'Exposure Tolerance Band',
        id: 'exposure-tolerance-max',
        data: [...(data.exposure_tolerance_max ?? [])],
        color: theme.palette.charts.exposureTolerance,
        dashStyle: 'Dash',
        xAxis: 1,
        yAxis: 0,
      },
      {
        type: 'line',
        name: 'Exposure Tolerance Min',
        id: 'exposure-tolerance-min',
        data: [...(data.exposure_tolerance_min ?? [])],
        color: theme.palette.charts.exposureTolerance,
        dashStyle: 'Dash',
        xAxis: 1,
        yAxis: 0,
        showInLegend: false,
        linkedTo: 'exposure-tolerance-max', // hide/show with the max tolerance band
      },
    ],
    yAxis: [
      {
        threshold: 0,
        title: {
          text: 'Imbalance ($)',
          margin: 15,
          style: {
            color: theme.palette.text.secondary,
          },
        },
        opposite: false,
        gridLines: {
          color: theme.palette.charts.gridLines,
        },
        gridLineColor: theme.palette.charts.gridLines,
        labels: {
          style: {
            color: theme.palette.text.secondary,
          },
        },
        min: yAxisBounds.exposure.min,
        max: yAxisBounds.exposure.max,
        startOnTick: false,
        endOnTick: false,
        tickAmount: 7,
      },
      {
        threshold: 0,
        title: {
          text: 'Fill Quantity',
          rotation: 270,
          margin: 15,
          style: {
            color: theme.palette.text.secondary,
          },
        },
        opposite: true,
        gridLineColor: theme.palette.charts.gridLines,
        labels: {
          style: {
            color: theme.palette.text.secondary,
          },
        },
        min: yAxisBounds.fills.min,
        max: yAxisBounds.fills.max,
        startOnTick: false,
        endOnTick: false,
        tickAmount: 7,
      },
    ],
    xAxis: [
      {
        dateTimeLabelFormats: {
          minute: '%H:%M',
        },
        ordinal: false,
        softMax: Date.parse(origTimeEnd),
        softMin: Date.parse(timeStart),
        startOnTick: false,
        endOnTick: false,
        plotBands: pausePlotBands,
        tickInterval: calculateTimeInterval(origTimeEnd, timeStart), // 4 tick intervals
        type: 'datetime',
        labels: {
          useHTML: true,
          style: {
            color: theme.palette.text.secondary,
          },
        },
      },
      {
        visible: false,
        linkedTo: 0,
        dateTimeLabelFormats: {
          minute: '%H:%M',
        },
        ordinal: false,
        softMax: Date.parse(origTimeEnd),
        softMin: Date.parse(timeStart),
        startOnTick: false,
        endOnTick: false,
        tickInterval: calculateTimeInterval(origTimeEnd, timeStart), // 4 tick intervals
        type: 'datetime',
        labels: {
          useHTML: true,
          style: {
            color: theme.palette.text.secondary,
          },
        },
      },
    ],
    plotOptions: {
      column: {
        stacking: 'normal',
        dataLabels: {
          enabled: false,
        },
        pointPadding: 0, // Minimizes the space between points within the same category
        groupPadding: 0.05, // Further reduces space between categories to make bars thicker
        borderWidth: 0,
        borderRadius: 0, // Ensures the tops of the columns are flat
      },
      series: {
        threshold: 0,
        states: {
          hover: {
            enabled: false,
          },
          inactive: {
            opacity: 1,
          },
        },
        events: {
          legendItemClick(e) {
            const series = this;
            const seriesId = series?.options?.id;
            const seriesName = series?.name;
            
            // Allow Take, Make, and Exposure Tolerance Band to toggle (linkedTo will handle linked series automatically)
            if (
              seriesId === 'take-series' ||
              seriesId === 'make-series' ||
              seriesId === 'exposure-tolerance-max' ||
              seriesName === 'Take' ||
              seriesName === 'Make' ||
              seriesName === 'Exposure Tolerance Band'
            ) {
              // Let default behavior handle the toggle
              return true;
            }
            
            // Prevent other series from toggling
            e.preventDefault();
            return false;
          },
        },
      },
      allowPointSelect: false,
    },
    legend: {
      enabled: true,
      itemStyle: {
        color: theme.palette.text.secondary,
      },
      align: 'center',
      verticalAlign: 'bottom',
      layout: 'horizontal',
      itemMarginBottom: 0, // ✅ Removes bottom padding under legend items
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

  // needs to happen conditionally, only transforms the chart options, should be fine
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const watermarkedOptions = chartWatermark({ options });

  // eslint-disable-next-line consistent-return
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <HighchartsReact
        constructorType='stockChart'
        containerProps={{ style: { height: '100%', width: '100%' } }}
        highcharts={Highcharts}
        options={watermarkedOptions}
        ref={chartComponent}
      />
    </div>
  );
}

export { PriceDifferenceChart };
