import { BrowserProvider, ethers } from 'ethers';
import bs58 from 'bs58';
import { CHAIN_TYPES } from '@/shared/dexUtils';

const AGENT_CODE = '248Dbf';

async function getNonce(address, actionType, isSolana = false) {
  const url = 'https://www.asterdex.com/bapi/futures/v1/public/future/web3/get-nonce';

  const payload = {
    sourceAddr: address,
    type: actionType,
  };

  if (isSolana) {
    payload.network = 'SOL';
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message);
  }

  if (!data?.data?.nonce) {
    throw new Error('Nonce is not found');
  }

  return data.data.nonce;
}

async function generateMessage(address, actionType, isSolana) {
  const nonce = await getNonce(address, actionType, isSolana);
  return `You are signing into Astherus ${nonce}`;
}

async function postLogin(address, signature, isSolana) {
  const url = 'https://www.asterdex.com/bapi/futures/v1/public/future/web3/ae/login';

  const payload = {
    signature,
    sourceAddr: address,
    agentCode: AGENT_CODE,
  };

  if (isSolana) {
    payload.network = 'SOL';
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      clienttype: 'web',
    },
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data?.success) {
    throw new Error(data.message);
  }

  return data?.success;
}

async function postCreateApiKey(address, signature, isSolana) {
  const url = 'https://www.asterdex.com/bapi/futures/v1/public/future/web3/broker-create-api-key';

  const randomSuffix = Math.random().toString(36).slice(2, 10);
  const payload = {
    sourceAddr: address,
    signature,
    type: 'CREATE_API_KEY',
    desc: `treadfi-${randomSuffix}`, // add random suffix to avoid duplicate API keys
    ip: '',
    sourceCode: 'ae',
  };

  if (isSolana) {
    payload.network = 'SOL';
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data?.success) {
    throw new Error(data.message);
  }

  if (!data?.data?.apiKey || !data?.data?.apiSecret) {
    throw new Error('API key or API secret is not found');
  }

  return { apiKey: data.data.apiKey, apiSecret: data.data.apiSecret };
}

async function signMessage(address, message, provider, walletType) {
  let signature;
  if (walletType === CHAIN_TYPES.ETHEREUM) {
    signature = await provider.request({
      method: 'personal_sign',
      params: [message, address],
    });
  } else if (walletType === CHAIN_TYPES.SOLANA) {
    const encodedMessage = new TextEncoder().encode(message);
    const { signature: solanaSignature } = await provider.signMessage(encodedMessage, 'utf8');
    signature = bs58.encode(solanaSignature);
  } else {
    throw new Error(`Unsupported wallet type: ${walletType}`);
  }

  return signature;
}

async function addAsterAccount({ address, provider, walletType }) {
  const isSolana = walletType === CHAIN_TYPES.SOLANA;

  // Login user to ensure new users are created and referral code is applied
  const loginMessage = await generateMessage(address, 'LOGIN', isSolana);
  const loginSignature = await signMessage(address, loginMessage, provider, walletType);
  await postLogin(address, loginSignature, isSolana);

  // Create API key for user
  const createApiKeyMessage = await generateMessage(address, 'CREATE_API_KEY', isSolana);
  const createApiKeySignature = await signMessage(address, createApiKeyMessage, provider, walletType);
  const createApiKeyResult = await postCreateApiKey(address, createApiKeySignature, isSolana);
  return createApiKeyResult;
}

export { addAsterAccount };
