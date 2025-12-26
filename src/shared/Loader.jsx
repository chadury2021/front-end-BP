import { Box } from '@mui/material';
import ScaleLoader from 'react-spinners/ScaleLoader';
import BeatLoader from 'react-spinners/BeatLoader';
import { useTheme } from '@emotion/react';
import Skeleton from '@mui/material/Skeleton';

export function Loader() {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <ScaleLoader color={theme.palette.primary.main} />
    </Box>
  );
}

export function ThinLoader() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
      }}
    >
      <BeatLoader color='rgb(150, 150, 150)' size={10} speedMultiplier={2 / 3} />
    </Box>
  );
}

export function BigSkeleton({ height = '100px' }) {
  return <Skeleton height={height} variant='rounded' width='100%' />;
}
