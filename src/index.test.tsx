import { FC, StrictMode } from 'react'
import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import tinyStore, { Getter, Setter } from './index'

interface Point {
  x: number
  y: number
}

class DemoState {
  label = ''
  num = 1000
  point: Point = { x: 0, y: 0 }
  list = [1, 2, 3, 4]
}

class DemoAction {
  private readonly names = ['Aaron', 'Petter', 'Charles']
  private randomIdx = 0

  constructor(
    private get: Getter<DemoState>,
    private set: Setter<DemoState>,
  ) {
    this.set({ label: 'Hello Kitty.' })
  }

  inc() {
    this.set((prev) => ({ num: prev.num + 1 }))
  }

  setPoint(x: number, y: number) {
    this.set({ point: { x, y } })
  }

  setLabel(label: string) {
    this.set({ label })
  }

  replaceList(list: number[]) {
    this.set({ list })
  }

  async randomName() {
    await new Promise((resolve) => setTimeout(resolve, 10))
    this.set({ label: this.names[this.randomIdx++ % this.names.length] })
  }

  getCurrentNum() {
    return this.get().num
  }
}

function createDemoStore() {
  return tinyStore(DemoState, DemoAction)
}

test('validates constructor arguments', () => {
  // @ts-ignore
  expect(() => tinyStore()).toThrow('tinyStore expects StateClass and ActionClass constructors.')
  // @ts-ignore
  expect(() => tinyStore(DemoState)).toThrow('tinyStore expects StateClass and ActionClass constructors.')
  // @ts-ignore
  expect(() => tinyStore({}, {})).toThrow('tinyStore expects StateClass and ActionClass constructors.')
})

test('returns readonly store snapshots and readonly actions', () => {
  const store = createDemoStore()

  expect(() => {
    // @ts-ignore
    store.getStore().num = 12
  }).toThrow()

  expect(() => {
    // @ts-ignore
    store.actions().inc = () => undefined
  }).toThrow()
})

test('supports state listeners and selector listeners', () => {
  const store = createDemoStore()
  const stateListener = vi.fn()
  const numListener = vi.fn()

  const unsubscribeState = store.subscribe(stateListener)
  const unsubscribeNum = store.subscribe((state) => state.num, numListener)

  store.actions().inc()
  store.actions().setLabel('same day')

  expect(stateListener).toHaveBeenCalledTimes(2)
  expect(numListener).toHaveBeenCalledTimes(1)
  expect(numListener).toHaveBeenLastCalledWith(1001, 1000)

  unsubscribeState()
  unsubscribeNum()
  store.actions().inc()

  expect(stateListener).toHaveBeenCalledTimes(2)
  expect(numListener).toHaveBeenCalledTimes(1)
})

test('supports async actions and function setter updates', async () => {
  const store = createDemoStore()

  expect(store.actions().getCurrentNum()).toBe(1000)
  store.actions().inc()
  expect(store.actions().getCurrentNum()).toBe(1001)

  await act(async () => {
    await store.actions().randomName()
  })

  expect(store.getStore().label).toBe('Aaron')
})

test('selector subscriptions only rerender when selected value changes', () => {
  const store = createDemoStore()
  const renderCount = {
    num: 0,
    label: 0,
    whole: 0,
  }

  const NumView: FC = () => {
    renderCount.num += 1
    const num = store.useStore((state) => state.num)
    return <span data-testid="num">{num}</span>
  }

  const LabelView: FC = () => {
    renderCount.label += 1
    const label = store.useStore((state) => state.label)
    return <span data-testid="label">{label}</span>
  }

  const WholeView: FC = () => {
    renderCount.whole += 1
    const state = store.useStore()
    return <span data-testid="point">[{state.point.x}, {state.point.y}]</span>
  }

  const Controls: FC = () => {
    const { inc, setLabel, setPoint } = store.actions()
    return (
      <>
        <button onClick={inc}>inc</button>
        <button onClick={() => setLabel('Peter')}>setLabel</button>
        <button onClick={() => setPoint(1, 2)}>setPoint</button>
      </>
    )
  }

  const { getByText, getByTestId } = render(
    <StrictMode>
      <NumView />
      <LabelView />
      <WholeView />
      <Controls />
    </StrictMode>,
  )

  const initialNumRenders = renderCount.num
  const initialLabelRenders = renderCount.label
  const initialWholeRenders = renderCount.whole

  fireEvent.click(getByText('setLabel'))
  expect(getByTestId('label')).toHaveTextContent('Peter')
  expect(renderCount.num).toBe(initialNumRenders)
  expect(renderCount.label).toBeGreaterThan(initialLabelRenders)
  expect(renderCount.whole).toBeGreaterThan(initialWholeRenders)

  const beforeIncLabelRenders = renderCount.label
  const beforeIncWholeRenders = renderCount.whole
  fireEvent.click(getByText('inc'))
  expect(getByTestId('num')).toHaveTextContent('1001')
  expect(renderCount.label).toBe(beforeIncLabelRenders)
  expect(renderCount.whole).toBeGreaterThan(beforeIncWholeRenders)

  const beforePointNumRenders = renderCount.num
  fireEvent.click(getByText('setPoint'))
  expect(getByTestId('point')).toHaveTextContent('[1, 2]')
  expect(renderCount.num).toBe(beforePointNumRenders)
})

test('selector equality function can suppress rerenders', () => {
  const store = createDemoStore()
  let renders = 0

  const ListLengthView: FC = () => {
    renders += 1
    const length = store.useStore((state) => state.list.length, Object.is)
    return <span data-testid="length">{length}</span>
  }

  const Controls: FC = () => {
    const { replaceList } = store.actions()
    return (
      <>
        <button onClick={() => replaceList([9, 8, 7, 6])}>sameLength</button>
        <button onClick={() => replaceList([1, 2])}>shorter</button>
      </>
    )
  }

  const { getByText, getByTestId } = render(
    <>
      <ListLengthView />
      <Controls />
    </>,
  )

  const initialRenders = renders
  fireEvent.click(getByText('sameLength'))
  expect(getByTestId('length')).toHaveTextContent('4')
  expect(renders).toBe(initialRenders)

  fireEvent.click(getByText('shorter'))
  expect(getByTestId('length')).toHaveTextContent('2')
  expect(renders).toBeGreaterThan(initialRenders)
})

test('async actions update components', async () => {
  const store = createDemoStore()

  const Demo: FC = () => {
    const label = store.useStore((state) => state.label)
    const { randomName } = store.actions()
    return (
      <>
        <span>{label}</span>
        <button onClick={() => void randomName()}>randomName</button>
      </>
    )
  }

  const { getByText } = render(<Demo />)

  fireEvent.click(getByText('randomName'))
  await waitFor(() => {
    expect(getByText('Aaron')).toBeInTheDocument()
  })
})
