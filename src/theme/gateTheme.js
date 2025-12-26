import { createTheme } from '@mui/material/styles';
import typography from './typography';
import breakpoints from './breakpoints';
import spacing from './spacing';
import { holographicShimmer } from './holographicEffects';
import { FONT_COMBINATIONS, joinFontFamilies } from './fontTokens';

// Gate theme color palette - following Binance reference
const gatePalette = {
  base: {
    white: '#E0E0E0', // Primary text color from Gate
    black: '#070808', // App background per reference
    grey: '#1C1D20', // Card/panel background per reference
  },
  common: {
    pureWhite: '#FFFFFF',
    pureBlack: '#000000',
    transparent: '#2C64FA1A', // Gate blue transparent
    // Gate inspired grays
    gray50: '#fafafa',
    gray100: '#f5f5f5',
    gray200: '#eeeeee',
    gray300: '#B0B0B0', // Secondary text from Gate
    gray400: '#bdbdbd',
    gray500: '#9e9e9e',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#343A40', // Input field background
    gray900: '#1C1D20', // Card/panel background from Gate
  },
  brand: {
    0: '#2C64FA00', // Gate blue transparent
    25: '#f0f4ff',
    50: '#e1e9ff',
    100: '#c3d3ff',
    200: '#a5bdff',
    300: '#87a7ff',
    400: '#6991ff',
    500: '#2C64FA', // Gate primary blue
    600: '#6D8E84', // Gate secondary color
    700: '#66CCFF', // Gate dark blue
    800: '#1a4dd9',
    900: '#0d3bb3',
    950: '#002999',
  },
  brandAlpha: {
    500: '#2C64FA44', // Gate blue with alpha
  },
  blue: {
    25: '#f5f8ff',
    50: '#eff4ff',
    100: '#d1e0ff',
    200: '#b2ccff',
    300: '#84adff',
    400: '#528bff',
    500: '#2C64FA', // Gate primary blue
    600: '#6D8E84', // Gate secondary color
    700: '#66CCFF', // Gate dark blue
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
    750: '#1F2023', // Gate container background
    800: '#18191B', // Gate paper background
    900: '#070808', // Gate app background
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
    800: '#070808',
    900: '#070808', // Gate app background
  },
  // Gate theme UI colors
  ui: {
    border: '#1F2023',
    backgroundLight: '#18191B', // Paper/Container background per reference
    backgroundMedium: '#1C1D20', // Card background per reference
    backgroundDark: '#070808', // App background per reference
    cardBackground: '#1C1D20',
    inputBackground: '#18191B',
    inputBorder: '#1F2023',
    appBackground: '#070808', // Main app background color
  },
  semantic: {
    success: '#0ecb81',
    error: '#f6465d',
    warning: '#FF9830',
    info: '#2C64FA',
  },
};

