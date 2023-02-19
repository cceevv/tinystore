import { FC, useEffect } from 'react'
import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';
import tinyStore, { Getter, Setter } from './index';

test('tinyStore', async () => {

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

  class DemoAction {
    // init action
    constructor(
      // Constructor Shorthand
      private get: Getter<DemoState>,
      private set: Setter<DemoState>,
    ) {
      set({ label: 'Hello Kitty.' })
    }

    public noPublicStateInAction = 'noPublicStateInAction'

    private readonly names = ['Aaron', 'Petter', 'Charles']
    private randomIdx = 0

    inc() {
      const { num } = this.get()
      this.set({ num: num + 1 })
    }

    setPoint(x: number, y: number) {
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
    const { label, num, point, noFuncInState } = demoStore.useStore()
    const store = demoStore.useStore()

    useEffect(() => {
      // @ts-ignore
      expect(() => (store.ccc = 'ccc')).toThrow()
    }, [store])

    useEffect(() => {
      expect(noFuncInState).toBeUndefined();
    }, [noFuncInState])

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
  expect(() => demoStore.getStore().noFuncInState()).toThrow();
  // @ts-ignore
  expect(() => (demoStore.actions().bbb = 222)).toThrow();
  expect(demoStore.actions().noPublicStateInAction).toBeUndefined();

  const { getByText } = render(<Demo />);

  fireEvent.click(getByText('inc'));
  expect(getByText('1')).toBeInTheDocument();

  fireEvent.click(getByText('inc'));
  expect(getByText('2')).toBeInTheDocument();

  expect(getByText('[0, 0]')).toBeInTheDocument();
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
