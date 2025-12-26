/* eslint-disable react/no-this-in-sfc */
import { useTheme } from '@emotion/react';
import React, { useRef, useLayoutEffect, useMemo } from 'react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import chartWatermark from '../../../../shared/chartWatermark';

const calculateTimeInterval = (origTimeEnd, timeStart) => {
  const timeDelta = Date.parse(origTimeEnd) - Date.parse(timeStart);
  const rawInterval = timeDelta / 5;
  const roundedInterval = Math.ceil(rawInterval / 60000) * 60000;
  return roundedInterval;
};

/**
 * Calculate unrealized PnL over time based on fills and current mid prices
 * For each timestamp with mid price data:
 * - Calculate net exposure (buyQty - sellQty)
 * - Calculate average fill price for that exposure
 * - Calculate unrealized PnL = (current_mid_price - avg_fill_price) * exposure
 */
const calculateUnrealizedPnLData = (culminativeFills, midPrices) => {
  const buyFills = culminativeFills.buy || [];
  const sellFills = culminativeFills.sell || [];
  const buyMidPrices = midPrices?.buy || [];
  const sellMidPrices = midPrices?.sell || [];

  if (buyFills.length === 0 && sellFills.length === 0) {
    return [];
  }

  if (buyMidPrices.length === 0 && sellMidPrices.length === 0) {
    return [];
  }

  // Combine and sort all fills by timestamp
  const allFills = [
    ...buyFills.map(([time, price, qty]) => ({ time, price: parseFloat(price), qty: parseFloat(qty), side: 'buy' })),
    ...sellFills.map(([time, price, qty]) => ({ time, price: parseFloat(price), qty: parseFloat(qty), side: 'sell' })),
  ].sort((a, b) => a.time - b.time);

  // Combine all mid price timestamps and sort
  const allPriceTimestamps = new Set();
  buyMidPrices.forEach(([ts]) => allPriceTimestamps.add(ts));
  sellMidPrices.forEach(([ts]) => allPriceTimestamps.add(ts));
  const sortedPriceTimestamps = Array.from(allPriceTimestamps).sort((a, b) => a - b);

  // Create lookup maps for mid prices
  const buyPriceMap = new Map(buyMidPrices.map(([ts, mid]) => [ts, parseFloat(mid)]));
  const sellPriceMap = new Map(sellMidPrices.map(([ts, mid]) => [ts, parseFloat(mid)]));

  // Track running averages and quantities
  let cumulativeBuyNotional = 0;
  let cumulativeSellNotional = 0;
  let cumulativeBuyQty = 0;
  let cumulativeSellQty = 0;
  let fillIndex = 0;
  let hadExposure = false;
  let lastBuyMid = null;
  let lastSellMid = null;

  const unrealizedPnLData = [];

  // Process each price timestamp
  sortedPriceTimestamps.forEach((priceTs) => {
    // Update fills that occurred before or at this timestamp
    while (fillIndex < allFills.length && allFills[fillIndex].time <= priceTs) {
      const fill = allFills[fillIndex];
      const notional = fill.price * fill.qty;

      if (fill.side === 'buy') {
        cumulativeBuyNotional += notional;
        cumulativeBuyQty += fill.qty;
      } else {
        cumulativeSellNotional += notional;
        cumulativeSellQty += fill.qty;
      }
      fillIndex += 1;
    }

    // Calculate net exposure
    const netExposure = cumulativeBuyQty - cumulativeSellQty;

    if (netExposure !== 0) {
      const buyMidPrice = buyPriceMap.get(priceTs);
      const sellMidPrice = sellPriceMap.get(priceTs);

      if (Number.isFinite(buyMidPrice)) {
        lastBuyMid = buyMidPrice;
      }
      if (Number.isFinite(sellMidPrice)) {
        lastSellMid = sellMidPrice;
      }

      const hasBuy = Number.isFinite(lastBuyMid);
      const hasSell = Number.isFinite(lastSellMid);

      if (hasBuy || hasSell) {
        hadExposure = true;
        const netNotional = cumulativeBuyNotional - cumulativeSellNotional;
        const avgFillPriceForExposure = netNotional / netExposure;
        let currentMidPrice = lastSellMid;
        if (hasBuy && hasSell) {
          currentMidPrice = (lastBuyMid + lastSellMid) / 2;
        } else if (hasBuy) {
          currentMidPrice = lastBuyMid;
        }

        // Unrealized PnL = (current_price - avg_fill_price) * exposure
        const unrealizedPnL = (currentMidPrice - avgFillPriceForExposure) * netExposure;

        if (Number.isFinite(unrealizedPnL) && Math.abs(unrealizedPnL) <= 1000000 && !Number.isNaN(unrealizedPnL)) {
          unrealizedPnLData.push([priceTs, unrealizedPnL]);
        }
      }
    } else if (hadExposure) {
      // If exposure drops to zero after having exposure, keep the line at 0 (flat carry)
      const buyMidPrice = buyPriceMap.get(priceTs);
      const sellMidPrice = sellPriceMap.get(priceTs);

      if (Number.isFinite(buyMidPrice)) {
        lastBuyMid = buyMidPrice;
      }
      if (Number.isFinite(sellMidPrice)) {
        lastSellMid = sellMidPrice;
      }

      if (Number.isFinite(lastBuyMid) || Number.isFinite(lastSellMid)) {
        unrealizedPnLData.push([priceTs, 0]);
      }
    }
  });

  return unrealizedPnLData;
};

