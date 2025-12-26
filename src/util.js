import moment, { now } from 'moment';
import numbro from 'numbro';

export const BASEURL = window.location.origin;

export const isEmpty = (obj) => {
  return (
    (Array.isArray(obj) && obj.length === 0) || // Check for empty array
    (obj.constructor === Object && Object.keys(obj).length === 0) // Check for empty object
  );
};

export function accurateToFixed(num, fixed) {
  // eslint-disable-next-line no-useless-escape
  const re = new RegExp(`^-?\\d+(?:\.\\d{0,${fixed || -1}})?`);
  return num.toString().match(re)[0];
}

export const removeFalsyAndEmptyKeys = (obj) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] && !isEmpty(obj[key])) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
};

export const replaceFalsyAndEmptyKeys = (obj, replacer) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (!obj[key] || isEmpty(obj[key])) {
      acc[key] = replacer;
    }
    return acc;
  }, {});
};

export const filterOutFalseyValues = (arr) => arr.filter(Boolean);

export function numberWithSpaces(x) {
  const parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
}

export function numberWithCommas(x) {
  const parts = x.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export function truncate(x) {
  const parts = x.toString().split('.');
  return Number(parts[0]);
}

export function msAndKs(x, fixed = 2) {
  if (x === null || x === undefined) return '-';
  const absX = Math.abs(x);
  if (absX >= 1000000000000000) {
    return `${(x / 1000000000000000).toFixed(fixed)}Q`;
  }
  if (absX >= 1000000000000) {
    return `${(x / 1000000000000).toFixed(fixed)}T`;
  }
  if (absX >= 1000000000) {
    return `${(x / 1000000000).toFixed(fixed)}B`;
  }
  if (absX >= 1000000) {
    return `${(x / 1000000).toFixed(fixed)}M`;
  }
  if (absX >= 1000) {
    return `${(x / 1000).toFixed(fixed)}K`;
  }
  return `${(x / 1).toFixed(fixed)}`;
}

export function titleCase(w) {
  if (!w) {
    return '';
  }
  return w
    .toLowerCase()
    .replace('_', ' ')
    .replace(/\b\w/g, (s) => s.toUpperCase());
}

export function smartRound(num, precision = 4) {
  const number = parseFloat(num);
  if (!number) {
    return String(num);
  }

  // If the number is larger than a small threshold, round to precision decimal places
  if (Math.abs(number) > 1) {
    return Number(number.toFixed(precision)).toString(); // toString omits trailing zeros
  }

  // If the number is very small, avoid scientific notation by using toFixed with more decimal places
  const absNumber = Math.abs(number);
  const decimalPlaces = Math.abs(Math.floor(Math.log10(absNumber))) + precision;

  const result = number.toFixed(decimalPlaces);
  // Remove trailing zeros after decimal point
  return result.replace(/\.?0+$/, '');
}

export function formatPrice(value) {
  // Handle edge cases
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0.0';
  }

  const absValue = Math.abs(value);

  // For large numbers (>= 100), use 2 decimal places with comma formatting
  if (absValue >= 100) {
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // For medium numbers (>= 1 but < 100), use up to 3 decimal places
  if (absValue >= 1) {
    const formatted = Number(value).toFixed(3);
    // Remove trailing zeros but keep at least one decimal place
    return formatted.replace(/\.?0+$/, (match) => {
      // If we're removing all decimals, keep one zero
      if (match.startsWith('.')) return '';
      return match;
    });
  }

  // For small numbers (< 1), use precision formatting to maintain significant digits
  const significantDigits = 5;
  const formatted = value.toPrecision(significantDigits);
  return formatted;
}

/**
 * Renders a price with subscript notation for zero count after decimal
 * Only applies when price is less than 1 and has leading zeros
 * For example: 0.000123 becomes 0.0₃123 (where ₃ is a subscript)
 * @param {number|string} price - The price to format
 * @returns {string} - The formatted price string with subscript notation
 */
export function formatPriceWithSubscript(price) {
  const priceNum = Number(price);
  const priceStr = String(price);

  // Only apply subscript formatting if price is less than 1
  if (priceNum >= 1) {
    return priceStr;
  }

  // Match: 0.(zeros)(rest), at least 2 zeros after decimal, then a nonzero digit
  const match = priceStr.match(/^(\d*)\.(0{2,})([1-9]\d*)$/);
  if (match) {
    const [, intPart, zeros, rest] = match;
    return `${intPart}.0${zeros.length}${rest}`;
  }
  return priceStr;
}

export const noArrowStyle = {
  '& input::-webkit-outer-spin-button, input::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  'input[type=number]': {
    MozAppearance: 'textfield',
  },
};

