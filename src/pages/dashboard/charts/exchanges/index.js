import bitgetFeed from './bitget';
import taasFeed from './taas';
import hyperliquidFeed from './hyperliquid';
import extendedFeed from './extended';

const registry = {};

export function registerExchange(key, adapter) {
  if (!key || !adapter) return;
  registry[String(key).toUpperCase()] = adapter;
}

export function getExchangeFeed(exchangeCode) {
  if (!exchangeCode) return taasFeed;
  return registry[String(exchangeCode).toUpperCase()] || taasFeed;
}

// Built-in adapters
registerExchange('BITGET', bitgetFeed);
registerExchange('HYPERLIQUID', hyperliquidFeed);

// Extended does not allow CORS, go through taas feed for now
// registerExchange('EXTENDED', extendedFeed);

export default registry;
