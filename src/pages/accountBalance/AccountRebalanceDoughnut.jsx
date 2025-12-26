/* eslint-disable no-shadow */
import React, { useState, useEffect } from 'react';
import { Button, Box, Typography } from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from '@emotion/react';

function AccountRebalanceDoughnut({
  assetsToUse,
  showCashRow,
  setShowCashRow,
  cashTargetWeight,
  targetWeights,
  counterAsset,
  selectedAccount,
}) {
  const theme = useTheme();

  const CASH_ASSETS = ['USD', 'USDT', 'USDC', 'USDK'];
  const isCashAsset = (asset) => CASH_ASSETS.includes(asset.symbol || asset.pair);
  const filterCombinedAllAssetsDoughnut = assetsToUse.filter((asset) => {
    const symbolOrPair = asset.symbol || asset.pair;
    return symbolOrPair && !isCashAsset(asset);
  });
  const normalizedAssets = filterCombinedAllAssetsDoughnut.reduce((acc, asset) => {
    const symbolOrPair = (asset.symbol || asset.pair).replace(/-USDT|-USD|-USDC|-PERP$/, '');
    const hasTargetWeight = Object.keys(targetWeights).includes(symbolOrPair) && targetWeights[symbolOrPair] !== 0;

    if (!acc.find((a) => a.normalizedSymbol === symbolOrPair) && hasTargetWeight) {
      acc.push({ ...asset, normalizedSymbol: symbolOrPair });
    }
    return acc;
  }, []);

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
  const getCounterAssetColor = (counterAsset) => {
    switch (counterAsset) {
      case 'USDT':
        return 'rgba(38, 161, 123, 0.8)';
      case 'USDC':
        return 'rgba(39, 117, 202, 0.8)';
      case 'USD':
        return 'rgba(133, 187, 101, 0.8)';
      default:
        return 'rgba(128, 128, 128, 0.5)';
    }
  };

  const doughnutDatatarget = {
    labels: [
      ...normalizedAssets
        .filter((asset) => targetWeights[asset.normalizedSymbol])
        .map((asset) => asset.normalizedSymbol),
      ...(showCashRow ? [counterAsset] : []),
    ],
    datasets: [
      {
        label: 'Target Weight',
        data: [
          ...normalizedAssets
            .filter((asset) => targetWeights[asset.normalizedSymbol])
            .map((asset) => targetWeights[asset.normalizedSymbol]),
          ...(showCashRow ? [cashTargetWeight || 0] : []),
        ],
        backgroundColor: [
          ...normalizedAssets.map((_, index) => getSymbolColor(index).backgroundColor),
          ...(showCashRow ? [getCounterAssetColor(counterAsset)] : []),
        ],
      },
    ],
  };

  return (
    <Box sx={{ width: '75%', height: '300px' }}>
      <Doughnut data={doughnutDatatarget} options={{ maintainAspectRatio: false }} />
      <Typography align='center'>Target Weight</Typography>
    </Box>
  );
}
export default AccountRebalanceDoughnut;
