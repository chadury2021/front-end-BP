export const normalize = (value) => (value ? String(value).toLowerCase() : '');

export const normalizeExchangeName = (exchangeName) => {
  if (!exchangeName) return '';
  const lower = normalize(exchangeName);
  if (lower === 'binancepm' || lower === 'binance') return 'Binance';
  if (lower === 'okx') return 'OKX';
  if (lower === 'hyperliquid' || lower === 'hyperliquidspot') return 'Hyperliquid';
  if (lower === 'gate' || lower === 'gateio') return 'Gate';
  if (lower === 'bybit') return 'Bybit';
  return exchangeName;
};

export const getQuoteCurrency = (exchangeName) => {
  if (!exchangeName) return 'USDT';
  const lower = normalize(exchangeName);
  if (lower === 'hyperliquid' || lower === 'hyperliquidspot') return 'USDC';
  return 'USDT';
};
