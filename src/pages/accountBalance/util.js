import moment from 'moment';

const EXCHANGES_WITHOUT_SPOT_EQUITY = ['Binance', 'BinancePM', 'Coinbase'];

// Blockchain Explorer Utilities

/**
 * Get network chain ID from wallet type
 * @param {string} walletType - The wallet type (e.g., 'evm', 'solana')
 * @returns {string} Network chain ID or 'N/A' if not found
 */
export const getNetworkFromWalletType = (walletType) => {
  if (!walletType) return 'N/A';

  const networkMap = {
    'evm': '1', // Ethereum chain ID
    'solana': '501', // Solana chain ID
  };

  return networkMap[walletType] || walletType.toUpperCase();
};

/**
 * Get network display name from wallet type
 * @param {string} walletType - The wallet type (e.g., 'evm', 'solana')
 * @returns {string} Network display name or 'N/A' if not found
 */
export const getNetworkDisplayName = (walletType) => {
  if (!walletType) return 'N/A';

  const networkMap = {
    'evm': 'ETH (Ethereum)',
    'solana': 'SOL (Solana)',
  };

  return networkMap[walletType] || walletType.toUpperCase();
};

/**
 * Format wallet address for display by truncating with ellipsis
 * @param {string} address - The wallet address to format
 * @returns {string} Formatted address or 'N/A' if not provided
 */
