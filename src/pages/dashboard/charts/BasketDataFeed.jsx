import { getTradingViewDataFeed } from '@/apiServices';

class BasketDataFeed {
  constructor(basketItems, side) {
    this.basketItems = basketItems; // Array of { symbol, weight, notional }
    this.side = side; // 'buy' or 'sell'
    this.subscribers = {};
    this.lastBarsCache = {};
    this.historicalTimeEnd = '';
    this.lastUpdateTime = 0;
    this.lastBasketItemsHash = BasketDataFeed.hashBasketItems(basketItems);
  }

  // Add method to update basket items
  updateBasketItems(newBasketItems) {
    if (this.hasBasketItemsChanged(newBasketItems)) {
      this.basketItems = newBasketItems;
      this.lastBasketItemsHash = BasketDataFeed.hashBasketItems(newBasketItems);
      // Force an update by triggering the subscription
      Object.values(this.subscribers).forEach((subscriber) => {
        subscriber();
      });
    }
  }

  // Helper to create a hash of basket items for comparison
  static hashBasketItems(items) {
    if (!items) return '';
    // Only include items that are completely filled out
    return items
      .filter((item) => BasketDataFeed.isCompleteBasketItem(item))
      .map((item) => `${item.symbol}:${item.notional}`)
      .sort()
      .join('|');
  }

  // Check if a basket item is completely filled out
  static isCompleteBasketItem(item) {
    return (
      item &&
      item.symbol &&
      item.notional &&
      item.symbol.includes(':') && // Must have exchange
      !Number.isNaN(Number(item.notional)) && // Must be a valid number
      Number(item.notional) > 0 // Must be greater than 0
    );
  }

  // Check if basket items have changed
  hasBasketItemsChanged(newItems) {
    if (!newItems) return false;

    // Get complete items from both old and new sets
    const oldCompleteItems = this.basketItems?.filter((item) => BasketDataFeed.isCompleteBasketItem(item)) || [];
    const newCompleteItems = newItems.filter((item) => BasketDataFeed.isCompleteBasketItem(item));

    // Check if number of complete items changed (addition/removal)
    if (oldCompleteItems.length !== newCompleteItems.length) {
      return true;
    }

    // Check if any complete items changed
    const oldHash = BasketDataFeed.hashBasketItems(oldCompleteItems);
    const newHash = BasketDataFeed.hashBasketItems(newCompleteItems);
    return oldHash !== newHash;
  }

  // eslint-disable-next-line class-methods-use-this
  onReady(callback) {
    setTimeout(() => {
      callback({
        supports_search: true,
        supports_group_request: false,
        supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D'],
        supports_marks: false,
        supports_timescale_marks: false,
        supports_time: true,
      });
    }, 1000);
  }

  async resolveSymbol(symbolName, onSymbolResolvedCallback, onErrorCallback) {
    if (!symbolName) {
      onErrorCallback('Error: Symbol name is missing.');
      return;
    }

    // For basket data, we'll use a special format with side indicator
    const symbol = {
      name: `BASKET_${this.side.toUpperCase()}`,
      ticker: `BASKET_${this.side.toUpperCase()}`,
      description: `${this.side.charAt(0).toUpperCase() + this.side.slice(1)} Basket Performance`,
      type: 'crypto',
      session: '24x7',
      exchange: 'Custom',
      minmov: 1,
      timezone: 'Etc/UTC',
      pricescale: 10000,
      has_intraday: true,
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D'],
      volume_precision: 2,
      data_status: 'streaming',
    };

    setTimeout(() => onSymbolResolvedCallback(symbol), 0);
  }

