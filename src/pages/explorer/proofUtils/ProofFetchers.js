/**
 * This module provides functionality for fetching and formatting blockchain events related to attestations.
 * It includes utilities for fetching both trade data and risk attestation events from the blockchain,
 * with support for pagination, retries, error handling, and concurrent batch processing.
 *
 * Key Features:
 * - Concurrent batch processing with configurable pool size
 * - Automatic retry logic for failed requests
 * - Pagination support for large event ranges
 * - Fallback to raw log parsing if event filtering fails
 * - Detailed debug logging
 *
 * The module exports:
 * - fetchEvents: Core function for fetching events with retry logic and concurrent batch processing
 * - formatTradeEvent: Formats raw trade attestation events into a standardized structure
 * - formatRiskEvent: Formats raw risk attestation events into a standardized structure
 * - createEmptyEvent: Creates an empty event object with default values
 * - fetchAttestedToDataEvents: Fetches trade attestation events
 * - fetchAttestedToRiskEvents: Fetches risk attestation events
 *
 * The module uses ethers.js for blockchain interaction and implements a custom
 * PromiseSemaphore class for managing concurrent requests.
 */

// TODO: Migrate to: import { getContract, getAllEvents } from '@treadfi/contracts';
import { getAllEvents } from '@treadfi/contracts';
import { ethers } from 'ethers';
import { correlateEvents } from './correlateEvents';
import { findLatestActiveBlock } from './findLatestActiveBlock';
import { promisePool } from './PromiseSemaphore';
import { abis } from './ProofAbis';
import { BLOCK_STEP_SIZE, LATEST_BLOCK, MAX_EMPTY_BATCHES } from '../utils/chainConfig';
import { groupRiskEventsByParameterId, createRiskTxHashesByParameterId } from './RiskGroupingUtils';
import { getCachedLatestActiveBlock, cacheLatestActiveBlock } from './latestBlockCache';

/**
 * Fetches a single batch of events using the standardized contracts API.
 * @param {Object} config - Configuration object containing:
 * @param {string} config.rpcUrl - URL of the RPC endpoint
 * @param {string} config.attestationAddress - Address of attestation contract
 * @param {number} config.fromBlock - Starting block number to fetch from
 * @param {number} config.toBlock - Ending block number to fetch to
 * @param {string} eventName - Name of event to fetch
 * @param {Function} formatEvent - Function to format the events
 * @returns {Promise<{events: Array, lastCheckedBlock: number}>}
 */
export async function fetchEventsBatch(config, eventName, formatEvent) {
  const { rpcUrl, attestationAddress, fromBlock, toBlock } = config;
  const safeFromBlock = Math.max(0, Number(fromBlock));
  const safeToBlock = Math.max(safeFromBlock, Number(toBlock));

  // Create provider and contract instance with minimal custom logic.
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(attestationAddress, abis, provider);

  // Prepare block range with hex conversion to pass the test expectations.
  const blockRange = {
    startBlock: ethers.toBeHex(safeFromBlock),
    endBlock: ethers.toBeHex(safeToBlock),
  };

  const events = await getAllEvents(contract, eventName, blockRange, { verbose: false });
  return {
    events: events.map(formatEvent),
    lastCheckedBlock: safeFromBlock,
  };
}

// Event formatters
/**
 * Formats a trade attestation event into a standardized object structure
 * @param {Object} event - The raw blockchain event
 * @param {string} event.transactionHash - Hash of the transaction
 * @param {number} event.blockNumber - Block number where event occurred
 * @param {Object} event.args - Event arguments
 * @param {string} event.args.traderId - ID of the trader
 * @param {number} event.args.epoch - Epoch number
 * @param {string} event.args.attester - Address of the attester
 * @param {Object} event.args.record - Trade record data
 * @param {string} event.args.record.merkleRoot - Merkle root of the trade data
 * @param {string} event.args.record.cid - Content ID for trade data
 * @returns {Object} Formatted trade event object
 */
