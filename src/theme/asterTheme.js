import { createTheme } from '@mui/material/styles';
import typography from './typography';
import breakpoints from './breakpoints';
import spacing from './spacing';
import { holographicShimmer } from './holographicEffects';

// Aster theme color palette (from user-specified colors)
const asterPalette = {
  base: {
    white: '#FFFFFF',
    black: '#000000',
    grey: '#232323',
  },
  common: {
    pureWhite: '#FFFFFF',
    pureBlack: '#000000',
    transparent: '#EEC0891A',
    gray50: '#fafafa',
    gray100: '#f5f5f5',
    gray200: '#eeeeee',
    gray300: '#8F8F8F',
    gray400: '#636364',
    gray500: '#636364',
    gray600: '#636364',
    gray700: '#313030',
    gray800: '#232323',
    gray900: '#191919',
  },
  brand: {
    0: '#EEC08900',
    25: '#fef9f0',
    50: '#fdf2e1',
    100: '#fbe4c3',
    200: '#f6dbaa',
    300: '#f1d291',
    400: '#eec089',
    500: '#EEC089',
    600: '#EEB066',
    700: '#E8A04A',
    800: '#E2902E',
    900: '#DC8012',
    950: '#D67000',
  },
  brandAlpha: {
    500: '#EEC08944',
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
    500: '#FF4A4A',
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
    25: '#fcfcfd',
    50: '#f9fafb',
    100: '#f2f4f7',
    200: '#eaecf0',
    300: '#d0d5dd',
    400: '#8F8F8F',
    500: '#636364',
    600: '#636364',
    700: '#313030',
    800: '#232323',
    900: '#191919',
    950: '#000000',
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
    border: '#313030',
    backgroundLight: '#191919',
    backgroundMedium: '#232323',
    backgroundDark: '#000000',
    cardBackground: '#232323',
    inputBackground: '#313030',
    inputBorder: '#313030',
    appBackground: '#000000',
  },
  semantic: {
    success: '#00C076',
    error: '#FF4A4A',
    warning: '#FF9830',
    info: '#EEC089',
  },
};

