import {
  computeSummaryMetrics,
  deriveConfidence,
  deriveScoresFromGesture,
} from '@/services/scoringService';

import { makeEvaluation, makeScores } from '../factories/entities';

describe('scoringService', () => {
  it('derives scores from gesture input and clamps to expected ranges', () => {
    const nextScores = deriveScoresFromGesture(makeScores(), {
      translationX: 180,
      translationY: -180,
      velocityX: 500,
      velocityY: 250,
    });

    expect(nextScores.importance).toBe(72);
    expect(nextScores.comfort).toBe(68);
    expect(nextScores.activity).toBe(68);
    expect(nextScores.futureAttention).toBe(72);
    expect(nextScores.supportiveness).toBe(8);
    expect(nextScores.professionalValue).toBe(4);
    expect(nextScores.emotionalWeight).toBe(10);
    expect(nextScores.stability).toBeCloseTo(2, 1);
    expect(nextScores.complexity).toBeCloseTo(-1.7, 1);
  });

  it('maps gesture velocity to the documented confidence range', () => {
    expect(
      deriveConfidence({
        translationX: 0,
        translationY: 0,
        velocityX: 0,
        velocityY: 0,
      }),
    ).toBe(0.5);

    expect(
      deriveConfidence({
        translationX: 0,
        translationY: 0,
        velocityX: 4000,
        velocityY: 4000,
      }),
    ).toBe(1.5);
  });

  it('computes shared summary metrics from evaluation sets', () => {
    const metrics = computeSummaryMetrics([
      makeEvaluation({
        contactId: 'contact-1',
        scores: makeScores({
          importance: 90,
          comfort: 85,
          activity: 40,
          futureAttention: 80,
          supportiveness: 20,
          stability: 10,
        }),
        tags: ['work'],
        pinnedToCore: true,
      }),
      makeEvaluation({
        contactId: 'contact-2',
        scores: makeScores({
          importance: 70,
          comfort: 55,
          activity: 60,
          futureAttention: 50,
          supportiveness: -10,
          stability: 0,
        }),
      }),
    ]);

    expect(metrics.coreScore).toBeCloseTo(68.75, 2);
    expect(metrics.warmth).toBeCloseTo(44.0, 2);
    expect(metrics.neglect).toBeCloseTo(30, 2);
    expect(metrics.concentration).toBe(50);
    expect(metrics.workSplit).toBe(50);
    expect(metrics.supportDensity).toBeCloseTo(36.67, 2);
    expect(metrics.emotionalBalance).toBe(60);
    expect(metrics.stability).toBe(66);
  });

  it('returns zeroed summary metrics when no evaluations exist', () => {
    expect(computeSummaryMetrics([])).toEqual({
      coreScore: 0,
      warmth: 0,
      neglect: 0,
      concentration: 0,
      workSplit: 0,
      supportDensity: 0,
      emotionalBalance: 0,
      stability: 0,
    });
  });
});
