import { createTheme } from '@mui/material/styles';
import typography from './typography';
import breakpoints from './breakpoints';
import spacing from './spacing';
import { holographicShimmer } from './holographicEffects';

// Deribit theme color palette
const deribitPalette = {
  base: {
    white: '#E6EAF2', // Primary text color from Deribit
    black: '#0B0F14', // App background per reference
    grey: '#161E28', // Card/panel background per reference
  },
  common: {
    pureWhite: '#FFFFFF',
    pureBlack: '#000000',
    transparent: '#0CCCB11A', // Deribit teal transparent
    // Deribit inspired grays
    gray50: '#fafafa',
    gray100: '#f5f5f5',
    gray200: '#eeeeee',
    gray300: '#A7B1C2', // Secondary text from Deribit
    gray400: '#bdbdbd',
    gray500: '#9e9e9e',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#343A40', // Input field background
    gray900: '#161E28', // Card/panel background from Deribit
  },
  brand: {
    0: '#0CCCB100', // Deribit teal transparent
    25: '#f0fdfc',
    50: '#e6faf8',
    100: '#ccf5f0',
    200: '#99ebe1',
    300: '#66e1d2',
    400: '#33d7c3',
    500: '#0CCCB1', // Deribit primary teal
    600: '#0AB39A', // Deribit teal light
    700: '#089A83', // Deribit teal dark
    800: '#07816c',
    900: '#066855',
    950: '#044f3e',
  },
  brandAlpha: {
    500: '#0CCCB144', // Deribit teal with alpha
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
    500: '#FF4A4A', // Updated to match screenshot red
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
    750: '#161E28', // Deribit container background
    800: '#111820', // Deribit paper background
    900: '#0B0F14', // Deribit app background
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
    900: '#0B0F14', // Deribit app background
  },
  // Deribit theme UI colors
  ui: {
    border: '#161E28',
    backgroundLight: '#111820', // Paper/Container background per reference
    backgroundMedium: '#161E28', // Card background per reference
    backgroundDark: '#0B0F14', // App background per reference
    cardBackground: '#161E28',
    inputBackground: '#111820',
    inputBorder: '#161E28',
    appBackground: '#0B0F14', // Main app background color
  },
  semantic: {
    success: '#0ecb81',
    error: '#f6465d',
    warning: '#FF9830',
    info: '#0CCCB1',
  },
};

