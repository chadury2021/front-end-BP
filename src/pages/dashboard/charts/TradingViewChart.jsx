import { getStaticChartingLibraryPath } from '@/apiServices';
import { useEffect, useRef } from 'react';
import { useTheme } from '@mui/material';
import { widget } from '@/../public/charting_library/charting_library.esm';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { getUserTimezone } from '@/util/timezoneUtils';
import CustomDatafeed from './CustomDataFeed';
import BasketDataFeed from './BasketDataFeed';
import { usePriceDataContext } from '../orderEntry/PriceDataContext';

const DISABLED_MOBILE_FEATURES = Object.freeze(['left_toolbar', 'timeframes_toolbar']);
const DEFAULT_SYMBOL = 'BTCUSDT'; // Default symbol to show when no pair is selected

export function TradingViewChart({
  pair,
  relevantExchangeName,
  isMobile = false,
  basketItems = null, // Array of { symbol, weight, notional }
  side,
  defaultInterval = '15', // Default interval in minutes
  defaultTimeframe = null, // Default timeframe (e.g., '1D', '1W')
  defaultChartType = null, // Default chart type
  defaultIndicators = [], // Array of default indicators
}) {
  const chartContainerRef = useRef(null);
  const widgetRef = useRef(null);
  const datafeedRef = useRef(null);
  const theme = useTheme();
  const { livePairPrice } = usePriceDataContext();
  const { user } = useUserMetadata();

  // Use default symbol if no pair is selected
  const symbolName = pair ? `${relevantExchangeName}:${pair}` : DEFAULT_SYMBOL;

  // Determine if this is a DEX pair and set appropriate interval
  const isDexPair = relevantExchangeName === 'OKXDEX';
  const interval = isDexPair ? '1' : defaultInterval;

  // Only reload widget when switching between basket and single pair, or when side changes
  const shouldReloadWidget = (prevBasketItems, newBasketItems, prevSide, newSide) => {
    const wasBasket = Boolean(prevBasketItems);
    const isBasket = Boolean(newBasketItems);
    return wasBasket !== isBasket || prevSide !== newSide;
  };

  useEffect(() => {
    // Get or create anonymous user ID
    let userId = localStorage.getItem('tradingview_user_id');
    if (!userId) {
      userId = `anon_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('tradingview_user_id', userId);
    }

    const createWidget = async () => {
      if (!chartContainerRef.current) {
        return;
      }

      // Clean up previous widget if it exists
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {
          console.error('Error removing widget:', e);
        }
        widgetRef.current = null;
      }

      let disabled_features = [
        'symbol_search_hot_key',
        'header_symbol_search',
        'header_compare',
        'symbol_search',
        'show_spread_operators',
        'legend_inplace_edit',
        'chart_animation',
        'disable_pulse_animation',
      ];
      if (isMobile) {
        disabled_features = [...disabled_features, ...DISABLED_MOBILE_FEATURES];
      }

      // Create appropriate datafeed based on whether we're showing a basket or single pair
      datafeedRef.current = basketItems ? new BasketDataFeed(basketItems, side) : new CustomDatafeed(livePairPrice);

      // Prepare widget configuration
      const widgetConfig = {
        container: chartContainerRef.current,
        locale: 'en',
        fullscreen: false,
        autosize: true,
        theme: 'dark',
        toolbar_bg: theme.palette.background.card,
        timezone: getUserTimezone(user?.preferences),
        symbol: basketItems ? `BASKET_${side.toUpperCase()}` : symbolName,
        interval,
        datafeed: datafeedRef.current,
        loading_screen: {
          backgroundColor: theme.palette.background.card,
          foregroundColor: theme.palette.primary.main,
          enabled: true,
        },
        disabled_features,
        library_path: getStaticChartingLibraryPath(),
        client_id: 'treadfi.com',
        user_id: userId,
        auto_save_delay: 10,
        load_last_chart: true,
        overrides: {
          'mainSeriesProperties.title': `${relevantExchangeName} ${pair?.split('-')[0]?.split(':')[0]} Spread`,
          'mainSeriesProperties.priceAxisProperties.autoScale': true,
          'mainSeriesProperties.priceAxisProperties.autoScaleDisabled': false,
          'mainSeriesProperties.priceAxisProperties.percentage': false,
          'mainSeriesProperties.priceAxisProperties.percentageDisabled': false,
          'mainSeriesProperties.priceAxisProperties.log': false,
          'mainSeriesProperties.priceAxisProperties.logDisabled': false,
          'mainSeriesProperties.priceAxisProperties.showSymbolLabels': false,
          // Always enforce candlestick colors from theme tokens
          'mainSeriesProperties.candleStyle.upColor': theme.palette.candlestick?.up || '#0F9881',
          'mainSeriesProperties.candleStyle.downColor': theme.palette.candlestick?.down || '#F1434C',
          'mainSeriesProperties.candleStyle.borderUpColor': theme.palette.candlestick?.up || '#0F9881',
          'mainSeriesProperties.candleStyle.borderDownColor': theme.palette.candlestick?.down || '#F1434C',
          'mainSeriesProperties.candleStyle.wickUpColor': theme.palette.candlestick?.up || '#0F9881',
          'mainSeriesProperties.candleStyle.wickDownColor': theme.palette.candlestick?.down || '#F1434C',
        },
        save_load_adapter: {
          getAllCharts: () => {
            try {
              const charts = [];
              for (let i = 0; i < localStorage.length; i += 1) {
                const key = localStorage.key(i);
                if (key.startsWith('chart_')) {
                  const chart = JSON.parse(localStorage.getItem(key));
                  charts.push(chart);
                }
              }
              return Promise.resolve(charts);
            } catch (error) {
              return Promise.resolve([]);
            }
          },
          saveChart: async (chartData) => {
            try {
              const key = `chart_${chartData.id}`;
              localStorage.setItem(
                key,
                JSON.stringify({
                  ...chartData,
                  timestamp: new Date().getTime(),
                })
              );
              return Promise.resolve();
            } catch (error) {
              return Promise.reject(error);
            }
          },
          removeChart: async (chartId) => {
            try {
              localStorage.removeItem(`chart_${chartId}`);
              return Promise.resolve();
            } catch (error) {
              return Promise.reject(error);
            }
          },
          getChartContent: async (chartId) => {
            try {
              const chart = localStorage.getItem(`chart_${chartId}`);
              return Promise.resolve(chart ? JSON.parse(chart).content : null);
            } catch (error) {
              return Promise.resolve(null);
            }
          },
        },
      };

      // Add default timeframe if provided
      if (defaultTimeframe) {
        widgetConfig.time_frames = [
          { text: '5y', resolution: '1W' },
          { text: '1y', resolution: '1W' },
          { text: '6m', resolution: '120' },
          { text: '3m', resolution: '60' },
          { text: '1m', resolution: '30' },
          { text: '5d', resolution: '5' },
          { text: '1d', resolution: '1' },
          { text: defaultTimeframe, resolution: interval },
        ];
      }

      // Add default chart type if provided
      if (defaultChartType) {
        widgetConfig.overrides = {
          ...widgetConfig.overrides,
          'mainSeriesProperties.candleStyle.drawWick': defaultChartType === 'candlestick',
          'mainSeriesProperties.candleStyle.drawBorder': defaultChartType === 'candlestick',
          'mainSeriesProperties.candleStyle.borderColor': theme.palette.candlestick?.border || '#378658',
          'mainSeriesProperties.candleStyle.wickColor': theme.palette.candlestick?.wick || '#737375',
          'mainSeriesProperties.candleStyle.barColorsOnPrevClose': false,
          'mainSeriesProperties.candleStyle.downColor': theme.palette.candlestick?.down || '#F1434C',
          'mainSeriesProperties.candleStyle.upColor': theme.palette.candlestick?.up || '#0F9881',
        };
      }

      // eslint-disable-next-line new-cap
      widgetRef.current = new widget(widgetConfig);

      // Add default indicators after widget is created
      if (defaultIndicators.length > 0 && widgetRef.current) {
        setTimeout(() => {
          defaultIndicators.forEach((indicator) => {
            try {
              widgetRef.current
                .activeChart()
                .createStudy(indicator.name, indicator.overlay || false, indicator.inputs || {});
            } catch (error) {
              console.warn(`Failed to add default indicator ${indicator.name}:`, error);
            }
          });
        }, 1000); // Small delay to ensure chart is fully loaded
      }
    };

    // Only create widget if we don't have one or if we need to reload
    if (!widgetRef.current || shouldReloadWidget(null, basketItems, null, side)) {
      createWidget();
    } else if (datafeedRef.current && datafeedRef.current.updateBasketItems) {
      // Update the datafeed with new basket items
      datafeedRef.current.updateBasketItems(basketItems);
    }

    // Cleanup function
    return () => {
      const currentWidget = widgetRef.current;
      if (currentWidget) {
        try {
          // Try to save first
          if (currentWidget.activeChart) {
            const chart = currentWidget.activeChart();
            if (chart) {
              chart.save(() => {
                // Only remove after save completes
                widgetRef.current = null;
                currentWidget.remove();
              });
              return; // Exit early, widget will be removed in callback
            }
          }

          widgetRef.current = null;
          currentWidget.remove();
        } catch (e) {
          try {
            widgetRef.current = null;
            currentWidget.remove();
          } catch (removeError) {
            // nothing
          }
        }
      }
    };
  }, [symbolName, theme, isMobile, basketItems, side, user?.preferences?.chart_timezone]);

  // Update the datafeed with new live price when it changes
  useEffect(() => {
    if (datafeedRef.current && datafeedRef.current.updateLivePrice && !basketItems) {
      // Update immediately when price changes
      datafeedRef.current.updateLivePrice(livePairPrice);
    }
  }, [livePairPrice, basketItems]);

  // Also update when the widget is first created
  useEffect(() => {
    if (datafeedRef.current && datafeedRef.current.updateLivePrice && !basketItems && livePairPrice) {
      // Small delay to ensure widget is fully initialized
      setTimeout(() => {
        datafeedRef.current.updateLivePrice(livePairPrice);
      }, 100);
    }
  }, [datafeedRef.current, livePairPrice, basketItems]);

  return <div id='tv_chart_container' ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />;
}
