import { useState, useEffect } from 'react';
import { listVaults } from './VaultFetchers';

/**
 * Custom hook to get the list of vault addresses
 * @returns {Object} Object containing:
 * - vaults: Array of vault addresses
 * - loading: Boolean indicating if the data is being loaded
 * - error: Error object if an error occurred
 */
export function useVaultList() {
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const vaultAddresses = listVaults();
      setVaults(vaultAddresses);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch vault list:', err);
      setError(err);
      setLoading(false);
    }
  }, []);

  return { vaults, loading, error };
}

export default useVaultList;
