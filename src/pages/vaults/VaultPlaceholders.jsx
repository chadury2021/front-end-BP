import { Box, Typography } from '@mui/material';

export function MarketDataErrorComponent({ error }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography align='center' color='error'>
        Error loading market data: {error?.message}
      </Typography>
    </Box>
  );
}

export function MarketDataEmptyComponent() {
  return (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography align='center' color='text.secondary'>
        No market data parameters available
      </Typography>
    </Box>
  );
}
