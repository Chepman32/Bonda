import {
  buildClusters,
  moveContactBetweenClusters,
} from '@/services/clusteringService';

import { makeContact, makeEvaluation } from '../factories/entities';

describe('clusteringService', () => {
  it('builds deterministic clusters from tags, inferred groups, and score heuristics', () => {
    const contacts = [
      makeContact({
        id: 'family-1',
        displayName: 'Family One',
        sortName: 'family one',
        inferredGroup: 'family',
      }),
      makeContact({
        id: 'work-1',
        displayName: 'Work One',
        sortName: 'work one',
        inferredGroup: 'work',
      }),
      makeContact({
        id: 'close-1',
        displayName: 'Close One',
        sortName: 'close one',
      }),
      makeContact({
        id: 'dormant-1',
        displayName: 'Dormant One',
        sortName: 'dormant one',
      }),
    ];
    const evaluations = [
      makeEvaluation({ contactId: 'work-1', tags: ['work'] }),
      makeEvaluation({
        contactId: 'close-1',
        scores: {
          importance: 88,
          comfort: 80,
          activity: 70,
          futureAttention: 72,
          stability: 0,
          complexity: 0,
          supportiveness: 10,
          professionalValue: 0,
          emotionalWeight: 0,
        },
      }),
      makeEvaluation({
        contactId: 'dormant-1',
        markedDormant: true,
        scores: {
          importance: 50,
          comfort: 50,
          activity: 20,
          futureAttention: 50,
          stability: 0,
          complexity: 0,
          supportiveness: 0,
          professionalValue: 0,
          emotionalWeight: 0,
        },
      }),
    ];

    const clusters = buildClusters(contacts, evaluations);

    expect(clusters.map(cluster => cluster.kind)).toEqual(
      expect.arrayContaining(['family', 'work', 'close_friend', 'dormant']),
    );
  });

  it('moves contacts between clusters without duplicating membership', () => {
    const moved = moveContactBetweenClusters(
      [
        {
          id: 'cluster-a',
          name: 'A',
          color: '#111111',
          kind: 'custom',
          contactIds: ['contact-1'],
          locked: false,
          createdAt: '2026-03-20T00:00:00.000Z',
          updatedAt: '2026-03-20T00:00:00.000Z',
        },
        {
          id: 'cluster-b',
          name: 'B',
          color: '#222222',
          kind: 'custom',
          contactIds: [],
          locked: false,
          createdAt: '2026-03-20T00:00:00.000Z',
          updatedAt: '2026-03-20T00:00:00.000Z',
        },
      ],
      'contact-1',
      'cluster-b',
    );

    expect(moved[0].contactIds).toEqual([]);
    expect(moved[1].contactIds).toEqual(['contact-1']);
  });
});
