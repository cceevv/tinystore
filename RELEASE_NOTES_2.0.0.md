## tinystore 2.0.0

This release promotes the v2 store model to stable.

### Highlights

- readonly state snapshots outside actions
- selector-based `useStore` subscriptions
- external `subscribe(...)` support
- function-style `set((prev) => partial)` updates
- React-friendly subscriptions built on `useSyncExternalStore`

### Tooling updates

- package management uses `pnpm`
- tests run on `Vitest`
- builds run on `tsup`

### Breaking changes

- removed `useStore(true)`
- removed `getStore(true)`
- state snapshots are always readonly outside actions
