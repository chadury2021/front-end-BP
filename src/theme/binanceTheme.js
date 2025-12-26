import { createTheme } from '@mui/material/styles';
import typography from './typography';
import breakpoints from './breakpoints';
import spacing from './spacing';
import { holographicShimmer } from './holographicEffects';

// Binance theme color palette
const binancePalette = {
  base: {
  white: '#F9F6EF', // Primary text color from Binance
  black: '#0b0e11', // App background per reference
  grey: '#1e2329', // Card/panel background per reference
  },
  common: {
    pureWhite: '#FFFFFF',
    pureBlack: '#000000',
    transparent: '#F3BA2F1A', // Binance yellow transparent
    // Binance inspired grays
    gray50: '#fafafa',
    gray100: '#f5f5f5',
    gray200: '#eeeeee',
    gray300: '#CCCCCC', // Secondary text from Binance
    gray400: '#bdbdbd',
    gray500: '#9e9e9e',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#343A40', // Input field background
    gray900: '#181818', // Card/panel background from Binance
  },
  brand: {
    0: '#F3BA2F00', // Binance yellow transparent
    25: '#fef9e7',
    50: '#fdf4d0',
    100: '#fbe8a1',
    200: '#f8d572',
    300: '#f5c243',
    400: '#f2af14',
    500: '#F3BA2F', // Binance primary yellow
    600: '#FD913A', // Binance yellow light
    700: '#FF8625', // Binance yellow dark
    800: '#e6a729',
    900: '#d99a26',
    950: '#cc8d23',
  },
  brandAlpha: {
    500: '#F3BA2F44', // Binance yellow with alpha
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
    750: '#272727', // Binance container background
    800: '#181818', // Binance paper background
    900: '#0F1010', // Binance app background
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
    900: '#0F1010', // Binance app background
  },
  // Binance theme UI colors
  ui: {
    border: '#272727',
    backgroundLight: '#181A20', // Paper/Container background per reference
    backgroundMedium: '#1e2329', // Card background per reference
    backgroundDark: '#0b0e11', // App background per reference
    cardBackground: '#1e2329',
    inputBackground: '#181A20',
    inputBorder: '#272727',
    appBackground: '#0b0e11', // Main app background color
  },
  semantic: {
    success: '#0ecb81',
    error: '#f6465d',
    warning: '#FF9830',
    info: '#FD913A',
  },
};

