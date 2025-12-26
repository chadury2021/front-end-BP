import { atom } from 'jotai';

// Simple atom to store consensus data by trader+epoch key
export const consensusDataAtom = atom({});

// Helper functions to work with the atom
export const getConsensusKey = (traderId, epoch) => `${traderId}-${epoch}`;

export const getConsensusData = (state, traderId, epoch) => {
  return state[getConsensusKey(traderId, epoch)];
};
