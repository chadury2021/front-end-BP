import { Divider, Stack, Typography, Grid, Paper, useTheme } from '@mui/material';
import React from 'react';
import { Loader } from '../../shared/Loader';

function BenchmarkCard({ children }) {
  const theme = useTheme();

  return (
    <Paper
      elevation={1}
      sx={{
        px: '12px',
        py: '8px',
        height: '100%',
        boxSizing: 'border-box',
        backgroundColor: theme.palette.background.card,
      }}
    >
      {children}
    </Paper>
  );
}

function TransactionSummaryRender({ TransactionSummaryData }) {
  if (TransactionSummaryData === undefined || Object.keys(TransactionSummaryData).length === 0) {
    return <Loader />;
  }

  const summaryItems = [
    { label: 'Number of orders', value: TransactionSummaryData.num_orders },
    { label: 'Number of pairs', value: TransactionSummaryData.num_pairs },
    { label: 'Value of orders', value: TransactionSummaryData.orders_value },
    { label: 'Average duration', value: `${TransactionSummaryData?.avg_duration?.toFixed(0)}s` },
    {
      label: 'Participation Rate',
      value: `${TransactionSummaryData?.pov?.toFixed(2) ?? 0}%`,
      color: 'text.primary',
    },
    {
      label: 'Sided Interval Return',
      value: `${TransactionSummaryData?.interval_returns?.toFixed(3)} bps`,
      color: TransactionSummaryData?.interval_returns > 0 ? 'error.main' : 'success.main',
    },
    {
      label: 'Exchange Fee',
      value: TransactionSummaryData?.exch_fee,
      color: 'text.primary',
    },
  ];

  return (
    <Stack direction='column' spacing={2}>
      <Typography variant='h6'>Summary</Typography>
      <Divider />
      <Grid container spacing={2}>
        {summaryItems.map((item) => (
          <Grid key={item.label} sx={{ p: 1 }} xs={6}>
            <BenchmarkCard>
              <Stack direction='column' spacing={1}>
                <Typography color='text.secondary' variant='small2'>
                  {item.label}
                </Typography>
                <Typography color={item.color} variant='subtitle1'>
                  {item.value}
                </Typography>
              </Stack>
            </BenchmarkCard>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

export { TransactionSummaryRender };