  async getBars(symbolInfo, resolution, from, onHistoryCallback, onErrorCallback) {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      // Ensure we don't request future data
      const to = Math.min(currentTime, from.to || currentTime);

      // Fetch data for all basket items
      const basketData = await Promise.all(
        this.basketItems.map(async (item) => {
          try {
            const apiBaseUrl = getTradingViewDataFeed();
            // Format symbol as EXCHANGE:PAIR
            const formattedSymbol = item.symbol.includes(':') ? item.symbol : `BINANCE:${item.symbol}`;
            const url = `${apiBaseUrl}?symbol=${formattedSymbol}&resolution=${resolution}&to=${to}&from=${from.from}`;
            const response = await fetch(url);
            if (!response.ok) {
              console.error(`Failed to fetch data for ${formattedSymbol}:`, response.status);
              return null;
            }
            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) {
              console.error(`No data received for ${formattedSymbol}`);
              return null;
            }
            return {
              symbol: item.symbol,
              weight: item.weight,
              notional: item.notional,
              data,
            };
          } catch (error) {
            console.error(`Error fetching data for ${item.symbol}:`, error);
            return null;
          }
        })
      );

      // Filter out failed requests
      const validBasketData = basketData.filter((item) => item !== null && item.data.length > 0);

      if (validBasketData.length === 0) {
        console.error('No valid data received for any basket items');
        onHistoryCallback([], { noData: true });
        return;
      }

      // Calculate basket performance
      let basketBars = BasketDataFeed.calculateBasketPerformance(validBasketData);

      // Invert the values if this is a sell basket
      if (this.side === 'sell') {
        basketBars = basketBars.map((bar) => BasketDataFeed.invertBarValues(bar));
      }

      if (basketBars.length === 0) {
        console.error('No basket bars calculated');
        onHistoryCallback([], { noData: true });
        return;
      }