/**
 * Calculate cumulative realized PnL over time based on fills
 * Creates a time series by calculating PnL at each timestamp epoch
 * Formula: (executed spread / 2) * executed notional up to that point
 * Returns PnL in dollars
 */
const calculatePnLData = (culminativeFills, timestamps) => {
  const buyFills = culminativeFills.buy || [];
  const sellFills = culminativeFills.sell || [];

  if (buyFills.length === 0 && sellFills.length === 0) {
    return [];
  }

  // Combine and sort all fills by timestamp to process chronologically
  const allFills = [
    ...buyFills.map(([time, price, qty]) => ({ time, price, qty: parseFloat(qty), side: 'buy' })),
    ...sellFills.map(([time, price, qty]) => ({ time, price, qty: parseFloat(qty), side: 'sell' })),
  ].sort((a, b) => a.time - b.time);

  if (allFills.length === 0) {
    return [];
  }

  // Calculate cumulative PnL at each fill event
  let cumulativeBuyNotional = 0;
  let cumulativeSellNotional = 0;
  let cumulativeBuyQty = 0;
  let cumulativeSellQty = 0;
  let hasBuyFills = false;
  let hasSellFills = false;

  const pnlData = allFills
    .map((fill) => {
      const notional = fill.price * fill.qty;

      // Update cumulative values based on fill side
      if (fill.side === 'buy') {
        cumulativeBuyNotional += notional;
        cumulativeBuyQty += fill.qty;
        hasBuyFills = true;
      } else {
        cumulativeSellNotional += notional;
        cumulativeSellQty += fill.qty;
        hasSellFills = true;
      }

      // Only calculate PnL if there are fills on BOTH legs
      if (hasBuyFills && hasSellFills && cumulativeBuyQty > 0 && cumulativeSellQty > 0) {
        const avgBuyPrice = cumulativeBuyNotional / cumulativeBuyQty;
        const avgSellPrice = cumulativeSellNotional / cumulativeSellQty;

        if (avgBuyPrice > 0 && avgSellPrice > 0) {
          // Calculate executed spread
          const spread = avgSellPrice - avgBuyPrice;
          // Executed notional up to this point (minimum of buy/sell notional for matched portion)
          const executedNotional = Math.min(cumulativeBuyNotional, cumulativeSellNotional);
          // Realized PnL = (spread / 2) * executed notional / avg price
          // Or more directly: (spread / 2) * matched quantity
          const matchedQty = Math.min(cumulativeBuyQty, cumulativeSellQty);
          const realizedPnLDollars = (spread / 2) * matchedQty;

          if (
            Math.abs(realizedPnLDollars) <= 1000000 &&
            !Number.isNaN(realizedPnLDollars) &&
            Number.isFinite(realizedPnLDollars)
          ) {
            return [fill.time, realizedPnLDollars];
          }
        }
      }

      return null;
    })
    .filter((point) => point !== null);

  return pnlData;
};

