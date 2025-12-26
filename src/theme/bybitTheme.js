import { createTheme } from '@mui/material/styles';
import typography from './typography';
import breakpoints from './breakpoints';
import spacing from './spacing';
import { holographicShimmer } from './holographicEffects';

// Bybit theme color palette
const bybitPalette = {
  base: {
    white: '#EAECEF', // Primary text color from Bybit
    black: '#101014', // App background per reference
    grey: '#1A1E23', // Card/panel background per reference
  },
  common: {
    pureWhite: '#FFFFFF',
    pureBlack: '#000000',
    transparent: '#F8A8051A', // Bybit orange transparent
    // Bybit inspired grays
    gray50: '#fafafa',
    gray100: '#f5f5f5',
    gray200: '#eeeeee',
    gray300: '#9AA4AF', // Secondary text from Bybit
    gray400: '#bdbdbd',
    gray500: '#9e9e9e',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#343A40', // Input field background
    gray900: '#1A1E23', // Card/panel background from Bybit
  },
  brand: {
    0: '#F8A80500', // Bybit orange transparent
    25: '#fef9e7',
    50: '#fdf4d0',
    100: '#fbe8a1',
    200: '#f8d572',
    300: '#f5c243',
    400: '#f2af14',
    500: '#F8A805', // Bybit primary orange
    600: '#FFDA4F', // Bybit orange light
    700: '#C27A00', // Bybit orange dark
    800: '#e6a729',
    900: '#d99a26',
    950: '#cc8d23',
  },
  brandAlpha: {
    500: '#F8A80544', // Bybit orange with alpha
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
    750: '#1A1E23', // Bybit container background
    800: '#14171B', // Bybit paper background
    900: '#101014', // Bybit app background
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
    900: '#101014', // Bybit app background
  },
  // Bybit theme UI colors
  ui: {
    border: '#1A1E23',
    backgroundLight: '#14171B', // Paper/Container background per reference
    backgroundMedium: '#1A1E23', // Card background per reference
    backgroundDark: '#101014', // App background per reference
    cardBackground: '#1A1E23',
    inputBackground: '#14171B',
    inputBorder: '#1A1E23',
    appBackground: '#101014', // Main app background color
  },
  semantic: {
    success: '#0ecb81',
    error: '#f6465d',
    warning: '#FF9830',
    info: '#F8A805',
  },
};

