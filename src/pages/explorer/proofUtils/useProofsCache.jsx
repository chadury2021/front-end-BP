import { atom, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useCallback } from 'react';
import { bigIntStorage } from '../cacheUtils/bigIntStorage';

/**
 * Persistent atom for storing proof data with localStorage.
 * Data is stored in sorted order by epoch (desc) and traderId.
 * Handles BigInt serialization/deserialization.
 * Falls back to empty array if storage fails.
 * @type {import('jotai').Atom<Proof[]>}
 */
const proofsAtom = atomWithStorage('taas-proofs-cache', [], bigIntStorage);

/**
 * Persistent atom for storing current page number.
 * Falls back to 0 if storage fails.
 * @type {import('jotai').Atom<number>}
 */
const currentPageAtom = atomWithStorage('taas-proofs-current-page', 0);

// Sort function used for both trades and proofs
const sortByEpochAndTraderId = (a, b) => {
  if (a.epoch !== b.epoch) {
    const epochA = Number(a.epoch);
    const epochB = Number(b.epoch);
    return epochB - epochA;
  }
  return b.traderId.localeCompare(a.traderId);
};

/**
 * Hook for managing cached proof data with persistence
 * @returns {Object} Cache management interface
 * @property {Proof[]} proofs - Proofs array (sorted by epoch and traderId)
 * @property {number} currentPage - Current page number
 * @property {(newProofs: Proof[]) => void} updateProofs - Function to merge new proofs
 * @property {(page: number) => void} updateCurrentPage - Function to update current page
 * @property {number} proofsLength - Total number of proofs
 * @property {() => void} clearCache - Function to clear the proofs cache
 */
export function useProofsCache() {
  const [proofs, setProofs] = useAtom(proofsAtom);
  const [currentPage, setCurrentPage] = useAtom(currentPageAtom);

  const updateProofs = useCallback(
    (newProofs) => {
      setProofs((currentProofs) => {
        const proofsMap = new Map(currentProofs.map((proof) => [`${proof.traderId}-${proof.epoch}`, proof]));

        newProofs.forEach((newProof) => {
          const key = `${newProof.traderId}-${newProof.epoch}`;
          proofsMap.set(key, newProof);
        });

        // Convert to array and sort before storing
        return Array.from(proofsMap.values()).sort(sortByEpochAndTraderId);
      });
    },
    [setProofs]
  );

  const clearCache = useCallback(() => {
    setProofs([]);
    setCurrentPage(0);
  }, [setProofs, setCurrentPage]);

  return {
    proofs, // Already sorted
    currentPage,
    updateProofs,
    updateCurrentPage: setCurrentPage,
    proofsLength: proofs.length,
    clearCache,
  };
}
