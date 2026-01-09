import { Box } from '@mui/material';
import BeatLoader from 'react-spinners/BeatLoader';
import Skeleton from '@mui/material/Skeleton';

export function Loader() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <svg className="animate-draw" fill="none" height="38" viewBox="0 0 38 38" width="38"
           xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_2779_304)">
          <path className="path-1"
                d="M26.4517 3.80076L21.3872 8.73477V0H16.5444V8.73477L11.4791 3.80076L8.10352 7.27859L18.9657 17.8607L29.8281 7.27859L26.4517 3.80076Z"
                fill="#BFBFBF" />
          <path className="path-2"
                d="M29.8281 30.7214L18.9657 20.1393L8.10352 30.7214L11.4791 34.1992L16.5444 29.2652V38H21.3872V29.2652L26.4517 34.1992L29.8281 30.7214Z"
                fill="#BFBFBF" />
          <path className="path-4"
                d="M7.26573 8.11847L3.79404 11.5007L8.71932 16.5742H0V21.4257H8.71932L3.79404 26.4991L7.26573 29.8815L17.8291 19L7.26573 8.11847Z"
                fill="white" />
          <path className="path-3"
                d="M37.9327 16.5742H29.2133L34.1386 11.5007L30.6669 8.11847L20.1035 19L30.6669 29.8815L34.1386 26.4991L29.2133 21.4257H37.9327V16.5742Z"
                fill="white" />
        </g>
        <defs>
          <clipPath id="clip0_2779_304">
            <rect fill="white" height="38" width="38" />
          </clipPath>
        </defs>
      </svg>
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
