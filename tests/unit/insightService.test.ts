import {
  buildBubbleNodes,
  buildInsightCards,
  getContactPlacementDescription,
} from '@/services/insightService';

import {
  makeCluster,
  makeContact,
  makeEvaluation,
  makeScores,
} from '../factories/entities';

describe('insightService', () => {
  it('builds all summary insight cards required for the summary surface', () => {
    const contacts = [
      makeContact({ id: 'contact-1' }),
      makeContact({
        id: 'contact-2',
        displayName: 'Work Mate',
        sortName: 'work mate',
      }),
    ];
    const evaluations = [
      makeEvaluation({
        contactId: 'contact-1',
        pinnedToCore: true,
        scores: makeScores({
          importance: 92,
          comfort: 84,
          activity: 36,
          futureAttention: 88,
          supportiveness: 24,
          complexity: 6,
        }),
      }),
      makeEvaluation({
        contactId: 'contact-2',
        tags: ['work'],
        scores: makeScores({
          importance: 70,
          comfort: 38,
          activity: 45,
          futureAttention: 56,
          supportiveness: -4,
          complexity: 20,
        }),
      }),
    ];
    const clusters = [
      makeCluster({
        id: 'cluster-1',
        name: 'Core',
        contactIds: ['contact-1', 'contact-2'],
      }),
    ];

    const insights = buildInsightCards(contacts, evaluations, clusters);

    expect(insights).toHaveLength(10);
    expect(insights.map(card => card.id)).toEqual([
      'core-circle',
      'emotional-balance',
      'support-density',
      'concentration',
      'neglected',
      'work-split',
      'quality-spectrum',
      'reconnect',
      'stable-group',
      'drain',
    ]);
  });

  it('creates bubble placements and readable contact placement descriptions', () => {
    const contact = makeContact({ id: 'contact-1' });
    const evaluation = makeEvaluation({
      contactId: 'contact-1',
      pinnedToCore: true,
      scores: makeScores({ importance: 90, comfort: 82 }),
    });
    const cluster = makeCluster({ contactIds: ['contact-1'] });

    const nodes = buildBubbleNodes(
      [contact],
      [evaluation],
      [cluster],
      'warmth',
    );

    expect(nodes[0].radius).toBeGreaterThan(20);
    expect(nodes[0].clusterId).toBe('cluster-1');
    expect(getContactPlacementDescription(contact, evaluation)).toContain(
      'core circle',
    );
  });

  it('covers empty and dormant placement states', () => {
    const contact = makeContact({ id: 'contact-empty' });
    const dormantEvaluation = makeEvaluation({
      contactId: 'contact-empty',
      markedDormant: true,
      scores: makeScores({ activity: 20 }),
    });

    const insights = buildInsightCards([], [], []);

    expect(insights).toHaveLength(10);
    expect(getContactPlacementDescription(contact)).toContain(
      'not been evaluated',
    );
    expect(
      getContactPlacementDescription(contact, dormantEvaluation),
    ).toContain('outer orbit');
  });
});