const gateTheme = createTheme({
  typography: {
    spacing: (factor) => spacing[factor] ?? factor * 8,
    allVariants: {
      color: 'var(--text-primary)',
      fontFamily: joinFontFamilies(FONT_COMBINATIONS.GATE_PRIMARY),
    },
    fontFamily: joinFontFamilies(FONT_COMBINATIONS.GATE_PRIMARY),
    // Expose font family configurations for components
    fontFamilyConfig: typography.themes.gate,
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
      white: '#E0E0E0', // Gate primary text
      black: '#070808', // Gate primary background
      pureWhite: '#FFFFFF',
      pureBlack: '#000000',
      transparent: '#2C64FA1A', // Gate blue transparent
      gray50: '#fafafa',
      gray100: '#f5f5f5',
      gray200: '#eeeeee',
      gray300: '#B0B0B0', // Gate secondary text
      gray400: '#bdbdbd',
      gray500: '#9e9e9e',
      gray600: '#757575',
      gray700: '#616161',
      gray800: '#343A40', // Input field background
      gray900: '#1C1D20', // Gate card/panel background
    },
    // expose additional groups used in components
    ui: gatePalette.ui,
    semantic: gatePalette.semantic,
    black: gatePalette.black,
    text: {
      primary: '#E0E0E0', // Gate primary text
      subtitle: '#9E9E9E', // Gate subtitle text
      disabled: '#757575', // Gate disabled text
      grey: '#B0B0B0', // Gate secondary text
      offBlack: '#000000', // Black text for primary buttons
      offWhite: '#E0E0E0', // Gate primary text
      secondary: 'rgba(224, 224, 224, 0.7)', // Gate primary text with opacity
    },
    primary: {
      light: '#18E0A0', // Gate light blue
      main: '#2C64FA', // Gate primary blue
      dark: '#66CCFF', // Gate dark blue
      dark2: gatePalette.brandAlpha[500],
      transparent: gatePalette.brandAlpha[500],
      contrastText: '#000000', // Black text for primary buttons
    },
    secondary: {
      main: '#18E0A0', // Gate light blue for selected status buttons
    },
    info: {
      main: '#2C64FA', // Gate primary blue
    },
    pending: {
      main: gatePalette.grey[400],
    },
    success: {
      main: gatePalette.semantic.success,
      dark2: 'rgb(2, 71, 44)', // Dark green for progress bar fill
    },
    error: {
      main: gatePalette.error[500],
      dark2: gatePalette.error[950],
    },
    warning: {
      main: gatePalette.semantic.warning,
      dark2: gatePalette.warning[950],
    },
    background: {
      base: '#070808', // App background per reference
      container: '#1F2023', // Container background per reference
      card: '#1C1D20', // Card background per reference
      paper: '#1F2023', // Paper background per reference - darker for action bar contrast
      white: gatePalette.common.pureWhite,
      twoFa: gatePalette.grey[750],
      app: '#070808', // App background per reference
    },
    border: {
      twoFa: 'rgba(238, 255, 255, 0.23)',
    },
    button: {
      grey: gatePalette.grey[700],
      lightGrey: gatePalette.grey[600],
    },
    charts: {
      red: gatePalette.error[500],
      redTransparent: 'rgba(246, 70, 93, 0.5)',
      green: gatePalette.semantic.success,
      greenTransparent: 'rgba(14, 203, 129, 0.5)',
      gray: gatePalette.grey[400],
      lightGray: gatePalette.common.gray600,
      grayTransparent: 'rgba(150, 150, 150, 0.1)',
      pinkTransparent: 'rgba(184, 118, 169, 0.5)',
      orange: gatePalette.brand[500],
      orangeTransparent: 'rgba(44, 100, 250, 0.5)',
      blue: 'rgba(57, 124, 191, 0.8)',
      gridLines: gatePalette.grey[600],
      OTC: gatePalette.brand[500],
      offWhite: gatePalette.grey[200],
      exposureTolerance: `${gatePalette.brand[600]}9A`,
      points: gatePalette.brand[600],
    },
    portfolioChart: {
      line: gatePalette.brand[500],
      ticks: gatePalette.grey[400],
    },
    card: {
      main: gatePalette.ui.backgroundDark,
      light: gatePalette.grey[800],
    },
    side: {
      buy: gatePalette.semantic.success,
      sell: gatePalette.error[500],
    },
    orderUrgency: {
      background: gatePalette.common.transparent,
      ULTRA_LOW: '#10E090',
      LOW: gatePalette.semantic.success,
      MEDIUM: gatePalette.grey[400],
      HIGH: gatePalette.error[400],
      ULTRA_HIGH: gatePalette.error[500],
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
      Gate: 'rgb(44, 100, 250)',
      GateTransparent: 'rgba(44, 100, 250, 0.75)',
    },
    grey: {
      light: gatePalette.grey[300],
      main: gatePalette.grey[600],
      dark: gatePalette.grey[800],
      disabled: gatePalette.grey[400],
      transparent: 'rgba(100, 90, 100, 0.25)',
    },
    // MUI required action properties
    action: {
      active: gatePalette.brand[500],
      hover: 'rgba(44, 100, 250, 0.1)',
      selected: 'rgba(44, 100, 250, 0.2)',
      disabled: gatePalette.grey[500],
      disabledBackground: gatePalette.grey[800],
    },
    divider: gatePalette.grey[700],
    brand: gatePalette.brand, // Expose brand palette
    blue: gatePalette.blue, // Expose blue palette
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
      info: gatePalette.semantic.info,
      error: gatePalette.semantic.error,
    },
    strategy: {
      success: gatePalette.semantic.success,
      warning: gatePalette.semantic.warning,
      error: gatePalette.semantic.error,
      info: gatePalette.semantic.info,
    },
    tcaScheme: [
      [0.1, gatePalette.semantic.success],
      [0.2, '#44d29b'],
      [0.3, '#7ad9b4'],
      [0.4, '#b0e0cd'],
      [0.5, '#EEFFFF'],
      [0.6, '#EEFFFF'],
      [0.7, '#eabec4'],
      [0.8, '#ee96a2'],
      [0.9, '#f26e80'],
      [1.0, gatePalette.semantic.error],
    ],
    // TradingView header/toolbar colors
    tradingView: {
      headerBg: '#070808',
      headerFg: '#E0E0E0',
      toolbarBg: '#18191B',
      toolbarFg: '#E0E0E0',
      toolbarBtnBg: '#18191B',
      toolbarBtnFg: '#E0E0E0',
      toolbarBtnHoverBg: '#1C1D20',
      toolbarBtnHoverFg: '#E0E0E0',
      symbolBg: '#18191B',
      symbolFg: '#E0E0E0',
      priceBg: '#18191B',
      priceFg: '#E0E0E0',
    },
  },
  breakpoints: {
    values: breakpoints,
  },
  spacing: 4,
  button: {
    textTransform: 'none',
  },
  fontFamily: joinFontFamilies(FONT_COMBINATIONS.GATE_PRIMARY), // Use Gate_Sans for UI text
  // Global keyframes for holographic effects
  ...holographicShimmer,
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: joinFontFamilies(FONT_COMBINATIONS.GATE_PRIMARY), // Use Gate_Sans for UI text
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'None',
          backgroundColor: gatePalette.ui.cardBackground,
          padding: 0,
          height: '100%',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation0: {
          backgroundColor: gatePalette.ui.backgroundLight,
        },
        elevation1: {
          backgroundColor: gatePalette.ui.backgroundLight,
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
          backgroundColor: gatePalette.base.black,
          color: 'var(--text-primary)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: gatePalette.base.white,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: gatePalette.base.white,
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
          backgroundColor: gatePalette.ui.cardBackground,
          '&.Mui-expanded': {
            backgroundColor: gatePalette.ui.cardBackground,
          },
          '& .MuiCollapse-root': {
            backgroundColor: gatePalette.ui.cardBackground,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          backgroundColor: gatePalette.ui.backgroundDark,
          '&.Mui-expanded': {
            backgroundColor: gatePalette.brand[500],
          },
          '&:hover': {
            backgroundColor: gatePalette.grey[700],
          },
          '&.Mui-expanded:hover': {
            backgroundColor: gatePalette.brand[500],
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          backgroundColor: gatePalette.ui.cardBackground,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
        indicator: {
          backgroundColor: gatePalette.brand[500],
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
            backgroundColor: gatePalette.ui.cardBackground,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${gatePalette.grey[600]}`,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: gatePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${gatePalette.grey[600]}`,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        paper: {
          backgroundColor: gatePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${gatePalette.grey[600]}`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: gatePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${gatePalette.grey[600]}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: gatePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${gatePalette.grey[600]}`,
          color: gatePalette.base.white,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: gatePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${gatePalette.grey[600]}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: gatePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: gatePalette.base.white,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          backgroundColor: gatePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: gatePalette.base.white,
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
          color: gatePalette.black[700], // Black text for primary buttons
          '&:hover': {
            color: gatePalette.black[700], // Keep black text on hover
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          // Default styling for inactive chips
          color: gatePalette.brand[600], // Gate secondary color (#18E0A0)
          borderColor: gatePalette.brand[600],
          backgroundColor: 'transparent',
          '&.MuiChip-colorPrimary': {
            // Active chips use primary color
            color: gatePalette.brand[500], // Gate primary blue (#2C64FA)
            borderColor: gatePalette.brand[500],
            backgroundColor: 'transparent',
          },
          '&.MuiChip-colorSecondary': {
            // Secondary chips use secondary color
            color: gatePalette.brand[600], // Gate secondary color (#18E0A0)
            borderColor: gatePalette.brand[600],
            backgroundColor: 'transparent',
          },
          '&.MuiChip-colorSuccess': {
            // Success chips (Finished)
            color: gatePalette.semantic.success,
            borderColor: gatePalette.semantic.success,
            backgroundColor: 'transparent',
          },
          '&.MuiChip-colorError': {
            // Error chips (Canceled)
            color: gatePalette.semantic.error,
            borderColor: gatePalette.semantic.error,
            backgroundColor: 'transparent',
          },
        },
      },
    },
  },
});

export default gateTheme;
