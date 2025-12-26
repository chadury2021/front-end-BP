import { createTheme } from '@mui/material/styles';
import typography from './typography';
import breakpoints from './breakpoints';
import spacing from './spacing';
import { holographicShimmer } from './holographicEffects';

// Eva theme color palette (purple-centric)
const evaPalette = {
  base: {
    white: '#ECEAF5',
    black: '#0D0F14',
    grey: '#171923',
  },
  common: {
    pureWhite: '#FFFFFF',
    pureBlack: '#000000',
    transparent: '#8B5CF61A', // Eva purple transparent
    gray50: '#fafafa',
    gray100: '#f5f5f5',
    gray200: '#eeeeee',
    gray300: '#C9C8CE',
    gray400: '#bdbdbd',
    gray500: '#9e9e9e',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#343A40',
    gray900: '#1E2230',
  },
  brand: {
    0: '#87FF5F00',
    25: '#F7FFF4',
    50: '#E6FFDD',
    100: '#D2FFC2',
    200: '#B9FFA3',
    300: '#9DFF80',
    400: '#8EFF6C',
    500: '#87FF5F', // Eva primary green
    600: '#6EE640',
    700: '#4CCF1A',
    800: '#39B80F',
    900: '#2E990C',
    950: '#1C5E07',
  },
  brandAlpha: {
    500: '#87FF5F66',
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
    25: '#fafafa',
    50: '#f7f7f7',
    100: '#f0f0f1',
    200: '#ececed',
    300: '#cecfd2',
    400: '#94979c',
    500: '#85888e',
    600: '#61656c',
    700: '#373a41',
    750: '#1F2230',
    800: '#171923',
    900: '#0F1117',
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
  ui: {
    border: '#1F2230',
    backgroundLight: '#171120',
    backgroundMedium: '#1A1324',
    backgroundDark: '#110C16',
    cardBackground: '#181222',
    inputBackground: '#171120',
    inputBorder: '#1F2230',
    appBackground: '#110C16',
  },
  semantic: {
    success: '#0ecb81',
    error: '#f6465d',
    warning: '#FF9830',
    info: '#8B5CF6',
  },
};

const evaTheme = createTheme({
  typography: {
    spacing: (factor) => spacing[factor] ?? factor * 8,
    allVariants: {
      color: 'var(--text-primary)',
      fontFamily: ['Montserrat', 'Arial', 'sans-serif'].join(','),
    },
    fontFamily: ['Montserrat', 'Arial', 'sans-serif'].join(','),
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
    common: {
      white: '#ECEAF5',
      black: '#0D0F14',
      pureWhite: '#FFFFFF',
      pureBlack: '#000000',
      transparent: '#8B5CF61A',
      gray50: '#fafafa',
      gray100: '#f5f5f5',
      gray200: '#eeeeee',
      gray300: '#C9C8CE',
      gray400: '#bdbdbd',
      gray500: '#9e9e9e',
      gray600: '#757575',
      gray700: '#616161',
      gray800: '#343A40',
      gray900: '#1E2230',
    },
    ui: evaPalette.ui,
    semantic: evaPalette.semantic,
    black: evaPalette.black,
    text: {
      primary: '#ECEAF5',
      subtitle: '#CFCDE6',
      disabled: '#7D7A96',
      grey: '#C9C8CE',
      offBlack: '#000000',
      offWhite: '#ECEAF5',
      secondary: 'rgba(236, 234, 245, 0.7)',
    },
    primary: {
      light: '#E6FFDD',
      main: '#87FF5F',
      dark: '#39E200',
      dark2: evaPalette.brandAlpha[500],
      transparent: evaPalette.brandAlpha[500],
      contrastText: '#000000',
    },
    secondary: {
      main: '#F7FFF4',
    },
    info: {
      main: '#E6FFDD',
    },
    pending: {
      main: evaPalette.grey[400],
    },
    success: {
      main: evaPalette.semantic.success,
      dark2: 'rgb(2, 71, 44)',
    },
    error: {
      main: evaPalette.error[500],
      dark2: evaPalette.error[950],
    },
    warning: {
      main: evaPalette.semantic.warning,
      dark2: evaPalette.warning[950],
    },
    background: {
      base: '#110C16',
      container: '#171120',
      card: '#181222',
      paper: '#110C16',
      white: evaPalette.common.pureWhite,
      twoFa: evaPalette.grey[750],
      app: '#110C16',
    },
    border: {
      twoFa: 'rgba(238, 255, 255, 0.23)',
    },
    button: {
      grey: evaPalette.grey[700],
      lightGrey: evaPalette.grey[600],
    },
    charts: {
      red: evaPalette.error[500],
      redTransparent: 'rgba(246, 70, 93, 0.5)',
      green: evaPalette.semantic.success,
      greenTransparent: 'rgba(14, 203, 129, 0.5)',
      gray: evaPalette.grey[400],
      lightGray: evaPalette.common.gray600,
      grayTransparent: 'rgba(150, 150, 150, 0.1)',
      pinkTransparent: 'rgba(184, 118, 169, 0.5)',
      orange: evaPalette.brand[500],
      orangeTransparent: 'rgba(139, 92, 246, 0.5)',
      blue: 'rgba(57, 124, 191, 0.8)',
      gridLines: evaPalette.grey[600],
      OTC: evaPalette.brand[500],
      offWhite: evaPalette.grey[200],
      exposureTolerance: `${evaPalette.brand[600]}9A`,
      points: evaPalette.brand[500],
    },
    portfolioChart: {
      line: evaPalette.brand[500],
      ticks: evaPalette.grey[400],
    },
    card: {
      main: evaPalette.ui.backgroundDark,
      light: evaPalette.grey[800],
    },
    side: {
      buy: evaPalette.semantic.success,
      sell: evaPalette.error[500],
    },
    orderUrgency: {
      background: evaPalette.common.transparent,
      ULTRA_LOW: '#10E090',
      LOW: evaPalette.semantic.success,
      MEDIUM: evaPalette.grey[400],
      HIGH: evaPalette.error[400],
      ULTRA_HIGH: evaPalette.error[500],
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
      light: evaPalette.grey[300],
      main: evaPalette.grey[600],
      dark: evaPalette.grey[800],
      disabled: evaPalette.grey[400],
      transparent: 'rgba(100, 90, 100, 0.25)',
    },
    action: {
      active: evaPalette.brand[500],
      hover: 'rgba(139, 92, 246, 0.1)',
      selected: 'rgba(139, 92, 246, 0.2)',
      disabled: evaPalette.grey[500],
      disabledBackground: evaPalette.grey[800],
    },
    divider: evaPalette.grey[700],
    brand: evaPalette.brand,
    blue: evaPalette.blue,
    options: {
      ask: '#FF4A4A',
      bid: '#00C076',
      put: '#29171b',
      call: '#152419',
      default: '#181818',
      highlight: '#1F2230',
    },
    candlestick: {
      up: '#0F9881',
      down: '#F1434C',
      border: '#0F9881',
      wick: '#0F9881',
    },
    orderBook: {
      bid: '#11312f',
      bidPrice: '#00C076',
      ask: '#392831',
      askPrice: '#FF4A4A',
    },
    message: {
      info: evaPalette.semantic.info, // purple
      error: evaPalette.semantic.error,
    },
    strategy: {
      success: evaPalette.semantic.success,
      warning: evaPalette.semantic.warning,
      error: evaPalette.semantic.error,
      info: evaPalette.semantic.info,
    },
    tcaScheme: [
      [0.1, evaPalette.semantic.success],
      [0.2, '#44d29b'],
      [0.3, '#7ad9b4'],
      [0.4, '#b0e0cd'],
      [0.5, '#EEFFFF'],
      [0.6, '#EEFFFF'],
      [0.7, '#eabec4'],
      [0.8, '#ee96a2'],
      [0.9, '#f26e80'],
      [1.0, evaPalette.semantic.error],
    ],
    tradingView: {
      headerBg: '#0D0F14',
      headerFg: '#ECEAF5',
      toolbarBg: '#171923',
      toolbarFg: '#ECEAF5',
      toolbarBtnBg: '#171923',
      toolbarBtnFg: '#ECEAF5',
      toolbarBtnHoverBg: '#1F2230',
      toolbarBtnHoverFg: '#ECEAF5',
      symbolBg: '#171923',
      symbolFg: '#ECEAF5',
      priceBg: '#171923',
      priceFg: '#ECEAF5',
    },
  },
  breakpoints: {
    values: breakpoints,
  },
  spacing: 4,
  button: {
    textTransform: 'none',
  },
  fontFamily: ['Montserrat', 'Arial', 'sans-serif'].join(','),
  // Global keyframes for holographic effects
  ...holographicShimmer,
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: ['Montserrat', 'Arial', 'sans-serif'].join(','),
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'None',
          backgroundColor: evaPalette.ui.cardBackground,
          padding: 0,
          height: '100%',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation0: {
          backgroundColor: evaPalette.ui.backgroundLight,
        },
        elevation1: {
          backgroundColor: evaPalette.ui.backgroundLight,
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
          backgroundColor: evaPalette.base.black,
          color: 'var(--text-primary)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: evaPalette.base.white,
          '&.Mui-disabled': {
            color: evaPalette.base.white,
            '& input': {
              color: evaPalette.base.white,
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: evaPalette.base.white,
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
          backgroundColor: evaPalette.ui.cardBackground,
          '&.Mui-expanded': {
            backgroundColor: evaPalette.ui.cardBackground,
          },
          '& .MuiCollapse-root': {
            backgroundColor: evaPalette.ui.cardBackground,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          backgroundColor: evaPalette.ui.backgroundDark,
          '&.Mui-expanded': {
            backgroundColor: `${evaPalette.brand[500]} !important`,
            color: `${evaPalette.common.pureBlack} !important`,
            '& .MuiTypography-root': {
              color: `${evaPalette.common.pureBlack} !important`,
            },
          },
          '&:hover': {
            backgroundColor: evaPalette.grey[700],
            color: `${evaPalette.base.white} !important`,
          },
          '&.Mui-expanded:hover': {
            backgroundColor: `${evaPalette.brand[500]} !important`,
            color: `${evaPalette.common.pureBlack} !important`,
            '& .MuiTypography-root': {
              color: `${evaPalette.common.pureBlack} !important`,
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
          backgroundColor: evaPalette.ui.cardBackground,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
        indicator: {
          backgroundColor: evaPalette.brand[500],
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
            backgroundColor: evaPalette.ui.cardBackground,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${evaPalette.grey[600]}`,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: evaPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${evaPalette.grey[600]}`,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        paper: {
          backgroundColor: evaPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${evaPalette.grey[600]}`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: evaPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${evaPalette.grey[600]}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: evaPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${evaPalette.grey[600]}`,
          color: evaPalette.base.white,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: evaPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${evaPalette.grey[600]}`,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          backgroundColor: evaPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: evaPalette.base.white,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          backgroundColor: evaPalette.ui.cardBackground,
          backdropFilter: 'blur(10px)',
          color: evaPalette.base.white,
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
          '&.MuiButton-root[data-nav="true"], &.MuiButton-root[aria-label*="nav"], &.MuiButton-root[aria-label*="Nav"]': {
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
          color: evaPalette.black[700],
          '&:hover': {
            color: evaPalette.black[700],
          },
        },
      },
    },
  },
});

export default evaTheme;


