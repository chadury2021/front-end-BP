/**
 * This module provides utilities for grouping and analyzing trader risk attestations.
 * 
 * Key Features:
 * - Grouping attestations by parameterId
 * - Calculating statistics for each parameter group
 */

/**
 * Groups attestation or consensus events by parameterId
 * @param {Array<Object>} events - Array of risk attestation or consensus events
 * @returns {Object<string, Array<Object>>} Map of parameterId to array of events
 * 
 * Example return value:
 * {
 *   "0": [
 *     {
 *       "transactionHash": "0xe4307f8253b57256af6f33ac5e22aeb42e0df587f2bb61b1386c749ead4e85e3",
 *       "blockNumber": 8515606,
 *       "traderId": "0x71744a6a0f3178224c8b245dac64a0d1ca1dd1dd39b7aa79875488816f9fd5fa",
 *       "epoch": 2903995,
 *       "attester": "0x64d8672534a169b0340fa10f6340ce45ae36d0e7",
 *       "data": 581,
 *       "parameterId": 0,
 *       "eventName": "Risk",
 *       "eventColor": "warning"
 *     },
 *     // ...more events with parameterId 0
 *   ],
 *   "1": [
 *     // events with parameterId 1
 *   ],
 *   // ...more parameter groups
 * }
 */
export function groupEventsByParameterId(events) {
  if (!events || !Array.isArray(events)) {
    console.warn('[groupEventsByParameterId] Invalid events input:', events);
    return {};
  }

  return events.reduce((groupedData, event) => {
    const { parameterId } = event;
    const paramId = parameterId.toString();

    // Create a new object instead of modifying the existing one
    return {
      ...groupedData,
      [paramId]: [...(groupedData[paramId] || []), event]
    };
  }, {});
}

/**
 * Helper function to calculate median of an array of numbers
 * @private
 */
function calculateMedian(values) {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

/**
 * Calculates statistics for grouped events (attestations or consensus)
 * @param {Object<string, Array<Object>>} groupedEvents - Map of parameterId to array of events
 * @returns {Object<string, Object>} Map of parameterId to statistics
 */
export function calculateParameterStats(groupedEvents) {
  const stats = {};

  Object.entries(groupedEvents).forEach(([paramId, eventsInGroup]) => {
    if (!eventsInGroup || eventsInGroup.length === 0) {
      return; // Skip empty groups
    }

    const dataValues = eventsInGroup.map((event) => event.data).filter((val) => typeof val === 'number');

    if (dataValues.length === 0) {
      // Handle case where no valid numeric data exists for the parameter
      stats[paramId] = {
        count: eventsInGroup.length,
        latest: eventsInGroup.sort((a, b) => b.epoch - a.epoch)[0], // Still provide latest event
        min: undefined,
        max: undefined,
        avg: undefined,
        median: undefined,
      };
      return;
    }

    stats[paramId] = {
      count: eventsInGroup.length,
      // Sort by epoch descending to get the latest event for this parameter
      latest: [...eventsInGroup].sort((a, b) => b.epoch - a.epoch)[0],
      min: Math.min(...dataValues),
      max: Math.max(...dataValues),
      avg: dataValues.reduce((sum, val) => sum + val, 0) / dataValues.length,
      median: calculateMedian(dataValues),
    };
  });

  return stats;
}

/**
 * Groups and calculates statistics for both risk attestations and consensus events
 * @param {Array<Object>} attestations - Array of risk attestation events
 * @param {Array<Object>} consensusEvents - Array of consensus risk events (optional)
 * @returns {Object} Object containing:
 *  groupedByParameter: Map of parameterId to array of attestation events
 *  parameterStats: Map of parameterId to statistics calculated from attestations
 *  groupedConsensusByParameter: Map of parameterId to array of consensus events
 *  consensusParameterStats: Map of parameterId to statistics calculated from consensus events
 */
export function sumTraderAttestations(attestations, consensusEvents = []) {
  // Group and calculate stats for attestations
  const groupedAttestations = groupEventsByParameterId(attestations);
  const attestationStats = calculateParameterStats(groupedAttestations);

  // Group and calculate stats for consensus events
  const groupedConsensus = groupEventsByParameterId(consensusEvents);
  const consensusStats = calculateParameterStats(groupedConsensus);

  return {
    groupedByParameter: groupedAttestations,
    parameterStats: attestationStats,
    groupedConsensusByParameter: groupedConsensus,
    consensusParameterStats: consensusStats,
  };
}
