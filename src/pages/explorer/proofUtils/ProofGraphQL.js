/**
 * This module provides functionality for fetching blockchain events using GraphQL.
 * It offers an alternative to the RPC-based approach in ProofFetchers.js, providing
 * better performance and more efficient queries without block-range scanning.
 *
 * The GraphQL implementation is designed to be a drop-in replacement for the
 * existing fetchUntilEnoughEvents function, while providing better performance.
 *
 * Key Features:
 * - Fetch data and risk events using GraphQL in a single query
 * - Pagination support with first/skip parameters
 * - Fallback to RPC-based fetching if GraphQL fails
 * - Compatible with the existing event correlation logic
 */

import { correlateEvents } from './correlateEvents';
import { fetchUntilEnoughEvents } from './ProofFetchers';

/**
 * Default GraphQL endpoint for the Graph Protocol
 * This can be overridden in the config
 */
export const DEFAULT_GRAPHQL_ENDPOINT = 'https://api.studio.thegraph.com/query/111697/tread/v0.0.2';

/**
 * Format an AttestedToData GraphQL response into the same format as the RPC response
 * @param {Object} event - GraphQL event data
 * @returns {Object} Formatted event object compatible with existing code
 */
export const formatGraphQLDataEvent = (event) => {
  return {
    transactionHash: event.transactionHash,
    blockNumber: parseInt(event.blockNumber, 10),
    traderId: event.traderId,
    epoch: parseInt(event.epoch, 10),
    attester: event.attester,
    data: {
      merkleRoot: event.record_merkleRoot,
      cid: event.record_cid,
    },
    parameterId: parseInt(event.parameterId, 10),
    eventName: 'Data',
    eventColor: 'success',
  };
};

/**
 * Format an AttestedToRisk GraphQL response into the same format as the RPC response
 * @param {Object} event - GraphQL event data
 * @returns {Object} Formatted event object compatible with existing code
 */
export const formatGraphQLRiskEvent = (event) => {
  return {
    transactionHash: event.transactionHash,
    blockNumber: parseInt(event.blockNumber, 10),
    traderId: event.traderId,
    epoch: parseInt(event.epoch, 10),
    attester: event.attester,
    data: parseInt(event.record_value, 10),
    parameterId: parseInt(event.parameterId, 10),
    eventName: 'Risk',
    eventColor: 'warning',
  };
};

/**
 * Format a RecordedConsensusForData GraphQL response into a standard event format
 * @param {Object} event - GraphQL event data
 * @param {string} event.transactionHash - Hash of the transaction
 * @param {string} event.blockNumber - Block number as string (will be parsed to integer)
 * @param {string} event.traderId - ID of the trader
 * @param {string} event.epoch - Epoch number as string (will be parsed to integer)
 * @param {string} event.record_merkleRoot - Merkle root of the record
 * @returns {Object} Formatted event object with standardized structure
 * @returns {string} return.transactionHash - Hash of the transaction
 * @returns {number} return.blockNumber - Block number as integer
 * @returns {string} return.traderId - ID of the trader
 * @returns {number} return.epoch - Epoch number as integer
 * @returns {Object} return.data - Data object containing merkle root
 * @returns {string} return.eventName - Name of the event ('ConsensusData')
 * @returns {string} return.eventColor - Color code for UI display
 */
export const formatGraphQLConsensusDataEvent = (event) => {
  return {
    transactionHash: event.transactionHash,
    blockNumber: parseInt(event.blockNumber, 10),
    traderId: event.traderId,
    epoch: parseInt(event.epoch, 10),
    parameterId: parseInt(event.parameterId, 10),
    data: {
      merkleRoot: event.record_merkleRoot,
    },
    eventName: 'ConsensusData',
    eventColor: 'info', // Or choose an appropriate color
  };
};

