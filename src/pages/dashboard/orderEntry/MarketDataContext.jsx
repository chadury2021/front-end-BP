import moment from 'moment';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, getPredictionChartData } from '../../../apiServices';

const MarketDataContext = createContext();

export function MarketDataProvider({ children, exchangeName, pair, showAlert }) {
  const [marketSummaryMetrics, setMarketSummaryMetrics] = useState({});
  const [noData, setNoData] = useState(false);
  const [now, setNow] = useState(0);
  const [reloading, setReloading] = useState(true);
  const [selectedPastHours, setSelectedPastHours] = useState(12);
  const [priceChartData, setPriceChartData] = useState(null);
  const [volumeChartData, setVolumeChartData] = useState(null);
  const [futurePriceVolatility, setFuturePriceVolatility] = useState(null);
  const [orderOverlayData, setOrderOverlayData] = useState(null);

  const calculateMarketSummaryMetrics = ({
    intervalStatsData,
    pastDayVolume,
    predictedVolumeData,
    priceVolatility,
    metricsStartTime,
    currentTime,
    evr,
  }) => {
    const past24Stats = intervalStatsData.filter((row) => {
      const timestamp = new Date(row.timestamp).getTime();
      return timestamp >= metricsStartTime && timestamp < currentTime;
    });
    const statsLength = past24Stats.length;
    const statsFirstPrice = past24Stats[0].open;
    const statsLastPrice = past24Stats[statsLength - 1].close;

    const priceDiff = (100 * (statsLastPrice - statsFirstPrice)) / statsFirstPrice;

    let past24Volume = pastDayVolume;

    if (!past24Volume) {
      // fallback to calculating if for some reason backend calculated pastDayVolume is missing

      const past24IntervalStats = intervalStatsData.filter(
        (point) => new Date(point.timestamp).getTime() >= metricsStartTime
      );

      past24Volume = past24IntervalStats.reduce((sum, row) => sum + Number(row.volume), 0);
    }

    const predictedVolume = evr ? predictedVolumeData.reduce((sum, x) => sum + Number(x.pv), 0) * evr : null;

    const result = {
      priceDiff,
      past24Volume,
      evr,
      predictedVolume,
      priceVolatility,
    };

    setMarketSummaryMetrics(result);

    return result;
  };

  const resetMarketData = () => {
    setPriceChartData(null);
    setVolumeChartData(null);
    setFuturePriceVolatility(null);
    setMarketSummaryMetrics({});
    setOrderOverlayData(null);
  };

  const setPredictionChartsNoData = () => {
    setNoData(true);
    setReloading(false);
    resetMarketData();
  };

  useEffect(() => {
    setReloading(true);
    resetMarketData();
    const loadData = async () => {
      const endTime = moment.utc().add(2, 'hours');
      const startTime = moment.utc().subtract(selectedPastHours, 'hours');
      const currentTime = moment.utc();
      const pvEnd = moment.utc().add(60, 'minutes'); // exclusive end boundary for pv, inclusive start for esv
      const metricsStartTime = moment.utc().subtract(24, 'hours');

      setNow(moment.utc().valueOf());

      let data;

      try {
        data = await getPredictionChartData({
          exchangeName,
          pair,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          currentTime: currentTime.toISOString(),
        });
      } catch (e) {
        setPredictionChartsNoData();
        if (e instanceof ApiError) {
          showAlert({
            severity: 'error',
            message: `Failed to fetch prediction chart data: ${e.message}`,
          });
          return false;
        }
        throw e;
      }

      if (data.interval_stats.length === 0) {
        setPredictionChartsNoData();
        return false;
      }

      setNoData(false);
      setReloading(false);

      const firstTimestamp = Math.max(new Date(data.interval_stats[0].timestamp).getTime(), startTime.valueOf());

      let lastPredictionTimestamp = null;

      const hasFPV = Array.isArray(data.future_price_volatility) && data.future_price_volatility.length > 0;
      const hasESV = Array.isArray(data.esv) && data.esv.length > 0;

      if (hasFPV && hasESV) {
        lastPredictionTimestamp = Math.min(
          new Date(data.future_price_volatility.slice(-1)[0].timestamp).getTime(),
          new Date(data.esv.slice(-1)[0].time).getTime()
        );
      } else if (hasFPV) {
        lastPredictionTimestamp = new Date(data.future_price_volatility.slice(-1)[0].timestamp).getTime();
      } else if (hasESV) {
        lastPredictionTimestamp = new Date(data.esv.slice(-1)[0].time).getTime();
      } else {
        return false;
      }

      // discard data points before first timestamp

      const alignedEsv =
        data.esv && data.esv.length > 0 ? data.esv.filter((point) => new Date(point.time).getTime() >= pvEnd) : null;
      const predictedVolumeData = data.pv.filter((x) => new Date(x.time).getTime() < pvEnd);

      const metricsResult = calculateMarketSummaryMetrics({
        intervalStatsData: data.interval_stats,
        pastDayVolume: data.past_day_volume,
        predictedVolumeData,
        priceVolatility: Number(data.price_volatility),
        metricsStartTime,
        currentTime,
        evr: data.evr,
      });

      setMarketSummaryMetrics(metricsResult);

      const alignedIntervalStats = data.interval_stats.filter(
        (point) => new Date(point.timestamp).getTime() >= firstTimestamp
      );
      const formattedPriceData = alignedIntervalStats
        .map((point) => ({
          time: new Date(point.timestamp).getTime(),
          open: parseFloat(point.open),
          high: parseFloat(point.high),
          low: parseFloat(point.low),
          close: parseFloat(point.close),
          point, // Keeps the original point object
        }))
        .filter((x) => x.time >= firstTimestamp && x.time <= lastPredictionTimestamp);

      const formattedVolumeData = alignedIntervalStats.map((point) => ({
        time: new Date(point.timestamp).getTime(),
        value: parseFloat(point.volume),
      }));

      const formattedVolumePredictionData = predictedVolumeData.map((point) => [
        new Date(point.time).getTime(),
        parseFloat(point.pv),
      ]);

      const formattedESVData = alignedEsv
        ? alignedEsv
            .map((point) => [new Date(point.time).getTime(), parseFloat(point.esv) * metricsResult.evr])
            .filter((x) => x[0] <= lastPredictionTimestamp)
        : [];

      if (formattedVolumePredictionData.length > 0 && formattedESVData.length > 0) {
        const lastPVPointValue = formattedVolumePredictionData[formattedVolumePredictionData.length - 1][1];
        const firstESVPointValue = formattedESVData[0][1];
        formattedESVData[0][1] = (lastPVPointValue + firstESVPointValue) / 2;
      }

      const formattedPriceVolatility = data.future_price_volatility
        .map((point) => [new Date(point.timestamp).getTime(), parseFloat(point.low), parseFloat(point.high)])
        .filter((x) => x[0] <= lastPredictionTimestamp);

      const forecastedVolume = [...formattedVolumePredictionData, ...formattedESVData];

      setVolumeChartData({
        volume: formattedVolumeData,
        forecasted_volume: forecastedVolume,
      });
      setPriceChartData(formattedPriceData);
      setFuturePriceVolatility(formattedPriceVolatility);
      setOrderOverlayData(data.order_overlay_data);

      return true;
    };

    const success = loadData();

    if (success) {
      const intervalId = setInterval(() => {
        loadData();
      }, 15000);
      return () => clearInterval(intervalId);
    }

    return () => {};
  }, [pair, exchangeName, selectedPastHours]);

  const memoizedMarketData = useMemo(
    () => ({
      priceChartData,
      volumeChartData,
      futurePriceVolatility,
      orderOverlayData,
      marketSummaryMetrics,
      noData,
      now,
      reloading,
      selectedPastHours,
      setReloading,
      setSelectedPastHours,
    }),
    [
      priceChartData,
      volumeChartData,
      futurePriceVolatility,
      orderOverlayData,
      marketSummaryMetrics,
      noData,
      now,
      reloading,
      selectedPastHours,
    ]
  );

  return <MarketDataContext.Provider value={memoizedMarketData}>{children}</MarketDataContext.Provider>;
}

export const useMarketDataContext = () => useContext(MarketDataContext);
