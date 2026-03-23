import { RESULTS } from 'react-native-permissions';
import type { StateCreator } from 'zustand';

import { DEFAULT_SETTINGS } from '@/constants/app';
import {
  importAndNormalizeContacts,
  refreshContactAvatarUris,
} from '@/services/contactImportService';
import {
  getContactsPermissionStatus,
  isPermissionGranted,
  requestContactsPermission,
} from '@/services/device/permissionsService';
import { getDataRepository } from '@/services/repositories/dataRepository';
import { getDiagnosticsRepository } from '@/services/repositories/diagnosticsRepository';
import { getSettingsRepository } from '@/services/repositories/settingsRepository';
import type { AppStoreShape } from '@/store/storeShape';
import type { StoreSlices } from '@/store/types';
import { buildInsightCards } from '@/services/insightService';

export interface AppShellSlice {
  bootState: StoreSlices['bootState'];
  permissionState: StoreSlices['permissionState'];
  importProgress: StoreSlices['importProgress'];
  selectedMode: StoreSlices['selectedMode'];
  analysisMode: StoreSlices['analysisMode'];
  errorMessage?: string;
  bootstrapApp: () => Promise<void>;
  requestPermission: () => Promise<void>;
  importContactsIntoState: (usePreview?: boolean) => Promise<void>;
  refreshContactAvatars: () => Promise<void>;
  setSelectedMode: (mode: StoreSlices['selectedMode']) => void;
  setAnalysisMode: (mode: StoreSlices['analysisMode']) => void;
  setErrorMessage: (message?: string) => void;
}

export const createAppShellSlice: StateCreator<
  AppStoreShape,
  [],
  [],
  AppShellSlice
> = (set, get) => ({
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
  bootstrapApp: async () => {
    set({ bootState: 'booting' });

    try {
      const settings = await getSettingsRepository().getSettings();
      const permissionStatus = await getContactsPermissionStatus();
      const diagnosticsRepository = getDiagnosticsRepository();
      const dataRepository = getDataRepository();
      const [contacts, history, exports, diagnostics, clusters] =
        await Promise.all([
          dataRepository.listContacts(),
          dataRepository.listSessions(),
          dataRepository.listExports(),
          diagnosticsRepository.listRecentEvents(),
          dataRepository.listClusters(),
        ]);
      const activeSession = history.find(
        session => session.status === 'active' || session.status === 'paused',
      );
      const evaluations = activeSession
        ? await dataRepository.listEvaluations(activeSession.id)
        : [];
      const evaluationMap = Object.fromEntries(
        evaluations.map(evaluation => [evaluation.id, evaluation]),
      );
      const insights = buildInsightCards(contacts, evaluations, clusters);

      await diagnosticsRepository.log('info', 'App bootstrapped', {
        permissionStatus,
      });

      set({
        settings,
        bootState: 'ready',
        contacts,
        history,
        exports,
        diagnostics,
        session: activeSession ?? null,
        evaluations: evaluationMap,
        clusters,
        insights,
        selectedContactId:
          activeSession && contacts.length > 0
            ? contacts.find(
                contact =>
                  !evaluations.some(
                    evaluation => evaluation.contactId === contact.id,
                  ),
              )?.id ?? contacts[0]?.id
            : contacts[0]?.id,
        permissionState: isPermissionGranted(permissionStatus)
          ? 'granted'
          : permissionStatus === RESULTS.BLOCKED
          ? 'denied'
          : permissionStatus === RESULTS.UNAVAILABLE
          ? 'restricted'
          : 'idle',
      });
    } catch (error) {
      set({
        bootState: 'error',
        settings: DEFAULT_SETTINGS,
        errorMessage: error instanceof Error ? error.message : 'Boot failed',
      });
    }
  },
  requestPermission: async () => {
    const status = await requestContactsPermission();
    set({
      permissionState: isPermissionGranted(status)
        ? 'granted'
        : status === RESULTS.BLOCKED
        ? 'denied'
        : 'restricted',
    });
  },
  importContactsIntoState: async (usePreview = false) => {
    const diagnosticsRepository = getDiagnosticsRepository();
    const dataRepository = getDataRepository();
    const settingsRepository = getSettingsRepository();

    try {
      const { contacts, progress } = await importAndNormalizeContacts({
        usePreview,
        onProgress: nextProgress => set({ importProgress: nextProgress }),
      });

      set({
        importProgress: {
          ...progress,
          stage: 'persisting',
        },
      });

      await dataRepository.replaceContacts(contacts);
      const settings = await settingsRepository.mergeSettings({
        hasCompletedOnboarding: true,
      });
      await diagnosticsRepository.log('info', 'Contacts imported', {
        ...progress,
      });

      set({
        contacts,
        importProgress: progress,
        settings,
        errorMessage: undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Contacts import failed';

      set(state => ({
        errorMessage: message,
        importProgress: {
          ...state.importProgress,
          stage: 'error',
        },
      }));

      await diagnosticsRepository.log('error', 'Contacts import failed', {
        message,
      });
      throw error;
    }
  },
  refreshContactAvatars: async () => {
    const { contacts } = get();
    const nextContacts = await refreshContactAvatarUris(contacts);

    if (nextContacts === contacts) {
      return;
    }

    await getDataRepository().replaceContacts(nextContacts);
    set({ contacts: nextContacts });
  },
  setSelectedMode: mode => set({ selectedMode: mode }),
  setAnalysisMode: mode => set({ analysisMode: mode }),
  setErrorMessage: message => set({ errorMessage: message }),
});
