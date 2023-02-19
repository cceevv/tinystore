import { useState, useEffect, useRef, useMemo } from 'react'
import equal from 'fast-deep-equal/es6/react'
import clone from 'clone'

interface TinyStore<S, A> {
  useStore: () => S
  getStore: () => S
  actions: () => A
}

type Updater<S> = (data: Partial<S>) => void

export type Getter<S> = () => S
export type Setter<S> = (data: Partial<S>) => void

export default function tinyStore<S extends {}, A>(
  StateClass: new () => S,
  ActionClass: new (get: Getter<S>, set: Setter<S>) => A,
): TinyStore<S, A> {
  const hooks: Updater<S>[] = []
  const store = new StateClass()

  const storeProxy: S = new Proxy({}, {
    get: (_, key: string) => {
      const val = store[key as keyof S]
      if (typeof val === 'function') {
        return undefined
      }
      return clone(val)
    },
    set: (_, key: string, _val: any) => {
      console.error(`[Forbidden] Try to set [${key}] of`, store, 'from get() or getStore().')
      throw new Error(`State can only be update with set() in Action.`)
    },
  }) as S

  const get: Getter<S> = () => (storeProxy as S)
  const set: Setter<S> = (data: Partial<S>) => {
    const state = clone(data)
    Object.assign(store, state)
    hooks.forEach(updater => updater(state))
  }
  const action = new ActionClass(get, set)

  const actionProxy = new Proxy({}, {
    get: (_, key: string) => {
      const val = action[key as keyof A]
      if (typeof val === 'function') {
        return val.bind(action)
      }
      return undefined
    },
    set: (_, key: string, _val: any) => {
      console.error(`[Forbidden] Try to set [${key}] function of`, action, 'from actions().')
      throw new Error(`You should never change action functions dynamically.`)
    },
  })

  const useStore = () => {
    const [, setState] = useState({})
    const stateProxy = useRef<Partial<S>>({})
    const stateCache = useRef<Partial<S>>({})

    useMemo(() => {
      stateProxy.current = new Proxy({}, {
        get: (_, key: string) => {
          const val = storeProxy[key as keyof S]
          stateCache.current[key as keyof S] = val
          return val
        },
        set: (_, key: string, _val: any) => {
          console.error(`[Forbidden] Try to set [${key}] of`, store, 'from useStore().')
          throw new Error(`State can only be update with set() in Action.`)
        },
      })
    }, [])

    useEffect(() => {
      const updater: Updater<S> = (data: Partial<S>) => {
        for (let key in data) {
          if (key in stateCache.current && !equal(data[key], stateCache.current[key])) {
            setState({}); break;
          }
        }
      }
      hooks.push(updater)
      return () => {
        hooks.splice(hooks.indexOf(updater), 1)
      }
    }, [])

    return stateProxy.current
  }

  return {
    useStore: () => (useStore() as S),
    getStore: () => (storeProxy as S),
    actions: () => (actionProxy as A),
  };
}