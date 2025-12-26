import { useState, useCallback } from 'react';
import { decryptArweaveTransaction } from '@/apiServices';

/**
 * Reusable hook for handling trade decryption logic
 * @param {string} txId - Transaction ID to decrypt
 * @param {string} traderId - Trader ID to decrypt
 * @param {string} rawData - Raw transaction data to decrypt
 * @returns {Object} Decryption state and function { decryptedData, isAuthorized, loading, error, decrypt }
 */
export function useDecryptTrade() {
  const [decryptedData, setDecryptedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const decrypt = useCallback(async (txId, traderId, rawData) => {
    if (!traderId || !rawData) {
      console.warn('[useDecryptTrade] Missing traderId or rawData');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const decryptResponse = await decryptArweaveTransaction(txId, {
        trader_id: traderId,
        raw_data: rawData,
      });

      if (decryptResponse?.decrypted_data) {
        // Handle both array and single object responses
        const data = Array.isArray(decryptResponse.decrypted_data)
          ? decryptResponse.decrypted_data
          : [decryptResponse.decrypted_data];
        setDecryptedData(data);
      } else {
        throw new Error('[useDecryptTrade] Invalid decryption response format');
      }
    } catch (err) {
      setError(err.message || 'Failed to decrypt trade details');
    } finally {
      setLoading(false);
    }
  }, []);
  return { decryptedData, loading, error, decrypt };
}
