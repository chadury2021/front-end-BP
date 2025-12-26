import { jest } from '@jest/globals';

export const mockProvider = {
  getNetwork: jest.fn().mockResolvedValue({ name: 'test', chainId: 1 }),
  ready: true,
  getLogs: jest.fn().mockResolvedValue([]),
  getBlockNumber: jest.fn().mockResolvedValue(0),
};

export const mockContract = {
  getAddress: jest.fn().mockResolvedValue('0x123'),
  getDataRecord: jest.fn(),
  getRiskRecord: jest.fn(),
  interface: {
    fragments: [],
    hasEvent: jest.fn().mockReturnValue(true),
    getEvent: jest.fn().mockReturnValue({
      format: () => 'Event()',
      name: 'TestEvent',
      inputs: [],
    }),
    parseLog: jest.fn(),
  },
  queryFilter: jest.fn(),
};

// Mock GraphQL response data
export const mockGraphQLDataEvents = [
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
];

export const mockGraphQLRiskEvents = [
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
];

// Mock GraphQL response
export const mockGraphQLResponse = {
  data: {
    attestedToDatas: mockGraphQLDataEvents,
    attestedToRisks: mockGraphQLRiskEvents,
  },
};

// Mock fetch function for GraphQL
export const mockGraphQLFetch = () => {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      json: () => Promise.resolve(mockGraphQLResponse),
    })
  );

  return global.fetch;
};

// Mock fetch function for GraphQL errors
export const mockGraphQLFetchWithError = () => {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve({
          errors: [{ message: 'GraphQL error' }],
        }),
    })
  );

  return global.fetch;
};

// Mock fetch function for empty GraphQL response
export const mockGraphQLFetchWithEmptyResponse = () => {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
    })
  );

  return global.fetch;
};

// Mock fetch function for network error
export const mockGraphQLFetchWithNetworkError = () => {
  global.fetch = jest.fn().mockImplementation(() => Promise.reject(new Error('Network error')));

  return global.fetch;
};
