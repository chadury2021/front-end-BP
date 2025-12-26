import { useState, useEffect, useContext } from 'react';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import {
  fetchRiskGroup,
  fetchRiskRecord,
  formatRiskEvent,
  fetchRiskParameter,
} from '@/pages/explorer/proofUtils/ProofFetchers';
import {
  createProviderAndContract,
  processTransactions,
  fetchAndProcessConsensus,
  handleError,
} from '@/pages/explorer/proofUtils/ConsensusUtils';

/**
 * Aggregates risk values from risk events and determines consensus
 * @param {Array<Object>} riskEvents - Array of risk events to aggregate
 * @param {Object} riskConsensus - Consensus data from the blockchain
 * @returns {Object|null} Aggregated consensus information or null if no events
 */
export function aggregateRiskConsensus(riskEvents, riskConsensus) {
  if (!riskEvents || riskEvents.length === 0) {
    return null;
  }

  // Count occurrences of each risk value
  const riskValueCounts = riskEvents.reduce((acc, event) => {
    const value = event.data;
    if (value !== undefined) {
      acc[value] = (acc[value] || 0) + 1;
    }
    return acc;
  }, {});

  // Find the risk value with the highest count
  let highestCount = 0;
  let mostCommonValue = null;
  const totalEvents = riskEvents.length;

  Object.entries(riskValueCounts).forEach(([value, count]) => {
    if (count > highestCount) {
      highestCount = count;
      mostCommonValue = Number(value);
    }
  });

  return {
    value: mostCommonValue,
    count: highestCount,
    total: totalEvents,
    hasConsensus: riskConsensus?.hasConsensus || false,
  };
}

/**
 * Fetches consensus data for a given risk event
 * @param {Object} config - Configuration object
 * @param {Object} event - Event to fetch consensus for
 * @returns {Object} Consensus data
 */
async function fetchConsensusData(config, event) {
  if (!event?.traderId || !event?.epoch || event?.parameterId === null || event?.parameterId === undefined) {
    console.error('[useRiskConsensus] Invalid event for fetching consensus data', event);
    return { hasConsensus: false };
  }

  return fetchRiskRecord(config, event.traderId, event.epoch, event.parameterId);
}

/**
 * Fetches risk group information
 * @param {Object} config - Configuration object
 * @param {Function} setRiskGroup - State setter for risk group
 */
async function fetchGroupData(config, setRiskGroup) {
  try {
    const groupData = await fetchRiskGroup(config);
    setRiskGroup(groupData);
  } catch (err) {
    console.error('[useRiskConsensus] Failed to fetch risk group:', err);
  }
}

/**
 * Hook to fetch and aggregate risk proof details from multiple transactions
 * @param {Array<string>} txHashes - Array of transaction IDs to fetch
 * @param {Object} config - Configuration object containing RPC and contract details
 * @param {string} parameterId - Parameter ID for the risk events
 * @param {Array<Object>} providedRiskEvents - Optional pre-fetched risk events
 * @returns {Object} Object containing proof details and state
 */
function useRiskConsensus({
  config, parameterId, providedRiskEvents = []
}) {
  const [riskEvents, setRiskEvents] = useState(providedRiskEvents);
  const [riskConsensus, setRiskConsensus] = useState(null);
  const [aggregatedConsensus, setAggregatedConsensus] = useState(null);
  const [riskGroup, setRiskGroup] = useState(null);
  const [parameterName, setParameterName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showAlert } = useContext(ErrorContext);

  useEffect(() => {
    const txHashes = providedRiskEvents.map((event) => event.transactionHash);

    // Early return if no transaction hashes provided and no provided events
    if ((!txHashes || txHashes.length === 0) && (!providedRiskEvents || providedRiskEvents.length === 0)) {
      setLoading(false);
      return;
    }

    const fetchAllProofData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch risk group information even if using provided events
        await fetchGroupData(config, setRiskGroup);

        // Don't fetch parameter name if parameterId is not a number
        console.debug('[useRiskConsensus] parameterId:', parameterId);
        if (!Number.isNaN(parseInt(parameterId, 10))) {
          setParameterName(`Parameter #${parameterId}`);
        }
        // Fetch parameter name if parameterId is a number
        try {
          const parameterData = await fetchRiskParameter(config, parameterId);
          setParameterName(parameterData?.name || `Parameter ${parameterId}`);
          console.log(
            '[useRiskConsensus] Parameter name:',
            parameterData?.name,
            'Description:',
            parameterData?.description
          );
        } catch (paramErr) {
          console.error('[useRiskConsensus] Failed to fetch parameter name:', paramErr);
          setParameterName(`Parameter ${parameterId}`);
        }

        // If we have provided risk events, use them instead of fetching
        let validEvents = providedRiskEvents;

        // Only create provider and contract and fetch events if we don't have provided events
        if (!providedRiskEvents || providedRiskEvents.length === 0) {
          const { provider, contract } = createProviderAndContract(config);
          if (!provider || !contract) {
            throw new Error('Invalid provider or contract configuration');
          }

          // Process each transaction hash
          validEvents = await processTransactions(txHashes, provider, contract, 'AttestedToRisk', formatRiskEvent);
          setRiskEvents(validEvents);
        }

        // Fetch consensus data if we have valid events
        if (validEvents.length > 0) {
          await fetchAndProcessConsensus(
            config,
            validEvents,
            setRiskConsensus,
            setAggregatedConsensus,
            fetchConsensusData,
            aggregateRiskConsensus
          );
        }
      } catch (err) {
        handleError(err, setError, showAlert, 'useRiskConsensus');
      } finally {
        setLoading(false);
      }
    };

    fetchAllProofData();
  }, [config, showAlert, providedRiskEvents]);

  return {
    riskEvents,
    riskConsensus,
    aggregatedConsensus,
    riskGroup,
    parameterName,
    loading,
    error,
  };
}

export default useRiskConsensus;
