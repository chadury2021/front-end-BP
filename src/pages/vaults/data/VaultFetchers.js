/**
 * This module provides functionality for fetching and formatting vault data from the blockchain.
 * It includes utilities for fetching vault state, user positions, and historical events.
 *
 * Key Features:
 * - Fetching total vault assets and state
 * - User position tracking (deposits, withdrawals, borrows)
 * - Interest rate and epoch information
 * - Historical event tracking
 *
 * The module exports:
 * - fetchVaultState: Core function for fetching current vault state
 * - fetchUserPosition: Gets a user's current position in the vault
 * - fetchVaultEvents: Fetches historical vault events
 * - formatVaultEvent: Formats raw vault events into standardized structure
 * - listVaults: Returns list of vault addresses (both hardcoded and dynamic)
 * - getVaultTraderId: Maps vault addresses to trader IDs
 */

import {
  DEFAULT_GRAPHQL_ENDPOINT,
  fetchGraphQLAttestations,
  fetchGraphQLConsensusRecords,
} from '@/pages/explorer/proofUtils/ProofGraphQL';
import { ethers } from 'ethers';
import { DateRange } from '@/pages/points/DateRangePicker';
import { abis } from '../abis/VaultAbis';
import { VAULT_TO_TRADER_ID_MAP } from './consts';
/**
 * Returns a list of all available vault addresses
 * TODO: This should be fully dynamic later on
 * @returns {Array} Array of vault addresses
 */
export function listVaults() {
  return [
    // hardcodedVaults:
    '0x12352342', // AlphaVault
    '0x345363453', // CryptoNest
    '0x897164319', // TitanStore
    // dynamicVault:
    '0xc5b63afec2d2b68251c36476d6b798fc797a710f', // Dynamic Vault
  ];
}

/**
 * Fetches the current state of the vault including total assets, epoch, etc.
 * @param {Object} config - Configuration object containing:
 * @param {string} config.rpcUrl - URL of the RPC endpoint
 * @param {string} config.vaultAddress - Address of the vault contract
 * @returns {Promise<{
 *   totalAssets: string,
 *   currentEpoch: number,
 *   inBlackoutPeriod: boolean
 * }>}
 */
export async function fetchVaultState(config) {
  const { rpcUrl, vaultAddress } = config;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const vault = new ethers.Contract(vaultAddress, abis, provider);

  try {
    const [totalAssets, currentEpoch, timestamp] = await Promise.all([
      vault.totalAssets(),
      vault.getCurrentEpoch(),
      provider.getBlock('latest').then((block) => block.timestamp),
    ]);

    const inBlackoutPeriod = await vault.inBlackoutPeriod(timestamp);

    return {
      totalAssets: ethers.formatEther(totalAssets),
      currentEpoch: Number(currentEpoch),
      inBlackoutPeriod,
    };
  } catch (error) {
    console.error('[fetchVaultState] Error:', error);
    throw error;
  }
}

/**
 * Fetches a user's position in the vault including shares, withdrawals, etc.
 * @param {Object} config - Configuration object containing:
 * @param {string} config.rpcUrl - URL of the RPC endpoint
 * @param {string} config.vaultAddress - Address of the vault contract
 * @param {string} userAddress - Address of the user
 * @returns {Promise<{
 *   sharesOwned: string,
 *   withdrawalState: {
 *     epoch: number,
 *     sharesRequested: string,
 *     assetsWithdrawable: string
 *   }
 * }>}
 */
export async function fetchUserPosition(config, userAddress) {
  const { rpcUrl, vaultAddress } = config;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const vault = new ethers.Contract(vaultAddress, abis, provider);

  try {
    const withdrawableAssets = await vault.getWithdrawableAssets(userAddress);

    return {
      withdrawableAssets: ethers.formatEther(withdrawableAssets),
    };
  } catch (error) {
    console.error('[fetchUserPosition] Error:', error);
    throw error;
  }
}

/**
 * Event formatters for different vault events
 */
