import React from 'react';
import { Paper } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';

export function OrderDetailsLayout({ leftPanel, children }) {
  return (
    <Grid container spacing={1} style={{ height: '100%' }}>
      <Grid style={{ height: '100%' }} xs={4}>
        <Paper elevation={0} sx={{ height: '100%', overflow: 'auto' }}>
          {leftPanel}
        </Paper>
      </Grid>
      <Grid height='100%' sx={{ overflowY: 'auto', overflowX: 'hidden' }} xs={8}>
        {children}
      </Grid>
    </Grid>
  );
}

export function MobileOrderDetailsLayout({ children }) {
  return (
    <Grid container spacing={1} sx={{ p: 0, m: 0 }}>
      <Grid xs={12}>
        <Paper elevation={0}>{children}</Paper>
      </Grid>
    </Grid>
  );
}
