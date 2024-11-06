import { Composable } from "../type"
import { isClient } from "./app.mjs"
import { useStylePrettify } from "./helpers.mjs"
import { ISignal, useProxySignal, useSignal } from "./stateble.mjs"

type StyleSignal = CSSStyleDeclaration
type StyleStringSignal = ISignal<string, string>

export const useStyle = <T extends CSSStyleDeclaration|{}|string>(object: T): T extends string ? StyleStringSignal : StyleSignal => {
    const signal = useSignal(object, 
        { asRaw: (v) => useStylePrettify(v) }
    )
    
    if(typeof signal.value == 'object')
        // @ts-ignore
        return useProxySignal(signal)
    // @ts-ignore
    return signal
}

export const useColorSheme = (config: { get?: () => Composable.ColorSheme, set?: (v: Composable.ColorSheme) => void } = {}) => {
    const signal = useSignal<Composable.ColorSheme>(
        config.get ? (config.get() ?? 'light') : 'light',
        { key: 'client-system-theme' }
    )

    const updateTheme = (value: boolean) => {
        signal.value = value ? "dark" : "light"
        if(config.set) config.set(value ? "dark" : "light")
    }

    if(isClient) {
        updateTheme(window.matchMedia('(prefers-color-scheme: dark)').matches)
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => updateTheme(event.matches))
    }

    return signal
}

export const useDocumentBody = (handle?: (dom: HTMLBodyElement) => void) => {
    if(!isClient)
        return null
    return handle ? handle(document.body as HTMLBodyElement) : document.body
}