import type { StateCreator } from 'zustand';

import { DEFAULT_SCORES } from '@/constants/app';
import type { ContactEvaluation, RelationshipScores } from '@/models/entities';
import { buildInsightCards, buildBubbleNodes } from '@/services/insightService';
import {
  fireConfirmationHaptic,
  fireThresholdHaptic,
} from '@/services/device/hapticsService';
import { getDataRepository } from '@/services/repositories/dataRepository';
import { getDiagnosticsRepository } from '@/services/repositories/diagnosticsRepository';
import {
  deriveConfidence,
  deriveMatrixConfidence,
  deriveScoresFromMatrixSelection,
  deriveScoresFromGesture,
  type GestureCommit,
  type MatrixCommit,
} from '@/services/scoringService';
import type { AppStoreShape } from '@/store/storeShape';
import type { StoreSlices } from '@/store/types';
import { createId } from '@/utils/ids';

export interface EvaluationSlice {
  contacts: StoreSlices['contacts'];
  session: StoreSlices['session'];
  evaluations: StoreSlices['evaluations'];
  clusters: StoreSlices['clusters'];
  insights: StoreSlices['insights'];
  selectedContactId?: string;
  reviewQueueIds: string[];
  startSession: () => Promise<void>;
  commitGestureEvaluation: (gesture: GestureCommit) => Promise<void>;
  commitMatrixEvaluation: (selection: MatrixCommit) => Promise<void>;
  skipCurrentContact: () => Promise<void>;
  undoLastEvaluation: () => Promise<void>;
  openContactDetail: (contactId: string) => void;
  closeContactDetail: () => void;
  saveContactDetail: (input: {
    contactId: string;
    scores?: Partial<RelationshipScores>;
    note?: string;
    tags?: ContactEvaluation['tags'];
    reviewBin?: ContactEvaluation['reviewBin'];
    pinnedToCore?: boolean;
    markedDormant?: boolean;
    revisit?: boolean;
  }) => Promise<void>;
  refreshDerivedState: () => Promise<void>;
  completeSession: () => Promise<void>;
  moveContactToCluster: (contactId: string, clusterId: string) => Promise<void>;
}

function getCurrentContactId(
  contacts: StoreSlices['contacts'],
  evaluations: StoreSlices['evaluations'],
): string | undefined {
  const evaluatedIds = new Set(
    Object.values(evaluations).map(item => item.contactId),
  );
  return contacts.find(contact => !evaluatedIds.has(contact.id))?.id;
}

export const createEvaluationSlice: StateCreator<
  AppStoreShape,
  [],
  [],
  EvaluationSlice
