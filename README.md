<div align="center">
<h1>tinystore</h1>

Tiny state manager based on React Hooks, with automatic performance
optimization.

[![npm](https://img.shields.io/npm/v/@cceevv/tinystore?style=flat-square)](https://www.npmjs.com/package/@cceevv/tinystore)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/cceevv/tinystore/test.yml?branch=master&style=flat-square&label=CI&logo=github)](https://github.com/cceevv/tinystore/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/cceevv/tinystore/badge.svg?branch=master)](https://coveralls.io/github/cceevv/tinystore?branch=master)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@cceevv/tinystore?style=flat-square)](https://bundlephobia.com/result?p=@cceevv/tinystore)
[![npm type definitions](https://img.shields.io/npm/types/typescript?style=flat-square)](https://github.com/cceevv/tinystore/blob/master/src/index.ts)
[![GitHub](https://img.shields.io/github/license/cceevv/tinystore?style=flat-square)](https://github.com/cceevv/tinystore/blob/master/LICENSE)

English · [简体中文](./README.zh-CN.md)

</div>

---

## Features

- Amazing re-render auto-optimization
- Extremely simple API
- Only 100 lines of source code

## Install

```sh
pnpm add @cceevv/tinystore
# or
yarn add @cceevv/tinystore
# or
npm i @cceevv/tinystore
```

## Usage

### 1. State definition

`State` is a simple class with no methods, mainly used to define data types and structures.

```ts
interface Point { x: number, y: number }

class DemoState {
  label = ''
  num = 0
  point: Point = {
    x: 0,
    y: 0,
  }

  noFuncInState() {
    console.log('xxx')
  }
}
```

### 2. Action definition

`Action` is a class that contains a series of methods for changing the `State`, and the state can only be changed in `Action`.

```ts
import type { Getter, Setter } from "@cceevv/tinystore";  

class DemoAction {

  constructor(
    // Constructor Shorthand
    private get: Getter<DemoState>,
    private set: Setter<DemoState>,
  ) {
    set({ label: 'Hello Kitty.' })
  }

  inc() {
    const { num } = this.get()
    this.set({ num: num + 1 })
  }

  setPoint(x: number, y: number) {
    this.set({ point: { x, y } })
  }

  private readonly names = ['Aaron', 'Petter', 'Charles']

  // async example
  async randomName() {
    await new Promise(resolve => setTimeout(resolve, 10));
    this.set({ label: this.names[Math.random() * this.names.length | 0] });
  }
}
```

### 3. tinyStore initialization

It is recommended that steps 1~3 be placed in one file.

```ts
import tinyStore from "@cceevv/tinystore";

export default tinyStore(DemoState, DemoAction);
```

### 4. Access state and actions in components

```tsx
import store from 'path/to/store'

const Demo = () => {
  const { label, num, point } = store.useStore()
  const { inc, setPoint, randomName } = store.actions()

  return (
    <>
      <p><label>num:</label><span>{num}</span></p>
      <button onClick={inc}>inc</button>

      <p><label>point:</label><span>[{point.x}, {point.y}]</span></p>
      <button onClick={() => setPoint(111, 222)}>setPoint</button>

      <p><label>label:</label><span>{label}</span></p>
      <button onClick={randomName}>randomName</button>
    </>
  );
};
```

## API

### `tinyStore(StateClass, ActionClass)`
  * `StateClass`: A simple class without methods, mainly used to define data types and structures.
  * `ActionClass`: A class that contains a set of methods for changing the `State`.
  * returns: `{useStore, getStore, actions}` See the explanation below for details.
  
> `StateClass` and `ActionClass` will be automatically initialized, and `get` and `set` methods will be injected into the constructor of `ActionClass` to read and write `State`, `State` can only be modified in `Action` through `set()` method.

### `useStore()`

  This is a React Hook that returns all state, but only the state that is used in the component will trigger a React render.

### `getStore()`

  Returns all state. The difference from `useStore()` is that `getStore()` can be called anywhere, not just in React components.

### `actions()`

  Returns all methods used to change `State`, supports asynchronous methods.

> The return values of `get()`, `useStore()`, `getStore()`, `actions()` are all read-only, trying to write data will throw an exception!

## License

[MIT License](https://github.com/cceevv/tinystore/blob/master/LICENSE) (c)
[cceevv](https://github.com/cceevv)
