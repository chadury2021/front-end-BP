import { Box, Divider, Stack, Typography, Grid, Paper, useTheme } from '@mui/material';
import React from 'react';

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

function TransactionBenchmark({ benchmarkData }) {
  const { arrival_cost, vwap_cost, departure_cost, fee_cost } = benchmarkData;

  const benchmarkItems = [
    { label: 'Arrival', value: arrival_cost, color: arrival_cost > 0 ? 'error.main' : 'success.main' },
    { label: 'VWAP', value: vwap_cost, color: vwap_cost > 0 ? 'error.main' : 'success.main' },
    { label: 'Departure Cost', value: departure_cost },
    { label: 'Exchange Fee', value: fee_cost },
  ];

  return (
    <Stack spacing={2}>
      <Typography variant='h6'>Benchmarks</Typography>
      <Divider />
      <Grid container spacing={2}>
        {benchmarkItems.map((item) => (
          <Grid key={item.label} sx={{ p: 1 }} xs={6}>
            <BenchmarkCard>
              <Stack direction='column' spacing={1}>
                <Typography color='text.secondary' variant='small2'>
                  {item.label}
                </Typography>
                <Typography color={item.color} variant='subtitle1'>
                  {item.value ? `${item.value.toFixed(4)} bps` : 'N/A'}
                </Typography>
              </Stack>
            </BenchmarkCard>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

export { TransactionBenchmark };
