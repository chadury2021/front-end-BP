import { GlobalStyles } from '@mui/material';

export function LoaderGlobalStyles() {
  return <GlobalStyles
    styles={{
      '.animate-draw path': {
        opacity: 0,
        transform: 'scale(0.95)',
        transformOrigin: 'center',
        transformBox: 'fill-box',
      },

      '.animate-draw .path-1': {
        animation:
          'draw-initial-1 1.2s ease-in-out 0s 1 forwards, ' +
          'cycle-hide 1.2s steps(1) 0.8s infinite',
      },
      '.animate-draw .path-4': {
        animation:
          'draw-initial-2 1.2s ease-in-out 0s 1 forwards, ' +
          'cycle-hide 1.2s steps(1) 1.1s infinite',
      },
      '.animate-draw .path-2': {
        animation:
          'draw-initial-3 1.2s ease-in-out 0s 1 forwards, ' +
          'cycle-hide 1.2s steps(1) 1.4s infinite',
      },
      '.animate-draw .path-3': {
        animation:
          'draw-initial-4 1.2s ease-in-out 0s 1 forwards, ' +
          'cycle-hide 1.2s steps(1) 1.7s infinite',
      },

      '@keyframes draw-initial-1': {
        '0%, 5%': {
          opacity: 0,
          transform: 'scale(0.95)',
        },
        '12%, 100%': {
          opacity: 1,
          transform: 'scale(1)',
        },
      },
      '@keyframes draw-initial-2': {
        '0%, 25%': {
          opacity: 0,
          transform: 'scale(0.95)',
        },
        '32%, 100%': {
          opacity: 1,
          transform: 'scale(1)',
        },
      },
      '@keyframes draw-initial-3': {
        '0%, 45%': {
          opacity: 0,
          transform: 'scale(0.95)',
        },
        '52%, 100%': {
          opacity: 1,
          transform: 'scale(1)',
        },
      },
      '@keyframes draw-initial-4': {
        '0%, 65%': {
          opacity: 0,
          transform: 'scale(0.95)',
        },
        '72%, 100%': {
          opacity: 1,
          transform: 'scale(1)',
        },
      },
      '@keyframes cycle-hide': {
        '0%, 25%': {
          opacity: 0,
          transform: 'scale(0.95)',
        },
        '25%, 100%': {
          opacity: 1,
          transform: 'scale(1)',
        },
      },
    }}
  />
}
