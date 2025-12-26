import React from 'react';
import { Stack, Typography, Card, CardContent, Box, CardHeader, ButtonGroup, Button } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Link from '@mui/material/Link';

export default function LeaderboardPageComponent() {
  return (
    <Grid
      container
      spacing={2}
      sx={{
        height: '100%',
        width: '100%',
        margin: '0 auto', // centers the grid horizontally
      }}
    >
      <Box alignItems='center' display='flex' height='100%' justifyContent='center' width='100%'>
        <Stack direction='column' spacing={2}>
          <Typography variant='h6'>No points yet</Typography>
          <Button
            variant='contained'
            onClick={() => {
              window.location.href = '/';
            }}
          >
            Go to Trade
          </Button>
        </Stack>
      </Box>
    </Grid>
  );
}
