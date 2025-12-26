import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ethers } from 'ethers';
import { findLatestActiveBlock, generateSearchRanges } from '../findLatestActiveBlock';
import { mockProvider } from '../mocks';
import { BLOCK_STEP_SIZE } from '../../utils/chainConfig';

/**
 * Test suite focusing on the inclusive range behavior of generateSearchRanges.
 * These tests verify that the ranges generated include both the start and end blocks,
 * which is critical for ensuring no blocks are missed during the search process.
 * This matches the behavior of ethers.js getLogs() filters which are inclusive on both ends.
 */
describe('generateSearchRanges', () => {
  /**
   * Verifies that small ranges are correctly generated with both ends inclusive.
   * Using small numbers makes it easier to verify the inclusive behavior.
   */
  it('should generate ranges that are inclusive on both ends', () => {
    // Test with small numbers to make the inclusivity clear
    const ranges = generateSearchRanges(5, 2);
    expect(ranges).toEqual([
      { from: 4, to: 5, step: 2 }, // 4,5
      { from: 2, to: 3, step: 2 }, // 2,3
      { from: 0, to: 1, step: 2 }, // 0,1
    ]);
  });

  it('should maintain inclusivity when batchSize does not divide evenly', () => {
    const ranges = generateSearchRanges(7, 3);
    expect(ranges).toEqual([
      { from: 5, to: 7, step: 3 }, // 5,6,7
      { from: 2, to: 4, step: 3 }, // 2,3,4
      { from: 0, to: 1, step: 3 }, // 0,1
    ]);
  });

  it('should handle single block range correctly', () => {
    const ranges = generateSearchRanges(1, 1);
    expect(ranges).toEqual([
      { from: 1, to: 1, step: 1 }, // Just block 1
      { from: 0, to: 0, step: 1 }, // Just block 0
    ]);
  });

  it('should generate correct ranges starting from latest block', () => {
    const ranges = generateSearchRanges(99, 10);
    expect(ranges).toEqual([
      { from: 90, to: 99, step: 10 },
      { from: 80, to: 89, step: 10 },
      { from: 70, to: 79, step: 10 },
      { from: 60, to: 69, step: 10 },
      { from: 50, to: 59, step: 10 },
      { from: 40, to: 49, step: 10 },
      { from: 30, to: 39, step: 10 },
      { from: 20, to: 29, step: 10 },
      { from: 10, to: 19, step: 10 },
      { from: 0, to: 9, step: 10 },
    ]);
  });

  it('should handle batchSize equal to latestBloc + 1', () => {
    const ranges = generateSearchRanges(99, 100);
    expect(ranges).toEqual([{ from: 0, to: 99, step: 100 }]);
  });

  it('should handle batchSize larger than latestBlock', () => {
    const ranges = generateSearchRanges(50, 100);
    expect(ranges).toEqual([{ from: 0, to: 50, step: 100 }]);
  });

  it('should handle zero latestBlock', () => {
    const ranges = generateSearchRanges(0, 10);
    expect(ranges).toEqual([]);
  });
});