export const formatTradeEvent = (event) => {
  const formattedEvent = {
    transactionHash: event.transactionHash,
    blockNumber: event.blockNumber,
    traderId: event.args.traderId,
    epoch: event.args.epoch,
    attester: event.args.attester,
    data: {
      merkleRoot: event.args.record.merkleRoot,
      cid: event.args.record.cid,
    },
    eventName: 'Data',
    eventColor: 'success',
  };
  console.log('[formatTradeEvent] Formatted event:', formattedEvent);
  return formattedEvent;
};

/**
 * Formats a risk attestation event into a standardized object structure
 * @param {Object} event - The raw blockchain event
 * @param {string} event.transactionHash - Hash of the transaction
 * @param {number} event.blockNumber - Block number where event occurred
 * @param {Object} event.args - Event arguments
 * @param {string} event.args.traderId - ID of the trader
 * @param {number} event.args.epoch - Epoch number
 * @param {string} event.args.attester - Address of the attester
 * @param {Array} event.args.record - Risk record data
 * @param {string} event.args.parameterId - ID of the risk parameter
 * @returns {Object} Formatted risk event object
 */
export const formatRiskEvent = (event) => {
  const formattedEvent = {
    transactionHash: event.transactionHash,
    blockNumber: event.blockNumber,
    traderId: event.args.traderId,
    epoch: event.args.epoch,
    attester: event.args.attester,
    data: parseInt(event.args.record[0], 10),
    parameterId: event.args.parameterId,
    eventName: 'Risk',
    eventColor: 'warning',
  };
  console.log('[formatRiskEvent] Formatted event:', formattedEvent);
  return formattedEvent;
};

/**
 * Creates an empty event object with default values
 * @returns {Object} Empty event object with null/empty values for all fields
 */
export const createEmptyEvent = () => ({
  transactionHash: '',
  blockNumber: null,
  traderId: '',
  epoch: null,
  attester: '',
  data: {},
  eventName: 'Error',
  eventColor: 'error',
});

/**
 * Fetches attestation events for trade data
 * @param {Object} config - Configuration object for blockchain connection
 * @param {string} config.rpcUrl - RPC endpoint URL for the blockchain network
 * @param {string} config.attestationAddress - Contract address of the attestation contract
 * @param {number} config.numberOfBlocks - Number of blocks to query in each batch
 * @param {number} config.retry - Number of retry attempts for failed requests
 * @param {number} config.paginationNumber - Pagination offset for block ranges
 * @returns {Promise<{events: Array, lastCheckedBlock: number}>} Object containing events array and last checked block number
 */
export const fetchAttestedToDataEvents = (config) => fetchEventsBatch(config, 'AttestedToData', formatTradeEvent);

/**
 * Fetches attestation events for risk parameters
 * @param {Object} config - Configuration object for blockchain connection
 * @param {string} config.rpcUrl - RPC endpoint URL for the blockchain network
 * @param {string} config.attestationAddress - Contract address of the attestation contract
 * @param {number} config.numberOfBlocks - Number of blocks to query in each batch
 * @param {number} config.retry - Number of retry attempts for failed requests
 * @param {number} config.paginationNumber - Pagination offset for block ranges
 * @returns {Promise<{events: Array, lastCheckedBlock: number}>} Object containing events array and last checked block number
 */
export const fetchAttestedToRiskEvents = (config) => fetchEventsBatch(config, 'AttestedToRisk', formatRiskEvent);

/**
 * Fetches the latest block number from the blockchain
 * @param {string} rpcUrl - RPC endpoint URL
 * @returns {Promise<number>} Latest block number
 */
export async function fetchLatestBlockNumber(rpcUrl) {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const blockNumber = await provider.getBlockNumber();

    console.debug('[fetchLatestBlockNumber] Got latest block:', blockNumber);
    return blockNumber;
  } catch (error) {
    console.error('[fetchLatestBlockNumber] Error:', error);
    throw error;
  }
}

