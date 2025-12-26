// Constants
export const TESTNET_GUARDIAN_NODES = [
  {
    nodeId: 'node-1',
    publicKey:
      '04bab844e8620c4a1ec304df6284cd6fdffcde79b3330a7bffb1e4cecfee72d02a7c1f3a4415b253dc8d6ca2146db170e1617605cc8a4160f539890b8a24712152',
  },
  {
    nodeId: 'hl-node-testnet',
    publicKey:
      '04502d20a0d8d8aaea9395eb46d50ad2d8278c1b3a3bcdc200d531253612be23f5f2e9709bf3a3a50d1447281fa81aca0bf2ac2a6a3cb8a12978381d73c24bb2d9',
  },
  {
    nodeId: 'field-node',
    publicKey:
      '04e674a796ff01d6b74f4ee4079640729797538cdb4926ec333ce1bd18414ef7f22c1a142fd76dca120614045273f30338cd07d79bc99872c76151756aaec0f8e8',
  },
];

export const MAINNET_GUARDIAN_NODES = [
  {
    nodeId: 'unit-node',
    publicKey:
      '04dc6f89f921dc816aa69b687be1fcc3cc1d48912629abc2c9964e807422e1047e0435cb5ba0fa53cb9a57a9c610b4e872a0a2caedda78c4f85ebafcca93524061',
  },
  {
    nodeId: 'hl-node',
    publicKey:
      '048633ea6ab7e40cdacf37d1340057e84bb9810de0687af78d031e9b07b65ad4ab379180ab55075f5c2ebb96dab30d2c2fab49d5635845327b6a3c27d20ba4755b',
  },
  {
    nodeId: 'field-node',
    publicKey:
      '04ae2ab20787f816ea5d13f36c4c4f7e196e29e867086f3ce818abb73077a237f841b33ada5be71b83f4af29f333dedc5411ca4016bd52ab657db2896ef374ce99',
  },
];

const GUARDIAN_SIGNATURE_THRESHOLD = 2;

function hexToBytes(hex) {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function buildPayload(nodeId, p) {
  const s = `${nodeId}:${['user', p.coinType, p.destinationChain, p.destinationAddress, p.address].join('-')}`;
  return new TextEncoder().encode(s);
}

async function importGuardianPubkey(uncompressedP256Hex) {
  const bytes = hexToBytes(uncompressedP256Hex);
  if (bytes.length !== 65 || bytes[0] !== 0x04) {
    throw new Error('Invalid uncompressed P-256 public key');
  }
  return crypto.subtle.importKey('raw', bytes, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
}

async function verifySignature(pubKey, messageBytes, signatureB64) {
  const sig = b64ToBytes(signatureB64);
  if (sig.length !== 64) return false; // raw r||s (64 bytes)
  return crypto.subtle.verify({ name: 'ECDSA', hash: { name: 'SHA-256' } }, pubKey, sig, messageBytes);
}

async function verifyDepositAddressSignatures(signatures, proposal, isMainnet) {
  const nodes = isMainnet ? MAINNET_GUARDIAN_NODES : TESTNET_GUARDIAN_NODES;

  // Import guardian keys
  const imported = await Promise.all(
    nodes.map(async (n) => ({
      nodeId: n.nodeId,
      publicKey: await importGuardianPubkey(n.publicKey),
    }))
  );

  let verifiedCount = 0;
  const verificationDetails = {};
  const errors = [];

  await Promise.all(
    imported.map(async ({ nodeId, publicKey }) => {
      try {
        const sig = signatures[nodeId];
        if (!sig) {
          verificationDetails[nodeId] = false;
          return;
        }

        const isVerified = await verifySignature(publicKey, buildPayload(nodeId, proposal), sig);
        verificationDetails[nodeId] = isVerified;
        if (isVerified) verifiedCount += 1;
      } catch (e) {
        verificationDetails[nodeId] = false;
        errors.push(`Node ${nodeId}: ${e && e.message ? e.message : 'verification error'}`);
      }
    })
  );

  return {
    success: verifiedCount >= GUARDIAN_SIGNATURE_THRESHOLD,
    verifiedCount,
    verificationDetails,
    errors: errors.length ? errors : undefined,
  };
}

export { verifyDepositAddressSignatures };
