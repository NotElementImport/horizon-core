import { useId } from "./helpers.mjs";
import type { Primitive, Signal } from "../type";

export interface ISignal<T, K> {
    value: T
    readonly asRaw: K
}

// @ts-ignore
if(!Object.asWeakRef) {
    const weakMap = new Map<any, any>();
    // @ts-ignore
    Object.prototype.asWeakRef = function (data: any) { weakMap.set(this, data); return this }
    // @ts-ignore
    Object.prototype.weakRef = function (end: boolean) {
        const data = weakMap.get(this)
        if(end) weakMap.delete(this)
        return data
    }
    // @ts-ignore
    Object.prototype.hasWeakRef = function () {
        return weakMap.has(this)
    }
}

const sharedSignals = new Map<string, ISignal<any, any>>()
const sWatch = Symbol()
const sValue = Symbol()
const sAsRaw = Symbol()
const fakeNull = 'null'

export const clearStateHeap = () =>
    sharedSignals.clear()

export const useSignal = <T extends unknown, K = T>(
    value: T, 
    config: { 
        key?: string
        asRaw?: (v: T) => K
        onSet?: (v: T) => void
        onInit?: (signal: Signal.Signal<T, K>) => void 
    } = {
        onSet: (v) => {}
    }
): Signal.Signal<T, K> => {
    if(config.key && sharedSignals.has(config.key))
        return sharedSignals.get(config.key) as any

    let parentSetter = (v: T) => {}

    const signal = {
        [sWatch]: new Map<string, Function>(),
        get [sValue]() { return signal.value },
        get [sAsRaw]() {
            return config.asRaw
                ? config.asRaw(value)
                : value
        },
        get asRaw() {
            return signal[sAsRaw]
        },
        get value() {
            // @ts-ignore
            return (value ?? fakeNull).asWeakRef({
                value: () => value,
                set: (v: T) => signal.value = v,
                path: '$',
                pathIndex: 0,
                signal
            })
        },
        set value(v) {
            value = useProxy(v, ['$'])
            parentSetter(v)
            useEffect(value, ['$'])
            config.onSet?.(v)
        }
    }

    // @ts-ignore
    if((value ?? null) != null && value.hasWeakRef()) {
        const { set } = fromWeakRef(value, false)
        parentSetter = set
        watch(value, 
            (v) => { value = v },
            { deep: true }
        )
    }
    
    const useProxy = (raw: any, path: string[]) => {
        if(typeof raw != 'object' || raw == null)
            return raw

        Object.entries(raw).forEach(([ key, value ]) => {
            raw[key] = useProxy(value, [...path, key])
        })

        const proxy = (new Proxy(raw, {
            get(target, p) {
                if(p == 'toString')
                    return () => JSON.stringify(raw)
                if(p in target) {
                    const data = target[p] ?? null
                    return data.asWeakRef({
                        value: () => target[p],
                        set: (v: T) => proxy[p] = v,
                        path: p,
                        pathIndex: path.length,
                        signal
                    })
                }
                return null
            },
            set(target, p, newValue, receiver) {
                const $path = Array.isArray(target) && p == 'length' ? path : [...path, p];
                const result = Reflect.set(target, p, useProxy(newValue, $path as any), receiver) as any
                useEffect(value, $path as string[])
                return result
            }
        }))
        return proxy
    }

    const useEffect = (value: any, path: string[]) => {
        signal[sWatch].forEach(callback => {
            callback(value, path)
        })
    }

    value = useProxy(value, ['$'])

    // @ts-ignore
    if(config.onInit) config.onInit(signal)

    if(config.key)
        sharedSignals.set(config.key, signal)

    return signal as any
}

// export const useComputed = <T extends unknown>(signals: ISignal<any, any>, handle: () => T) => {
//     const signal = useSignal(null)

//     return {
//         // @ts-ignore
//         [sWatch]: signal[sWatch],
//         get value() { return signal.value }
//     }
// }

