import { useState, useEffect, useContext, useMemo } from 'react';
import { getTokenTradingInfo, getDexTradingHistoryInfo } from '@/apiServices';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { useOkxDexMarketData } from '@/shared/context/OkxDexMarketDataProvider';
import { useDexTokenManager } from '@/shared/context/DexTokenManagerProvider';

const rangeToOkxDexKey = {
  m5: '5M',
  h1: '1H',
  h4: '4H',
  h24: '',
};

export const useDexTokenInfo = (tokenId, timeRange = 'm5') => {
  const [apiMarketInfo, setApiMarketInfo] = useState(null);
  const [socials, setSocials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [apiTradingHistoryInfo, setApiTradingHistoryInfo] = useState({});

  const { marketData, tradeRealTimeData } = useOkxDexMarketData();
  const { loadToken } = useDexTokenManager();
  const { showAlert } = useContext(ErrorContext);

  const parseSocials = (socialsData) => {
    if (!socialsData) return null;
    return {
      website: socialsData.officialWebsite,
      twitter: socialsData.twitter,
      telegram: socialsData.telegram,
      discord: socialsData.discord,
    };
  };

  const parseMarketInfo = (marketInfoData) => {
    if (!marketInfoData) return null;
    return {
      circulatingSupply: marketInfoData.circSupply,
      marketCap: marketInfoData.marketCap,
      liquidity: marketInfoData.liquidity,
      priceChange: marketInfoData.priceChange24H,
      priceChange4H: marketInfoData.priceChange4H,
      priceChange1H: marketInfoData.priceChange1H,
      priceChange5M: marketInfoData.priceChange5M,
    };
  };

  // Combine live data with API data, prioritizing live data when available
  const marketInfo = useMemo(() => {
    if (!apiMarketInfo) return null;

    const liveData = marketData || {};

    const price = marketData?.price;
    const maxSupply = marketData?.maxSupply;
    const fdv =
      price && maxSupply ? parseFloat(marketData?.price) * parseFloat(marketData?.maxSupply) : apiMarketInfo.fdv;

    return {
      // Use live data when available, fallback to API data
      circulatingSupply: liveData.circulatingSupply ?? apiMarketInfo.circulatingSupply,
      fdv,
      marketCap: liveData.marketCap ?? apiMarketInfo.marketCap,
      maxSupply: liveData.maxSupply ?? apiMarketInfo.maxSupply,
      liquidity: liveData.liquidity ?? apiMarketInfo.liquidity,
      tokenCreateTime: apiMarketInfo.tokenCreateTime,

      // Price changes from live trade data when available
      priceChange: liveData.change ?? apiMarketInfo.priceChange,
      priceChange4H: liveData.change4H ?? apiMarketInfo.priceChange4H,
      priceChange1H: liveData.change1H ?? apiMarketInfo.priceChange1H,
      priceChange5M: liveData.change5M ?? apiMarketInfo.priceChange5M,
    };
  }, [apiMarketInfo, marketData, tradeRealTimeData]);

  const tradingHistoryInfo = useMemo(() => {
    const apiData = apiTradingHistoryInfo[timeRange];
    const rangeKey = rangeToOkxDexKey[timeRange];
    const liveData = tradeRealTimeData || {};

    return {
      txs: liveData[`txs${rangeKey}`] ?? apiData?.totalNo,
      txsBuy: liveData[`txsBuy${rangeKey}`] ?? apiData?.buyNo,
      txsSell: liveData[`txsSell${rangeKey}`] ?? apiData?.sellNo,
      volume: liveData[`volume${rangeKey}`] ?? apiData?.totalAmountUsd,
      volumeBuy: liveData[`volumeBuy${rangeKey}`] ?? apiData?.buyAmountUsd,
      volumeSell: liveData[`volumeSell${rangeKey}`] ?? apiData?.sellAmountUsd,
      uniqueTraders: liveData[`uniqueTraders${rangeKey}`] ?? apiData?.totalTraders,
      uniqueTradersBuy: liveData[`uniqueTradersBuy${rangeKey}`] ?? apiData?.buyTraders,
      uniqueTradersSell: liveData[`uniqueTradersSell${rangeKey}`] ?? apiData?.sellTraders,
    };
  }, [apiTradingHistoryInfo, timeRange, tradeRealTimeData]);

  useEffect(() => {
    const fetchTokenInfo = async () => {
      setLoading(true);
      try {
        const result = await loadToken(tokenId);
        setApiMarketInfo(parseMarketInfo(result.price_info));
      } catch (error) {
        showAlert({ severity: 'error', message: error.message });
      } finally {
        setLoading(false);
      }
    };
    fetchTokenInfo();
  }, [tokenId]);

  useEffect(() => {
    setApiTradingHistoryInfo({});

    const fetchTradingHistoryInfo = async () => {
      setHistoryLoading(true);
      try {
        const result = await getDexTradingHistoryInfo(tokenId, timeRange);
        const { trading_history_info } = result;
        setApiTradingHistoryInfo({ ...apiTradingHistoryInfo, [timeRange]: trading_history_info });
      } catch (error) {
        showAlert({ severity: 'error', message: error.message });
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchTradingHistoryInfo();
  }, [tokenId, timeRange]);

  return { marketInfo, tradingHistoryInfo, socials, loading, historyLoading };
};
