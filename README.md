<div align="center">
<h1>tinystore</h1>

A tiny React state manager with explicit actions, readonly state, and selective
subscriptions.

[![npm](https://img.shields.io/npm/v/@cceevv/tinystore?style=flat-square)](https://www.npmjs.com/package/@cceevv/tinystore)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/cceevv/tinystore/test.yml?branch=master&style=flat-square&label=CI&logo=github)](https://github.com/cceevv/tinystore/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/cceevv/tinystore/badge.svg?branch=master)](https://coveralls.io/github/cceevv/tinystore?branch=master)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@cceevv/tinystore?style=flat-square)](https://bundlephobia.com/result?p=@cceevv/tinystore)
[![npm type definitions](https://img.shields.io/npm/types/typescript?style=flat-square)](https://github.com/cceevv/tinystore/blob/master/src/index.ts)
[![GitHub](https://img.shields.io/github/license/cceevv/tinystore?style=flat-square)](https://github.com/cceevv/tinystore/blob/master/LICENSE)

English · [简体中文](./README.zh-CN.md)

</div>

---

## Why tinystore

`tinystore` is a React-first store for teams that want a tiny API surface and a
hard mutation boundary:

- `State` defines data
- `Action` is the only place allowed to update state
- components subscribe with `useStore(selector)`

If you want a wide ecosystem or multiple store paradigms, use `Zustand`,
`Jotai`, or `Nano Stores`. If you want one small, explicit model, `tinystore`
is the point.

## Features

- Class-based `State + Action` model
- Readonly state snapshots outside actions
- `useStore(selector)` for selective subscriptions
- `subscribe(...)` for non-React integrations
- Async actions and function-style updates

## Install

```sh
pnpm add @cceevv/tinystore
# or
yarn add @cceevv/tinystore
# or
npm i @cceevv/tinystore
```

## Quick start

```ts
import tinyStore, { Getter, Setter } from "@cceevv/tinystore";

class CounterState {
  count = 0;
  label = "hello";
}

class CounterAction {
  constructor(
    private get: Getter<CounterState>,
    private set: Setter<CounterState>,
  ) {}

  inc() {
    this.set((prev) => ({ count: prev.count + 1 }));
  }

  setLabel(label: string) {
    this.set({ label });
  }
}

export const counterStore = tinyStore(CounterState, CounterAction);
```

```tsx
import { counterStore } from "./store";

export function Counter() {
  const count = counterStore.useStore((state) => state.count);
  const label = counterStore.useStore((state) => state.label);
  const { inc, setLabel } = counterStore.actions();

  return (
    <>
      <p>{label}</p>
      <p>{count}</p>
      <button onClick={inc}>inc</button>
      <button onClick={() => setLabel("updated")}>set label</button>
    </>
  );
}
```

## Core ideas

### State defines data

`StateClass` should be a simple class with public fields.

```ts
class ProfileState {
  nickname = "";
  age = 0;
}
```

### Action owns mutations

`ActionClass` receives `get` and `set` in its constructor. State updates should
go through `set`.

```ts
class ProfileAction {
  constructor(
    private get: Getter<ProfileState>,
    private set: Setter<ProfileState>,
  ) {}

  birthday() {
    this.set((prev) => ({ age: prev.age + 1 }));
  }
}
```

### Components subscribe with selectors

Use selectors by default. `useStore()` without arguments subscribes to the whole
state snapshot.

```tsx
const age = profileStore.useStore((state) => state.age);
const profile = profileStore.useStore();
```

## API

### `tinyStore(StateClass, ActionClass)`

Creates a store and returns:

- `useStore`
- `getStore`
- `subscribe`
- `actions`

### `useStore()`

Returns the full readonly state snapshot.

```ts
const state = store.useStore();
```

### `useStore(selector, equalityFn?)`

Returns the selected value and only rerenders when the selected result changes.

```ts
const count = store.useStore((state) => state.count);
const listLength = store.useStore((state) => state.list.length, Object.is);
```

### `getStore()`

Returns the current readonly state snapshot. It can be used outside React
components.

```ts
const snapshot = store.getStore();
```

### `subscribe(listener)`

Subscribes to the full state. The listener receives `(next, prev)`.

```ts
const unsubscribe = store.subscribe((next, prev) => {
  console.log(next, prev);
});
```

### `subscribe(selector, listener, equalityFn?)`

Subscribes to a selected value outside React.

```ts
const unsubscribe = store.subscribe(
  (state) => state.count,
  (next, prev) => {
    console.log(next, prev);
  },
);
```

### `actions()`

Returns the readonly action map.

```ts
const { inc } = store.actions();
```

## Design constraints

- State snapshots are readonly outside actions.
- Nested objects should be replaced immutably when updated.
- `tinystore` is React-first, not a cross-framework store core.
- `tinystore` is not a deep reactive proxy system.

## Comparison

| Library | Primary model | Mutation boundary | Selective subscriptions | Cross-framework |
| --- | --- | --- | --- | --- |
| tinystore | `State + Action` classes | Explicit actions | Yes | No |
| Zustand | Function store | Convention-based | Yes | No |
| Jotai | Atoms | Atom writes | Yes | No |
| Nano Stores | Atoms/stores | Store APIs | Yes | Yes |

## Migration from v1

- `useStore(true)` was removed.
- `getStore(true)` was removed.
- `useStore(selector)` is now the recommended subscription API.
- State snapshots are always readonly.

## FAQ

### Why classes?

To keep state structure and mutation entry points explicit and easy to scan in
code review.

### Why can't I mutate state directly?

Because `tinystore` treats explicit actions as a core design constraint, not an
optional pattern.

### Is tinystore React-only?

The public API is React-first. It also exposes `getStore()` and `subscribe()`
for non-React integrations.

### How is it different from Zustand?

`tinystore` trades ecosystem breadth for a narrower model with harder mutation
boundaries.

## License

[MIT License](https://github.com/cceevv/tinystore/blob/master/LICENSE) (c)
[cceevv](https://github.com/cceevv)