export const formatWalletAddress = (address) => {
  if (!address) return 'N/A';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Get blockchain explorer URL for a given address and network
 * @param {string} address - The address to get explorer URL for
 * @param {string} network - The network chain ID
 * @param {string} type - The type of URL ('address', 'transaction', 'tokenTxns')
 * @returns {string|null} Explorer URL or null if not supported
 */
export const getExplorerUrl = (address, network, type = 'address') => {
  if (!address) return null;

  const explorers = {
    '1': {
      address: `https://etherscan.io/address/${address}`,
      transaction: `https://etherscan.io/tx/${address}`,
      tokenTxns: `https://etherscan.io/tokentxns?a=${address}`
    },
    '501': {
      address: `https://solscan.io/account/${address}`,
      transaction: `https://solscan.io/tx/${address}`
    },
    '8453': {
      address: `https://basescan.org/address/${address}`,
      transaction: `https://basescan.org/tx/${address}`
    },
    '56': {
      address: `https://bscscan.com/address/${address}`,
      transaction: `https://bscscan.com/tx/${address}`
    },
    '42161': {
      address: `https://arbiscan.io/address/${address}`,
      transaction: `https://arbiscan.io/tx/${address}`
    },
    '10': {
      address: `https://optimistic.etherscan.io/address/${address}`,
      transaction: `https://optimistic.etherscan.io/tx/${address}`
    },
    '137': {
      address: `https://polygonscan.com/address/${address}`,
      transaction: `https://polygonscan.com/tx/${address}`
    },
    '43114': {
      address: `https://snowtrace.io/address/${address}`,
      transaction: `https://snowtrace.io/tx/${address}`
    },
    '250': {
      address: `https://ftmscan.com/address/${address}`,
      transaction: `https://ftmscan.com/tx/${address}`
    }
  };

  const networkExplorers = explorers[network];
  if (!networkExplorers) return null;

  return networkExplorers[type] || networkExplorers.address;
};

/**
 * Get network explorer display name
 * @param {string} network - The network chain ID
 * @returns {string} Explorer display name
 */
export const getNetworkExplorerName = (network) => {
  const names = {
    '1': 'Etherscan',
    '501': 'Solscan',
    '8453': 'Basescan',
    '56': 'BSCScan',
    '42161': 'Arbiscan',
    '10': 'Optimistic Etherscan',
    '137': 'Polygonscan',
    '43114': 'Snowtrace',
    '250': 'FTMScan',
  };
  return names[network] || 'Explorer';
};

/**
 * Extracts transaction hashes from a notification message
 * @param {string} message - The notification message
 * @returns {Array<string>} Array of transaction hashes found in the message
 */
export const extractTransactionHashes = (message) => {
  if (!message || typeof message !== 'string') {
    return [];
  }

  // Regex to match transaction hashes (0x followed by 64 hex characters)
  const txHashRegex = /(0x[a-fA-F0-9]{64})/g;
  const matches = message.match(txHashRegex);

  return matches || [];
};

/**
 * Checks if a message contains transaction hashes
 * @param {string} message - The notification message
 * @returns {boolean} True if the message contains transaction hashes
 */
export const hasTransactionHashes = (message) => {
  return extractTransactionHashes(message).length > 0;
};

/**
 * Calculates total account value from balance object.
 * Handles different exchange-specific logic for equity calculation.
 *
 * @param {Object} balance - Balance object containing equity/equities/assets
 * @param {number} [balance.equity] - Direct equity value (takes precedence if finite)
 * @param {Array} [balance.equities] - Array of equity objects with total_equity
 * @param {Array} [balance.assets] - Array of asset objects (tokens/positions)
 * @param {string} [balance.exchange_name] - Exchange name for special handling
 * @returns {number} Total calculated value
 */
export const calculateTotalValue = (balance = {}) => {
  const equityValue = Number(balance.equity);
  if (Number.isFinite(equityValue)) {
    return equityValue;
  }

  const equities = Array.isArray(balance.equities) ? balance.equities : [];

  let total = 0;
  let hasUnifiedEquity = false;
  if (equities.length > 0) {
    equities.forEach((e) => {
      const equity = Number(e.total_equity);
      total += Number.isFinite(equity) ? equity : 0;
      if (e.market_type === 'unified') {
        hasUnifiedEquity = true;
      }
    });
  }

  if (!EXCHANGES_WITHOUT_SPOT_EQUITY.includes(balance.exchange_name) && total > 0) {
    return total;
  }

  if (balance.exchange_name === 'Gate' && hasUnifiedEquity) {
    return total;
  }

  const assets = Array.isArray(balance.assets) ? balance.assets : [];
  total += assets.reduce((totalSpot, a) => {
    // For Binance, only include spot wallet assets; for other exchanges, include all wallet types
    if (balance.exchange_name === 'Binance' && a.wallet_type !== 'spot') {
      return totalSpot;
    }

    if (a.asset_type === 'position') {
      const unrealizedProfit = Number(a.unrealized_profit);
      return totalSpot + (Number.isFinite(unrealizedProfit) ? unrealizedProfit : 0);
    }
    const notional = Number(a.notional);
    return totalSpot + (Number.isFinite(notional) ? notional : 0);
  }, 0);

  return total;
};

export const balanceToRow = (balance, pastSnapshots) => {
  let dayAgoDiffPercentage = null;
  let weekAgoDiffPercentage = null;
  let dayAgoDiff = null;
  let weekAgoDiff = null;

  if (!balance) {
    return {};
  }
  const currentTotalValue = balance.totalValue;

  if (balance.account_name === 'All Accounts') {
    return {
      name: balance.account_name,
      exchange: balance.exchange_name,
      userId: balance.user_id,
      username: balance.username,
      totalValue: currentTotalValue,
      accountId: balance.account_id,
      lastUpdated: `Updated ${moment(balance.timestamp_millis).fromNow()}`,
      vcefi_enabled: balance.vcefi_enabled,
    };
  }

  if (pastSnapshots && pastSnapshots[balance.account_id]) {
    const dayAgoSnapshot = pastSnapshots[balance.account_id].day_ago;
    const weekAgoSnapshot = pastSnapshots[balance.account_id].week_ago;

    if (dayAgoSnapshot) {
      const prevTotalValue = calculateTotalValue(dayAgoSnapshot);

      dayAgoDiff = currentTotalValue - prevTotalValue;
      dayAgoDiffPercentage = prevTotalValue === 0 ? 0 : (100 * dayAgoDiff) / prevTotalValue;
    }

    if (weekAgoSnapshot) {
      const prevTotalValue = calculateTotalValue(weekAgoSnapshot);
      weekAgoDiff = currentTotalValue - prevTotalValue;
      weekAgoDiffPercentage = prevTotalValue === 0 ? 0 : (100 * weekAgoDiff) / prevTotalValue;
    }
  }

  return {
    name: balance.account_name,
    exchange: balance.exchange_name,
    userId: balance.user_id,
    username: balance.username,
    totalValue: currentTotalValue,
    dayAgoDiff,
    weekAgoDiff,
    dayAgoDiffPercentage,
    weekAgoDiffPercentage,
    accountId: balance.account_id,
    lastUpdated: `Updated ${moment(balance.timestamp_millis).fromNow()}`,
    vcefi_enabled: balance.vcefi_enabled,
  };
};

export const getUniqueBases = (assets) =>
  Array.from(new Set(assets.filter((asset) => asset.symbol).map((asset) => asset.symbol.replace(/:PERP(-USDT)?/, ''))));

export const mapTokenPairsToAssets = (pairs, baseList, selectedAccountFull) =>
  pairs
    .filter(
      (pair) => pair.base && baseList.includes(pair.base) && pair.exchanges.includes(selectedAccountFull.exchange_name)
    )
    .map(({ base, exchanges, label, quote, is_contract, is_inverse, market_type }) => ({
      base,
      exchanges,
      label,
      quote,
      isContract: is_contract,
      isInverse: is_inverse,
      marketType: market_type,
    }));

export const groupAssetsByBase = (assets) =>
  assets.reduce((acc, { base, label }) => {
    if (!acc[base]) {
      acc[base] = [];
    }
    acc[base].push(label);
    return acc;
  }, {});
