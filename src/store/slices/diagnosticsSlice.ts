import type { StateCreator } from 'zustand';

import type { StoreSlices } from '@/store/types';
import { getDiagnosticsRepository } from '@/services/repositories/diagnosticsRepository';
import type { AppStoreShape } from '@/store/storeShape';

export interface DiagnosticsSlice {
  diagnostics: StoreSlices['diagnostics'];
  refreshDiagnostics: () => Promise<void>;
  shareDiagnostics: () => Promise<void>;
}

export const createDiagnosticsSlice: StateCreator<
  AppStoreShape,
  [],
  [],
  DiagnosticsSlice
> = set => ({
  diagnostics: [],
  refreshDiagnostics: async () => {
    const diagnostics = await getDiagnosticsRepository().listRecentEvents();
    set({ diagnostics });
  },
  shareDiagnostics: async () => {
    await getDiagnosticsRepository().shareLogFile();
  },
});