const eventFormatters = {
  WithdrawalRequested: (event) => ({
    type: 'WithdrawalRequested',
    transactionHash: event.transactionHash,
    blockNumber: event.blockNumber,
    owner: event.args.owner,
    shares: ethers.formatEther(event.args.shares),
    epoch: Number(event.args.epoch),
  }),

  WithdrawalExecuted: (event) => ({
    type: 'WithdrawalExecuted',
    transactionHash: event.transactionHash,
    blockNumber: event.blockNumber,
    owner: event.args.owner,
    assets: ethers.formatEther(event.args.assets),
    receiver: event.args.receiver,
  }),

  Borrowed: (event) => ({
    type: 'Borrowed',
    transactionHash: event.transactionHash,
    blockNumber: event.blockNumber,
    borrower: event.args.borrower,
    assets: ethers.formatEther(event.args.assets),
    receiver: event.args.receiver,
  }),

  Repaid: (event) => ({
    type: 'Repaid',
    transactionHash: event.transactionHash,
    blockNumber: event.blockNumber,
    borrower: event.args.borrower,
    assets: ethers.formatEther(event.args.assets),
  }),
};

/**
 * Fetches historical events for the vault
 * @param {Object} config - Configuration object containing:
 * @param {string} config.rpcUrl - URL of the RPC endpoint
 * @param {string} config.vaultAddress - Address of the vault contract
 * @param {number} fromBlock - Starting block to fetch from
 * @param {number} toBlock - Ending block to fetch to
 * @param {string[]} eventNames - Array of event names to fetch
 * @returns {Promise<Array>} Array of formatted events
 */
export async function fetchVaultEvents(config, fromBlock, toBlock, eventNames = Object.keys(eventFormatters)) {
  const { rpcUrl, vaultAddress } = config;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const vault = new ethers.Contract(vaultAddress, abis, provider);

  try {
    const eventPromises = eventNames.map((eventName) =>
      vault.queryFilter(vault.filters[eventName](), fromBlock, toBlock)
    );

    const eventArrays = await Promise.all(eventPromises);

    return eventArrays
      .flat()
      .map((event) => {
        const formatter = eventFormatters[event.eventName];
        return formatter ? formatter(event) : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.blockNumber - a.blockNumber);
  } catch (error) {
    console.error('[fetchVaultEvents] Error:', error);
    throw error;
  }
}

/**
 * Calculates APY based on historical data
 * @param {Object} config - Configuration object
 * @param {Array} events - Array of historical events
 * @returns {Promise<string>} Formatted APY string
 */
export async function calculateVaultAPY(config, events) {
  // TODO: Implement APY calculation based on historical events
  return '0%';
}

/**
 * Fetches the trader ID for a given vault address
 * @param {string} rpcUrl - URL of the RPC endpoint
 * @param {string} vaultAddress - Address of the vault -- with 0x
 * @returns {Promise<string>} Trader ID corresponding to the vault address
 */
export async function fetchVaultTraderId(rpcUrl, vaultAddress) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const vault = new ethers.Contract(vaultAddress, abis, provider);
  console.log('[fetchVaultTraderId] called with vaultAddress:', vaultAddress);

  try {
    const traderId = await vault.getTraderId();
    console.log('[fetchVaultTraderId] vaultAddress:', vaultAddress, 'return traderId:', traderId);
    return traderId;
  } catch (error) {
    console.error('[fetchVaultTraderId] Error:', error);
    // Fallback to a default trader ID if the function call fails
    console.warn('[fetchVaultTraderId] Using fallback trader ID');
    return '0x71744a6a0f3178224c8b245dac64a0d1ca1dd1dd39b7aa79875488816f9fd5fa';
  }
}

/**
 * Maps vault addresses to trader IDs
 * @param {Object} config - Configuration object
 * @param {string} config.rpcUrl - URL of the RPC endpoint
 * @param {string} config.vaultAddress - Address of the vault contract
 * @param {string} vaultAddress - Address of the vault
 * @returns {string} Trader ID corresponding to the vault address
 */
