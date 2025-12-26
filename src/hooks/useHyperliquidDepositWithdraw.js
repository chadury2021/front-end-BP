import { useState, useEffect, useMemo, useCallback } from 'react';
import useConnectWallet from '@/shared/context/WalletProvider';
import { useToast } from '@/shared/context/ToastProvider';
import { BrowserProvider, Contract, parseUnits, formatUnits, formatEther, parseEther, isAddress } from 'ethers';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { CHAIN_TYPES } from '@/shared/dexUtils';
import { verifyDepositAddressSignatures } from '@/util/hyperunitGuardianVerify';
import {
  withdrawFromHyperliquid,
  spotSendFromHyperliquid,
  sendAsset,
} from '@/pages/keyManagement/hyperliquidApprovals';

const MAINNET_CONFIG = {
  arbitrumChainId: '0xa4b1',
  arbitrumChainName: 'Arbitrum One',
  arbitrumUsdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  hyperliquidBridge: '0x2df1c51e09aecf9cacb7bc98cb1742757f163df7',
  arbitrumScanUrl: 'https://arbiscan.io/tx/',
  ethChainId: '0x1',
  ethChainName: 'Ethereum Mainnet',
  hyperunitBaseUrl: 'https://api.hyperunit.xyz',
  solRpcUrl: 'https://solana-mainnet.g.alchemy.com/v2/Y4Uf-x3DQJ5H-DnzmVYn6aLu9-jr-jHi',
  ethScanUrl: 'https://etherscan.io/tx/',
  solScanUrl: 'https://solscan.io/tx/{txHash}',
  solChainName: 'Solana',
  hyperliquidBaseUrl: 'https://api.hyperliquid.xyz',
  ethTokenAddress: '0xe1edd30daaf5caac3fe63569e24748da',
  solTokenAddress: '0x49b67c39f5566535de22b29b0e51e685',
};

const TESTNET_CONFIG = {
  arbitrumChainId: '0x66eee',
  arbitrumChainName: 'Arbitrum Sepolia',
  arbitrumUsdc: '0x1baAbB04529D43a73232B713C0FE471f7c7334d5',
  hyperliquidBridge: '0x08cfc1B6b2dCF36A1480b99353A354AA8AC56f89',
  arbitrumScanUrl: 'https://sepolia.arbiscan.io/tx/',
  ethChainId: '0xaa36a7',
  ethChainName: 'Ethereum Sepolia',
  hyperunitBaseUrl: 'https://api.hyperunit-testnet.xyz',
  solRpcUrl: 'https://solana-devnet.g.alchemy.com/v2/Y4Uf-x3DQJ5H-DnzmVYn6aLu9-jr-jHi',
  ethScanUrl: 'https://sepolia.etherscan.io/tx/',
  solScanUrl: 'https://solscan.io/tx/{txHash}?cluster=devnet',
  solChainName: 'Solana Devnet',
  hyperliquidBaseUrl: 'https://api.hyperliquid-testnet.xyz',
  ethTokenAddress: '0xe4371d8166f362d6578725f11e0a14f3',
  solTokenAddress: '0x57ead23624b114018cc0e49d01cc7b6b',
};

const USDC_DECIMALS = 6;
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
];

const SUPPORTED_TOKENS = (config) => [
  {
    id: 'usdc',
    chainType: CHAIN_TYPES.ETHEREUM,
    minAmount: 5,
    isHyperunit: false,
    chainId: config.arbitrumChainId,
    chainName: config.arbitrumChainName,
  },
  {
    id: 'eth',
    chainType: CHAIN_TYPES.ETHEREUM,
    srcChain: 'ethereum',
    minAmount: 0.05,
    isHyperunit: true,
    chainId: config.ethChainId,
    chainName: config.ethChainName,
    l1Name: 'UETH',
    tokenAddress: config.ethTokenAddress,
  },
  {
    id: 'sol',
    chainType: CHAIN_TYPES.SOLANA,
    srcChain: 'solana',
    minAmount: 0.2,
    isHyperunit: true,
    chainName: config.solChainName,
    l1Name: 'USOL',
    tokenAddress: config.solTokenAddress,
  },
];

