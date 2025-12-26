import { useTheme } from '@emotion/react';
import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2'; // Import Bar instead of Doughnut
import { Typography } from '@mui/material';
import { isEmpty } from '@/util';

function FillExchangeChart({ data, height, style }) {
  const theme = useTheme();

  const placeholderData = {
    labels: ['Loading'],
    datasets: [
      {
        label: 'Placeholder',
        data: [1],
        backgroundColor: theme.palette.divider,
        borderRadius: 5,
        borderSkipped: false,
      },
    ],
  };

  const labels = ['Exchange Type'];

  const exchangeColors = {
    OKX: theme.palette.exchangeColors?.OKX || 'rgb(169, 169, 169)',
    Binance: theme.palette.exchangeColors?.Binance || 'rgb(230, 181, 26)',
    BinancePM: theme.palette.exchangeColors?.BinancePM || 'rgb(230, 181, 26)',
    Bybit: theme.palette.exchangeColors?.Bybit || 'rgb(230, 138, 26)',
    Deribit: theme.palette.exchangeColors?.Deribit || 'rgb(51, 204, 204)',
    Coinbase: theme.palette.exchangeColors?.Coinbase || 'rgb(26, 127, 229)',
    MockExchange: theme.palette.exchangeColors?.MockExchange || 'rgb(255, 255, 255)',
    OKXOTC: theme.palette.exchangeColors?.OKX || 'rgb(169, 169, 169)',
    Hyperliquid: theme.palette.exchangeColors?.Hyperliquid || '#95fce4',
    default: theme.palette.charts?.offWhite || '#ffffff',
  };

  const createDataset = (exchange, value) => ({
    label: exchange,
    data: [value],
    backgroundColor: exchangeColors[exchange] || exchangeColors.OKX,
  });

  const noData = !data || isEmpty(data);

  const datasets = useMemo(() => {
    if (noData) {
      return [];
    }

    return Object.entries(data).map(([exchange, value]) => createDataset(exchange, value));
  }, [data]);

  const fill_exchange_data = {
    labels,
    datasets: datasets.map((dataset, index) => ({
      ...dataset,
      borderRadius: {
        // Adds the rounded border for the graph
        topLeft: index === 0 ? 5 : 0,
        topRight: index === datasets.length - 1 ? 5 : 0,
        bottomRight: index === datasets.length - 1 ? 5 : 0,
        bottomLeft: index === 0 ? 5 : 0,
      },
      borderSkipped: false, // Ensures the border radius applies to all corners
    })),
  };

  const options = {
    indexAxis: 'y',
    scales: {
      x: {
        stacked: true,
        ticks: {
          display: false,
        },
        min: 0,
        max: noData ? 1 : 100,
      },
      y: {
        stacked: true,
        ticks: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div style={{ ...style }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          sx={{
            color: theme.palette.text.secondary,
            fontSize: '10px',
            paddingLeft: '6px',
          }}
        >
          Exchange(s)
        </Typography>
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Custom Legend */}
          {fill_exchange_data.datasets.map((dataset, index) => (
            <div key={dataset.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: dataset.backgroundColor,
                  borderRadius: '50%',
                }}
              />
              <Typography
                sx={{
                  fontSize: '10px',
                }}
              >
                {`${Number(dataset.data[0]).toFixed(0)}%`}
              </Typography>
              <Typography
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: '10px',
                }}
              >
                {dataset.label}
              </Typography>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height, width: '100%', marginLeft: '-2px' }}>
        <Bar data={noData ? placeholderData : fill_exchange_data} height='48px' options={options} />
      </div>
    </div>
  );
}

export { FillExchangeChart };
