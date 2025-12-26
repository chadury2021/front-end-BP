import { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getTokenInfo, buildTokenId } from '@/shared/dexUtils';

const OkxDexMarketDataContext = createContext();

const MARKET_DATA_CHANNEL = 'dex-market-v3';
const TRADE_REAL_TIME_CHANNEL = 'dex-market-tradeRealTime';
const CANDLE_CHANNEL = 'dex-token-candle';
const PING_INTERVAL = 20000; // Send ping at 20 seconds of inactivity

const RESOLUTION_MAP = {
  1: '1m',
  5: '5m',
  15: '15m',
  30: '30m',
  60: '1H',
  120: '4H',
  240: '1D',
  '1D': '1Dutc',
};

const RESOLUTION_MAP_REVERSE = Object.entries(RESOLUTION_MAP).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {});

export function OkxDexMarketDataProvider({ children, pair }) {
  const [marketData, setMarketData] = useState({});
  const [tradeRealTimeData, setTradeRealTimeData] = useState({});
  const [subscribedToken, setSubscribedToken] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [candleSubscriptions, setCandleSubscriptions] = useState({});
  const socketRef = useRef(null);

  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    let interval = null;
    if (isConnected && socketRef.current) {
      const sendPing = () => {
        socketRef.current.send('ping');
      };

      interval = setInterval(sendPing, PING_INTERVAL);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isConnected, socketRef.current, lastActivity]);

  const unsubscribeToken = useCallback(
    (tokenId) => {
      if (!isConnected || !socketRef.current) {
        return;
      }

      const { chainId, tokenAddress } = getTokenInfo(tokenId);

      // not a dex token
      if (!chainId || !tokenAddress) {
        return;
      }

      socketRef.current.send(
        JSON.stringify({
          op: 'unsubscribe',
          args: [
            {
              channel: MARKET_DATA_CHANNEL,
              chainId,
              tokenAddress,
            },
            {
              channel: TRADE_REAL_TIME_CHANNEL,
              chainId,
              tokenAddress,
            },
          ],
        })
      );
    },
    [isConnected, socketRef.current]
  );

  const subscribeToken = useCallback(
    (tokenId) => {
      if (!isConnected || !socketRef.current) {
        return;
      }

      const { chainId, tokenAddress } = getTokenInfo(tokenId);

      // not a dex token
      if (!chainId || !tokenAddress) {
        return;
      }

      socketRef.current.send(
        JSON.stringify({
          op: 'subscribe',
          args: [
            {
              channel: MARKET_DATA_CHANNEL,
              chainId,
              tokenAddress,
            },
            {
              channel: TRADE_REAL_TIME_CHANNEL,
              chainId,
              tokenAddress,
            },
          ],
        })
      );
    },
    [isConnected, socketRef.current]
  );

  const handleMessage = (e) => {
    updateActivity();
    if (e.data === 'pong') {
      return;
    }

    const message = JSON.parse(e.data);
    const { arg, data, event } = message;

    if (!arg) {
      return;
    }

    const { channel, chainId, tokenAddress } = arg;
    if (channel !== MARKET_DATA_CHANNEL && channel !== TRADE_REAL_TIME_CHANNEL && !channel.startsWith(CANDLE_CHANNEL)) {
      // only handle market data channel and candle channel
      return;
    }

    const tokenId = buildTokenId(tokenAddress, chainId);
    if (event === 'subscribe') {
      if (!channel.startsWith(CANDLE_CHANNEL)) {
        setSubscribedToken(tokenId);
      }
    }

    if (event === 'unsubscribe') {
      if (channel === MARKET_DATA_CHANNEL) {
        setMarketData({ ...marketData, [tokenId]: null });
      } else if (channel === TRADE_REAL_TIME_CHANNEL) {
        setTradeRealTimeData({ ...tradeRealTimeData, [tokenId]: null });
      } else if (channel.startsWith(CANDLE_CHANNEL)) {
        const [_, resolution] = channel.split(CANDLE_CHANNEL);
        setCandleSubscriptions({
          ...candleSubscriptions,
          [`${tokenId}-${RESOLUTION_MAP_REVERSE[resolution]}`]: null,
        });
      }
    }

    if (data && data.length > 0) {
      if (channel === MARKET_DATA_CHANNEL) {
        setMarketData({ ...marketData, [tokenId]: data[0] });
      } else if (channel === TRADE_REAL_TIME_CHANNEL) {
        setTradeRealTimeData({ ...tradeRealTimeData, [tokenId]: data[0] });
      } else if (channel.startsWith(CANDLE_CHANNEL)) {
        const [_, resolution] = channel.split(CANDLE_CHANNEL);
        setCandleSubscriptions({
          ...candleSubscriptions,
          [`${tokenId}-${RESOLUTION_MAP_REVERSE[resolution]}`]: data[0],
        });
      }
    }
  };

  // initialize socket
  useEffect(() => {
    const socket = new WebSocket('wss://wsdexpri.okx.com/ws/v5/ipublic');
    socket.onmessage = handleMessage;
    socket.onopen = () => {
      setIsConnected(true);
    };
    socket.onclose = () => {
      setIsConnected(false);
    };
    socketRef.current = socket;
  }, []);

  // manage subscription
  useEffect(() => {
    if (subscribedToken === pair) {
      return;
    }

    if (subscribedToken) {
      unsubscribeToken(subscribedToken);
    }

    subscribeToken(pair);
  }, [pair, subscribedToken, subscribeToken, unsubscribeToken]);

  const subscribeCandle = useCallback(
    (tokenAddress, chainId, resolution) => {
      if (!isConnected || !socketRef.current) {
        return;
      }

      const okxResolution = RESOLUTION_MAP[resolution];
      socketRef.current.send(
        JSON.stringify({
          op: 'subscribe',
          args: [{ channel: `${CANDLE_CHANNEL}${okxResolution}`, chainId, tokenAddress }],
        })
      );
    },
    [isConnected, socketRef.current]
  );

  const unsubscribeCandle = useCallback(
    (tokenAddress, chainId, resolution) => {
      if (!isConnected || !socketRef.current) {
        return;
      }

      const okxResolution = RESOLUTION_MAP[resolution];

      socketRef.current.send(
        JSON.stringify({
          op: 'unsubscribe',
          args: [{ channel: `${CANDLE_CHANNEL}${okxResolution}`, chainId, tokenAddress }],
        })
      );
    },
    [isConnected, socketRef.current]
  );

  const value = useMemo(
    () => ({
      isConnected,
      marketData: marketData[pair],
      tradeRealTimeData: tradeRealTimeData[pair],
      subscribeCandle,
      unsubscribeCandle,
      candleSubscriptions,
    }),
    [isConnected, marketData, tradeRealTimeData, pair, subscribeCandle, unsubscribeCandle, candleSubscriptions]
  );

  return <OkxDexMarketDataContext.Provider value={value}>{children}</OkxDexMarketDataContext.Provider>;
}

export const useOkxDexMarketData = () => {
  const context = useContext(OkxDexMarketDataContext);

  if (!context) {
    return {
      isConnected: false,
      marketData: {},
      tradeRealTimeData: {},
      subscribeCandle: () => {},
      unsubscribeCandle: () => {},
      candleSubscriptions: {},
    };
  }

  return context;
};
