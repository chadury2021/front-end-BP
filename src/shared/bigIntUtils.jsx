// Helper function to format values
export function replaceBigInts(obj) {
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(replaceBigInts);
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, replaceBigInts(value)]));
  }
  return obj;
}

/**
 * Serializes BigInt values by converting them to strings with 'n' suffix.
 * Used as a replacer function for JSON.stringify() and Jotai's atomWithStorage.
 *
 * @example
 * JSON.stringify(bigIntValue, serializeBigInt)
 * // or with Jotai
 * atomWithStorage('key', initialValue, { setItem: (key, value) => JSON.stringify(value, serializeBigInt) })
 *
 * @param {string} _ - Unused key parameter
 * @param {any} value - The value to serialize
 * @returns {any} The serialized value
 */
export const serializeBigInt = (_, value) => {
  if (typeof value === 'bigint') {
    return `${value.toString()}n`;
  }
  return value;
};

/**
 * Deserializes string values ending in 'n' back to BigInt.
 * Used as a reviver function for JSON.parse() and Jotai's atomWithStorage.
 *
 * @example
 * JSON.parse(jsonString, deserializeBigInt)
 * // or with Jotai
 * atomWithStorage('key', initialValue, { getItem: (key) => JSON.parse(localStorage.getItem(key), deserializeBigInt) })
 *
 * @param {string} _ - Unused key parameter
 * @param {any} value - The value to deserialize
 * @returns {any} The deserialized value
 */
export const deserializeBigInt = (_, value) => {
  if (typeof value === 'string' && value.endsWith('n')) {
    return BigInt(value.slice(0, -1));
  }
  return value;
};