const deribitTheme = createTheme({
  typography: {
    spacing: (factor) => spacing[factor] ?? factor * 8,
    allVariants: {
      color: 'var(--text-primary)',
      fontFamily: ['Inter', 'Arial', 'sans-serif'].join(','),
    },
    fontFamily: ['Inter', 'Arial', 'sans-serif'].join(','),
    // Expose font family configurations for components
    fontFamilyConfig: typography.themes.deribit,
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
      white: '#E6EAF2', // Deribit primary text
      black: '#0B0F14', // Deribit primary background
      pureWhite: '#FFFFFF',
      pureBlack: '#000000',
      transparent: '#0CCCB11A', // Deribit teal transparent
      gray50: '#fafafa',
      gray100: '#f5f5f5',
      gray200: '#eeeeee',
      gray300: '#A7B1C2', // Deribit secondary text
      gray400: '#bdbdbd',
      gray500: '#9e9e9e',
      gray600: '#757575',
      gray700: '#616161',
      gray800: '#343A40', // Input field background
      gray900: '#161E28', // Deribit card/panel background
    },
    // expose additional groups used in components
    ui: deribitPalette.ui,
    semantic: deribitPalette.semantic,
    black: deribitPalette.black,
    text: {
      primary: '#E6EAF2', // Deribit primary text
      subtitle: '#C3CBD6', // Deribit subtitle text
      disabled: '#6B7787', // Deribit disabled text
      grey: '#A7B1C2', // Deribit secondary text
      offBlack: '#000000', // Black text for primary buttons
      offWhite: '#E6EAF2', // Deribit primary text
      secondary: 'rgba(230, 234, 242, 0.7)', // Deribit primary text with opacity
    },
    primary: {
      light: '#008971', // Deribit teal light
      main: '#0CCCB1', // Deribit primary teal
      dark: '#00705C', // Deribit teal dark
      dark2: deribitPalette.brandAlpha[500],
      transparent: deribitPalette.brandAlpha[500],
      contrastText: '#000000', // Black text for primary buttons
    },
    secondary: {
      main: '#008971', // Deribit teal for selected status buttons (same as primary)
    },
    info: {
      main: '#008971', // Deribit teal (same as primary)
    },
    pending: {
      main: deribitPalette.grey[400],
    },
    success: {
      main: deribitPalette.semantic.success,
      dark2: 'rgb(2, 71, 44)', // Dark green for progress bar fill
    },
    error: {
      main: deribitPalette.error[500],
      dark2: deribitPalette.error[950],
    },
    warning: {
      main: deribitPalette.semantic.warning,
      dark2: deribitPalette.warning[950],
    },
    background: {
      base: '#0B0F14', // App background per reference
      container: '#0E151D', // Container background per reference
      card: '#161E28', // Card background per reference
      paper: '#0E151D', // Paper background per reference - darker for action bar contrast
      white: deribitPalette.common.pureWhite,
      twoFa: deribitPalette.grey[750],
      app: '#0B0F14', // App background per reference
    },
    border: {
      twoFa: 'rgba(238, 255, 255, 0.23)',
    },
    button: {
      grey: deribitPalette.grey[700],
      lightGrey: deribitPalette.grey[600],
    },
    charts: {
      red: deribitPalette.error[500],
      redTransparent: 'rgba(246, 70, 93, 0.5)',
      green: deribitPalette.semantic.success,
      greenTransparent: 'rgba(14, 203, 129, 0.5)',
      gray: deribitPalette.grey[400],
      lightGray: deribitPalette.common.gray600,
      grayTransparent: 'rgba(150, 150, 150, 0.1)',
      pinkTransparent: 'rgba(184, 118, 169, 0.5)',
      orange: deribitPalette.brand[500],
      orangeTransparent: 'rgba(12, 204, 177, 0.5)',
      blue: 'rgba(57, 124, 191, 0.8)',
      gridLines: deribitPalette.grey[600],
      OTC: deribitPalette.brand[500],
      offWhite: deribitPalette.grey[200],
      exposureTolerance: `${deribitPalette.brand[600]}9A`,
      points: deribitPalette.brand[600],
    },
    portfolioChart: {
      line: deribitPalette.brand[500],
      ticks: deribitPalette.grey[400],
    },
    card: {
      main: deribitPalette.ui.backgroundDark,
      light: deribitPalette.grey[800],
    },
    side: {
      buy: deribitPalette.semantic.success,
      sell: deribitPalette.error[500],
    },
    orderUrgency: {
      background: deribitPalette.common.transparent,
      ULTRA_LOW: '#10E090',
      LOW: deribitPalette.semantic.success,
      MEDIUM: deribitPalette.grey[400],
      HIGH: deribitPalette.error[400],
      ULTRA_HIGH: deribitPalette.error[500],
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
      light: deribitPalette.grey[300],
      main: deribitPalette.grey[600],
      dark: deribitPalette.grey[800],
      disabled: deribitPalette.grey[400],
      transparent: 'rgba(100, 90, 100, 0.25)',
    },
    // MUI required action properties
    action: {
      active: deribitPalette.brand[500],
      hover: 'rgba(12, 204, 177, 0.1)',
      selected: 'rgba(12, 204, 177, 0.2)',
      disabled: deribitPalette.grey[500],
      disabledBackground: deribitPalette.grey[800],
    },
    divider: deribitPalette.grey[700],
    brand: deribitPalette.brand, // Expose brand palette
    blue: deribitPalette.blue, // Expose blue palette
    options: {
      ask: '#FF4A4A', // Updated to match screenshot red
      bid: '#00C076', // Updated to match screenshot green
      put: '#29171b',
      call: '#152419',
      default: '#181818',
      highlight: '#161E28',
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
      info: deribitPalette.semantic.info,
      error: deribitPalette.semantic.error,
    },
    strategy: {
      success: deribitPalette.semantic.success,
      warning: deribitPalette.semantic.warning,
      error: deribitPalette.semantic.error,
      info: deribitPalette.semantic.info,
    },
    tcaScheme: [
      [0.1, deribitPalette.semantic.success],
      [0.2, '#44d29b'],
      [0.3, '#7ad9b4'],
      [0.4, '#b0e0cd'],
      [0.5, '#EEFFFF'],
      [0.6, '#EEFFFF'],
      [0.7, '#eabec4'],
      [0.8, '#ee96a2'],
      [0.9, '#f26e80'],
      [1.0, deribitPalette.semantic.error],
    ],
    // TradingView header/toolbar colors
    tradingView: {
      headerBg: '#0B0F14',
      headerFg: '#E6EAF2',
      toolbarBg: '#111820',
      toolbarFg: '#E6EAF2',
      toolbarBtnBg: '#111820',
      toolbarBtnFg: '#E6EAF2',
      toolbarBtnHoverBg: '#161E28',
      toolbarBtnHoverFg: '#E6EAF2',
      symbolBg: '#111820',
      symbolFg: '#E6EAF2',
      priceBg: '#111820',
      priceFg: '#E6EAF2',
    },
  },
  breakpoints: {
    values: breakpoints,
  },
  spacing: 4,
  button: {
    textTransform: 'none',
  },
  fontFamily: ['Inter', 'Arial', 'sans-serif'].join(','), // Use Inter for UI text
  // Global keyframes for holographic effects
  ...holographicShimmer,
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: ['Inter', 'Arial', 'sans-serif'].join(','), // Use Inter for UI text
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'None',
          backgroundColor: deribitPalette.ui.cardBackground,
          padding: 0,
          height: '100%',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation0: {
          backgroundColor: deribitPalette.ui.backgroundLight,
        },
        elevation1: {
          backgroundColor: deribitPalette.ui.backgroundLight,
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
          backgroundColor: deribitPalette.base.black,
          color: 'var(--text-primary)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: deribitPalette.base.white,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: deribitPalette.base.white,
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
          backgroundColor: deribitPalette.ui.cardBackground,
          '&.Mui-expanded': {
            backgroundColor: deribitPalette.ui.cardBackground,
          },
          '& .MuiCollapse-root': {
            backgroundColor: deribitPalette.ui.cardBackground,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          backgroundColor: deribitPalette.ui.backgroundDark,
          '&.Mui-expanded': {
            backgroundColor: deribitPalette.brand[500],
            color: deribitPalette.common.pureBlack, // Use theme black when accordion is open
            '& .MuiAccordionSummary-content': {
              color: deribitPalette.common.pureBlack, // Use theme black for content when accordion is open
            },
            '& .MuiAccordionSummary-content .MuiTypography-root': {
              color: deribitPalette.common.pureBlack, // Target typography elements specifically
            },
            '& .MuiAccordionSummary-content *': {
              color: deribitPalette.common.pureBlack, // Target all child elements
            },
          },
          '&:hover': {
            backgroundColor: deribitPalette.grey[700],
          },
          '&.Mui-expanded:hover': {
            backgroundColor: deribitPalette.brand[500],
            color: deribitPalette.common.pureBlack, // Keep theme black text on hover when expanded
            '& .MuiAccordionSummary-content': {
              color: deribitPalette.common.pureBlack, // Keep theme black text for content on hover when expanded
            },
            '& .MuiAccordionSummary-content .MuiTypography-root': {
              color: deribitPalette.common.pureBlack, // Target typography elements specifically on hover
            },
            '& .MuiAccordionSummary-content *': {
              color: deribitPalette.common.pureBlack, // Target all child elements on hover
            },
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          backgroundColor: deribitPalette.ui.cardBackground,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
        indicator: {
          backgroundColor: deribitPalette.brand[500],
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
            backgroundColor: deribitPalette.ui.cardBackground,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${deribitPalette.grey[600]}`,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: deribitPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${deribitPalette.grey[600]}`,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        paper: {
          backgroundColor: deribitPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${deribitPalette.grey[600]}`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: deribitPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${deribitPalette.grey[600]}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: deribitPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${deribitPalette.grey[600]}`,
          color: deribitPalette.base.white,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: deribitPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${deribitPalette.grey[600]}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: deribitPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: deribitPalette.base.white,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          backgroundColor: deribitPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: deribitPalette.base.white,
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
          color: deribitPalette.black[700], // Black text for primary buttons
          '&:hover': {
            color: deribitPalette.black[700], // Keep black text on hover
          },
        },
      },
    },
  },
});

export default deribitTheme;
