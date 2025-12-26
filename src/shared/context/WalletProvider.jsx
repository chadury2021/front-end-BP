import { CHAIN_TYPES } from '@/shared/dexUtils';
import { capitalize } from 'lodash';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { useSolanaWallet } from './SolanaWalletProvider';

// EIP-6963 Type Definitions
const EIP6963_EVENTS = {
  ANNOUNCE_PROVIDER: 'eip6963:announceProvider',
  REQUEST_PROVIDER: 'eip6963:requestProvider',
};

// EIP-6963 Store Implementation
class EIP6963Store {
  constructor() {
    this.providers = new Map();
    this.listeners = new Set();
    this.isListening = false;
    this.lastSnapshot = []; // Cache the last snapshot to prevent unnecessary re-renders
  }

  subscribe = (callback) => {
    this.listeners.add(callback);

    // Start listening on first subscription
    if (!this.isListening) {
      this.startListening();
    }

    return () => {
      this.listeners.delete(callback);
      // Stop listening when no more listeners
      if (this.listeners.size === 0) {
        this.stopListening();
      }
    };
  };

  getProviders = () => {
    const currentProviders = Array.from(this.providers.values());

    // Only return new array if providers actually changed
    if (
      this.lastSnapshot.length !== currentProviders.length ||
      !this.lastSnapshot.every((p, i) => p.info.rdns === currentProviders[i]?.info.rdns)
    ) {
      this.lastSnapshot = currentProviders;
    }

    return this.lastSnapshot;
  };

  findProvider = (rdns) => {
    return this.providers.get(rdns);
  };

  announceProvider = (event) => {
    const { detail } = event;
    const { info, provider } = detail;

    // Use rdns as the unique identifier instead of uuid
    // uuid changes on each announcement, rdns is stable
    if (!this.providers.has(info.rdns)) {
      this.providers.set(info.rdns, detail);
      console.log(`[EIP6963] Added provider: ${info.name} (${info.rdns})`);

      // Update snapshot and notify
      this.lastSnapshot = Array.from(this.providers.values());
      this.notifyListeners();
    }
  };

  startListening() {
    if (this.isListening) return;

    this.isListening = true;
    window.addEventListener(EIP6963_EVENTS.ANNOUNCE_PROVIDER, this.announceProvider);

    // Request providers from all available wallets
    window.dispatchEvent(new Event(EIP6963_EVENTS.REQUEST_PROVIDER));
    console.log('[EIP6963] Requesting wallet providers...');
  }

  stopListening() {
    if (!this.isListening) return;

    this.isListening = false;
    window.removeEventListener(EIP6963_EVENTS.ANNOUNCE_PROVIDER, this.announceProvider);
  }

  notifyListeners() {
    this.listeners.forEach((callback) => callback());
  }

  clear() {
    this.providers.clear();
    this.lastSnapshot = [];
    this.notifyListeners();
  }

  reset() {
    this.clear();
    window.dispatchEvent(new Event(EIP6963_EVENTS.REQUEST_PROVIDER));
  }
}

// Create singleton store instance
const eip6963Store = new EIP6963Store();

// Hook to use EIP6963 providers
const useEIP6963Providers = () => {
  return useSyncExternalStore(
    eip6963Store.subscribe,
    eip6963Store.getProviders,
    eip6963Store.getProviders // Server-side fallback
  );
};

// Simplified wallet provider configuration - primarily rely on EIP-6963
const WALLET_PROVIDERS = {
  [CHAIN_TYPES.ETHEREUM]: {
    // Minimal fallback for legacy wallets that don't support EIP-6963
    legacy_ethereum: {
      name: 'Legacy Ethereum Wallet',
      id: 'legacy_ethereum',
      check: (eip6963Providers = []) => {
        // Only show legacy if no EIP-6963 providers and window.ethereum exists
        return eip6963Providers.length === 0 && window.ethereum;
      },
      getProvider: () => {
        if (window.ethereum) {
          return window.ethereum;
        }
        throw new Error('No Ethereum provider found');
      },
    },
  },
  [CHAIN_TYPES.SOLANA]: {
    phantom: {
      name: 'Phantom',
      id: 'phantom',
      check: () => window.phantom?.solana,
      getProvider: () => window.phantom.solana,
    },
    solflare: {
      name: 'Solflare',
      id: 'solflare',
      check: () => window.solflare,
      getProvider: () => window.solflare,
    },
  },
};