export async function getVaultTraderId(config, vaultAddress) {
  const { rpcUrl, vaultAddress: configVaultAddress } = config;

  // trim 0x from the start and end of the vault address
  console.log('[getVaultTraderId] vaultAddress', vaultAddress);
  const non0xVaultAddress = vaultAddress.replace(/^0x/, '').replace(/0x$/, '');
  const vaultToTraderIdMap = {
    // these are fake: 12352342, 345363453, 897164319
    ...VAULT_TO_TRADER_ID_MAP,
    // these are real
    // '6410359b6c2eacb40d3ff226b494ebd6dd54e3dc': '0x71744a6a0f3178224c8b245dac64a0d1ca1dd1dd39b7aa79875488816f9fd5fa', // Dynamic Vault
    fc2302b526ab06339116a70a6fd0218d12f18950: '0x71744a6a0f3178224c8b245dac64a0d1ca1dd1dd39b7aa79875488816f9fd5fa', // v0.1.12 Dynamic Vault
    c5b63afec2d2b68251c36476d6b798fc797a710f: await fetchVaultTraderId(
      rpcUrl,
      '0xc5b63afec2d2b68251c36476d6b798fc797a710f'
    ), // v0.1.14 Dynamic Vault
    non0xVaultAddress: await fetchVaultTraderId(rpcUrl, vaultAddress),
  };

  return vaultToTraderIdMap[non0xVaultAddress] || 'UNKNOWN-TRADER';
}

/**
 * Fetches the vault name from the vault address
 * @param {string} vaultAddress - Address of the vault
 * @returns {string} Name of the vault
 */
export async function getVaultName(vaultAddress) {
  // trim 0x from the start and end of the vault address
  const vaultToNameMap = {
    '0x12352342': 'AlphaVault',
    '0x345363453': 'CryptoNest',
    '0x897164319': 'TitanStore',
    '0xc5b63afec2d2b68251c36476d6b798fc797a710f': 'Dynamic Vault',
  };
  return vaultToNameMap[vaultAddress] || `Vault ${vaultAddress}`;
}

/**
 * Fetches all risk attestations for a specific trader ID or multiple trader IDs with date range filter
 * @param {Object} config - Configuration object
 * @param {string} config.graphqlEndpoint - GraphQL endpoint (optional)
 * @param {string|string[]} traderIds - Single Trader ID or an array of Trader IDs to fetch risk attestations for
 * @param {string} dateRange - Date range filter ('7D', '1M', '3M', '6M')
 * @returns {Promise<Array<{
 *   transactionHash: string,
 *   blockNumber: number,
 *   traderId: string,
 *   epoch: number,
 *   attester: string,
 *   data: number,
 *   parameterId: number,
 *   eventName: string,
 *   eventColor: string
 * }>>} Array of risk attestation events
 */
export async function fetchRiskAttestationsForTrader(config, traderIds, dateRange = DateRange.WEEK) {
  try {
    // Ensure traderIds is always an array for consistent handling
    const traderIdArray = Array.isArray(traderIds) ? traderIds : [traderIds];

    // Calculate timestamp for date range filter
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const startTimestamp = now - dateRange.seconds;
    const startHumanReadable = new Date(startTimestamp * 1000).toLocaleString();

    console.log(
      `[fetchRiskAttestationsForTrader] Fetching risk attestations for trader(s) ${traderIdArray.join(', ')} with date range ${dateRange} (from timestamp ${startHumanReadable} ${startTimestamp})`
    );

    let allRiskEvents = [];
    let skip = 0;
    const batchSize = 100; // Fetch 100 events at a time
    let hasMoreEvents = true;

    // Use pagination to fetch all risk events
    while (hasMoreEvents) {
      // Configure GraphQL parameters with traderId and timestamp filters
      const whereClause = {
        blockTimestamp_gte: startTimestamp,
      };

      // Use traderId_in if multiple IDs, otherwise use traderId
      if (traderIdArray.length > 1) {
        whereClause.traderId_in = traderIdArray.map((id) => id.toString());
      } else if (traderIdArray.length === 1) {
        whereClause.traderId = traderIdArray[0].toString();
      } else {
        // If traderIdArray is empty, maybe return early or log a warning?
        console.warn('[fetchRiskAttestationsForTrader] No trader IDs provided.');
        return [];
      }

      const graphQLParams = {
        graphqlEndpoint: config.graphqlEndpoint || DEFAULT_GRAPHQL_ENDPOINT,
        first: batchSize,
        skip,
        orderBy: { blockTimestamp: 'desc' }, // Order by timestamp instead of block number
        where: whereClause,
      };

      // Fetch events using GraphQL
      // eslint-disable-next-line no-await-in-loop
      const { riskEvents } = await fetchGraphQLAttestations(graphQLParams);

      // Add the new events to our collection
      allRiskEvents = [...allRiskEvents, ...riskEvents];

      // Log progress
      console.log(
        `[fetchRiskAttestationsForTrader] Fetched batch of ${riskEvents.length} risk events, total so far: ${allRiskEvents.length}`
      );

      // If we didn't get a full batch, we've reached the end
      if (riskEvents.length < batchSize) {
        hasMoreEvents = false;
      } else {
        // Update the skip value for the next query
        skip += batchSize;
      }
    }

    // Sort by epoch in descending order to show newest first
    // Note: If aggregating across traders, sorting solely by epoch might interleave events
    // from different timestamps if epochs overlap. Sorting by blockTimestamp might be more accurate globally.
    // Sticking with epoch sort for now as per previous logic.
    return allRiskEvents.sort((a, b) => b.epoch - a.epoch);
  } catch (error) {
    console.error('[fetchRiskAttestationsForTrader] Error:', error);
    throw error;
  }
}

