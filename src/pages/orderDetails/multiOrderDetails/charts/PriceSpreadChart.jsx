import { useTheme } from '@emotion/react';
import React, { useRef, useLayoutEffect, useMemo } from 'react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import { isEmpty } from '@/util';
import { Typography } from '@mui/material';
import chartWatermark from '../../../../shared/chartWatermark';
import { useUserMetadata } from '../../../../shared/context/UserMetadataProvider';
import { getUserTimezone, getTimezoneAbbreviation } from '../../../../util/timezoneUtils';

const calculateTimeInterval = (origTimeEnd, timeStart) => {
  const timeDelta = Date.parse(origTimeEnd) - Date.parse(timeStart);
  const rawInterval = timeDelta / 5;
  const roundedInterval = Math.ceil(rawInterval / 60000) * 60000;
  return roundedInterval;
};

function PriceSpreadChart({
  data,
  timeStart,
  origTimeEnd,
  activePlacements,
  height,
  hasDifferentBases,
  isMarketMaker,
}) {
  const chartComponent = useRef(null);
  const theme = useTheme();
  const { user } = useUserMetadata();
  const userTimezone = useMemo(() => getUserTimezone(user?.preferences), [user?.preferences]);
  const tzAbbrev = useMemo(() => getTimezoneAbbreviation(userTimezone), [userTimezone]);

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

  // Create y-axis configuration for each series when different underlying bases
  const createYAxisConfig = () => {
    if (!hasDifferentBases) {
      // Single y-axis for same underlying base
      return [
        {
          title: {
            text: 'Price',
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
          },
        },
      ];
    }

    // Separate axis for each series when different underlying bases
    return [
      {
        title: {
          style: {
            color: theme.palette.charts.green,
            fontWeight: 'bold',
          },
        },
        opposite: false,
        gridLineColor: theme.palette.charts.gridLines,
        labels: {
          style: {
            color: theme.palette.charts.green,
          },
        },
        lineColor: theme.palette.charts.green,
        tickColor: theme.palette.charts.green,
        lineWidth: 2,
      },
      {
        title: {
          style: {
            color: theme.palette.charts.red,
            fontWeight: 'bold',
          },
        },
        opposite: true,
        gridLineColor: 'transparent', // Hide grid lines for right axis
        labels: {
          style: {
            color: theme.palette.charts.red,
          },
        },
        lineColor: theme.palette.charts.red,
        tickColor: theme.palette.charts.red,
        lineWidth: 2,
        offset: 0,
      },
    ];
  };

  if (isEmpty(data)) {
    return <Typography variant='body1'>No data available</Typography>;
  }

  const getBuySeriesName = () => {
    if (isMarketMaker) return 'Bid';
    if (hasDifferentBases) return 'Long Mid Price (Series 1)';
    return 'Buy Mid Price';
  };

  const getSellSeriesName = () => {
    if (isMarketMaker) return 'Ask';
    if (hasDifferentBases) return 'Short Mid Price (Series 2)';
    return 'Sell Mid Price';
  };

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
      marginLeft: 100,
      height,
    },
    series: [
      {
        name: hasDifferentBases ? 'Long Position (Series 1)' : 'Buy Fill',
        type: 'scatter',
        color: theme.palette.charts.green,
        data: hasDifferentBases
          ? data.culminative_fills.buy
          : data.culminative_fills.buy.map((item) => ({
              x: item[0],
              y: item[1],
              quantity: item[2],
            })),
        marker: {
          enabled: true,
          radius: 3,
          symbol: 'circle',
        },
        yAxis: hasDifferentBases ? 0 : 0, // Use left axis for series 1
      },
      {
        name: hasDifferentBases ? 'Short Position (Series 2)' : 'Sell Fill',
        type: 'scatter',
        color: theme.palette.charts.red,
        data: hasDifferentBases
          ? data.culminative_fills.sell
          : data.culminative_fills.sell.map((item) => ({
              x: item[0],
              y: item[1],
              quantity: item[2],
            })),
        marker: {
          enabled: true,
          radius: 3,
          symbol: 'circle',
        },
        yAxis: hasDifferentBases ? 1 : 0, // Use right axis for series 2
      },
      // For MM orders, show single white line; for non-MM, show separate buy/sell lines
      ...(isMarketMaker
        ? [
            {
              name: 'Mid Price',
              type: 'line',
              data: data.mid_prices.buy,
              color: theme.palette.charts.lightGray,
              step: 'left',
              enableMouseTracking: false,
              yAxis: hasDifferentBases ? 0 : 0,
              lineWidth: 1,
            },
          ]
        : [
            {
              name: getBuySeriesName(),
              type: 'line',
              data: data.mid_prices.buy,
              color: theme.palette.charts.green,
              step: 'left',
              enableMouseTracking: false,
              yAxis: hasDifferentBases ? 0 : 0, // Use left axis for series 1
              lineWidth: hasDifferentBases ? 2 : 1,
            },
            {
              name: getSellSeriesName(),
              type: 'line',
              data: data.mid_prices.sell,
              color: theme.palette.charts.red,
              step: 'left',
              enableMouseTracking: false,
              yAxis: hasDifferentBases ? 1 : 0, // Use right axis for series 2
              lineWidth: hasDifferentBases ? 2 : 1,
            },
          ]),
      // Limit price history - show green for buy leg and red for sell leg
      // Convert timestamps from strings to numbers for Highcharts and deduplicate
      ...(Array.isArray(data.limit_prices?.buy) && data.limit_prices.buy.length > 0
        ? (() => {
            // Deduplicate by timestamp, keeping the last value for each timestamp
            const priceMap = new Map();
            data.limit_prices.buy.forEach(([ts, price]) => {
              const timestamp = Number(ts);
              priceMap.set(timestamp, Number(price));
            });
            const deduplicatedData = Array.from(priceMap.entries())
              .map(([ts, price]) => [ts, price])
              .sort((a, b) => a[0] - b[0]);
            return [
              {
                name: 'Bid Limit',
                type: 'line',
                data: deduplicatedData,
                color: theme.palette.charts.green,
                enableMouseTracking: false,
                yAxis: hasDifferentBases ? 0 : 0,
                lineWidth: 1,
                dashStyle: 'Dot',
                marker: { enabled: false },
                zIndex: 5,
                connectNulls: false,
              },
            ];
          })()
        : []),
      ...(Array.isArray(data.limit_prices?.sell) && data.limit_prices.sell.length > 0
        ? (() => {
            // Deduplicate by timestamp, keeping the last value for each timestamp
            const priceMap = new Map();
            data.limit_prices.sell.forEach(([ts, price]) => {
              const timestamp = Number(ts);
              priceMap.set(timestamp, Number(price));
            });
            const deduplicatedData = Array.from(priceMap.entries())
              .map(([ts, price]) => [ts, price])
              .sort((a, b) => a[0] - b[0]);
            return [
              {
                name: 'Ask Limit',
                type: 'line',
                data: deduplicatedData,
                color: theme.palette.charts.red,
                enableMouseTracking: false,
                yAxis: hasDifferentBases ? 1 : 0,
                lineWidth: 1,
                dashStyle: 'Dot',
                marker: { enabled: false },
                zIndex: 5,
                connectNulls: false,
              },
            ];
          })()
        : []),
      {
        name: hasDifferentBases ? 'Long Placements (Series 1)' : 'Active Placements',
        type: 'scatter',
        data: activePlacements
          .filter((e) => e[2] === 'buy')
          .map((e) => ({
            x: e[0],
            y: e[1],
            marker: {
              symbol: 'triangle',
            },
          })),
        color: theme.palette.charts.orange,
        marker: {
          enabled: true,
          radius: 4,
        },
        legend: false,
        yAxis: hasDifferentBases ? 0 : 0, // Use left axis for series 1
      },
      {
        name: hasDifferentBases ? 'Short Placements (Series 2)' : 'Active Placements',
        type: 'scatter',
        data: activePlacements
          .filter((e) => e[2] === 'sell')
          .map((e) => ({
            x: e[0],
            y: e[1],
            marker: {
              symbol: 'triangle-down',
            },
          })),
        color: theme.palette.charts.orange,
        marker: {
          enabled: true,
          radius: 4,
        },
        legend: false,
        yAxis: hasDifferentBases ? 1 : 0, // Use right axis for series 2
      },
    ],
    yAxis: createYAxisConfig(),
    xAxis: {
      type: 'datetime',
      startOnTick: false,
      endOnTick: false,
      softMax: Date.parse(origTimeEnd),
      min: Date.parse(timeStart),
      tickInterval: calculateTimeInterval(origTimeEnd, timeStart), // 4 tick intervals
      dateTimeLabelFormats: {
        minute: '%H:%M',
      },
      labels: {
        style: {
          color: theme.palette.text.secondary,
        },
      },
      ordinal: false,
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      outside: true,
      shared: true,
      useHTML: true,
      valueDecimals: 4,
      formatter() {
        try {
          const { series, x } = this;
          let s = `<div>${Highcharts.dateFormat('%B %e, %H:%M:%S', x)} ${tzAbbrev}`;

          const { point } = this;
          s += `<br/>${point.series.name}: <b>${point.y}</b>`;
          // Format quantity as a number with appropriate decimal places
          if (point.quantity !== undefined) {
            const quantity = Number(point.quantity);
            // Use 6 decimal places for precision, but remove trailing zeros
            const formattedQuantity = quantity.toFixed(6).replace(/\.?0+$/, '');
            s += `<br/>Quantity: <b>${formattedQuantity}</b>`;
          }

          s += '</div>';

          return s;
        } catch (err) {
          return false;
        }
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

export { PriceSpreadChart };
