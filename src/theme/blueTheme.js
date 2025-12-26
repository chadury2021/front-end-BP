import { createTheme } from '@mui/material/styles';
import typography from './typography';
import breakpoints from './breakpoints';
import spacing from './spacing';
import { holographicShimmer } from './holographicEffects';

// Blue theme color palette - FTX inspired
const bluePalette = {
  base: {
    white: '#E0E0E0', // Primary text color from FTX
    black: '#1A1D21', // Primary background from FTX
    grey: '#212529', // Card/panel background from FTX
  },
  common: {
    pureWhite: '#FFFFFF',
    pureBlack: '#000000',
    transparent: '#00C0D81A', // Teal transparent
    // FTX inspired grays
    gray50: '#fafafa',
    gray100: '#f5f5f5',
    gray200: '#eeeeee',
    gray300: '#A0A0A0', // Secondary text from FTX
    gray400: '#bdbdbd',
    gray500: '#9e9e9e',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#343A40', // Input field background from FTX
    gray900: '#212529', // Card/panel background from FTX
  },
  brand: {
    0: '#00C0D800', // FTX teal transparent
    25: '#f0f9fa',
    50: '#e6f7f8',
    100: '#b3e8eb',
    200: '#80d9de',
    300: '#4dcad1',
    400: '#1abbc4',
    500: '#00C0D8', // FTX primary teal/cyan
    600: '#00A8C0',
    700: '#0090A8',
    800: '#007890',
    900: '#006078',
    950: '#004860',
  },
  brandAlpha: {
    500: '#00C0D844', // FTX teal with alpha
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
    750: '#242B38',
    800: '#1A2028',
    900: '#151B25',
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
    900: '#0A1018',
  },
  // Blue theme UI colors
  ui: {
    border: '#242B38',
    backgroundLight: '#151B25',
    backgroundMedium: '#1A2028',
    backgroundDark: '#0A1018',
    cardBackground: '#1A2028',
    inputBackground: '#151B25',
    inputBorder: '#242B38',
    appBackground: '#0A1018', // Main app background color
  },
  semantic: {
    success: '#00C076', // Updated to match screenshot green
    error: '#c44569', // Uses bluePalette.error[500]
    warning: '#FF9830',
    info: '#26A2A7',
  },
};

