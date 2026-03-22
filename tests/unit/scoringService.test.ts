import {
  computeSummaryMetrics,
  deriveConfidence,
  deriveMatrixConfidence,
  deriveColumnSelectionsFromScores,
  deriveScoresFromMatrixSelection,
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

  it('derives scores from matrix selections with all columns at top row', () => {
    const nextScores = deriveScoresFromMatrixSelection({
      selections: { 0: 0, 1: 0, 2: 0, 3: 0 },
      columnCount: 4,
      rowCount: 6,
    });

    expect(nextScores.importance).toBe(100);
    expect(nextScores.comfort).toBe(100);
    expect(nextScores.activity).toBe(100);
    expect(nextScores.futureAttention).toBe(100);
    expect(nextScores.stability).toBe(0);
    expect(nextScores.complexity).toBe(0);
    expect(nextScores.supportiveness).toBe(0);
    expect(nextScores.professionalValue).toBe(0);
    expect(nextScores.emotionalWeight).toBe(0);
  });

  it('uses the matrix position to infer confidence for review prioritization', () => {
    // Near center: row 3 of 6 → t = 1-3/5 = 0.4, |t-0.5| = 0.1 → mean = 0.1 → 0.7 + 0.1*0.6 = 0.76
    expect(
      deriveMatrixConfidence({
        selections: { 0: 3, 1: 3, 2: 3, 3: 3 },
        columnCount: 4,
        rowCount: 6,
      }),
    ).toBeCloseTo(0.76, 2);

    // Top row: t = 1, |t-0.5| = 0.5 → mean = 0.5 → 0.7 + 0.5*0.6 = 1.0
    expect(
      deriveMatrixConfidence({
        selections: { 0: 0, 1: 0, 2: 0, 3: 0 },
        columnCount: 4,
        rowCount: 6,
      }),
    ).toBeCloseTo(1.0, 2);
  });

  it('maps saved relationship scores back into per-column row selections', () => {
    // makeScores() returns default 50/50/50/50 which maps to center rows
    expect(deriveColumnSelectionsFromScores(makeScores(), 6)).toEqual({
      0: 3,
      1: 3,
      2: 3,
      3: 3,
    });

    expect(
      deriveColumnSelectionsFromScores(
        makeScores({
          importance: 100,
          comfort: 100,
          activity: 100,
          futureAttention: 100,
        }),
        6,
      ),
    ).toEqual({ 0: 0, 1: 0, 2: 0, 3: 0 });
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