> = (set, get) => ({
  contacts: [],
  session: null,
  evaluations: {},
  clusters: [],
  insights: [],
  selectedContactId: undefined,
  reviewQueueIds: [],
  commitMatrixEvaluation: async selection => {
    const { session, selectedContactId, contacts, evaluations, settings } =
      get();
    if (!session || !selectedContactId) {
      return;
    }

    const existingEvaluation = Object.values(evaluations).find(
      item => item.contactId === selectedContactId,
    );
    const nextScores = deriveScoresFromMatrixSelection(selection);
    const evaluation: ContactEvaluation = {
      id: existingEvaluation?.id ?? createId(),
      sessionId: session.id,
      contactId: selectedContactId,
      scores: nextScores,
      tags: existingEvaluation?.tags ?? [],
      clusterId: existingEvaluation?.clusterId,
      confidence: deriveMatrixConfidence(selection),
      skipped: false,
      reviewBin: undefined,
      note: existingEvaluation?.note,
      revisit: existingEvaluation?.revisit ?? false,
      pinnedToCore:
        existingEvaluation?.pinnedToCore ?? nextScores.importance > 82,
      markedDormant:
        existingEvaluation?.markedDormant ?? nextScores.activity < 28,
      createdAt: existingEvaluation?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextEvaluations = {
      ...evaluations,
      [evaluation.id]: evaluation,
    };
    const processedCount = Object.keys(nextEvaluations).length;
    const nextSession = {
      ...session,
      processedCount,
      updatedAt: new Date().toISOString(),
    };
    const nextSelectedContactId = getCurrentContactId(
      contacts,
      nextEvaluations,
    );
    const reviewQueueIds = Object.values(nextEvaluations)
      .filter(item => item.skipped || item.confidence < 0.8)
      .map(item => item.contactId);

    fireThresholdHaptic(settings);

    set({
      evaluations: nextEvaluations,
      session: nextSession,
      selectedContactId: nextSelectedContactId,
      reviewQueueIds,
    });

    const dataRepository = getDataRepository();
    await dataRepository.saveEvaluation(evaluation);
    await dataRepository.saveSession(nextSession);
    await get().refreshDerivedState();
  },
  startSession: async () => {
    const dataRepository = getDataRepository();
    const diagnosticsRepository = getDiagnosticsRepository();
    const { selectedMode, contacts, importProgress } = get();

    const session = await dataRepository.createSession({
      mode: selectedMode,
      source: contacts[0]?.source ?? 'demo',
      progress: importProgress,
    });

    await diagnosticsRepository.log('info', 'Session started', {
      sessionId: session.id,
      mode: selectedMode,
    });

    set({
      session,
      selectedContactId: contacts[0]?.id,
    });
  },
  commitGestureEvaluation: async gesture => {
    const { session, selectedContactId, contacts, evaluations, settings } =
      get();
    if (!session || !selectedContactId) {
      return;
    }

    const existingEvaluation = Object.values(evaluations).find(
      item => item.contactId === selectedContactId,
    );
    const nextScores = deriveScoresFromGesture(
      existingEvaluation?.scores ?? DEFAULT_SCORES,
      gesture,
    );
    const evaluation: ContactEvaluation = {
      id: existingEvaluation?.id ?? createId(),
      sessionId: session.id,
      contactId: selectedContactId,
      scores: nextScores,
      tags: existingEvaluation?.tags ?? [],
      clusterId: existingEvaluation?.clusterId,
      confidence: deriveConfidence(gesture),
      skipped: false,
      reviewBin: undefined,
      note: existingEvaluation?.note,
      revisit: existingEvaluation?.revisit ?? false,
      pinnedToCore:
        existingEvaluation?.pinnedToCore ?? nextScores.importance > 82,
      markedDormant:
        existingEvaluation?.markedDormant ?? nextScores.activity < 28,
      createdAt: existingEvaluation?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextEvaluations = {
      ...evaluations,
      [evaluation.id]: evaluation,
    };
    const processedCount = Object.keys(nextEvaluations).length;
    const nextSession = {
      ...session,
      processedCount,
      updatedAt: new Date().toISOString(),
    };
    const nextSelectedContactId = getCurrentContactId(
      contacts,
      nextEvaluations,
    );
    const reviewQueueIds = Object.values(nextEvaluations)
      .filter(item => item.skipped || item.confidence < 0.8)
      .map(item => item.contactId);

    fireThresholdHaptic(settings);

    set({
      evaluations: nextEvaluations,
      session: nextSession,
      selectedContactId: nextSelectedContactId,
      reviewQueueIds,
    });

    const dataRepository = getDataRepository();
    await dataRepository.saveEvaluation(evaluation);
    await dataRepository.saveSession(nextSession);
    await get().refreshDerivedState();
  },
  skipCurrentContact: async () => {
    const { session, selectedContactId, contacts, evaluations } = get();
    if (!session || !selectedContactId) {
      return;
    }

    const now = new Date().toISOString();
    const evaluation: ContactEvaluation = {
      id: createId(),
      sessionId: session.id,
      contactId: selectedContactId,
      scores: DEFAULT_SCORES,
      tags: [],
      confidence: 0.5,
      skipped: true,
      reviewBin: 'later',
      note: undefined,
      revisit: true,
      pinnedToCore: false,
      markedDormant: false,
      createdAt: now,
      updatedAt: now,
    };
    const nextEvaluations = {
      ...evaluations,
      [evaluation.id]: evaluation,
    };
    const nextSession = {
      ...session,
      processedCount: Object.keys(nextEvaluations).length,
      skippedCount: session.skippedCount + 1,
      updatedAt: now,
    };
    const nextSelectedContactId = getCurrentContactId(
      contacts,
      nextEvaluations,
    );

    set({
      evaluations: nextEvaluations,
      session: nextSession,
      selectedContactId: nextSelectedContactId,
      reviewQueueIds: [
        ...new Set([...get().reviewQueueIds, selectedContactId]),
      ],
    });

    const dataRepository = getDataRepository();
    await dataRepository.saveEvaluation(evaluation);
    await dataRepository.saveSession(nextSession);
    await get().refreshDerivedState();
  },
  undoLastEvaluation: async () => {
    const { evaluations, contacts } = get();
    const latestEvaluation = [...Object.values(evaluations)].sort(
      (left, right) => right.updatedAt.localeCompare(left.updatedAt),
    )[0];

    if (!latestEvaluation) {
      return;
    }

    const nextEvaluations = { ...evaluations };
    delete nextEvaluations[latestEvaluation.id];

    set({
      evaluations: nextEvaluations,
      selectedContactId:
        latestEvaluation.contactId ??
        getCurrentContactId(contacts, nextEvaluations),
    });

    await getDataRepository().deleteEvaluation(latestEvaluation.id);
    await get().refreshDerivedState();
  },
  openContactDetail: contactId => set({ selectedContactId: contactId }),
  closeContactDetail: () => {
    const { contacts, evaluations } = get();
    set({
      selectedContactId: getCurrentContactId(contacts, evaluations),
    });
  },
  saveContactDetail: async input => {
    const { session, evaluations } = get();
    if (!session) {
      return;
    }

    const existingEvaluation = Object.values(evaluations).find(
      item => item.contactId === input.contactId,
    );
    const nextEvaluation: ContactEvaluation = {
      id: existingEvaluation?.id ?? createId(),
      sessionId: session.id,
      contactId: input.contactId,
      scores: {
        ...(existingEvaluation?.scores ?? DEFAULT_SCORES),
        ...input.scores,
      },
      tags: input.tags ?? existingEvaluation?.tags ?? [],
      clusterId: existingEvaluation?.clusterId,
      confidence: existingEvaluation?.confidence ?? 1,
      skipped: existingEvaluation?.skipped ?? false,
      reviewBin: input.reviewBin ?? existingEvaluation?.reviewBin,
      note: input.note ?? existingEvaluation?.note,
      revisit: input.revisit ?? existingEvaluation?.revisit ?? false,
      pinnedToCore:
        input.pinnedToCore ?? existingEvaluation?.pinnedToCore ?? false,
      markedDormant:
        input.markedDormant ?? existingEvaluation?.markedDormant ?? false,
      createdAt: existingEvaluation?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set({
      evaluations: {
        ...evaluations,
        [nextEvaluation.id]: nextEvaluation,
      },
    });

    await getDataRepository().saveEvaluation(nextEvaluation);
    await get().refreshDerivedState();
  },
  refreshDerivedState: async () => {
    const { contacts, evaluations, analysisMode } = get();
    const evaluationList = Object.values(evaluations);
    const dataRepository = getDataRepository();
    const clusters = await dataRepository.syncClusters(
      contacts,
      evaluationList,
    );
    const insights = buildInsightCards(contacts, evaluationList, clusters);
    buildBubbleNodes(contacts, evaluationList, clusters, analysisMode);

    set({
      clusters,
      insights,
      reviewQueueIds: evaluationList
        .filter(item => item.skipped || item.confidence < 0.8)
        .map(item => item.contactId),
    });
  },
  completeSession: async () => {
    const { session, settings } = get();
    if (!session) {
      return;
    }

    const nextSession = {
      ...session,
      status: 'completed' as const,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    fireConfirmationHaptic(settings);
    set({ session: nextSession });
    await getDataRepository().saveSession(nextSession);
  },
  moveContactToCluster: async (contactId, clusterId) => {
    const clusters = await getDataRepository().moveContactCluster(
      contactId,
      clusterId,
    );
    set({ clusters });
  },
});
