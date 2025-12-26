import { useState, useEffect, useContext } from 'react';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { fetchDataGroup, fetchDataRecord, formatTradeEvent } from '@/pages/explorer/proofUtils/ProofFetchers';
import {
  createProviderAndContract,
  processTransactions,
  fetchAndProcessConsensus,
  handleError,
} from '@/pages/explorer/proofUtils/ConsensusUtils';

/**
 * Aggregates merkle roots from data events and determines consensus
 * @param {Array<Object>} dataEvents - Array of data events to aggregate
 * @param {Object} dataConsensus - Consensus data from the blockchain
 * @returns {Object|null} Aggregated consensus information or null if no events
 */
export function aggregateDataConsensus(dataEvents, dataConsensus) {
  if (!dataEvents || dataEvents.length === 0) {
    return null;
  }

  // Count occurrences of each merkle root
  const merkleRootCounts = dataEvents.reduce((acc, event) => {
    const merkleRoot = event.data?.merkleRoot;
    if (merkleRoot) {
      acc[merkleRoot] = (acc[merkleRoot] || 0) + 1;
    }
    return acc;
  }, {});

  // Find the merkle root with the highest count
  let highestCount = 0;
  let mostCommonMerkleRoot = null;
  const totalEvents = dataEvents.length;

  Object.entries(merkleRootCounts).forEach(([merkleRoot, count]) => {
    if (count > highestCount) {
      highestCount = count;
      mostCommonMerkleRoot = merkleRoot;
    }
  });

  return {
    merkleRoot: mostCommonMerkleRoot,
    count: highestCount,
    total: totalEvents,
    hasConsensus: dataConsensus?.hasConsensus || false,
  };
}

/**
 * Fetches consensus data for a given event
 * @param {Object} config - Configuration object
 * @param {Object} event - Event to fetch consensus for
 * @returns {Object} Consensus data
 */
async function fetchConsensusData(config, event) {
  if (!event?.traderId || !event?.epoch || event?.parameterId === null || event?.parameterId === undefined) {
    console.error('[useDataConsensus] Invalid event for fetching consensus data', event);
    return { hasConsensus: false };
  }
  return fetchDataRecord(config, event.traderId, event.epoch, event.parameterId);
}

/**
 * Fetches data group information
 * @param {Object} config - Configuration object
 * @param {Function} setDataGroup - State setter for data group
 */
async function fetchGroupData(config, setDataGroup) {
  try {
    const groupData = await fetchDataGroup(config);
    setDataGroup(groupData);
  } catch (err) {
    console.error('[useDataConsensus] Failed to fetch data group:', err);
  }
}

/**
 * Hook to fetch and aggregate proof details from multiple transactions
 * @param {Array<string>} txHashes - Array of transaction IDs to fetch
 * @param {Object} config - Configuration object containing RPC and contract details
 * @returns {Object} Object containing proof details and state
 */
function useDataConsensus(txHashes, config = {}) {
  const [dataEvents, setDataEvents] = useState([]);
  const [dataConsensus, setDataConsensus] = useState(null);
  const [aggregatedConsensus, setAggregatedConsensus] = useState(null);
  const [dataGroup, setDataGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showAlert } = useContext(ErrorContext);

  useEffect(() => {
    // Early return if no transaction hashes provided
    if (!txHashes || txHashes.length === 0) {
      setLoading(false);
      return;
    }

    const fetchAllProofData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { provider, contract } = createProviderAndContract(config);

        // Check if provider and contract are valid
        if (!provider || !contract) {
          throw new Error('Invalid provider or contract configuration');
        }

        // Fetch data group information
        await fetchGroupData(config, setDataGroup);

        // Process each transaction hash
        const validEvents = await processTransactions(txHashes, provider, contract, 'AttestedToData', formatTradeEvent);
        setDataEvents(validEvents);

        // Fetch consensus data if we have valid events
        if (validEvents.length > 0) {
          await fetchAndProcessConsensus(
            config,
            validEvents,
            setDataConsensus,
            setAggregatedConsensus,
            fetchConsensusData,
            aggregateDataConsensus
          );
        }
      } catch (err) {
        handleError(err, setError, showAlert, 'useDataConsensus');
      } finally {
        setLoading(false);
      }
    };

    fetchAllProofData();
  }, [txHashes, config, showAlert]);

  return {
    dataEvents,
    dataConsensus,
    aggregatedConsensus,
    dataGroup,
    loading,
    error,
  };
}

export default useDataConsensus;
