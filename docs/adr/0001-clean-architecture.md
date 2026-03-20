# ADR 0001: Clean Architecture Boundaries

## Status

Accepted

## Context

Bonda needs to ship as a production mobile application with strong separation between presentation, business rules, and persistence. The app also needs to remain fully usable offline.

## Decision

- Presentation concerns live under `components`, `screens`, `navigation`, and `theme`.
- State orchestration lives in Zustand slices under `store`.
- Domain and infrastructure logic live in `services`, `models`, `constants`, and `utils`.
- Screens do not reach directly into storage or device APIs. They call store actions, which coordinate repositories and services.

## Consequences

- State changes stay centralized and testable.
- Repository and service logic can be covered with Jest without rendering the full UI tree.
- Native integrations remain behind small service boundaries instead of leaking into screens.
