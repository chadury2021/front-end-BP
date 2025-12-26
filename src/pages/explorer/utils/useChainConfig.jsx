import { useState, useEffect } from 'react';
import { selectConfig } from './chainConfig';

/**
 * React hook that loads chain configuration on component mount
 * @param {boolean} isDev - Whether the app is running in development mode
 * @param {number} paginationNumber - Pagination offset
 * @returns {Object} Object containing the chain configuration and loading state
 */
export const useChainConfig = (isDev = false, paginationNumber = 0) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const configData = await selectConfig(isDev, paginationNumber);
        setConfig(configData);
        setError(null);
      } catch (err) {
        console.error('Failed to load chain configuration:', err);
        setError(err.message || 'Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [isDev, paginationNumber]);

  return { config, loading, error };
};
