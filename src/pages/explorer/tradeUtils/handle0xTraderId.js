/**
 * Returns both the non-0x and 0x-prefixed versions of a trader ID,
 * regardless of whether the input is already prefixed with 0x or not.
 * @param {string} traderId - The trader ID to process
 * @returns {string[]} - [non-0x version, 0x-prefixed version]
 */
export function handle0xTraderId(traderId) {
  // Return empty values if traderId is null or undefined
  if (!traderId) {
    return [null, null];
  }

  if (traderId.startsWith('0x')) {
    return [traderId.substring(2), traderId];
  }
  return [traderId, `0x${traderId}`];
}