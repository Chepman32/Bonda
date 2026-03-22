import { DEFAULT_SCORES, SCORE_LIMITS, SCORE_WEIGHTS } from '@/constants/app';
import type {
  ContactEvaluation,
  RelationshipScores,
  SummaryMetrics,
} from '@/models/entities';
import { clamp } from '@/utils/math';

export interface GestureCommit {
  translationX: number;
  translationY: number;
  velocityX: number;
  velocityY: number;
}

export interface MatrixCommit {
  selections: Record<number, number>; // colIndex → rowIndex
  columnCount: number; // always 5
  rowCount: number; // always 9
}

function adjustBaseScore(value: number, delta: number): number {
  return clamp(value + delta, SCORE_LIMITS.baseMin, SCORE_LIMITS.baseMax);
}

function adjustModifierScore(value: number, delta: number): number {
  return clamp(
    value + delta,
    SCORE_LIMITS.modifierMin,
    SCORE_LIMITS.modifierMax,
  );
}

export function deriveScoresFromGesture(
  current: RelationshipScores = DEFAULT_SCORES,
  gesture: GestureCommit,
): RelationshipScores {
  const horizontalStrength = clamp(gesture.translationX / 180, -1, 1);
  const verticalStrength = clamp(gesture.translationY / 180, -1, 1);
  const comfortShift = horizontalStrength * 18;
  const importanceShift = horizontalStrength * 22;
  const activityShift = -verticalStrength * 18;
  const futureAttentionShift = -verticalStrength * 22;

  return {
    importance: adjustBaseScore(current.importance, importanceShift),
    comfort: adjustBaseScore(current.comfort, comfortShift),
    activity: adjustBaseScore(current.activity, activityShift),
    futureAttention: adjustBaseScore(
      current.futureAttention,
      futureAttentionShift,
    ),
    stability: adjustModifierScore(current.stability, gesture.velocityX / 250),
    complexity: adjustModifierScore(
      current.complexity,
      -gesture.velocityX / 300,
    ),
    supportiveness: adjustModifierScore(
      current.supportiveness,
      gesture.translationX > 0 ? 8 : -5,
    ),
    professionalValue: adjustModifierScore(
      current.professionalValue,
      gesture.translationX < 0 ? -2 : 4,
    ),
    emotionalWeight: adjustModifierScore(
      current.emotionalWeight,
      gesture.translationY < 0 ? 10 : -6,
    ),
  };
}

export function deriveConfidence(gesture: GestureCommit): number {
  const velocityMagnitude =
    Math.abs(gesture.velocityX) * 0.7 + Math.abs(gesture.velocityY) * 0.3;

  return clamp(
    0.5 + velocityMagnitude / 2600,
    SCORE_LIMITS.confidenceMin,
    SCORE_LIMITS.confidenceMax,
  );
}

export function deriveScoresFromMatrixSelection(
  selection: MatrixCommit,
): RelationshipScores {
  const { selections, rowCount } = selection;
  const maxRow = rowCount - 1;

  function colT(col: number): number | null {
    if (selections[col] === undefined) return null;
    return 1 - selections[col] / maxRow;
  }

  const t0 = colT(0);
  const t1 = colT(1);
  const t2 = colT(2);
  const t3 = colT(3);
  const t4 = colT(4);

  return {
    importance: Math.round(
      20 + (t0 ?? clamp((DEFAULT_SCORES.importance - 20) / 80, 0, 1)) * 80,
    ),
    comfort: Math.round(
      15 + (t1 ?? clamp((DEFAULT_SCORES.comfort - 15) / 85, 0, 1)) * 85,
    ),
    activity: Math.round(
      10 + (t2 ?? clamp((DEFAULT_SCORES.activity - 10) / 90, 0, 1)) * 90,
    ),
    futureAttention: Math.round(
      10 + (t3 ?? clamp((DEFAULT_SCORES.futureAttention - 10) / 90, 0, 1)) * 90,
    ),
    stability: 0,
    complexity: 0,
    supportiveness: clamp(
      Math.round(
        -50 +
          (t4 ?? clamp((DEFAULT_SCORES.supportiveness + 50) / 100, 0, 1)) * 100,
      ),
      SCORE_LIMITS.modifierMin,
      SCORE_LIMITS.modifierMax,
    ),
    professionalValue: 0,
    emotionalWeight: 0,
  };
}

