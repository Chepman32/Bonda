import type {
  AnalysisMode,
  BubbleNode,
  Cluster,
  ContactEvaluation,
  InsightCard,
  NormalizedContact,
} from '@/models/entities';
import { formatPercent } from '@/utils/formatting';
import { clamp } from '@/utils/math';

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildBubbleNodes(
  contacts: NormalizedContact[],
  evaluations: ContactEvaluation[],
  clusters: Cluster[],
  mode: AnalysisMode,
): BubbleNode[] {
  const clusterByContact = new Map<string, Cluster>();
  clusters.forEach(cluster => {
    cluster.contactIds.forEach(contactId =>
      clusterByContact.set(contactId, cluster),
    );
  });
  const evaluationsByContact = new Map(
    evaluations.map(evaluation => [evaluation.contactId, evaluation]),
  );

  return contacts.map((contact, index) => {
    const evaluation = evaluationsByContact.get(contact.id);
    const cluster = clusterByContact.get(contact.id);
    const importance = evaluation?.scores.importance ?? 50;
    const warmth = evaluation?.scores.comfort ?? 50;
    const activity = evaluation?.scores.activity ?? 50;
    const complexity = evaluation?.scores.complexity ?? 0;
    const orbitBase = 240 - importance * 1.5;
    const modeBias =
      mode === 'warmth'
        ? warmth * 0.12
        : mode === 'support'
        ? (evaluation?.scores.supportiveness ?? 0) * 0.5
        : mode === 'complexity'
        ? complexity * 0.6
        : activity * 0.2;

    return {
      id: contact.id,
      label: contact.displayName,
      radius: clamp(14 + importance / 10, 14, 34),
      orbit: clamp(orbitBase - modeBias, 48, 220),
      angle: ((Math.PI * 2) / Math.max(contacts.length, 1)) * index,
      color: cluster?.color ?? '#5261FF',
      glow: clamp(warmth / 100, 0.2, 1),
      clusterId: cluster?.id,
    };
  });
}

export function buildInsightCards(
  contacts: NormalizedContact[],
  evaluations: ContactEvaluation[],
  clusters: Cluster[],
): InsightCard[] {
  const topEvaluations = [...evaluations]
    .sort(
      (left, right) =>
        right.scores.importance +
        right.scores.comfort -
        (left.scores.importance + left.scores.comfort),
    )
    .slice(0, 6);
  const neglected = evaluations
    .filter(
      evaluation =>
        evaluation.scores.importance > 72 && evaluation.scores.activity < 42,
    )
    .slice(0, 6);
  const comfortAverage = average(evaluations.map(item => item.scores.comfort));
  const supportAverage = average(
    evaluations.map(item => item.scores.supportiveness),
  );
  const workContacts = evaluations.filter(item => item.tags.includes('work'));
  const stableCluster = [...clusters].sort(
    (left, right) => right.contactIds.length - left.contactIds.length,
  )[0];
  const drainContacts = evaluations
    .filter(
      evaluation =>
        evaluation.scores.complexity > 12 && evaluation.scores.comfort < 42,
    )
    .slice(0, 6);

  return [
    {
      id: 'core-circle',
      title: 'Core Circle',
      metric: `${topEvaluations.length} people`,
      description:
        'Your strongest relationships are compact and concentrated, with a clear inner orbit.',
      relatedContactIds: topEvaluations.map(item => item.contactId),
      visualization: 'constellation',
    },
    {
      id: 'emotional-balance',
      title: 'Emotional Balance',
      metric: formatPercent(comfortAverage),
      description:
        comfortAverage >= 60
          ? 'Warmth is generally high across your circle.'
          : 'Your network has a cooler emotional baseline and may need attention.',
      relatedContactIds: [],
      visualization: 'spectrum',
    },
    {
      id: 'support-density',
      title: 'Support Density',
      metric: formatPercent((supportAverage + 50) / 1.5),
      description:
        'The strongest support tends to cluster around a small set of people.',
      relatedContactIds: topEvaluations.map(item => item.contactId),
      visualization: 'density',
    },
    {
      id: 'concentration',
      title: 'Social Concentration',
      metric: formatPercent(
        (topEvaluations.length / Math.max(evaluations.length, 1)) * 100,
      ),
      description:
        'A meaningful share of your attention is invested in a narrow core circle.',
      relatedContactIds: topEvaluations.map(item => item.contactId),
      visualization: 'orbits',
    },
    {
      id: 'neglected',
      title: 'Neglected Valuable Contacts',
      metric: `${neglected.length}`,
      description:
        neglected.length > 0
          ? 'These contacts still score highly on importance but have gone quiet.'
          : 'No high-value dormant contacts stand out right now.',
      relatedContactIds: neglected.map(item => item.contactId),
      visualization: 'timeline',
    },
    {
      id: 'work-split',
      title: 'Work vs Personal Split',
      metric: formatPercent(
        (workContacts.length / Math.max(evaluations.length, 1)) * 100,
      ),
      description: 'Professional ties are visible, but not dominating the map.',
      relatedContactIds: workContacts.map(item => item.contactId),
      visualization: 'density',
    },
    {
      id: 'quality-spectrum',
      title: 'Relationship Quality Spectrum',
      metric: `${Math.round(comfortAverage)}/100`,
      description:
        'Warmth and complexity create the visible spread across your field.',
      relatedContactIds: evaluations.map(item => item.contactId),
      visualization: 'spectrum',
    },
    {
      id: 'reconnect',
      title: 'People to Reconnect With',
      metric: `${neglected.length}`,
      description: 'These are meaningful ties with high future potential.',
      relatedContactIds: neglected.map(item => item.contactId),
      visualization: 'timeline',
    },
    {
      id: 'stable-group',
      title: 'Most Stable Group',
      metric: stableCluster?.name ?? 'None yet',
      description:
        'This cluster has the widest steady presence across your recent ratings.',
      relatedContactIds: stableCluster?.contactIds ?? [],
      visualization: 'constellation',
    },
    {
      id: 'drain',
      title: 'Potential Energy Drain Group',
      metric: `${drainContacts.length}`,
      description:
        drainContacts.length > 0
          ? 'Higher complexity with lower comfort marks this group as emotionally expensive.'
          : 'No clear draining group is emerging.',
      relatedContactIds: drainContacts.map(item => item.contactId),
      visualization: 'density',
    },
  ];
}

export function getContactPlacementDescription(
  contact: NormalizedContact,
  evaluation?: ContactEvaluation,
): string {
  if (!evaluation) {
    return `${contact.displayName} has not been evaluated yet.`;
  }

  if (evaluation.pinnedToCore || evaluation.scores.importance > 80) {
    return 'Lives close to your core circle because importance and comfort are both high.';
  }

  if (evaluation.markedDormant || evaluation.scores.activity < 35) {
    return 'Sits on an outer orbit because activity has cooled, even though the tie still matters.';
  }

  return 'Occupies a middle orbit with balanced warmth, relevance, and future attention.';
}