const binanceTheme = createTheme({
  typography: {
    spacing: (factor) => spacing[factor] ?? factor * 8,
    allVariants: {
      color: 'var(--text-primary)',
      fontFamily: ['Montserrat', 'Arial', 'sans-serif'].join(','),
    },
    fontFamily: ['Montserrat', 'Arial', 'sans-serif'].join(','),
    // Expose font family configurations for components
    fontFamilyConfig: {
      primary: ['Montserrat', 'Arial', 'sans-serif'].join(','),
      monospace: ['IBM Plex Mono', 'monospace'].join(','),
      numbers: ['IBM Plex Mono', 'monospace'].join(','),
      ui: ['Montserrat', 'Arial', 'sans-serif'].join(','),
      text: ['Montserrat', 'Arial', 'sans-serif'].join(','),
      data: ['IBM Plex Mono', 'monospace'].join(','),
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
      white: '#F9F6EF', // Binance primary text
      black: '#0F1010', // Binance primary background
      pureWhite: '#FFFFFF',
      pureBlack: '#000000',
      transparent: '#F3BA2F1A', // Binance yellow transparent
      gray50: '#fafafa',
      gray100: '#f5f5f5',
      gray200: '#eeeeee',
      gray300: '#CCCCCC', // Binance secondary text
      gray400: '#bdbdbd',
      gray500: '#9e9e9e',
      gray600: '#757575',
      gray700: '#616161',
      gray800: '#343A40', // Input field background
      gray900: '#181818', // Binance card/panel background
    },
    // expose additional groups used in components
    ui: binancePalette.ui,
    semantic: binancePalette.semantic,
    black: binancePalette.black,
    text: {
      primary: '#F9F6EF', // Binance primary text
      subtitle: '#938D7F', // Binance subtitle text
      disabled: '#555555', // Binance disabled text
      grey: '#CCCCCC', // Binance secondary text
      offBlack: '#000000', // Black text for primary buttons
      offWhite: '#F9F6EF', // Binance primary text
      secondary: 'rgba(249, 246, 239, 0.7)', // Binance primary text with opacity
    },
    primary: {
      light: '#F3BA2F', // Yellow for selected status buttons
      main: '#F3BA2F', // Binance primary yellow
      dark: '#F2B51C', // Binance yellow dark
      dark2: binancePalette.brandAlpha[500],
      transparent: binancePalette.brandAlpha[500],
      contrastText: '#000000', // Black text for primary buttons
    },
    secondary: {
      main: '#F3BA2F', // Yellow for selected status buttons
    },
    info: {
      main: '#B1810A',
    },
    pending: {
      main: binancePalette.grey[400],
    },
    success: {
      main: binancePalette.semantic.success,
      dark2: 'rgb(2, 71, 44)', // Dark green for progress bar fill
    },
    error: {
      main: binancePalette.error[500],
      dark2: binancePalette.error[950],
    },
    warning: {
      main: binancePalette.semantic.warning,
      dark2: binancePalette.warning[950],
    },
    background: {
      base: '#0b0e11', // App background per reference
      container: '#181A20', // Container background per reference
      card: '#1e2329', // Card background per reference
      paper: '#0b0e11', // Paper background per reference - matches table header
      white: binancePalette.common.pureWhite,
      twoFa: binancePalette.grey[750],
      app: '#0b0e11', // App background per reference
    },
    border: {
      twoFa: 'rgba(238, 255, 255, 0.23)',
    },
    button: {
      grey: binancePalette.grey[700],
      lightGrey: binancePalette.grey[600],
    },
    charts: {
      red: binancePalette.error[500],
      redTransparent: 'rgba(246, 70, 93, 0.5)',
      green: binancePalette.semantic.success,
      greenTransparent: 'rgba(14, 203, 129, 0.5)',
      gray: binancePalette.grey[400],
      lightGray: binancePalette.common.gray600,
      grayTransparent: 'rgba(150, 150, 150, 0.1)',
      pinkTransparent: 'rgba(184, 118, 169, 0.5)',
      orange: binancePalette.brand[500],
      orangeTransparent: 'rgba(38, 162, 167, 0.5)',
      blue: 'rgba(57, 124, 191, 0.8)',
      gridLines: binancePalette.grey[600],
      OTC: binancePalette.brand[500],
      offWhite: binancePalette.grey[200],
      exposureTolerance: `${binancePalette.brand[600]}9A`,
      points: binancePalette.brand[500],
    },
    portfolioChart: {
      line: binancePalette.brand[500],
      ticks: binancePalette.grey[400],
    },
    card: {
      main: binancePalette.ui.backgroundDark,
      light: binancePalette.grey[800],
    },
    side: {
      buy: binancePalette.semantic.success,
      sell: binancePalette.error[500],
    },
    orderUrgency: {
      background: binancePalette.common.transparent,
      ULTRA_LOW: '#10E090',
      LOW: binancePalette.semantic.success,
      MEDIUM: binancePalette.grey[400],
      HIGH: binancePalette.error[400],
      ULTRA_HIGH: binancePalette.error[500],
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
      light: binancePalette.grey[300],
      main: binancePalette.grey[600],
      dark: binancePalette.grey[800],
      disabled: binancePalette.grey[400],
      transparent: 'rgba(100, 90, 100, 0.25)',
    },
    // MUI required action properties
    action: {
      active: binancePalette.brand[500],
      hover: 'rgba(243, 186, 47, 0.1)',
      selected: 'rgba(243, 186, 47, 0.2)',
      disabled: binancePalette.grey[500],
      disabledBackground: binancePalette.grey[800],
    },
    divider: binancePalette.grey[700],
    brand: binancePalette.brand, // Expose brand palette
    blue: binancePalette.blue, // Expose blue palette
    options: {
      ask: '#FF4A4A', // Updated to match screenshot red
      bid: '#00C076', // Updated to match screenshot green
      put: '#29171b',
      call: '#152419',
      default: '#181818',
      highlight: '#272727',
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
      info: binancePalette.semantic.info,
      error: binancePalette.semantic.error,
    },
    strategy: {
      success: binancePalette.semantic.success,
      warning: binancePalette.semantic.warning,
      error: binancePalette.semantic.error,
      info: binancePalette.semantic.info,
    },
    tcaScheme: [
      [0.1, binancePalette.semantic.success],
      [0.2, '#44d29b'],
      [0.3, '#7ad9b4'],
      [0.4, '#b0e0cd'],
      [0.5, '#EEFFFF'],
      [0.6, '#EEFFFF'],
      [0.7, '#eabec4'],
      [0.8, '#ee96a2'],
      [0.9, '#f26e80'],
      [1.0, binancePalette.semantic.error],
    ],
    // TradingView header/toolbar colors
    tradingView: {
      headerBg: '#0b0e11',
      headerFg: '#F9F6EF',
      toolbarBg: '#181A20',
      toolbarFg: '#F9F6EF',
      toolbarBtnBg: '#181A20',
      toolbarBtnFg: '#F9F6EF',
      toolbarBtnHoverBg: '#1e2329',
      toolbarBtnHoverFg: '#F9F6EF',
      symbolBg: '#181A20',
      symbolFg: '#F9F6EF',
      priceBg: '#181A20',
      priceFg: '#F9F6EF',
    },
  },
  breakpoints: {
    values: breakpoints,
  },
  spacing: 4,
  button: {
    textTransform: 'none',
  },
  fontFamily: ['Montserrat', 'Arial', 'sans-serif'].join(','), // Use Helvetica for UI text
  // Global keyframes for holographic effects
  ...holographicShimmer,
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: ['Montserrat', 'Arial', 'sans-serif'].join(','), // Use Helvetica for UI text
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'None',
          backgroundColor: binancePalette.ui.cardBackground,
          padding: 0,
          height: '100%',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation0: {
          backgroundColor: binancePalette.ui.backgroundLight,
        },
        elevation1: {
          backgroundColor: binancePalette.ui.backgroundLight,
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
          backgroundColor: binancePalette.base.black,
          color: 'var(--text-primary)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: binancePalette.base.white,
          '&.Mui-disabled': {
            color: binancePalette.base.white,
            '& input': {
              color: binancePalette.base.white,
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: binancePalette.base.white,
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
          backgroundColor: binancePalette.ui.cardBackground,
          '&.Mui-expanded': {
            backgroundColor: binancePalette.ui.cardBackground,
          },
          '& .MuiCollapse-root': {
            backgroundColor: binancePalette.ui.cardBackground,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          backgroundColor: binancePalette.ui.backgroundDark,
          color: `${binancePalette.base.white} !important`,
          '&.Mui-expanded': {
            backgroundColor: `${binancePalette.brand[500]} !important`,
            color: `${binancePalette.common.pureBlack} !important`,
            '& .MuiTypography-root': {
              color: `${binancePalette.common.pureBlack} !important`,
            },
          },
          '&:hover': {
            backgroundColor: binancePalette.grey[700],
            color: `${binancePalette.base.white} !important`,
          },
          '&.Mui-expanded:hover': {
            backgroundColor: `${binancePalette.brand[500]} !important`,
            color: `${binancePalette.common.pureBlack} !important`,
            '& .MuiTypography-root': {
              color: `${binancePalette.common.pureBlack} !important`,
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
          backgroundColor: binancePalette.ui.cardBackground,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
        indicator: {
          backgroundColor: binancePalette.brand[500],
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
            backgroundColor: binancePalette.ui.cardBackground,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${binancePalette.grey[600]}`,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: binancePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${binancePalette.grey[600]}`,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        paper: {
          backgroundColor: binancePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${binancePalette.grey[600]}`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: binancePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${binancePalette.grey[600]}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: binancePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${binancePalette.grey[600]}`,
          color: binancePalette.base.white,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: binancePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${binancePalette.grey[600]}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: binancePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: binancePalette.base.white,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          backgroundColor: binancePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: binancePalette.base.white,
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
          color: binancePalette.black[700], // Black text for primary buttons
          '&:hover': {
            color: binancePalette.black[700], // Keep black text on hover
          },
        },
      },
    },
  },
});

export default binanceTheme;
