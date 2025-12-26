const BASE_URL = 'https://api.bitget.com/api/v2/spot/market/candles';
const BASE_URL_FUTURES = 'https://api.bitget.com/api/v2/mix/market/candles';

function getBaseUrl(marketType) {
  if (marketType === 'spot') {
    return BASE_URL;
  }
  return BASE_URL_FUTURES;
}

function getProductType(symbol) {
  if (symbol.includes('USDT')) {
    return 'usdt-futures';
  }
  return 'usdc-futures';
}

function mapResolutionToGranularity(resolution, marketType) {
  const map =
    marketType === 'spot'
      ? {
          1: '1min',
          5: '5min',
          15: '15min',
          30: '30min',
          60: '1h',
          120: '1h',
          240: '4h',
          '1D': '1day',
        }
      : {
          1: '1m',
          5: '5m',
          15: '15m',
          30: '30m',
          60: '1H',
          120: '1H',
          240: '4H',
          '1D': '1D',
        };

  return map[resolution] || '1min';
}

async function fetchBars(symbol, resolution, toSec, marketType, limit) {
  const granularity = mapResolutionToGranularity(resolution, marketType);
  const params = new URLSearchParams({
    symbol,
    granularity,
    endTime: String(toSec),
    productType: marketType === 'spot' ? '' : getProductType(symbol),
    limit,
  });

  const url = `${getBaseUrl(marketType)}?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error('Bitget request failed');
  }
  const json = await resp.json();

  // Bitget returns data arrays; prefer 'data' if present else top-level
  let rows = [];
  if (Array.isArray(json?.data)) {
    rows = json.data;
  } else if (Array.isArray(json)) {
    rows = json;
  } else {
    rows = [];
  }

  return rows;
}

async function getBars({ symbol, resolution, fromSec, toSec, marketType, countBack }) {
  let pages = 1;
  if (marketType !== 'spot' && resolution === '1D') {
    pages = Math.ceil(countBack / 90);
  }

  let bars = [];
  let to = toSec * 1000;
  for (let i = 0; i < pages; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const rows = await fetchBars(symbol, resolution, to, marketType, 1000);
    if (rows.length === 0) {
      break;
    }
    const first = rows[0];
    [to] = first;
    bars.push(...rows);
  }

  bars = bars
    .map((row) => {
      // Expected format: [timestamp(ms), open, high, low, close, volume, ...]
      const time = Number(row[0]);
      const open = Number(row[1]);
      const high = Number(row[2]);
      const low = Number(row[3]);
      const close = Number(row[4]);
      const volume = Number(row[5]);
      return { time, open, high, low, close, volume };
    })
    .filter(
      (b) =>
        Number.isFinite(b.time) &&
        Number.isFinite(b.open) &&
        Number.isFinite(b.high) &&
        Number.isFinite(b.low) &&
        Number.isFinite(b.close)
    )
    // Ensure ascending order by time
    .sort((a, b) => a.time - b.time);
  return bars;
}

function getSymbol(exchange, pair) {
  return pair.external_names[exchange] || pair.id;
}

const bitgetFeed = {
  getSymbol,
  getBars,
};

export default bitgetFeed;