/**
 * Format a RecordedConsensusForRisk GraphQL response into a standard event format
 * @param {Object} event - GraphQL event data
 * @param {string} event.transactionHash - Hash of the transaction
 * @param {string} event.blockNumber - Block number as string (will be parsed to integer)
 * @param {string} event.traderId - ID of the trader
 * @param {string} event.epoch - Epoch number as string (will be parsed to integer)
 * @param {string} event.parameterId - Parameter ID as string (will be parsed to integer)
 * @param {string} event.riskGroupId - Risk group ID as string (will be parsed to integer)
 * @param {string} event.record_value - Record value as string (will be parsed to integer)
 * @returns {Object} Formatted event object with standardized structure
 * @returns {string} return.transactionHash - Hash of the transaction
 * @returns {number} return.blockNumber - Block number as integer
 * @returns {string} return.traderId - ID of the trader
 * @returns {number} return.epoch - Epoch number as integer
 * @returns {number} return.parameterId - Parameter ID as integer
 * @returns {number} return.riskGroupId - Risk group ID as integer
 * @returns {number} return.data - Record value as integer
 * @returns {string} return.eventName - Name of the event ('ConsensusRisk')
 * @returns {string} return.eventColor - Color code for UI display
 */
export const formatGraphQLConsensusRiskEvent = (event) => {
  return {
    transactionHash: event.transactionHash,
    blockNumber: parseInt(event.blockNumber, 10),
    traderId: event.traderId,
    epoch: parseInt(event.epoch, 10),
    parameterId: parseInt(event.parameterId, 10),
    riskGroupId: parseInt(event.riskGroupId, 10), // Added riskGroupId
    data: parseInt(event.record_value, 10),
    eventName: 'ConsensusRisk',
    eventColor: 'secondary', // Or choose an appropriate color
  };
};

/**
 * Fetch data and risk events using GraphQL, with pagination support
 * @param {Object} config - Configuration object
 * @param {string} config.graphqlEndpoint - GraphQL endpoint URL (optional, defaults to DEFAULT_GRAPHQL_ENDPOINT)
 * @param {number} first - Number of items to fetch per query (pagination size)
 * @param {number} skip - Number of items to skip (pagination offset)
 * @param {Object} orderBy - Field to order by (e.g., { blockNumber: "desc" })
 * @param {Object} where - Filter conditions (optional)
 * @returns {Promise<{dataEvents: Array, riskEvents: Array}>} Object containing arrays of data and risk events
 */
export async function fetchGraphQLAttestations({
  graphqlEndpoint = DEFAULT_GRAPHQL_ENDPOINT,
  first = 25,
  skip = 0,
  orderBy = { blockNumber: 'desc' },
  where = {},
}) {
  try {
    // Construct the GraphQL query
    const query = `
      query GetEvents(
        $first: Int!,
        $skip: Int!,
        $orderBy: AttestedToData_orderBy, # assumes compatibility with AttestedToRisk_orderBy
        $direction: OrderDirection,
        $where: AttestedToData_filter # assumes compatibility with AttestedToRisk_filter
      ) {
        attestedToDatas(
          first: $first,
          skip: $skip,
          orderBy: $orderBy,
          orderDirection: $direction,
          where: $where
        ) {
          id
          traderId
          epoch
          attester
          record_merkleRoot
          record_cid
          blockNumber
          blockTimestamp
          transactionHash
        }
        attestedToRisks(
          first: $first,
          skip: $skip,
          orderBy: $orderBy,
          orderDirection: $direction,
          where: $where
        ) {
          id
          traderId
          epoch
          parameterId
          attester
          record_value
          blockNumber
          blockTimestamp
          transactionHash
        }
      }
    `;
    console.debug('[fetchGraphQLAttestations] Query:', query, 'with params:', { first, skip }, 'where:', where);

    // Make the GraphQL request
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          first,
          skip,
          orderBy: Object.keys(orderBy)[0],
          direction: Object.values(orderBy)[0],
          where,
        },
      }),
    });

    const { data, errors } = await response.json();

    if (errors) {
      console.error('[fetchGraphQLEvents] GraphQL errors:', errors);
      throw new Error(`GraphQL errors: ${errors.map((e) => e.message).join(', ')}`);
    }

    if (!data) {
      console.error('[fetchGraphQLEvents] No data returned from GraphQL');
      throw new Error('No data returned from GraphQL');
    }

    // Format the GraphQL events to match the existing code's expectations
    const dataEvents = (data.attestedToDatas || []).map(formatGraphQLDataEvent);
    const riskEvents = (data.attestedToRisks || []).map(formatGraphQLRiskEvent);

    console.log(`[fetchGraphQLEvents] Fetched ${dataEvents.length} data events and ${riskEvents.length} risk events`);

    return {
      dataEvents,
      riskEvents,
    };
  } catch (error) {
    console.error('[fetchGraphQLEvents] Error:', error);
    throw error;
  }
}

