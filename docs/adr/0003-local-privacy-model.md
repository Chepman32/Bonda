# ADR 0003: Local-Only Privacy Model

## Status

Accepted

## Context

The product is explicitly local-only. Contact graphs, evaluations, exports, and diagnostics should remain on the device unless the user intentionally shares an export or log file.

## Decision

- No account system, backend, cloud sync, or remote analytics.
- Settings and lightweight secure values are stored in encrypted MMKV.
- The encryption key is generated once and stored in Keychain.
- Structured entities and history are stored locally in Nitro SQLite.
- Diagnostic logs stay on-device and must not include raw contact payloads.
- Export files are written into app-private storage and marked with iOS file protection attributes where supported.

## Consequences

- The app can function fully offline.
- Operational observability is local and user-controlled.
- Security-sensitive values avoid plain-text storage in app files.
