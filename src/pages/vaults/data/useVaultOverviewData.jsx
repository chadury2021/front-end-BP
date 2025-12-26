import { selectConfig } from '@/pages/explorer/utils/chainConfig';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { ethers } from 'ethers';
import { useContext, useEffect, useMemo, useState } from 'react';
import { calculateVaultAPY, fetchVaultEvents, fetchVaultState, getVaultName } from './VaultFetchers';

// Map of vault addresses to their hardcoded data
const hardcodedVaultData = {
  '0x12352342': {
    name: 'AlphaVault',
    tvl: '$2.44M',
    borrowed: '$3.24M',
    apy: '12%',
    curator: 'ABC Curator',
    deposit: '$0.00',
    actions: [10, 15, 8, 12, 18],
  },
  '0x345363453': {
    name: 'CryptoNest',
    tvl: '$5.13M',
    borrowed: '$5.68M',
    apy: '15%',
    curator: 'XYZ Curator',
    deposit: '$0.00',
    actions: [5, 10, 6, 14, 9],
  },
  '0x897164319': {
    name: 'TitanStore',
    tvl: '$10.24',
    borrowed: '$16.96',
    apy: '10%',
    curator: 'GOH Curator',
    deposit: '$0.00',
    actions: [20, 12, 15, 25, 18],
  },
};

/**
 * Hook to fetch data for a specific vault with optimized parallel fetching
 * @param {string} vaultAddress - The address of the vault
 * @returns {Object} - The vault data, loading state, and error
 */
export function useVaultData(vaultAddress) {
  const [vaultData, setVaultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showAlert } = useContext(ErrorContext);

  // Use useMemo to cache the fetch operation based on the vault address
  const fetchOperation = useMemo(() => {
    // For hardcoded vaults, immediately return the data
    if (hardcodedVaultData[vaultAddress]) {
      return {
        execute: async () => ({
          ...hardcodedVaultData[vaultAddress],
          address: vaultAddress,
        }),
        isHardcoded: true,
      };
    }

    // Otherwise create a function to fetch from the chain
    return {
      execute: async () => {
        const config = await selectConfig();
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);

        // Execute all these network requests in parallel
        const [name, state, currentBlock] = await Promise.all([
          getVaultName(vaultAddress),
          fetchVaultState({
            rpcUrl: config.rpcUrl,
            vaultAddress,
          }),
          provider.getBlockNumber(),
        ]);

        // Now fetch events with the current block number
        const events = await fetchVaultEvents(
          {
            rpcUrl: config.rpcUrl,
            vaultAddress,
          },
          currentBlock - 100,
          currentBlock
        );

        // Process events and calculate APY in parallel
        const [apy, actionCounts, borrowedAmount] = await Promise.all([
          calculateVaultAPY({ rpcUrl: config.rpcUrl, vaultAddress }, events),
          // Process event data
          Promise.resolve(
            events.reduce(
              (acc, event) => {
                switch (event.type) {
                  case 'WithdrawalRequested':
                    acc[0] += 1;
                    break;
                  case 'WithdrawalExecuted':
                    acc[1] += 1;
                    break;
                  case 'Borrowed':
                    acc[2] += 1;
                    break;
                  case 'Repaid':
                    acc[3] += 1;
                    break;
                  default:
                    acc[4] += 1;
                }
                return acc;
              },
              [0, 0, 0, 0, 0]
            )
          ),
          // Calculate borrowed amount
          Promise.resolve(
            events
              .filter((e) => e.type === 'Borrowed' || e.type === 'Repaid')
              .reduce((acc, event) => {
                if (event.type === 'Borrowed') {
                  return acc + parseFloat(event.assets);
                }
                return acc - parseFloat(event.assets);
              }, 0)
          ),
        ]);

        // Return processed data
        return {
          name,
          address: vaultAddress,
          tvl: `$${state.totalAssets}`,
          borrowed: `$${borrowedAmount.toFixed(2)}`,
          apy,
          curator: 'TreadFi',
          deposit: '$0.00',
          actions: actionCounts,
          currentEpoch: state.currentEpoch,
          inBlackoutPeriod: state.inBlackoutPeriod,
        };
      },
      isHardcoded: false,
    };
  }, [vaultAddress]);

  // Execute the fetch operation when the component mounts or vaultAddress changes
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const data = await fetchOperation.execute();
        if (isMounted) {
          setVaultData(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          showAlert({
            severity: 'error',
            message: `Failed to fetch vault data: ${err.message}`,
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // For hardcoded vaults, we can skip the async operation
    if (fetchOperation.isHardcoded) {
      fetchOperation.execute().then((data) => {
        if (isMounted) {
          setVaultData(data);
          setLoading(false);
        }
      });
    } else {
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [fetchOperation, vaultAddress, showAlert]);

  return { vaultData, loading, error };
}
