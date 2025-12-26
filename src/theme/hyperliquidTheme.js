import { createTheme } from '@mui/material/styles';
import typography from './typography';
import breakpoints from './breakpoints';
import spacing from './spacing';
import { holographicShimmer } from './holographicEffects';

// Hyperliquid color palette sampled from screenshot
const hyperliquidPalette = {
  base: {
    white: '#E6E8EA',
    black: '#0E1114',
    grey: '#141A1F',
  },
  common: {
    pureWhite: '#FFFFFF',
    pureBlack: '#000000',
    transparent: '#00C2A81A',
    // Hyperliquid grays from screenshot
    gray50: '#fafafa',
    gray100: '#f5f5f5',
    gray200: '#eeeeee',
    gray300: '#A0A0A0',
    gray400: '#bdbdbd',
    gray500: '#9e9e9e',
    gray600: '#616161',
    gray700: '#1F2A30',
    gray800: '#182229',
    gray900: '#141A1F',
  },
  brand: {
    0: '#00C2A800',
    25: '#ebfcf8',
    50: '#d7fbf1',
    100: '#b9f5e7',
    200: '#8fead8',
    300: '#62dcc8',
    400: '#36ceb8',
    500: '#00C2A8',
    600: '#00AD97',
    700: '#009985',
    800: '#018573',
    900: '#037061',
    950: '#024e44',
  },
  brandAlpha: {
    500: '#00C2A844',
  },
  blue: {
    25: '#f5f8ff',
    50: '#eff4ff',
    100: '#d1e0ff',
    200: '#b2ccff',
    300: '#84adff',
    400: '#528bff',
    500: '#00C2A8',
    600: '#155eef',
    700: '#004eeb',
    800: '#0040c1',
    900: '#00359e',
    950: '#002266',
  },
  error: {
    25: '#fffbfa',
    50: '#fff1f2',
    100: '#ffe2e4',
    200: '#ffcacd',
    300: '#fea4a9',
    400: '#fd7279',
    500: '#F6465D',
    600: '#e33135',
    700: '#bf262a',
    800: '#9e2124',
    900: '#822024',
    950: '#480b0d',
  },
  warning: {
    25: '#fffbeb',
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  grey: {
    25: '#fcfcfd',
    50: '#f9fafb',
    100: '#f2f4f7',
    200: '#eaecf0',
    300: '#d0d5dd',
    400: '#98a2b3',
    500: '#667085',
    600: '#616161',
    700: '#1F2A30',
    800: '#182229',
    900: '#141A1F',
    950: '#0E1114',
  },
  black: {
    25: '#f0f0f0',
    50: '#e6e6e6',
    100: '#cccccc',
    200: '#b3b3b3',
    300: '#808080',
    400: '#666666',
    500: '#4d4d4d',
    600: '#333333',
    700: '#1a1a1a',
    800: '#121212',
    900: '#000000',
  },
  ui: {
    border: '#1F2A30',
    backgroundLight: '#0F141A',
    backgroundMedium: '#141A1F',
    backgroundDark: '#0E1114',
    cardBackground: '#141A1F',
    inputBackground: '#0F141A',
    inputBorder: '#1F2A30',
    appBackground: '#0E1114',
  },
  semantic: {
    success: '#00C2A8',
    error: '#F6465D',
    warning: '#f59e0b',
    info: '#00C2A8',
  },
};

const hyperliquidTheme = createTheme({
  typography: {
    spacing: (factor) => spacing[factor] ?? factor * 8,
    allVariants: {
      color: 'var(--text-primary)',
      fontFamily: ['Inter', 'system-ui', 'sans-serif'].join(','),
    },
    fontFamily: ['Inter', 'system-ui', 'sans-serif'].join(','),
    // Expose font family configurations for components
    fontFamilyConfig: {
      primary: ['Inter', 'system-ui', 'sans-serif'].join(','),
      monospace: ['Inter', 'system-ui'].join(','),
      numbers: ['Inter', 'system-ui', 'sans-serif'].join(','),
      ui: ['Inter', 'system-ui', 'sans-serif'].join(','),
      text: ['Inter', 'system-ui', 'sans-serif'].join(','),
      data: ['Inter', 'system-ui'].join(','),
    },
    h1: {
      fontSize: typography.fontSizes[1100],
      lineHeight: typography.lineHeights[1100],
      fontWeight: typography.fontWeights.weight400,
    },
    h2: {
      fontSize: typography.fontSizes[1000],
      lineHeight: typography.lineHeights[1000],
      fontWeight: typography.fontWeights.weight400,
    },
    h3: {
      fontSize: typography.fontSizes[900],
      lineHeight: typography.lineHeights[900],
      fontWeight: typography.fontWeights.weight400,
    },
    h3Strong: {
      fontSize: typography.fontSizes[900],
      lineHeight: typography.lineHeights[900],
      fontWeight: typography.fontWeights.weight500,
    },
    h4: {
      fontSize: typography.fontSizes[800],
      lineHeight: typography.lineHeights[800],
      fontWeight: typography.fontWeights.weight400,
    },
    h4Strong: {
      fontSize: typography.fontSizes[800],
      lineHeight: typography.lineHeights[800],
      fontWeight: typography.fontWeights.weight500,
    },
    h5: {
      fontSize: typography.fontSizes[700],
      lineHeight: typography.lineHeights[700],
      fontWeight: typography.fontWeights.weight400,
    },
    h5Strong: {
      fontSize: typography.fontSizes[700],
      lineHeight: typography.lineHeights[700],
      fontWeight: typography.fontWeights.weight500,
    },
    h6: {
      fontSize: typography.fontSizes[600],
      lineHeight: typography.lineHeights[600],
      fontWeight: typography.fontWeights.weight400,
    },
    h6Strong: {
      fontSize: typography.fontSizes[600],
      lineHeight: typography.lineHeights[600],
      fontWeight: typography.fontWeights.weight500,
    },
    subtitle1: {
      fontSize: typography.fontSizes[500],
      lineHeight: typography.lineHeights[500],
      fontWeight: typography.fontWeights.weight500,
    },
    subtitle2: {
      fontSize: typography.fontSizes[400],
      lineHeight: typography.lineHeights[400],
      fontWeight: typography.fontWeights.weight500,
    },
    button: {
      textTransform: 'none',
      fontSize: typography.fontSizes[200],
      lineHeight: typography.lineHeights[200],
      fontWeight: typography.fontWeights.weight500,
    },
    button1: {
      fontSize: typography.fontSizes[300],
      lineHeight: typography.lineHeights[300],
      fontWeight: typography.fontWeights.weight400,
      textTransform: 'none',
    },
    button2: {
      fontSize: typography.fontSizes[200],
      lineHeight: typography.lineHeights[200],
      fontWeight: typography.fontWeights.weight500,
      textTransform: 'none',
    },
    body1: {
      fontSize: typography.fontSizes[200],
      lineHeight: typography.lineHeights[200],
      fontWeight: typography.fontWeights.weight400,
    },
    body1Strong: {
      fontSize: typography.fontSizes[200],
      lineHeight: typography.lineHeights[200],
      fontWeight: typography.fontWeights.weight500,
    },
    body2: {
      fontSize: typography.fontSizes[100],
      lineHeight: typography.lineHeights[100],
      fontWeight: typography.fontWeights.weight400,
    },
    body2Strong: {
      fontSize: typography.fontSizes[100],
      lineHeight: typography.lineHeights[100],
      fontWeight: typography.fontWeights.weight500,
    },
    body3: {
      fontSize: typography.fontSizes[200],
      lineHeight: typography.lineHeights[200],
      fontWeight: typography.fontWeights.weight400,
    },
    body3Strong: {
      fontSize: typography.fontSizes[200],
      lineHeight: typography.lineHeights[200],
      fontWeight: typography.fontWeights.weight500,
    },
    small1: {
      fontSize: typography.fontSizes[100],
      lineHeight: typography.lineHeights[100],
      fontWeight: typography.fontWeights.weight400,
    },
    small2: {
      fontSize: '0.6rem', // Even smaller than small1 for headers
      lineHeight: '0.8rem',
      fontWeight: typography.fontWeights.weight400,
    },
    cardTitle: {
      fontSize: typography.fontSizes[500],
      lineHeight: typography.lineHeights[500],
      fontWeight: typography.lineHeights[400],
    },
  },
  palette: {
    mode: 'dark',
    // expose common so we can reference theme.palette.common.pureWhite etc.
    common: {
      white: '#FFFFFF', // Pure white text
      black: '#1A1A1A', // Hyperliquid primary background
      pureWhite: '#FFFFFF',
      pureBlack: '#000000',
      transparent: '#00C0A01A', // Hyperliquid teal transparent
      gray50: '#fafafa',
      gray100: '#f5f5f5',
      gray200: '#eeeeee',
      gray300: '#A0A0A0', // Hyperliquid secondary text
      gray400: '#bdbdbd',
      gray500: '#9e9e9e',
      gray600: '#757575',
      gray700: '#616161',
      gray800: '#343A40', // Hyperliquid input field background
      gray900: '#212121', // Hyperliquid card/panel background
    },
    // MUI standard palette properties
    primary: {
      light: hyperliquidPalette.brand[400],
      main: hyperliquidPalette.brand[500], // Hyperliquid teal
      contrastText: hyperliquidPalette.common.pureBlack,
      dark: hyperliquidPalette.brand[600],
      dark2: hyperliquidPalette.brandAlpha[500],
      transparent: hyperliquidPalette.brandAlpha[500],
    },
    secondary: {
      main: '#28745E',
      contrastText: hyperliquidPalette.common.pureBlack,
    },
    info: {
      main: hyperliquidPalette.brand[900],
      contrastText: hyperliquidPalette.common.pureBlack,
    },
    pending: {
      main: hyperliquidPalette.grey[400],
    },
    success: {
      main: '#00C2A8', // Updated to match screenshot green
      dark2: 'rgb(2, 71, 44)', // Dark green for progress bar fill
    },
    error: {
      main: hyperliquidPalette.error[500],
      dark2: hyperliquidPalette.error[950],
    },
    warning: {
      main: hyperliquidPalette.semantic.warning,
      dark2: hyperliquidPalette.warning[950],
    },
    grey: {
      light: hyperliquidPalette.grey[300],
      main: hyperliquidPalette.grey[600],
      dark: hyperliquidPalette.grey[800],
      disabled: hyperliquidPalette.grey[400],
      transparent: 'rgba(100, 90, 100, 0.25)',
    },
    // MUI required action properties
    action: {
      active: hyperliquidPalette.brand[500],
      hover: 'rgba(0, 200, 83, 0.1)',
      selected: 'rgba(0, 200, 83, 0.2)',
      disabled: hyperliquidPalette.grey[500],
      disabledBackground: hyperliquidPalette.grey[800],
    },
    divider: hyperliquidPalette.grey[700],
    // MUI standard text and background
    text: {
      primary: '#FFFFFF',
      subtitle: '#FFFFFF',
      disabled: '#A3B1B9',
      grey: '#FFFFFF',
      offBlack: '#1A1A1A',
      offWhite: '#FFFFFF',
      secondary: '#FFFFFF',
    },
    background: {
      base: '#0E1114',
      container: '#141A1F',
      card: '#141A1F',
      paper: '#1F2A30',
      white: hyperliquidPalette.common.pureWhite,
      twoFa: '#141A1F',
      app: '#1B2429',
    },
    border: {
      twoFa: 'rgba(238, 255, 255, 0.23)',
    },
    // UI properties that components expect in palette
    ui: hyperliquidPalette.ui,
    semantic: hyperliquidPalette.semantic,
    options: {
      ask: '#F6465D',
      bid: '#00C2A8',
      put: '#2E1F24',
      call: '#102E2A',
      default: '#141A1F',
      highlight: '#22303A',
    },
    candlestick: {
      up: '#0F9881',
      down: '#F1434C',
      border: '#0F9881',
      wick: '#0F9881',
    },
    orderBook: {
      bid: '#102E2A',
      bidPrice: '#00C2A8',
      ask: '#2E1F24',
      askPrice: '#F6465D',
    },
    button: {
      grey: hyperliquidPalette.grey[700],
      lightGrey: hyperliquidPalette.grey[600],
    },
    charts: {
      red: '#F6465D',
      redTransparent: 'rgba(246, 70, 93, 0.5)',
      green: '#00C2A8',
      greenTransparent: 'rgba(0, 194, 168, 0.5)',
      gray: hyperliquidPalette.grey[400],
      lightGray: hyperliquidPalette.common.gray600,
      grayTransparent: 'rgba(150, 150, 150, 0.1)',
      pinkTransparent: 'rgba(184, 118, 169, 0.5)',
      orange: hyperliquidPalette.brand[500],
      orangeTransparent: 'rgba(0, 194, 168, 0.5)',
      blue: 'rgba(0, 194, 168, 0.8)',
      gridLines: '#22303A',
      OTC: hyperliquidPalette.brand[500],
      offWhite: hyperliquidPalette.grey[200],
      exposureTolerance: `${hyperliquidPalette.brand[600]}9A`,
      points: hyperliquidPalette.brand[600],
    },
    portfolioChart: {
      line: hyperliquidPalette.brand[500],
      ticks: hyperliquidPalette.grey[400],
    },
    orderUrgency: {
      background: hyperliquidPalette.common.transparent,
      ULTRA_LOW: '#10E090',
      LOW: hyperliquidPalette.semantic.success,
      MEDIUM: hyperliquidPalette.grey[400],
      HIGH: hyperliquidPalette.error[400],
      ULTRA_HIGH: hyperliquidPalette.error[500],
    },
    exchangeColors: {
      OKX: 'rgb(169, 169, 169)',
      OKXTransparent: 'rgba(169, 169, 169, 0.75)',
      Binance: 'rgb(230, 181, 26)',
      BinanceTransparent: 'rgba(230, 181, 26, 0.75)',
      BinancePM: 'rgb(230, 181, 26)',
      BinancePMTransparent: 'rgba(230, 181, 26, 0.75)',
      Bybit: 'rgb(230, 138, 26)',
      BybitTransparent: 'rgba(230, 138, 26, 0.75)',
      Deribit: 'rgb(51, 204, 204)',
      DeribitTransparent: 'rgba(51, 204, 204, 0.75)',
      Coinbase: 'rgb(26, 127, 229)',
      CoinbaseTransparent: 'rgba(26, 127, 229, 0.75)',
      MockExchange: 'rgb(255, 255, 255)',
      MockExchangeTransparent: 'rgba(255, 255, 255, 0.75)',
      Hyperliquid: '#95fce4',
      HyperliquidTransparent: '#95fce444',
    },
    message: {
      info: hyperliquidPalette.semantic.info,
      error: hyperliquidPalette.semantic.error,
    },
    strategy: {
      success: hyperliquidPalette.semantic.success,
      warning: hyperliquidPalette.semantic.warning,
      error: hyperliquidPalette.semantic.error,
      info: hyperliquidPalette.semantic.info,
    },
    tcaScheme: [
      [0.1, hyperliquidPalette.semantic.success],
      [0.2, '#44d29b'],
      [0.3, '#7ad9b4'],
      [0.4, '#b0e0cd'],
      [0.5, '#EEFFFF'],
      [0.6, '#EEFFFF'],
      [0.7, '#eabec4'],
      [0.8, '#ee96a2'],
      [0.9, '#f26e80'],
      [1.0, hyperliquidPalette.semantic.error],
    ],
    side: {
      buy: '#00C076', // Updated to match screenshot green
      sell: '#FF4A4A', // Updated to match screenshot red
    },
    card: {
      main: hyperliquidPalette.ui.backgroundDark,
      light: hyperliquidPalette.grey[800],
    },
    blue: hyperliquidPalette.blue,
    brand: hyperliquidPalette.brand, // Expose brand palette
  },
  breakpoints: {
    values: breakpoints,
  },
  spacing: 4,
  button: {
    textTransform: 'none',
  },
  fontFamily: ['Inter', 'system-ui', 'sans-serif'].join(','),
  // Global keyframes for holographic effects
  ...holographicShimmer,
  shadows: [
    'none',
    '0px 2px 4px rgba(16, 20, 24, 0.4)',
    '0px 4px 8px rgba(16, 20, 24, 0.4)',
    '0px 8px 16px rgba(16, 20, 24, 0.4)',
    '0px 12px 24px rgba(16, 20, 24, 0.4)',
    '0px 16px 32px rgba(16, 20, 24, 0.4)',
    '0px 20px 40px rgba(16, 20, 24, 0.4)',
    '0px 24px 48px rgba(16, 20, 24, 0.4)',
    '0px 28px 56px rgba(16, 20, 24, 0.4)',
    '0px 32px 64px rgba(16, 20, 24, 0.4)',
    '0px 36px 72px rgba(16, 20, 24, 0.4)',
    '0px 40px 80px rgba(16, 20, 24, 0.4)',
    '0px 44px 88px rgba(16, 20, 24, 0.4)',
    '0px 48px 96px rgba(16, 20, 24, 0.4)',
    '0px 52px 104px rgba(16, 20, 24, 0.4)',
    '0px 56px 112px rgba(16, 20, 24, 0.4)',
    '0px 60px 120px rgba(16, 20, 24, 0.4)',
    '0px 64px 128px rgba(16, 20, 24, 0.4)',
    '0px 68px 136px rgba(16, 20, 24, 0.4)',
    '0px 72px 144px rgba(16, 20, 24, 0.4)',
    '0px 76px 152px rgba(16, 20, 24, 0.4)',
    '0px 80px 160px rgba(16, 20, 24, 0.4)',
    '0px 84px 168px rgba(16, 20, 24, 0.4)',
    '0px 88px 176px rgba(16, 20, 24, 0.4)',
    '0px 92px 184px rgba(16, 20, 24, 0.4)',
  ],
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: ['Inter', 'system-ui', 'sans-serif'].join(','),
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'None',
          backgroundColor: hyperliquidPalette.ui.cardBackground,
          padding: 0,
          height: '100%',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation0: {
          backgroundColor: hyperliquidPalette.ui.cardBackground,
        },
        elevation1: {
          backgroundColor: hyperliquidPalette.ui.cardBackground,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          height: 'calc(100% - 32px)',
          padding: '16px',
          '&:last-child': {
            paddingBottom: '16px',
          },
        },
      },
    },
    StyledTableCell: {
      styleOverrides: {
        root: {
          backgroundColor: hyperliquidPalette.base.black,
          color: 'var(--text-primary)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: hyperliquidPalette.base.white,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: hyperliquidPalette.base.white,
          fontSize: '0.75rem',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: hyperliquidPalette.ui.cardBackground,
          '&.Mui-expanded': {
            backgroundColor: hyperliquidPalette.ui.cardBackground,
          },
          '& .MuiCollapse-root': {
            backgroundColor: hyperliquidPalette.ui.cardBackground,
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          backgroundColor: hyperliquidPalette.ui.cardBackground,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
        indicator: {
          backgroundColor: hyperliquidPalette.brand[500],
          height: 2,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minWidth: 'auto!important',
          padding: '6px 24px', // Increased horizontal padding
          fontSize: typography.fontSizes[400],
          textAlign: 'center', // Ensure text stays centered
          '& .MuiTab-wrapper': {
            display: 'flex',
            justifyContent: 'center', // Center the text
            width: '100%',
          },
        },
      },
    },
    MuiPopper: {
      styleOverrides: {
        root: {
          '& .MuiPaper-root': {
            backgroundColor: hyperliquidPalette.ui.cardBackground,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${hyperliquidPalette.grey[600]}`,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: hyperliquidPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${hyperliquidPalette.grey[600]}`,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        paper: {
          backgroundColor: hyperliquidPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${hyperliquidPalette.grey[600]}`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: hyperliquidPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${hyperliquidPalette.grey[600]}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: hyperliquidPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${hyperliquidPalette.grey[600]}`,
          color: hyperliquidPalette.base.white,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: hyperliquidPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${hyperliquidPalette.grey[600]}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: hyperliquidPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: hyperliquidPalette.base.white,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          backgroundColor: hyperliquidPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: hyperliquidPalette.base.white,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '0',
          padding: '5px 6px',
          fontWeight: 500,
          transition: 'all 0.3s ease-in-out',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
            transition: 'left 0.5s ease-in-out',
            opacity: 0,
          },
          '&:hover::before': {
            left: '100%',
            opacity: 1,
          },
          '&:hover': {
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.1)',
          },
          // Exclude nav buttons from holographic effect
          '&.MuiButton-root[data-nav="true"], &.MuiButton-root[aria-label*="nav"], &.MuiButton-root[aria-label*="Nav"]':
            {
              '&::before': {
                display: 'none',
              },
              '&:hover': {
                boxShadow: 'none',
              },
            },
        },
        contained: {
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 15px rgba(0, 0, 0, 0.2)',
          opacity: 0.9,
          fontWeight: 300,
          '&:hover': {
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow:
              'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 8px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.1)',
            opacity: 0.95,
          },
        },
        outlined: {
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          '&:hover': {
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 20px rgba(255, 255, 255, 0.1)',
          },
        },
        text: {
          backdropFilter: 'blur(5px)',
          '&:hover': {
            boxShadow: '0 0 15px rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: `1px solid ${hyperliquidPalette.grey[600]}`,
          color: hyperliquidPalette.brand[500],
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(0, 194, 168, 0.1)',
            borderColor: hyperliquidPalette.brand[500],
          },
          '&.Mui-selected': {
            backgroundColor: hyperliquidPalette.brand[500],
            color: hyperliquidPalette.common.pureBlack,
            '&:hover': {
              backgroundColor: hyperliquidPalette.brand[600],
              color: hyperliquidPalette.common.pureBlack,
            },
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          backgroundColor: hyperliquidPalette.ui.backgroundDark,
          color: `${hyperliquidPalette.base.white} !important`,
          '&.Mui-expanded': {
            backgroundColor: `${hyperliquidPalette.brand[500]} !important`,
            color: `${hyperliquidPalette.common.pureBlack} !important`,
            '& .MuiTypography-root': {
              color: `${hyperliquidPalette.common.pureBlack} !important`,
            },
          },
          '&:hover': {
            backgroundColor: hyperliquidPalette.grey[700],
            color: `${hyperliquidPalette.base.white} !important`,
          },
          '&.Mui-expanded:hover': {
            backgroundColor: `${hyperliquidPalette.brand[500]} !important`,
            color: `${hyperliquidPalette.common.pureBlack} !important`,
            '& .MuiTypography-root': {
              color: `${hyperliquidPalette.common.pureBlack} !important`,
            },
          },
          '& .MuiTypography-root': {
            color: 'inherit',
          },
        },
        // Primary color buttons should have black text
        primary: {
          color: hyperliquidPalette.black[700], // Black text for primary buttons
          '&:hover': {
            color: hyperliquidPalette.black[700], // Keep black text on hover
          },
        },
      },
    },
  },
});

export default hyperliquidTheme;
