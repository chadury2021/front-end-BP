import { BrowserProvider } from 'ethers';
import { ec, hash, num, typedData, stark } from 'starknet';
import { getUnixTime } from 'date-fns';

const REFERRAL_CODE = 'treadfi';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const getParadexBaseUrl = (isMainnet) => {
  const baseUrl = isMainnet ? 'https://api.prod.paradex.trade/v1' : 'https://api.testnet.paradex.trade/v1';
  return baseUrl;
};

const fetchParadexConfig = async (isMainnet) => {
  const response = await fetch(`${getParadexBaseUrl(isMainnet)}/system/config`);
  const data = await response.json();
  return data;
};

const correctEvmNetwork = async (provider, l1Chain) => {
  try {
    const chainIdHex = `0x${Number(l1Chain).toString(16)}`;
    if (provider.chainId !== chainIdHex) {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    }
  } catch (error) {
    throw new Error(`Failed to switch network to ${l1Chain}: ${error.message}`);
  }
};

const DOMAIN_TYPES = {
  StarkNetDomain: [
    { name: 'name', type: 'felt' },
    { name: 'chainId', type: 'felt' },
    { name: 'version', type: 'felt' },
  ],
};

const buildParadexDomain = (starknetChainId) => {
  return {
    name: 'Paradex',
    chainId: starknetChainId,
    version: '1',
  };
};

const buildOnboardingTypedData = (starknetChainId) => {
  const paradexDomain = buildParadexDomain(starknetChainId);
  return {
    domain: paradexDomain,
    primaryType: 'Constant',
    types: {
      ...DOMAIN_TYPES,
      Constant: [{ name: 'action', type: 'felt' }],
    },
    message: {
      action: 'Onboarding',
    },
  };
};

const buildAuthenticationTypedData = (starknetChainId, message) => {
  const paradexDomain = buildParadexDomain(starknetChainId);
  return {
    domain: paradexDomain,
    primaryType: 'Request',
    types: {
      ...DOMAIN_TYPES,
      Request: [
        { name: 'method', type: 'felt' },
        { name: 'path', type: 'felt' },
        { name: 'body', type: 'felt' },
        { name: 'timestamp', type: 'felt' },
        { name: 'expiration', type: 'felt' },
      ],
    },
    message,
  };
};

// Signing from eth chains
const signStarkKey = async (signer, chainId) => {
  const domain = {
    name: 'Paradex',
    version: '1',
    chainId,
  };

  const types = {
    Constant: [{ name: 'action', type: 'string' }],
  };

  const message = {
    action: 'STARK Key',
  };

  try {
    const signature = await signer.signTypedData(domain, types, message);
    return signature;
  } catch (error) {
    throw new Error(`Failed to sign Stark key: ${error.message}`);
  }
};

const computeParadexAddress = (config, publicKey) => {
  const pk = num.toHex(publicKey);
  const implHash = num.toHex(config.paraclear_account_hash);
  const proxyClassHash = num.toHex(config.paraclear_account_proxy_hash);

  const initializeSelector = hash.getSelectorFromName('initialize');

  const constructorCalldata = [implHash, initializeSelector, num.toHex(2), pk, num.toHex(0)];

  const deployerAddress = num.toHex(0);
  const salt = pk;
  const address = hash.calculateContractAddressFromHash(salt, proxyClassHash, constructorCalldata, deployerAddress);
  return address;
};

// Sign message on starknet chain
function signatureFromTypedData(paradexAddress, privateKey, td) {
  const msgHash = typedData.getMessageHash(td, paradexAddress);
  const { r, s } = ec.starkCurve.sign(msgHash, privateKey);
  return JSON.stringify([r.toString(), s.toString()]);
}

const signOnboardingRequest = (config, paradexAddress, privateKey) => {
  const td = buildOnboardingTypedData(config.starknet_chain_id);
  const signature = signatureFromTypedData(paradexAddress, privateKey, td);
  return signature;
};

