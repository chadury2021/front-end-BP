/**
 * Correlates trade data events with risk events by matching trader ID and epoch
 * @param {Array} dataEvents - Array of trade data attestation events
 * @param {Array} riskEvents - Array of risk attestation events
 * @returns {Array<{
 *   traderId: string,
 *   epoch: number,
 *   blockNumber: number,
 *   dataEvents: Array<{
 *     traderId: string,
 *     epoch: number,
 *     blockNumber: number,
 *     transactionHash: string,
 *     data: Object
 *   }>,
 *   riskEvents: Array<{
 *     traderId: string,
 *     epoch: number,
 *     blockNumber: number,
 *     transactionHash: string,
 *     data: Object
 *   }>
 * }>} Array of correlated events, each containing:
 *   - traderId: Unique identifier for the trader
 *   - epoch: Trading epoch number
 *   - blockNumber: Block number of the data event
 *   - dataEvents: Array of trade data attestation events
 *   - riskEvents: Array of matching risk attestation events
 */
export function correlateEvents(dataEventsInput = [], riskEventsInput = []) {
  // Ensure we have arrays, even if empty
  const dataEvents = Array.isArray(dataEventsInput) ? dataEventsInput : [dataEventsInput];
  const riskEvents = Array.isArray(riskEventsInput) ? riskEventsInput : [riskEventsInput];

  console.debug(
    '[correlateEvents.inputValidation] given input types:',
    typeof dataEvents,
    typeof riskEvents,
    'and lengths:',
    dataEvents.length,
    riskEvents.length,
    '\n[output] dataEvents:',
    dataEvents,
    'riskEvents:',
    riskEvents
  );

  // Create lookup maps for both types of events
  const dataMap = new Map();
  const riskMap = new Map();

  // Index data events by traderId-epoch
  dataEvents.forEach((dataEvent) => {
    if (dataEvent && dataEvent.traderId && dataEvent.epoch) {
      const key = `${dataEvent.traderId}-${dataEvent.epoch}`;
      console.debug(
        '[correlateEvents.dataEvents.forEach] adding dataEvent with key:',
        `${dataEvent.traderId}-${dataEvent.epoch}`
      );
      if (!dataMap.has(key)) {
        dataMap.set(key, []);
      }
      dataMap.get(key).push(dataEvent);
    } else {
      console.debug('[correlateEvents.dataEvents.forEach] skipping dataEvent:', dataEvent);
    }
  });

  // Index risk events by traderId-epoch
  riskEvents.forEach((riskEvent) => {
    if (riskEvent && riskEvent.traderId && riskEvent.epoch) {
      const key = `${riskEvent.traderId}-${riskEvent.epoch}`;
      console.debug(
        '[correlateEvents.riskEvents.forEach] adding riskEvent with key:',
        `${riskEvent.traderId}-${riskEvent.epoch}`
      );
      if (!riskMap.has(key)) {
        riskMap.set(key, []);
      }
      riskMap.get(key).push(riskEvent);
    } else {
      console.debug('[correlateEvents.riskEvents.forEach] skipping riskEvent:', riskEvent);
    }
  });

  // Return unique Data events with grouped Risks
  const correlatedEvents = Array.from(dataMap.entries())
    .filter(([_, dataEventArray]) => dataEventArray && dataEventArray.length > 0)
    .map(([key, dataEventArray]) => {
      if (!dataEventArray[0]?.traderId || !dataEventArray[0]?.epoch) return null;

      // Get risk events for this trader-epoch pair
      const riskEventsForTraderEpoch = riskMap.get(key) || [];

      return {
        traderId: dataEventArray[0].traderId,
        epoch: dataEventArray[0].epoch,
        blockNumber: dataEventArray[0].blockNumber,
        dataEvents: dataEventArray,
        riskEvents: riskEventsForTraderEpoch,
      };
    })
    .filter(Boolean);
  console.log(
    '[correlateEvents] given dataEvents:',
    dataEvents?.length,
    'given riskEvents:',
    riskEvents?.length,
    'correlatedEvents:',
    correlatedEvents?.length,
    'new events, \n[mappers] dataMap:',
    dataMap,
    'riskMap:',
    riskMap,
    '\n[details] dataEvents:',
    dataEvents,
    'riskEvents:',
    riskEvents
  );
  return correlatedEvents;
}