/**
 * Fetches all consensus records (data and risk) for specific trader IDs with date range filter
 * @param {Object} config - Configuration object
 * @param {string} config.graphqlEndpoint - GraphQL endpoint (optional)
 * @param {string|string[]} traderIds - Single Trader ID or an array of Trader IDs to fetch consensus records for
 * @param {string} dateRange - Date range filter ('7D', '1M', '3M', '6M')
 * @returns {Promise<Array<Object>>} Array of consensus record events (both data and risk)
 */
export async function fetchRiskConsensusRecordsForTrader(traderIds, dateRange = DateRange.WEEK, config = {}) {
  try {
    // Ensure traderIds is always an array
    const traderIdArray = Array.isArray(traderIds) ? traderIds : [traderIds];

    // Calculate timestamp for date range filter
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const startTimestamp = now - dateRange.seconds;
    const startHumanReadable = new Date(startTimestamp * 1000).toLocaleString();

    console.log(
      `[fetchRiskConsensusRecordsForTrader] Fetching consensus records for trader(s) ${traderIdArray.join(', ')} with date range ${dateRange.key} (from timestamp ${startHumanReadable} ${startTimestamp})`
    );

    let allConsensusEvents = [];
    let skip = 0;
    const batchSize = 100; // Fetch 100 events at a time
    let hasMoreEvents = true;

    while (hasMoreEvents) {
      const whereClause = {
        blockTimestamp_gte: startTimestamp,
      };

      if (traderIdArray.length > 1) {
        whereClause.traderId_in = traderIdArray.map((id) => id.toString());
      } else if (traderIdArray.length === 1) {
        whereClause.traderId = traderIdArray[0].toString();
      } else {
        console.warn('[fetchRiskConsensusRecordsForTrader] No trader IDs provided.');
        return [];
      }

      const graphQLParams = {
        graphqlEndpoint: config.graphqlEndpoint || DEFAULT_GRAPHQL_ENDPOINT,
        first: batchSize,
        skip,
        orderBy: { blockTimestamp: 'desc' },
        where: whereClause,
      };

      // Fetch consensus events using GraphQL
      // eslint-disable-next-line no-await-in-loop
      const { consensusDataEvents, consensusRiskEvents } = await fetchGraphQLConsensusRecords(graphQLParams);

      const combinedEvents = [...consensusDataEvents, ...consensusRiskEvents];
      allConsensusEvents = [...allConsensusEvents, ...combinedEvents];

      console.log(
        `[fetchRiskConsensusRecordsForTrader] Fetched batch of ${combinedEvents.length} consensus events, total so far: ${allConsensusEvents.length}`
      );

      // Determine if more events might exist
      // If combined events fetched is less than batchSize, assume no more pages
      // Note: This might be slightly inaccurate if one type (data/risk) finishes before the other,
      // but it's a reasonable heuristic for pagination termination.
      if (combinedEvents.length < batchSize) {
        hasMoreEvents = false;
      } else {
        skip += batchSize;
      }
    }

    // Sort by block timestamp (or epoch, depending on desired final order)
    return allConsensusEvents.sort((a, b) => b.blockTimestamp - a.blockTimestamp); // Assuming blockTimestamp exists on formatted events
  } catch (error) {
    console.error('[fetchRiskConsensusRecordsForTrader] Error:', error);
    throw error;
  }
}
