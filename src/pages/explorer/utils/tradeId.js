import { insertEllipsis } from '@/util';

/**
 * Renders a trade ID in a user-friendly format
 * @param {string|number} trade_id - The trade ID to render
 * @returns {string} The formatted trade ID
 */
export function renderTradeId(trade_id) {
  return Number.isNaN(Number(trade_id))
    ? insertEllipsis(trade_id, 10)
    : Number(trade_id).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
}
