/* eslint-disable class-methods-use-this */
import { getTradingViewDataFeed } from '@/apiServices';
import { buildTokenId, mapTokenAddressForCandles } from '@/shared/dexUtils';
import { getExchangeFeed } from './exchanges';

const getKey = (symbolInfo, resolution) => `${symbolInfo.name}|${resolution}`;

class RestDataFeed {
  constructor(exchangeName, pair, subscribeCandle, unsubscribeCandle, isMainnet) {
    this.baseUrl = getTradingViewDataFeed();
    this.subscriptions = new Map();
    this.currentBarByKey = new Map();
    this.exchangeName = exchangeName;
    this.pair = pair;
    this.subscribeCandle = subscribeCandle;
    this.unsubscribeCandle = unsubscribeCandle;
    this.isMainnet = isMainnet;
  }

  onReady(callback) {
    setTimeout(() => {
      callback({
        supports_search: true,
        supports_group_request: false,
        supported_resolutions: ['1', '5', '15', '30', '60', '120', '240', '1D'],
        supports_marks: false,
        supports_timescale_marks: false,
        supports_time: true,
      });
    }, 0);
  }

  async resolveSymbol(symbolName, onSymbolResolvedCallback, onErrorCallback) {
    if (!symbolName) {
      onErrorCallback('Symbol is required');
      return;
    }

    const symbol = {
      name: symbolName,
      ticker: symbolName,
      description: symbolName,
      type: 'crypto',
      session: '24x7',
      exchange: symbolName.includes('|') ? symbolName.split('|')[0] : 'Custom',
      minmov: 1,
      timezone: 'Etc/UTC',
      pricescale: 10000000000,
      has_intraday: true,
      supported_resolutions: ['1', '5', '15', '30', '60', '120', '240', '1D'],
      volume_precision: 2,
      data_status: 'streaming',
    };

    setTimeout(() => onSymbolResolvedCallback(symbol), 0);
  }