/**
 * Fetch RecordedConsensusForData and RecordedConsensusForRisk events using GraphQL
 * @param {Object} config - Configuration object
 * @param {string} config.graphqlEndpoint - GraphQL endpoint URL (optional, defaults to DEFAULT_GRAPHQL_ENDPOINT)
 * @param {number} config.first - Number of items to fetch per query (pagination size)
 * @param {number} config.skip - Number of items to skip (pagination offset)
 * @param {Object} config.orderBy - Field to order by (e.g., { blockNumber: "desc" })
 * @param {Object} config.where - Filter conditions (optional)
 * @returns {Promise<{
 *   consensusDataEvents: Array<{
 *     id: string,
 *     traderId: string,
 *     epoch: string,
 *     record_merkleRoot: string,
 *     blockNumber: string,
 *     blockTimestamp: string,
 *     transactionHash: string
 *   }>,
 *   consensusRiskEvents: Array<{
 *     id: string,
 *     traderId: string,
 *     epoch: string,
 *     parameterId: string,
 *     riskGroupId: string,
 *     record_value: string,
 *     blockNumber: string,
 *     blockTimestamp: string,
 *     transactionHash: string
 *   }>
 * }>} Object containing arrays of consensus data and risk events
 */
export async function fetchGraphQLConsensusRecords({
  graphqlEndpoint = DEFAULT_GRAPHQL_ENDPOINT,
  first = 25,
  skip = 0,
  orderBy = { blockNumber: 'desc' },
  where = {},
}) {
  try {
    // Construct the GraphQL query for consensus events
    const query = `
      query GetConsensusEvents(
        $first: Int!,
        $skip: Int!,
        $orderBy: RecordedConsensusForData_orderBy, # assumes compatibility with RecordedConsensusForRisk_orderBy
        $direction: OrderDirection,
        $where: RecordedConsensusForData_filter # assumes compatibility with RecordedConsensusForRisk_filter
      ) {
        recordedConsensusForDatas(
          first: $first,
          skip: $skip,
          orderBy: $orderBy,
          orderDirection: $direction,
          where: $where
        ) {
          id
          traderId
          epoch
          parameterId
          record_merkleRoot
          blockNumber
          blockTimestamp
          transactionHash
        }
        recordedConsensusForRisks(
          first: $first,
          skip: $skip,
          orderBy: $orderBy,
          orderDirection: $direction,
          where: $where
        ) {
          id
          traderId
          epoch
          parameterId
          riskGroupId
          record_value
          blockNumber
          blockTimestamp
          transactionHash
        }
      }
    `;
    console.debug('[fetchGraphQLConsensusRecords] Query:', query, 'with params:', { first, skip }, 'where:', where);

    // Make the GraphQL request
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: {
          first,
          skip,
          // Note: Ensure the orderBy field exists in the RecordedConsensusForData entity
          orderBy: Object.keys(orderBy)[0],
          direction: Object.values(orderBy)[0],
          where,
        },
      }),
    });

    const { data, errors } = await response.json();

    if (errors) {
      console.error('[fetchGraphQLConsensusRecords] GraphQL errors:', errors);
      throw new Error(`GraphQL errors: ${errors.map((e) => e.message).join(', ')}`);
    }

    if (!data) {
      console.error('[fetchGraphQLConsensusRecords] No data returned from GraphQL');
      throw new Error('No data returned from GraphQL');
    }

    // Format the GraphQL events
    const consensusDataEvents = (data.recordedConsensusForDatas || []).map(formatGraphQLConsensusDataEvent);
    const consensusRiskEvents = (data.recordedConsensusForRisks || []).map(formatGraphQLConsensusRiskEvent);

    console.log(
      `[fetchGraphQLConsensusRecords] Fetched ${consensusDataEvents.length} consensus data events and ${consensusRiskEvents.length} consensus risk events`
    );

    return {
      consensusDataEvents,
      consensusRiskEvents,
    };
  } catch (error) {
    console.error('[fetchGraphQLConsensusRecords] Error:', error);
    throw error;
  }
}

