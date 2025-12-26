import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'jotai';
import { getArweaveData } from '@/apiServices';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { useTraderEpochData } from '../useTraderEpochData';

// Mock dependencies
jest.mock('@/apiServices', () => ({
  getArweaveData: jest.fn(),
}));

// Mock context providers wrapper
const wrapper = ({ children }) => (
  <Provider>
    <ErrorContext.Provider value={{ showAlert: jest.fn() }}>{children}</ErrorContext.Provider>
  </Provider>
);

describe('useTraderEpochData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should only return trades matching the specified trader ID', async () => {
    // Mock API response with mixed trader IDs
    const mockResponse = {
      edges: [
        {
          cursor: 'cursor1',
          node: {
            id: 'trade1',
            tags: [
              { name: 'trader_id', value: 'trader123' },
              { name: 'epoch', value: '100' },
              { name: 'exchange_name', value: 'deribit' },
            ],
          },
        },
        {
          cursor: 'cursor2',
          node: {
            id: 'trade2',
            tags: [
              { name: 'trader_id', value: 'different_trader' },
              { name: 'epoch', value: '100' },
              { name: 'exchange_name', value: 'bybit' },
            ],
          },
        },
        {
          cursor: 'cursor3',
          node: {
            id: 'trade3',
            tags: [
              { name: 'trader_id', value: 'trader123' },
              { name: 'epoch', value: '100' },
              { name: 'exchange_name', value: 'okx' },
            ],
          },
        },
      ],
    };

    getArweaveData.mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () =>
        useTraderEpochData({
          traderId: 'trader123',
          epoch: '100',
        }),
      { wrapper }
    );

    // Wait for initial fetch
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    });

    // Should only include trades for trader123
    expect(result.current.trades).toHaveLength(2);
    expect(result.current.trades.every((trade) => trade.trader_id === 'trader123')).toBe(true);
    expect(result.current.trades.map((t) => t.id)).toEqual(['trade1', 'trade3']);
  });
});
