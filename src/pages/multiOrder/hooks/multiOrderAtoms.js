import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const dynamicLimitBPSFormat = atom(false);
export const fundingRateFavoritesAtom = atomWithStorage('fundingRateFavorites', {});
