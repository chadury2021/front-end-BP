import { createTheme } from '@mui/material/styles';
import typography from './typography';
import palette from './colors';
import breakpoints from './breakpoints';
import spacing from './spacing';
import { holographicShimmer } from './holographicEffects';

const theme = createTheme({
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
      white: '#F9F6EF',
      black: '#0F1010',
      pureWhite: '#FFFFFF',
      pureBlack: '#000000',
      transparent: '#FFFFFF1A',
      gray50: '#fafafa',
      gray100: '#f7f7f7',
      gray200: '#f0f0f1',
      gray300: '#ececed',
      gray400: '#cecfd2',
      gray500: '#85888e',
      gray600: '#787878',
      gray700: '#61656c',
      gray800: '#373a41',
      gray900: '#13161b',
    },
    // expose additional groups used in components
    ui: palette.ui,
    semantic: palette.semantic,
    black: palette.black,
    purple: palette.purple,
    text: {
      primary: palette.base.white,
      subtitle: palette.grey[400],
      disabled: palette.grey[500],
      grey: palette.black[600],
      offBlack: palette.black[700],
      offWhite: palette.base.white,
      secondary: 'rgba(230, 230, 230, 0.7)',
    },
    primary: {
      light: palette.brand[400],
      main: palette.brand[500], // Original brand color
      dark: palette.brand[800],
      dark2: 'rgba(255, 152, 48, 0.267)', // Dark orange for progress bar fill
      transparent: palette.brandAlpha[500],
    },
    secondary: {
      main: '#FF8F0F',
    },
    info: {
      main: palette.base.white,
    },
    pending: {
      main: palette.grey[400],
    },
    success: {
      main: '#00C076', // Original bright green
      dark2: 'rgb(2, 71, 44)', // Dark green for progress bar fill
    },
    error: {
      main: '#FF4A4A', // Original bright red
      dark2: 'rgb(92, 20, 30)', // Dark red for progress bar fill
    },
    warning: {
      main: '#FF9830', // Original bright orange
      dark2: 'rgba(255, 152, 48, 0.267)', // Dark orange for progress bar fill
    },
    background: {
      base: palette.black[900],
      container: palette.black[800],
      card: palette.base.grey,
      paper: palette.ui.backgroundMedium,
      white: palette.common.pureWhite,
      twoFa: palette.grey[750],
      app: palette.ui.appBackground, // Main app background color
    },
    border: {
      twoFa: 'rgba(255, 255, 255, 0.23)',
    },
    button: {
      grey: palette.grey[700],
      lightGrey: palette.grey[600],
    },
    charts: {
      red: '#FF4A4A', // Updated to match screenshot red
      redTransparent: 'rgba(255, 74, 74, 0.5)',
      green: '#00C076', // Updated to match screenshot green
      greenTransparent: 'rgba(0, 192, 118, 0.5)',
      gray: palette.grey[400],
      lightGray: palette.common.gray600,
      grayTransparent: 'rgba(150, 150, 150, 0.1)',
      pinkTransparent: 'rgba(184, 118, 169, 0.5)',
      orange: palette.brand[500],
      orangeTransparent: 'rgba(255, 163, 68, 0.5)',
      blue: 'rgba(57, 124, 191, 0.8)',
      gridLines: palette.black[600],
      OTC: palette.brand[500],
      offWhite: palette.grey[200],
      exposureTolerance: `${palette.brand[600]}9A`,
      points: palette.brand[600],
    },
    portfolioChart: {
      line: palette.brand[500],
      ticks: palette.grey[400],
    },
    card: {
      main: palette.ui.backgroundDark,
      light: palette.grey[800],
    },
    side: {
      buy: '#00C076', // Updated to match screenshot green
      sell: '#FF4A4A', // Updated to match screenshot red
    },
    orderUrgency: {
      background: palette.common.transparent,
      ULTRA_LOW: '#10E090',
      LOW: palette.semantic.success,
      MEDIUM: palette.grey[400],
      HIGH: palette.error[400],
      ULTRA_HIGH: palette.error[500],
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
      light: palette.grey[300],
      main: palette.grey[600],
      dark: palette.grey[800],
      disabled: palette.grey[400],
      transparent: 'rgba(100, 90, 100, 0.25)',
    },
    options: {
      ask: '#FF4A4A', // Updated to match screenshot red
      bid: '#00C076', // Updated to match screenshot green
      put: '#29171b',
      call: '#152419',
      default: '#141414',
      highlight: '#787878',
    },
    candlestick: {
      up: '#0F9881',
      down: '#F1434C',
      border: '#0F9881',
      wick: '#0F9881',
    },
    tcaScheme: [
      [0.1, palette.semantic.success],
      [0.2, '#44d29b'],
      [0.3, '#7ad9b4'],
      [0.4, '#b0e0cd'],
      [0.5, palette.base.white],
      [0.6, palette.base.white],
      [0.7, '#eabec4'],
      [0.8, '#ee96a2'],
      [0.9, '#f26e80'],
      [1.0, palette.semantic.error],
    ],
    orderBook: {
      bid: '#11312f',
      bidPrice: '#00C076', // Updated to match screenshot green
      ask: '#392831',
      askPrice: '#FF4A4A', // Updated to match screenshot red
    },
    message: {
      info: palette.semantic.info,
      error: palette.semantic.error,
    },
    strategy: {
      success: palette.semantic.success,
      warning: palette.semantic.warning,
      error: palette.semantic.error,
      info: palette.semantic.info,
    },
  },
  breakpoints: {
    values: breakpoints,
  },
  spacing: 4,
  button: {
    textTransform: 'none',
  },
  fontFamily: ['IBM PLEX MONO'].join(','),
  // Global keyframes for holographic effects
  ...holographicShimmer,
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: ['IBM PLEX MONO'].join(','),
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'None',
          backgroundColor: palette.base.grey,
          padding: 0,
          height: '100%',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation0: {
          backgroundColor: palette.base.grey,
        },
        elevation1: {
          backgroundColor: palette.black[700],
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
          backgroundColor: palette.base.black,
          color: 'var(--text-primary)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: palette.base.white,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: palette.base.white,
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
          backgroundColor: palette.black[800],
          '&.Mui-expanded': {
            backgroundColor: palette.base.grey,
          },
          '& .MuiCollapse-root': {
            backgroundColor: palette.base.grey,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          backgroundColor: palette.grey[750],
          '&.Mui-expanded': {
            backgroundColor: palette.grey[750],
          },
          '&:hover': {
            backgroundColor: palette.grey[700],
          },
          '&.Mui-expanded:hover': {
            backgroundColor: palette.grey[700],
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          backgroundColor: palette.ui.backgroundDark,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
        indicator: {
          backgroundColor: palette.brand[500],
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
            backgroundColor: palette.ui.cardBackground,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${palette.grey[600]}`,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${palette.grey[600]}`,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${palette.grey[600]}`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${palette.grey[600]}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${palette.grey[600]}`,
          color: palette.base.white,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${palette.grey[600]}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: palette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: palette.base.white,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          backgroundColor: palette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: palette.base.white,
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
          color: palette.black[700], // Black text for primary buttons
          '&:hover': {
            color: palette.black[700], // Keep black text on hover
          },
        },
      },
    },
  },
});

export { theme };
