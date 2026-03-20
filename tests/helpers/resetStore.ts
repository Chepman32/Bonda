import { DEFAULT_SETTINGS } from '@/constants/app';
import { getDataRepository } from '@/services/repositories/dataRepository';
import { getSettingsRepository } from '@/services/repositories/settingsRepository';
import { useAppStore } from '@/store/useAppStore';

export async function resetAppTestState(): Promise<void> {
  await getDataRepository().clearAll();
  await getSettingsRepository().clear();

  useAppStore.setState({
    bootState: 'idle',
    permissionState: 'idle',
    importProgress: {
      imported: 0,
      deduplicated: 0,
      hidden: 0,
      ready: 0,
      total: 0,
      stage: 'idle',
    },
    selectedMode: 'quick',
    analysisMode: 'importance',
    errorMessage: undefined,
    contacts: [],
    session: null,
    evaluations: {},
    clusters: [],
    insights: [],
    selectedContactId: undefined,
    reviewQueueIds: [],
    settings: DEFAULT_SETTINGS,
    history: [],
    exports: [],
    diagnostics: [],
  });
}
