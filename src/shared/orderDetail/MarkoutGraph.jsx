import React, { useLayoutEffect, useRef } from 'react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts/highstock';
import Histogram from 'highcharts/modules/histogram-bellcurve';
import HC_more from 'highcharts/highcharts-more';
import { useTheme } from '@emotion/react';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import { Loader } from '@/shared/Loader';

Histogram(Highcharts); // Initialize the histogram module
HC_more(Highcharts); // Initialize the more module

// bug where standard deviation only works with taker markout price toggled
// i think it can be fixed through editing the core functions or settings
// https://www.highcharts.com/forum/viewtopic.php?t=43407
// maybe enable setting where bid ask spread is toggled off by default?

function MarkoutGraph({ data, height = '100%' }) {
  const theme = useTheme();
  const chartComponent = useRef(null);

  useLayoutEffect(() => {
    function updateSize() {
      if (chartComponent.current && chartComponent.current.chart) {
        chartComponent.current.chart.reflow();
      }
    }
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  if (!data || !data.by_role) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        <Typography variant='small1'>No fills yet.</Typography>
      </Box>
    );
  }

  // Separate data for maker and taker
  const makerData = data.by_role.filter((item) => item.placement_type === 'MAKE');
  const takerData = data.by_role.filter((item) => item.placement_type === 'TAKE');
  const aggregatedData = data.aggregated_data;

  // Ensure there is data to display
  if (makerData.length === 0 && takerData.length === 0) {
    return (
      <div>
        <Typography variant='subtitle1'>Markouts</Typography>
        <Loader />
      </div>
    );
  }

  // Prepare data for the maker and taker line series and error bars
  const makerLineData = makerData.map((item) => item.markout_price_mean);
  const takerLineData = takerData.map((item) => item.markout_price_mean);

  const makerErrorBarData = makerData.map((item) => {
    const mean = item.markout_price_mean;
    const stddev = item.markout_weighted_std;
    return [mean - stddev, mean + stddev];
  });

  const takerErrorBarData = takerData.map((item) => {
    const mean = item.markout_price_mean;
    const stddev = item.markout_weighted_std;
    return [mean - stddev, mean + stddev];
  });

  // data for histogram
  const bidAskSpreadData = aggregatedData.map((item) => item.bid_ask_spread_weighted_avg_bps);

  const categories =
    makerData.length > 0 ? makerData.map((item) => item.interval) : takerData.map((item) => item.interval);

  const options = {
    chart: {
      backgroundColor: 'transparent',
      zooming: {
        mouseWheel: false,
      },
      // zoomType: null,
      zoomType: false,
      marginLeft: 80,
      marginRight: 80,
      minHeight: '100px',
    },
    title: {
      text: 'Markouts',
      align: 'left',
      x: 6,
      style: {
        color: theme.palette.text.primary,
        fontSize: '1rem',
        fontFamily: theme.typography.fontFamilyConfig.numbers, // Use IBM Plex Mono for numbers
        fontWeight: 400,
        lineHeight: 1.235,
      },
    },
    xAxis: {
      categories,
      title: {
        text: 'Pre/Post Interval (seconds)',
        style: {
          color: theme.palette.text.primary,
          fontSize: '12px',
        },
      },
      labels: {
        style: {
          color: theme.palette.text.primary,
          fontSize: '12px',
        },
      },
      gridLineColor: 'rgba(255, 255, 255, 0.1)',
      crosshair: true,
    },
    yAxis: [
      {
        title: {
          text: 'Log return (bps)',
          style: {
            color: theme.palette.text.primary,
            fontSize: '12px',
          },
        },
        labels: {
          style: {
            color: theme.palette.text.primary,
            fontSize: '12px',
          },
        },
        gridLineColor: 'rgba(255, 255, 255, 0.1)',
        softMin: 0,
        softMax: 0,
      },
      {
        title: {
          text: '',
          style: {
            color: theme.palette.text.subtitle,
            fontSize: '12px',
          },
        },
        opposite: true,
        gridLineColor: 'rgba(255, 255, 255, 0.1)',
        min: 0,
        max: 43,
      },
    ],
    series: [
      {
        name: 'Maker Markout Mean',
        type: 'line',
        data: makerLineData,
        color: theme.palette.charts.green,
        lineWidth: 1,
        marker: {
          lineWidth: 1,
          enabled: true,
          radius: 4,
          symbol: 'circle',
        },
        tooltip: {
          pointFormat: 'Maker Markout Mean: <b>{point.y:.2f}</b><br/>',
        },
      },
      {
        name: 'Taker Markout Mean',
        type: 'line',
        data: takerLineData,
        color: theme.palette.charts.red,
        lineWidth: 1,
        marker: {
          lineWidth: 1,
          enabled: true,
          radius: 4,
          symbol: 'circle',
        },
        tooltip: {
          pointFormat: 'Taker Markout Mean: <b>{point.y:.2f}</b><br/>',
        },
      },
      {
        name: 'Maker SD',
        type: 'errorbar',
        data: makerErrorBarData,
        color: theme.palette.charts.blue,
        tooltip: {
          pointFormat: 'Maker SD: ({point.low:.2f} - {point.high:.2f} bps)<br/>',
        },
      },
      {
        name: 'Taker SD',
        type: 'errorbar',
        data: takerErrorBarData,
        color: theme.palette.charts.orange,
        tooltip: {
          pointFormat: 'Taker SD: ({point.low:.2f} - {point.high:.2f} bps)<br/>',
        },
      },
      {
        name: 'Bid Ask Spread',
        type: 'histogram',
        baseSeries: 'Maker Histogram',
        yAxis: 1,
        data: bidAskSpreadData,
        zIndex: -1,
        color: theme.palette.charts.orange,
        pointPlacement: 0, // keeps histogram aligned with interval
        opacity: 0.7,
        tooltip: {
          pointFormat: 'Bid Ask Spread: <b>{point.y:.2f} bps</b><br/>',
        },
      },
    ],
    tooltip: {
      shared: true,
      useHTML: true,
      backgroundColor: theme.palette.text.subtitle,
      style: {
        fontSize: '12px',
      },
    },
    credits: {
      enabled: false,
    },
    legend: {
      enabled: false,
    },
    plotOptions: {
      series: {
        dataLabels: {},
        marker: {},
      },
      histogram: {
        pointPadding: 0.2,
        borderWidth: 0,
        groupPadding: 0,
        fillOpacity: 0.5,
      },
    },
  };

  return (
    <Box marginTop={1} sx={{ height }}>
      <HighchartsReact
        containerProps={{ style: { height } }}
        highcharts={Highcharts}
        options={options}
        ref={chartComponent}
      />
    </Box>
  );
}

export default MarkoutGraph;
