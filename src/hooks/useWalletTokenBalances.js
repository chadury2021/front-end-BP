import { useState, useEffect, useMemo } from 'react';
import { CHAIN_CONFIGS, NATIVE_TOKENS } from '@/shared/dexUtils';
import { Connection, PublicKey } from '@solana/web3.js';
import { ethers } from 'ethers';
import { getWalletTokenBalances } from '@/apiServices';

/**
 * Custom hook to fetch wallet token balances using RPC calls
 * @param {string} walletAddress - The connected wallet address
 * @param {string} chainId - The selected chain ID
 * @param {string} chainType - The wallet chain type (evm or solana)
 * @returns {Object} - { balances, loading, error, filteredTokens }
 */
export const useWalletTokenBalances = (walletAddress, chainId, chainType) => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSolanaBalances = async (address) => {
    const connection = new Connection(
      'https://solana-mainnet.g.alchemy.com/v2/Y4Uf-x3DQJ5H-DnzmVYn6aLu9-jr-jHi',
      'confirmed'
    );

    const publicKey = new PublicKey(address);
    const tokenBalances = [];

    const solBalance = await connection.getBalance(publicKey);
    if (solBalance > 0) {
      tokenBalances.push({
        address: NATIVE_TOKENS['501'],
        chain_id: 501,
        symbol: 'SOL',
        name: 'Solana',
        balance: (solBalance / 1e9).toString(),
        decimals: 9,
      });
    }

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });

    tokenAccounts.value.forEach(({ account }) => {
      const { mint, tokenAmount } = account.data.parsed.info;
      const balance = parseFloat(tokenAmount.amount) / 10 ** tokenAmount.decimals;

      if (balance > 0) {
        tokenBalances.push({
          address: mint,
          chain_id: 501,
          symbol: `${mint.substring(0, 8)}...`,
          name: 'SPL Token',
          balance: balance.toString(),
          decimals: tokenAmount.decimals,
        });
      }
    });

    return tokenBalances;
  };

  const fetchEVMBalances = async (address, providedChainId) => {
    const allBalances = [];

    const chainConfig = CHAIN_CONFIGS[providedChainId];
    if (!chainConfig) return [];

    try {
      const response = await getWalletTokenBalances(address, providedChainId);
      if (response.balances) {
        return response.balances.map((b) => {
          if (b.address === 'native') {
            return {
              address: NATIVE_TOKENS[providedChainId],
              chain_id: providedChainId,
              symbol: chainConfig.symbol,
              name: chainConfig.name,
              balance: b.balance,
              balanceUsd: b.balanceUsd,
              decimals: chainConfig.decimals,
            };
          }
          return b;
        });
      }
    } catch (apiError) {
      console.warn('Backend token balances API failed, skipping ERC20 tokens:', apiError);
    }

    return allBalances;
  };

  useEffect(() => {
    const fetchBalances = async () => {
      if (!walletAddress || !chainId) {
        setBalances([]);
        return;
      }
      setLoading(true);
      setError(null);

      try {
        let fetchedBalances = [];

        if (chainType === 'solana' && chainId === '501') {
          fetchedBalances = await fetchSolanaBalances(walletAddress);
        } else if (chainType === 'evm') {
          fetchedBalances = await fetchEVMBalances(walletAddress, chainId);
        }
        setBalances(fetchedBalances);
      } catch (err) {
        setError(err.message);
        setBalances([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [chainId]);

  return {
    balances,
    loading,
    error,
  };
};

export default useWalletTokenBalances;