const blueTheme = createTheme({
  typography: {
    spacing: (factor) => spacing[factor] ?? factor * 8,
    allVariants: {
      color: 'var(--text-primary)',
      fontFamily: typography.themes.blue.ui, // Use Helvetica for UI text
    },
    fontFamily: typography.themes.blue.ui, // Use Helvetica for UI text
    // Expose font family configurations for components
    fontFamilyConfig: typography.themes.blue,
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
      white: '#E0E0E0', // FTX primary text
      black: '#1A1D21', // FTX primary background
      pureWhite: '#FFFFFF',
      pureBlack: '#000000',
      transparent: '#00C0D81A', // FTX teal transparent
      gray50: '#fafafa',
      gray100: '#f5f5f5',
      gray200: '#eeeeee',
      gray300: '#A0A0A0', // FTX secondary text
      gray400: '#bdbdbd',
      gray500: '#9e9e9e',
      gray600: '#757575',
      gray700: '#616161',
      gray800: '#343A40', // FTX input field background
      gray900: '#212529', // FTX card/panel background
    },
    // expose additional groups used in components
    ui: bluePalette.ui,
    semantic: bluePalette.semantic,
    black: bluePalette.black,
    text: {
      primary: '#E0E0E0', // FTX primary text
      subtitle: '#A0A0A0', // FTX secondary text
      disabled: '#A0A0A0', // FTX secondary text
      grey: '#A0A0A0', // FTX secondary text
      offBlack: '#1A1A1A', // Black text for buttons
      offWhite: '#E0E0E0', // FTX primary text
      secondary: 'rgba(224, 224, 224, 0.7)', // FTX primary text with opacity
    },
    primary: {
      light: '#00A8C0', // FTX teal light
      main: '#00C0D8', // FTX primary teal/cyan
      dark: '#007890', // FTX teal dark
      dark2: bluePalette.brandAlpha[500],
      transparent: bluePalette.brandAlpha[500],
    },
    secondary: {
      main: '#28745E',
    },
    info: {
      main: '#26A2A7',
    },
    pending: {
      main: bluePalette.grey[400],
    },
    success: {
      main: '#00C076', // Updated to match screenshot green
      dark2: 'rgb(2, 71, 44)', // Dark green for progress bar fill
    },
    error: {
      main: bluePalette.error[500],
      dark2: bluePalette.error[950],
    },
    warning: {
      main: bluePalette.semantic.warning,
      dark2: bluePalette.warning[950],
    },
    background: {
      base: '#1A1D21', // FTX primary background
      container: '#212529', // FTX card/panel background
      card: '#212529', // FTX card/panel background
      paper: '#1A1D21', // FTX primary background
      white: bluePalette.common.pureWhite,
      twoFa: bluePalette.grey[750],
      app: '#1A1D21', // FTX primary background
    },
    border: {
      twoFa: 'rgba(238, 255, 255, 0.23)',
    },
    button: {
      grey: bluePalette.grey[700],
      lightGrey: bluePalette.grey[600],
    },
    charts: {
      red: bluePalette.error[500],
      redTransparent: 'rgba(246, 70, 93, 0.5)',
      green: '#00C076', // Updated to match screenshot green
      greenTransparent: 'rgba(0, 192, 118, 0.5)',
      gray: bluePalette.grey[400],
      lightGray: bluePalette.common.gray600,
      grayTransparent: 'rgba(150, 150, 150, 0.1)',
      pinkTransparent: 'rgba(184, 118, 169, 0.5)',
      orange: bluePalette.brand[500],
      orangeTransparent: 'rgba(38, 162, 167, 0.5)',
      blue: 'rgba(57, 124, 191, 0.8)',
      gridLines: bluePalette.grey[600],
      OTC: bluePalette.brand[500],
      offWhite: bluePalette.grey[200],
      exposureTolerance: `${bluePalette.brand[600]}9A`,
      points: bluePalette.brand[600],
    },
    portfolioChart: {
      line: bluePalette.brand[500],
      ticks: bluePalette.grey[400],
    },
    card: {
      main: bluePalette.ui.backgroundDark,
      light: bluePalette.grey[800],
    },
    side: {
      buy: bluePalette.semantic.success,
      sell: bluePalette.error[500],
    },
    orderUrgency: {
      background: bluePalette.common.transparent,
      ULTRA_LOW: '#10E090',
      LOW: bluePalette.semantic.success,
      MEDIUM: bluePalette.grey[400],
      HIGH: bluePalette.error[400],
      ULTRA_HIGH: bluePalette.error[500],
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
      light: bluePalette.grey[300],
      main: bluePalette.grey[600],
      dark: bluePalette.grey[800],
      disabled: bluePalette.grey[400],
      transparent: 'rgba(100, 90, 100, 0.25)',
    },
    // MUI required action properties
    action: {
      active: bluePalette.brand[500],
      hover: 'rgba(0, 192, 216, 0.1)',
      selected: 'rgba(0, 192, 216, 0.2)',
      disabled: bluePalette.grey[500],
      disabledBackground: bluePalette.grey[800],
    },
    divider: bluePalette.grey[700],
    brand: bluePalette.brand, // Expose brand palette
    blue: bluePalette.blue, // Expose blue palette
    options: {
      ask: '#FF4A4A', // Updated to match screenshot red
      bid: '#00C076', // Updated to match screenshot green
      put: '#29171b',
      call: '#152419',
      default: '#1A2028',
      highlight: '#242B38',
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
      info: bluePalette.semantic.info,
      error: bluePalette.semantic.error,
    },
    strategy: {
      success: bluePalette.semantic.success,
      warning: bluePalette.semantic.warning,
      error: bluePalette.semantic.error,
      info: bluePalette.semantic.info,
    },
    tcaScheme: [
      [0.1, bluePalette.semantic.success],
      [0.2, '#44d29b'],
      [0.3, '#7ad9b4'],
      [0.4, '#b0e0cd'],
      [0.5, '#EEFFFF'],
      [0.6, '#EEFFFF'],
      [0.7, '#eabec4'],
      [0.8, '#ee96a2'],
      [0.9, '#f26e80'],
      [1.0, bluePalette.semantic.error],
    ],
    // TradingView header/toolbar colors
    tradingView: {
      headerBg: bluePalette.ui.appBackground,
      headerFg: bluePalette.base.white,
      toolbarBg: bluePalette.ui.backgroundLight,
      toolbarFg: bluePalette.base.white,
      toolbarBtnBg: bluePalette.ui.backgroundLight,
      toolbarBtnFg: bluePalette.base.white,
      toolbarBtnHoverBg: bluePalette.ui.cardBackground,
      toolbarBtnHoverFg: bluePalette.base.white,
      symbolBg: bluePalette.ui.backgroundLight,
      symbolFg: bluePalette.base.white,
      priceBg: bluePalette.ui.backgroundLight,
      priceFg: bluePalette.base.white,
    },
  },
  breakpoints: {
    values: breakpoints,
  },
  spacing: 4,
  button: {
    textTransform: 'none',
  },
  fontFamily: typography.themes.blue.ui, // Use Helvetica for UI text
  // Global keyframes for holographic effects
  ...holographicShimmer,
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: typography.themes.blue.ui, // Use Helvetica for UI text
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'None',
          backgroundColor: bluePalette.base.grey,
          padding: 0,
          height: '100%',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation0: {
          backgroundColor: bluePalette.base.grey,
        },
        elevation1: {
          backgroundColor: bluePalette.ui.cardBackground,
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
          backgroundColor: bluePalette.base.black,
          color: 'var(--text-primary)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: bluePalette.base.white,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: bluePalette.base.white,
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
          backgroundColor: bluePalette.ui.cardBackground,
          '&.Mui-expanded': {
            backgroundColor: bluePalette.ui.cardBackground,
          },
          '& .MuiCollapse-root': {
            backgroundColor: bluePalette.ui.cardBackground,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          backgroundColor: bluePalette.ui.backgroundDark,
          color: `${bluePalette.base.white} !important`,
          '&.Mui-expanded': {
            backgroundColor: `${bluePalette.brand[500]} !important`,
            color: `${bluePalette.common.pureBlack} !important`,
            '& .MuiTypography-root': {
              color: `${bluePalette.common.pureBlack} !important`,
            },
          },
          '&:hover': {
            backgroundColor: bluePalette.grey[700],
            color: `${bluePalette.base.white} !important`,
          },
          '&.Mui-expanded:hover': {
            backgroundColor: `${bluePalette.brand[500]} !important`,
            color: `${bluePalette.common.pureBlack} !important`,
            '& .MuiTypography-root': {
              color: `${bluePalette.common.pureBlack} !important`,
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
          backgroundColor: bluePalette.ui.cardBackground,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
        indicator: {
          backgroundColor: bluePalette.brand[500],
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
            backgroundColor: bluePalette.ui.cardBackground,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${bluePalette.grey[600]}`,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: bluePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${bluePalette.grey[600]}`,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        paper: {
          backgroundColor: bluePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${bluePalette.grey[600]}`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: bluePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${bluePalette.grey[600]}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: bluePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${bluePalette.grey[600]}`,
          color: bluePalette.base.white,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: bluePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${bluePalette.grey[600]}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: bluePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: bluePalette.base.white,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          backgroundColor: bluePalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: bluePalette.base.white,
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
          color: bluePalette.black[700], // Black text for primary buttons
          '&:hover': {
            color: bluePalette.black[700], // Keep black text on hover
          },
        },
      },
    },
  },
});

export default blueTheme;
