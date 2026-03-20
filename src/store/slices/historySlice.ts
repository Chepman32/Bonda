import type { StateCreator } from 'zustand';

import type { StoreSlices } from '@/store/types';
import { getDataRepository } from '@/services/repositories/dataRepository';
import type { AppStoreShape } from '@/store/storeShape';

export interface HistorySlice {
  history: StoreSlices['history'];
  exports: StoreSlices['exports'];
  loadHistory: () => Promise<void>;
}

export const createHistorySlice: StateCreator<
  AppStoreShape,
  [],
  [],
  HistorySlice
> = set => ({
  history: [],
  exports: [],
  loadHistory: async () => {
    const dataRepository = getDataRepository();
    const [history, exports] = await Promise.all([
      dataRepository.listSessions(),
      dataRepository.listExports(),
    ]);

    set({
      history,
      exports,
    });
  },
});
