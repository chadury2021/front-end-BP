import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { getCachedLatestActiveBlock, cacheLatestActiveBlock } from '../latestBlockCache';

describe('latestBlockCache', () => {
  const mockRpcUrl = 'http://test.rpc';
  const mockAddress = '0x123';
  const mockBlock = 12345;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Mock Date.now() to control time
    jest.spyOn(Date, 'now').mockReturnValue(1000);
  });

  describe('cacheLatestActiveBlock', () => {
    it('should store block with timestamp', () => {
      cacheLatestActiveBlock(mockRpcUrl, mockAddress, mockBlock);

      const stored = localStorage.getItem('latestActiveBlock:http://test.rpc:0x123');
      const parsed = JSON.parse(stored);

      expect(parsed).toEqual({
        blockNumber: mockBlock,
        timestamp: 1000,
      });
    });
  });

  describe('getCachedLatestActiveBlock', () => {
    it('should return null when no cache exists', () => {
      const result = getCachedLatestActiveBlock(mockRpcUrl, mockAddress);
      expect(result).toBeNull();
    });

    it('should return cached block when not expired', () => {
      // Store cache
      cacheLatestActiveBlock(mockRpcUrl, mockAddress, mockBlock);

      // Get cache 9 minutes later (not expired)
      jest.spyOn(Date, 'now').mockReturnValue(1000 + 9 * 60 * 1000);

      const result = getCachedLatestActiveBlock(mockRpcUrl, mockAddress);
      expect(result).toBe(mockBlock);
    });

    it('should return null when cache is expired', () => {
      // Store cache
      cacheLatestActiveBlock(mockRpcUrl, mockAddress, mockBlock);

      // Get cache 11 minutes later (expired)
      jest.spyOn(Date, 'now').mockReturnValue(1000 + 11 * 60 * 1000);

      const result = getCachedLatestActiveBlock(mockRpcUrl, mockAddress);
      expect(result).toBeNull();

      // Verify the expired cache was removed
      const stored = localStorage.getItem('latestActiveBlock:http://test.rpc:0x123');
      expect(stored).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      // Store invalid JSON
      localStorage.setItem('latestActiveBlock:http://test.rpc:0x123', 'invalid json');

      const result = getCachedLatestActiveBlock(mockRpcUrl, mockAddress);
      expect(result).toBeNull();
    });
  });
}); 