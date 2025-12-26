import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

const MAX_FEE_RATE = '0.0002'; // 0.02%
const BUILDER_CODE = 'treadfi';

function getApiUrl(isMainnet) {
  return isMainnet ? 'https://api.pacifica.fi' : 'https://test-api.pacifica.fi';
}

function getReferralCode(isMainnet) {
  return isMainnet ? 'treadfi' : 'pump';
}

async function generateNonce() {
  return Date.now();
}

async function signAndPostCreateApiKey({ provider, nonce, agentWallet, address, isMainnet }) {
  const signatureHeader = {
    expiry_window: 300000,
    timestamp: nonce,
    type: 'bind_agent_wallet',
  };

  const payload = {
    agent_wallet: agentWallet,
  };

  const message = {
    data: payload,
    ...signatureHeader,
  };

  const encodedMessage = new TextEncoder().encode(JSON.stringify(message));
  const { signature } = await provider.signMessage(encodedMessage, 'utf8');

  const requestBody = {
    account: address,
    signature: bs58.encode(signature),
    timestamp: signatureHeader.timestamp,
    expiry_window: signatureHeader.expiry_window,
    ...payload,
  };

  const url = `${getApiUrl(isMainnet)}/api/v1/agent/bind`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message);
  }

  return data.success;
}

async function signAndPostBuilderCode({ provider, nonce, address, isMainnet }) {
  const signatureHeader = {
    expiry_window: 300000,
    timestamp: nonce,
    type: 'approve_builder_code',
  };

  const payload = {
    builder_code: BUILDER_CODE,
    max_fee_rate: MAX_FEE_RATE,
  };

  const message = {
    data: payload,
    ...signatureHeader,
  };

  const encodedMessage = new TextEncoder().encode(JSON.stringify(message));
  const { signature } = await provider.signMessage(encodedMessage, 'utf8');

  const requestBody = {
    account: address,
    agent_wallet: null,
    signature: bs58.encode(signature),
    timestamp: signatureHeader.timestamp,
    expiry_window: signatureHeader.expiry_window,
    ...payload,
  };

  const url = `${getApiUrl(isMainnet)}/api/v1/account/builder_codes/approve`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error);
  }

  return data.success;
}

async function signAndPostReferralClaim({ nonce, keypair, address, isMainnet }) {
  const signatureHeader = {
    expiry_window: 300000,
    timestamp: nonce,
    type: 'claim_referral_code',
  };

  const payload = {
    code: getReferralCode(isMainnet),
  };

  const message = {
    data: payload,
    ...signatureHeader,
  };

  const encodedMessage = new TextEncoder().encode(JSON.stringify(message));
  const signature = nacl.sign.detached(encodedMessage, keypair.secretKey);

  const requestBody = {
    account: address,
    agent_wallet: keypair.publicKey.toString(),
    signature: bs58.encode(signature),
    timestamp: signatureHeader.timestamp,
    expiry_window: signatureHeader.expiry_window,
    ...payload,
  };

  const url = `${getApiUrl(isMainnet)}/api/v1/referral/user/code/claim`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  return data.success;
}

async function addPacificaAccount({ provider, isMainnet = false }) {
  const keypair = Keypair.generate();
  const publicKey = keypair.publicKey.toString();
  const secretKey = bs58.encode(keypair.secretKey);

  const address = provider.publicKey.toBase58();

  const builderCodeNonce = await generateNonce();
  const builderCodeSuccess = await signAndPostBuilderCode({
    provider,
    nonce: builderCodeNonce,
    address,
    isMainnet,
  });
  if (!builderCodeSuccess) {
    throw new Error('Failed to approve builder code');
  }

  const nonce = await generateNonce();
  const success = await signAndPostCreateApiKey({ provider, nonce, agentWallet: publicKey, address, isMainnet });
  if (!success) {
    throw new Error('Failed to create API key');
  }

  const claimNonce = await generateNonce();
  try {
    await signAndPostReferralClaim({
      nonce: claimNonce,
      keypair,
      address,
      isMainnet,
    });
  } catch (error) {
    // Ignore error if referral code is already claimed
  }

  return { publicKey: address, secretKey };
}

export { addPacificaAccount, signAndPostBuilderCode };
