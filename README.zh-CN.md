<div align="center">
<h1>tinystore</h1>

基于React Hooks的超轻量状态管理器，性能自动优化。

[![npm](https://img.shields.io/npm/v/@cceevv/tinystore?style=flat-square)](https://www.npmjs.com/package/@cceevv/tinystore)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/cceevv/tinystore/test.yml?branch=master&style=flat-square&label=CI&logo=github)](https://github.com/cceevv/tinystore/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/cceevv/tinystore/badge.svg?branch=master)](https://coveralls.io/github/cceevv/tinystore?branch=master)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/tinystore?style=flat-square)](https://bundlephobia.com/result?p=tinystore)
[![npm type definitions](https://img.shields.io/npm/types/typescript?style=flat-square)](https://github.com/cceevv/tinystore/blob/master/src/index.ts)
[![GitHub](https://img.shields.io/github/license/cceevv/tinystore?style=flat-square)](https://github.com/cceevv/tinystore/blob/master/LICENSE)

[English](./README.md) · 简体中文

</div>

---

## 特性

- 惊人的re-render自动优化
- 极其简单的API

## 安装

```sh
pnpm add @cceevv/tinystore
# or
yarn add @cceevv/tinystore
# or
npm i @cceevv/tinystore
```

## 使用

### 1. State定义

```ts
class UserState {
  name = "";
  age = 0;
}
```

### 2. Action定义

```ts
import type { Getter, Setter } from "tinystore";

class UserAction {
  constructor(
    // Constructor Shorthand
    private get: Getter<UserState>,
    private set: Setter<UserState>,
  ) {
    set({
      name: "Anonymous",
      age: 1,
    });
  }

  incAge() {
    const { age } = this.get();
    this.set({ age: age + 1 });
  }

  // async example
  async randomName() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const names = ["Aaron", "Petter", "Charles"];
    this.set({ name: names[Math.random() * names.length | 0] });
  }
}
```

### 3. tinyStore创建

```ts
import tinyStore from "tinyStore";

const userStore = tinyStore(UserState, UserAction);
```

### 4. 在组件中访问state和actions

```tsx
const Demo = () => {
  const { name, age } = userStore.useStore();
  const { incAge, randomName } = userStore.actions();

  return (
    <>
      <p>
        <label>name:</label>
        <span>{name}</span>
      </p>
      <p>
        <label>age:</label>
        <span>{age}</span>
      </p>
      <button onClick={incAge}>incAge</button>
      <button onClick={randomName}>randomName</button>
    </>
  );
};
```

## License

[MIT License](https://github.com/cceevv/tinystore/blob/master/LICENSE) (c)
[cceevv](https://github.com/cceevv)
