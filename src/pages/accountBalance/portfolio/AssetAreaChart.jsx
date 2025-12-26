import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { Line } from 'react-chartjs-2';
import { formatNumber } from '@/shared/utils/formatNumber';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, TimeScale } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, TimeScale, annotationPlugin);

export default function AssetAreaChart({
  balanceData,
  dataField = 'total_notional',
  additionalDataField,
  transfers = [],
  // visibility controls (optional, default to visible)
  showMain = true,
  showAdditional = true,
}) {
  const theme = useTheme();

  const selectedAccountData = balanceData || [];

  const buildData = (field) => {
    if (selectedAccountData.length === 0) {
      return [];
    }

    const rawData = selectedAccountData
      .map((row) => {
        return { x: new Date(row.date).getTime(), y: row[field] };
      })
      .sort((a, b) => a.x - b.x);

    // Add intermediate points at y=0 for zero crossings
    const dataWithZeroCrossings = [];
    for (let i = 0; i < rawData.length - 1; i += 1) {
      const current = rawData[i];
      const next = rawData[i + 1];
      dataWithZeroCrossings.push(current);

      // If there's a zero crossing between current and next point
      if ((current.y < 0 && next.y > 0) || (current.y > 0 && next.y < 0)) {
        // Calculate the x position where y=0 using linear interpolation
        const slope = (next.y - current.y) / (next.x - current.x);
        const zeroX = current.x + -current.y / slope;
        dataWithZeroCrossings.push({ x: zeroX, y: 0 });
      }
    }
    dataWithZeroCrossings.push(rawData[rawData.length - 1]);

    return dataWithZeroCrossings;
  };

  const mainData = buildData(dataField);
  const additionalData = additionalDataField ? buildData(additionalDataField) : [];

  const oneDataPoint = mainData.length === 1;
  const pointRadius = oneDataPoint ? 2 : 0;
  // use main data's x values as it includes data from all symbols
  const allTimestamps = mainData.map((x) => x.x);

  const formatYAxis = (value) => {
    const sign = value < 0 ? '-' : '';
    return `${sign}$${formatNumber(value)}`;
  };

  const formatTransferValue = (value) => {
    const sign = value < 0 ? '-' : '+';
    return `${sign}${formatNumber(value)}`;
  };

  const getDatasetColor = (value, isMainData) => {
    if (isMainData && dataField === 'total_equity') {
      return theme.palette.common.white;
    }
    if (isMainData && dataField === 'total_balance') {
      return theme.palette.primary.main;
    }
    return value >= 0 ? theme.palette.success.main : theme.palette.error.main;
  };

  const getDatasetLabel = () => {
    if (dataField === 'total_notional') return 'Net Exposure';
    if (dataField === 'total_balance') return 'Total Balance';
    if (dataField === 'total_equity') return 'Total Equity';
    return 'Unrealized PnL';
  };

  const datasets = [
    {
      label: getDatasetLabel(),
      data: mainData,
      stepped: true,
      tension: 0.4,
      borderColor: (context) => {
        const { data } = context.dataset;
        const value = data[context.dataIndex]?.y || 0;
        return getDatasetColor(value, true);
      },
      segment: {
        borderColor: (context) => {
          if (dataField === 'total_equity') {
            return theme.palette.common.white;
          }
          if (dataField === 'total_balance') {
            return theme.palette.primary.main;
          }
          const startValue = context.p0.parsed.y;
          const endValue = context.p1.parsed.y;
          return startValue < 0 || endValue < 0 ? theme.palette.error.main : theme.palette.success.main;
        },
      },
      borderWidth: 2,
      fill: false,
      pointRadius,
      pointHoverRadius: 4,
    },
  ];

  if (additionalDataField) {
    datasets.push({
      label: 'GMV',
      data: additionalData,
      stepped: true,
      tension: 0.4,
      borderColor: theme.palette.warning.main,
      borderWidth: 2,
      fill: false,
      pointRadius,
      pointHoverRadius: 4,
      hidden: !showAdditional,
    });
  }

  // Apply visibility to main dataset last to ensure it overrides any defaults
  if (datasets.length > 0) {
    datasets[0] = {
      ...datasets[0],
      hidden: !showMain,
    };
  }

  const chartData = {
    labels: allTimestamps,
    datasets,
  };

  // Compute dynamic Y-axis range based on visible series
  const computeYAxisRange = () => {
    const values = [];
    if (showMain) {
      mainData.forEach((p) => {
        if (Number.isFinite(p?.y)) values.push(p.y);
      });
    }
    if (showAdditional && additionalDataField) {
      additionalData.forEach((p) => {
        if (Number.isFinite(p?.y)) values.push(p.y);
      });
    }

    if (!values.length) return undefined;

    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    const range = dataMax - dataMin;
    const padding = range > 0 ? range * 0.1 : Math.max(Math.abs(dataMax || 1) * 0.1, 1);
    return { min: dataMin - padding, max: dataMax + padding };
  };

  const dynamicY = computeYAxisRange();

  const groupTransfersByTime = (_transfers, timeWindow = 24 * 60 * 60 * 1000) => {
    if (!_transfers.length) return [];

    const sortedTransfers = [..._transfers].sort((a, b) => a.timestamp - b.timestamp);

    const groups = [];
    let currentGroup = [sortedTransfers[0]];

    for (let i = 1; i < sortedTransfers.length; i += 1) {
      const current = sortedTransfers[i];
      const lastInGroup = currentGroup[currentGroup.length - 1];

      // If current transfer is within timeWindow of the last transfer in current group
      if (current.timestamp - lastInGroup.timestamp <= timeWindow) {
        currentGroup.push(current);
      } else {
        groups.push(currentGroup);
        currentGroup = [current];
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  const transferGroups = groupTransfersByTime(transfers);

  const config = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    backgroundColor: theme.palette.background.paper,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
        },
        ticks: {
          color: theme.palette.portfolioChart.ticks,
        },
      },
      y: {
        stacked: false,
        ticks: {
          color: theme.palette.portfolioChart.ticks,
          callback: (value) => formatYAxis(value),
        },
        grid: {
          color: theme.palette.portfolioChart?.grid || theme.palette.grey[800],
        },
        ...(dynamicY ? { min: dynamicY.min, max: dynamicY.max } : {}),
      },
    },
    plugins: {
      annotation: {
        drawTime: 'beforeDatasetsDraw',
        annotations: [
          // Horizontal zero line as annotation so it doesn't affect y-axis range
          {
            type: 'line',
            yMin: 0,
            yMax: 0,
            borderColor: theme.palette.portfolioChart?.grid || theme.palette.grey[800],
            borderWidth: 1,
            borderDash: [5, 5],
          },
          // Transfer markers
          ...transfers.map((transfer) => {
            // Find which group this transfer belongs to and its index within that group
            const groupIndex = transferGroups.findIndex((group) =>
              group.some((t) => t.timestamp === transfer.timestamp)
            );
            const group = transferGroups[groupIndex];
            const indexInGroup = group.findIndex((t) => t.timestamp === transfer.timestamp);

            return {
              type: 'line',
              xMin: transfer.timestamp,
              xMax: transfer.timestamp,
              borderColor: theme.palette.charts?.lightGray || theme.palette.grey[400],
              borderWidth: 1,
              borderDash: [2, 2],
              label: {
                display: true,
                content: `${formatTransferValue(transfer.value)} ${transfer.asset}`,
                enabled: true,
                position: 'end',
                backgroundColor: 'transparent',
                color: transfer.value > 0 ? theme.palette.success.main : theme.palette.error.main,
                font: {
                  size: 10,
                },
                padding: {
                  top: 2,
                  bottom: 2,
                  left: 4,
                  right: 4,
                },
                xAdjust: 0,
                yAdjust: indexInGroup * 20, // Offset based on position within its group
              },
            };
          }),
        ],
      },
      legend: {
        display: false,
      },
      filler: {
        propagate: false,
      },
      tooltip: {
        mode: 'index',
        callbacks: {
          label(tooltipItem) {
            const value = Number((tooltipItem.formattedValue || '').replace(/,/g, ''));
            if (value === 0 || !Number.isFinite(value)) {
              return null;
            }
            // Show full amount with 2 decimal points instead of KMB formatting
            const sign = value < 0 ? '-' : '';
            const formattedValue = `${sign}$${Math.abs(value).toFixed(2)}`;
            return `${tooltipItem.dataset.label}: ${formattedValue}`;
          },
        },
        filter(tooltipItem) {
          const value = Number((tooltipItem.formattedValue || '').replace(/,/g, ''));
          return value !== 0 && Number.isFinite(value);
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <Box sx={{ width: '100%', height: '100%', backgroundColor: theme.palette.background.paper }}>
      {selectedAccountData !== undefined ? (
        <Line data={chartData} options={config} />
      ) : (
        <Line data={{ datasets: [] }} options={config} />
      )}
    </Box>
  );
}