      onHistoryCallback(basketBars, { noData: false });
    } catch (error) {
      console.error('Error in getBars:', error);
      onErrorCallback('Error loading basket data');
    }
  }

  static calculateBasketPerformance(basketData) {
    if (!basketData.length) return [];

    // Get all unique timestamps from each dataset
    const timestampSets = basketData.map((item) => new Set(item.data.map((bar) => bar.time)));

    // Find intersection of all timestamp sets
    const commonTimestamps = timestampSets.reduce((intersection, set) => {
      if (intersection.size === 0) return new Set(set);
      return new Set([...intersection].filter((time) => set.has(time)));
    }, new Set());

    if (commonTimestamps.size === 0) {
      console.error('No common timestamps found across datasets');
      return [];
    }

    // Create a map of timestamps to bars, only for common timestamps
    const timestampMap = new Map();

    // Process each item's data, but only for common timestamps
    basketData.forEach((item) => {
      if (!Array.isArray(item.data)) return;

      // Filter data to only include common timestamps
      const filteredData = item.data.filter(
        (bar) => bar && typeof bar.time === 'number' && typeof bar.close === 'number' && commonTimestamps.has(bar.time)
      );

      filteredData.forEach((bar) => {
        if (!timestampMap.has(bar.time)) {
          timestampMap.set(bar.time, {
            time: bar.time,
            open: 0,
            high: 0,
            low: 0,
            close: 0,
            volume: 0,
          });
        }

        const basketBar = timestampMap.get(bar.time);
        const qty = Number(item.notional);
        const price = bar.close;

        // Calculate total value (qty * price)
        const value = qty * price;

        // Add to the basket bar
        basketBar.open += value;
        basketBar.high += value;
        basketBar.low += value;
        basketBar.close += value;
        basketBar.volume += (bar.volume || 0) * qty;
      });
    });

    // Convert the map to an array and sort by time
    return Array.from(timestampMap.values())
      .map((bar) => {
        // Format values exactly as TradingView expects
        const normalizedBar = {
          time: bar.time,
          open: parseFloat(bar.open.toFixed(2)),
          high: parseFloat(bar.high.toFixed(2)),
          low: parseFloat(bar.low.toFixed(2)),
          close: parseFloat(bar.close.toFixed(2)),
          volume: parseFloat(bar.volume.toFixed(2)),
        };

        // Validate the bar data
        if (
          !Number.isFinite(normalizedBar.time) ||
          !Number.isFinite(normalizedBar.open) ||
          !Number.isFinite(normalizedBar.high) ||
          !Number.isFinite(normalizedBar.low) ||
          !Number.isFinite(normalizedBar.close) ||
          !Number.isFinite(normalizedBar.volume)
        ) {
          console.error('Invalid bar data:', normalizedBar);
          return null;
        }

        return normalizedBar;
      })
      .filter((bar) => bar !== null)
      .sort((a, b) => a.time - b.time);
  }

  // Add a new method to invert the values
  static invertBarValues(bar) {
    return {
      ...bar,
      open: -bar.open,
      high: -bar.high,
      low: -bar.low,
      close: -bar.close,
      volume: bar.volume, // Keep volume positive
    };
  }

  subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
    if (this.subscribers[subscriberUID]) {
      return;
    }

    // Increase interval to 15 seconds
    this.subscribers[subscriberUID] = setInterval(async () => {
      try {
        const currentTime = Math.floor(Date.now() / 1000);

        // Check if basket items have changed
        if (!this.hasBasketItemsChanged(this.basketItems)) {
          return;
        }

        // Update the hash after checking
        this.lastBasketItemsHash = BasketDataFeed.hashBasketItems(this.basketItems);

        const barSize = BasketDataFeed.getResolutionInSeconds(resolution);
        const currentBarStart = Math.floor(currentTime / barSize) * barSize;

        // Fetch latest data for all basket items
        const basketData = await Promise.all(
          this.basketItems.map(async (item) => {
            try {
              const apiBaseUrl = getTradingViewDataFeed();
              // Format symbol as EXCHANGE:PAIR
              const formattedSymbol = item.symbol.includes(':') ? item.symbol : `BINANCE:${item.symbol}`;
              const url = `${apiBaseUrl}?symbol=${formattedSymbol}&resolution=${resolution}&from=${currentBarStart}&to=${currentTime}`;
              const response = await fetch(url);
              if (!response.ok) {
                console.error(`Failed to fetch data for ${formattedSymbol}:`, response.status);
                return null;
              }
              const data = await response.json();
              if (!Array.isArray(data) || data.length === 0) {
                console.error(`No data received for ${formattedSymbol}`);
                return null;
              }
              return {
                symbol: item.symbol,
                weight: item.weight,
                notional: item.notional,
                data,
              };
            } catch (error) {
              console.error(`Error fetching data for ${item.symbol}:`, error);
              return null;
            }
          })
        );

        // Filter out failed requests
        const validBasketData = basketData.filter((item) => item !== null && item.data.length > 0);

        if (validBasketData.length === 0) {
          console.error('No valid data received for any basket items');
          return;
        }

        // Calculate and send the latest basket bar
        let basketBars = BasketDataFeed.calculateBasketPerformance(validBasketData);

        // Invert the values if this is a sell basket
        if (this.side === 'sell') {
          basketBars = basketBars.map((bar) => BasketDataFeed.invertBarValues(bar));
        }

        if (basketBars.length > 0) {
          const latestBar = basketBars[basketBars.length - 1];
          // Validate the latest bar before sending
          if (
            Number.isFinite(latestBar.time) &&
            Number.isFinite(latestBar.open) &&
            Number.isFinite(latestBar.high) &&
            Number.isFinite(latestBar.low) &&
            Number.isFinite(latestBar.close) &&
            Number.isFinite(latestBar.volume)
          ) {
            // Format the latest bar exactly as TradingView expects
            onRealtimeCallback({
              time: latestBar.time,
              open: parseFloat(latestBar.open.toFixed(2)),
              high: parseFloat(latestBar.high.toFixed(2)),
              low: parseFloat(latestBar.low.toFixed(2)),
              close: parseFloat(latestBar.close.toFixed(2)),
              volume: parseFloat(latestBar.volume.toFixed(2)),
            });
          } else {
            console.error('Invalid latest bar data:', latestBar);
          }
        }
      } catch (error) {
        console.error('Error in basket subscription:', error);
      }
    }, 15000); // Increased to 15 seconds
  }

  unsubscribeBars(subscriberUID) {
    if (this.subscribers[subscriberUID]) {
      clearInterval(this.subscribers[subscriberUID]);
      delete this.subscribers[subscriberUID];
    }
  }

  static getResolutionInSeconds(resolution) {
    const resMap = {
      1: 60,
      5: 300,
      15: 900,
      30: 1800,
      60: 3600,
      240: 14400,
      '1D': 86400,
    };
    return resMap[resolution] || 60;
  }
}

export default BasketDataFeed;