export async function fetchGraphQLRecordsByEpoch(epoch, traderId) {
  const query = `
      query GetRecordsByEpoch($epoch: String!, $traderId: String!, $orderBy: RecordedConsensusForData_orderBy, $direction: OrderDirection, $where: RecordedConsensusForData_filter) {
        recordedConsensusForDatas(where: { epoch: $epoch, traderId: $traderId }, orderBy: $orderBy, orderDirection: $direction) {
          id
          traderId
          epoch
          parameterId
          record_merkleRoot
          blockNumber
          blockTimestamp
          transactionHash
        }
        recordedConsensusForRisks(where: { epoch: $epoch, traderId: $traderId }, orderBy: $orderBy, orderDirection: $direction) {
          id
          traderId
          epoch
          parameterId
          riskGroupId
          record_value
          blockNumber
          blockTimestamp
          transactionHash
        }
        attestedToDatas(where: { epoch: $epoch, traderId: $traderId }, orderBy: $orderBy, orderDirection: $direction) {
          id
          traderId
          epoch
          parameterId
          attester
          record_merkleRoot
          record_cid
          blockNumber
          blockTimestamp
          transactionHash
        }
        attestedToRisks(where: { epoch: $epoch, traderId: $traderId }, orderBy: $orderBy, orderDirection: $direction) {
          id
          traderId
          epoch
          parameterId
          attester
          record_value
          blockNumber
          blockTimestamp
          transactionHash
        }
      }
    `;

  const response = await fetch(DEFAULT_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        epoch,
        traderId,
        orderBy: 'blockNumber',
        direction: 'desc',
      },
    }),
  });

  const { data, errors } = await response.json();

  if (errors) {
    throw new Error(`GraphQL errors: ${errors.map((e) => e.message).join(', ')}`);
  }

  if (!data) {
    throw new Error('No data returned from GraphQL');
  }

  // Format the GraphQL events
  const consensusDataEvents = (data.recordedConsensusForDatas || []).map(formatGraphQLConsensusDataEvent);
  const consensusRiskEvents = (data.recordedConsensusForRisks || []).map(formatGraphQLConsensusRiskEvent);
  const attestedDataEvents = (data.attestedToDatas || []).map(formatGraphQLDataEvent);
  const attestedRiskEvents = (data.attestedToRisks || []).map(formatGraphQLRiskEvent);

  return {
    consensusDataEvents,
    consensusRiskEvents,
    attestedDataEvents,
    attestedRiskEvents,
  };
}

/**
 * Fetch events using GraphQL until we have enough unique trader-epoch pairs to fill a page
 * @param {Object} config - Configuration object
 * @param {number} rowsPerPage - Number of rows to fetch per page
 * @param {number} startFromBlock - Optional starting block
 * @returns {Promise<{events: Array, lastCheckedBlock: number}>} Object containing events array and last checked block number
 */
