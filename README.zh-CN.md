<div align="center">
<h1>tinystore</h1>

一个面向 React 的极简状态管理库，强调显式 action、只读 state 快照和
selector 订阅。

[![npm](https://img.shields.io/npm/v/@cceevv/tinystore?style=flat-square)](https://www.npmjs.com/package/@cceevv/tinystore)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/cceevv/tinystore/test.yml?branch=master&style=flat-square&label=CI&logo=github)](https://github.com/cceevv/tinystore/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/cceevv/tinystore/badge.svg?branch=master)](https://coveralls.io/github/cceevv/tinystore?branch=master)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@cceevv/tinystore?style=flat-square)](https://bundlephobia.com/result?p=@cceevv/tinystore)
[![npm type definitions](https://img.shields.io/npm/types/typescript?style=flat-square)](https://github.com/cceevv/tinystore/blob/master/src/index.ts)
[![GitHub](https://img.shields.io/github/license/cceevv/tinystore?style=flat-square)](https://github.com/cceevv/tinystore/blob/master/LICENSE)

[English](./README.md) · 简体中文

</div>

---

## 为什么是 tinystore

`tinystore` 面向希望保持 API 很小、状态变更边界很硬的 React 项目：

- `State` 负责定义数据
- `Action` 是唯一允许修改 state 的地方
- 组件通过 `useStore(selector)` 订阅

如果你需要更宽的生态、更丰富的范式，可以直接用 `Zustand`、`Jotai` 或
`Nano Stores`。`tinystore` 的目标不是变成全能型状态库，而是把一种明确模型
做好。

## 特性

- `State + Action` 双 class 模型
- action 外部拿到的 state 永远是只读快照
- `useStore(selector)` 支持按需订阅
- `subscribe(...)` 支持非 React 场景接入
- 支持异步 action 和函数式 `set`

## 安装

```sh
pnpm add @cceevv/tinystore
# or
yarn add @cceevv/tinystore
# or
npm i @cceevv/tinystore
```

## 快速开始

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

## 核心思路

### State 只定义数据

`StateClass` 应该是一个只包含公开字段的简单类。

```ts
class ProfileState {
  nickname = "";
  age = 0;
}
```

### Action 独占修改入口

`ActionClass` 的构造函数会注入 `get` 和 `set`。所有 state 更新都应该通过
`set` 完成。

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

### 组件默认用 selector 订阅

优先使用 selector。无参 `useStore()` 表示订阅整个 state 快照。

```tsx
const age = profileStore.useStore((state) => state.age);
const profile = profileStore.useStore();
```

## API

### `tinyStore(StateClass, ActionClass)`

创建 store，返回：

- `useStore`
- `getStore`
- `subscribe`
- `actions`

### `useStore()`

返回完整的只读 state 快照。

```ts
const state = store.useStore();
```

### `useStore(selector, equalityFn?)`

返回选中的值，只有当 selector 结果变化时才 rerender。

```ts
const count = store.useStore((state) => state.count);
const listLength = store.useStore((state) => state.list.length, Object.is);
```

### `getStore()`

返回当前只读 state 快照，可在 React 组件外使用。

```ts
const snapshot = store.getStore();
```

### `subscribe(listener)`

订阅完整 state，listener 会收到 `(next, prev)`。

```ts
const unsubscribe = store.subscribe((next, prev) => {
  console.log(next, prev);
});
```

### `subscribe(selector, listener, equalityFn?)`

在 React 之外订阅某个选中值。

```ts
const unsubscribe = store.subscribe(
  (state) => state.count,
  (next, prev) => {
    console.log(next, prev);
  },
);
```

### `actions()`

返回只读 action map。

```ts
const { inc } = store.actions();
```

## 设计约束

- action 外部拿到的 state 永远是只读快照。
- 更新嵌套对象时，应当使用不可变替换。
- `tinystore` 是 React-first，不是跨框架 core。
- `tinystore` 不是深层 proxy 响应式系统。

## 对比

| 库 | 核心模型 | 修改边界 | 精细订阅 | 跨框架 |
| --- | --- | --- | --- | --- |
| tinystore | `State + Action` classes | 显式 action | 支持 | 否 |
| Zustand | function store | 约定式 | 支持 | 否 |
| Jotai | atoms | atom write | 支持 | 否 |
| Nano Stores | atoms/stores | store API | 支持 | 是 |

## 从 v1 迁移

- 删除了 `useStore(true)`
- 删除了 `getStore(true)`
- 推荐使用 `useStore(selector)` 作为主订阅方式
- state 快照现在始终只读

## FAQ

### 为什么用 class

因为这样能把数据结构和修改入口分开，代码评审时更容易扫清状态边界。

### 为什么不能直接改 state

因为 `tinystore` 把“显式 action 修改”当成核心约束，而不是可选习惯。

### tinystore 是不是只能给 React 用

公开 API 是 React-first，但同时提供 `getStore()` 和 `subscribe()` 支持
非 React 集成。

### 它和 Zustand 的主要区别是什么

`tinystore` 用更窄的模型，换更强的修改边界和更统一的团队约束。

## License

[MIT License](https://github.com/cceevv/tinystore/blob/master/LICENSE) (c)
[cceevv](https://github.com/cceevv)
