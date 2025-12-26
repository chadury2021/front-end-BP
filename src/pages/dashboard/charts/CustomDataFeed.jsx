/* eslint-disable class-methods-use-this */
const { getTradingViewDataFeed } = require('@/apiServices');

class CustomDatafeed {
  constructor(livePairPrice = null) {
    this.subscribers = {};
    this.lastBarsCache = {};
    this.historicalTimeEnd = '';
    this.livePairPrice = livePairPrice;
    this.currentSubscriberUID = null;
    this.onRealtimeCallback = null;
    this.currentBar = null; // Track the current bar for live price updates
    this.currentResolution = null;
  }

      // Method to update the live price - this should only modify the current bar's close price
  updateLivePrice(price) {
    this.livePairPrice = price;

    // Only send live price update if we have an active subscription, live price, and current bar
    if (this.onRealtimeCallback && this.livePairPrice && this.livePairPrice !== '' && this.currentBar) {
      const livePrice = parseFloat(this.livePairPrice);

      if (livePrice > 0) {
        // Ensure we have valid high/low values to compare against
        const currentHigh = this.currentBar.high || livePrice;
        const currentLow = this.currentBar.low || livePrice;

        // Update only the close price of the current bar, keeping other values intact
        const updatedBar = {
          time: this.currentBar.time,
          open: this.currentBar.open,
          high: Math.max(currentHigh, livePrice),
          low: Math.min(currentLow, livePrice),
          close: livePrice,
          volume: this.currentBar.volume || 0,
        };

        // Update our current bar reference
        this.currentBar = updatedBar;

        // Send the updated bar to TradingView
        // TradingView sometimes needs the bar to be sent multiple times or with specific formatting
        // to properly update the visual representation
        this.onRealtimeCallback(updatedBar);

        // Force a second update after a small delay to ensure TradingView redraws
        setTimeout(() => {
          if (this.onRealtimeCallback && this.currentBar) {
            this.onRealtimeCallback(updatedBar);
          }
        }, 100);

        // Send a third update after another delay to ensure the bar is properly drawn
        setTimeout(() => {
          if (this.onRealtimeCallback && this.currentBar) {
            this.onRealtimeCallback(updatedBar);
          }
        }, 500);
      }
    }
  }

  // Helper method to calculate dynamic price scale based on price value
  calculatePriceScale(price) {
    if (!price || price <= 0) {
      return 100000000; // Default fallback to 8 decimals
    }

    // Ensure price is a number
    const numericPrice = parseFloat(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return 100000000; // Default fallback to 8 decimals
    }

    // Convert to string in fixed-point notation to avoid scientific notation
    let priceStr = numericPrice.toString();
    if (numericPrice < 1) {
      priceStr = numericPrice.toFixed(12); // up to 12 decimals
    }

    // Find the number of decimals (including leading zeros after decimal)
    const match = priceStr.match(/^0\.(0*)([1-9]\d*)?/);
    if (match) {
      // Number of zeros after decimal + number of digits in the non-zero part
      const leadingZeros = match[1] ? match[1].length : 0;
      const nonZeroPart = match[2] ? match[2].length : 0;
      const decimals = leadingZeros + nonZeroPart;
      // Always use at least 8 decimals for prices < 1
      return 10**Math.max(decimals, 8);
    }

    // For prices >= 1, count decimals after the dot
    if (priceStr.includes('.')) {
      const decimals = priceStr.split('.')[1].length;
      return 10**Math.max(decimals, 2);
    }

    // Default for integer prices
    return 100;
  }

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

    // Calculate dynamic price scale based on live price or default
    const priceScale = this.calculatePriceScale(this.livePairPrice);

    const symbol = {
      name: symbolName,
      ticker: symbolName,
      description: `${symbolName} Price`,
      type: 'crypto',
      session: '24x7',
      exchange: 'Custom',
      minmov: 1,
      timezone: 'Etc/UTC',
      pricescale: priceScale,
      has_intraday: true,
      supported_resolutions: ['1', '5', '15', '30', '60', '240', '1D'],
      volume_precision: 2,
      data_status: 'streaming',
    };