const asterTheme = createTheme({
  typography: {
    spacing: (factor) => spacing[factor] ?? factor * 8,
    allVariants: {
      color: 'var(--text-primary)',
      fontFamily: ['Roboto', 'system-ui', 'sans-serif'].join(','),
    },
    fontFamily: ['Roboto', 'system-ui', 'sans-serif'].join(','),
    // Expose font family configurations for components
    fontFamilyConfig: {
      primary: ['Roboto', 'system-ui', 'sans-serif'].join(','),
      monospace: ['Roboto', 'system-ui'].join(','),
      numbers: ['Roboto', 'system-ui', 'sans-serif'].join(','),
      ui: ['Roboto', 'system-ui', 'sans-serif'].join(','),
      text: ['Roboto', 'system-ui', 'sans-serif'].join(','),
      data: ['Roboto', 'system-ui'].join(','),
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
    common: {
      white: '#FFFFFF',
      black: '#000000',
      pureWhite: '#FFFFFF',
      pureBlack: '#000000',
      transparent: '#EEC0891A',
      gray50: asterPalette.common.gray50,
      gray100: asterPalette.common.gray100,
      gray200: asterPalette.common.gray200,
      gray300: asterPalette.common.gray300,
      gray400: asterPalette.common.gray400,
      gray500: asterPalette.common.gray500,
      gray600: asterPalette.common.gray600,
      gray700: asterPalette.common.gray700,
      gray800: asterPalette.common.gray800,
      gray900: asterPalette.common.gray900,
    },
    ui: asterPalette.ui,
    semantic: asterPalette.semantic,
    black: asterPalette.black,
    text: {
      primary: '#FFFFFF',
      subtitle: '#8F8F8F',
      disabled: '#636364',
      grey: '#F7F4E7',
      offBlack: '#000000',
      offWhite: '#FFFFFF',
      secondary: '#F7F4E7',
    },
    primary: {
      light: '#F6DBBA',
      main: '#EEC089',
      dark: '#EEB066',
      dark2: asterPalette.brandAlpha[500],
      transparent: asterPalette.brandAlpha[500],
      contrastText: '#000000',
    },
    secondary: {
      main: '#977A57',
    },
    info: {
      main: '#FFFFFF',
    },
    pending: {
      main: asterPalette.grey[400],
    },
    success: {
      main: asterPalette.semantic.success,
      dark2: 'rgb(2, 71, 44)',
    },
    error: {
      main: asterPalette.error[500],
      dark2: asterPalette.error[950],
    },
    warning: {
      main: asterPalette.semantic.warning,
      dark2: asterPalette.warning[950],
    },
    background: {
      base: '#000000',
      container: '#313030',
      card: '#232323',
      paper: '#191919',
      white: asterPalette.common.pureWhite,
      twoFa: asterPalette.grey[800],
      app: '#000000',
    },
    border: {
      twoFa: 'rgba(238, 255, 255, 0.23)',
    },
    button: {
      grey: asterPalette.grey[700],
      lightGrey: asterPalette.grey[600],
    },
    charts: {
      red: asterPalette.error[500],
      redTransparent: 'rgba(246, 70, 93, 0.5)',
      green: asterPalette.semantic.success,
      greenTransparent: 'rgba(14, 203, 129, 0.5)',
      gray: asterPalette.grey[400],
      lightGray: asterPalette.common.gray600,
      grayTransparent: 'rgba(150, 150, 150, 0.1)',
      pinkTransparent: 'rgba(184, 118, 169, 0.5)',
      orange: asterPalette.brand[500],
      orangeTransparent: 'rgba(238, 192, 137, 0.5)',
      blue: 'rgba(57, 124, 191, 0.8)',
      gridLines: asterPalette.grey[600],
      OTC: asterPalette.brand[500],
      offWhite: asterPalette.grey[200],
      exposureTolerance: `${asterPalette.brand[600]}9A`,
      points: asterPalette.brand[600],
    },
    portfolioChart: {
      line: asterPalette.brand[500],
      ticks: asterPalette.grey[400],
    },
    card: {
      main: asterPalette.ui.backgroundDark,
      light: asterPalette.grey[800],
    },
    side: {
      buy: asterPalette.semantic.success,
      sell: asterPalette.error[500],
    },
    orderUrgency: {
      background: asterPalette.common.transparent,
      ULTRA_LOW: '#10E090',
      LOW: asterPalette.semantic.success,
      MEDIUM: asterPalette.grey[400],
      HIGH: asterPalette.error[400],
      ULTRA_HIGH: asterPalette.error[500],
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
      light: asterPalette.grey[300],
      main: asterPalette.grey[600],
      dark: asterPalette.grey[800],
      disabled: asterPalette.grey[400],
      transparent: 'rgba(100, 90, 100, 0.25)',
    },
    action: {
      active: asterPalette.brand[500],
      hover: 'rgba(238, 192, 137, 0.1)',
      selected: 'rgba(238, 192, 137, 0.2)',
      disabled: asterPalette.grey[500],
      disabledBackground: asterPalette.grey[800],
    },
    divider: asterPalette.grey[700],
    brand: asterPalette.brand,
    blue: asterPalette.blue,
    options: {
      ask: '#FF4A4A',
      bid: '#00C076',
      put: '#2A1F1A',
      call: '#1F2A1A',
      default: '#232323',
      highlight: '#313030',
    },
    candlestick: {
      up: '#0F9881',
      down: '#F1434C',
      border: '#0F9881',
      wick: '#0F9881',
    },
    orderBook: {
      bid: '#10222a',
      bidPrice: '#00C076',
      ask: '#28151e',
      askPrice: '#FF4A4A',
    },
    message: {
      info: asterPalette.semantic.info,
      error: asterPalette.semantic.error,
    },
    strategy: {
      success: asterPalette.semantic.success,
      warning: asterPalette.semantic.warning,
      error: asterPalette.semantic.error,
      info: asterPalette.semantic.info,
    },
    tcaScheme: [
      [0.1, asterPalette.semantic.success],
      [0.2, '#44d29b'],
      [0.3, '#7ad9b4'],
      [0.4, '#b0e0cd'],
      [0.5, '#EEFFFF'],
      [0.6, '#EEFFFF'],
      [0.7, '#eabec4'],
      [0.8, '#ee96a2'],
      [0.9, '#f26e80'],
      [1.0, asterPalette.semantic.error],
    ],
    tradingView: {
      headerBg: '#000000',
      headerFg: '#FFFFFF',
      toolbarBg: '#191919',
      toolbarFg: '#FFFFFF',
      toolbarBtnBg: '#191919',
      toolbarBtnFg: '#FFFFFF',
      toolbarBtnHoverBg: '#232323',
      toolbarBtnHoverFg: '#FFFFFF',
      symbolBg: '#191919',
      symbolFg: '#FFFFFF',
      priceBg: '#191919',
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
  fontFamily: ['Roboto', 'system-ui', 'sans-serif'].join(','),
  ...holographicShimmer,
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: ['Roboto', 'system-ui', 'sans-serif'].join(','),
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'None',
          backgroundColor: asterPalette.ui.cardBackground,
          padding: 0,
          height: '100%',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation0: {
          backgroundColor: asterPalette.ui.backgroundLight,
        },
        elevation1: {
          backgroundColor: asterPalette.ui.backgroundLight,
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
          backgroundColor: asterPalette.base.black,
          color: 'var(--text-primary)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: asterPalette.base.white,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: asterPalette.base.white,
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
          backgroundColor: asterPalette.ui.cardBackground,
          '&.Mui-expanded': {
            backgroundColor: asterPalette.ui.cardBackground,
          },
          '& .MuiCollapse-root': {
            backgroundColor: asterPalette.ui.cardBackground,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          backgroundColor: asterPalette.ui.backgroundDark,
          '&.Mui-expanded': {
            backgroundColor: asterPalette.brand[500],
            color: asterPalette.common.pureBlack,
            '& .MuiAccordionSummary-content': {
              color: asterPalette.common.pureBlack,
            },
            '& .MuiAccordionSummary-content .MuiTypography-root': {
              color: asterPalette.common.pureBlack,
            },
            '& .MuiAccordionSummary-content *': {
              color: asterPalette.common.pureBlack,
            },
          },
          '&:hover': {
            backgroundColor: asterPalette.grey[700],
          },
          '&.Mui-expanded:hover': {
            backgroundColor: asterPalette.brand[500],
            color: asterPalette.common.pureBlack,
            '& .MuiAccordionSummary-content': {
              color: asterPalette.common.pureBlack,
            },
            '& .MuiAccordionSummary-content .MuiTypography-root': {
              color: asterPalette.common.pureBlack,
            },
            '& .MuiAccordionSummary-content *': {
              color: asterPalette.common.pureBlack,
            },
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          backgroundColor: asterPalette.ui.cardBackground,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
        indicator: {
          backgroundColor: asterPalette.brand[500],
          height: 2,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minWidth: 'auto!important',
          padding: '6px 24px',
          fontSize: typography.fontSizes[400],
          textAlign: 'center',
          '& .MuiTab-wrapper': {
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          },
        },
      },
    },
    MuiPopper: {
      styleOverrides: {
        root: {
          '& .MuiPaper-root': {
            backgroundColor: asterPalette.ui.cardBackground,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${asterPalette.grey[600]}`,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: asterPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${asterPalette.grey[600]}`,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        paper: {
          backgroundColor: asterPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${asterPalette.grey[600]}`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: asterPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${asterPalette.grey[600]}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: asterPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${asterPalette.grey[600]}`,
          color: asterPalette.base.white,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: asterPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${asterPalette.grey[600]}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: asterPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: asterPalette.base.white,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          backgroundColor: asterPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: asterPalette.base.white,
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
        primary: {
          color: '#000000',
          '&:hover': {
            color: '#000000',
          },
        },
      },
    },
  },
});

export default asterTheme;
