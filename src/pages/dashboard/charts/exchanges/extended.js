const MAINNET_API_URL = 'https://api.starknet.extended.exchange/api/v1/info/candles/';
const TESTNET_API_URL = 'https://api.starknet.sepolia.extended.exchange/api/v1/info/candles/';

function mapResolutionToGranularity(resolution) {
  const map = {
    1: '1m',
    5: '5m',
    15: '15m',
    30: '30m',
    60: '1h',
    120: '2h',
    240: '4h',
    '1D': '1d',
  };

  return map[resolution] || '1m';
}

async function getBars({ symbol, resolution, fromSec, toSec, marketType, isMainnet }) {
  const url = isMainnet ? MAINNET_API_URL : TESTNET_API_URL;

  const params = new URLSearchParams({
    interval: mapResolutionToGranularity(resolution),
    endTime: toSec * 1000,
    limit: 1000,
  });

  const response = await fetch(`${url}${symbol}/trades?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to load');
  }
  const raw = await response.json();
  const { data } = raw;
  const bars = data
    .map((row) => ({
      time: Number(row.T),
      open: Number(row.o),
      high: Number(row.h),
      low: Number(row.l),
      close: Number(row.c),
      volume: Number(row.v),
    }))
    .filter(
      (b) =>
        Number.isFinite(b.time) &&
        Number.isFinite(b.open) &&
        Number.isFinite(b.high) &&
        Number.isFinite(b.low) &&
        Number.isFinite(b.close)
    )
    .sort((a, b) => a.time - b.time);

  return bars;
}

function getSymbol(exchange, pair) {
  return pair.external_names[exchange] || pair.id;
}

const extendedFeed = {
  getSymbol,
  getBars,
};

export default extendedFeed;
