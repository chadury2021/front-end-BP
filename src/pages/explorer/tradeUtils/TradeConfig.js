/**
 * Configuration settings for trade data fetching and display
 * @module TradeConfig
 */

/**
 * Arweave network configuration
 * @constant {Object}
 */
export const ARWEAVE_CONFIG = {
  /** @type {string} Base host URL for Arweave gateway */
  HOST: 'arweave.app',
  /** @type {string} Protocol for Arweave requests */
  PROTOCOL: 'https',
  /** @type {string} Full base URL for Arweave gateway */
  get BASE_URL() {
    return `${this.PROTOCOL}://${this.HOST}`;
  },
};