export function validatePair(pair) {
  if (pair.includes('FUTURE')) {
    const futurePairRegex = /[a-zA-Z0-9]+:FUTURE_(\d{4})\.(\d{2})\.(\d{2})-[a-zA-Z0-9]+/;

    return !!pair.match(futurePairRegex);
  }
  return true;
}

export const handleDateChange = (value, dateSetter) => {
  dateSetter(value);
};

const pauseWindowToPlotBand = (pauseWindow, theme) => {
  return {
    color: theme.palette.charts.grayTransparent,
    from: pauseWindow[0],
    to: pauseWindow[1],
    label: {
      style: {
        color: theme.palette.charts.grayTransparent,
      },
    },
  };
};

export const buildPausePlotBands = (pauseWindows, isPaused, orderPausedAt, theme) => {
  const plotBands = pauseWindows.map((w) => pauseWindowToPlotBand(w, theme));

  if (isPaused) {
    plotBands.push(pauseWindowToPlotBand([new Date(orderPausedAt).getTime(), now()], theme));
  }

  return plotBands;
};

export const filterPausedData = (seriesData, xAxisPlotBands) => {
  return seriesData.map((point) => {
    if (xAxisPlotBands.some((band) => point.x >= band.from && point.x <= band.to)) {
      return { x: point.x, y: null };
    }

    return point;
  });
};

export const createEmptyPoints = (pausePlotBands) => {
  const dummyPoints = [];
  pausePlotBands.forEach((band) => {
    dummyPoints.push([band.from, null]);
    dummyPoints.push([band.to, null]);
  });

  return dummyPoints;
};

export const insertPauseBandEmptyPoints = (data, pausePlotBands) => {
  const emptyPoints = createEmptyPoints(pausePlotBands);
  return data.concat(emptyPoints).sort((a, b) => a[0] - b[0]);
};

// Hack to prevent scroll from changing the input field value
export const ignoreScrollEvent = (event) => {
  event.target.blur(); // Remove focus from the input field
  event.stopPropagation(); // Stop the event from propagating
  setTimeout(() => event.target.focus(), 0); // Re-focus the input field
};

export const calculateDurationDisplay = (value) => {
  if (!value) {
    return '';
  }

  const roundedValue = Math.round(value * 100) / 100;

  const formatDisplay = (num, unit) => {
    return Number.isInteger(num) ? `${num} ${unit}` : `${num.toFixed(1)} ${unit}`;
  };

  if (roundedValue > 3599) {
    return formatDisplay(roundedValue / 3600, 'hours');
  }

  if (roundedValue > 59) {
    return formatDisplay(roundedValue / 60, 'min');
  }

  return formatDisplay(roundedValue, 'sec');
};

export const capitalizeFirstLetter = (s) => s && String(s[0]).toUpperCase() + String(s).slice(1);

