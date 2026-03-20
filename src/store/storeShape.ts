import type { AppShellSlice } from '@/store/slices/appShellSlice';
import type { DiagnosticsSlice } from '@/store/slices/diagnosticsSlice';
import type { EvaluationSlice } from '@/store/slices/evaluationSlice';
import type { HistorySlice } from '@/store/slices/historySlice';
import type { SettingsSlice } from '@/store/slices/settingsSlice';

export type AppStoreShape = AppShellSlice &
  EvaluationSlice &
  SettingsSlice &
  HistorySlice &
  DiagnosticsSlice;
