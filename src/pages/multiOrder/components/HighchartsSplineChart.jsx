import React, { useEffect, useState, useRef } from 'react';
import { useTheme, Box, Typography } from '@mui/material';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import { getTradingViewDataFeed } from '@/apiServices';

// Initialize Highcharts modules
import HighchartsMore from 'highcharts/highcharts-more';

HighchartsMore(Highcharts);

function HighchartsSplineChart({ basketItems, pair, relevantExchangeName, side, title, timeframe = 'day' }) {
  const theme = useTheme();
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to calculate basket performance (from BasketDataFeed)
  const calculateBasketPerformance = (basketData) => {
    if (!basketData.length) return [];

    // Get all unique timestamps from each dataset
    const timestampSets = basketData.map((item) => new Set(item.data.map((bar) => bar.time)));

    // Find intersection of all timestamp sets
    const commonTimestamps = timestampSets.reduce((intersection, set) => {
      if (intersection.size === 0) return new Set(set);
      return new Set([...intersection].filter((time) => set.has(time)));
    }, new Set());

    if (commonTimestamps.size === 0) {
      // No common timestamps found across datasets
      return [];
    }

    // Create a map of timestamps to bars, only for common timestamps
    const timestampMap = new Map();

    // Process each item's data, but only for common timestamps
    basketData.forEach((item) => {
      if (!Array.isArray(item.data)) return;

      // Filter data to only include common timestamps
      const filteredData = item.data.filter(
        (bar) => bar && typeof bar.time === 'number' && typeof bar.close === 'number' && commonTimestamps.has(bar.time)
      );

      filteredData.forEach((bar) => {
        if (!timestampMap.has(bar.time)) {
          timestampMap.set(bar.time, {
            time: bar.time,
            open: 0,
            high: 0,
            low: 0,
            close: 0,
            volume: 0,
          });
        }

        const basketBar = timestampMap.get(bar.time);
        const qty = Number(item.notional);
        const price = bar.close;

        // Calculate total value (qty * price)
        const value = qty * price;

        // Add to the basket bar
        basketBar.open += value;
        basketBar.high += value;
        basketBar.low += value;
        basketBar.close += value;
        basketBar.volume += (bar.volume || 0) * qty;
      });
    });

    // Convert the map to an array and sort by time
    return Array.from(timestampMap.values())
      .map((bar) => {
        // Format values exactly as TradingView expects
        const normalizedBar = {
          time: bar.time,
          open: parseFloat(bar.open.toFixed(2)),
          high: parseFloat(bar.high.toFixed(2)),
          low: parseFloat(bar.low.toFixed(2)),
          close: parseFloat(bar.close.toFixed(2)),
          volume: parseFloat(bar.volume.toFixed(2)),
        };

        // Validate the bar data
        if (
          !Number.isFinite(normalizedBar.time) ||
          !Number.isFinite(normalizedBar.open) ||
          !Number.isFinite(normalizedBar.high) ||
          !Number.isFinite(normalizedBar.low) ||
          !Number.isFinite(normalizedBar.close) ||
          !Number.isFinite(normalizedBar.volume)
        ) {
          // Invalid bar data
          return null;
        }

        return normalizedBar;
      })
      .filter((bar) => bar !== null)
      .sort((a, b) => a.time - b.time);
  };

  // Helper function to invert bar values (from BasketDataFeed)
  const invertBarValues = (bar) => {
    return {
      ...bar,
      open: -bar.open,
      high: -bar.high,
      low: -bar.low,
      close: -bar.close,
      volume: bar.volume, // Keep volume positive
    };
  };

  // Fetch data similar to BasketDataFeed
  const fetchChartData = async () => {
    if (!basketItems || basketItems.length === 0) {
      setChartData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const currentTime = Math.floor(Date.now() / 1000);

      // Calculate time range based on timeframe
      let timeRange;
      let resolution;
      switch (timeframe) {
        case 'day':
          timeRange = 24 * 60 * 60; // 1 day
          resolution = '15'; // 15 minutes
          break;
        case 'week':
          timeRange = 7 * 24 * 60 * 60; // 7 days
          resolution = '60'; // 1 hour
          break;
        case 'month':
          timeRange = 30 * 24 * 60 * 60; // 30 days
          resolution = '240'; // 4 hours
          break;
        case 'year':
          timeRange = 365 * 24 * 60 * 60; // 365 days
          resolution = '1D'; // 1 day
          break;
        default:
          timeRange = 7 * 24 * 60 * 60; // 7 days
          resolution = '60'; // 1 hour
      }

      const from = currentTime - timeRange;
      const to = currentTime;

      // Fetch data for all basket items
      const basketData = await Promise.all(
        basketItems.map(async (item) => {
          try {
            const apiBaseUrl = getTradingViewDataFeed();
            const formattedSymbol = item.symbol.includes(':') ? item.symbol : `BINANCE:${item.symbol}`;
            const url = `${apiBaseUrl}?symbol=${formattedSymbol}&resolution=${resolution}&to=${to}&from=${from}`;
            const response = await fetch(url);
            if (!response.ok) {
              // Failed to fetch data for symbol
              return null;
            }
            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) {
              // No data received for symbol
              return null;
            }
            return {
              symbol: item.symbol,
              weight: item.weight,
              notional: item.notional,
              data,
            };
          } catch (fetchError) {
            // Error fetching data for symbol
            return null;
          }
        })
      );

      // Filter out failed requests
      const validBasketData = basketData.filter((item) => item !== null && item.data.length > 0);

      if (validBasketData.length === 0) {
        // No valid data received for any basket items
        setChartData([]);
        setLoading(false);
        return;
      }

      // Calculate basket performance (similar to BasketDataFeed)
      const basketBars = calculateBasketPerformance(validBasketData);

      // Invert the values if this is a sell basket
      const finalBars = side === 'sell' ? basketBars.map(invertBarValues) : basketBars;

      // Convert to Highcharts format - ensure proper timestamp conversion
      const highchartsData = finalBars.map((bar) => {
        // Ensure timestamp is in milliseconds for Highcharts
        const timestamp = bar.time > 1e12 ? bar.time : bar.time * 1000;
        return [timestamp, bar.close];
      });

      // Chart data processed successfully
      setChartData(highchartsData);
    } catch (fetchError) {
      // Error fetching chart data
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [basketItems, side, timeframe]);

  // Create a single series with dynamic coloring based on segments
  const createColoredSeries = (data) => {
    if (data.length === 0) return [];

    // Create segments for coloring with smooth zero-crossing transitions
    const segments = [];
    let currentSegment = {
      data: [],
      color: data[0][1] >= 0 ? theme.palette.success.main : theme.palette.error.main,
    };

    for (let i = 0; i < data.length; i += 1) {
      const [timestamp, value] = data[i];
      const isPositive = value >= 0;
      const segmentColor = isPositive ? theme.palette.success.main : theme.palette.error.main;

      // If color changes, create smooth transition at zero crossing
      if (segmentColor !== currentSegment.color) {
        if (currentSegment.data.length > 0) {
          const lastPoint = currentSegment.data[currentSegment.data.length - 1];
          const [lastTimestamp, lastValue] = lastPoint;

          // Calculate the zero-crossing point using linear interpolation
          const zeroCrossingTimestamp =
            lastTimestamp + ((timestamp - lastTimestamp) * (0 - lastValue)) / (value - lastValue);

          // Add the zero-crossing point to the current segment
          currentSegment.data.push([zeroCrossingTimestamp, 0]);
          segments.push({ ...currentSegment });

          // Start new segment with the zero-crossing point for smooth transition
          currentSegment = {
            data: [
              [zeroCrossingTimestamp, 0],
              [timestamp, value],
            ],
            color: segmentColor,
          };
        } else {
          currentSegment = {
            data: [[timestamp, value]],
            color: segmentColor,
          };
        }
      } else {
        currentSegment.data.push([timestamp, value]);
      }
    }

    // Add the last segment
    if (currentSegment.data.length > 0) {
      segments.push(currentSegment);
    }

    return segments;
  };

  const segments = createColoredSeries(chartData);

  const chartOptions = {
    chart: {
      type: 'spline',
      backgroundColor: 'transparent',
      height: 420,
      style: {
        fontFamily: theme.typography.fontFamily,
      },
    },
    title: {
      text: null,
    },
    xAxis: {
      type: 'datetime',
      labels: {
        style: {
          color: theme.palette.text.secondary,
        },
        formatter() {
          // eslint-disable-next-line react/no-this-in-sfc
          const date = new Date(this.value);
          const now = new Date();
          const diffDays = Math.abs(now - date) / (1000 * 60 * 60 * 24);

          if (timeframe === 'day') {
            // For day view, show time only
            // eslint-disable-next-line react/no-this-in-sfc
            return Highcharts.dateFormat('%H:%M', this.value);
          }
          if (timeframe === 'week') {
            // For week view, show day and time
            // eslint-disable-next-line react/no-this-in-sfc
            return Highcharts.dateFormat('%m/%d %H:%M', this.value);
          }
          if (timeframe === 'month') {
            // For month view, show date and time
            // eslint-disable-next-line react/no-this-in-sfc
            return Highcharts.dateFormat('%m/%d %H:%M', this.value);
          }
          if (timeframe === 'year') {
            // For year view, show date only
            // eslint-disable-next-line react/no-this-in-sfc
            return Highcharts.dateFormat('%m/%d', this.value);
          }
          // Default fallback
          // eslint-disable-next-line react/no-this-in-sfc
          return Highcharts.dateFormat('%m/%d %H:%M', this.value);
        },
      },
      gridLineColor: theme.palette.divider,
      lineColor: theme.palette.divider,
    },
    yAxis: {
      title: {
        text: 'Value ($)',
        style: {
          color: theme.palette.text.secondary,
        },
      },
      labels: {
        style: {
          color: theme.palette.text.secondary,
        },
        formatter() {
          // eslint-disable-next-line react/no-this-in-sfc
          const { value } = this;
          const sign = value < 0 ? '-' : '';
          return `${sign}$${Math.abs(value).toFixed(2)}`;
        },
      },
      gridLineColor: theme.palette.divider,
      lineColor: theme.palette.divider,
      plotLines: [
        {
          value: 0,
          color: theme.palette.divider,
          dashStyle: 'dash',
          width: 1,
          zIndex: 5,
        },
      ],
    },
    tooltip: {
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.divider,
      borderRadius: 8,
      borderWidth: 1,
      style: {
        color: theme.palette.text.primary,
        fontFamily: theme.typography.fontFamily,
      },
      formatter() {
        // eslint-disable-next-line react/no-this-in-sfc
        const value = this.y;
        const sign = value < 0 ? '-' : '';
        // eslint-disable-next-line react/no-this-in-sfc
        return `<b>${Highcharts.dateFormat('%Y-%m-%d %H:%M', this.x)}</b><br/>
                <span style="color:${this.color}">●</span> Value: ${sign}$${Math.abs(value).toFixed(2)}`; // eslint-disable-line react/no-this-in-sfc
      },
    },
    plotOptions: {
      spline: {
        lineWidth: 2,
        marker: {
          enabled: false,
        },
        states: {
          hover: {
            lineWidth: 3,
          },
        },
      },
    },
    series: segments.map((segment, index) => ({
      name: `Segment ${index + 1}`,
      data: segment.data,
      color: segment.color,
      type: 'spline',
      showInLegend: false,
    })),
    legend: {
      enabled: false,
    },
    credits: {
      enabled: false,
    },
    exporting: {
      enabled: false,
    },
    navigation: {
      buttonOptions: {
        enabled: false,
      },
    },
    loading: {
      style: {
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.primary.main,
      },
    },
  };

  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          height: 420,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <div>Loading chart...</div>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          width: '100%',
          height: 420,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.error.main,
        }}
      >
        <div>Error loading chart: {error}</div>
      </Box>
    );
  }

  if (chartData.length === 0) {
    return (
      <Box
        sx={{
          width: '100%',
          height: 420,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.secondary,
        }}
      >
        <Typography variant='body1'>Construct a trade to get started</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 420 }}>
      <HighchartsReact
        containerProps={{ style: { height: '100%' } }}
        highcharts={Highcharts}
        options={chartOptions}
        ref={chartRef}
      />
    </Box>
  );
}

export default HighchartsSplineChart;