export function deriveMatrixConfidence(selection: MatrixCommit): number {
  const { selections, rowCount } = selection;
  const maxRow = rowCount - 1;
  const cols = [0, 1, 2, 3, 4];
  const distances = cols.map(col => {
    const rowIndex = selections[col] ?? Math.round(maxRow / 2);
    const t = 1 - rowIndex / maxRow;
    return Math.abs(t - 0.5);
  });
  const distanceFromCenter =
    distances.reduce((sum, d) => sum + d, 0) / distances.length;

  return clamp(
    0.7 + distanceFromCenter * 0.6,
    SCORE_LIMITS.confidenceMin,
    SCORE_LIMITS.confidenceMax,
  );
}

export function deriveColumnSelectionsFromScores(
  scores: RelationshipScores,
  rowCount: number,
): Record<number, number> {
  const maxRow = rowCount - 1;
  const t0 = clamp((scores.importance - 20) / 80, 0, 1);
  const t1 = clamp((scores.comfort - 15) / 85, 0, 1);
  const t2 = clamp((scores.activity - 10) / 90, 0, 1);
  const t3 = clamp((scores.futureAttention - 10) / 90, 0, 1);
  const t4 = clamp((scores.supportiveness + 50) / 100, 0, 1);

  return {
    0: Math.round((1 - t0) * maxRow),
    1: Math.round((1 - t1) * maxRow),
    2: Math.round((1 - t2) * maxRow),
    3: Math.round((1 - t3) * maxRow),
    4: Math.round((1 - t4) * maxRow),
  };
}

export function computeSummaryMetrics(
  evaluations: ContactEvaluation[],
): SummaryMetrics {
  if (evaluations.length === 0) {
    return {
      coreScore: 0,
      warmth: 0,
      neglect: 0,
      concentration: 0,
      workSplit: 0,
      supportDensity: 0,
      emotionalBalance: 0,
      stability: 0,
    };
  }

  const totals = evaluations.reduce(
    (accumulator, evaluation) => {
      accumulator.importance += evaluation.scores.importance;
      accumulator.comfort += evaluation.scores.comfort;
      accumulator.activity += evaluation.scores.activity;
      accumulator.futureAttention += evaluation.scores.futureAttention;
      accumulator.supportiveness += evaluation.scores.supportiveness;
      accumulator.stability += evaluation.scores.stability;
      accumulator.neglect +=
        evaluation.scores.importance - evaluation.scores.activity;
      accumulator.workCount += evaluation.tags.includes('work') ? 1 : 0;
      accumulator.coreCount += evaluation.pinnedToCore ? 1 : 0;
      return accumulator;
    },
    {
      importance: 0,
      comfort: 0,
      activity: 0,
      futureAttention: 0,
      supportiveness: 0,
      stability: 0,
      neglect: 0,
      workCount: 0,
      coreCount: 0,
    },
  );

  const length = evaluations.length;
  const averageImportance = totals.importance / length;
  const averageComfort = totals.comfort / length;
  const averageActivity = totals.activity / length;
  const averageAttention = totals.futureAttention / length;
  const averageSupport = totals.supportiveness / length;

  return {
    coreScore:
      averageImportance * SCORE_WEIGHTS.coreScore.importance +
      averageComfort * SCORE_WEIGHTS.coreScore.comfort +
      averageActivity * SCORE_WEIGHTS.coreScore.activity +
      averageAttention * SCORE_WEIGHTS.coreScore.futureAttention,
    warmth:
      averageComfort * SCORE_WEIGHTS.warmth.comfort +
      averageSupport * SCORE_WEIGHTS.warmth.supportiveness,
    neglect: totals.neglect / length,
    concentration: (totals.coreCount / length) * 100,
    workSplit: (totals.workCount / length) * 100,
    supportDensity: clamp((averageSupport + 50) / 1.5, 0, 100),
    emotionalBalance: clamp((averageComfort + averageActivity) / 2, 0, 100),
    stability: clamp((totals.stability / length + 50) * 1.2, 0, 100),
  };
}
