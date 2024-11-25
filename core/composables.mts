import { Composable, CSS, Props, Signal } from "../type"
import { isClient } from "./app.mjs"
import { toDelay, useId, useStylePrettify } from "./helpers.mjs"
import { useStack } from "./stack.mjs"
import { tryGetRaw, useProxySignal, useSignal, watch } from "./stateble.mjs"

type StyleSignal = CSS.Style
type StyleStringSignal = Signal.Signal<string, string>

export const useStyle = <T extends CSS.Style|string>(object: T): T extends string ? StyleStringSignal : StyleSignal => {
    const signal = useSignal(object, 
        { asRaw: (v) => useStylePrettify(v) }
    )
    
    if(typeof signal.value == 'object')
        return useProxySignal(signal) as (T extends string ? StyleStringSignal : StyleSignal)
    return signal as unknown as (T extends string ? StyleStringSignal : StyleSignal)
}

export const useColorSheme = (config: { get?: () => Composable.ColorSheme, set?: (v: Composable.ColorSheme) => void } = {}) => {
    return useSignal<Composable.ColorSheme>(
        config.get ? (config.get() ?? null) : null as any, {
            key: 'client-system-theme',
            onSet(v) { if(config.set) config.set(v) },
            onInit(signal) {
                if(isClient && (signal.value == 'null' as any)) {
                    signal.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
                    window.matchMedia('(prefers-color-scheme: dark)')
                        .addEventListener('change', event => signal.value = event.matches ? 'dark' : 'light')
                }
            },
        })
}

interface ProcessConfig {
    at?: string|number,
    period?: number|string
}

interface Process<T> extends Promise<T> {
    abort: () => void
}

export const useProcess = (
    handle: (abort: () => void) => unknown, 
    config: ProcessConfig = {}
) => {
    let periodTimeout: number|null = null
    let launchTimeout: number|null = null
    let taskResolve: Function

    const startProcess = async () => {
        if(!config.period)
            return (await handle(taskResolve as any), taskResolve())

        const getPeriod = () => typeof config.period == 'string'
            ? toDelay(config.period ?? '1 sec')
            : config.period
        
        const startPeriod = () => 
            periodTimeout = setTimeout(async () => {
                await handle(task.abort)
                startPeriod()    
            }, getPeriod())
        startPeriod()
    }

    let processAt = config.at ?? 0

    const task: Process<void> = new Promise<void>(async (resolve) => {
        taskResolve = resolve
        
        launchTimeout = setTimeout(
            () => startProcess(),
            typeof processAt == 'string'
                ? toDelay(processAt ?? '1 sec')
                : processAt
        )
    }) as any

    task.abort = () => {
        if(launchTimeout)
            clearTimeout(launchTimeout)
        if(periodTimeout)
            clearTimeout(periodTimeout)
        taskResolve()
    }

    return task
}

export const useParallel = async (threads: object|Function[]) => {
    const task = useStack()
    let output = {} as Record<any, unknown>
    task.fill(Object.entries(threads).map(([ index, task ]) => {
        return async () => output[index] = await task()
    }))
    return (await task.spread(), Array.isArray(threads) ? Object.values(output) : output)
}

export const useNormalizer = (
    data: Props.OrSignal<number[]>,
    config: { chart?: boolean } = {}
) => {
    const process = () => {
        let rawData = tryGetRaw<number[]>(data)
        const output = [] as { value: number, raw: number }[]
        let   maxValue = -Infinity
        let   minValue = Infinity

        rawData.map((item) => {
            if (item < minValue) minValue = item
            if (item > maxValue) maxValue = item
        })

        if(!config.chart)
            maxValue -= minValue
        maxValue = (1 / (maxValue == 0 ? 1 : maxValue))

        const chartMultiple = (1 / (rawData.length == 0 ? 1 : rawData.length))

        rawData = config.chart ? rawData.sort((a, b) => a - b) : rawData;

        rawData.map((item, index) => {
            if(!config.chart)
                return output.push({
                    value: (item - minValue) * maxValue,
                    raw: item
                })

            output.push({
                value: item * maxValue * chartMultiple * (index + 1),
                raw: item
            })
        })

        return config.chart ? output.reverse() : output;
    }

    return useSignal<{ value: number, raw: number }[], number[]>([], {
        onInit(signal) {
            watch(data, () => signal.value = process())
            signal.value = process()
        },
        asRaw(v) {
            return v.map(v => v.value)
        }
    })
}

interface Subscribe<T> {
    on(handle: (v: T) => void, key?: string): (() => boolean)
    off(key: string): boolean
    broadcast(v: T): void
    clear(): void
}

export const useSubscribe = <T extends unknown>() => {
    const subs = new Map<string, Function>()
    return {
        on(handle, key) {
            const id = key ?? useId()
            subs.set(id, handle)
            return () => subs.delete(id)
        },
        off(key) { return subs.delete(key) },
        broadcast(v) { subs.forEach(callback => callback(v)) },
        clear() { subs.clear() }
    } as Subscribe<T>
}

interface EventMap<T extends Record<PropertyKey, unknown>> {
    on<K extends keyof T>(eventKey: K, handle: (v: T[K]) => void, key?: string): (() => boolean)
    off(eventKey: keyof T, key: string): boolean
    broadcast<K extends keyof T>(eventKey: K, v: T[K]): void
    clear(eventKey?: keyof T): void
}

export const useEventMap = <T extends Record<PropertyKey, unknown>>() => {
    const events = new Map<keyof T, Map<PropertyKey, Function>>()

    return {
        on(eventKey, handle, key) {
            let event: Map<PropertyKey, Function>|null = events.get(eventKey) ?? null

            if(event == null) {
                event = new Map<PropertyKey, Function>()
                events.set(eventKey, event)
            }

            key = key ?? useId()
            event.set(key, handle)

            return () => event.delete(key)
        },
        off(eventKey, key) {
            const event = events.get(eventKey) ?? null

            if(event == null) return false

            return event.delete(key)
        },
        broadcast(eventKey, v) {
            const event = events.get(eventKey) ?? null

            if(event == null) return

            event.forEach(callback => {
                callback(v)
            })
        },
        clear(eventKey) {
            if(!eventKey) return (events.clear(), void 0)
            const event = events.get(eventKey) ?? null
            if(event != null) event.clear()
        }
    } as EventMap<T>
}

export const useScrollLock = () => {
    return useSignal(false, {
        key: 'client-system-scroll-lock',
        onSet(v) {useDocumentBody(body => {
            body.style.overflow = v ? 'hidden' : 'unset' 
        })}
    })
}

export const useLocalStorage = <T extends any>(
    key: string, 
    { defaultValue = null as T }
    : { defaultValue?: T } = {}
) => {
    return useSignal<T>(defaultValue, {
        key,
        onInit(signal) {
            if(isClient) {
                watch(signal, (v) => localStorage.setItem(key, JSON.stringify(v)), { deep: true })      
                signal.value = JSON.parse(localStorage.getItem(key) ?? 'null') ?? defaultValue
            }
        }
    })
}

export const useDocumentHtml = (handle: (dom: HTMLHtmlElement) => void) => {
    if(!isClient)
        return void 0
    handle(document.body.parentElement as HTMLHtmlElement)
}

export const useDocumentBody = (handle: (dom: HTMLBodyElement) => void) => {
    if(!isClient)
        return null
    handle(document.body as HTMLBodyElement)
}

export const useGetDOM = <T extends HTMLElement>(selector: string, onFound: (dom: T) => void) => {
    if(!isClient)
        return null
    const dom = document.body.querySelector(selector)
    if(dom) onFound(dom as T)
}