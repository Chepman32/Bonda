# Bonda

Bonda is an offline-first React Native application for privately mapping, rating, and reviewing your relationship graph on-device. The app is iPhone-first, keeps data local, and works without accounts or network sync.

## Requirements

- Node `20.19.4+`
- Yarn `1.22.x`
- Ruby/Bundler for CocoaPods
- Xcode 16+ for iOS builds
- Android Studio for Android builds

`.nvmrc` and CI currently pin Node `22.11.0` as the default development baseline, but the supported minimum matches the React Native toolchain requirement.

## Setup

```sh
yarn install
bundle install
yarn pods
```

Default local development uses `.env.development`. Alternative build configs are provided with `.env.staging` and `.env.production`.

## Running

```sh
yarn start
yarn ios
yarn android
```

Additional scripts:

- `yarn ios:staging`
- `yarn android:staging`
- `yarn android:release`
- `yarn lint`
- `yarn typecheck`
- `yarn test`
- `yarn test:coverage`

## Architecture

The codebase follows a clean architecture split under `src/`:

- `components`, `screens`, `navigation`, `theme`: presentation layer
- `store`: app state orchestration with Zustand slices
- `services`: business logic, repositories, device integrations, persistence, export
- `models`, `constants`, `utils`, `locales`: shared domain and infrastructure support

Persistence is split between encrypted MMKV for settings and lightweight secure values, and Nitro SQLite for structured app data and history.

## Key Product Areas

- Contact permission and on-device import pipeline
- Name normalization and deterministic deduplication
- Gesture-driven evaluation deck with confidence scoring
- Heuristic clustering and insight generation
- Local diagnostics logging and export sharing
- Poster, stats, PDF, and loop export generation

## Environment Variables

| Variable              | Description                                                 | Example       |
| --------------------- | ----------------------------------------------------------- | ------------- |
| `APP_ENV`             | Environment label surfaced in diagnostics and app metadata  | `development` |
| `APP_DISPLAY_VERSION` | Human-readable display version                              | `0.1.0-dev`   |
| `ENABLE_DEMO_MODE`    | Enables preview contacts when real contacts are unavailable | `true`        |
| `ENABLE_DIAGNOSTICS`  | Enables on-device diagnostics capture and viewer            | `true`        |

These files are committed because they contain non-secret build metadata only. No credentials or signing secrets belong in `.env`.

## Testing

The Jest suite covers scoring, clustering, insight generation, contact normalization, repositories, store flows, and selected UI components. Coverage thresholds are enforced in `jest.config.js`, with higher thresholds on the core business logic modules.

## CI

GitHub Actions runs lint, typecheck, unit/integration tests, CocoaPods install, and smoke builds for Android and iOS. See `.github/workflows/ci.yml`.

## ADRs

Architecture decision records live in `docs/adr/`:

- `0001-clean-architecture.md`
- `0002-scoring-model.md`
- `0003-local-privacy-model.md`
- `0004-export-pipeline.md`
