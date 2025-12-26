import { useTheme } from '@emotion/react';
import { Typography } from '@mui/material';
import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { isEmpty } from '@/util';
import { fillRoleColor } from './util';

function FillRoleChart({ data, height, style }) {
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

  const labels = ['Fill Type'];

  const createDataset = (role, value) => ({
    label: role,
    data: [value],
    backgroundColor: fillRoleColor({ theme, role }),
  });

  const noData = !data || isEmpty(data);

  const datasets = useMemo(() => {
    if (noData) {
      return [];
    }

    return Object.entries(data).map(([role, value]) => createDataset(role, value));
  }, [data]);

  const fill_role_data = {
    labels,
    datasets: datasets.map((dataset, index) => ({
      ...dataset,
      borderRadius: {
        topLeft: index === 0 ? 5 : 0,
        topRight: index === datasets.length - 1 ? 5 : 0,
        bottomRight: index === datasets.length - 1 ? 5 : 0,
        bottomLeft: index === 0 ? 5 : 0,
      },
      borderSkipped: false, // Ensures the border radius applies to all corners
    })),
  };

  const options = {
    indexAxis: 'y', // For horizontal bar charts
    scales: {
      x: {
        stacked: true,
        ticks: {
          display: false, // Hide x-axis labels
        },
        min: 0,
        max: noData ? 1 : 100,
        grid: {
          display: false,
          drawBorder: false,
        },
      },
      y: {
        stacked: true,
        ticks: {
          display: false,
        },
        grid: {
          display: false,
          drawBorder: false,
        },
      },
    },
    layout: {
      padding: 0,
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
          Fill Role
        </Typography>
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Custom Legend */}
          {fill_role_data.datasets.map((dataset, index) => (
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
        <Bar data={noData ? placeholderData : fill_role_data} options={options} />
      </div>
    </div>
  );
}

export { FillRoleChart };
