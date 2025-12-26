import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { getAllEvents } from '@treadfi/contracts';
import { ethers } from 'ethers';
import { fetchDataRecord, fetchEventsBatch, fetchRiskRecord } from '../ProofFetchers';
import { mockContract, mockProvider } from '../mocks';

// Mock the getAllEvents function from @treadfi/contracts
jest.mock('@treadfi/contracts', () => ({
  getAllEvents: jest.fn(),
}));

describe('fetchEventsBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(ethers, 'JsonRpcProvider').mockImplementation(() => mockProvider);
    jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContract);
  });

  it('should fetch events using getAllEvents', async () => {
    const config = {
      rpcUrl: 'http://test.com',
      attestationAddress: '0x123',
      fromBlock: 100,
      toBlock: 200,
    };

    const mockEvents = [{ args: { data: 'test1' } }, { args: { data: 'test2' } }];

    // Mock the getAllEvents function to return mockEvents
    getAllEvents.mockResolvedValueOnce(mockEvents);

    const formatEvent = jest.fn((event) => event.args);

    const result = await fetchEventsBatch(config, 'TestEvent', formatEvent);

    expect(result).toEqual({
      events: mockEvents.map((e) => e.args),
      lastCheckedBlock: 100,
    });

    // Verify getAllEvents was called with the right parameters
    expect(getAllEvents).toHaveBeenCalledWith(
      mockContract,
      'TestEvent',
      {
        startBlock: ethers.toBeHex(100),
        endBlock: ethers.toBeHex(200),
      },
      { verbose: false }
    );
  });

  it('should handle empty events array', async () => {
    const config = {
      rpcUrl: 'http://test.com',
      attestationAddress: '0x123',
      fromBlock: 100,
      toBlock: 200,
    };

    // Mock getAllEvents to return empty array
    getAllEvents.mockResolvedValueOnce([]);

    const formatEvent = jest.fn((event) => event.args);

    const result = await fetchEventsBatch(config, 'TestEvent', formatEvent);

    expect(result).toEqual({
      events: [],
      lastCheckedBlock: 100,
    });
  });
});

describe('fetchDataRecord', () => {
  beforeEach(() => {
    mockContract.getDataRecord.mockResolvedValue([{ merkleRoot: '0x123' }, true]);
  });

  it('should fetch and format data record consensus', async () => {
    const result = await fetchDataRecord({ rpcUrl: 'test', attestationAddress: '0x123' }, 'trader1', 100);

    expect(mockContract.getDataRecord).toHaveBeenCalledWith(['trader1', 100]);
    expect(result).toEqual({
      record: { merkleRoot: '0x123' },
      hasConsensus: true,
    });
  });
});

describe('fetchRiskRecord', () => {
  beforeEach(() => {
    mockContract.getRiskRecord.mockResolvedValue([
      { value: ethers.toBeHex(42) }, // Test hex conversion
      false,
    ]);
  });

  it('should fetch and convert risk value to number', async () => {
    const result = await fetchRiskRecord({ rpcUrl: 'test', attestationAddress: '0x123' }, 'trader1', 100, 5);

    expect(mockContract.getRiskRecord).toHaveBeenCalledWith(['trader1', 100, 5], 1);
    expect(result).toEqual({
      record: { value: 42 },
      hasConsensus: false,
    });
  });
});
