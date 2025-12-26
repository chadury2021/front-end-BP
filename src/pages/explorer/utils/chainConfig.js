// TODO: use more of @treadfi/contracts to get the attestation address & access address
import { SUPPORTED_CHAINS, getContract, ContractName } from '@treadfi/contracts';

export const BLOCK_STEP_SIZE = 1_000;
export const MAX_EMPTY_BATCHES = 200;
// export const LATEST_BLOCK = 3_711_386; // known, hard-coded block for local dev
export const LATEST_BLOCK = null; // latest block for prod

/**
 * Initialize contract addresses for a specific chain
 * @param {string} chain - The chain to get addresses for
 * @returns {Promise<{attestationAddress: string, accessAddress: string}>}
 */
const initializeContractAddresses = async (chain) => {
  const attestationAddress = await getContract(ContractName.Attestations, chain).getAddress();
  const accessAddress = await getContract(ContractName.Access, chain).getAddress();
  return { attestationAddress, accessAddress };
};

/**
 * Initialize Monad contract addresses for a specific chain
 * @param {string} chain - The chain to get addresses for
 * @returns {Promise<{attestationAddress: string, accessAddress: string, vaultAddress: string, mockErc20Address: string}>}
 */
const initializeMonadContractAddresses = async (chain) => {
  const attestationAddress = await getContract(ContractName.Attestations, chain).getAddress();
  const accessAddress = await getContract(ContractName.Access, chain).getAddress();
  const vaultAddress = await getContract(ContractName.Vault, chain).getAddress();
  const mockErc20Address = await getContract(ContractName.MockErc20, chain).getAddress();
  return { attestationAddress, accessAddress, vaultAddress, mockErc20Address };
};

/**
 * Configuration object for Basescan RPC endpoints and contract addresses
 * @type {{
 *   development: {
 *     rpcUrl: string,
 *     explorerUrl: string,
 *   },
 *   production: {
 *     rpcUrl: string,
 *     explorerUrl: string,
 *   },
 *   defaults: {
 *     numberOfBlocks: number,
 *     retry: number
 *   }
 * }}
 */
const BASESCAN_CONFIG = {
  development: {
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
  },
  production: {
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
  },
  defaults: {
    numberOfBlocks: 50000,
    retry: 3,
  },
};

/**
 * Configuration object for Monad RPC endpoints
 */
const MONAD_CONFIG = {
  devnet: {
    rpcUrl: 'https://rpc-devnet.monadinfra.com/rpc/3fe540e310bbb6ef0b9f16cd23073b0a ',
    explorerUrl: 'https://explorer.monad-devnet.devnet101.com',
  },
  testnet: {
    rpcUrl: 'https://testnet-rpc2.monad.xyz/52227f026fa8fac9e2014c58fbf5643369b3bfc6',
    explorerUrl: 'https://testnet.monadexplorer.com',
  },
  defaults: {
    numberOfBlocks: 50000,
    retry: 3,
  },
};

/**
 * Selects the appropriate Basescan RPC URL based on development environment
 * @param {boolean} isDev - Whether the app is running in development environment
 * @returns {Promise<Object>} The Basescan config object with properties:
 *   @property {string} rpcUrl - The RPC URL for either testnet or mainnet
 *   @property {string} explorerUrl - The explorer URL for either testnet or mainnet
 *   @property {string} attestationAddress - The contract address
 *   @property {number} numberOfBlocks - Number of blocks to query
 *   @property {number} retry - Number of retry attempts
 *   @property {number} paginationNumber - Pagination offset
 */
export const selectBasescanConfig = async (isDev = false, paginationNumber = 0) => {
  const env = isDev ? 'development' : 'production';
  const config = BASESCAN_CONFIG[env];
  const chain = isDev ? SUPPORTED_CHAINS.baseSepolia : SUPPORTED_CHAINS.base;
  const addresses = await initializeContractAddresses(chain);

  console.debug(
    '[selectBasescanConfig]',
    `Environment: ${env}`,
    `RPC URL: ${config.rpcUrl}`,
    `Explorer URL: ${config.explorerUrl}`,
    `Contract: ${addresses.attestationAddress}`,
    `Pagination: ${paginationNumber}`
  );

  return {
    ...config,
    ...BASESCAN_CONFIG.defaults,
    ...addresses,
    paginationNumber,
  };
};

/**
 * Selects the appropriate Monad RPC URL and settings based on the environment.
 * Uses Monad endpoints for devnet (when isDev is true) and testnet (when isDev is false).
 * @param {boolean} isDev - Whether the app is running in development mode.
 * @param {number} paginationNumber - Pagination offset.
 * @returns {Promise<Object>} The Monad config object with properties similar to selectBasescanConfig.
 */
export const selectMonadConfig = async (isDev = false, paginationNumber = 0) => {
  const env = isDev ? 'devnet' : 'testnet';
  const config = MONAD_CONFIG[env];
  const chain = isDev ? SUPPORTED_CHAINS.monadDevnet : SUPPORTED_CHAINS.monadTestnet;
  const addresses = await initializeMonadContractAddresses(chain);

  console.debug(
    '[selectMonadConfig]',
    `Environment: ${env}`,
    `RPC URL: ${config.rpcUrl}`,
    `Explorer URL: ${config.explorerUrl}`,
    `Contract: ${addresses.attestationAddress}`,
    `Pagination: ${paginationNumber}`
  );

  return {
    ...config,
    ...MONAD_CONFIG.defaults,
    ...addresses,
    paginationNumber,
  };
};

/**
 * Selects the appropriate configuration based on the environment.
 * Currently always uses monadTestnet as monadDevnet is no longer relevant.
 * @param {boolean} isDev - Whether the app is running in development mode (ignored).
 * @param {number} paginationNumber - Pagination offset.
 * @returns {Promise<Object>} The config object with all necessary properties.
 */
export const selectConfig = async (isDev = false, paginationNumber = 0) => {
  // Always use monadTestnet, monadDevnet is no longer relevant
  return selectMonadConfig(false, paginationNumber);
};

