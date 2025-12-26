import { selectConfig } from '@/pages/explorer/utils/chainConfig';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { useContext, useEffect, useState } from 'react';
import { getVaultTraderId } from './VaultFetchers';

/**
 * Handles errors in a consistent way
 * @param {Error} err - The error object
 * @param {Function} setError - State setter for error
 * @param {Function} showAlert - Function to display alert
 * @param {string} source - Source of the error for logging
 */
function handleError(err, setError, showAlert, source) {
  const errorMessage = err.message || 'Unknown error occurred';
  console.error(`[${source}] Error:`, err);

  // Update error state
  setError(errorMessage);

  // Show alert to user
  showAlert({
    message: `Failed to fetch vault risk data: ${errorMessage}`,
    severity: 'error',
  });
}

/**
 * Custom hook to get vault trader ID and risk metrics
 * @param {string} vaultAddress - The address of the vault
 * @returns {Object} - Object containing trader ID and risk metrics
 */
export const useVaultRisk = (vaultAddress) => {
  const [config, setConfig] = useState(null);
  const [riskData, setRiskData] = useState({
    traderId: '',
    loading: true,
    error: null,
  });
  const { showAlert } = useContext(ErrorContext);

  useEffect(() => {
    // Initialize config
    const initConfig = async () => {
      try {
        const configData = await selectConfig();
        setConfig(configData);
      } catch (err) {
        handleError(
          err,
          (errorMsg) => setRiskData((prev) => ({ ...prev, error: errorMsg, loading: false })),
          showAlert,
          'useVaultRisk-config'
        );
      }
    };

    initConfig();
  }, [showAlert]);

  useEffect(() => {
    // Early return if no vault address or config not loaded yet
    if (!vaultAddress || !config) {
      if (!vaultAddress) {
        setRiskData({
          traderId: '',
          loading: false,
          error: 'No vault address provided',
        });
      }
      return;
    }

    const fetchRiskData = async () => {
      try {
        // Get trader ID from the vault address
        const traderId = await getVaultTraderId(config, vaultAddress);

        // Here we could add additional risk data fetching in the future
        // e.g., risk metrics, consensus data, etc.

        setRiskData({
          traderId,
          loading: false,
          error: null,
        });
      } catch (err) {
        handleError(
          err,
          (errorMsg) => setRiskData((prev) => ({ ...prev, error: errorMsg, loading: false })),
          showAlert,
          'useVaultRisk'
        );
      }
    };

    fetchRiskData();
  }, [vaultAddress, config, showAlert]);

  return riskData;
};
