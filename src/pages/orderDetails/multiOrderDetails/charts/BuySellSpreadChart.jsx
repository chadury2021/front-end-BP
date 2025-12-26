/* eslint-disable react/no-this-in-sfc */
import { useTheme } from '@emotion/react';
import React, { useRef, useLayoutEffect } from 'react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import chartWatermark from '../../../../shared/chartWatermark';

const calculateTimeInterval = (origTimeEnd, timeStart) => {
  const timeDelta = Date.parse(origTimeEnd) - Date.parse(timeStart);
  const rawInterval = timeDelta / 5;
  const roundedInterval = Math.ceil(rawInterval / 60000) * 60000;
  return roundedInterval;
};

function BuySellSpreadChart({ data, timeStart, origTimeEnd, height, hasDifferentBases }) {
  const chartComponent = useRef(null);
  const theme = useTheme();

  const getLimitSpreadMin = () => {
    if (data.limit_spread_cost && data.spread_prices.length > 0) {
      const min = Math.min(...data.spread_prices.map((x) => x[1]));
      if (data.limit_spread_cost < min) {
        return data.limit_spread_cost;
      }
      return min;
    }
    return undefined;
  };

  const getLimitSpreadMax = () => {
    if (data.limit_spread_cost && data.spread_prices.length > 0) {
      const max = Math.max(...data.spread_prices.map((x) => x[1]));
      if (data.limit_spread_cost > max) {
        return data.limit_spread_cost;
      }
      return max;
    }
    return undefined;
  };

  // Convert bps to price ratio for different base currencies
  const convertBpsToRatio = (bps) => {
    if (!hasDifferentBases) return bps;
    // Convert from bps (basis points) to ratio
    // bps = (sell_price - buy_price) / buy_price * 10000
    // ratio = sell_price / buy_price = 1 + (bps / 10000)
    return 1 + (bps / 10000);
  };

  // Format y-axis labels for different base currencies
  const formatYAxisLabel = (value) => {
    if (!hasDifferentBases) return value;
    // For different bases, show as ratio (e.g., 100:1, 1:25)
    const ratio = convertBpsToRatio(value);
    if (ratio >= 1) {
      // When sell price >= buy price, show as X:1
      if (ratio >= 100) {
        return `${Math.round(ratio)}:1`;
      }
      if (ratio >= 10) {
        return `${ratio.toFixed(1)}:1`;
      }
      return `${ratio.toFixed(2)}:1`;
    }
    // When sell price < buy price, show as 1:X
    const inverseRatio = 1 / ratio;
    if (inverseRatio >= 100) {
      return `1:${Math.round(inverseRatio)}`;
    }
    if (inverseRatio >= 10) {
      return `1:${inverseRatio.toFixed(1)}`;
    }
    return `1:${inverseRatio.toFixed(2)}`;
  };

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

  const options = {
    chart: {
      animation: false,
      backgroundColor: 'transparent',
      zooming: {
        mouseWheel: false,
      },
      zoomType: null,
      marginLeft: 100,
      height,
    },
    series: [
      {
        name: 'Limit Spread',
        type: 'line',
        color: theme.palette.charts.orangeTransparent,
        step: 'left',
        enableMouseTracking: false,
        dashStyle: 'Dash',
      },
      {
        name: 'Price Spread',
        type: 'line',
        data: data.spread_prices,
        color: theme.palette.charts.offWhite,
        step: 'left',
        enableMouseTracking: false,
      },
      {
        name: 'Buy Fill',
        type: 'scatter',
        color: theme.palette.charts.green,
        marker: {
          enabled: true,
          radius: 3,
          symbol: 'circle',
        },
      },
      {
        name: 'Sell Fill',
        type: 'scatter',
        color: theme.palette.charts.red,
        marker: {
          enabled: true,
          radius: 3,
          symbol: 'circle',
        },
      },
      {
        name: 'Buy Mid Price',
        type: 'line',
        color: theme.palette.charts.greenTransparent,
        step: 'left',
        enableMouseTracking: false,
      },
      {
        name: 'Sell Mid Price',
        type: 'line',
        color: theme.palette.charts.redTransparent,
        step: 'left',
        enableMouseTracking: false,
      },
    ],
    yAxis: {
      title: {
        text: hasDifferentBases ? 'Sell-Buy Spread (Ratio)' : 'Sell-Buy Spread (bps)',
        style: {
          color: theme.palette.text.secondary,
        },
      },
      opposite: false,
      gridLineColor: theme.palette.charts.gridLines,
      labels: {
        style: {
          color: theme.palette.text.secondary,
        },
        // eslint-disable-next-line react/no-this-in-sfc, object-shorthand
        formatter: function yAxisLabelFormatter() {
          if (hasDifferentBases) {
            return formatYAxisLabel(this.value);
          }
          return Highcharts.numberFormat(this.value, 2);
        },
      },
      softMin: getLimitSpreadMin(),
      softMax: getLimitSpreadMax(),
      plotLines: [
        {
          width: 2,
          color: theme.palette.charts.orangeTransparent,
          value: data.limit_spread_cost,
          dashStyle: 'Dash',
          zIndex: 1,
        },
        {
          color: theme.palette.charts.lightGray,
          value: hasDifferentBases ? 1 : 0,
          width: 2,
          zIndex: 1,
        },
      ],
    },
    xAxis: {
      type: 'datetime',
      visable: false,
      startOnTick: false,
      endOnTick: false,
      softMax: Date.parse(origTimeEnd),
      min: Date.parse(timeStart),
      tickInterval: calculateTimeInterval(origTimeEnd, timeStart), // 4 tick intervals
      dateTimeLabelFormats: {
        minute: '%H:%M',
      },
      labels: {
        enabled: false, // This hides the labels
      },
      tickLength: 0, // This hides the ticks
      ordinal: false,
    },
    legend: {
      enabled: true,
      itemStyle: {
        color: theme.palette.text.secondary,
      },
    },
    plotOptions: {
      series: {
        keys: ['x', 'y', 'quantity'],
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
      containerProps={{ style: { height: '50%' } }}
      highcharts={Highcharts}
      options={watermarkedOptions}
      ref={chartComponent}
    />
  );
}

export { BuySellSpreadChart };
