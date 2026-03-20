import { DEFAULT_SCORES } from '@/constants/app';
import type {
  Cluster,
  ContactEvaluation,
  EvaluationSession,
  NormalizedContact,
  RelationshipScores,
} from '@/models/entities';

const NOW = '2026-03-20T00:00:00.000Z';

export function makeContact(
  overrides: Partial<NormalizedContact> = {},
): NormalizedContact {
  return {
    id: overrides.id ?? 'contact-1',
    externalId: overrides.externalId ?? 'external-1',
    source: overrides.source ?? 'device',
    givenName: overrides.givenName ?? 'Mila',
    familyName: overrides.familyName ?? 'Stone',
    displayName: overrides.displayName ?? 'Mila Stone',
    sortName: overrides.sortName ?? 'mila stone',
    company: overrides.company,
    jobTitle: overrides.jobTitle,
    avatarUri: overrides.avatarUri,
    avatarSeed: overrides.avatarSeed ?? 'seed-1',
    initials: overrides.initials ?? 'MS',
    phoneNumbers: overrides.phoneNumbers ?? ['+15550000001'],
    emailAddresses: overrides.emailAddresses ?? ['mila@example.com'],
    notes: overrides.notes,
    hasName: overrides.hasName ?? true,
    relationConfidence: overrides.relationConfidence ?? 0.8,
    inferredGroup: overrides.inferredGroup,
    lastModifiedAt: overrides.lastModifiedAt,
    createdAt: overrides.createdAt ?? NOW,
    updatedAt: overrides.updatedAt ?? NOW,
  };
}

export function makeScores(
  overrides: Partial<RelationshipScores> = {},
): RelationshipScores {
  return {
    ...DEFAULT_SCORES,
    ...overrides,
  };
}

export function makeEvaluation(
  overrides: Partial<ContactEvaluation> = {},
): ContactEvaluation {
  return {
    id: overrides.id ?? `evaluation-${overrides.contactId ?? '1'}`,
    sessionId: overrides.sessionId ?? 'session-1',
    contactId: overrides.contactId ?? 'contact-1',
    scores: overrides.scores ?? makeScores(),
    tags: overrides.tags ?? [],
    clusterId: overrides.clusterId,
    confidence: overrides.confidence ?? 1,
    skipped: overrides.skipped ?? false,
    reviewBin: overrides.reviewBin,
    note: overrides.note,
    revisit: overrides.revisit ?? false,
    pinnedToCore: overrides.pinnedToCore ?? false,
    markedDormant: overrides.markedDormant ?? false,
    createdAt: overrides.createdAt ?? NOW,
    updatedAt: overrides.updatedAt ?? NOW,
  };
}

export function makeSession(
  overrides: Partial<EvaluationSession> = {},
): EvaluationSession {
  return {
    id: overrides.id ?? 'session-1',
    mode: overrides.mode ?? 'quick',
    status: overrides.status ?? 'active',
    startedAt: overrides.startedAt ?? NOW,
    updatedAt: overrides.updatedAt ?? NOW,
    completedAt: overrides.completedAt,
    importedCount: overrides.importedCount ?? 3,
    deduplicatedCount: overrides.deduplicatedCount ?? 0,
    hiddenCount: overrides.hiddenCount ?? 0,
    readyCount: overrides.readyCount ?? 3,
    processedCount: overrides.processedCount ?? 0,
    skippedCount: overrides.skippedCount ?? 0,
    source: overrides.source ?? 'device',
  };
}

export function makeCluster(overrides: Partial<Cluster> = {}): Cluster {
  return {
    id: overrides.id ?? 'cluster-1',
    name: overrides.name ?? 'Inner circle',
    color: overrides.color ?? '#5261FF',
    kind: overrides.kind ?? 'custom',
    contactIds: overrides.contactIds ?? ['contact-1'],
    locked: overrides.locked ?? false,
    createdAt: overrides.createdAt ?? NOW,
    updatedAt: overrides.updatedAt ?? NOW,
  };
}
