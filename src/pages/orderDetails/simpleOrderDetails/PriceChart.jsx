import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useTheme } from '@emotion/react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import { Box, Typography, Skeleton } from '@mui/material';
import { getTradingViewDataFeed } from '@/apiServices';
import chartWatermark from '@/shared/chartWatermark';
import { formatPrice } from '@/util';

// Constants
const TARGET_BARS = 31;
const POLLING_INTERVAL_MS = 60 * 1000; // 1 minute
const POLLING_DURATION_MS = 11 * 60 * 1000; // 11 minutes
const PAST_BARS = 10;
const FUTURE_BARS = 11;

// Utility functions
const formatPriceLabel = (value) => formatPrice(value);

const convertToMilliseconds = (timestamp) => {
  return timestamp > 1e12 ? timestamp : timestamp * 1000;
};

const getHeightInPixels = (heightValue, windowHeight) => {
  if (typeof heightValue === 'string' && heightValue.includes('vh')) {
    const vhValue = parseFloat(heightValue);
    return (vhValue / 100) * windowHeight;
  }
  return heightValue;
};

const calculateBaseQuantity = (fill, orderSide) => {
  let baseQty = fill.qty || 0;
  if (orderSide === 'buy' && fill.price) {
    baseQty /= fill.price;
  }
  return baseQty;
};

const createFillToBarMap = (fillData, rawVolumeData) => {
  const fillToBarMap = new Map();

  fillData.forEach(fill => {
    const fillTime = new Date(fill.time).getTime();
    let targetBarIndex = -1;

    for (let i = 0; i < rawVolumeData.length; i += 1) {
      const barTime = rawVolumeData[i][0];
      if (fillTime >= barTime) {
        targetBarIndex = i;
        break;
      }
    }

    // Use the next bar (index + 1) since bars are counted backwards
    if (targetBarIndex >= 0 && targetBarIndex < rawVolumeData.length - 1) {
      const nextBarTime = rawVolumeData[targetBarIndex + 1][0];
      if (!fillToBarMap.has(nextBarTime)) {
        fillToBarMap.set(nextBarTime, []);
      }
      fillToBarMap.get(nextBarTime).push(fill);
    }
  });

  return fillToBarMap;
};

const processVolumeData = (rawVolumeData, fillData, orderSide, theme) => {
  if (!rawVolumeData || rawVolumeData.length === 0) return [];

  const processedData = [];

  rawVolumeData.forEach(bar => {
    const barTime = bar[0];
    const marketVolume = bar[1];

    // Just show market volume without stacking
    processedData.push({
      x: barTime,
      y: marketVolume,
      color: theme.palette.primary.main,
      name: 'Market',
      fillOpacity: 0.5
    });
  });

  return processedData;
};

const calculateTimeWindow = (timeStart, effectiveEndTime, currentTime) => {
  const orderStartTime = new Date(timeStart).getTime();
  const orderDurationMs = effectiveEndTime - orderStartTime;
  const orderDurationMinutes = Math.ceil(orderDurationMs / (1000 * 60));

  const bufferMinutes = Math.max(0, TARGET_BARS - orderDurationMinutes);

  // Calculate time window: 10 bars before order start, 11 bars after effective end
  const fromTime = Math.floor((orderStartTime - (PAST_BARS * 60 * 1000)) / 1000);
  const toTime = Math.floor((effectiveEndTime + (FUTURE_BARS * 60 * 1000)) / 1000);

  // Cap to current time to prevent requesting future data
  return Math.min(toTime, Math.floor(currentTime / 1000));
};

const transformChartData = (data) => {
  return data.map(bar => [
    convertToMilliseconds(bar.time),
    bar.close
  ]);
};

const transformVolumeData = (data) => {
  return data.map(bar => [
    convertToMilliseconds(bar.time),
    bar.volume || 0
  ]);
};

const updateChartSeries = (chart, priceData, volumeData, makerFills, takerFills) => {
  if (!chart) return;

  const priceSeries = chart.series.find(s => s.name === 'Price');
  if (priceSeries) {
    priceSeries.setData(priceData, false);
  }

  const volumeSeries = chart.series.find(s => s.name === 'Volume');
  if (volumeSeries) {
    volumeSeries.setData(volumeData, false);
  }

  const makerSeries = chart.series.find(s => s.name === 'Maker Fills');
  if (makerSeries) {
    makerSeries.setData(makerFills, false);
  }

  const takerSeries = chart.series.find(s => s.name === 'Taker Fills');
  if (takerSeries) {
    takerSeries.setData(takerFills, false);
  }

  chart.redraw();
};

