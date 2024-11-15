import { Composable, CSS, Signal } from "../type"
import { isClient } from "./app.mjs"
import { useStylePrettify } from "./helpers.mjs"
import { useProxySignal, useSignal, watch } from "./stateble.mjs"

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
        config.get ? (config.get() ?? 'light') : 'light', {
            key: 'client-system-theme',
            onSet(v) { if(config.set) config.set(v) },
            onInit(signal) {
                if(isClient) {
                    signal.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
                    window.matchMedia('(prefers-color-scheme: dark)')
                        .addEventListener('change', event => signal.value = event.matches ? 'dark' : 'light')
                }
            },
        })
}

interface ProcessConfig {

}

export const useProcess = (
    handle: Function, 
    config: ProcessConfig
) => {

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
            watch(signal, (v) => localStorage.setItem(key, JSON.stringify(v)), { deep: true })      

            if(isClient)
                signal.value = JSON.parse(localStorage.getItem(key) ?? 'null') ?? defaultValue
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