export const chooseKeys = (obj, keys) => {
  return keys.reduce((val, key) => {
    const result = val;
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

export const getStrategyName = ({ selectedStrategy, superStrategies, strategies }) => {
  if (
    superStrategies &&
    selectedStrategy &&
    superStrategies[selectedStrategy] &&
    superStrategies[selectedStrategy].name
  ) {
    return superStrategies[selectedStrategy].name;
  }
  if (strategies && selectedStrategy && strategies[selectedStrategy] && strategies[selectedStrategy].name) {
    return strategies[selectedStrategy].name;
  }
  return null;
};

export const getTrajectoryName = ({ trajectory, trajectories }) => {
  if (trajectory && trajectories[trajectory] && trajectories[trajectory].name) {
    return trajectories[trajectory].name;
  }
  return '';
};

export function insertEllipsis(str, startSlice = 4, endSlice = 3) {
  if (!str) {
    return '';
  }

  if (str.length <= 7) {
    return str; // No need to shorten
  }

  const start = str.slice(0, startSlice);
  const end = str.slice(-1 * endSlice);

  return `${start}...${end}`;
}

/**
 * Checks if a string is a wallet address (Ethereum or Solana)
 * @param {string} value - The string to check
 * @returns {boolean} - True if the string is a wallet address
 */
export function isWalletAddress(value) {
  const s = String(value || '');
  // Check for Ethereum address (0x + 40 hex chars)
  const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(s);
  // Check for Solana address (32-44 base58 chars)
  const isSolAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);
  return isEthAddress || isSolAddress;
}

/**
 * Formats an account name, shortening it if it's a wallet address
 * @param {string} accountName - The account name to format
 * @param {number} maxLength - Maximum length for non-wallet names (default: 15)
 * @returns {string} - The formatted account name
 */
export function formatAccountName(accountName, maxLength = 15) {
  if (!accountName) return '';

  if (isWalletAddress(accountName)) {
    return insertEllipsis(accountName, 4, 4);
  }

  if (accountName.length > maxLength) {
    return `${accountName.substring(0, maxLength)}...`;
  }

  return accountName;
}

export const generateTimestampId = () => `id_${Date.now()}_${Math.random()}`;

export function hasDuplicateKeyValue(arr, key, value) {
  let count = 0;
  let hasDupe = false;

  arr.forEach((e) => {
    if (e[key] === value) {
      count += 1;
      if (count > 1) {
        hasDupe = true;
      }
    }
  });
  return hasDupe;
}

// Given an array of objects, return an object where objects with the same key are grouped together
// Empty array -> {} / Missing keys will be grouped under 'undefined'
export function groupBy(array, key) {
  return array.reduce((acc, obj) => {
    const groupKey = obj[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(obj);
    return acc;
  }, {});
}

export function getUnderlying(asset) {
  return asset.split(/[:-]/)[0];
}

const PAIR_ID_REGEX = /^([^:-]+)(?::([^:-]+))?-(.+)$/;

export function parsePairId(pairId) {
  if (pairId === undefined || pairId === null) {
    return { base: null, variant: null, quote: null };
  }

  const pairIdStr = String(pairId);
  const match = pairIdStr.match(PAIR_ID_REGEX);

  if (match) {
    const [, base, variant, quote] = match;
    return {
      base: base || null,
      variant: variant || null,
      quote: quote || null,
    };
  }

  const [baseFallback, quoteFallback] = pairIdStr.split('-');
  return {
    base: baseFallback || (pairIdStr || null),
    variant: null,
    quote: quoteFallback || null,
  };
}

export function getPairBase(pairId) {
  return parsePairId(pairId).base;
}

export function getPairVariant(pairId) {
  return parsePairId(pairId).variant;
}

export function getPairQuote(pairId) {
  return parsePairId(pairId).quote;
}

export function capitalize(name) {
  if (typeof name !== 'string' || name.length === 0) return '';
  return name[0].toUpperCase() + name.slice(1);
}

// DEPRECATED - use formatQty
export function prettyPrice(x, precision = 4) {
  return numberWithCommas(smartRound(x, precision));
}

// DEPRECATED - use formatQty
export function prettyDollars(x, precision) {
  if (x < 0) {
    return `-$${prettyPrice(Math.abs(x), precision)}`;
  }
  return `$${prettyPrice(x, precision)}`;
}

/**
 * Converts value to shortened version
 * 1000 => 1K
 * 1000000 => 1M
 * 1000000000 => 1B
 * @param {*} value
 */
export const shortenNumber = (x) => {
  const value = parseFloat(x);
  if (!value) {
    return String(value);
  }

  let num = value;
  let unit = '';

  if (value >= 10 ** 9) {
    num = value / 10 ** 9;
    unit = 'B';
  } else if (value >= 10 ** 6) {
    num = value / 10 ** 6;
    unit = 'M';
  } else if (value >= 10 ** 3) {
    num = value / 10 ** 3;
    unit = 'K';
  }

  return `${Number(num).toFixed(2)}${unit}`;
};

export const formatQty = (num, currency = false) => {
  const qty = parseFloat(num);
  if (!qty) {
    return String(num);
  }

  if (qty === 0) return '';

  let precision;
  if (Math.abs(qty) >= 100) {
    precision = 2;
  } else if (Math.abs(qty) >= 1) {
    precision = 4;
  } else {
    precision = 6;
  }

  const props = {
    thousandSeparated: true,
    mantissa: precision,
    trimMantissa: true,
  };

  return currency ? numbro(qty).formatCurrency(props) : numbro(qty).format(props);
};

export const formatDateTime = (dateTime) => {
  return moment(dateTime).format('YYYY-MM-DD HH:mm:ss');
};