describe('findLatestActiveBlock', () => {
  const endBlock = 1_000_000;
  const testActivityBlocks = [
    1, 10, 100, 1_000, 10_000, 50_000, 100_000, 200_000,
    400_000, 800_000, 999_999, 1_000_000,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockProvider.getBlockNumber.mockReset().mockResolvedValue(endBlock);
    mockProvider.getLogs.mockReset().mockResolvedValue([]);

    jest.spyOn(ethers, 'JsonRpcProvider').mockImplementation(() => mockProvider);
  });

  it('should find correct block when activity found', async () => {
    // Create isolated test cases
    const testPromises = testActivityBlocks.map((activityBlock) => {
      return async () => {
        // Create unique mock instances for this test case
        const testId = `test-${activityBlock}`;
        const isolatedProvider = {
          ...mockProvider,
          getBlockNumber: jest.fn().mockResolvedValue(endBlock),
          getLogs: jest.fn().mockImplementation(({ fromBlock, toBlock }) => {
            const from = typeof fromBlock === 'string' ? parseInt(fromBlock, 16) : fromBlock;
            const to = typeof toBlock === 'string' ? parseInt(toBlock, 16) : toBlock;
            if (toBlock - fromBlock > BLOCK_STEP_SIZE) {
              throw new Error(`${testId}: Larger than maximum limit`);
            }
            return Promise.resolve(
              from <= activityBlock && activityBlock <= to ? [{ blockNumber: activityBlock }] : []
            );
          }),
        };

        // Run test with isolated context
        return {
          activityBlock,
          provider: isolatedProvider,
          run: async () => {
            jest.spyOn(ethers, 'JsonRpcProvider').mockImplementation(() => isolatedProvider);

            console.log(`[${testId}] Testing activity block:`, activityBlock);

            const result = await findLatestActiveBlock('http://test.com', '0x123', BLOCK_STEP_SIZE);
            expect(result).toBe(activityBlock);
            return { activityBlock, result };
          },
        };
      };
    });

    // Execute all tests with proper isolation
    const results = await Promise.all(
      testPromises.map(async (createTest) => {
        const test = await createTest();
        return test.run();
      })
    );

    // Verify all tests passed
    results.forEach(({ activityBlock, result }) => {
      expect(result).toBe(activityBlock);
    });
  });

  it('should handle mid-range boundaries correctly', async () => {
    const BOUNDARY_BLOCK = 30_000;
    mockProvider.getBlockNumber.mockResolvedValue(1_000_000);
    mockProvider.getLogs.mockImplementation(({ fromBlock, toBlock }) => {
      const from = parseInt(fromBlock, 16);
      const to = parseInt(toBlock, 16);
      return Promise.resolve(from <= BOUNDARY_BLOCK && BOUNDARY_BLOCK <= to ? [{ blockNumber: BOUNDARY_BLOCK }] : []);
    });

    const result = await findLatestActiveBlock('http://test.com', '0x123', 10_000);
    expect(result).toBe(BOUNDARY_BLOCK);
  });

  it('should stop when reaching block 0', async () => {
    const LATEST_BLOCK = 100;
    mockProvider.getBlockNumber.mockResolvedValue(LATEST_BLOCK);
    mockProvider.getLogs.mockResolvedValue([]);

    const lowestCheckedBlock = [];
    mockProvider.getLogs.mockImplementation(({ fromBlock }) => {
      lowestCheckedBlock.push(parseInt(fromBlock, 16));
      return Promise.resolve([]);
    });

    const result = await findLatestActiveBlock('http://test.com', '0x123', 10);

    expect(result).toBe(0);
    expect(Math.min(...lowestCheckedBlock)).toBe(0);
  });

  it('should stop early when block found mid range', async () => {
    const LATEST_BLOCK = 1_000_000;
    const ACTIVITY_BLOCK = 789_123;
    const CHUNK_SIZE = 5; // Match the implementation's chunk size

    // Track checked ranges only
    const checkedRanges = [];

    // Mock provider setup
    mockProvider.getBlockNumber.mockResolvedValue(LATEST_BLOCK);
    mockProvider.getLogs.mockImplementation(({ fromBlock, toBlock }) => {
      const from = parseInt(fromBlock, 16);
      const to = parseInt(toBlock, 16);

      checkedRanges.push({ from, to });

      // Return logs only if range contains our activity block
      if (from <= ACTIVITY_BLOCK && ACTIVITY_BLOCK <= to) {
        return Promise.resolve([{ blockNumber: ACTIVITY_BLOCK }]);
      }

      return Promise.resolve([]);
    });

    const result = await findLatestActiveBlock('http://test.com', '0x123', 100_000);

    // Verify we found the correct block
    expect(result).toBe(ACTIVITY_BLOCK);

    // Verify we didn't check unnecessary ranges beyond the current chunk
    const unnecessaryChecks = checkedRanges.filter((range) => range.to < ACTIVITY_BLOCK);
    expect(unnecessaryChecks.length).toBeLessThanOrEqual(CHUNK_SIZE - 1);

    // Log the test details
    console.debug('Early stopping test results:', {
      foundAt: result,
      rangesChecked: checkedRanges.length,
      unnecessaryChecks: unnecessaryChecks.length,
      checkedRanges: checkedRanges.map((r) => `${r.from}-${r.to}`),
    });
  });

  // Removed: should not be worse in performance than O(log n, accounting for batching)
  // because much less relevant after GraphQL implementation
});
