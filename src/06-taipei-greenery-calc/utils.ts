import { TREE_AREA } from './constants';

export const n = (s: string) => parseFloat(s) || 0;

export const treeGroupArea = (L: string, M: string, S: string, P: string, factor = 1) =>
  (n(L) * TREE_AREA.large + n(M) * TREE_AREA.medium + n(S) * TREE_AREA.small + n(P) * TREE_AREA.palm) * factor;
