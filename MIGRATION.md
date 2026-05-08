# Migration Guide

## v1 to v2

`tinystore` v2 keeps the `State + Action` class model, but tightens the state
boundary and updates the subscription model.

### Removed APIs

- `useStore(true)`
- `getStore(true)`

State snapshots are always readonly in v2.

### Recommended subscription style

Prefer selectors instead of reading the whole store in components.

```tsx
const count = store.useStore((state) => state.count)
```

`useStore()` without arguments still exists, but it subscribes to the full
state snapshot.

### Action updates

`set` now supports function-style updates.

```ts
inc() {
  this.set((prev) => ({ count: prev.count + 1 }))
}
```

### External subscriptions

v2 adds non-React subscriptions:

```ts
const unsubscribe = store.subscribe((next, prev) => {
  console.log(next, prev)
})
```

or

```ts
const unsubscribe = store.subscribe(
  (state) => state.count,
  (next, prev) => {
    console.log(next, prev)
  },
)
```

### Nested state updates

Nested objects should be replaced immutably.

```ts
this.set({ point: { x, y } })
```

Do not rely on mutating nested objects in place.

### Tooling changes

The v2 beta workspace uses:

- `pnpm` for package management
- `Vitest` for tests
- `tsdown` for builds
