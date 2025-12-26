import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getWallets } from '@wallet-standard/app';

import { Connection, clusterApiUrl, Transaction, VersionedTransaction, PublicKey } from '@solana/web3.js';

const SolanaWalletContext = createContext(null);

// --------- Helpers ---------

function deriveSolanaChainFromEndpoint(endpoint) {
  // very lightweight heuristic
  if (typeof endpoint !== 'string') return 'solana:mainnet';
  const lower = endpoint.toLowerCase();
  if (lower.includes('devnet')) return 'solana:devnet';
  if (lower.includes('testnet')) return 'solana:testnet';
  return 'solana:mainnet';
}

function dedupeWallets(wallets) {
  const byName = new Map();

  const score = (w) =>
    (w.features['standard:connect'] ? 1 : 0) +
    (w.features['solana:signTransaction'] ? 1 : 0) +
    (w.features['standard:signMessage'] ? 1 : 0) +
    (w.features['solana:signAndSendTransaction'] ? 1 : 0);

  wallets.forEach((w) => {
    const key = w.name.toLowerCase();
    const existing = byName.get(key);

    if (!existing || score(w) > score(existing)) {
      byName.set(key, w);
    }
  });

  return Array.from(byName.values());
}

export function SolanaWalletProvider({ children, endpoint = clusterApiUrl('mainnet-beta') }) {
  const [wallets, setWallets] = useState([]);

  const connection = useMemo(() => {
    return new Connection(endpoint, 'confirmed');
  }, [endpoint]);

  const chainId = useMemo(() => deriveSolanaChainFromEndpoint(endpoint), [endpoint]);

  // Build a unified provider that wraps a Wallet Standard wallet
  const createUnifiedProvider = useMemo(() => {
    return (wallet) => {
      let connectedAccount = null;
      let publicKey = null;
      let isConnected = false;
      const listeners = {
        accountChanged: new Set(),
      };

      const emitAccountChanged = () => {
        listeners.accountChanged.forEach((cb) => {
          try {
            cb(publicKey);
          } catch (e) {
            // ignore listener errors
          }
        });
      };

      const provider = {
        // metadata (used by UI)
        id: wallet.name,
        name: wallet.name,
        icon: wallet.icon,

        // state
        get publicKey() {
          return publicKey;
        },
        get isConnected() {
          return isConnected;
        },
        getConnectedAccount() {
          return connectedAccount;
        },

        // events
        on(event, handler) {
          if (event === 'accountChanged') {
            listeners.accountChanged.add(handler);
          }
        },
        off(event, handler) {
          if (event === 'accountChanged') {
            listeners.accountChanged.delete(handler);
          }
        },

        // actions
        async connect() {
          const connectFeature = wallet.features['standard:connect'];
          if (!connectFeature) throw new Error('Wallet does not support connect');

          const { accounts } = await connectFeature.connect();
          if (!accounts || accounts.length === 0) throw new Error('No accounts returned');

          const [firstAccount] = accounts;
          connectedAccount = firstAccount;
          // standard account addresses are base58 strings for Solana
          publicKey = new PublicKey(connectedAccount.address);
          isConnected = true;

          emitAccountChanged();
          return { publicKey };
        },

        async disconnect() {
          const feature = wallet.features['standard:disconnect'];
          if (feature) {
            try {
              await feature.disconnect();
            } catch (_) {
              // ignore disconnect errors
            }
          }
          connectedAccount = null;
          publicKey = null;
          isConnected = false;
          emitAccountChanged();
        },

        async signAndSendTransaction(tx) {
          const signAndSendFeature = wallet.features['solana:signAndSendTransaction'];
          const serialized = tx instanceof Transaction ? tx.serialize({ requireAllSignatures: false }) : tx.serialize();

          if (signAndSendFeature) {
            const response = await signAndSendFeature.signAndSendTransaction({
              transaction: serialized,
              account: connectedAccount || undefined,
            });

            if (response?.length && response?.length > 0) {
              return response[0];
            }
            throw new Error('No signature returned');
          }

          // fallback: sign then send using RPC
          const signed = await provider.signTransaction(tx);
          return connection.sendRawTransaction(signed);
        },

        async signMessage(message) {
          if (!connectedAccount) throw new Error('Not connected');
          const feature = wallet.features['solana:signMessage'];
          if (!feature) throw new Error('Wallet does not support signMessage');

          const response = await feature.signMessage({
            message,
            account: connectedAccount,
          });
          if (response?.length && response?.length > 0) {
            return response[0];
          }

          throw new Error('No signature returned');
        },
      };

      return provider;
    };
  }, [connection, chainId]);

  // Discover wallets + listen for updates
  useEffect(() => {
    const walletsApi = getWallets();
    const discovered = dedupeWallets(walletsApi.get());
    setWallets(discovered.map((w) => createUnifiedProvider(w)));

    const offRegister = walletsApi.on('register', () => {
      const updated = dedupeWallets(walletsApi.get());
      setWallets(updated.map((w) => createUnifiedProvider(w)));
    });

    const offUnregister = walletsApi.on('unregister', () => {
      const updated = dedupeWallets(walletsApi.get());
      setWallets(updated.map((w) => createUnifiedProvider(w)));
    });

    return () => {
      offRegister();
      offUnregister();
    };
  }, []);

  const value = useMemo(
    () => ({
      wallets,
    }),
    [wallets]
  );

  return <SolanaWalletContext.Provider value={value}>{children}</SolanaWalletContext.Provider>;
}

export function useSolanaWallet() {
  const ctx = useContext(SolanaWalletContext);
  if (!ctx) {
    throw new Error('useSolanaWallet must be used within SolanaWalletProvider');
  }
  return ctx;
}
