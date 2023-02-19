<div align="center">
<h1>tinystore</h1>

基于React Hooks的超轻量状态管理器，性能自动优化。

[![npm](https://img.shields.io/npm/v/@cceevv/tinystore?style=flat-square)](https://www.npmjs.com/package/@cceevv/tinystore)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/cceevv/tinystore/test.yml?branch=master&style=flat-square&label=CI&logo=github)](https://github.com/cceevv/tinystore/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/cceevv/tinystore/badge.svg?branch=master)](https://coveralls.io/github/cceevv/tinystore?branch=master)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@cceevv/tinystore?style=flat-square)](https://bundlephobia.com/result?p=@cceevv/tinystore)
[![npm type definitions](https://img.shields.io/npm/types/typescript?style=flat-square)](https://github.com/cceevv/tinystore/blob/master/src/index.ts)
[![GitHub](https://img.shields.io/github/license/cceevv/tinystore?style=flat-square)](https://github.com/cceevv/tinystore/blob/master/LICENSE)

[English](./README.md) · 简体中文

</div>

---

## 特性

- 惊人的re-render自动优化
- 极其简单的API
- 仅100行源代码

## 安装

```sh
pnpm add @cceevv/tinystore
# or
yarn add @cceevv/tinystore
# or
npm i @cceevv/tinystore
```

## 使用

### 1. 定义State

`State`是一个不含方法的简单类，主要用于定义数据类型和结构。

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

### 2. 定义Action

`Action`是一个包含一系列用于改变状态的方法的类，状态只能在`Action`中被改变。

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

### 3. 创建tinyStore

建议步骤1~3放在一个文件内。

```ts
import tinyStore from "@cceevv/tinystore";

export default tinyStore(DemoState, DemoAction);
```

### 4. 在组件中访问state和actions

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
  * `StateClass`: 一个不含方法的简单类，主要用于定义数据类型和结构。
  * `ActionClass`: 一个包含一系列用于改变状态的方法的类。
  * returns: `{useStore, getStore, actions}` 详见下文解释。
  
> `StateClass`和`ActionClass`会被自动初始化，并在`ActionClass`的构造函数中注入`get`和`set`方法用于读写`State`，`State`只能通过`set()`方法在`Action`中被修改。

### `useStore()`

  这是一个 React Hook，返回所有的状态，但只有在组件中使用的状态才会触发React渲染。

### `getStore()`

  返回所有的状态，和`useStore()`的区别是，`getStore()`可以在任何地方被调用，而不仅仅在React组件中。

### `actions()`

  返回所有用于改变`State`的方法，支持异步方法。

> `get()`, `useStore()`, `getStore()`, `actions()`的返回值都是只读的，尝试写入数据会抛出异常！

## License

[MIT License](https://github.com/cceevv/tinystore/blob/master/LICENSE) (c)
[cceevv](https://github.com/cceevv)