  async getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
    try {
      const fromSec = periodParams?.from;
      const toSec = periodParams?.to;
      const currentBarStart = toSec;

      const exchangeFeed = getExchangeFeed(this.exchangeName);
      const symbol = exchangeFeed.getSymbol(this.exchangeName, this.pair);

      let bars = [];
      if (exchangeFeed && typeof exchangeFeed.getBars === 'function') {
        try {
          bars = await exchangeFeed.getBars({
            symbol,
            resolution,
            fromSec,
            toSec,
            marketType: this.pair.market_type,
            countBack: periodParams?.countBack,
            isMainnet: this.isMainnet,
          });
        } catch (err) {
          onErrorCallback('Error loading data');
        }
      }

      // Track the current bar so we can animate it with live prices
      if (bars.length > 0) {
        const lastBar = bars[bars.length - 1];
        if (lastBar.time === currentBarStart) {
          this.currentBarByKey.set(getKey(symbolInfo, resolution), lastBar);
        }
      }

      onHistoryCallback(bars, { noData: bars.length === 0 });
    } catch (e) {
      onErrorCallback('Error loading data');
    }
  }

  subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
    if (this.subscriptions.has(subscriberUID)) {
      return;
    }

    const { name } = symbolInfo;
    const [exchange, symbol] = name.split('|');
    const [tokenAddress, chainId] = symbol.split(':');
    if (exchange === 'OKXDEX') {
      this.subscribeCandle(mapTokenAddressForCandles(tokenAddress, chainId), chainId, resolution);
    }
    // Register subscription for realtime updates driven by updateLivePrice.
    const state = {
      resolution,
      onRealtimeCallback,
      symbolInfo,
    };

    this.subscriptions.set(subscriberUID, state);
  }

  unsubscribeBars(subscriberUID) {
    const { symbolInfo, resolution } = this.subscriptions.get(subscriberUID);
    const { name } = symbolInfo;
    const [exchange, tokenAddress, chainId] = name.split(':');
    if (exchange === 'OKXDEX') {
      this.unsubscribeCandle(mapTokenAddressForCandles(tokenAddress, chainId), chainId, resolution);
    }

    this.subscriptions.delete(subscriberUID);
  }

  getResolutionInSeconds(resolution) {
    const map = {
      1: 60,
      5: 300,
      15: 900,
      30: 1800,
      60: 3600,
      120: 7200,
      240: 14400,
      '1D': 86400,
    };
    return map[resolution] || 60;
  }

  // Inject live price updates to animate the current bar
  updateLivePrice(price) {
    if (price === undefined || price === null || price === '') {
      return;
    }

    const livePrice = parseFloat(price);
    if (!Number.isFinite(livePrice) || livePrice <= 0) {
      return;
    }

    // Push to all active subscriptions
    this.subscriptions.forEach((state, uid) => {
      const { name } = state.symbolInfo;
      const [exchange, _] = name.split(':');
      if (exchange === 'OKXDEX') {
        return;
      }

      const barSize = this.getResolutionInSeconds(state.resolution);
      const nowSec = Math.floor(Date.now() / 1000);
      const currentBarStart = Math.floor(nowSec / barSize) * barSize * 1000;

      const currentBar = this.currentBarByKey.get(getKey(state.symbolInfo, state.resolution)) || null;

      // Initialize the current bar for this subscription if missing or if time rolled over

      let nextBar = null;
      if (!currentBar || currentBar.time < currentBarStart) {
        const openPrice = currentBar?.close ?? livePrice;
        nextBar = {
          time: currentBarStart,
          open: openPrice,
          high: livePrice,
          low: livePrice,
          close: livePrice,
          volume: 0,
        };
      } else if (currentBar.time === currentBarStart) {
        // Update in-place within the same bar interval (immutably)
        nextBar = {
          time: currentBar.time,
          open: currentBar.open ?? livePrice,
          high: Math.max(currentBar.high ?? livePrice, livePrice),
          low: Math.min(currentBar.low ?? livePrice, livePrice),
          close: livePrice,
          volume: currentBar.volume ?? 0,
        };
      } else if (currentBar.time > currentBarStart) {
        // In rare cases of clock skew, ignore
        return;
      }

      this.currentBarByKey.set(getKey(state.symbolInfo, state.resolution), nextBar);

      // Emit the update to TradingView
      try {
        if (state.onRealtimeCallback) {
          state.onRealtimeCallback(nextBar);
        }
      } catch (e) {
        // no-op
      }
    });
  }

  updateDexCandle(candleSubscriptions) {
    this.subscriptions.forEach((state, uid) => {
      const { symbolInfo, resolution } = state;
      const { name } = symbolInfo;
      const [exchange, tokenAddress, chainId] = name.split(':');
      if (exchange !== 'OKXDEX') {
        return;
      }

      const tokenId = buildTokenId(mapTokenAddressForCandles(tokenAddress, chainId), chainId);
      const subscriptionKey = `${tokenId}-${resolution}`;
      const subscriptionCandle = candleSubscriptions[subscriptionKey];
      if (!subscriptionCandle) {
        return;
      }

      const barSize = this.getResolutionInSeconds(resolution);
      const nowSec = Math.floor(Date.now() / 1000);
      const currentBarStart = Math.floor(nowSec / barSize) * barSize * 1000;
      const currentBar = this.currentBarByKey.get(getKey(symbolInfo, resolution)) || null;
      if (currentBar?.time > currentBarStart) {
        // In rare cases of clock skew, ignore
        return;
      }

      const nextBar = {
        time: Number(subscriptionCandle[0]),
        open: Number(subscriptionCandle[1]),
        high: Number(subscriptionCandle[2]),
        low: Number(subscriptionCandle[3]),
        close: Number(subscriptionCandle[4]),
        volume: Number(subscriptionCandle[5]),
      };

      this.currentBarByKey.set(getKey(state.symbolInfo, state.resolution), nextBar);

      // Emit the update to TradingView
      try {
        if (state.onRealtimeCallback) {
          state.onRealtimeCallback(nextBar);
        }
      } catch (e) {
        // no-op
      }
    });
  }
}

export default RestDataFeed;