    // resolveSymbol needs to called asynchronously
    setTimeout(() => onSymbolResolvedCallback(symbol), 0);
  }

  // getBars get historical data based on resolution from time start, and will return data to current time
  getBars(symbolInfo, resolution, from, onHistoryCallback, onErrorCallback) {
    const currentTime = Math.floor(Date.now() / 1000);
    this.historicalTimeEnd = currentTime;

    const barSize = this.getResolutionInSeconds(resolution);

    // Calculate the nearest aligned time to resolution
    const currentBarTime = Math.floor(currentTime / barSize) * barSize;
    const apiBaseUrl = getTradingViewDataFeed();
    const url = `${apiBaseUrl}?symbol=${symbolInfo.name}&resolution=${resolution}&to=${currentBarTime}&from=${from.from}`;

    if (!symbolInfo || !symbolInfo.name) {
      onErrorCallback('Invalid symbol data');
      return;
    }

    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        let bars = [];
        if (data.length && data.length > 0) {
          bars = data.map((bar) => ({
            time: bar.time,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            volume: bar.volume,
          }));

          // Always set the current bar to the latest bar from historical data
          if (bars.length > 0) {
            const lastBar = bars[bars.length - 1];
            this.currentBar = { ...lastBar }; // Create a copy to avoid reference issues



            // If we have live price, update the current bar with it
            if (this.livePairPrice && this.livePairPrice !== '') {
              const livePrice = parseFloat(this.livePairPrice);
              if (livePrice > 0) {
                if (lastBar.time < currentBarTime) {
                  // Create a new bar for the current interval
                  const newBar = {
                    time: currentBarTime,
                    open: livePrice,
                    high: livePrice,
                    low: livePrice,
                    close: livePrice,
                    volume: 0,
                  };
                  bars.push(newBar);
                  this.currentBar = newBar; // Store reference to current bar


                } else if (lastBar.time === currentBarTime) {
                  // Update the last bar with live price
                  this.currentBar.close = livePrice;
                  this.currentBar.high = Math.max(this.currentBar.high, livePrice);
                  this.currentBar.low = Math.min(this.currentBar.low, livePrice);


                }
              }
            }
          }

          onHistoryCallback(bars, { noData: false });
        } else {
          onHistoryCallback([], { noData: true });
        }
      })
      .catch((error) => {
        onErrorCallback('Error loading data');
      });
  }

  subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
    if (this.subscribers[subscriberUID]) {
      return;
    }

    // Store the callback and resolution for live price updates
    this.onRealtimeCallback = onRealtimeCallback;
    this.currentSubscriberUID = subscriberUID;
    this.currentResolution = resolution;



    this.subscribers[subscriberUID] = setInterval(async () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const barSize = this.getResolutionInSeconds(resolution);

      // Calculate the nearest aligned time to resolution
      const currentBarStart = Math.floor(currentTime / barSize) * barSize;

      // Ensure we don't request data for the current incomplete bar
      const from = Math.max(this.historicalTimeEnd, currentBarStart - barSize);
      const to = currentBarStart;

      // edge case when from and to are equal and returns an incorrect array of data
      if (from >= to) {
        // Don't create new bars here - let live price updates handle the current bar
        return;
      }

      const apiBaseUrl = getTradingViewDataFeed();

      const response = await fetch(
        `${apiBaseUrl}?symbol=${symbolInfo.name}&resolution=${resolution}&from=${from}&to=${to}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const aggregatedBar = this.aggregateBars(data);

        // Create a new bar from polling data
        const newBar = {
          time: aggregatedBar.time,
          open: aggregatedBar.open,
          high: aggregatedBar.high,
          low: aggregatedBar.low,
          close: aggregatedBar.close,
          volume: aggregatedBar.volume,
        };

        // Validate that the new bar time is not earlier than the current bar
        if (this.currentBar && newBar.time <= this.currentBar.time) {
          console.warn(`Skipping bar with time violation: new=${newBar.time}, current=${this.currentBar.time}`);
          return;
        }

        // Only update current bar if this is actually a new time period
        // or if we don't have a current bar
        if (!this.currentBar || this.currentBar.time !== newBar.time) {
          this.currentBar = newBar;

          // Send the new bar to TradingView
          onRealtimeCallback(newBar);
        } else {
          // If it's the same time period, merge the data instead of replacing
          // For volume, we should use the new volume to avoid accumulation
          const mergedBar = {
            time: this.currentBar.time,
            open: this.currentBar.open,
            high: Math.max(this.currentBar.high, newBar.high),
            low: Math.min(this.currentBar.low, newBar.low),
            close: newBar.close, // Use the new close price
            volume: newBar.volume, // Use new volume instead of adding to avoid accumulation
          };

          this.currentBar = mergedBar;

          // Send the merged bar to TradingView
          onRealtimeCallback(mergedBar);
        }
      }
      // If no new data, don't create any bars - let live price updates handle the current bar
    }, 5000);
  }

  unsubscribeBars(subscriberUID) {
    if (this.subscribers[subscriberUID]) {
      clearInterval(this.subscribers[subscriberUID]);
      delete this.subscribers[subscriberUID];
    }

    // Clear the stored callback and current bar
    if (this.currentSubscriberUID === subscriberUID) {
      this.onRealtimeCallback = null;
      this.currentSubscriberUID = null;
      this.currentBar = null;
      this.currentResolution = null;
    }
  }

  getResolutionInSeconds(resolution) {
    const resMap = {
      1: 60, // 1 minute
      5: 300, // 5 minutes
      15: 900, // 15 minutes
      30: 1800, // 30 minutes
      60: 3600, // 1 hour
      240: 14400, // 4 hours
      '1D': 86400, // 1 day
    };
    return resMap[resolution] || 60; // Default to 1 min if unknown resolution
  }

  // use interval stat within getIntevalBars to get aggregated bars for the given interval
  aggregateBars(bars) {
    if (!bars || bars.length === 0) return null;

    // Sort bars by time to ensure chronological order
    const sortedBars = bars.sort((a, b) => a.time - b.time);

    // Use the earliest time as the bar time to ensure proper ordering
    const barTime = sortedBars[0].time;

    return sortedBars.reduce(
      (agg, bar, index) => ({
        time: barTime,
        open: sortedBars[0].open,
        high: Math.max(agg.high, bar.high),
        low: Math.min(agg.low, bar.low),
        close: bar.close,
        volume: agg.volume + bar.volume,
      }),
      {
        high: -Infinity,
        low: Infinity,
        volume: 0,
      }
    );
  }
}

export default CustomDatafeed;
