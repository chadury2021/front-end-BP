import moment from 'moment';
import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { useExchangeTicker } from '@/shared/context/ExchangeTickerProvider';
import { useOkxDexMarketData } from '@/shared/context/OkxDexMarketDataProvider';
import { isDexToken } from '@/shared/dexUtils';
import {
  sendKeepAlive,
  subscribeToOrderBook,
  subscribeToPairPrice,
  unsubscribeToOrderBook,
  unsubscribeToPairPrice,
} from '../websocketActions';

const PriceDataContext = createContext();

export function PriceDataProvider({ children, pair, exchangeName }) {
  const [orderBookData, setOrderBookData] = useState({});
  const [cexLivePairPrice, setCexLivePairPrice] = useState('');
  const [isL2DataLoading, setIsL2DataLoading] = useState(false);
  const [noL2Data, setNoL2Data] = useState(false);

  const priceLastUpdatedAtRef = useRef(moment.utc());
  const livePairPriceResubscribeTriesRef = useRef(0);
  const orderbookLastUpdatedAtRef = useRef(moment.utc());
  const orderbookResubscribeTriesRef = useRef(0);
  const socketRef = useRef();

  const { relevantExchangePairs } = useOrderForm();
  const ep = relevantExchangePairs.find((p) => p.exchange === exchangeName && p.pair === pair);

  const contractValue = ep?.contract_value || 1;
  const isInverse = ep?.is_inverse;

  const { marketData } = useOkxDexMarketData();
  const { tickerData } = useExchangeTicker();

  const isOrderbookRelevant = exchangeName !== 'OKXDEX' && !isDexToken(pair);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws/prices/`);

    if (socketRef.current && isOrderbookRelevant) {
      subscribeToOrderBook(socket, [exchangeName], pair);
    }
    socketRef.current = socket;

    socket.onopen = () => {
      setIsL2DataLoading(true);
      setOrderBookData({});
      orderbookResubscribeTriesRef.current = 0;

      if (isOrderbookRelevant) {
        subscribeToOrderBook(socket, [exchangeName], pair);
      }

      setCexLivePairPrice('');
      livePairPriceResubscribeTriesRef.current = 0;
      subscribeToPairPrice(socket, exchangeName, pair);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'order_book_update') {
        orderbookLastUpdatedAtRef.current = moment.utc();
        setOrderBookData({ ...orderBookData, [data.exchange]: data.book });
        orderbookResubscribeTriesRef.current = 0;
      } else if (data.type === 'price_update') {
        priceLastUpdatedAtRef.current = moment.utc();
        setCexLivePairPrice(data.price);
        livePairPriceResubscribeTriesRef.current = 0;
      }
      setIsL2DataLoading(false);
      setNoL2Data(false);
    };

    const keepAliveIntervalId = setInterval(() => {
      sendKeepAlive(socket);

      const priceLastUpdated = priceLastUpdatedAtRef.current;

      if (
        socket.readyState === WebSocket.OPEN &&
        priceLastUpdated.isBefore(moment.utc().subtract(6, 'seconds')) &&
        livePairPriceResubscribeTriesRef.current < 3
      ) {
        subscribeToPairPrice(socket, exchangeName, pair);
        livePairPriceResubscribeTriesRef.current += 1;
      }

      const orderBookLastUpdated = orderbookLastUpdatedAtRef.current;
      if (
        socket.readyState === WebSocket.OPEN &&
        orderBookLastUpdated.isBefore(moment.utc().subtract(6, 'seconds')) &&
        orderbookResubscribeTriesRef.current < 3
      ) {
        if (isOrderbookRelevant) {
          subscribeToOrderBook(socket, [exchangeName], pair);
          orderbookResubscribeTriesRef.current += 1;
        }
      } else if (orderbookResubscribeTriesRef.current >= 3) {
        setNoL2Data(true);
        setIsL2DataLoading(false);
      }
    }, 1000);

    return () => {
      if (socketRef.current) {
        if (isOrderbookRelevant) {
          unsubscribeToOrderBook(socket, [exchangeName], pair);
        }
        unsubscribeToPairPrice(socket, exchangeName, pair);
        setOrderBookData({});
        setCexLivePairPrice('');
        setIsL2DataLoading(true);
      }

      clearInterval(keepAliveIntervalId);
    };
  }, [exchangeName, pair]);

  const livePairPrice = useMemo(() => {
    if (exchangeName !== 'OKXDEX') {
      return cexLivePairPrice;
    }

    // dex logic is market data (live) or ticker data (not live)
    if (marketData?.price) {
      return marketData.price;
    }

    const ticker = tickerData[pair];
    return ticker?.lastPrice;
  }, [cexLivePairPrice, tickerData, exchangeName, pair, marketData]);

  const livePriceChange = useMemo(() => {
    if (exchangeName !== 'OKXDEX') {
      return null;
    }

    if (marketData?.change) {
      return marketData.change;
    }

    const ticker = tickerData[pair];
    return parseFloat(ticker?.pricePctChange24h);
  }, [marketData, tickerData, exchangeName, pair]);

  const memoizedPriceData = useMemo(
    () => ({
      orderBookData,
      livePairPrice,
      livePriceChange,
      isL2DataLoading,
      noL2Data,
      contractValue,
      isInverse,
    }),
    [orderBookData, livePairPrice, isL2DataLoading, noL2Data, contractValue, isInverse, livePriceChange]
  );

  return <PriceDataContext.Provider value={memoizedPriceData}>{children}</PriceDataContext.Provider>;
}

export const usePriceDataContext = () => useContext(PriceDataContext);