async function getEthereumWalletAddress(provider) {
  const requestedAccounts = await provider.request({ method: 'eth_requestAccounts' });
  if (!requestedAccounts || requestedAccounts.length === 0) {
    throw new Error('No Ethereum wallet address found');
  }
  return requestedAccounts[0];
}

async function getSolanaWalletAddress(provider) {
  const response = await provider.connect();
  if (response.publicKey) {
    return response.publicKey.toString();
  }
  return provider.publicKey?.toString();
}

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [connectedWallet, setConnectedWallet] = useState('');
  const [connectedWalletObject, setConnectedWalletObject] = useState(null);
  const [chainType, setChainType] = useState('');
  const [walletProviderName, setWalletProviderName] = useState('');
  const [walletProviderObject, setWalletProviderObject] = useState(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [availableChains, setAvailableChains] = useState([]);
  const [availableWallets, setAvailableWallets] = useState({});
  const [connectingError, setConnectingError] = useState('');

  const { wallets: solanaWallets } = useSolanaWallet();

  const eip6963Providers = useEIP6963Providers();

  useEffect(() => {
    const detectChainsAndWallets = () => {
      const chains = [];
      const wallets = {};

      const ethereumWallets = [];

      // Add all EIP-6963 providers as first-class wallets
      eip6963Providers.forEach((eip6963Provider) => {
        const { info } = eip6963Provider;
        ethereumWallets.push({
          name: info.name,
          id: `eip6963_${info.rdns}`,
          rdns: info.rdns,
          icon: info.icon,
          isEIP6963: true,
          check: () => true,
          getProvider: () => eip6963Provider.provider,
        });
      });

      // Fallback: Add legacy providers only if no EIP-6963 providers
      if (eip6963Providers.length === 0) {
        Object.entries(WALLET_PROVIDERS[CHAIN_TYPES.ETHEREUM]).forEach(([key, wallet]) => {
          if (wallet.check(eip6963Providers)) {
            ethereumWallets.push({
              ...wallet,
              isEIP6963: false,
            });
          }
        });
      }

      if (ethereumWallets.length > 0) {
        chains.push(CHAIN_TYPES.ETHEREUM);
        wallets[CHAIN_TYPES.ETHEREUM] = ethereumWallets;
      }

      // Solana wallets (unchanged - no EIP-6963 equivalent yet)
      const solWallets = [];
      solanaWallets.forEach((wallet) => {
        solWallets.push({
          name: wallet.name,
          id: wallet.id,
          icon: wallet.icon,
          isEIP6963: false,
          getProvider: () => wallet,
        });
      });

      if (solWallets.length > 0) {
        chains.push(CHAIN_TYPES.SOLANA);
        wallets[CHAIN_TYPES.SOLANA] = solWallets;
      }

      setAvailableChains(chains);
      setAvailableWallets(wallets);
    };

    detectChainsAndWallets();

    // Re-detect when window gains focus (user might install new wallet)
    window.addEventListener('focus', detectChainsAndWallets);
    return () => window.removeEventListener('focus', detectChainsAndWallets);
  }, [eip6963Providers, solanaWallets]);

  // Account change listeners (enhanced for EIP6963)
  useEffect(() => {
    if (!chainType || !walletProviderName || !walletProviderObject) return () => {};

    // Use the already connected provider object instead of looking it up again
    const provider = walletProviderObject;

    if (chainType === CHAIN_TYPES.ETHEREUM) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setConnectedWallet('');
          setChainType('');
          setWalletProviderName('');
          setWalletProviderObject(null);
          setConnectedWalletObject(null);
        } else {
          setConnectedWallet(accounts[0]);
        }
      };
      provider.on('accountsChanged', handleAccountsChanged);
      return () => provider.removeListener('accountsChanged', handleAccountsChanged);
    }

    if (chainType === CHAIN_TYPES.SOLANA) {
      const handleAccountChanged = (account) => {
        if (account) {
          setConnectedWallet(account);
        } else {
          setConnectedWallet('');
          setChainType('');
          setWalletProviderName('');
          setWalletProviderObject(null);
          setConnectedWalletObject(null);
        }
      };
      provider.on('accountChanged', handleAccountChanged);
      return () => provider.off('accountChanged', handleAccountChanged);
    }

    return () => {};
  }, [chainType, walletProviderName, walletProviderObject]);

  const findWalletProviderForAddress = useCallback(
    async (selectedChainType, requiredAddress) => {
      if (!availableChains.includes(selectedChainType)) {
        throw new Error(`${capitalize(selectedChainType)} is not available`);
      }

      const availableWalletsForChain = availableWallets[selectedChainType] || [];
      if (availableWalletsForChain.length === 0) {
        throw new Error(`No ${capitalize(selectedChainType)} wallets available`);
      }

      const normalizedRequiredAddress = requiredAddress.toLowerCase();

      if (connectedWallet && connectedWallet.toLowerCase() === normalizedRequiredAddress) {
        return { walletProviderId: walletProviderName, alreadyConnected: true, provider: walletProviderObject };
      }

      const checkWalletForAddress = async (wallet) => {
        try {
          const provider = wallet.getProvider(eip6963Providers);

          if (selectedChainType === CHAIN_TYPES.ETHEREUM) {
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            if (accounts && accounts.length > 0) {
              const walletAddress = accounts[0].toLowerCase();
              if (walletAddress === normalizedRequiredAddress) {
                return wallet;
              }
            }
          } else if (selectedChainType === CHAIN_TYPES.SOLANA) {
            if (provider.isConnected && provider.publicKey) {
              const walletAddress = provider.publicKey.toString().toLowerCase();
              if (walletAddress === normalizedRequiredAddress) {
                return wallet;
              }
            }
          }
          return null;
        } catch (error) {
          console.debug(`Could not check wallet ${wallet.name}:`, error);
          return null;
        }
      };

      const checkWalletsSequentially = async (wallets) => {
        if (wallets.length === 0) return null;

        const [firstWallet, ...remainingWallets] = wallets;
        const wallet = await checkWalletForAddress(firstWallet);

        if (wallet) {
          return {
            walletProviderId: wallet.id,
            alreadyConnected: false,
            provider: wallet.getProvider(eip6963Providers),
          };
        }

        return checkWalletsSequentially(remainingWallets);
      };

      const result = await checkWalletsSequentially(availableWalletsForChain);
      if (result) {
        return result;
      }

      // If we get here, no wallet with the required address has existing permissions
      const error = new Error(`Wallet with address ${requiredAddress} not found in connected wallets`);
      error.code = 'WALLET_NOT_FOUND';
      error.availableWallets = availableWalletsForChain;
      error.requiredAddress = requiredAddress;
      error.chainType = selectedChainType;
      throw error;
    },
    [availableChains, availableWallets, connectedWallet, walletProviderName, eip6963Providers]
  );

  // Enhanced connect wallet function
  const connectWallet = async ({ selectedChainType, walletProviderId = null, providerRdns = null }) => {
    setConnectingError('');

    if (!availableChains.includes(selectedChainType)) {
      setConnectingError(`${capitalize(selectedChainType)} is not available`);
      throw new Error(`${capitalize(selectedChainType)} is not available`);
    }

    const availableWalletsForChain = availableWallets[selectedChainType] || [];
    if (availableWalletsForChain.length === 0) {
      setConnectingError(`No ${capitalize(selectedChainType)} wallets available`);
      throw new Error(`No ${capitalize(selectedChainType)} wallets available`);
    }

    setIsConnectingWallet(true);

    let selectedWallet = null;
    if (walletProviderId) {
      selectedWallet = availableWalletsForChain.find((wallet) => wallet.id === walletProviderId);
    } else if (providerRdns) {
      selectedWallet = availableWalletsForChain.find((wallet) => wallet.rdns === providerRdns);
    }

    if (!selectedWallet) {
      const identifier = walletProviderId || providerRdns || 'unknown';
      setConnectingError(`Wallet provider ${identifier} is not available`);
      throw new Error(`Wallet provider ${identifier} is not available`);
    }

    const normalizedWalletName = selectedWallet.name.toLowerCase();

    try {
      if (selectedChainType === CHAIN_TYPES.ETHEREUM) {
        const provider = selectedWallet.getProvider(eip6963Providers);

        const address = await getEthereumWalletAddress(provider);
        setConnectedWallet(address);
        setChainType(CHAIN_TYPES.ETHEREUM);
        setWalletProviderName(normalizedWalletName);
        setWalletProviderObject(provider);
        setConnectedWalletObject(selectedWallet);

        return {
          address,
          chainType: CHAIN_TYPES.ETHEREUM,
          walletProvider: normalizedWalletName,
          provider,
        };
      }

      if (selectedChainType === CHAIN_TYPES.SOLANA) {
        const provider = selectedWallet.getProvider();
        const address = await getSolanaWalletAddress(provider);

        setConnectedWallet(address);
        setChainType(CHAIN_TYPES.SOLANA);
        setWalletProviderName(normalizedWalletName);
        setWalletProviderObject(provider);
        setConnectedWalletObject(selectedWallet);
        return { address, chainType: CHAIN_TYPES.SOLANA, walletProvider: normalizedWalletName, provider };
      }

      setConnectingError('Failed to connect wallet');
      throw new Error('Failed to connect wallet');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const disconnectWallet = useCallback(async () => {
    try {
      if (walletProviderObject && chainType) {
        if (chainType === CHAIN_TYPES.ETHEREUM) {
          try {
            if (walletProviderObject.request) {
              await walletProviderObject.request({
                method: 'wallet_revokePermissions',
                params: [{ eth_accounts: {} }],
              });
            }
          } catch (error) {
            // Not all wallets support permission revocation, so we continue
            console.warn('Wallet permission revocation not supported or failed:', error);
          }
        } else if (chainType === CHAIN_TYPES.SOLANA) {
          // For Solana wallets, call disconnect if available
          try {
            if (walletProviderObject.disconnect && typeof walletProviderObject.disconnect === 'function') {
              await walletProviderObject.disconnect();
            }
          } catch (error) {
            console.warn('Solana wallet disconnect failed:', error);
          }
        }
      }
    } catch (error) {
      console.warn('Error during wallet disconnection:', error);
    } finally {
      setConnectedWallet('');
      setChainType('');
      setWalletProviderName('');
      setWalletProviderObject(null);
      setConnectedWalletObject(null);
    }
  }, [walletProviderObject, chainType]);

  const getProviderInfo = useCallback((rdns) => {
    const provider = eip6963Store.findProvider(rdns);
    return provider?.info || null;
  }, []);

  return (
    <WalletContext.Provider
      value={useMemo(
        () => ({
          connectedWallet,
          chainType,
          walletProviderName,
          walletProviderObject,
          isConnectingWallet,
          connectingError,
          availableChains,
          availableWallets,
          connectWallet,
          disconnectWallet,
          getProviderInfo,
          findWalletProviderForAddress,
          connectedWalletObject,
        }),
        [
          connectedWallet,
          chainType,
          walletProviderName,
          walletProviderObject,
          isConnectingWallet,
          connectingError,
          availableChains,
          availableWallets,
          getProviderInfo,
          findWalletProviderForAddress,
          connectedWalletObject,
        ]
      )}
    >
      {children}
    </WalletContext.Provider>
  );
}

export default function useConnectWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useConnectWallet must be used within a WalletProvider');
  return ctx;
}
