import { useRef, useSyncExternalStore } from 'react'
type StateClass<S> = new () => S
type ActionClass<S, A> = new (get: Getter<S>, set: Setter<S>) => A
type Selector<S, T> = (state: Readonly<S>) => T
type EqualityFn<T> = (left: T, right: T) => boolean
type StateListener<S> = (next: Readonly<S>, prev: Readonly<S>) => void
type SelectorListener<T> = (next: T, prev: T) => void
type Patch<S> = Partial<S> | ((prev: Readonly<S>) => Partial<S>)

export type Getter<S> = () => Readonly<S>
export type Setter<S> = (patch: Patch<S>) => void

export interface TinyStore<S, A> {
  useStore(): Readonly<S>
  useStore<T>(selector: Selector<S, T>, equalityFn?: EqualityFn<T>): T
  getStore(): Readonly<S>
  subscribe(listener: StateListener<S>): () => void
  subscribe<T>(
    selector: Selector<S, T>,
    listener: SelectorListener<T>,
    equalityFn?: EqualityFn<T>,
  ): () => void
  actions(): Readonly<A>
}

export default function tinyStore<S extends object, A>(
  StateClass: StateClass<S>,
  ActionClass: ActionClass<S, A>,
): TinyStore<S, A> {
  assertStoreClasses(StateClass, ActionClass)

  const listeners = new Set<StateListener<S>>()
  let state = new StateClass()
  let snapshot = createReadonlySnapshot(state)

  const getState: Getter<S> = () => snapshot

  const emit = (next: Readonly<S>, prev: Readonly<S>) => {
    listeners.forEach((listener) => listener(next, prev))
  }

  const setState: Setter<S> = (patch) => {
    const partial = typeof patch === 'function' ? patch(snapshot) : patch
    const keys = Object.keys(partial) as Array<keyof S>

    if (keys.length === 0) return

    let changed = false
    const nextState = { ...state } as S

    keys.forEach((key) => {
      const value = partial[key]
      if (Object.is(nextState[key], value)) return
      changed = true
      nextState[key] = value as S[keyof S]
    })

    if (!changed) return

    const prevSnapshot = snapshot
    state = nextState
    snapshot = createReadonlySnapshot(state)
    emit(snapshot, prevSnapshot)
  }

  const subscribeState = (listener: StateListener<S>) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const action = new ActionClass(getState, setState)
  const actionMap = bindActions(action, ActionClass)

  function subscribe(listener: StateListener<S>): () => void
  function subscribe<T>(
    selector: Selector<S, T>,
    listener: SelectorListener<T>,
    equalityFn?: EqualityFn<T>,
  ): () => void
  function subscribe<T>(
    selectorOrListener: Selector<S, T> | StateListener<S>,
    listener?: SelectorListener<T>,
    equalityFn: EqualityFn<T> = Object.is,
  ) {
    if (typeof listener !== 'function') {
      return subscribeState(selectorOrListener as StateListener<S>)
    }

    const selector = selectorOrListener as Selector<S, T>
    let current = selector(snapshot)

    return subscribeState((nextState) => {
      const next = selector(nextState)
      if (equalityFn(current, next)) return
      const prev = current
      current = next
      listener(next, prev)
    })
  }

  function useStore(): Readonly<S>
  function useStore<T>(selector: Selector<S, T>, equalityFn?: EqualityFn<T>): T
  function useStore<T = Readonly<S>>(
    selector?: Selector<S, T>,
    equalityFn: EqualityFn<T> = Object.is,
  ): T {
    const currentSelector = selector ?? ((currentState: Readonly<S>) => currentState as unknown as T)
    const selectedRef = useRef<T | undefined>(undefined)

    return useSyncExternalStore(
      subscribeState,
      () => {
        const nextSelected = currentSelector(snapshot)
        if (
          selectedRef.current !== undefined &&
          equalityFn(selectedRef.current, nextSelected)
        ) {
          return selectedRef.current
        }
        selectedRef.current = nextSelected
        return nextSelected
      },
      () => currentSelector(snapshot),
    )
  }

  return {
    useStore,
    getStore: getState,
    subscribe,
    actions: () => actionMap,
  }
}

function bindActions<S, A>(
  action: A,
  ActionClass: ActionClass<S, A>,
): Readonly<A> {
  const actionMap = {} as Record<PropertyKey, unknown>

  Reflect.ownKeys(ActionClass.prototype).forEach((key) => {
    if (key === 'constructor') return
    const value = action[key as keyof A]
    if (typeof value === 'function') {
      actionMap[key] = value.bind(action)
    }
  })

  return Object.freeze(actionMap) as Readonly<A>
}

function createReadonlySnapshot<T>(state: T): Readonly<T> {
  return freeze(deepClone(state)) as Readonly<T>
}

function deepClone<T>(value: T): T {
  if (value instanceof Date) return new Date(value.getTime()) as T
  if (value instanceof RegExp) return new RegExp(value) as T
  if (Array.isArray(value)) return value.map((item) => deepClone(item)) as T
  if (!isPlainObject(value)) return value

  const clone = {} as Record<string, unknown>
  Object.keys(value).forEach((key) => {
    clone[key] = deepClone(value[key as keyof T])
  })
  return clone as T
}

function freeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) {
    return value
  }

  Object.freeze(value)

  if (Array.isArray(value)) {
    value.forEach((item) => freeze(item))
    return value
  }

  Object.keys(value).forEach((key) => {
    freeze((value as Record<string, unknown>)[key])
  })
  return value
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function assertStoreClasses<S, A>(
  StateClass: StateClass<S>,
  ActionClass: ActionClass<S, A>,
) {
  if (typeof StateClass !== "function" || typeof ActionClass !== "function") {
    throw new TypeError('tinyStore expects StateClass and ActionClass constructors.')
  }
}
