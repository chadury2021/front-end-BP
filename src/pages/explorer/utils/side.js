import { titleCase } from '@/util';

/**
 * Formats the side of a trade to a title case string
 * @param {string} side - The side of the trade
 * @returns {string} The formatted side
 */
export function formatSide(side) {
  return titleCase(side);
}

/**
 * Maps the side of a trade to a color
 * @param {string} side - The side of the trade
 * @returns {string} The color
 */
export function mapSideToColor(side) {
  switch (side) {
    case 'Buy':
      return 'success.main';
    case 'Sell':
      return 'error.main';
    default:
      return 'text.secondary';
  }
}
