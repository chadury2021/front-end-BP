import React from 'react';
import { Box, CircularProgress, Fade, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

function PointsLoadingMask({ open, message = 'Loading points data…' }) {
  const theme = useTheme();

  return (
    <Fade unmountOnExit in={open}>
      <Box
        sx={{
          alignItems: 'center',
          backdropFilter: 'blur(8px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.82),
          display: 'flex',
          inset: 0,
          justifyContent: 'center',
          position: 'absolute',
          zIndex: 12,
        }}
      >
        <Stack alignItems='center' spacing={2}>
          <CircularProgress color='warning' />
          {message ? (
            <Typography color='text.secondary' variant='body2'>
              {message}
            </Typography>
          ) : null}
        </Stack>
      </Box>
    </Fade>
  );
}

export default PointsLoadingMask;