const SUPPORTED_BALANCES = (isMainnet) => {
  const defaults = [
    {
      id: 'spot',
      name: 'Spot',
    },
    {
      id: 'perps',
      name: 'Perps',
    },
  ];

  if (isMainnet) {
    return [
      ...defaults,
      {
        id: 'xyz',
        name: 'XYZ',
      },
    ];
  }

  return [
    ...defaults,
    {
      id: 'unit',
      name: 'Unit Dex',
    },
  ];
};

const getSolanaBalance = async (provider, config) => {
  const conn = new Connection(config.solRpcUrl, 'confirmed');

  const lamports = await conn.getBalance(new PublicKey(provider.publicKey));
  return lamports / LAMPORTS_PER_SOL;
};

const getEthBalance = async (provider, config) => {
  const ethersProvider = provider instanceof BrowserProvider ? provider : new BrowserProvider(provider);
  const balance = await ethersProvider.getBalance(provider.selectedAddress);
  return formatEther(balance);
};

const getUsdcBalance = async (provider, config) => {
  const ethersProvider = provider instanceof BrowserProvider ? provider : new BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();
  const usdc = new Contract(config.arbitrumUsdc, ERC20_ABI, signer);
  const balance = await usdc.balanceOf(signer.getAddress());
  return formatUnits(balance, USDC_DECIMALS);
};

const getHyperliquidUsdcBalance = async (config, hyperliquidAddress, dex = '') => {
  const response = await fetch(`${config.hyperliquidBaseUrl}/info`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      type: 'clearinghouseState',
      user: hyperliquidAddress,
      dex,
    }),
  });

  const data = await response.json();
  return data.withdrawable ? parseFloat(data.withdrawable) : 0;
};

const getHyperliquidUnitBalance = async (config, hyperliquidAddress, l1Name) => {
  const response = await fetch(`${config.hyperliquidBaseUrl}/info`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      type: 'spotClearinghouseState',
      user: hyperliquidAddress,
    }),
  });

  const data = await response.json();
  const coinData = data.balances.find((balance) => balance.coin === l1Name);
  return coinData?.total ? parseFloat(coinData.total) : 0;
};

const getHyperliquidBalance = async (config, hyperliquidAddress, token) => {
  if (token.id === 'usdc') {
    return getHyperliquidUsdcBalance(config, hyperliquidAddress);
  }

  if (token.isHyperunit) {
    return getHyperliquidUnitBalance(config, hyperliquidAddress, token.l1Name);
  }

  throw new Error(`Unsupported token: ${token.id}`);
};

const correctEvmNetwork = async (provider, token) => {
  if (token.chainType !== CHAIN_TYPES.ETHEREUM) {
    return;
  }

  if (provider?.chainId !== token.chainId) {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: token.chainId }],
      });
    } catch (error) {
      throw new Error(
        `Failed to switch wallet network to ${token.chainName} (${token.chainId}) for token [${token.id}]`
      );
    }
  }
};

const getBalance = async (provider, config, token) => {
  if (token.id === 'sol') {
    return getSolanaBalance(provider, config);
  }

  if (token.id === 'eth') {
    return getEthBalance(provider, config);
  }

  if (token.id === 'usdc') {
    return getUsdcBalance(provider, config);
  }

  throw new Error(`No balance, unsupported token: ${token.id}`);
};

const depositUSDCToHyperliquid = async (provider, amountStr, hyperliquidBridge, scanUrl, usdcAddress) => {
  const ethersProvider = provider instanceof BrowserProvider ? provider : new BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();
  const usdc = new Contract(usdcAddress, ERC20_ABI, signer);
  const amount = parseUnits(amountStr, USDC_DECIMALS);
  const tx = await usdc.transfer(hyperliquidBridge, amount);
  const receipt = await tx.wait();
  const txHash = receipt.hash;
  return { txHash, scanUrl: `${scanUrl}${txHash}` };
};

const depositEthToHyperunit = async (provider, amountStr, hyperunitAddress, scanUrl) => {
  const ethersProvider = provider instanceof BrowserProvider ? provider : new BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();

  const tx = await signer.sendTransaction({
    to: hyperunitAddress,
    value: parseEther(amountStr),
  });

  const receipt = await tx.wait();
  const txHash = receipt.hash;
  return { txHash, scanUrl: `${scanUrl}${txHash}` };
};

