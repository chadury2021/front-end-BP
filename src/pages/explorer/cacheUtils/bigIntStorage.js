import { deserializeBigInt, serializeBigInt } from '@/shared/bigIntUtils';

/**
 * @typedef {Object} Proof
 * @property {string} traderId - ID of the trader
 * @property {number|string} epoch - Epoch number
 * @property {Object} dataEvent - Data event details
 * @property {Object[]} riskEvents - Array of risk event details
 */
/**
 * Custom storage implementation that handles BigInt serialization
 */
export const bigIntStorage = {
  getItem: (key) => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value, deserializeBigInt) : [];
  },
  setItem: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value, serializeBigInt));
  },
  removeItem: (key) => localStorage.removeItem(key),
};
