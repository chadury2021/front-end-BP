/**
 * Groups risk events by parameterId
 * @param {Array} riskEventsForTraderEpoch - Array of risk events for a specific trader-epoch pair
 * @returns {Object} Object with parameterId as keys and arrays of risk events as values
 */
export function groupRiskEventsByParameterId(riskEventsForTraderEpoch = []) {
  // Group risk events by parameterId
  const riskEventsByParameterId = riskEventsForTraderEpoch.reduce((acc, riskEvent) => {
    const hasIntParameterId = !Number.isNaN(parseInt(riskEvent.parameterId, 10));
    const parameterId = hasIntParameterId ? riskEvent.parameterId : 'unknown';
    if (!acc[parameterId]) {
      acc[parameterId] = [];
    }
    acc[parameterId].push(riskEvent);
    return acc;
  }, {});

  return riskEventsByParameterId;
}

/**
 * Creates a map of transaction hashes by parameterId for easier consumption by components
 * @param {Object} riskEventsByParameterId - Object with parameterId as keys and arrays of risk events as values
 * @returns {Object} Object with parameterId as keys and arrays of transaction hashes as values
 */
export function createRiskTxHashesByParameterId(riskEventsByParameterId = {}) {
  return Object.entries(riskEventsByParameterId).reduce((acc, [parameterId, events]) => {
    acc[parameterId] = events.map((event) => event.transactionHash);
    return acc;
  }, {});
}
