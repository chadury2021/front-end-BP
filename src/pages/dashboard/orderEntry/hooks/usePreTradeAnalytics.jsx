import { useTheme } from '@mui/system';
import { smartRound } from '@/util';

function usePreTradeAnalytics(preTradeEstimationData) {
  const theme = useTheme();

  const { pov, volatility, market_volume, warning } = preTradeEstimationData;
  const displayPov = pov ? `${smartRound(pov)}%` : 'N/A';
  const displayVolatility = volatility ? `±${smartRound(volatility)}%` : 'N/A';

  let displayPovColor;
  if (!pov) {
    displayPovColor = '';
  } else if (pov < 0.5) {
    displayPovColor = theme.palette.success.main;
  } else if (pov < 1) {
    displayPovColor = theme.palette.warning.main;
  } else {
    displayPovColor = theme.palette.error.main;
  }

  let displayMarketVolumeColor;
  let marketVolumeTag;
  if (!market_volume) {
    displayMarketVolumeColor = '';
    marketVolumeTag = '';
  } else if (market_volume < 0.5) {
    displayMarketVolumeColor = theme.palette.error.main;
    marketVolumeTag = 'Low';
  } else if (market_volume < 0.75) {
    displayMarketVolumeColor = theme.palette.warning.main;
    marketVolumeTag = 'Below Average';
  } else if (market_volume < 1) {
    displayMarketVolumeColor = theme.palette.text.primary;
    marketVolumeTag = 'Normal';
  } else if (market_volume < 1.5) {
    displayMarketVolumeColor = theme.palette.success.main;
    marketVolumeTag = 'Above Average';
  } else {
    displayMarketVolumeColor = theme.palette.success.main;
    marketVolumeTag = 'High';
  }

  const displayMarketVolume = market_volume ? `${marketVolumeTag} ${smartRound(market_volume, 2)}x` : 'N/A';
  return { displayPov, displayPovColor, displayVolatility, displayMarketVolume, displayMarketVolumeColor, warning };
}

export default usePreTradeAnalytics;