const depositSolToHyperunit = async (provider, amountStr, hyperunitAddress, scanUrl, solRpcUrl) => {
  const conn = new Connection(solRpcUrl, 'confirmed');

  const fromPubkey = new PublicKey(provider.publicKey);
  const toPubkey = new PublicKey(hyperunitAddress);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: parseFloat(amountStr) * LAMPORTS_PER_SOL,
    })
  );

  const { blockhash } = await conn.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  const { signature } = await provider.signAndSendTransaction(transaction);
  return { txHash: signature, scanUrl: `${scanUrl.replace('{txHash}', signature)}` };
};

const getDepositAddress = async (hyperliquidAddress, token, config, isMainnet) => {
  if (token.id === 'usdc') {
    return { address: config.hyperliquidBridge, verified: null };
  }

  const hyperunitUrl = `${config.hyperunitBaseUrl}/gen/${token.srcChain}/hyperliquid/${token.id}/${hyperliquidAddress}`;
  const response = await fetch(hyperunitUrl);
  const data = await response.json();

  const { signatures, address } = data;
  const proposal = {
    destinationAddress: hyperliquidAddress,
    destinationChain: 'hyperliquid',
    asset: token.id,
    address,
    coinType: token.srcChain,
  };

  const verified = await verifyDepositAddressSignatures(signatures, proposal, isMainnet);
  return { address, verified };
};

const getHyperunitWithdrawAddress = async (destinationAddress, token, isMainnet) => {
  const config = isMainnet ? MAINNET_CONFIG : TESTNET_CONFIG;
  const hyperunitUrl = `${config.hyperunitBaseUrl}/gen/hyperliquid/${token.srcChain}/${token.id}/${destinationAddress}`;
  const response = await fetch(hyperunitUrl);
  const data = await response.json();

  const { signatures, address } = data;
  const proposal = {
    destinationAddress,
    destinationChain: token.srcChain,
    asset: token.id,
    address,
    coinType: 'ethereum', // withdraw coins are from Unit, they are all on Ethereum
  };

  const verified = await verifyDepositAddressSignatures(signatures, proposal, isMainnet);
  return { address, verified };
};

const getHyperunitEstimateFees = async (config) => {
  const response = await fetch(`${config.hyperunitBaseUrl}//v2/estimate-fees`);
  const data = await response.json();
  return data;
};

const validateAddress = (address, chainType) => {
  if (chainType === CHAIN_TYPES.ETHEREUM) {
    return isAddress(address);
  }

  if (chainType === CHAIN_TYPES.SOLANA) {
    try {
      return PublicKey.isOnCurve(new PublicKey(address).toBytes());
    } catch {
      return false;
    }
  }

  return false;
};