function PriceChart({ pair, exchange, time_start, endTime, fills = [], height = 300, side = 'buy', limitPrice, status, executedPrice }) {
  const theme = useTheme();
  const chartComponent = useRef(null);
  const volumeDataRef = useRef([]);

  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [makerFills, setMakerFills] = useState([]);
  const [takerFills, setTakerFills] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [processedVolumeData, setProcessedVolumeData] = useState([]);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [orderFinishedTime, setOrderFinishedTime] = useState(null);

  const heightInPixels = getHeightInPixels(height, windowHeight);

  const fetchPriceData = async () => {
    if (!pair || !exchange || !time_start || !endTime) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const currentTime = Date.now();
      const isOrderFinished = status === 'COMPLETE' || status === 'FAILED';

      // Determine effective end time
      const effectiveEndTime = isOrderFinished && fills.length > 0
        ? Math.max(...fills.map(fill => new Date(fill.time).getTime()))
        : currentTime;

      const cappedToTime = calculateTimeWindow(time_start, effectiveEndTime, currentTime);
      const formattedSymbol = `${exchange}:${pair}`;
      const apiBaseUrl = getTradingViewDataFeed();
      const url = `${apiBaseUrl}?symbol=${formattedSymbol}&resolution=1&from=${Math.floor((new Date(time_start).getTime() - (PAST_BARS * 60 * 1000)) / 1000)}&to=${cappedToTime}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch price data: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setError('No price data available');
        setPriceData([]);
        setVolumeData([]);
      } else {
        const transformedData = transformChartData(data);
        const transformedVolumeData = transformVolumeData(data);

        setPriceData(transformedData);
        setVolumeData(transformedVolumeData);
        volumeDataRef.current = transformedVolumeData;

        const processedVolData = processVolumeData(transformedVolumeData, fills, side, theme);
        setProcessedVolumeData(processedVolData);

        // Update chart dynamically if it exists
        if (chartComponent.current?.chart) {
          updateChartSeries(chartComponent.current.chart, transformedData, processedVolData, makerFills, takerFills);
        }
      }
    } catch (err) {
      setError(err.message);
      setPriceData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle fill updates
  useEffect(() => {
    const makerFillsData = fills.filter(fill => fill.role === 'MAKE').map(fill => [
      new Date(fill.time).getTime(),
      fill.price
    ]);

    const takerFillsData = fills.filter(fill => fill.role === 'TAKE').map(fill => [
      new Date(fill.time).getTime(),
      fill.price
    ]);

    setMakerFills(makerFillsData);
    setTakerFills(takerFillsData);

    const processedVolData = processVolumeData(volumeDataRef.current, fills, side, theme);
    setProcessedVolumeData(processedVolData);

    if (chartComponent.current?.chart) {
      updateChartSeries(chartComponent.current.chart, priceData, processedVolData, makerFillsData, takerFillsData);
    }
  }, [fills, side, theme, priceData]);

  // Polling effect for chart updates after order is finished
  useEffect(() => {
    if (endTime && !orderFinishedTime) {
      const currentTime = Date.now();
      const isOrderFinished = status === 'FINISHED';

      const effectiveEndTime = isOrderFinished && fills.length > 0
        ? Math.max(...fills.map(fill => new Date(fill.time).getTime()))
        : currentTime;

      if (effectiveEndTime < currentTime) {
        setOrderFinishedTime(effectiveEndTime);

        const interval = setInterval(() => {
          const now = Date.now();
          const timeSinceOrderFinished = now - effectiveEndTime;

          if (timeSinceOrderFinished >= POLLING_DURATION_MS) {
            clearInterval(interval);
            setPollingInterval(null);
            return;
          }

          fetchPriceData();
        }, POLLING_INTERVAL_MS);

        setPollingInterval(interval);
      }
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [endTime, orderFinishedTime, status, fills]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Handle window resize
  useLayoutEffect(() => {
    const updateSize = () => {
      if (chartComponent.current?.chart) {
        chartComponent.current.chart.reflow();
      }
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Recalculate height when window height changes
  useEffect(() => {
    if (typeof height === 'string' && height.includes('vh')) {
      setWindowHeight(window.innerHeight);
    }
  }, [height]);

  // Initial data fetch
  useEffect(() => {
    fetchPriceData();
  }, [pair, exchange, time_start, endTime]);

  if (loading) {
    return (
      <Box sx={{ alignItems: 'center', display: 'flex', height, justifyContent: 'center' }}>
        <Skeleton height={heightInPixels - 40} variant="rectangular" width="100%" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ alignItems: 'center', display: 'flex', height, justifyContent: 'center' }}>
        <Typography color="text.secondary" variant="body2">
          Unable to load price data: {error}
        </Typography>
      </Box>
    );
  }

  if (priceData.length === 0) {
    return (
      <Box sx={{ alignItems: 'center', display: 'flex', height, justifyContent: 'center' }}>
        <Typography color="text.secondary" variant="body2">
          No price data available
        </Typography>
      </Box>
    );
  }

  const chartOptions = {
    time: { useUTC: true },
    chart: {
      type: 'line',
      backgroundColor: 'transparent',
      height: heightInPixels - 30,
      spacing: [10, 10, 15, 10],
      panning: true,
      panKey: 'shift',
    },
    title: { text: null },
    xAxis: {
      type: 'datetime',
      labels: {
        style: {
          color: theme.palette.text.secondary,
          fontSize: '11px',
        },
        format: '{value:%H:%M:%S}',
        rotation: 0,
        align: 'center',
      },
      lineColor: theme.palette.divider,
      tickColor: theme.palette.divider,
      gridLineColor: theme.palette.divider,
      tickInterval: null,
      minTickInterval: 5 * 1000,
      maxZoom: 1 * 1000,
      startOnTick: false,
      endOnTick: false,
    },
    yAxis: [
      {
        title: {
          text: 'Price',
          style: {
            color: theme.palette.text.secondary,
            fontSize: '12px',
          },
        },
        labels: {
          style: {
            color: theme.palette.text.secondary,
            fontSize: '11px',
          },
          format: '{value:.2f}',
          align: 'right',
        },
        lineColor: theme.palette.divider,
        tickColor: theme.palette.divider,
        gridLineColor: theme.palette.divider,
        opposite: false,
        startOnTick: false,
        endOnTick: false,
        minPadding: 0.1,
        maxPadding: 0.1,
        plotLines: limitPrice ? [{
          value: parseFloat(limitPrice),
          color: theme.palette.warning.main,
          dashStyle: 'dash',
          width: 2,
          label: {
            text: `Limit: ${formatPrice(parseFloat(limitPrice))}`,
            style: {
              color: theme.palette.warning.main,
              fontSize: '11px',
            },
            align: 'right',
            x: -10,
          },
          zIndex: 5,
        }] : [],
      },
      {
        title: {
          text: 'Volume',
          style: {
            color: theme.palette.text.secondary,
            fontSize: '12px',
          },
        },
        labels: {
          style: {
            color: theme.palette.text.secondary,
            fontSize: '11px',
          },
          format: '{value:.0f}',
          align: 'left',
        },
        lineColor: theme.palette.divider,
        tickColor: theme.palette.divider,
        gridLineColor: 'transparent',
        opposite: true,
        startOnTick: false,
        endOnTick: false,
        minPadding: 0.1,
        maxPadding: 0.1,
      }
    ],
    series: [
      {
        name: 'Price',
        type: 'spline',
        data: priceData,
        color: theme.palette.common.white,
        lineWidth: 1.5,
        marker: { enabled: false },
        connectNulls: false,
        turboThreshold: 0,
        enableMouseTracking: false,
      },
      {
        name: 'Volume',
        type: 'column',
        data: processedVolumeData,
        yAxis: 1,
        pointPadding: 0,
        groupPadding: 0,
        borderWidth: 0,
        opacity: 0.5,
        enableMouseTracking: false,
      },
      {
        name: 'Maker Fills',
        type: 'scatter',
        data: makerFills,
        color: theme.palette.success.main,
        marker: {
          enabled: true,
          radius: 3,
          symbol: 'circle',
        },
        zIndex: 10,
        tooltip: {
          pointFormat: '<b>Time:</b> {point.x:%Y-%m-%d %H:%M:%S}<br/><b>Price:</b> {point.y}'
        },
        enableMouseTracking: true,
      },
      {
        name: 'Taker Fills',
        type: 'scatter',
        data: takerFills,
        color: theme.palette.error.main,
        marker: {
          enabled: true,
          radius: 3,
          symbol: 'circle',
        },
        zIndex: 10,
        tooltip: {
          pointFormat: '<b>Time:</b> {point.x:%Y-%m-%d %H:%M:%S}<br/><b>Price:</b> {point.y}'
        },
        enableMouseTracking: true,
      },
      ...(executedPrice ? [{
        name: 'Average Execution Price',
        type: 'line',
        data: priceData.length > 0 ? [
          [priceData[0][0], parseFloat(executedPrice)],
          [priceData[priceData.length - 1][0], parseFloat(executedPrice)]
        ] : [],
        color: theme.palette.charts.gray,
        dashStyle: 'dash',
        lineWidth: 1,
        marker: { enabled: false },
        enableMouseTracking: true,
        tooltip: {
          pointFormat: '<b>Average Execution Price:</b> {point.y:.2f}'
        },
      }] : []),
    ],
    legend: { enabled: false },
    tooltip: {
      enabled: true,
      shared: false,
      useHTML: true,
      formatter: undefined,
    },
    plotOptions: {
      series: {
        animation: false,
        states: {
          hover: {
            enabled: false,
          },
        },
      },
    },
    rangeSelector: { enabled: false },
    navigator: { enabled: false },
    scrollbar: { enabled: false },
    credits: { enabled: false },
  };

  const watermarkedOptions = chartWatermark({
    options: chartOptions,
    position: 'bottom-right',
  });

  return (
    <Box sx={{ height }}>
      <Typography color="text.offWhite" sx={{ p: 2 }} variant="subtitle2">
        Markout Chart
      </Typography>
      <HighchartsReact
        highcharts={Highcharts}
        options={watermarkedOptions}
        ref={chartComponent}
      />
    </Box>
  );
}

export { PriceChart };