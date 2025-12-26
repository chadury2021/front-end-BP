/* eslint-disable no-console */

/**
{
  "timestamp": 1741731610450,
  "state": "open",
  "stats": {
      "high": null,
      "low": null,
      "price_change": null,
      "volume": 0,
      "volume_usd": 0
  },
  "greeks": {
      "delta": 1,
      "gamma": 0,
      "vega": 0.0002,
      "theta": -0.01591,
      "rho": 0.71727
  },
  "index_price": 83149.94,
  "instrument_name": "BTC-12MAR25-65000-C",
  "last_price": null,
  "settlement_price": 0.19159773,
  "min_price": 0.19,
  "max_price": 0.245,
  "open_interest": 0,
  "mark_price": 0.2182,
  "interest_rate": 0,
  "best_ask_price": 0.2455,
  "best_bid_price": 0.1905,
  "mark_iv": 159.47,
  "bid_iv": 0,
  "ask_iv": 863.38,
  "underlying_price": 83140.6237,
  "underlying_index": "SYN.BTC-12MAR25",
  "estimated_delivery_price": 83149.94,
  "best_ask_amount": 6.9,
  "best_bid_amount": 6.9
}
*/
export const getDeribitOptionTickersWS = (instrument_names, onTickerData, onStatusChange, isTestnet = false) => {
  let ws = null;
  let reconnectAttempts = 0;
  let reconnectTimeout = null;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY_MS = 2000; // Start with 2 seconds

  const connect = () => {
    const wsUrl = isTestnet ? 'wss://test.deribit.com/ws/api/v2' : 'wss://www.deribit.com/ws/api/v2';

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      onStatusChange?.('connected');
      reconnectAttempts = 0; // Reset reconnect attempts on successful connection

      // Subscribe to all tickers at once
      const channels = instrument_names.map((name) => `ticker.${name}.100ms`);
      ws.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'public/subscribe',
          params: {
            channels,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.params && data.params.data) {
          const tickerData = data.params.data;
          const { instrument_name } = tickerData;
          onTickerData(instrument_name, tickerData);
        } else if (data.error) {
          console.error('WebSocket error message:', data.error);
          onStatusChange?.('error', data.error);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        onStatusChange?.('error', 'Failed to parse message');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onStatusChange?.('error', error);
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      onStatusChange?.('disconnected');

      // Attempt to reconnect unless max attempts reached or connection was closed intentionally
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && !event.wasClean) {
        const delay = RECONNECT_DELAY_MS * 2 ** reconnectAttempts;
        console.log(`Attempting to reconnect in ${delay}ms...`);
        onStatusChange?.('reconnecting');
        reconnectTimeout = setTimeout(() => {
          reconnectAttempts += 1;
          connect();
        }, delay);
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('Max reconnection attempts reached');
        onStatusChange?.('failed');
      }
    };
  };

  // Initial connection
  connect();

  // Return cleanup function
  return () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      const channels = instrument_names.map((name) => `ticker.${name}.100ms`);
      ws.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'public/unsubscribe',
          params: {
            channels,
          },
        })
      );
      ws.close(1000, 'Subscription ended by user'); // 1000 is normal closure
    }
  };
};
