import { fetchRiskParameter } from '@/pages/explorer/proofUtils/ProofFetchers';
import { DEFAULT_GRAPHQL_ENDPOINT, fetchGraphQLConsensusRecords } from '@/pages/explorer/proofUtils/ProofGraphQL';
import { selectConfig } from '@/pages/explorer/utils/chainConfig';
import { getEpochStartAndEnd } from '@/pages/explorer/utils/epoch';
import { useEffect, useState } from 'react';
import { DateRange } from '@/pages/points/DateRangePicker';
import { fetchRiskAttestationsForTrader, fetchRiskConsensusRecordsForTrader } from './VaultFetchers';
import { HARDCODED_TRADER_IDS } from './consts';
import { sumTraderAttestations } from './sumTraderAttestations';

// Helper function to convert epoch to timestamp
const getTimestampFromEpoch = (epoch) => {
  const [startTime] = getEpochStartAndEnd(epoch);
  return startTime * 1000; // Convert to milliseconds for JavaScript Date
};

// Convert event data to include timestamps
const convertEventsWithTimestamp = (events) => {
  return events.map((event) => ({
    ...event,
    timestamp: getTimestampFromEpoch(event.epoch),
  }));
};

// Hardcoded data structure for market data
export const hardcodedGroupedEvents = {
  market_pnl: {
    events: convertEventsWithTimestamp([
      { epoch: 1, data: 0 },
      { epoch: 2, data: 0.2 },
      { epoch: 3, data: 0.3 },
      { epoch: 4, data: -0.1 },
      { epoch: 5, data: 0.4 },
      { epoch: 6, data: 0 },
      { epoch: 7, data: -0.3 },
      { epoch: 8, data: 0.7 },
      { epoch: 9, data: 0.5 },
    ]),
    metadata: {
      name: 'Market PnL',
      description: 'Market profit and loss over time',
      currentValue: '$50.83M',
    },
  },
  market_exposure: {
    events: convertEventsWithTimestamp([
      { epoch: 1, data: -2800000 },
      { epoch: 2, data: 12500000 },
      { epoch: 3, data: 45100000 },
      { epoch: 4, data: -17200000 },
      { epoch: 5, data: 62900000 },
      { epoch: 6, data: -9800000 },
      { epoch: 7, data: 37400000 },
      { epoch: 8, data: 2100000 },
      { epoch: 9, data: 8000000 },
    ]),
    metadata: {
      name: 'Market Exposure',
      description: 'Current market exposure',
      currentValue: '$100',
    },
  },
  turnover: {
    events: convertEventsWithTimestamp([
      { epoch: 1, data: 0.5 },
      { epoch: 2, data: 0.6 },
      { epoch: 3, data: 0.7 },
      { epoch: 4, data: 0.8 },
      { epoch: 5, data: 0.9 },
      { epoch: 6, data: 0.8 },
      { epoch: 7, data: 0.7 },
      { epoch: 8, data: 0.6 },
      { epoch: 9, data: 0.5 },
    ]),
    metadata: {
      name: 'Turnover',
      description: 'Asset turnover rate',
      currentValue: '3.5x',
    },
  },
};

export const hardcodedRiskStats = {
  conentration_risk: '45.5%',
  max_drawdown: '4.35%',
  leverage: '3.5x',
};

/**
 * Custom hook that fetches trader risk attestations and consensus records, and sums them by parameter
 * @param {string[]} traderIds - The trader IDs to fetch attestations for
 * @param {string} dateRange - Date range filter ('7D', '1M', '3M', '6M')
 * @returns {Object} Object containing the following properties:
 * @returns {boolean} loading - Indicates if fetch is in progress
 * @returns {Error|null} error - Error object if fetch failed, null otherwise
 * @returns {Array<Object>} events - All attestation events from fetchRiskAttestationsForTrader
 * @returns {Array<Object>} consensusEvents - All consensus risk events fetched
 * @returns {Object<string, Object>} groupedEvents - Attestation events grouped by parameterId, including metadata
 * @returns {Object<string, Object>} groupedConsensusEvents - Consensus events grouped by parameterId
 * @returns {Object<string, Object>} parameterStats - Stats calculated from all attestations for each parameter
 * @returns {Object<string, Object>} consensusParameterStats - Stats calculated from consensus events for each parameter
 * @returns {number} totalCount - Total number of attestation events
 * @returns {number} totalConsensusCount - Total number of consensus events
 * @returns {Function} fetchAttestations - Function to manually trigger fetching attestations
 * @returns {Object<string, Object>} namedEvents - Attestation events grouped by metadata name
 * @returns {Object<string, Object>} namedConsensusEvents - Consensus events grouped by metadata name
 */
