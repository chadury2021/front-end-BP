function resolveExchangeName(exchangeName) {
  if (exchangeName === 'MockExchange') {
    return 'OKX';
  }
  if (exchangeName === 'BinancePM') {
    return 'Binance';
  }
  return exchangeName;
}

export default resolveExchangeName;