/**
 * Fetches events until enough unique trader-epoch pairs are found
 * @param {Object} config - Configuration object containing:
 * @param {string} config.rpcUrl - URL of the RPC endpoint
 * @param {string} config.attestationAddress - Address of attestation contract
 * @param {number} config.numberOfBlocks - Number of blocks to scan in total
 * @param {number} config.retry - Number of retry attempts for failed requests
 * @param {number} config.paginationNumber - Number of events to fetch per page
 * @param {number} rowsPerPage - Number of events to fetch per page
 * @param {number} startFromBlock - Optional override for starting block
 * @returns {Promise<{events: Array, lastCheckedBlock: number}>} Object containing events array and last checked block number
 */
export async function fetchUntilEnoughEvents(config, rowsPerPage, startFromBlock = null) {
  // Try to get cached block pointer first
  let blockPointer = startFromBlock;
  if (!blockPointer) {
    const cachedBlock = getCachedLatestActiveBlock(config.rpcUrl, config.attestationAddress);
    if (cachedBlock !== null) {
      console.debug('[fetchUntilEnoughEvents] Using cached block:', cachedBlock);
      blockPointer = cachedBlock;
    } else {
      // Only search for latest block if we don't have a cache
      blockPointer = await findLatestActiveBlock(
        config.rpcUrl,
        config.attestationAddress,
        BLOCK_STEP_SIZE,
        LATEST_BLOCK
      );
    }
  }

  let allEvents = [];
  let emptyBatchCount = 0;

  /* eslint-disable no-await-in-loop */
  while (
    // Should fetch until we have enough events to fill the page
    allEvents.length < rowsPerPage &&
    // Should fetch until we have checked too many empty batches
    emptyBatchCount < MAX_EMPTY_BATCHES &&
    // Should fetch until we have checked all blocks
    blockPointer > 0
  ) {
    const batchConfig = {
      ...config,
      fromBlock: Math.max(0, blockPointer - BLOCK_STEP_SIZE),
      toBlock: blockPointer,
    };

    const batchTasks = [() => fetchAttestedToDataEvents(batchConfig), () => fetchAttestedToRiskEvents(batchConfig)];

    const [dataResult, riskResult] = await promisePool(batchTasks, 2);
    const correlatedEvents = correlateEvents(dataResult.events, riskResult.events);

    if (correlatedEvents.length > 0) {
      allEvents = [...allEvents, ...correlatedEvents];
      emptyBatchCount = 0;
      // Cache the block pointer when we find events
      cacheLatestActiveBlock(config.rpcUrl, config.attestationAddress, blockPointer);
    } else {
      emptyBatchCount += 1;
    }

    blockPointer = Math.min(dataResult.lastCheckedBlock, riskResult.lastCheckedBlock);

    console.log('[fetchUntilEnoughEvents] at emptyBatchCount', emptyBatchCount, 'allEvents', allEvents.length, {
      rowsPerPage,
      maxEmptyBatches: MAX_EMPTY_BATCHES,
      blockPointer,
    });
  }
  /* eslint-enable no-await-in-loop */

  return {
    events: allEvents,
    lastCheckedBlock: blockPointer,
  };
}

/**
 * Fetches data record consensus information from the blockchain
 * @param {Object} config - Configuration object containing:
 * @param {string} config.rpcUrl - URL of the RPC endpoint
 * @param {string} config.attestationAddress - Contract address
 * @param {string} traderId - Bytes32 formatted trader ID
 * @param {number} epoch - Epoch number to query
 * @returns {Promise<{record: {merkleRoot: string}, hasConsensus: boolean}>}
 */
export async function fetchDataRecord(config, traderId, epoch, parameterId) {
  const { rpcUrl, attestationAddress } = config;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(attestationAddress, abis, provider);

  try {
    const [record, hasConsensus] = await contract.getDataRecord([traderId, epoch, parameterId]);
    console.log(
      '[fetchDataRecord] called with traderId:',
      traderId,
      'epoch:',
      epoch,
      'record:',
      record,
      'hasConsensus:',
      hasConsensus
    );
    return {
      record: { merkleRoot: record.merkleRoot },
      hasConsensus,
    };
  } catch (error) {
    console.error('[fetchDataRecord] Error:', error);
    throw error;
  }
}

