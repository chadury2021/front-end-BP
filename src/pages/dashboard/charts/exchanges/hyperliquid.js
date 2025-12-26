const MAINNET_API_URL = 'https://api.hyperliquid.xyz';
const TESTNET_API_URL = 'https://api.hyperliquid-testnet.xyz';

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

async function getSpotMeta(isMainnet) {
  const url = isMainnet ? MAINNET_API_URL : TESTNET_API_URL;
  const response = await fetch(`${url}/info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'spotMeta',
    }),
  });
  if (!response.ok) {
    throw new Error('Hyperliquid request failed');
  }
  const data = await response.json();
  return data;
}

function getSpotCoin(symbol, meta) {
  const [base, quote] = symbol.split('/');
  const baseToken = meta.tokens.find((t) => t.name === base);
  const quoteToken = meta.tokens.find((t) => t.name === quote);
  if (!baseToken || !quoteToken) {
    return null;
  }

  const coin = meta.universe.find((u) => {
    const { tokens } = u;
    return tokens[0] === baseToken.index && tokens[1] === quoteToken.index;
  });
  return coin?.name;
}

async function getBars({ symbol, resolution, fromSec, toSec, marketType, isMainnet }) {
  const url = isMainnet ? MAINNET_API_URL : TESTNET_API_URL;

  let coin = symbol;
  if (marketType === 'spot') {
    const spotMeta = await getSpotMeta(isMainnet);
    coin = getSpotCoin(symbol, spotMeta);
    if (!coin) {
      throw new Error('Spot coin not found');
    }
  }

  const params = {
    type: 'candleSnapshot',
    req: {
      coin,
      interval: mapResolutionToGranularity(resolution),
      startTime: fromSec * 1000,
      endTime: toSec * 1000,
    },
  };

  const response = await fetch(`${url}/info`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error('Hyperliquid request failed');
  }
  const rows = await response.json();
  const bars = rows
    .map((row) => ({
      time: Number(row.t),
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

const hyperliquidFeed = {
  getSymbol,
  getBars,
};

export default hyperliquidFeed;
