import { createTheme } from '@mui/material/styles';
import typography from './typography';
import breakpoints from './breakpoints';
import spacing from './spacing';
import { holographicShimmer } from './holographicEffects';

// OG theme color palette
const ogPalette = {
  base: {
    white: '#FFFFFF', // Primary text color
    black: '#191321', // App background
    grey: '#211A2A', // Card/panel background
  },
  common: {
    pureWhite: '#FFFFFF',
    pureBlack: '#000000',
    transparent: '#FFA3451A', // OG orange transparent
    // OG inspired grays
    gray50: '#fafafa',
    gray100: '#f5f5f5',
    gray200: '#eeeeee',
    gray300: '#CCCCCC', // Secondary text
    gray400: '#bdbdbd',
    gray500: '#9e9e9e',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#343A40', // Input field background
    gray900: '#1E2230', // Card/panel background
  },
  brand: {
    0: '#FFA34500', // OG orange transparent
    25: '#fff8f0',
    50: '#fff1e0',
    100: '#ffe3c2',
    200: '#ffd5a4',
    300: '#ffc786',
    400: '#ffb968',
    500: '#FFA345', // OG primary orange
    600: '#E6933E', // OG orange dark
    700: '#CC8337', // OG orange darker
    800: '#B37330',
    900: '#996329',
    950: '#805322',
  },
  brandAlpha: {
    500: '#FFA34544', // OG orange with alpha
  },
  blue: {
    25: '#f5f8ff',
    50: '#eff4ff',
    100: '#d1e0ff',
    200: '#b2ccff',
    300: '#84adff',
    400: '#528bff',
    500: '#2970ff',
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
    500: '#FF4A4A', // Error red
    600: '#E64444',
    700: '#CC3B3B',
    800: '#B33232',
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
  success: {
    25: '#f6fef9',
    50: '#f1fcf8',
    100: '#d1f6ed',
    200: '#a2edda',
    300: '#6ddcc4',
    400: '#3fc4ac',
    500: '#23ab94',
    600: '#1c8777',
    700: '#1a6c61',
    800: '#19564f',
    900: '#194942',
    950: '#092b28',
  },
  grey: {
    25: '#fafafa',
    50: '#f7f7f7',
    100: '#f0f0f1',
    200: '#ececed',
    300: '#cecfd2',
    400: '#94979c',
    500: '#85888e',
    600: '#61656c',
    700: '#373a41',
    750: '#211A2A', // OG container background
    800: '#1D1624', // OG paper background
    900: '#191321', // OG app background
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
    900: '#0D0F14',
  },
  // OG theme UI colors
  ui: {
    border: '#211A2A',
    backgroundLight: '#1D1624', // Paper/Container background
    backgroundMedium: '#211A2A', // Card background
    backgroundDark: '#191321', // App background
    cardBackground: '#211A2A',
    inputBackground: '#1D1624',
    inputBorder: '#211A2A',
    appBackground: '#191321', // Main app background color
  },
  semantic: {
    success: '#0ecb81',
    error: '#f6465d',
    warning: '#FFA345',
    info: '#FFDEBD',
  },
};

const ogTheme = createTheme({
  typography: {
    spacing: (factor) => spacing[factor] ?? factor * 8,
    allVariants: {
      color: 'var(--text-primary)',
      fontFamily: ['IBM PLEX MONO'].join(','),
    },
    fontFamily: ['IBM PLEX MONO'].join(','),
    // Expose font family configurations for components
    fontFamilyConfig: typography.themes.light,
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
      fontSize: typography.fontSizes[300],
      lineHeight: typography.lineHeights[300],
      fontWeight: typography.fontWeights.weight400,
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
      fontWeight: typography.fontWeights.weight300,
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
      fontWeight: typography.fontWeights.weight300,
    },
    body1Strong: {
      fontSize: typography.fontSizes[200],
      lineHeight: typography.lineHeights[200],
      fontWeight: typography.fontWeights.weight500,
    },
    body2: {
      fontSize: typography.fontSizes[100],
      lineHeight: typography.lineHeights[100],
      fontWeight: typography.fontWeights.weight300,
    },
    body2Strong: {
      fontSize: typography.fontSizes[300],
      lineHeight: typography.lineHeights[300],
      fontWeight: typography.fontWeights.weight400,
    },
    body3: {
      fontSize: typography.fontSizes[200],
      lineHeight: typography.lineHeights[200],
      fontWeight: typography.fontWeights.weight300,
    },
    body3Strong: {
      fontSize: typography.fontSizes[200],
      lineHeight: typography.lineHeights[200],
      fontWeight: typography.fontWeights.weight400,
    },
    small1: {
      fontSize: typography.fontSizes[200],
      lineHeight: typography.lineHeights[200],
      fontWeight: typography.fontWeights.weight200,
    },
    small2: {
      fontSize: typography.fontSizes[100],
      lineHeight: typography.lineHeights[100],
      fontWeight: typography.fontWeights.weight200,
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
      white: '#FFFFFF', // OG primary text
      black: '#0D0f14', // OG primary background
      pureWhite: '#FFFFFF',
      pureBlack: '#000000',
      transparent: '#FFA3451A', // OG orange transparent
      gray50: '#fafafa',
      gray100: '#f5f5f5',
      gray200: '#eeeeee',
      gray300: '#CCCCCC',
      gray400: '#bdbdbd',
      gray500: '#9e9e9e',
      gray600: '#757575',
      gray700: '#616161',
      gray800: '#343A40',
      gray900: '#1E2230',
    },
    // expose additional groups used in components
    ui: ogPalette.ui,
    semantic: ogPalette.semantic,
    black: ogPalette.black,
    text: {
      primary: '#FFFFFF', // OG primary text
      subtitle: '#B3B3B3', // OG subtitle text
      disabled: '#666666', // OG disabled text
      grey: '#CCCCCC', // OG secondary text
      offBlack: '#000000', // Black text for primary buttons
      offWhite: '#FFFFFF', // OG primary text
      secondary: 'rgba(255, 255, 255, 0.7)', // OG primary text with opacity
    },
    primary: {
      light: '#FFDEBD', // OG orange light
      main: '#FFA345', // OG primary orange
      dark: '#E6933E', // OG orange dark
      dark2: ogPalette.brandAlpha[500],
      transparent: ogPalette.brandAlpha[500],
      contrastText: '#000000', // Black text for primary buttons
    },
    secondary: {
      main: '#FFF8F2', // OG orange for selected status buttons
    },
    info: {
      main: '#FFDEBD', // OG orange (same as primary)
    },
    pending: {
      main: ogPalette.grey[400],
    },
    success: {
      main: ogPalette.semantic.success,
      dark2: 'rgb(2, 71, 44)', // Dark green for progress bar fill
    },
    error: {
      main: ogPalette.error[500],
      dark2: ogPalette.error[950],
    },
    warning: {
      main: ogPalette.semantic.warning,
      dark2: ogPalette.warning[950],
    },
    background: {
      base: '#191321', // App background
      container: '#1D1624', // Container background
      card: '#211A2A', // Card background
      paper: '#191321', // Paper background
      white: ogPalette.common.pureWhite,
      twoFa: ogPalette.grey[750],
      app: '#191321', // App background
    },
    border: {
      twoFa: 'rgba(238, 255, 255, 0.23)',
    },
    button: {
      grey: ogPalette.grey[700],
      lightGrey: ogPalette.grey[600],
    },
    charts: {
      red: ogPalette.error[500],
      redTransparent: 'rgba(246, 70, 93, 0.5)',
      green: ogPalette.semantic.success,
      greenTransparent: 'rgba(14, 203, 129, 0.5)',
      gray: ogPalette.grey[400],
      lightGray: ogPalette.common.gray600,
      grayTransparent: 'rgba(150, 150, 150, 0.1)',
      pinkTransparent: 'rgba(184, 118, 169, 0.5)',
      orange: ogPalette.brand[500],
      orangeTransparent: 'rgba(255, 163, 69, 0.5)',
      blue: 'rgba(57, 124, 191, 0.8)',
      gridLines: ogPalette.grey[600],
      OTC: ogPalette.brand[500],
      offWhite: ogPalette.grey[200],
      exposureTolerance: `${ogPalette.brand[600]}9A`,
      points: ogPalette.brand[500],
    },
    portfolioChart: {
      line: ogPalette.brand[500],
      ticks: ogPalette.grey[400],
    },
    card: {
      main: ogPalette.ui.backgroundDark,
      light: ogPalette.grey[800],
    },
    side: {
      buy: ogPalette.semantic.success,
      sell: ogPalette.error[500],
    },
    orderUrgency: {
      background: ogPalette.common.transparent,
      ULTRA_LOW: '#10E090',
      LOW: ogPalette.semantic.success,
      MEDIUM: ogPalette.grey[400],
      HIGH: ogPalette.error[400],
      ULTRA_HIGH: ogPalette.error[500],
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
    grey: {
      light: ogPalette.grey[300],
      main: ogPalette.grey[600],
      dark: ogPalette.grey[800],
      disabled: ogPalette.grey[400],
      transparent: 'rgba(100, 90, 100, 0.25)',
    },
    // MUI required action properties
    action: {
      active: ogPalette.brand[500],
      hover: 'rgba(255, 119, 15, 0.1)',
      selected: 'rgba(255, 119, 15, 0.2)',
      disabled: ogPalette.grey[500],
      disabledBackground: ogPalette.grey[800],
    },
    divider: ogPalette.grey[700],
    brand: ogPalette.brand, // Expose brand palette
    blue: ogPalette.blue, // Expose blue palette
    options: {
      ask: '#FF4A4A', // Updated to match screenshot red
      bid: '#00C076', // Updated to match screenshot green
      put: '#29171b',
      call: '#152419',
      default: '#211A2A',
      highlight: '#211A2A',
    },
    candlestick: {
      up: '#0F9881',
      down: '#F1434C',
      border: '#0F9881',
      wick: '#0F9881',
    },
    orderBook: {
      bid: '#11312f',
      bidPrice: '#00C076', // Updated to match screenshot green
      ask: '#392831',
      askPrice: '#FF4A4A', // Updated to match screenshot red
    },
    message: {
      info: ogPalette.semantic.info,
      error: ogPalette.semantic.error,
    },
    strategy: {
      success: ogPalette.semantic.success,
      warning: ogPalette.semantic.warning,
      error: ogPalette.semantic.error,
      info: ogPalette.semantic.info,
    },
    tcaScheme: [
      [0.1, ogPalette.semantic.success],
      [0.2, '#44d29b'],
      [0.3, '#7ad9b4'],
      [0.4, '#b0e0cd'],
      [0.5, '#EEFFFF'],
      [0.6, '#EEFFFF'],
      [0.7, '#eabec4'],
      [0.8, '#ee96a2'],
      [0.9, '#f26e80'],
      [1.0, ogPalette.semantic.error],
    ],
    // TradingView header/toolbar colors
    tradingView: {
      headerBg: '#191321',
      headerFg: '#FFFFFF',
      toolbarBg: '#1D1624',
      toolbarFg: '#FFFFFF',
      toolbarBtnBg: '#1D1624',
      toolbarBtnFg: '#FFFFFF',
      toolbarBtnHoverBg: '#211A2A',
      toolbarBtnHoverFg: '#FFFFFF',
      symbolBg: '#1D1624',
      symbolFg: '#FFFFFF',
      priceBg: '#1D1624',
      priceFg: '#FFFFFF',
    },
  },
  breakpoints: {
    values: breakpoints,
  },
  spacing: 4,
  button: {
    textTransform: 'none',
  },
  fontFamily: ['IBM PLEX MONO'].join(','), // Use IBM Plex Mono for UI text
  // Global keyframes for holographic effects
  ...holographicShimmer,
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: ['IBM PLEX MONO'].join(','), // Use IBM Plex Mono for UI text
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'None',
          backgroundColor: ogPalette.ui.cardBackground,
          padding: 0,
          height: '100%',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation0: {
          backgroundColor: ogPalette.ui.backgroundLight,
        },
        elevation1: {
          backgroundColor: ogPalette.ui.backgroundLight,
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
          backgroundColor: ogPalette.base.black,
          color: 'var(--text-primary)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: ogPalette.base.white,
          '&.Mui-disabled': {
            color: ogPalette.base.white,
            '& input': {
              color: ogPalette.base.white,
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: ogPalette.base.white,
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
          backgroundColor: ogPalette.ui.cardBackground,
          '&.Mui-expanded': {
            backgroundColor: ogPalette.ui.cardBackground,
          },
          '& .MuiCollapse-root': {
            backgroundColor: ogPalette.ui.cardBackground,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          backgroundColor: ogPalette.ui.backgroundDark,
          color: `${ogPalette.base.white} !important`,
          '&.Mui-expanded': {
            backgroundColor: `${ogPalette.brand[500]} !important`,
            color: `${ogPalette.common.pureBlack} !important`,
            '& .MuiTypography-root': {
              color: `${ogPalette.common.pureBlack} !important`,
            },
          },
          '&:hover': {
            backgroundColor: ogPalette.grey[700],
            color: `${ogPalette.base.white} !important`,
          },
          '&.Mui-expanded:hover': {
            backgroundColor: `${ogPalette.brand[500]} !important`,
            color: `${ogPalette.common.pureBlack} !important`,
            '& .MuiTypography-root': {
              color: `${ogPalette.common.pureBlack} !important`,
            },
          },
          '& .MuiTypography-root': {
            color: 'inherit',
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          backgroundColor: ogPalette.ui.cardBackground,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
        indicator: {
          backgroundColor: ogPalette.brand[500],
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
            backgroundColor: ogPalette.ui.cardBackground,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${ogPalette.grey[600]}`,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: ogPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${ogPalette.grey[600]}`,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        paper: {
          backgroundColor: ogPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${ogPalette.grey[600]}`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: ogPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${ogPalette.grey[600]}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: ogPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${ogPalette.grey[600]}`,
          color: ogPalette.base.white,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: ogPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${ogPalette.grey[600]}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: ogPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: ogPalette.base.white,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          backgroundColor: ogPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: ogPalette.base.white,
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
        // Primary color buttons should have black text
        primary: {
          color: ogPalette.black[700], // Black text for primary buttons
          '&:hover': {
            color: ogPalette.black[700], // Keep black text on hover
          },
        },
      },
    },
  },
});

export default ogTheme;