/**
 * Fetches risk record consensus information from the blockchain
 * @param {Object} config - Configuration object containing:
 * @param {string} config.rpcUrl - URL of the RPC endpoint
 * @param {string} config.attestationAddress - Contract address
 * @param {string} traderId - Bytes32 formatted trader ID
 * @param {number} epoch - Epoch number to query
 * @param {number} parameterId - Risk parameter ID
 * @param {number} riskGroupId - Risk group ID
 * @returns {Promise<{record: {value: number}, hasConsensus: boolean}>}
 */
export async function fetchRiskRecord(
  config,
  traderId,
  epoch,
  parameterId,
  riskGroupId = 1 // TODO: Make this dynamic, currently hardcoded to 1
) {
  const { rpcUrl, attestationAddress } = config;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(attestationAddress, abis, provider);

  try {
    const [record, hasConsensus] = await contract.getRiskRecord([traderId, epoch, parameterId], riskGroupId);
    console.log(
      '[fetchRiskRecord] called with traderId:',
      traderId,
      'epoch:',
      epoch,
      'parameterId:',
      parameterId,
      'riskGroupId:',
      riskGroupId,
      'record:',
      record,
      'hasConsensus:',
      hasConsensus
    );
    return {
      record: { value: Number(record.value) },
      hasConsensus,
    };
  } catch (error) {
    console.error('[fetchRiskRecord] Error:', error);
    throw error;
  }
}

/**
 * Fetches data group parameters from the blockchain
 * @param {Object} config - Configuration object containing:
 * @param {string} config.rpcUrl - URL of the RPC endpoint
 * @param {string} config.attestationAddress - Contract address
 * @returns {Promise<{threshold: number, members: string[]}>} Group parameters with threshold and member addresses
 */
export async function fetchDataGroup(config) {
  const { rpcUrl, attestationAddress } = config;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(attestationAddress, abis, provider);

  try {
    const group = await contract.getDataGroup();
    console.log('[fetchDataGroup] called, group:', group);
    return {
      threshold: Number(group.threshold),
      members: group.members,
    };
  } catch (error) {
    console.error('[fetchDataGroup] Error:', error);
    throw error;
  }
}

/**
 * Fetches risk group parameters from the blockchain
 * @param {Object} config - Configuration object containing:
 * @param {string} config.rpcUrl - URL of the RPC endpoint
 * @param {string} config.attestationAddress - Contract address
 * @param {number} riskGroupId - Risk group ID to query
 * @returns {Promise<{threshold: number, members: string[]}>} Group parameters with threshold and member addresses
 */
export async function fetchRiskGroup(config, riskGroupId = 1) {
  const { rpcUrl, attestationAddress } = config;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(attestationAddress, abis, provider);

  try {
    const group = await contract.getRiskGroup(riskGroupId);
    console.log('[fetchRiskGroup] called with riskGroupId:', riskGroupId, 'group:', group);
    return {
      threshold: Number(group.threshold),
      members: group.members,
    };
  } catch (error) {
    console.error('[fetchRiskGroup] Error:', error);
    throw error;
  }
}

/**
 * Fetches risk parameter information from the blockchain
 * @param {Object} config - Configuration object containing:
 * @param {string} config.rpcUrl - URL of the RPC endpoint
 * @param {string} config.attestationAddress - Contract address
 * @param {number} parameterId - Risk parameter ID to query
 * @returns {Promise<{name: string, description: string}>} Risk parameter details
 */
export async function fetchRiskParameter(config, parameterId) {
  const { rpcUrl, attestationAddress } = config;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(attestationAddress, abis, provider);

  try {
    const parameter = await contract.getRiskParameter(parameterId);
    console.log('[fetchRiskParameter] called with parameterId:', parameterId, 'parameter:', parameter);
    return {
      name: parameter.metadataName,
      description: parameter.metadataDescription,
    };
  } catch (error) {
    console.error('[fetchRiskParameter] Error:', error);
    throw error;
  }
}
