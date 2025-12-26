import { describe, expect, it, jest } from '@jest/globals';
import { correlateEvents } from '../correlateEvents';

// Mock the getAllEvents function from @treadfi/contracts
jest.mock('@treadfi/contracts', () => ({
  getAllEvents: jest.fn(),
}));

describe('correlateEvents', () => {
  it('should handle duplicate data events and return unique trader-epoch combinations', () => {
    const dataEvents = [
      { traderId: '1', epoch: 1, blockNumber: 100 },
      { traderId: '1', epoch: 1, blockNumber: 101 }, // Duplicate
      { traderId: '2', epoch: 1, blockNumber: 102 },
    ];

    const riskEvents = [
      { traderId: '1', epoch: 1, risk: 'high' },
      { traderId: '1', epoch: 1, risk: 'medium' },
      { traderId: '2', epoch: 1, risk: 'low' },
    ];

    const result = correlateEvents(dataEvents, riskEvents);

    // Should only have 2 unique trader-epoch combinations
    expect(result.length).toBe(2);

    // Check first trader-epoch combination
    expect(result[0]).toEqual({
      traderId: '1',
      epoch: 1,
      blockNumber: 100, // Should keep the first occurrence
      dataEvents: [dataEvents[0], dataEvents[1]], // Now includes both data events for this trader-epoch
      riskEvents: [
        { traderId: '1', epoch: 1, risk: 'high' },
        { traderId: '1', epoch: 1, risk: 'medium' },
      ],
    });

    // Check second trader-epoch combination
    expect(result[1]).toEqual({
      traderId: '2',
      epoch: 1,
      blockNumber: 102,
      dataEvents: [dataEvents[2]], // Array with single data event
      riskEvents: [{ traderId: '2', epoch: 1, risk: 'low' }],
    });
  });

  it('should handle empty inputs', () => {
    expect(correlateEvents([], [])).toEqual([]);
    expect(correlateEvents(undefined, undefined)).toEqual([]);
    expect(correlateEvents(null, null)).toEqual([]);
  });
});