export const useProxySignal = <T extends Primitive.LikeProxy>(
    signal: Signal.Signal<any>, 
    config: Signal.SignalProxySetup<T> = {}
): Signal.ProxySignal<T> => {
    return (new Proxy(signal.value, {
        set(target, p, newValue, receiver) {
            // @ts-ignore
            if(p == sWatch) return (signal[sWatch] = newValue, true)
            else if(!config.set) return Reflect.set(target, p, newValue, receiver)
            return config.set(target as T, p, newValue) ?? true
        },
        get(target, p, receiver) {
            // @ts-ignore
            if(p == sWatch
                || p == sAsRaw
                || p == sValue
            ) return Reflect.get(signal, p, receiver)
            else if(!config.get) return Reflect.get(target, p, receiver)
            return config.get(target as T, p) ?? null
        },
        has(target, p) {
            if(p == sAsRaw || p == sWatch || p == sValue) return true
            else if(!config.has) return Reflect.has(target, p)
            return config.has(target as any, p)
        },
    }))
}

const isClient = typeof window !== 'undefined'
export const watch = <T extends unknown>(
    value: T, 
    handle: (v: T extends Signal.Signal<any> ? T['value'] : T) => void,
    config: { key?: string, flush?: 'sync'|'async', on?: 'client'|'server'|'both', deep?: boolean } = {}
) => {
    let { key = useId(), flush = 'sync', on = 'both', deep = false } = config

    const flagError = (on == 'server' && isClient) || (on == 'client' && !isClient)
    const launch = flush == 'async' 
        ? async (value: any) => handle(value)
        : handle

    let isArray = Array.isArray(value)
    if(isSignal(value) && !flagError) {
        // @ts-ignore
        isArray = Array.isArray(value.value)
        // @ts-ignore
        const unWatch = () => value[sWatch].delete(key)
        // @ts-ignore
        value[sWatch].set(key, (value, path) => {
            if(!deep && path.length != 1) return
            launch(value)
        })
        return unWatch
    }

    const weakRef = fromWeakRef(value)
    if(weakRef.signal == null || flagError) return () => (void 0)

    // @ts-ignore
    const unWatch = () => weakRef.signal[sWatch].delete(key)
    // @ts-ignore
    weakRef.signal[sWatch].set(key, (value, path) => {
        if((path.length - 1) < weakRef.pathIndex || path[weakRef.pathIndex] != weakRef.path) return
        else if(!deep && (path.length - 1) > weakRef.pathIndex) return

        // @ts-ignore
        launch(weakRef.value())
    })

    return unWatch
}

export const isSignal = (data: unknown): boolean => {
    // @ts-ignore
    if(typeof data == 'object' && data && data[sWatch]) return true
    return false
}

export const fromWeakRef = <T extends unknown>(
    data: T, 
    end: boolean = true
): Signal.IWeakRef<T> => {
    if(typeof data == 'undefined')
        return { value: () => data, set: (v: any) => data = v, path: '', pathIndex: 0, signal: null }
    
    if(isSignal(data))
        // @ts-ignore
        return { value: () => data.value, set: (v: any) => data.value = v, path: '$', pathIndex: 0, signal: data }
    // @ts-ignore
    else if(data.hasWeakRef())
        // @ts-ignore
        return data.weakRef(end)
    return { value: () => data, set: (v: any) => data = v, path: '', pathIndex: 0, signal: null }
}

export const useStrongRef = <T extends unknown, K = T>(value: T|Signal.Signal<T, K>, handle: (raw: K, unwatch: () => void) => void) => {
    if(isSignal(value)) {
        // @ts-ignore
        handle(value[sAsRaw], () => void 0)
        // @ts-ignore
        const unwatch = watch(value, () => handle(value[sAsRaw], unwatch), { deep: true, flush: 'sync' })
        return unwatch
    }
    handle(value as any, () => void 0)
    const unwatch = watch(value, (val) => handle(val as any, unwatch), { flush: 'sync' })
    return unwatch
}

export const tryGetRaw =  <T extends unknown, K = T>(value: T|Signal.Signal<T, K>): K => {
    if(isSignal(value)) {
        // @ts-ignore
        return value[sAsRaw]
    }
    return value as K
}