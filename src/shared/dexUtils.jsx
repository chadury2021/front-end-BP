import { getOKXDEXNonce } from '@/apiServices';
import bs58 from 'bs58';

export const CHAIN_TYPES = {
  ETHEREUM: 'evm',
  SOLANA: 'solana',
};

export const CHAIN_CONFIGS = {
  1: { name: 'Ethereum Mainnet', symbol: 'ETH', decimals: 18, walletType: 'evm' },
  56: { name: 'BSC', symbol: 'BNB', decimals: 18, walletType: 'evm' },
  8453: { name: 'Base', symbol: 'ETH', decimals: 18, walletType: 'evm' },
  501: { name: 'Solana', symbol: 'SOL', decimals: 9, walletType: 'solana' },
};

export const NATIVE_TOKENS = {
  1: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  56: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  8453: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  501: '11111111111111111111111111111111',
};

export const okxDexWalletSign = async (walletType, address, walletProvider) => {
  if (![CHAIN_TYPES.ETHEREUM, CHAIN_TYPES.SOLANA].includes(walletType)) {
    throw new Error(`Unsupported wallet type: ${walletType}`);
  }

  const { nonced_message } = await getOKXDEXNonce({ address, walletType });

  let signature;

  if (walletType === CHAIN_TYPES.ETHEREUM) {
    signature = await walletProvider.request({
      method: 'personal_sign',
      params: [nonced_message, address],
    });
  } else if (walletType === CHAIN_TYPES.SOLANA) {
    const encodedMessage = new TextEncoder().encode(nonced_message);
    const { signature: solanaSignature } = await walletProvider.signMessage(encodedMessage, 'utf8');
    signature = bs58.encode(solanaSignature);
  } else {
    throw new Error(`Unsupported wallet type: ${walletType}`);
  }

  return { message: nonced_message, signature };
};

export const getSupportedChains = (walletType) => {
  switch (walletType) {
    case 'evm':
      return ['1', '56', '8453'];
    case 'solana':
      return ['501'];
    default:
      return [];
  }
};

export const getTokenInfo = (tokenId) => {
  if (!tokenId) {
    return { tokenAddress: null, chainId: null };
  }

  const [tokenAddress, chainId] = tokenId.split(':');
  if (CHAIN_CONFIGS[chainId]) {
    return { tokenAddress, chainId };
  }

  return { tokenAddress: null, chainId: null };
};

export const isDexToken = (tokenId) => {
  return getTokenInfo(tokenId).chainId !== null;
};

export const buildTokenId = (tokenAddress, chainId) => {
  if (chainId !== '501' && chainId !== 501) {
    return `${tokenAddress.toLowerCase()}:${chainId}`;
  }

  return `${tokenAddress}:${chainId}`;
};

export const mapTokenAddressForCandles = (tokenAddress, chainId) => {
  if (chainId === '501' && tokenAddress === '11111111111111111111111111111111') {
    return 'So11111111111111111111111111111111111111112';
  }

  if (chainId === '1' && tokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    return '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
  }

  if (chainId === '56' && tokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    return '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
  }

  if (chainId === '8453' && tokenAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    return '0x4200000000000000000000000000000000000006';
  }

  return tokenAddress;
};
