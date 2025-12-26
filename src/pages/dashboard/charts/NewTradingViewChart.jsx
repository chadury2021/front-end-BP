import { useEffect, useRef } from 'react';
import { useTheme } from '@mui/material';
import { widget } from '@/../public/charting_library/charting_library.esm';
import { getStaticChartingLibraryPath } from '@/apiServices';
import { formatChartPrice } from '@/util/priceFormatting';
import { useOkxDexMarketData } from '@/shared/context/OkxDexMarketDataProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { getUserTimezone } from '@/util/timezoneUtils';
import RestDataFeed from './RestDataFeed';
import { usePriceDataContext } from '../orderEntry/PriceDataContext';
import { useMarketDataContext } from '../orderEntry/MarketDataContext';

const DISABLED_MOBILE_FEATURES = Object.freeze(['left_toolbar', 'timeframes_toolbar']);

export default function NewTradingViewChart({
  exchangeName,
  pair,
  symbol, // e.g. 'BINANCE|BTCUSDT'
  isMobile = false,
  interval = '15',
  themeMode = 'dark', // 'dark' | 'light'
}) {
  const containerRef = useRef(null);
  const tvWidgetRef = useRef(null);
  const datafeedRef = useRef(null);
  const theme = useTheme();
  const { livePairPrice } = usePriceDataContext();
  const { orderOverlayData } = useMarketDataContext();
  const { subscribeCandle, unsubscribeCandle, candleSubscriptions } = useOkxDexMarketData();
  const { user, isMainnet } = useUserMetadata();

  useEffect(() => {
    if (!containerRef.current) return () => {};

    // Clean up any prior widget
    if (tvWidgetRef.current) {
      try {
        tvWidgetRef.current.remove();
      } catch (e) {
        // ignore
      }
      tvWidgetRef.current = null;
    }

    const datafeed = new RestDataFeed(exchangeName, pair, subscribeCandle, unsubscribeCandle, isMainnet);
    datafeedRef.current = datafeed;

    const disabled_features = [
      'symbol_search_hot_key',
      'header_symbol_search',
      'header_compare',
      'symbol_search',
      'show_spread_operators',
      'legend_inplace_edit',
      'chart_animation',
      'disable_pulse_animation',
      ...(isMobile ? DISABLED_MOBILE_FEATURES : []),
    ];

    const config = {
      container: containerRef.current,
      locale: 'en',
      fullscreen: false,
      autosize: true,
      theme: themeMode,
      custom_formatters: {
        priceFormatterFactory: (symbolInfo, minTick) => {
          return { format: formatChartPrice };
        },
      },
      loading_screen: {
        backgroundColor: theme.palette.background.container,
        foregroundColor: theme.palette.primary.main,
        enabled: true,
      },
      toolbar_bg: theme.palette.background.container,
      timezone: getUserTimezone(user?.preferences),
      symbol: symbol || 'BINANCE|BTCUSDT',
      interval,
      datafeed,
      disabled_features,
      library_path: getStaticChartingLibraryPath(),
      client_id: 'treadfi.com',
      user_id: 'rest_tvd',
      load_last_chart: false,
      // Apply theme colors using correct TradingView properties
      overrides: {
        'paneProperties.background': theme.palette.background.container,
        'paneProperties.backgroundType': 'solid',
        'scalesProperties.backgroundColor': theme.palette.background.container,
        'scalesProperties.textColor': theme.palette.text.primary,
        'scalesProperties.lineColor': theme.palette.grey[600],
        'mainSeriesProperties.candleStyle.upColor': theme.palette.candlestick?.up || '#0F9881',
        'mainSeriesProperties.candleStyle.downColor': theme.palette.candlestick?.down || '#F1434C',
        'mainSeriesProperties.candleStyle.borderUpColor': theme.palette.candlestick?.up || '#0F9881',
        'mainSeriesProperties.candleStyle.borderDownColor': theme.palette.candlestick?.down || '#F1434C',
        'mainSeriesProperties.candleStyle.wickUpColor': theme.palette.candlestick?.up || '#0F9881',
        'mainSeriesProperties.candleStyle.wickDownColor': theme.palette.candlestick?.down || '#F1434C',
        // Toolbar and settings theme colors
        'toolbar.background': theme.palette.background.container,
        'toolbar.foreground': theme.palette.text.primary,
        'toolbar.buttonsBackground': theme.palette.background.container,
        'toolbar.buttonsForeground': theme.palette.text.primary,
        'toolbar.buttonsHoverBackground': theme.palette.action.hover,
        'toolbar.buttonsHoverForeground': theme.palette.text.primary,
        // Header/top toolbar theme colors
        'header.background': theme.palette.background.container,
        'header.foreground': theme.palette.text.primary,
        'header.symbolBackground': theme.palette.background.container,
        'header.symbolForeground': theme.palette.text.primary,
        'header.priceBackground': theme.palette.background.container,
        'header.priceForeground': theme.palette.text.primary,
        'header.buttonsBackground': theme.palette.background.container,
        'header.buttonsForeground': theme.palette.text.primary,
      },
    };

    try {
      // eslint-disable-next-line new-cap
      const tvw = new widget(config);
      tvWidgetRef.current = tvw;

      // Apply theme colors after chart is ready as a fallback
      tvw.onChartReady(() => {
        try {
          const chart = tvw.activeChart();
          if (chart) {
            // Apply theme colors using the correct method
            chart.applyOverrides({
              'paneProperties.background': theme.palette.background.container,
              'paneProperties.backgroundType': 'solid',
              'scalesProperties.backgroundColor': theme.palette.background.container,
              'scalesProperties.textColor': theme.palette.text.primary,
              'scalesProperties.lineColor': theme.palette.grey[600],
              'mainSeriesProperties.candleStyle.upColor': theme.palette.candlestick?.up || '#0F9881',
              'mainSeriesProperties.candleStyle.downColor': theme.palette.candlestick?.down || '#F1434C',
              'mainSeriesProperties.candleStyle.borderUpColor': theme.palette.candlestick?.up || '#0F9881',
              'mainSeriesProperties.candleStyle.borderDownColor': theme.palette.candlestick?.down || '#F1434C',
              'mainSeriesProperties.candleStyle.wickUpColor': theme.palette.candlestick?.up || '#0F9881',
              'mainSeriesProperties.candleStyle.wickDownColor': theme.palette.candlestick?.down || '#F1434C',
              // Toolbar and settings theme colors
              'toolbar.background': theme.palette.background.container,
              'toolbar.foreground': theme.palette.text.primary,
              'toolbar.buttonsBackground': theme.palette.background.container,
              'toolbar.buttonsForeground': theme.palette.text.primary,
              'toolbar.buttonsHoverBackground': theme.palette.action.hover,
              'toolbar.buttonsHoverForeground': theme.palette.text.primary,
              // Header/top toolbar theme colors
              'header.background': theme.palette.background.container,
              'header.foreground': theme.palette.text.primary,
              'header.symbolBackground': theme.palette.background.container,
              'header.symbolForeground': theme.palette.text.primary,
              'header.priceBackground': theme.palette.background.container,
              'header.priceForeground': theme.palette.text.primary,
              'header.buttonsBackground': theme.palette.background.container,
              'header.buttonsForeground': theme.palette.text.primary,
            });
          }
        } catch (error) {
          console.warn('Failed to apply theme overrides after chart ready:', error);
        }
      });
    } catch (error) {
      console.error('Failed to initialize TradingView widget:', error);
    }

    return () => {
      if (tvWidgetRef.current) {
        try {
          const { current } = tvWidgetRef;
          tvWidgetRef.current = null;
          current.remove();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [exchangeName, pair, isMobile, interval, themeMode, theme, user?.preferences?.chart_timezone]);

  // Push live price into the RestDataFeed to animate the current bar
  useEffect(() => {
    if (datafeedRef.current && typeof datafeedRef.current.updateLivePrice === 'function') {
      datafeedRef.current.updateLivePrice(livePairPrice);
    }
  }, [livePairPrice]);

  // Push dex candle updates into the RestDataFeed to animate the current bar
  useEffect(() => {
    if (datafeedRef.current) {
      datafeedRef.current.updateDexCandle(candleSubscriptions);
    }
  }, [candleSubscriptions]);

  // Draw order condition lines using TradingView's native drawing tools
  useEffect(() => {
    const widgetInstance = tvWidgetRef.current;
    const activeConditions = orderOverlayData?.active_condition || [];

    if (!widgetInstance || !Array.isArray(activeConditions) || activeConditions.length === 0) {
      return;
    }

    const drawOrderLines = async () => {
      try {
        // Wait for chart to be ready
        if (!widgetInstance.activeChart) {
          setTimeout(drawOrderLines, 100);
          return;
        }

        const chart = widgetInstance.activeChart();
        if (!chart) {
          setTimeout(drawOrderLines, 100);
          return;
        }

        // Clear all existing horizontal lines
        try {
          const allShapes = chart.getAllShapes && chart.getAllShapes();
          if (allShapes && Array.isArray(allShapes)) {
            allShapes.forEach((shape) => {
              try {
                if (shape?.id && chart.removeEntity && typeof chart.removeEntity === 'function') {
                  if (shape?.name === 'horizontal_line') {
                    chart.removeEntity(shape.id);
                  }
                }
              } catch (e) {
                // ignore errors
              }
            });
          }
        } catch (e) {
          // ignore errors
        }

        // Group conditions by price to avoid duplicates
        const priceGroups = new Map();
        activeConditions.forEach((cond) => {
          const price = Number(cond?.price);
          if (!Number.isFinite(price)) return;

          if (!priceGroups.has(price)) {
            priceGroups.set(price, []);
          }
          priceGroups.get(price).push(cond);
        });

        // Draw one line per price level
        const linePromises = Array.from(priceGroups).map(async ([price, conditions]) => {
          const isBuy = conditions.some((cond) => String(cond?.side || '').toLowerCase() === 'buy');
          const color = isBuy ? theme.palette.success.main : theme.palette.error.main;

          try {
            const line = await chart.createMultipointShape([{ time: Math.floor(Date.now() / 1000), price }], {
              shape: 'horizontal_line',
              lock: true,
              disableSave: true,
              disableSelection: true,
              overrides: {
                linewidth: 1,
                linecolor: color,
                linestyle: 0,
                extendLeft: true,
                extendRight: true,
                editable: false,
                selectable: false,
                moveable: false,
                resizable: false,
                locked: true,
                showLabel: false,
                text: '',
                showText: false,
                textcolor: 'transparent',
              },
            });
            return { line, price, color };
          } catch (e) {
            return null;
          }
        });

        // Wait for all lines to be created
        await Promise.all(linePromises);
      } catch (error) {
        // Retry after a delay if there's an error
        setTimeout(drawOrderLines, 500);
      }
    };

    // Use onChartReady to ensure chart is fully loaded
    if (typeof widgetInstance.onChartReady === 'function') {
      widgetInstance.onChartReady(() => {
        drawOrderLines();
      });
    } else {
      // Fallback: try drawing after a delay
      setTimeout(drawOrderLines, 1000);
    }
  }, [orderOverlayData]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}