const useHyperliquidDeposit = (address, isMainnet = false) => {
  const {
    connectedWallet,
    walletProviderObject: provider,
    chainType: providerChainType,
    disconnectWallet,
    connectedWalletObject: wallet,
  } = useConnectWallet();
  const { showToastMessage } = useToast();

  const [depositToken, setDepositToken] = useState(null);
  const [depositAddress, setDepositAddress] = useState(null);
  const [depositAddressVerified, setDepositAddressVerified] = useState(null);
  const [balance, setBalance] = useState(null);
  const [hyperunitFees, setHyperunitFees] = useState(null);

  const config = useMemo(() => (isMainnet ? MAINNET_CONFIG : TESTNET_CONFIG), [isMainnet]);

  const errorMessage = useMemo(() => {
    if (!provider) {
      return null;
    }

    if (depositToken?.id === 'usdc' && connectedWallet?.toLowerCase() !== address.toLowerCase()) {
      return 'For USDC deposits, the connected wallet address must match the Hyperliquid account address.';
    }

    if (depositToken?.chainType !== providerChainType) {
      return 'Connected wallet does not match deposit token chain. Please connect a wallet that supports the deposit token chain.';
    }

    return null;
  }, [provider, address, depositToken, providerChainType, connectedWallet]);

  // Fetch Hyperunit fees
  useEffect(() => {
    const fetchHyperunitFees = async () => {
      const fees = await getHyperunitEstimateFees(config);
      setHyperunitFees(fees);
    };

    if (!hyperunitFees && depositToken?.isHyperunit) {
      fetchHyperunitFees();
    }
  }, [config, depositToken]);

  // Fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (depositToken.chainType === CHAIN_TYPES.ETHEREUM) {
        try {
          await correctEvmNetwork(provider, depositToken);
        } catch (error) {
          showToastMessage({
            message: error.message,
            type: 'error',
          });
          return;
        }
      }

      try {
        const b = await getBalance(provider, config, depositToken);
        setBalance(b);
      } catch (error) {
        showToastMessage({
          message: `Failed to get balance for token [${depositToken.id}]: ${error.message}`,
          type: 'error',
        });
      }
    };

    if (depositToken?.chainType === providerChainType) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [provider, config, depositToken, providerChainType]);

  // If the deposit token chain type does not match the provider chain type, disconnect the wallet
  useEffect(() => {
    if (depositToken && providerChainType && depositToken.chainType !== providerChainType) {
      disconnectWallet();
      setBalance(null);
    }
  }, [depositToken, providerChainType]);

  const selectDepositToken = useCallback(
    async (token) => {
      if (depositToken?.id === token.id) {
        return;
      }

      setDepositAddress(null);
      setDepositAddressVerified(null);
      setDepositToken(token);
      try {
        const result = await getDepositAddress(address, token, config, isMainnet);
        const { address: depoAddr, verified } = result;
        setDepositAddress(depoAddr);
        setDepositAddressVerified(verified);
      } catch (error) {
        showToastMessage({
          message: `Failed to get deposit address for token ${token.id}: ${error.message}`,
          type: 'error',
        });
      }
    },
    [address, config, depositToken]
  );

  const depositCallback = useCallback(
    async (amountStr) => {
      if (!provider) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      const amount = parseFloat(amountStr);
      if (amount < depositToken.minAmount || amount > balance) {
        throw new Error(`Amount must be between ${depositToken.minAmount} and ${balance}`);
      }

      if (depositToken.chainType === CHAIN_TYPES.ETHEREUM) {
        await correctEvmNetwork(provider, depositToken);

        if (depositToken.id === 'eth') {
          return depositEthToHyperunit(provider, amountStr, depositAddress, config.ethScanUrl);
        }

        if (depositToken.id === 'usdc') {
          return depositUSDCToHyperliquid(
            provider,
            amountStr,
            depositAddress,
            config.arbitrumScanUrl,
            config.arbitrumUsdc
          );
        }
      }

      if (depositToken.id === 'sol') {
        return depositSolToHyperunit(provider, amountStr, depositAddress, config.solScanUrl, config.solRpcUrl);
      }

      throw new Error(`Unsupported token: ${depositToken.id}`);
    },
    [provider, depositToken, depositAddress, config, balance]
  );

  const supportedTokens = useMemo(() => SUPPORTED_TOKENS(config), [config]);

  return {
    balance,
    connectedAddress: connectedWallet,
    connectedWallet: wallet,
    deposit: depositCallback,
    supportedTokens,
    depositToken,
    depositAddress,
    depositAddressVerified,
    selectDepositToken,
    errorMessage,
    hyperunitFees,
  };
};

