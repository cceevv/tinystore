import { FC, useEffect } from 'react'
import '@testing-library/jest-dom';
import { fireEvent, render, waitFor } from '@testing-library/react';
import tinyStore, { Getter, Setter } from './index';

test('tinyStore', async () => {

  class UserState {
    name = ''
    age = 0

    noFuncInState() {
      console.log('xxx')
    }
  }

  class UserAction {
    // init action
    constructor(
      // Constructor Shorthand
      private get: Getter<UserState>,
      private set: Setter<UserState>,
    ) {
      set({
        name: 'Anonymous',
        age: 1,
      })
    }

    public noPublicStateInAction = 'noPublicStateInAction'

    private readonly names = ['Aaron', 'Petter', 'Charles']
    private randomIdx = 0

    incAge() {
      const { age } = this.get()
      this.set({ age: age + 1 })
    }

    // async example
    async randomName() {
      await new Promise(resolve => setTimeout(resolve, 10));
      this.set({ name: this.names[this.randomIdx++ % this.names.length] })
    }

  }

  const userStore = tinyStore(UserState, UserAction)

  const Demo: FC = () => {
    const { incAge, randomName } = userStore.actions()
    const store = userStore.useStore()
    const { name, age, noFuncInState } = userStore.useStore()

    useEffect(() => {
      // @ts-ignore
      expect(() => (store.ccc = 'ccc')).toThrow()
    }, [store])

    useEffect(() => {
      expect(noFuncInState).toBeUndefined();
    }, [noFuncInState])

    return (
      <>
        <p><label>name:</label><span>{name}</span></p>
        <p><label>age:</label><span>{age}</span></p>
        <button onClick={incAge}>incAge</button>
        <button onClick={randomName}>randomName</button>
      </>
    );
  };

  // @ts-ignore
  expect(() => tinyStore()).toThrow();
  // @ts-ignore
  expect(() => tinyStore(UserState)).toThrow();
  // @ts-ignore
  expect(() => tinyStore({}, {})).toThrow();
  // @ts-ignore
  expect(() => tinyStore(1234, 'sss')).toThrow();

  // @ts-ignore
  expect(() => (userStore.getStore().aaa = 111)).toThrow();
  expect(() => userStore.getStore().noFuncInState()).toThrow();
  // @ts-ignore
  expect(() => (userStore.actions().bbb = 222)).toThrow();
  expect(userStore.actions().noPublicStateInAction).toBeUndefined();

  const { getByText } = render(<Demo />);

  fireEvent.click(getByText('incAge'));
  expect(getByText('2')).toBeInTheDocument();

  fireEvent.click(getByText('incAge'));
  expect(getByText('3')).toBeInTheDocument();


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
