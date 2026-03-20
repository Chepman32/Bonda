# ADR 0002: Relationship Scoring Model

## Status

Accepted

## Context

Bonda’s evaluation system needs to support fast gesture-based input while still producing deterministic summaries and review queues.

## Decision

- Core dimensions are `importance`, `comfort`, `activity`, and `futureAttention`, each stored as `0..100`.
- Modifier dimensions are `stability`, `complexity`, `supportiveness`, `professionalValue`, and `emotionalWeight`, each stored as `-50..50`.
- Shared summary weights come from a single constants module:
  - `coreScore = 0.35 importance + 0.30 comfort + 0.20 activity + 0.15 futureAttention`
  - `warmth = 0.60 comfort + 0.40 supportiveness`
  - `neglect = importance - activity`
- Gesture velocity contributes a confidence multiplier in the `0.5..1.5` range.

## Consequences

- Gesture input and summary output remain consistent across screens.
- The review queue can prioritize skipped or low-confidence evaluations deterministically.
- Summary metrics are easy to regression-test.
