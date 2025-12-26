import { ethers } from 'ethers';
import { PromiseSemaphore } from './PromiseSemaphore';
import { BLOCK_STEP_SIZE, LATEST_BLOCK } from '../utils/chainConfig';

/**
 * @typedef {Object} BlockRange
 * @property {number} from - Starting block number
 * @property {number} to - Ending block number
 * @property {number} step - Size of the block range
 */

/**
 * Generates block ranges to search through using a constant batch size
 * @param {number} [latestBlock=LATEST_BLOCK] - Latest block number to start from (defaults to LATEST_BLOCK)
 * @param {number} [batchSize=BLOCK_STEP_SIZE] - Fixed size of block ranges (defaults to BLOCK_STEP_SIZE)
 * @returns {BlockRange[]} Array of block ranges to search
 */
export function generateSearchRanges(latestBlock = LATEST_BLOCK, batchSize = BLOCK_STEP_SIZE) {
  const ranges = [];
  let current = latestBlock;

  if (current === 0) return [];

  while (current >= 0) {
    const from = Math.max(0, current - batchSize + 1);
    ranges.push({ from, to: current, step: batchSize });
    current = from - 1;
  }

  return ranges;
}

/**
 * Checks a single block range for activity
 * @param {ethers.Provider} provider - Ethers provider instance
 * @param {string} attestationAddress - Contract address to check
 * @param {BlockRange} range - Block range to check
 * @param {AbortSignal} signal - Signal for cancelling the request
 * @returns {Promise<number>} Highest block with activity in range, or 0 if none found
 */
async function checkBlockRangeForActivity(provider, attestationAddress, range, signal) {
  try {
    const logs = await provider.getLogs({
      address: attestationAddress,
      fromBlock: ethers.toBeHex(range.from),
      toBlock: ethers.toBeHex(range.to),
      signal,
    });

    console.debug('[checkBlockRangeForActivity]', {
      from: range.from,
      to: range.to,
      found: logs.length,
    });

    return logs.length > 0 ? Math.max(...logs.map((log) => log.blockNumber)) : 0;
  } catch (error) {
    if (error.name === 'AbortError') return 0;
    throw error;
  }
}

/**
 * Scans backwards through blocks to find the most recent block containing activity,
 * using parallel processing with early stopping.
 *
 * @param {string} rpcUrl - URL of the RPC endpoint
 * @param {string} attestationAddress - Contract address to check for activity
 * @param {number} [initialBatchSize=BLOCK_STEP_SIZE] - Initial size of block ranges to check
 * @param {number} [initialBlock=null] - Initial block to start searching from
 * @returns {Promise<number>} Most recent block with activity, or 0 if none found
 */
export async function findLatestActiveBlock(
  rpcUrl,
  attestationAddress,
  initialBatchSize = BLOCK_STEP_SIZE,
  initialBlock = null
) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const latestBlock = initialBlock || (await provider.getBlockNumber());
  let lastActiveBlock = 0;
  const abortController = new AbortController();

  console.debug('[findLatestActiveBlock] Starting search from block:', latestBlock);

  try {
    const ranges = generateSearchRanges(latestBlock, initialBatchSize);
    const semaphore = new PromiseSemaphore(5);

    const tasks = ranges.map((range) => async () => {
      if (lastActiveBlock > range.to) return 0;

      const result = await checkBlockRangeForActivity(provider, attestationAddress, range, abortController.signal);

      if (result > 0) {
        lastActiveBlock = Math.max(lastActiveBlock, result);
        abortController.abort();
      }

      return result;
    });

    await semaphore.executeAll(tasks);
    return lastActiveBlock;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('[findLatestActiveBlock] Fatal error:', error);
      throw error;
    }
    return lastActiveBlock;
  }
}
