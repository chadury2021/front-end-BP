import { getTradingViewDataFeed } from '@/apiServices';

// default implementation where all exchanges use the same API through taas
async function getBars({ symbol, resolution, fromSec, toSec, marketType }) {
  const baseUrl = getTradingViewDataFeed();
  const url = `${baseUrl}?symbol=${encodeURIComponent(symbol)}&resolution=${encodeURIComponent(resolution)}&from=${fromSec}&to=${toSec}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to load');
  }
  const raw = await response.json();
  const bars = Array.isArray(raw)
    ? raw
        .map((b) => ({
          time: b.time,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
          volume: b.volume,
        }))
        .filter(
          (b) =>
            Number.isFinite(b.time) &&
            Number.isFinite(b.open) &&
            Number.isFinite(b.high) &&
            Number.isFinite(b.low) &&
            Number.isFinite(b.close)
        )
        .sort((a, b) => a.time - b.time)
    : [];

  return bars;
}

function getSymbol(exchange, pair) {
  return `${exchange}:${pair.id}`;
}

const taasFeed = {
  getBars,
  getSymbol,
};

export default taasFeed;
