import { Box, Card, CardContent, Stack, useTheme } from '@mui/material';
import Typography from '@mui/material/Typography';
import React from 'react';
import ScaleLoader from 'react-spinners/ScaleLoader';
import { FillExchangeChart, FillRoleChart } from './charts';

function FillPieCard({ analytics } = {}) {
  const theme = useTheme();
  const { breakdown_fill_exchange_data, breakdown_fills_role_data } = analytics;

  if (
    Object.keys(analytics).length === 0 ||
    Object.keys(breakdown_fill_exchange_data).length === 0 ||
    Object.keys(breakdown_fills_role_data).length === 0
  ) {
    return (
      <Card style={{ height: '100%', padding: 0 }}>
        <CardContent style={{ height: '100%', padding: 0 }}>
          <Box alignItems='center' display='flex' height='100%' justifyContent='center'>
            <ScaleLoader color={theme.palette.common.pureWhite} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ height: '100%' }}>
      <CardContent style={{ width: '100%', overflow: 'auto', height: 'calc(100% - 40px)' }}>
        <Stack direction='row' height='10%'>
          <Box style={{ height: '100%', width: '50%' }}>
            <Typography variant='h6'>Fill Type</Typography>
          </Box>
          <Box style={{ height: '100%', width: '50%' }}>
            <Typography variant='h6'>Exchange</Typography>
          </Box>
        </Stack>
        <Stack direction='row' height='90%' spacing={0}>
          <Box
            style={{
              height: 'calc(100% + 16px)',
              width: '99%',
              position: 'relative',
              marginTop: '-16px',
            }}
          >
            <FillRoleChart data={breakdown_fills_role_data} />
          </Box>
          <Box
            style={{
              height: 'calc(100% + 16px)',
              width: '99%',
              position: 'relative',
              marginTop: '-16px',
            }}
          >
            <FillExchangeChart data={breakdown_fill_exchange_data} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export { FillPieCard };