const useHyperliquidWithdraw = (address, isMainnet = false) => {
  const [withdrawToken, setWithdrawToken] = useState(null);
  const [withdrawBalance, setWithdrawBalance] = useState(null);
  const [hyperunitFees, setHyperunitFees] = useState(null);

  const {
    connectedWallet,
    walletProviderObject: provider,
    chainType: providerChainType,
    disconnectWallet,
    connectedWalletObject: wallet,
  } = useConnectWallet();

  const config = useMemo(() => (isMainnet ? MAINNET_CONFIG : TESTNET_CONFIG), [isMainnet]);
  const supportedTokens = useMemo(() => SUPPORTED_TOKENS(config), [config]);

  useEffect(() => {
    const fetchHyperunitFees = async () => {
      const fees = await getHyperunitEstimateFees(config);
      setHyperunitFees(fees);
    };

    if (!hyperunitFees && withdrawToken?.isHyperunit) {
      fetchHyperunitFees();
    }
  }, [config, withdrawToken]);

  const selectWithdrawToken = useCallback(
    async (token) => {
      if (withdrawToken?.id === token.id) {
        return;
      }

      setWithdrawToken(token);
      setWithdrawBalance(null);

      const balance = await getHyperliquidBalance(config, address, token);
      setWithdrawBalance(balance);
    },
    [address, config, withdrawToken]
  );

  const withdrawCallback = useCallback(
    async (amountStr, destinationAddress) => {
      if (!provider) {
        throw new Error('Wallet not connected. Please connect your wallet first.');
      }

      if (connectedWallet?.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Connected wallet address does not match Hyperliquid account address.');
      }

      const amount = parseFloat(amountStr);
      if (amount < withdrawToken.minAmount || amount > withdrawBalance) {
        throw new Error(`Amount must be between ${withdrawToken.minAmount} and ${withdrawBalance}`);
      }

      // For non-Hyperunit tokens, just withdraw from Hyperliquid
      if (!withdrawToken.isHyperunit) {
        await withdrawFromHyperliquid(provider, address, amountStr, isMainnet);
        return;
      }

      // For Hyperunit tokens
      if (!destinationAddress) {
        throw new Error('Destination address is required.');
      }

      if (!validateAddress(destinationAddress, withdrawToken.chainType)) {
        throw new Error(`Enter valid ${withdrawToken.chainType} destination address.`);
      }

      const { address: hyperunitAddress, verified } = await getHyperunitWithdrawAddress(
        destinationAddress,
        withdrawToken,
        isMainnet
      );

      if (!verified?.success) {
        throw new Error('Could not verify Hyperunit destination address.');
      }

      const tokenId = `${withdrawToken.l1Name}:${withdrawToken.tokenAddress}`;
      await spotSendFromHyperliquid(provider, hyperunitAddress, amountStr, tokenId, isMainnet);
    },
    [provider, address, isMainnet, withdrawToken, withdrawBalance, connectedWallet]
  );

  return {
    supportedTokens,
    withdrawToken,
    withdrawBalance,
    selectWithdrawToken,
    connectedAddress: connectedWallet,
    connectedWallet: wallet,
    disconnectWallet,
    withdraw: withdrawCallback,
    hyperunitFees,
  };
};

const useHyperliquidTransfer = (address, isMainnet = false) => {
  const [sourceBalance, setSourceBalance] = useState(null);
  const [sourceDex, setSourceDex] = useState('spot');
  const [destinationDex, setDestinationDex] = useState('perps');
  const [amount, setAmount] = useState(null);

  const {
    connectedWallet,
    walletProviderObject: provider,
    chainType: providerChainType,
    disconnectWallet,
    connectedWalletObject: wallet,
  } = useConnectWallet();

  const config = useMemo(() => (isMainnet ? MAINNET_CONFIG : TESTNET_CONFIG), [isMainnet]);
  const supportedBalances = useMemo(() => SUPPORTED_BALANCES(isMainnet), [isMainnet]); // TODO: get from backend

  useEffect(() => {
    const fetchTransferBalance = async () => {
      if (sourceDex === 'spot') {
        const balance = await getHyperliquidUnitBalance(config, address, 'USDC');
        setSourceBalance(balance);
        return;
      }

      const balance = await getHyperliquidUsdcBalance(config, address, sourceDex === 'perps' ? '' : sourceDex);
      setSourceBalance(balance);
    };

    setSourceBalance(null);
    if (sourceDex) {
      fetchTransferBalance();
    }
  }, [config, sourceDex, address]);

  const transfer = useCallback(async () => {
    if (!provider) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    if (connectedWallet?.toLowerCase() !== address.toLowerCase()) {
      throw new Error('Connected wallet address does not match Hyperliquid account address.');
    }

    if (!amount || amount > sourceBalance) {
      throw new Error(`Amount must be between 0 and ${sourceBalance}.`);
    }

    const normalizedSourceDex = sourceDex === 'perps' ? '' : sourceDex;
    const normalizedDestinationDex = destinationDex === 'perps' ? '' : destinationDex;
    await sendAsset(provider, address, amount, normalizedSourceDex, normalizedDestinationDex, 'USDC', isMainnet);
  }, [provider, amount, sourceDex, destinationDex]);

  return {
    supportedBalances,
    sourceBalance,
    sourceDex,
    destinationDex,
    setSourceDex,
    setDestinationDex,
    connectedAddress: connectedWallet,
    connectedWallet: wallet,
    disconnectWallet,
    amount,
    setAmount,
    transfer,
  };
};

export { useHyperliquidDeposit, useHyperliquidWithdraw, useHyperliquidTransfer };