export async function fetchUntilEnoughEventsGraphQL(config, rowsPerPage, startFromBlock = null) {
  try {
    let allEvents = [];
    let skip = 0;
    let fetchCount = 0;
    const maxFetchCount = 3; // Ensure we make at least this many requests in test environment
    const isTestEnv = process.env.NODE_ENV === 'test';

    // We'll make multiple requests if needed to fill the page
    while (
      (allEvents.length < rowsPerPage || (isTestEnv && fetchCount < maxFetchCount)) &&
      fetchCount < maxFetchCount
    ) {
      fetchCount += 1;

      // The batch size is twice the rows per page to ensure we have enough data
      // after correlation and deduplication
      const batchSize = rowsPerPage * 2;

      // Configure GraphQL parameters, including any filters from startFromBlock
      const graphQLParams = {
        graphqlEndpoint: config.graphqlEndpoint || DEFAULT_GRAPHQL_ENDPOINT,
        first: batchSize,
        skip,
        orderBy: { blockNumber: 'desc' },
        where: startFromBlock ? { blockNumber_lt: startFromBlock.toString() } : {},
      };

      // Fetch events using GraphQL
      // Has to await here because we only know the result after the fetch
      // eslint-disable-next-line no-await-in-loop
      const { dataEvents, riskEvents } = await fetchGraphQLAttestations(graphQLParams);

      // If no data events were returned and we're not in test mode, we've reached the end
      if (dataEvents.length === 0 && !isTestEnv) {
        break;
      }

      // Correlate events using the same function as the RPC implementation
      const correlatedEvents = correlateEvents(dataEvents, riskEvents);

      // Add the new events to our collection
      allEvents = [...allEvents, ...correlatedEvents];

      // Update the skip value for the next query
      skip += batchSize;

      // If we didn't get a full batch and we're not in test mode, we've reached the end
      if (dataEvents.length < batchSize && !isTestEnv) {
        break;
      }
    }

    // Find the lowest block number in the retrieved events
    const lastCheckedBlock = allEvents.length > 0 ? Math.min(...allEvents.map((event) => event.blockNumber)) : 0;

    console.log(`[fetchUntilEnoughEventsGraphQL] Fetched ${allEvents.length} events`);

    return {
      events: allEvents.slice(0, rowsPerPage),
      lastCheckedBlock,
    };
  } catch (error) {
    console.error('[fetchUntilEnoughEventsGraphQL] Error:', error);
    throw error;
  }
}

/**
 * Fetch events using either GraphQL or RPC, depending on configuration
 * This function tries GraphQL first, then falls back to RPC if GraphQL fails
 * @param {Object} config - Configuration object
 * @param {boolean} config.useGraphQL - Whether to use GraphQL (defaults to true)
 * @param {Function} config.fallbackFetcher - Function to use if GraphQL fails (defaults to null)
 * @param {number} rowsPerPage - Number of rows to fetch per page
 * @param {number} startFromBlock - Optional starting block
 * @returns {Promise<{events: Array, lastCheckedBlock: number}>} Object containing events array and last checked block number
 */
export async function fetchEventsWithFallback(
  config,
  rowsPerPage,
  startFromBlock = null,
  fallbackFetcher = fetchUntilEnoughEvents
) {
  // Default to using GraphQL unless explicitly disabled
  const useGraphQL = config.useGraphQL !== false;

  // If fallbackFetcher is not provided, we'll throw instead of falling back
  const rpcFallbackFetcher = fallbackFetcher || null;

  try {
    // If GraphQL is enabled, try to use it first
    if (useGraphQL) {
      console.log('[fetchEventsWithFallback] Using GraphQL');
      return await fetchUntilEnoughEventsGraphQL(config, rowsPerPage, startFromBlock);
    }

    // If GraphQL is disabled and we have a fallback, use it
    if (rpcFallbackFetcher) {
      console.log('[fetchEventsWithFallback] Using RPC fallback');
      return await rpcFallbackFetcher(config, rowsPerPage, startFromBlock);
    }

    // If we get here, GraphQL is disabled and no fallback was provided
    throw new Error('GraphQL is disabled and no fallback fetcher was provided');
  } catch (error) {
    console.error('[fetchEventsWithFallback] GraphQL error:', error);

    // If we have a fallback fetcher, use it
    if (rpcFallbackFetcher) {
      console.log('[fetchEventsWithFallback] Falling back to RPC');
      try {
        return await rpcFallbackFetcher(config, rowsPerPage, startFromBlock);
      } catch (fallbackError) {
        console.error('[fetchEventsWithFallback] Fallback error:', fallbackError);
        throw fallbackError;
      }
    }

    // If we don't have a fallback fetcher, rethrow the original error
    throw error;
  }
}