const bybitTheme = createTheme({
  typography: {
    spacing: (factor) => spacing[factor] ?? factor * 8,
    allVariants: {
      color: 'var(--text-primary)',
      fontFamily: ['IBM Plex Sans', 'Arial', 'sans-serif'].join(','),
    },
    fontFamily: ['IBM Plex Sans', 'Arial', 'sans-serif'].join(','),
    // Expose font family configurations for components
    fontFamilyConfig: typography.themes.bybit,
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
      white: '#EAECEF', // Bybit primary text
      black: '#101014', // Bybit primary background
      pureWhite: '#FFFFFF',
      pureBlack: '#000000',
      transparent: '#F8A8051A', // Bybit orange transparent
      gray50: '#fafafa',
      gray100: '#f5f5f5',
      gray200: '#eeeeee',
      gray300: '#9AA4AF', // Bybit secondary text
      gray400: '#bdbdbd',
      gray500: '#9e9e9e',
      gray600: '#757575',
      gray700: '#616161',
      gray800: '#343A40', // Input field background
      gray900: '#1A1E23', // Bybit card/panel background
    },
    // expose additional groups used in components
    ui: bybitPalette.ui,
    semantic: bybitPalette.semantic,
    black: bybitPalette.black,
    text: {
      primary: '#EAECEF', // Bybit primary text
      subtitle: '#C7CDD3', // Bybit subtitle text
      disabled: '#5C6773', // Bybit disabled text
      grey: '#9AA4AF', // Bybit secondary text
      offBlack: '#000000', // Black text for primary buttons
      offWhite: '#EAECEF', // Bybit primary text
      secondary: 'rgba(234, 236, 239, 0.7)', // Bybit primary text with opacity
    },
    primary: {
      light: '#FFDA4F', // Bybit orange light
      main: '#F8A805', // Bybit primary orange
      dark: '#C27A00', // Bybit orange dark
      dark2: bybitPalette.brandAlpha[500],
      transparent: bybitPalette.brandAlpha[500],
      contrastText: '#000000', // Black text for primary buttons
    },
    secondary: {
      main: '#FFDA4F', // Bybit orange for selected status buttons (same as primary)
    },
    info: {
      main: '#FFDA4F', // Bybit orange (same as primary)
    },
    pending: {
      main: bybitPalette.grey[400],
    },
    success: {
      main: bybitPalette.semantic.success,
      dark2: 'rgb(2, 71, 44)', // Dark green for progress bar fill
    },
    error: {
      main: bybitPalette.error[500],
      dark2: bybitPalette.error[950],
    },
    warning: {
      main: bybitPalette.semantic.warning,
      dark2: bybitPalette.warning[950],
    },
    background: {
      base: '#101014', // App background per reference
      container: '#0F1115', // Container background per reference
      card: '#1A1E23', // Card background per reference
      paper: '#101014', // Paper background per reference - matches app background for better contrast
      white: bybitPalette.common.pureWhite,
      twoFa: bybitPalette.grey[750],
      app: '#101014', // App background per reference
    },
    border: {
      twoFa: 'rgba(238, 255, 255, 0.23)',
    },
    button: {
      grey: bybitPalette.grey[700],
      lightGrey: bybitPalette.grey[600],
    },
    charts: {
      red: bybitPalette.error[500],
      redTransparent: 'rgba(246, 70, 93, 0.5)',
      green: bybitPalette.semantic.success,
      greenTransparent: 'rgba(14, 203, 129, 0.5)',
      gray: bybitPalette.grey[400],
      lightGray: bybitPalette.common.gray600,
      grayTransparent: 'rgba(150, 150, 150, 0.1)',
      pinkTransparent: 'rgba(184, 118, 169, 0.5)',
      orange: bybitPalette.brand[500],
      orangeTransparent: 'rgba(248, 168, 5, 0.5)',
      blue: 'rgba(57, 124, 191, 0.8)',
      gridLines: bybitPalette.grey[600],
      OTC: bybitPalette.brand[500],
      offWhite: bybitPalette.grey[200],
      exposureTolerance: `${bybitPalette.brand[600]}9A`,
      points: bybitPalette.brand[600],
    },
    portfolioChart: {
      line: bybitPalette.brand[500],
      ticks: bybitPalette.grey[400],
    },
    card: {
      main: bybitPalette.ui.backgroundDark,
      light: bybitPalette.grey[800],
    },
    side: {
      buy: bybitPalette.semantic.success,
      sell: bybitPalette.error[500],
    },
    orderUrgency: {
      background: bybitPalette.common.transparent,
      ULTRA_LOW: '#10E090',
      LOW: bybitPalette.semantic.success,
      MEDIUM: bybitPalette.grey[400],
      HIGH: bybitPalette.error[400],
      ULTRA_HIGH: bybitPalette.error[500],
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
      light: bybitPalette.grey[300],
      main: bybitPalette.grey[600],
      dark: bybitPalette.grey[800],
      disabled: bybitPalette.grey[400],
      transparent: 'rgba(100, 90, 100, 0.25)',
    },
    // MUI required action properties
    action: {
      active: bybitPalette.brand[500],
      hover: 'rgba(248, 168, 5, 0.1)',
      selected: 'rgba(248, 168, 5, 0.2)',
      disabled: bybitPalette.grey[500],
      disabledBackground: bybitPalette.grey[800],
    },
    divider: bybitPalette.grey[700],
    brand: bybitPalette.brand, // Expose brand palette
    blue: bybitPalette.blue, // Expose blue palette
    options: {
      ask: '#FF4A4A', // Updated to match screenshot red
      bid: '#00C076', // Updated to match screenshot green
      put: '#29171b',
      call: '#152419',
      default: '#181818',
      highlight: '#1A1E23',
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
      info: bybitPalette.semantic.info,
      error: bybitPalette.semantic.error,
    },
    strategy: {
      success: bybitPalette.semantic.success,
      warning: bybitPalette.semantic.warning,
      error: bybitPalette.semantic.error,
      info: bybitPalette.semantic.info,
    },
    tcaScheme: [
      [0.1, bybitPalette.semantic.success],
      [0.2, '#44d29b'],
      [0.3, '#7ad9b4'],
      [0.4, '#b0e0cd'],
      [0.5, '#EEFFFF'],
      [0.6, '#EEFFFF'],
      [0.7, '#eabec4'],
      [0.8, '#ee96a2'],
      [0.9, '#f26e80'],
      [1.0, bybitPalette.semantic.error],
    ],
    // TradingView header/toolbar colors
    tradingView: {
      headerBg: '#101014',
      headerFg: '#EAECEF',
      toolbarBg: '#14171B',
      toolbarFg: '#EAECEF',
      toolbarBtnBg: '#14171B',
      toolbarBtnFg: '#EAECEF',
      toolbarBtnHoverBg: '#1A1E23',
      toolbarBtnHoverFg: '#EAECEF',
      symbolBg: '#14171B',
      symbolFg: '#EAECEF',
      priceBg: '#14171B',
      priceFg: '#EAECEF',
    },
  },
  breakpoints: {
    values: breakpoints,
  },
  spacing: 4,
  button: {
    textTransform: 'none',
  },
  fontFamily: ['IBM Plex Sans', 'Arial', 'sans-serif'].join(','), // Use IBM Plex Sans for UI text
  // Global keyframes for holographic effects
  ...holographicShimmer,
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: ['IBM Plex Sans', 'Arial', 'sans-serif'].join(','), // Use IBM Plex Sans for UI text
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'None',
          backgroundColor: bybitPalette.ui.cardBackground,
          padding: 0,
          height: '100%',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation0: {
          backgroundColor: bybitPalette.ui.backgroundLight,
        },
        elevation1: {
          backgroundColor: bybitPalette.ui.backgroundLight,
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
          backgroundColor: bybitPalette.base.black,
          color: 'var(--text-primary)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: bybitPalette.base.white,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: bybitPalette.base.white,
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
          backgroundColor: bybitPalette.ui.cardBackground,
          '&.Mui-expanded': {
            backgroundColor: bybitPalette.ui.cardBackground,
          },
          '& .MuiCollapse-root': {
            backgroundColor: bybitPalette.ui.cardBackground,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          backgroundColor: bybitPalette.ui.backgroundDark,
          '&.Mui-expanded': {
            backgroundColor: bybitPalette.brand[500],
            color: bybitPalette.common.pureBlack, // Use theme black when accordion is open
            '& .MuiAccordionSummary-content': {
              color: bybitPalette.common.pureBlack, // Use theme black for content when accordion is open
            },
            '& .MuiAccordionSummary-content .MuiTypography-root': {
              color: bybitPalette.common.pureBlack, // Target typography elements specifically
            },
            '& .MuiAccordionSummary-content *': {
              color: bybitPalette.common.pureBlack, // Target all child elements
            },
          },
          '&:hover': {
            backgroundColor: bybitPalette.grey[700],
          },
          '&.Mui-expanded:hover': {
            backgroundColor: bybitPalette.brand[500],
            color: bybitPalette.common.pureBlack, // Keep theme black text on hover when expanded
            '& .MuiAccordionSummary-content': {
              color: bybitPalette.common.pureBlack, // Keep theme black text for content on hover when expanded
            },
            '& .MuiAccordionSummary-content .MuiTypography-root': {
              color: bybitPalette.common.pureBlack, // Target typography elements specifically on hover
            },
            '& .MuiAccordionSummary-content *': {
              color: bybitPalette.common.pureBlack, // Target all child elements on hover
            },
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          backgroundColor: bybitPalette.ui.cardBackground,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
        indicator: {
          backgroundColor: bybitPalette.brand[500],
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
            backgroundColor: bybitPalette.ui.cardBackground,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${bybitPalette.grey[600]}`,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: bybitPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${bybitPalette.grey[600]}`,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        paper: {
          backgroundColor: bybitPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${bybitPalette.grey[600]}`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: bybitPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${bybitPalette.grey[600]}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: bybitPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${bybitPalette.grey[600]}`,
          color: bybitPalette.base.white,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: bybitPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${bybitPalette.grey[600]}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: bybitPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: bybitPalette.base.white,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          backgroundColor: bybitPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: bybitPalette.base.white,
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
          color: bybitPalette.black[700], // Black text for primary buttons
          '&:hover': {
            color: bybitPalette.black[700], // Keep black text on hover
          },
        },
      },
    },
  },
});

export default bybitTheme;