const onboardUser = async (config, paradexAddress, privateKey, publicKey, ethereumAccount, isMainnet = false) => {
  const signature = signOnboardingRequest(config, paradexAddress, privateKey);
  const inputBody = JSON.stringify({
    public_key: publicKey,
    referral_code: REFERRAL_CODE,
  });

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'PARADEX-ETHEREUM-ACCOUNT': ethereumAccount,
    'PARADEX-STARKNET-ACCOUNT': paradexAddress,
    'PARADEX-STARKNET-SIGNATURE': signature,
  };

  const url = `${getParadexBaseUrl(isMainnet)}/onboarding`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: inputBody,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(`Failed to onboard user: ${data.message}`);
  }
};

const generateTimestamps = () => {
  const dateNow = new Date();
  const dateExpiration = new Date(dateNow.getTime() + SEVEN_DAYS_MS);

  return {
    timestamp: getUnixTime(dateNow),
    expiration: getUnixTime(dateExpiration),
  };
};

const signAuthenticationRequest = (config, paradexAddress, privateKey) => {
  const { timestamp, expiration } = generateTimestamps();

  const request = {
    method: 'POST',
    path: '/v1/auth',
    body: '',
    timestamp,
    expiration,
  };

  const td = buildAuthenticationTypedData(config.starknet_chain_id, request);
  const signature = signatureFromTypedData(paradexAddress, privateKey, td);
  return { signature, timestamp, expiration };
};

// Authenticate user on Paradex and get JWT token
const authenticateUser = async (config, paradexAddress, privateKey, publicKey, address, isMainnet = false) => {
  const { signature, timestamp, expiration } = signAuthenticationRequest(config, paradexAddress, privateKey);
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'PARADEX-STARKNET-ACCOUNT': paradexAddress,
    'PARADEX-STARKNET-SIGNATURE': signature,
    'PARADEX-TIMESTAMP': timestamp,
    'PARADEX-SIGNATURE-EXPIRATION': expiration,
  };

  const url = `${getParadexBaseUrl(isMainnet)}/auth`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
    });
    const data = await response.json();
    return data.jwt_token;
  } catch (error) {
    throw new Error(`Failed to authenticate user: ${error.message}`);
  }
};

// Create new starknet key and register it on Paradex
const registerSubkey = async (token, isMainnet = false) => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const privateKey = stark.randomAddress();
  const publicKey = ec.starkCurve.getStarkKey(privateKey);

  const body = {
    public_key: publicKey,
    key_type: 'starknet',
    name: 'treadfi',
  };

  const url = `${getParadexBaseUrl(isMainnet)}/account/keys/subkeys`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(`Failed to register subkey: ${data.message}`);
  }

  return privateKey;
};

const addParadexAccount = async ({ provider, isMainnet = false }) => {
  const ethersProvider = provider instanceof BrowserProvider ? provider : new BrowserProvider(provider);

  // Grab config from Paradex
  const config = await fetchParadexConfig(isMainnet);
  const l1Chain = config.l1_chain_id;

  // Switch to the correct network for signing
  await correctEvmNetwork(provider, l1Chain);

  const signer = await ethersProvider.getSigner();
  const address = await signer.getAddress();

  // Sign the Stark key and derive Paradex assets
  const signature = await signStarkKey(signer, l1Chain);
  const privateKey = ec.starkCurve.ethSigToPrivate(signature);
  const publicKey = ec.starkCurve.getStarkKey(privateKey);
  const paradexAddress = computeParadexAddress(config, publicKey);

  // Onboard the user on Paradex
  await onboardUser(config, paradexAddress, privateKey, publicKey, address, isMainnet);

  // Authenticate the user on Paradex
  const token = await authenticateUser(config, paradexAddress, privateKey, publicKey, address, isMainnet);

  // Craete Paradex subkey and register
  const privateSubKey = await registerSubkey(token, isMainnet);

  return { apiKey: paradexAddress, apiSecret: privateSubKey };
};

export { addParadexAccount };
