import { beforeEach, describe, expect, it } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { useProofsCache } from '../useProofsCache';

describe('useProofsCache', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  // Helper function to create mock proofs
  const createMockProof = (epoch, traderId, blockNumber = 1000) => ({
    epoch,
    traderId,
    dataEvents: [{ blockNumber }],
    riskEvents: [],
  });

  describe('initialization', () => {
    it('should initialize with empty state when localStorage is empty', () => {
      const { result } = renderHook(() => useProofsCache());

      expect(result.current.proofs).toEqual([]);
      expect(result.current.currentPage).toBe(0);
      expect(result.current.proofsLength).toBe(0);
    });

    it('should load existing data from localStorage', () => {
      const mockProofs = [createMockProof(100, 'trader1'), createMockProof(99, 'trader2')];
      localStorage.setItem('taas-proofs-cache', JSON.stringify(mockProofs));
      localStorage.setItem('taas-proofs-current-page', '2');

      const { result } = renderHook(() => useProofsCache());

      // Data should be sorted on load
      expect(result.current.proofs).toEqual([createMockProof(100, 'trader1'), createMockProof(99, 'trader2')]);
      expect(result.current.currentPage).toBe(2);
      expect(result.current.proofsLength).toBe(2);
    });
  });

  describe('proof updates', () => {
    it('should update proofs and persist to localStorage', () => {
      const { result } = renderHook(() => useProofsCache());

      const newProofs = [createMockProof(99, 'trader2'), createMockProof(100, 'trader1')];

      act(() => {
        result.current.updateProofs(newProofs);
      });

      // Check hook state - should be sorted
      expect(result.current.proofs).toEqual([createMockProof(100, 'trader1'), createMockProof(99, 'trader2')]);
      expect(result.current.proofsLength).toBe(2);

      // Check localStorage - should be sorted
      const storedProofs = JSON.parse(localStorage.getItem('taas-proofs-cache'));
      expect(storedProofs).toEqual([createMockProof(100, 'trader1'), createMockProof(99, 'trader2')]);
    });

    it('should deduplicate proofs by traderId-epoch', () => {
      const { result } = renderHook(() => useProofsCache());

      const initialProofs = [createMockProof(100, 'trader1', 1000), createMockProof(99, 'trader2', 990)];

      const newProofs = [
        createMockProof(100, 'trader1', 1001), // Same traderId-epoch, different block
        createMockProof(98, 'trader3', 980), // Older proof
        createMockProof(101, 'trader1', 1002), // Newer proof
      ];

      act(() => {
        result.current.updateProofs(initialProofs);
        result.current.updateProofs(newProofs);
      });

      // Results should be sorted by epoch desc
      expect(result.current.proofs).toEqual([
        createMockProof(101, 'trader1', 1002), // Newer proof
        createMockProof(100, 'trader1', 1001), // Updated block number
        createMockProof(99, 'trader2', 990),
        createMockProof(98, 'trader3', 980),
      ]);
      expect(result.current.proofsLength).toBe(4);
    });
  });

  describe('sorting', () => {
    it('should sort proofs by epoch (desc) and traderId', () => {
      const { result } = renderHook(() => useProofsCache());

      const unsortedProofs = [
        createMockProof(100, 'trader2'),
        createMockProof(100, 'trader1'),
        createMockProof(101, 'trader3'),
        createMockProof(99, 'trader1'),
      ];

      act(() => {
        result.current.updateProofs(unsortedProofs);
      });

      // Proofs should be sorted on save
      expect(result.current.proofs).toEqual([
        createMockProof(101, 'trader3'),
        createMockProof(100, 'trader2'),
        createMockProof(100, 'trader1'),
        createMockProof(99, 'trader1'),
      ]);
    });

    it('should maintain sort order when adding new proofs', () => {
      const { result } = renderHook(() => useProofsCache());

      act(() => {
        result.current.updateProofs([createMockProof(100, 'trader1'), createMockProof(102, 'trader2')]);
      });

      act(() => {
        result.current.updateProofs([createMockProof(101, 'trader3')]);
      });

      expect(result.current.proofs).toEqual([
        createMockProof(102, 'trader2'),
        createMockProof(101, 'trader3'),
        createMockProof(100, 'trader1'),
      ]);
    });
  });

  describe('page management', () => {
    it('should update and persist current page', () => {
      const { result } = renderHook(() => useProofsCache());

      act(() => {
        result.current.updateCurrentPage(2);
      });

      // Check hook state
      expect(result.current.currentPage).toBe(2);

      // Check localStorage
      expect(localStorage.getItem('taas-proofs-current-page')).toBe('2');
    });
  });
});
