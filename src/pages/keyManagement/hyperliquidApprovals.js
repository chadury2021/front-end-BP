import { BrowserProvider, Wallet, ethers } from 'ethers';

const MAX_FEE_RATE = '0.1%';

function generateNonce() {
  return Date.now();
}

function generateAgent() {
  return Wallet.createRandom();
}

function getHyperliquidResources(isMainnet) {
  const baseUrl = isMainnet ? 'https://api.hyperliquid.xyz' : 'https://api.hyperliquid-testnet.xyz';
  const hyperliquidChain = isMainnet ? 'Mainnet' : 'Testnet';
  return { baseUrl, hyperliquidChain };
}

async function postHyperliquidAction(action, nonce, signature, isMainnet) {
  const { baseUrl } = getHyperliquidResources(isMainnet);
  const payload = {
    action,
    nonce,
    signature,
  };

  try {
    const res = await fetch(`${baseUrl}/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.status === 'err') {
      // Provide more specific error messages based on the response
      const errorResponse = data.response || 'Unknown error';

      // Handle common Hyperliquid errors
      if (errorResponse.includes('Must deposit before performing actions')) {
        throw new Error(
          `Must deposit before performing actions. Please deposit funds to your Hyperliquid account first.`
        );
      } else if (errorResponse.includes('Invalid signature')) {
        throw new Error(`Invalid signature. Please try again and ensure you approve the signature request.`);
      } else if (errorResponse.includes('Nonce already used')) {
        throw new Error(`Nonce already used. Please try again.`);
      } else if (errorResponse.includes('Invalid builder')) {
        throw new Error(`Invalid builder address. Please contact support.`);
      } else if (errorResponse.includes('Invalid agent')) {
        throw new Error(`Invalid agent address. Please contact support.`);
      } else {
        throw new Error(`Hyperliquid request failed: ${errorResponse}`);
      }
    }
  } catch (error) {
    // Re-throw the error if it's already been processed
    if (
      error.message.includes('Hyperliquid request failed') ||
      error.message.includes('Must deposit before performing actions') ||
      error.message.includes('Invalid signature') ||
      error.message.includes('Nonce already used') ||
      error.message.includes('Invalid builder') ||
      error.message.includes('Invalid agent')
    ) {
      throw error;
    }

    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }

    // Generic error handling
    throw new Error(`Hyperliquid request failed: ${error.message}`);
  }
}

async function signApproveBuilderFee(signer, chainId, nonce, isMainnet, builderAddress) {
  const chainIdHex = `0x${chainId.toString(16)}`;
  const { hyperliquidChain } = getHyperliquidResources(isMainnet);

  const domain = {
    name: 'HyperliquidSignTransaction',
    version: '1',
    chainId,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  };

  const types = {
    'HyperliquidTransaction:ApproveBuilderFee': [
      { name: 'hyperliquidChain', type: 'string' },
      { name: 'maxFeeRate', type: 'string' },
      { name: 'builder', type: 'address' },
      { name: 'nonce', type: 'uint64' },
    ],
  };

  const action = {
    type: 'approveBuilderFee',
    hyperliquidChain,
    signatureChainId: chainIdHex,
    maxFeeRate: MAX_FEE_RATE,
    builder: builderAddress,
    nonce,
  };

  try {
    const signature = await signer.signTypedData(domain, types, action);
    const { r, s, v } = ethers.Signature.from(signature);
    return { action, signature: { r, s, v } };
  } catch (e) {
    if (e.code === 4001) {
      throw new Error('Signature request was rejected by user.');
    } else if (e.message.includes('User rejected')) {
      throw new Error('Signature request was rejected by user.');
    } else if (e.message.includes('User denied')) {
      throw new Error('Signature request was denied by user.');
    } else {
      throw new Error('Signature request failed. Please try again and approve the signature in your wallet.');
    }
  }
}

async function signApproveAgent(signer, chainId, nonce, isMainnet, agentAddress, walletAddress, vaultAddress) {
  const chainIdHex = `0x${chainId.toString(16)}`;
  const { hyperliquidChain } = getHyperliquidResources(isMainnet);

  const domain = {
    name: 'HyperliquidSignTransaction',
    version: '1',
    chainId,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  };

  const types = {
    'HyperliquidTransaction:ApproveAgent': [
      { name: 'hyperliquidChain', type: 'string' },
      { name: 'agentAddress', type: 'address' },
      { name: 'agentName', type: 'string' },
      { name: 'nonce', type: 'uint64' },
    ],
  };

  const [prefix, address] = (vaultAddress || walletAddress).split('0x');
  const agentNameAddress = prefix || address;

  const action = {
    type: 'approveAgent',
    hyperliquidChain,
    signatureChainId: chainIdHex,
    agentAddress,
    agentName: `tread-${agentNameAddress.toLowerCase()}`.slice(0, 16),
    nonce,
  };

  try {
    const signature = await signer.signTypedData(domain, types, action);
    const { r, s, v } = ethers.Signature.from(signature);
    return { action, signature: { r, s, v } };
  } catch (e) {
    if (e.code === 4001) {
      throw new Error('Signature request was rejected by user.');
    } else if (e.message.includes('User rejected')) {
      throw new Error('Signature request was rejected by user.');
    } else if (e.message.includes('User denied')) {
      throw new Error('Signature request was denied by user.');
    } else {
      throw new Error('Signature request failed. Please try again and approve the signature in your wallet.');
    }
  }
}

async function signWithdraw(signer, chainId, nonce, isMainnet, address, amount) {
  const chainIdHex = `0x${chainId.toString(16)}`;
  const { hyperliquidChain } = getHyperliquidResources(isMainnet);

  const domain = {
    name: 'HyperliquidSignTransaction',
    version: '1',
    chainId,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  };

  const types = {
    'HyperliquidTransaction:Withdraw': [
      { name: 'hyperliquidChain', type: 'string' },
      { name: 'destination', type: 'string' },
      { name: 'amount', type: 'string' },
      { name: 'time', type: 'uint64' },
    ],
  };

  const action = {
    destination: address,
    amount,
    time: nonce,
    type: 'withdraw3',
    hyperliquidChain,
    signatureChainId: chainIdHex,
  };

  try {
    const signature = await signer.signTypedData(domain, types, action);
    const { r, s, v } = ethers.Signature.from(signature);
    return { action, signature: { r, s, v } };
  } catch (e) {
    if (e.code === 4001) {
      throw new Error('Signature request was rejected by user.');
    } else if (e.message.includes('User rejected')) {
      throw new Error('Signature request was rejected by user.');
    } else if (e.message.includes('User denied')) {
      throw new Error('Signature request was denied by user.');
    } else {
      throw new Error('Signature request failed. Please try again and approve the signature in your wallet.', e);
    }
  }
}

async function signSpotSend(signer, chainId, nonce, isMainnet, address, amount, token) {
  const chainIdHex = `0x${chainId.toString(16)}`;
  const { hyperliquidChain } = getHyperliquidResources(isMainnet);

  const domain = {
    name: 'HyperliquidSignTransaction',
    version: '1',
    chainId,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  };

  const types = {
    'HyperliquidTransaction:SpotSend': [
      { name: 'hyperliquidChain', type: 'string' },
      { name: 'destination', type: 'string' },
      { name: 'token', type: 'string' },
      { name: 'amount', type: 'string' },
      { name: 'time', type: 'uint64' },
    ],
  };

  const action = {
    destination: address,
    token,
    amount,
    time: nonce,
    type: 'spotSend',
    hyperliquidChain,
    signatureChainId: chainIdHex,
  };

  try {
    const signature = await signer.signTypedData(domain, types, action);
    const { r, s, v } = ethers.Signature.from(signature);
    return { action, signature: { r, s, v } };
  } catch (e) {
    if (e.code === 4001) {
      throw new Error('Signature request was rejected by user.');
    } else if (e.message.includes('User rejected')) {
      throw new Error('Signature request was rejected by user.');
    } else if (e.message.includes('User denied')) {
      throw new Error('Signature request was denied by user.');
    } else {
      throw new Error('Signature request failed. Please try again and approve the signature in your wallet.', e);
    }
  }
}

async function signSendAsset(signer, chainId, nonce, isMainnet, address, amount, sourceDex, destinationDex, token) {
  const chainIdHex = `0x${chainId.toString(16)}`;
  const { hyperliquidChain } = getHyperliquidResources(isMainnet);

  const domain = {
    name: 'HyperliquidSignTransaction',
    version: '1',
    chainId,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  };

  const types = {
    'HyperliquidTransaction:SendAsset': [
      { name: 'hyperliquidChain', type: 'string' },
      { name: 'destination', type: 'string' },
      { name: 'sourceDex', type: 'string' },
      { name: 'destinationDex', type: 'string' },
      { name: 'token', type: 'string' },
      { name: 'amount', type: 'string' },
      { name: 'fromSubAccount', type: 'string' },
      { name: 'nonce', type: 'uint64' },
    ],
  };

  const action = {
    hyperliquidChain,
    destination: address,
    sourceDex,
    destinationDex,
    token,
    amount,
    nonce,
    type: 'sendAsset',
    fromSubAccount: '',
    signatureChainId: chainIdHex,
  };

  try {
    const signature = await signer.signTypedData(domain, types, action);
    const { r, s, v } = ethers.Signature.from(signature);
    return { action, signature: { r, s, v } };
  } catch (e) {
    if (e.code === 4001) {
      throw new Error('Signature request was rejected by user.');
    } else if (e.message.includes('User rejected')) {
      throw new Error('Signature request was rejected by user.');
    } else if (e.message.includes('User denied')) {
      throw new Error('Signature request was denied by user.');
    } else {
      throw new Error('Signature request failed. Please try again and approve the signature in your wallet.', e);
    }
  }
}

async function signAndPostBuilder(signer, chainId, nonce, isMainnet, builderAddress) {
  const { action, signature } = await signApproveBuilderFee(signer, chainId, nonce, isMainnet, builderAddress);
  await postHyperliquidAction(action, nonce, signature, isMainnet);
}

async function signAndPostAgent(signer, chainId, nonce, isMainnet, agentAddress, walletAddress, vaultAddress) {
  const { action, signature } = await signApproveAgent(
    signer,
    chainId,
    nonce,
    isMainnet,
    agentAddress,
    walletAddress,
    vaultAddress
  );
  await postHyperliquidAction(action, nonce, signature, isMainnet);
}

/**
 * Entire flow of approving user for agent and builder to Hyperliquid
 * Returns api key and api secret if successful
 */
async function addHyperliquidAccount({ builderAddress, provider, isMainnet = false, vaultAddress }) {
  // Handle EIP-6963 providers by wrapping with BrowserProvider
  const ethersProvider = provider instanceof BrowserProvider ? provider : new BrowserProvider(provider);

  const network = await ethersProvider.getNetwork();

  const agent = generateAgent();
  const signer = await ethersProvider.getSigner();
  const address = await signer.getAddress();

  await signAndPostBuilder(signer, network.chainId, generateNonce(), isMainnet, builderAddress);
  await signAndPostAgent(signer, network.chainId, generateNonce(), isMainnet, agent.address, address, vaultAddress);

  return { apiKey: address, apiSecret: agent.privateKey };
}

/**
 * Withdraw USDC from Hyperliquid
 */
async function withdrawFromHyperliquid(provider, address, amount, isMainnet = false) {
  const ethersProvider = provider instanceof BrowserProvider ? provider : new BrowserProvider(provider);

  const network = await ethersProvider.getNetwork();
  const signer = await ethersProvider.getSigner();
  const nonce = generateNonce();

  const { action, signature } = await signWithdraw(signer, network.chainId, nonce, isMainnet, address, amount);
  await postHyperliquidAction(action, nonce, signature, isMainnet);
}

/**
 * Spot send assets from Hyperliquid. Used for Hyperunit withdrawals.
 */
async function spotSendFromHyperliquid(provider, address, amount, token, isMainnet = false) {
  const ethersProvider = provider instanceof BrowserProvider ? provider : new BrowserProvider(provider);
  const network = await ethersProvider.getNetwork();
  const signer = await ethersProvider.getSigner();
  const nonce = generateNonce();

  const { action, signature } = await signSpotSend(signer, network.chainId, nonce, isMainnet, address, amount, token);
  await postHyperliquidAction(action, nonce, signature, isMainnet);
}

/**
 * Transfer assets between balances of different dexes.
 * Spot, default perp dex, builder deployed perp dex.
 * Support only USDC for now.
 */
async function sendAsset(provider, address, amount, sourceDex, destinationDex, token, isMainnet = false) {
  const ethersProvider = provider instanceof BrowserProvider ? provider : new BrowserProvider(provider);
  const network = await ethersProvider.getNetwork();
  const signer = await ethersProvider.getSigner();
  const nonce = generateNonce();

  const { action, signature } = await signSendAsset(
    signer,
    network.chainId,
    nonce,
    isMainnet,
    address,
    amount,
    sourceDex,
    destinationDex,
    'USDC' // TODO: support other tokens
  );
  await postHyperliquidAction(action, nonce, signature, isMainnet);
}

export { addHyperliquidAccount, withdrawFromHyperliquid, spotSendFromHyperliquid, sendAsset };
