import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from '@emotion/react';

export default function AssetDoughnut({ assets = [], topN = 10 }) {
  const labels = [];
  const assetData = [];
  const backgroundColor = [];

  const totalNotional = assets.reduce((total, a) => total + Math.abs(a.notional), 0);

  const theme = useTheme();

  const chartColors = [
    theme.palette.primary.main,
    theme.palette.primary.dark,
    theme.palette.secondary.main,
    theme.palette.semantic.success,
    theme.palette.charts.blue,
    theme.palette.semantic.warning,
    theme.palette.semantic.error,
    theme.palette.grey[600],
  ];

  const getSymbolColor = (index) => {
    if (index >= 10) {
      return {
        color: 'rgb(0, 69, 25)',
        backgroundColor: 'rgb(0, 69, 25)',
      };
    }

    return {
      color: chartColors[index],
      backgroundColor: chartColors[index],
    };
  };

  assets.sort((a, b) => Math.abs(b.notional) - Math.abs(a.notional));

  assets.slice(0, topN).forEach((item, i) => {
    labels.push(item.symbol);
    assetData.push(Math.abs(item.notional) / totalNotional);
    backgroundColor.push(getSymbolColor(i).color);
  });

  const restOfAssets = assets.slice(topN);

  if (restOfAssets.length > 0) {
    labels.push('Other');
    assetData.push(restOfAssets.reduce((a, b) => a + Math.abs(b.notional), 0) / totalNotional);
    backgroundColor.push(getSymbolColor(10).color);
  }

  const data = {
    labels,
    datasets: [
      {
        labels,
        data: assetData,
        backgroundColor,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    animation: false,
    layout: {
      padding: {
        top: 5,
        left: -5,
        bottom: 5,
        right: 25,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return <Doughnut data={data} options={options} />;
}
