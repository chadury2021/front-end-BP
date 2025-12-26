/**
 * Pagination configuration
 * @constant {Object}
 */
export const PROD_PAGINATION_CONFIG = {
  /** @type {number} Default number of rows for preview mode */
  PREVIEW_ROWS: 10,
  /** @type {number} Default number of rows for full table */
  DEFAULT_ROWS: 25,
};

/**
 * Pagination configuration
 * @constant {Object}
 */
export const DEV_PAGINATION_CONFIG = {
  /** @type {number} Default number of rows for preview mode */
  PREVIEW_ROWS: 2,
  /** @type {number} Default number of rows for full table */
  DEFAULT_ROWS: 5,
};

/**
 * Refresh configuration
 * @constant {Object}
 */
export const REFRESH_CONFIG = {
  /** @type {number} Interval in milliseconds to refresh trade data */
  INTERVAL: 600_000, // 10 minutes
};

export const PAGINATION_CONFIG = PROD_PAGINATION_CONFIG;
