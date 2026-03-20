import { create } from 'zustand';

import { createAppShellSlice } from '@/store/slices/appShellSlice';
import { createDiagnosticsSlice } from '@/store/slices/diagnosticsSlice';
import { createEvaluationSlice } from '@/store/slices/evaluationSlice';
import { createHistorySlice } from '@/store/slices/historySlice';
import { createSettingsSlice } from '@/store/slices/settingsSlice';
import type { AppStoreShape } from '@/store/storeShape';

export type AppStore = AppStoreShape;

export const useAppStore = create<AppStore>()((...args) => ({
  ...createAppShellSlice(...args),
  ...createEvaluationSlice(...args),
  ...createSettingsSlice(...args),
  ...createHistorySlice(...args),
  ...createDiagnosticsSlice(...args),
}));
