# Changelog

## 2.0.0

### Changed

- Reworked the React subscription layer to use `useSyncExternalStore`.
- Added `useStore(selector, equalityFn?)` for selective subscriptions.
- Added `subscribe(listener)` and `subscribe(selector, listener, equalityFn?)`.
- Added function-style `set((prev) => partial)` updates in actions.
- Made state snapshots always readonly outside actions.
- Removed the mutable `useStore(true)` and `getStore(true)` escape hatches.
- Updated the package description and README to reflect the new v2 positioning.

### Tooling

- Upgraded React, TypeScript, build tooling, and test dependencies.
- Added dedicated build and test TypeScript configs for TypeScript 6 compatibility.
- Migrated tests from Jest to Vitest.
- Migrated builds from Rollup to tsup.
- Switched CI to `pnpm` and expanded validation to `typecheck`, `build`, and `test`.
