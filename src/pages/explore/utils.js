import { UnfoldMore, KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';

// String manipulation
export const extractBase = (pairStr) => {
  return pairStr.split('-')[0];
};

export const extractQuote = (pairStr) => {
  return pairStr.split('-')[1];
};

// Volume-related utilities
export const getVolumeOpacity = (volume) => {
  if (volume >= 10000000000) return 1;      // > 10B
  if (volume >= 1000000000) return 0.9;     // > 1B
  if (volume >= 100000000) return 0.7;      // > 100M
  if (volume >= 10000000) return 0.5;       // > 10M
  if (volume >= 1000000) return 0.3;        // > 1M
  if (volume >= 100000) return 0.2;         // > 100K
  return 0.1;                               // < 100K
};

export const getVolumeHeatmap = (volume) => {
  const maxVolume = 10000000000; // 10B
  const normalizedVolume = Math.min(volume / maxVolume, 1);
  return `rgba(0, 0, 0, ${normalizedVolume * 0.3})`;
};

export const getVolumeGradient = (volume) => {
  const baseColor = getVolumeHeatmap(volume);
  return `linear-gradient(to right, ${baseColor} 0%, transparent 100%)`;
};

// Funding rate calculations
export const calculateAnnualizedRate = (rate, intervalHours) => {
  if (rate === undefined || rate === null || intervalHours === undefined || intervalHours === null) {
    return 0;
  }

  const decimalRate = Number(rate);
  const validInterval = Math.max(1, Number(intervalHours) || 4);
  const annualizedRate = decimalRate * (365 * (24 / validInterval));

  if (Number.isNaN(annualizedRate) || !Number.isFinite(annualizedRate)) {
    console.warn('Invalid annualized rate calculation:', { rate, intervalHours, decimalRate });
    return 0;
  }

  return annualizedRate;
};

export const calculatePeriodRate = (rate, intervalHours, period) => {
  const annualized = calculateAnnualizedRate(rate, intervalHours);
  const normalized = typeof period === 'string' ? period.toLowerCase() : period;

  if (normalized === 'year' || normalized === '1y' || normalized === 'yr' || normalized === '12m') {
    return annualized;
  }

  if (normalized === '3m' || normalized === 'quarter' || normalized === '90d') {
    return annualized / 4;
  }

  if (normalized === 'month' || normalized === '1m' || normalized === '30d') {
    return annualized / 12;
  }

  if (normalized === 'week' || normalized === '1w' || normalized === '7d') {
    return annualized / 52;
  }

  if (normalized === 'day' || normalized === '1d' || normalized === '24h') {
    return annualized / 365;
  }

  return annualized;
};

// Visual/UI utilities
export const getHeatmapColor = (rate, isFundingRate = false, globalMax = 0.05) => {
  if (isFundingRate) {
    const max = globalMax;
    const intensity = Math.min(Math.abs(rate) / max, 1);
    const opacity = intensity * 0.7;
    if (rate > 0) return `rgba(76, 175, 80, ${opacity})`;
    if (rate < 0) return `rgba(200, 80, 80, ${opacity})`;
    return 'transparent';
  }

  const normRange = 0.05;
  const normalizedRate = Math.max(Math.min(rate, normRange), -normRange) / normRange;
  if (normalizedRate > 0) {
    const intensity = Math.min(Math.abs(normalizedRate), 1);
    const opacity = intensity * 0.4;
    return `linear-gradient(to right, transparent 0%, transparent 50%, rgba(76, 175, 80, ${opacity}) 100%)`;
  }
  if (normalizedRate < 0) {
    const intensity = Math.min(Math.abs(normalizedRate), 1);
    const opacity = intensity * 0.4;
    return `linear-gradient(to right, transparent 0%, transparent 50%, rgba(200, 80, 80, ${opacity}) 100%)`;
  }
  return 'transparent';
};

// Sorting utilities
export const getSortIcon = (sortConfig, key) => {
  if (key === 'token') return null;
  if (sortConfig.key !== key) return UnfoldMore;
  return sortConfig.direction === 'asc' ? KeyboardArrowUp : KeyboardArrowDown;
};

export const getSortedSymbols = (symbols, rateMap, sortConfig, fundingRatePeriod, tickerData = null) => {
  if (!sortConfig.key) return symbols;

  return [...symbols].sort((a, b) => {
    // Handle Volume sorting
    if (sortConfig.key === 'volume') {
      const getVolume = (symbol) => {
        if (!tickerData) return 0;
        const quoteCurrencies = ['USDT', 'USDC', 'USD'];
        const foundQuote = quoteCurrencies.find((quote) => tickerData[`${symbol}-${quote}`]?.volume24hNotional != null);
        if (foundQuote) {
          const pairKey = `${symbol}-${foundQuote}`;
          return parseFloat(tickerData[pairKey].volume24hNotional) || 0;
        }
        return 0;
      };

      const aVol = getVolume(a);
      const bVol = getVolume(b);
      return sortConfig.direction === 'asc' ? aVol - bVol : bVol - aVol;
    }

    // Handle Price sorting
    if (sortConfig.key === 'price') {
      const getPrice = (symbol) => {
        if (!tickerData) return 0;
        const quoteCurrencies = ['USDT', 'USDC', 'USD'];
        const foundQuote = quoteCurrencies.find((quote) => tickerData[`${symbol}-${quote}`]?.lastPrice != null);
        if (foundQuote) {
          const pairKey = `${symbol}-${foundQuote}`;
          return parseFloat(tickerData[pairKey].lastPrice) || 0;
        }
        return 0;
      };

      const aP = getPrice(a);
      const bP = getPrice(b);
      return sortConfig.direction === 'asc' ? aP - bP : bP - aP;
    }

    // Handle 24h sorting
    if (sortConfig.key === '24h') {
      const get24hPriceChange = (symbol) => {
        if (!tickerData) return 0;

        // Try different quote currencies
        const quoteCurrencies = ['USDT', 'USDC', 'USD'];
        const foundQuote = quoteCurrencies.find((quote) => {
          const pairKey = `${symbol}-${quote}`;
          const ticker = tickerData[pairKey];
          return ticker && ticker.pricePctChange24h !== undefined;
        });
        if (foundQuote) {
          const pairKey = `${symbol}-${foundQuote}`;
          return parseFloat(tickerData[pairKey].pricePctChange24h);
        }
        return 0;
      };

      const aPriceChange = get24hPriceChange(a);
      const bPriceChange = get24hPriceChange(b);

      return sortConfig.direction === 'asc' ? aPriceChange - bPriceChange : bPriceChange - aPriceChange;
    }

    // Handle funding rate sorting (existing logic)
    const aRate = rateMap[a]?.[sortConfig.key]?.rate || 0;
    const bRate = rateMap[b]?.[sortConfig.key]?.rate || 0;

    const aPeriodRate = calculatePeriodRate(aRate, rateMap[a]?.[sortConfig.key]?.interval || 4, fundingRatePeriod);
    const bPeriodRate = calculatePeriodRate(bRate, rateMap[b]?.[sortConfig.key]?.interval || 4, fundingRatePeriod);

    return sortConfig.direction === 'asc' ? aPeriodRate - bPeriodRate : bPeriodRate - aPeriodRate;
  });
};

// Statistics utilities
export const getFundingRateStats = (fundingRates) => {
  if (!fundingRates || fundingRates.length === 0) return { mean: 0, sd: 0.005 };

  const absRates = fundingRates.map((r) => Math.abs(Number(r.rate) || 0));
  const mean = absRates.reduce((a, b) => a + b, 0) / absRates.length;
  const variance = absRates.reduce((a, b) => a + (b - mean) ** 2, 0) / absRates.length;
  const sd = Math.max(Math.sqrt(variance), 0.005);

  return { mean, sd };
};
