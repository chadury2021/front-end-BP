import CHAIN_ICONS from '@images/chain_icons';
import { CHAIN_CONFIGS } from '@/shared/dexUtils';

/**
 * Formats gas fee from gwei to base quantity and returns formatted display with network logo
 * @param {string|number} gasFee - Gas fee in gwei
 * @param {string|number} chainId - Chain ID (1, 56, 8453, 501)
 * @returns {Object} Object containing formatted gas fee and network info
 */
export const formatGasFee = (gasFee, chainId) => {
  if (!gasFee || !chainId) {
    return {
      formattedFee: '-',
      networkSymbol: '',
      networkIcon: null,
    };
  }

  // Convert gwei to base quantity (divide by 1 billion)
  const gasFeeInGwei = parseFloat(gasFee);
  const gasFeeInEth = gasFeeInGwei / 1e9;

  // Get network configuration
  const networkConfig = CHAIN_CONFIGS[chainId];
  const networkSymbol = networkConfig?.symbol || '';
  const networkIcon = CHAIN_ICONS[chainId] || CHAIN_ICONS.default;

  // Format the fee with appropriate precision
  let formattedFee;
  if (gasFeeInEth < 0.001) {
    formattedFee = gasFeeInEth.toFixed(6);
  } else if (gasFeeInEth < 1) {
    formattedFee = gasFeeInEth.toFixed(4);
  } else {
    formattedFee = gasFeeInEth.toFixed(3);
  }

  return {
    formattedFee,
    networkSymbol,
    networkIcon,
  };
};

/**
 * Gets network display name for a given chain ID
 * @param {string|number} chainId - Chain ID
 * @returns {string} Network display name
 */
export const getNetworkDisplayName = (chainId) => {
  const networkConfig = CHAIN_CONFIGS[chainId];
  return networkConfig?.name || 'Unknown Network';
};

/**
 * Calculates USD value of gas fee based on native token price
 * @param {string|number} gasFee - Gas fee in ETH/BNB/etc
 * @param {string|number} chainId - Chain ID
 * @param {number} nativeTokenPrice - Price of native token in USD
 * @returns {Object} Object containing USD value and formatted display
 */
export const calculateGasFeeUSD = (gasFee, chainId, nativeTokenPrice) => {
  if (!gasFee || !chainId || !nativeTokenPrice) {
    return {
      usdValue: null,
      formattedUSD: '-',
    };
  }

  const gasFeeNum = parseFloat(gasFee);
  const tokenPriceNum = parseFloat(nativeTokenPrice);

  const usdValue = gasFeeNum * tokenPriceNum;

  return {
    usdValue,
    formattedUSD: usdValue > 0 ? `$${usdValue.toFixed(2)}` : '-',
  };
};

/**
 * Checks if the estimated gas fee is more than the available gas balance
 * @param {string|number} estimatedGasFee - Estimated gas fee in gwei
 * @param {number} availableGas - Available gas balance in base units
 * @param {string|number} chainId - Chain ID for conversion
 * @returns {Object} Object containing whether gas is insufficient and formatted values
 */
export const checkGasSufficiency = (estimatedGasFee, availableGas, chainId) => {
  if (!estimatedGasFee || !chainId) {
    return {
      isInsufficient: false,
      estimatedGasInEth: 0,
      availableGasInEth: 0,
    };
  }

  // Convert estimated gas fee from gwei to ETH/base units
  const estimatedGasInGwei = parseFloat(estimatedGasFee);
  const estimatedGasInEth = estimatedGasInGwei / 1e9;

  // Convert available gas to ETH/base units (assuming it's already in base units)
  const availableGasInEth = parseFloat(availableGas || 0);

  const isInsufficient = estimatedGasInEth > availableGasInEth;

  return {
    isInsufficient,
    estimatedGasInEth,
    availableGasInEth,
  };
};