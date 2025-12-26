/**
 * This module provides event formatting utilities for blockchain events related to attestations.
 * It is separated from the main fetcher code to break circular dependencies.
 */

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
  // eslint-disable-next-line no-console
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
  // eslint-disable-next-line no-console
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
