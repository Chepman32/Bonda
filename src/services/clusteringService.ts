import type {
  Cluster,
  ContactEvaluation,
  NormalizedContact,
} from '@/models/entities';
import { createId } from '@/utils/ids';

const CLUSTER_COLORS: Record<string, string> = {
  family: '#FF9CB5',
  close_friend: '#F8C36D',
  work: '#79D9FF',
  creative: '#9A84FF',
  supportive: '#7ED7B8',
  dormant: '#7A869D',
  peripheral: '#5261FF',
};

function determineClusterKind(
  contact: NormalizedContact,
  evaluation?: ContactEvaluation,
): Cluster['kind'] {
  const tags = evaluation?.tags ?? [];

  if (tags.includes('family') || contact.inferredGroup === 'family') {
    return 'family';
  }

  if (tags.includes('work') || contact.inferredGroup === 'work') {
    return 'work';
  }

  if (tags.includes('creative')) {
    return 'creative';
  }

  if (tags.includes('supportive')) {
    return 'supportive';
  }

  if (
    evaluation &&
    (evaluation.markedDormant || evaluation.scores.activity < 30)
  ) {
    return 'dormant';
  }

  if (
    evaluation &&
    evaluation.scores.importance > 76 &&
    evaluation.scores.comfort > 72
  ) {
    return 'close_friend';
  }

  return 'custom';
}

function clusterName(kind: Cluster['kind']): string {
  switch (kind) {
    case 'family':
      return 'Family';
    case 'work':
      return 'Work';
    case 'creative':
      return 'Creative circle';
    case 'supportive':
      return 'Support network';
    case 'dormant':
      return 'Dormant ties';
    case 'close_friend':
      return 'Close friends';
    default:
      return 'Peripheral contacts';
  }
}

export function buildClusters(
  contacts: NormalizedContact[],
  evaluations: ContactEvaluation[],
): Cluster[] {
  const evaluationsByContact = new Map(
    evaluations.map(evaluation => [evaluation.contactId, evaluation]),
  );
  const clusterMap = new Map<Cluster['kind'], Cluster>();

  for (const contact of contacts) {
    const evaluation = evaluationsByContact.get(contact.id);
    const kind = determineClusterKind(contact, evaluation);
    const normalizedKind = kind === 'custom' ? 'custom' : kind;

    const currentCluster = clusterMap.get(normalizedKind) ?? {
      id: createId(),
      name: clusterName(normalizedKind),
      color: CLUSTER_COLORS[normalizedKind] ?? CLUSTER_COLORS.peripheral,
      kind: normalizedKind,
      contactIds: [],
      locked: normalizedKind !== 'custom',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    currentCluster.contactIds.push(contact.id);
    currentCluster.updatedAt = new Date().toISOString();
    clusterMap.set(normalizedKind, currentCluster);
  }

  return [...clusterMap.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

export function moveContactBetweenClusters(
  clusters: Cluster[],
  contactId: string,
  nextClusterId: string,
): Cluster[] {
  return clusters.map(cluster => {
    const nextIds = cluster.contactIds.filter(id => id !== contactId);

    if (cluster.id === nextClusterId && !nextIds.includes(contactId)) {
      nextIds.push(contactId);
    }

    return {
      ...cluster,
      contactIds: nextIds,
      updatedAt: new Date().toISOString(),
    };
  });
}
