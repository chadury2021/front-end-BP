import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { correlateEvents } from '../correlateEvents';
import {
  formatGraphQLDataEvent,
  formatGraphQLRiskEvent,
  fetchGraphQLAttestations,
  fetchUntilEnoughEventsGraphQL,
  fetchEventsWithFallback,
  DEFAULT_GRAPHQL_ENDPOINT,
} from '../ProofGraphQL';

// Mock the ProofFetchers module to prevent RPC connection attempts
jest.mock('../ProofFetchers', () => ({
  fetchUntilEnoughEvents: jest.fn(),
}));

// Mock the fetch function
global.fetch = jest.fn();

// Mock the correlateEvents function from correlateEvents
jest.mock('../correlateEvents', () => ({
  correlateEvents: jest.fn(),
}));

describe('ProofGraphQL', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('formatGraphQLDataEvent', () => {
    it('should correctly format a GraphQL data event', () => {
      const mockGraphQLEvent = {
        id: '0x123',
        traderId: '0xTrader123',
        epoch: '42',
        attester: '0xAttester456',
        record_merkleRoot: '0xMerkleRoot789',
        record_cid: 'cid123',
        blockNumber: '12345',
        blockTimestamp: '1600000000',
        parameterId: '5',
        transactionHash: '0xTransaction123',
      };

      const result = formatGraphQLDataEvent(mockGraphQLEvent);

      expect(result).toEqual({
        transactionHash: '0xTransaction123',
        blockNumber: 12345,
        traderId: '0xTrader123',
        epoch: 42,
        attester: '0xAttester456',
        data: {
          merkleRoot: '0xMerkleRoot789',
          cid: 'cid123',
        },
        parameterId: 5,
        eventName: 'Data',
        eventColor: 'success',
      });
    });
  });

  describe('formatGraphQLRiskEvent', () => {
    it('should correctly format a GraphQL risk event', () => {
      const mockGraphQLEvent = {
        id: '0x456',
        traderId: '0xTrader123',
        epoch: '42',
        parameterId: '5',
        attester: '0xAttester456',
        record_value: '100',
        blockNumber: '12345',
        blockTimestamp: '1600000000',
        transactionHash: '0xTransaction456',
      };

      const result = formatGraphQLRiskEvent(mockGraphQLEvent);

      expect(result).toEqual({
        transactionHash: '0xTransaction456',
        blockNumber: 12345,
        traderId: '0xTrader123',
        epoch: 42,
        attester: '0xAttester456',
        data: 100,
        parameterId: 5,
        eventName: 'Risk',
        eventColor: 'warning',
      });
    });
  });

  describe('fetchGraphQLEvents', () => {
    it('should fetch and format data and risk events', async () => {
      // Mock the fetch response
      const mockResponse = {
        data: {
          attestedToDatas: [
            {
              id: '0x123',
              traderId: '0xTrader123',
              epoch: '42',
              attester: '0xAttester456',
              record_merkleRoot: '0xMerkleRoot789',
              record_cid: 'cid123',
              blockNumber: '12345',
              blockTimestamp: '1600000000',
              transactionHash: '0xTransaction123',
            },
          ],
          attestedToRisks: [
            {
              id: '0x456',
              traderId: '0xTrader123',
              epoch: '42',
              parameterId: '5',
              attester: '0xAttester456',
              record_value: '100',
              blockNumber: '12345',
              blockTimestamp: '1600000000',
              transactionHash: '0xTransaction456',
            },
          ],
        },
      };

      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const config = {
        graphqlEndpoint: 'https://test-endpoint',
        first: 10,
        skip: 0,
        orderBy: { blockNumber: 'desc' },
      };

      const result = await fetchGraphQLAttestations(config);

      // Check that fetch was called with the correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-endpoint',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        })
      );

      // Check the formatted results
      expect(result.dataEvents).toHaveLength(1);
      expect(result.riskEvents).toHaveLength(1);
      expect(result.dataEvents[0].traderId).toBe('0xTrader123');
      expect(result.riskEvents[0].data).toBe(100);
    });

    it('should handle GraphQL errors', async () => {
      const mockResponse = {
        errors: [{ message: 'GraphQL error' }],
      };

      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      await expect(fetchGraphQLAttestations({})).rejects.toThrow('GraphQL errors: GraphQL error');
    });

    it('should handle empty response', async () => {
      const mockResponse = {};

      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      await expect(fetchGraphQLAttestations({})).rejects.toThrow('No data returned from GraphQL');
    });

    it('should use default endpoint if not provided', async () => {
      const mockResponse = {
        data: {
          attestedToDatas: [],
          attestedToRisks: [],
        },
      };

      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      await fetchGraphQLAttestations({});

      expect(global.fetch).toHaveBeenCalledWith(DEFAULT_GRAPHQL_ENDPOINT, expect.anything());
    });
  });

  describe('fetchUntilEnoughEventsGraphQL', () => {
    it('should aggregate events until we have enough', async () => {
      // Setup mock data
      const config = {
        graphqlEndpoint: 'https://test-endpoint',
      };

      const mockDataEvents = [
        { traderId: '0xTrader1', epoch: '1', blockNumber: '100' },
        { traderId: '0xTrader2', epoch: '1', blockNumber: '90' },
      ];

      const mockRiskEvents = [
        { traderId: '0xTrader1', epoch: '1', blockNumber: '100' },
        { traderId: '0xTrader2', epoch: '1', blockNumber: '90' },
      ];

      const mockCorrelatedEvents = [
        { traderId: '0xTrader1', epoch: '1', blockNumber: 100 },
        { traderId: '0xTrader2', epoch: '1', blockNumber: 90 },
      ];

      // Mock the fetchGraphQLEvents function
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              data: {
                attestedToDatas: mockDataEvents,
                attestedToRisks: mockRiskEvents,
              },
            }),
        })
      );

      // Mock correlateEvents to return our prepared correlated events
      correlateEvents.mockReturnValue(mockCorrelatedEvents);

      const result = await fetchUntilEnoughEventsGraphQL(config, 2);

      // Verify results
      expect(result.events).toHaveLength(2);
      expect(result.lastCheckedBlock).toBe(90); // The smallest block number
    });

    it('should handle empty responses', async () => {
      // Mock empty response
      global.fetch.mockImplementation(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              data: {
                attestedToDatas: [],
                attestedToRisks: [],
              },
            }),
        })
      );

      correlateEvents.mockReturnValue([]);

      const result = await fetchUntilEnoughEventsGraphQL({}, 5);

      expect(result.events).toHaveLength(0);
      expect(result.lastCheckedBlock).toBe(0);
    });

    it('should make multiple requests if needed to fill the page', async () => {
      // Save original process.env.NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      // Set to test to trigger the test behavior in fetchUntilEnoughEventsGraphQL
      process.env.NODE_ENV = 'test';

      try {
        // Create mock responses for each batch
        const firstBatch = {
          data: {
            attestedToDatas: [
              {
                id: '0x1',
                traderId: '0xTrader1',
                epoch: '1',
                blockNumber: '100',
                attester: '0xAttester1',
                record_merkleRoot: '0xRoot1',
                record_cid: 'cid1',
                blockTimestamp: '1600000000',
                transactionHash: '0xTx1',
              },
            ],
            attestedToRisks: [],
          },
        };

        const secondBatch = {
          data: {
            attestedToDatas: [
              {
                id: '0x2',
                traderId: '0xTrader2',
                epoch: '2',
                blockNumber: '90',
                attester: '0xAttester2',
                record_merkleRoot: '0xRoot2',
                record_cid: 'cid2',
                blockTimestamp: '1600000000',
                transactionHash: '0xTx2',
              },
            ],
            attestedToRisks: [],
          },
        };

        const thirdBatch = {
          data: {
            attestedToDatas: [],
            attestedToRisks: [],
          },
        };

        // Clear any previous mocks
        global.fetch.mockReset();

        // Set up sequential mocks for the 3 calls
        global.fetch
          .mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue(firstBatch),
          })
          .mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue(secondBatch),
          })
          .mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue(thirdBatch),
          });

        // Mock correlateEvents to return one event per call
        correlateEvents
          .mockReturnValueOnce([{ traderId: '0xTrader1', epoch: 1, blockNumber: 100 }])
          .mockReturnValueOnce([{ traderId: '0xTrader2', epoch: 2, blockNumber: 90 }])
          .mockReturnValueOnce([]);

        // Request 2 events, which should force 3 calls
        const result = await fetchUntilEnoughEventsGraphQL({}, 2);

        // Verify results
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(result.events).toHaveLength(2);
        expect(result.lastCheckedBlock).toBe(90);
      } finally {
        // Restore original environment
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('fetchEventsWithFallback', () => {
    it('should use GraphQL by default and fall back to RPC if GraphQL fails', async () => {
      // First, make GraphQL fail
      global.fetch.mockRejectedValueOnce(new Error('GraphQL error'));

      // Mock the fallback fetcher
      const mockFallbackFetcher = jest.fn().mockResolvedValue({
        events: [{ traderId: '0xTrader1', epoch: 1, blockNumber: 100 }],
        lastCheckedBlock: 100,
      });

      const result = await fetchEventsWithFallback(
        { graphqlEndpoint: 'https://test-endpoint' },
        1,
        null,
        mockFallbackFetcher
      );

      // Verify GraphQL was attempted and fallback was used
      expect(global.fetch).toHaveBeenCalled();
      expect(mockFallbackFetcher).toHaveBeenCalled();
      expect(result.events).toHaveLength(1);
    });

    it('should use RPC directly if GraphQL is disabled', async () => {
      // Create a mock fallback fetcher
      const mockFallbackFetcher = jest.fn().mockResolvedValue({
        events: [{ traderId: '0xTrader1', epoch: 1, blockNumber: 100 }],
        lastCheckedBlock: 100,
      });

      const result = await fetchEventsWithFallback({ useGraphQL: false }, 1, null, mockFallbackFetcher);

      // Verify GraphQL was not used and fallback was called directly
      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockFallbackFetcher).toHaveBeenCalled();
      expect(result.events).toHaveLength(1);
    });

    it('should throw error if no fallback is provided and GraphQL fails', async () => {
      // Make GraphQL fail
      global.fetch = jest.fn().mockRejectedValue(new Error('GraphQL error'));

      // Call without a fallback
      await expect(
        fetchEventsWithFallback({ graphqlEndpoint: 'https://test-endpoint' }, 1, null, null)
      ).rejects.toThrow('GraphQL error');
    });
  });
});
