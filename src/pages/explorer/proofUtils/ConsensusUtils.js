/**
 * Shared utility functions for consensus-related hooks
 * Contains extracted common functionality from useDataConsensus and useRiskConsensus
 * This file focuses on consensus-specific utilities and leverages ProofFetchers.js for blockchain operations
 */

import { ethers } from 'ethers';
import { abis } from './ProofAbis';

/**
 * Creates an Ethereum provider and contract instance
 * @param {Object} config - Configuration with RPC URL and contract address
 * @returns {Object} Object containing provider and contract
 */
export function createProviderAndContract(config) {
  if (!config || !config.rpcUrl || !config.attestationAddress) {
    console.error('[useConsensus] Invalid config for provider or contract', config);
    return { provider: null, contract: null };
  }

  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const contract = new ethers.Contract(config.attestationAddress, abis, provider);
  return { provider, contract };
}

/**
 * Processes a transaction receipt to extract event data
 * @param {Object} receipt - Transaction receipt
 * @param {Object} contract - Ethers contract instance
 * @param {string} txHash - Transaction hash
 * @param {string} eventName - Name of event to look for
 * @param {Function} formatEventFn - Function to format the event
 * @returns {Object|null} Formatted event or null if invalid
 */
export function processTransactionReceipt(receipt, contract, txHash, eventName, formatEventFn) {
  if (!receipt || !contract) {
    return null;
  }

  const parsedLogs = receipt.logs
    .map((log) => {
      try {
        return contract.interface.parseLog(log);
      } catch (e) {
        console.error(`[useConsensus] Error parsing log:`, e);
        return null;
      }
    })
    .filter(Boolean);

  if (parsedLogs.length === 0) {
    return null;
  }

  const eventLog = parsedLogs[0];

  // We're only interested in specific events
  if (eventLog.name !== eventName) {
    return null;
  }

  return formatEventFn({
    ...eventLog,
    transactionHash: txHash,
    blockNumber: receipt.blockNumber,
  });
}

/**
 * Processes multiple transactions to extract event data
 * @param {Array<string>} txHashes - Transaction hashes to process
 * @param {Object} provider - Ethers provider
 * @param {Object} contract - Ethers contract
 * @param {string} eventName - Name of event to look for
 * @param {Function} formatEventFn - Function to format events
 * @returns {Array<Object>} Array of valid events
 */
export async function processTransactions(txHashes, provider, contract, eventName, formatEventFn) {
  if (!provider || !contract) {
    console.error('[useConsensus] Invalid provider or contract');
    return [];
  }

  const eventsPromises = txHashes.map(async (txHash) => {
    try {
      const receipt = await provider.getTransactionReceipt(txHash);
      return processTransactionReceipt(receipt, contract, txHash, eventName, formatEventFn);
    } catch (err) {
      console.error(`[useConsensus] Error processing tx ${txHash}:`, err);
      return null;
    }
  });

  // Wait for all promises to resolve
  const resolvedEvents = await Promise.all(eventsPromises);
  return resolvedEvents.filter(Boolean);
}

/**
 * Fetches and processes consensus data
 * @param {Object} config - Configuration object
 * @param {Array<Object>} validEvents - Valid events to process
 * @param {Function} setConsensus - State setter for consensus
 * @param {Function} setAggregatedConsensus - State setter for aggregated consensus
 * @param {Function} fetchConsensusFn - Function to fetch consensus data
 * @param {Function} aggregateConsensusFn - Function to aggregate consensus data
 */
export async function fetchAndProcessConsensus(
  config,
  validEvents,
  setConsensus,
  setAggregatedConsensus,
  fetchConsensusFn,
  aggregateConsensusFn
) {
  if (!validEvents || validEvents.length === 0) {
    console.warn('[useConsensus] No valid events to process');
    return;
  }

  try {
    // Use the first event to fetch consensus data
    const firstEvent = validEvents[0];
    const consensusData = await fetchConsensusFn(config, firstEvent);
    setConsensus(consensusData);

    // Aggregate consensus data
    const aggregated = aggregateConsensusFn(validEvents, consensusData);
    setAggregatedConsensus(aggregated);
  } catch (err) {
    console.error('[useConsensus] Failed to fetch consensus data:', err);
  }
}

/**
 * Handles errors in the data fetching process
 * @param {Error} err - Error object
 * @param {Function} setError - State setter for error
 * @param {Function} showAlert - Function to show alert
 * @param {string} prefix - Logger prefix
 */
export function handleError(err, setError, showAlert, prefix = 'useConsensus') {
  const errorMsg = err.message || 'Failed to fetch details';
  console.error(`[${prefix}] Error:`, errorMsg, err);
  setError(errorMsg);
  if (showAlert) {
    showAlert({
      severity: 'error',
      message: errorMsg,
    });
  }
}
