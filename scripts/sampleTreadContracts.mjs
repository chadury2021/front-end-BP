import { getContract, getAllEvents } from '@treadfi/contracts';
import { JsonRpcProvider } from 'ethers';

const config = {
  chainId: 8453, // Base
  // rpcUrl: 'https://mainnet.base.org',
  rpcUrl: 'https://base.llamarpc.com',
  attestationAddress: '0xC31c7663873d36bC63bA28df4D40D0102F73D1B5',
  accessAddress: '0x40D245668ab0df4619Af6467e3036Cb68404083b',
};

const numberOfBlocks = 300;
const provider = new JsonRpcProvider(config.rpcUrl);
const latestBlockInt = await provider.getBlockNumber();
const startBlockInt = latestBlockInt - numberOfBlocks;
const latestBlockHex = '0x' + latestBlockInt.toString(16);
const startBlockHex = '0x' + startBlockInt.toString(16);

const blockRangeInt = {
  startBlock: startBlockInt,
  endBlock: latestBlockInt,
};
const blockRange = {
  startBlock: startBlockHex,
  endBlock: latestBlockHex,
};

console.log(`Trying to pull data for block range`, blockRange, 'which is', blockRangeInt);
/** @type {import('@treadfi/contracts').Attestations} */
const contract = getContract('Attestations', config.chainId).connect(provider);
const events = await getAllEvents(contract, contract.filters.AttestedToRisk(), blockRange, { verbose: true });
console.log(events);