function PnLChart({ data, timeStart, timeEnd, origTimeEnd, height }) {
  const chartComponent = useRef(null);
  const theme = useTheme();

  const { pnlData, unrealizedPnLData } = useMemo(() => {
    let realizedPnL = [];
    let unrealizedPnL = [];

    if (!data?.culminative_fills) {
      return { pnlData: [], unrealizedPnLData: [] };
    }

    const timestamps = data.fills?.timestamps || null;
    realizedPnL = calculatePnLData(data.culminative_fills, timestamps);

    // Calculate unrealized PnL if mid prices are available
    if (data?.mid_prices) {
      unrealizedPnL = calculateUnrealizedPnLData(data.culminative_fills, data.mid_prices);
    }

    // Add synthetic data point at the start of the order (timeStart) with PnL = 0
    // This aligns the chart with other charts that start at timeStart
    if (realizedPnL.length > 0) {
      realizedPnL.unshift([Date.parse(timeStart), 0]);
    }
    if (unrealizedPnL.length > 0) {
      unrealizedPnL.unshift([Date.parse(timeStart), 0]);
    }

    // Filter data points to only include those up to current time (timeEnd)
    // This prevents the line from extending to the order end time
    const currentTime = Date.parse(timeEnd);
    realizedPnL = realizedPnL.filter((point) => point[0] <= currentTime);
    unrealizedPnL = unrealizedPnL.filter((point) => point[0] <= currentTime);

    // Extend realized PnL line to match unrealized PnL line's extent
    if (realizedPnL.length > 0 && unrealizedPnL.length > 0) {
      const lastUnrealizedTimestamp = unrealizedPnL[unrealizedPnL.length - 1][0];
      const lastRealizedValue = realizedPnL[realizedPnL.length - 1][1];
      const lastRealizedTimestamp = realizedPnL[realizedPnL.length - 1][0];

      // Only add extension point if unrealized extends further than realized
      if (lastUnrealizedTimestamp > lastRealizedTimestamp) {
        realizedPnL.push([lastUnrealizedTimestamp, lastRealizedValue]);
      }
    }

    // Extend unrealized PnL line to the chart end to keep it visible
    if (unrealizedPnL.length > 0) {
      const lastUnrealizedTimestamp = unrealizedPnL[unrealizedPnL.length - 1][0];
      const lastUnrealizedValue = unrealizedPnL[unrealizedPnL.length - 1][1];
      const targetTimestamp = Date.parse(origTimeEnd) || currentTime;

      if (lastUnrealizedTimestamp < targetTimestamp) {
        unrealizedPnL.push([targetTimestamp, lastUnrealizedValue]);
      }
    }

    return { pnlData: realizedPnL, unrealizedPnLData: unrealizedPnL };
  }, [data, timeStart, timeEnd]);

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
        name: 'Realized PnL',
        type: 'line',
        data: pnlData,
        step: 'left',
        zones: [
          {
            value: 0,
            color: theme.palette.charts.red,
          },
          {
            color: theme.palette.charts.green,
          },
        ],
        tooltip: {
          valueDecimals: 2,
          valuePrefix: '$',
        },
      },
      ...(unrealizedPnLData.length > 0
        ? [
            {
              name: 'Unrealized PnL',
              type: 'line',
              data: unrealizedPnLData,
              step: 'left',
              color: theme.palette.charts.blue || theme.palette.primary.main,
              dashStyle: 'ShortDot',
              zones: [
                {
                  value: 0,
                  color: theme.palette.charts.red,
                },
                {
                  color: theme.palette.charts.green,
                },
              ],
              tooltip: {
                valueDecimals: 2,
                valuePrefix: '$',
              },
            },
          ]
        : []),
    ],
    yAxis: {
      title: {
        text: 'PnL ($)',
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
        formatter() {
          return `$${Highcharts.numberFormat(this.value, 2)}`;
        },
      },
      plotLines: [
        {
          color: theme.palette.charts.lightGray,
          value: 0,
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
      tickInterval: calculateTimeInterval(origTimeEnd, timeStart),
      dateTimeLabelFormats: {
        minute: '%H:%M',
      },
      labels: {
        enabled: false,
      },
      tickLength: 0,
      ordinal: false,
    },
    legend: {
      enabled: true,
      itemStyle: {
        color: theme.palette.text.secondary,
      },
    },
    tooltip: {
      outside: true,
      shared: true,
      useHTML: true,
      formatter() {
        let tooltip = `<div>${Highcharts.dateFormat('%B %e, %H:%M:%S', this.x)}<br/>`;
        this.points.forEach((point) => {
          tooltip += `${point.series.name}: <b>$${Highcharts.numberFormat(point.y, 2)}</b><br/>`;
        });
        tooltip += '</div>';
        return tooltip;
      },
    },
    plotOptions: {
      series: {
        allowPointSelect: false,
        states: {
          hover: {
            enabled: true,
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

export { PnLChart };