export function useTraderSum(traderIds, dateRange = DateRange.WEEK) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [consensusEvents, setConsensusEvents] = useState([]); // State for consensus events
  const [groupedEvents, setGroupedEvents] = useState({});
  const [groupedConsensusEvents, setGroupedConsensusEvents] = useState({}); // State for grouped consensus
  const [namedEvents, setNamedEvents] = useState({});
  const [parameterStats, setParameterStats] = useState({});
  const [consensusParameterStats, setConsensusParameterStats] = useState({}); // State for consensus stats
  const [totalCount, setTotalCount] = useState(0);
  const [totalConsensusCount, setTotalConsensusCount] = useState(0); // State for consensus count
  const [namedConsensusEvents, setNamedConsensusEvents] = useState({}); // State for named consensus

  // Ensure traderIds is always an array for consistent handling
  const traderIdArray = Array.isArray(traderIds)
    ? traderIds
    : [traderIds].filter((id) => id && id !== 'UNKNOWN-TRADER');

  // Check if this is a hardcoded trader ID - only applies if a SINGLE known hardcoded ID is passed
  const isHardcodedTrader = traderIdArray.length === 1 && HARDCODED_TRADER_IDS.includes(traderIdArray[0]);

  /**
   * Fetches metadata for a list of parameter IDs
   * @param {string[]} parameterIds - List of parameter IDs to fetch metadata for
   * @returns {Promise<{[paramId: string]: {
   *   name: string,
   *   description: string
   * }}>} Map of parameter IDs to their metadata
   */
  const fetchParameterMetadata = async (parameterIds) => {
    const config = await selectConfig();
    const metadataMap = {};

    await Promise.all(
      parameterIds.map(async (paramId) => {
        try {
          const metadata = await fetchRiskParameter(config, paramId);
          metadataMap[paramId] = metadata;
        } catch (err) {
          console.error(`[useTraderSum] Error fetching metadata for parameter ${paramId}:`, err);
          metadataMap[paramId] = { name: `Parameter ${paramId}`, description: '' };
        }
      })
    );

    return metadataMap;
  };

  /**
   * Fetches attestation and consensus data for the trader and updates component state
   * This function has side effects - it calls state setters
   * @returns {Promise<Object|undefined>} Updated data object or undefined on error/skip
   */
  const fetchAttestations = async () => {
    // For hardcoded traders, just return the hardcoded data immediately
    // Only applies if a single, specific hardcoded ID is provided
    if (isHardcodedTrader) {
      return {
        events: Object.values(hardcodedGroupedEvents).flatMap((group) => group.events),
        consensusEvents: [],
        groupedEvents: hardcodedGroupedEvents,
        groupedConsensusEvents: {},
        parameterStats: hardcodedRiskStats,
        consensusParameterStats: {},
        totalCount: Object.values(hardcodedGroupedEvents).reduce((acc, group) => acc + group.events.length, 0),
        totalConsensusCount: 0,
        namedEvents: {},
        namedConsensusEvents: {},
      };
    }

    // Original fetching logic
    if (traderIdArray.length === 0) {
      console.log('[useTraderSum] Skipping fetch - no valid traderIds provided:', traderIds);
      // Reset state if no valid IDs
      setLoading(false);
      setError(null);
      setEvents([]);
      setConsensusEvents([]);
      setGroupedEvents({});
      setGroupedConsensusEvents({});
      setParameterStats({});
      setConsensusParameterStats({});
      setTotalCount(0);
      setTotalConsensusCount(0);
      setNamedEvents({});
      setNamedConsensusEvents({});
      return undefined;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(
        `[useTraderSum] Fetching attestations and consensus for traderId(s): ${traderIdArray.join(
          ', '
        )}, dateRange: ${dateRange}`
      );

      // Configuration for GraphQL endpoint
      const config = { graphqlEndpoint: DEFAULT_GRAPHQL_ENDPOINT };

      // Fetch both risk attestations and consensus risk records concurrently
      const [fetchedEvents, fetchedConsensusEvents] = await Promise.all([
        fetchRiskAttestationsForTrader(config, traderIdArray, dateRange),
        fetchRiskConsensusRecordsForTrader(traderIdArray, dateRange, config),
      ]);

      // Add timestamps to fetched attestation events
      const eventsWithTimestamps = fetchedEvents.map((event) => ({
        ...event,
        timestamp: getTimestampFromEpoch(event.epoch),
      }));

      // Add timestamps to fetched consensus events (assuming epoch exists and is needed)
      const consensusEventsWithTimestamps = fetchedConsensusEvents.map((event) => ({
        ...event,
        timestamp: getTimestampFromEpoch(event.epoch),
      }));

      // Filter consensus events to only include those with a parameterId (i.e., Risk Consensus)
      const riskConsensusEventsOnly = consensusEventsWithTimestamps.filter((event) => event.parameterId !== undefined);

      // Process events with sumTraderAttestations, passing attestations and filtered consensus
      const {
        groupedByParameter: fetchedGroupedByParameter,
        parameterStats: fetchedParameterStats,
        groupedConsensusByParameter: fetchedGroupedConsensus, // Get grouped consensus
        consensusParameterStats: fetchedConsensusStats, // Get consensus stats
      } = sumTraderAttestations(eventsWithTimestamps, riskConsensusEventsOnly); // Pass filtered consensus events

      // Fetch metadata for all unique parameter IDs found in attestations
      // (Consensus events should use the same parameter IDs)
      const parameterIds = Object.keys(fetchedGroupedByParameter);
      const metadataMap = await fetchParameterMetadata(parameterIds);

      // Combine attestation events with metadata
      const enhancedGroups = Object.entries(fetchedGroupedByParameter).reduce((acc, [paramId, e]) => {
        // Add currentValue to metadata based on the latest event or a default value
        const latestEvent = e.length > 0 ? e[e.length - 1] : null;
        const currentValue = latestEvent
          ? `$${Math.abs(latestEvent.data).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '$0';

        acc[paramId] = {
          events: e,
          metadata: {
            ...metadataMap[paramId],
            // This is for VaultComponents.MarketDataComponent.jsx
            // to get the current value
            currentValue,
          },
        };
        // Need to recalculate currentValue based on latest attestation event 'e'
        const latestEventEnhanced = e.length > 0 ? e.sort((a, b) => b.epoch - a.epoch)[0] : null;
        const currentValueEnhanced = latestEventEnhanced
          ? `$${Math.abs(latestEventEnhanced.data).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '$0';
        acc[paramId].metadata.currentValue = currentValueEnhanced;

        return acc;
      }, {});

      // Combine attestation events by name from metadata
      const namedGroups = Object.entries(fetchedGroupedByParameter).reduce((acc, [paramId, e]) => {
        const metadata = metadataMap[paramId];
        const name = metadata?.name || `Parameter ${paramId}`; // Use metadata name or default
        const current = acc[name] || { events: [], metadata: metadataMap[paramId] }; // Store metadata with named group

        acc[name] = {
          ...current,
          events: [...current.events, ...e],
        };
        return acc;
      }, {});

      // Combine consensus events by name from metadata
      const calculatedNamedConsensusEvents = Object.entries(fetchedGroupedConsensus).reduce((acc, [paramId, e]) => {
        const metadata = metadataMap[paramId];
        const name = metadata?.name || `Parameter ${paramId}`;
        const current = acc[name] || { events: [], metadata: metadataMap[paramId] };

        acc[name] = {
          ...current,
          events: [...current.events, ...e],
        };
        return acc;
      }, {});

      // Update state with fetched data
      setEvents(eventsWithTimestamps);
      setConsensusEvents(riskConsensusEventsOnly); // Set consensus events state
      setGroupedEvents(enhancedGroups);
      setGroupedConsensusEvents(fetchedGroupedConsensus); // Set grouped consensus state
      setNamedEvents(namedGroups);
      setParameterStats(fetchedParameterStats);
      setConsensusParameterStats(fetchedConsensusStats); // Set consensus stats state
      setTotalCount(eventsWithTimestamps.length);
      setTotalConsensusCount(riskConsensusEventsOnly.length); // Set consensus count state
      setNamedConsensusEvents(calculatedNamedConsensusEvents); // Set named consensus events state

      // Log the results
      console.log(`[useTraderSum] Total attestations: ${eventsWithTimestamps.length}`);
      console.log(`[useTraderSum] Total consensus records: ${riskConsensusEventsOnly.length}`); // Log consensus count

      // Log counts by parameter for attestations
      Object.entries(fetchedParameterStats).forEach(([paramId, stats]) => {
        const metadata = metadataMap[paramId];
        console.log(`[useTraderSum] ${metadata?.name || `Parameter ${paramId}`}: ${stats.count} events`);
      });
      // Log counts by parameter for consensus
      Object.entries(fetchedConsensusStats).forEach(([paramId, stats]) => {
        const metadata = metadataMap[paramId];
        console.log(`[useTraderSum] Consensus ${metadata?.name || `Parameter ${paramId}`}: ${stats.count} records`);
      });

      // Create result object for consistent return
      return {
        events: eventsWithTimestamps,
        consensusEvents: riskConsensusEventsOnly,
        groupedEvents: enhancedGroups,
        groupedConsensusEvents: fetchedGroupedConsensus,
        parameterStats: fetchedParameterStats,
        consensusParameterStats: fetchedConsensusStats,
        totalCount: eventsWithTimestamps.length,
        totalConsensusCount: riskConsensusEventsOnly.length,
        namedEvents: namedGroups,
        namedConsensusEvents: calculatedNamedConsensusEvents, // Return named consensus events
      };
    } catch (err) {
      console.error('[useTraderSum] Error fetching data:', err);
      setError(err);
      // Reset states on error
      setEvents([]);
      setConsensusEvents([]);
      setGroupedEvents({});
      setGroupedConsensusEvents({});
      setNamedEvents({});
      setParameterStats({});
      setConsensusParameterStats({});
      setTotalCount(0);
      setTotalConsensusCount(0);
      setNamedConsensusEvents({}); // Reset named consensus state on error
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Handle hardcoded case (only if a single known hardcoded ID is passed)
    if (isHardcodedTrader) {
      console.log('[useTraderSum] called with single hardcoded traderId:', traderIdArray[0]);
      setGroupedEvents(hardcodedGroupedEvents);
      setParameterStats(hardcodedRiskStats);
      setTotalCount(Object.values(hardcodedGroupedEvents).reduce((acc, group) => acc + group.events.length, 0));
      setEvents(Object.values(hardcodedGroupedEvents).flatMap((group) => group.events));
      setConsensusEvents([]); // Reset consensus state for hardcoded case
      setGroupedConsensusEvents({});
      setConsensusParameterStats({});
      setTotalConsensusCount(0);
      setLoading(false); // Ensure loading is set to false
      setError(null); // Ensure error is reset
      setNamedEvents({});
      setNamedConsensusEvents({}); // Reset named consensus state for hardcoded case
      return;
    }

    // Fetching logic for non-hardcoded traders or multiple traders
    if (traderIdArray.length > 0) {
      console.log('[useTraderSum] useEffect calling fetch for traderId(s):', traderIdArray.join(', '));
      fetchAttestations();
    } else {
      // If no valid trader IDs, reset the state
      console.log('[useTraderSum] useEffect skipping fetch - no valid traderIds:', traderIds);
      setLoading(false);
      setError(null);
      setEvents([]);
      setConsensusEvents([]); // Reset consensus
      setGroupedEvents({});
      setGroupedConsensusEvents({}); // Reset consensus
      setParameterStats({});
      setConsensusParameterStats({}); // Reset consensus
      setTotalCount(0);
      setTotalConsensusCount(0); // Reset consensus
      setNamedEvents({});
      setNamedConsensusEvents({}); // Reset named consensus state
    }
    // Ensure dependencies cover changes in trader IDs (as an array) and dateRange
  }, [JSON.stringify(traderIdArray), dateRange, isHardcodedTrader]); // Add isHardcodedTrader dependency

  console.log(
    '[useTraderSum] returning with loading:',
    loading,
    'error:',
    error,
    'groupedEvents count:',
    Object.keys(groupedEvents).length,
    'groupedConsensus count:', // Log consensus count
    Object.keys(groupedConsensusEvents).length
  );

  return {
    loading,
    error,
    events,
    consensusEvents, // Return consensus events
    groupedEvents,
    groupedConsensusEvents, // Return grouped consensus
    parameterStats,
    consensusParameterStats, // Return consensus stats
    totalCount,
    totalConsensusCount, // Return consensus count
    fetchAttestations,
    namedEvents,
    namedConsensusEvents, // Return named consensus events
  };
}

export default useTraderSum;
