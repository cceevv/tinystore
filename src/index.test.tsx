import { FC, useEffect } from 'react'
import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';
import tinyStore, { Getter, Setter } from './index';

test('tinyStore', async () => {

  interface Point { x: number, y: number }

  class DemoState {
    label = ''
    num = 1000
    point: Point = {
      x: 0,
      y: 0,
    }
    list = [1, 2, 3, 4]
  }

  class DemoAction {

    constructor(
      // Constructor Shorthand
      private get: Getter<DemoState>,
      private set: Setter<DemoState>,
    ) {
      set({ label: 'Hello Kitty.' })
    }

    private readonly names = ['Aaron', 'Petter', 'Charles']
    private randomIdx = 0

    inc() {
      const { num } = this.get()
      this.set({ num: num + 1 })
    }

    setPoint(x: number, y: number) {
      const { point } = this.get(true)
      console.log('-----', point.x, point.y)
      this.set({ point: { x, y } })
    }

    // async example
    async randomName() {
      await new Promise(resolve => setTimeout(resolve, 10));
      this.set({ label: this.names[this.randomIdx++ % this.names.length] })
    }
  }

  const demoStore = tinyStore(DemoState, DemoAction)

  const Demo: FC = () => {
    const { inc, setPoint, randomName } = demoStore.actions()
    const { label, num, point } = demoStore.useStore()
    const store = demoStore.useStore(true)

    useEffect(() => {
      console.log('store.num', store.num)
      // @ts-ignore
      expect(() => (store.ccc = 'ccc')).toThrow()
    }, [store])

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

  // @ts-ignore
  expect(() => tinyStore()).toThrow();
  // @ts-ignore
  expect(() => tinyStore(DemoState)).toThrow();
  // @ts-ignore
  expect(() => tinyStore({}, {})).toThrow();
  // @ts-ignore
  expect(() => tinyStore(1234, 'sss')).toThrow();

  // @ts-ignore
  expect(() => (demoStore.getStore().aaa = 111)).toThrow();
  // @ts-ignore
  demoStore.getStore(true).aaa = 111222
  // @ts-ignore
  expect(demoStore.getStore(true).aaa).toBe(111222)
  // @ts-ignore
  expect(() => (demoStore.actions().bbb = 222)).toThrow();

  const { getByText } = render(<Demo />);

  fireEvent.click(getByText('inc'));
  expect(getByText('1001')).toBeInTheDocument();

  fireEvent.click(getByText('inc'));
  expect(getByText('1002')).toBeInTheDocument();

  expect(getByText('[0, 0]')).toBeInTheDocument();
  fireEvent.click(getByText('setPoint'));
  expect(getByText('[111, 222]')).toBeInTheDocument();
  fireEvent.click(getByText('setPoint'));
  expect(getByText('[111, 222]')).toBeInTheDocument();

  fireEvent.click(getByText('randomName'));
  await waitFor(() => {
    expect(getByText(/Aaron/)).toBeInTheDocument();
  });

  fireEvent.click(getByText('randomName'));
  await waitFor(() => {
    expect(getByText(/Petter/)).toBeInTheDocument();
  });

  fireEvent.click(getByText('randomName'));
  await waitFor(() => {
    expect(getByText(/Charles/)).toBeInTheDocument();
  });
});
