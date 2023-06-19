import { useState, useEffect, useRef, useMemo } from 'react'
import equal from 'fast-deep-equal/es6/react'
import clone from 'clone'

interface TinyStore<S, A> {
  useStore: (source?: boolean) => S
  getStore: (source?: boolean) => S
  actions: () => A
}

type Updater<S> = (data: Partial<S>) => void

export type Getter<S> = (source?: boolean) => S
export type Setter<S> = (data: Partial<S>) => void

export default function tinyStore<S extends {}, A>(
  StateClass: new () => S,
  ActionClass: new (get: Getter<S>, set: Setter<S>) => A,
): TinyStore<S, A> {
  const hooks: Updater<S>[] = []
  const store = new StateClass()
  let cache: S = freeze(clone(store))

  const get: Getter<S> = (source = false) => source ? store : cache
  const set: Setter<S> = (data: Partial<S>) => {
    const state = clone(data)
    Object.assign(store, state)
    if (equal(cache, store)) return;
    cache = freeze(clone(store))
    hooks.forEach(updater => updater(state))
  }
  const action = new ActionClass(get, set)

  const actionMap: any = {}
  Reflect.ownKeys(ActionClass.prototype).forEach(key => {
    if (key === 'constructor') return;
    const val = action[key as keyof A]
    if (typeof val === 'function') {
      actionMap[key] = val.bind(action)
    }
  })
  Object.freeze(actionMap)

  const useStore = (source: boolean) => {
    const [, setState] = useState({})
    const updaterRef = useRef<Updater<S>>()
    const stateProxy = useRef<Partial<S>>({})
    const stateCache = useRef<Partial<S>>({})

    if (!updaterRef.current) {
      updaterRef.current = (data: Partial<S>) => {
        for (let key in data) {
          if (key in stateCache.current && !equal(data[key], stateCache.current[key])) {
            setState({}); break;
          }
        }
      }
      hooks.push(updaterRef.current)
    }

    useEffect(() => () => {
      updaterRef.current && hooks.splice(hooks.indexOf(updaterRef.current), 1)
    }, [])

    useMemo(() => {
      stateProxy.current = new Proxy({}, {
        get: (_, key: string) => {
          const val = cache[key as keyof S]
          stateCache.current[key as keyof S] = val
          return source ? store[key as keyof S] : val
        },
        set: (_, key: string, _val: any) => {
          console.error(`[Forbidden] Try to set [${key}] of`, store, 'from useStore().')
          throw new Error(`State can only be update with set() in Action.`)
        },
      })
    }, [])

    return stateProxy.current
  }

  return {
    useStore: (source = false) => (useStore(source) as S),
    getStore: (source = false) => source ? store : cache,
    actions: () => (actionMap as A),
  };
}

function freeze<T>(obj: T): T {
  Object.freeze(obj)
  if (obj instanceof Array) {
    obj.forEach(freeze)
  } else if (typeof obj === 'object') {
    for (let key in obj) freeze(obj[key])
  }
  return obj
}