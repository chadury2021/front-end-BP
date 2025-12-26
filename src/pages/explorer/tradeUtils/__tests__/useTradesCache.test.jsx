import { beforeEach, describe, expect, it } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { useTradeBlobsCache } from '../useTradesCache';

// Mock trades data
const mockTrades = [
  { id: '1', trader_id: 'trader1', epoch: 100 },
  { id: '2', trader_id: 'trader2', epoch: 200 },
  { id: '3', trader_id: 'trader1', epoch: 200 },
];

const additionalTrades = [
  { id: '4', trader_id: 'trader3', epoch: 150 },
  { id: '2', trader_id: 'trader2', epoch: 200 }, // Duplicate ID
];

describe('useTradesCache', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('initializes with empty trades array', () => {
    const { result } = renderHook(() => useTradeBlobsCache());

    expect(result.current.tradeBlobs).toEqual([]);
    expect(result.current.currentPage).toBe(0);
    expect(result.current.tradeBlobsLength).toBe(0);
  });

  it('updates trades and maintains sort order', () => {
    const { result } = renderHook(() => useTradeBlobsCache());

    act(() => {
      result.current.updateTradeBlobs(mockTrades);
    });

    // Should be sorted by epoch (desc) then trader_id
    expect(result.current.tradeBlobs).toEqual([
      { id: '2', trader_id: 'trader2', epoch: 200 },
      { id: '3', trader_id: 'trader1', epoch: 200 },
      { id: '1', trader_id: 'trader1', epoch: 100 },
    ]);
  });

  it('handles duplicate trade IDs by using latest version', () => {
    const { result } = renderHook(() => useTradeBlobsCache());

    act(() => {
      result.current.updateTradeBlobs(mockTrades);
      result.current.updateTradeBlobs(additionalTrades);
    });

    const tradeIds = result.current.tradeBlobs.map((t) => t.id);
    expect(tradeIds).toEqual(['2', '3', '4', '1']);
    expect(result.current.tradeBlobsLength).toBe(4);
  });

  it('maintains sort order when adding new trades', () => {
    const { result } = renderHook(() => useTradeBlobsCache());

    act(() => {
      result.current.updateTradeBlobs([
        { id: '1', trader_id: 'trader1', epoch: 100 },
        { id: '2', trader_id: 'trader2', epoch: 200 },
      ]);
    });

    act(() => {
      result.current.updateTradeBlobs([{ id: '3', trader_id: 'trader3', epoch: 150 }]);
    });

    expect(result.current.tradeBlobs).toEqual([
      { id: '2', trader_id: 'trader2', epoch: 200 },
      { id: '3', trader_id: 'trader3', epoch: 150 },
      { id: '1', trader_id: 'trader1', epoch: 100 },
    ]);
  });

  it('updates current page', () => {
    const { result } = renderHook(() => useTradeBlobsCache());

    act(() => {
      result.current.updateCurrentPage(2);
    });

    expect(result.current.currentPage).toBe(2);
  });

  it('handles trades with missing or invalid epochs', () => {
    const { result } = renderHook(() => useTradeBlobsCache());

    act(() => {
      result.current.updateTradeBlobs([
        { id: '1', trader_id: 'trader1', epoch: undefined },
        { id: '2', trader_id: 'trader2', epoch: null },
        { id: '3', trader_id: 'trader3', epoch: 100 },
        { id: '4', trader_id: 'trader4', epoch: 'invalid' },
      ]);
    });

    // Undefined/null/invalid epochs should be treated as 0
    expect(result.current.tradeBlobs[0]).toEqual({
      id: '3',
      trader_id: 'trader3',
      epoch: 100,
    });
  });

  it('persists data across hook remounts', () => {
    const { result, rerender } = renderHook(() => useTradeBlobsCache());

    act(() => {
      result.current.updateTradeBlobs(mockTrades);
      result.current.updateCurrentPage(2);
    });

    // Remount the hook
    rerender();

    expect(result.current.tradeBlobs.length).toBe(3);
    expect(result.current.currentPage).toBe(2);
  });

  it('handles trades with same epoch by sorting on trader_id', () => {
    const { result } = renderHook(() => useTradeBlobsCache());

    const sameEpochTrades = [
      { id: '1', trader_id: 'trader2', epoch: 100 },
      { id: '2', trader_id: 'trader1', epoch: 100 },
      { id: '3', trader_id: 'trader3', epoch: 100 },
    ];

    act(() => {
      result.current.updateTradeBlobs(sameEpochTrades);
    });

    // Should be sorted by trader_id when epochs are equal
    expect(result.current.tradeBlobs.map((t) => t.trader_id)).toEqual(['trader3', 'trader2', 'trader1']);
  });
});
