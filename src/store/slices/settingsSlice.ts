import type { StateCreator } from 'zustand';

import { DEFAULT_SETTINGS } from '@/constants/app';
import type { StoreSlices } from '@/store/types';
import { getDataRepository } from '@/services/repositories/dataRepository';
import { getDiagnosticsRepository } from '@/services/repositories/diagnosticsRepository';
import { getSettingsRepository } from '@/services/repositories/settingsRepository';
import type { AppStoreShape } from '@/store/storeShape';

export interface SettingsSlice {
  settings: StoreSlices['settings'];
  updateSettings: (patch: Partial<StoreSlices['settings']>) => Promise<void>;
  resetAllLocalData: () => Promise<void>;
}

export const createSettingsSlice: StateCreator<
  AppStoreShape,
  [],
  [],
  SettingsSlice
> = set => ({
  settings: DEFAULT_SETTINGS,
  updateSettings: async patch => {
    const settingsRepository = getSettingsRepository();
    const nextSettings = await settingsRepository.mergeSettings(patch);
    set({ settings: nextSettings });
  },
  resetAllLocalData: async () => {
    await getDataRepository().clearAll();
    await getSettingsRepository().clear();
    await getDiagnosticsRepository().log('warn', 'All local data reset');
    set({
      settings: DEFAULT_SETTINGS,
      contacts: [],
      session: null,
      evaluations: {},
      clusters: [],
      insights: [],
      history: [],
      exports: [],
      diagnostics: [],
    });
  },
});
