import { Signal } from "../type"
import { isClient } from "./app.mjs"
import { useSubscribe } from "./composables.mjs"
import { useBusId } from "./helpers.mjs"
import { useSignal, watch } from "./stateble.mjs"

const onSync = useSubscribe()

const sharedStructure = {
    sync: false, 
    data: new Map<string|number, any>(),
    static: new Map<string, any>()
}

export const onSharedData = <T extends unknown>(key: string|number, handle: (value: T) => void): void => {
    const tryLaunch = () => {
        let data = useSharedData(key)
        if(data != null) handle(data)
    }

    if(!isClient)
        return tryLaunch()

    if(!sharedStructure.sync)
        return (onSync.on(() => tryLaunch()), void 0)

    tryLaunch()
}

export const useSharedData = <T extends unknown>(key: string|number, $default: T = null as T) => {
    return sharedStructure.data.get(key) ?? $default
}

export const useSyncSignal = <T extends unknown, K extends any>(
    value: T, 
    config: Signal.SignalConfig<T, K> = {}
) => {
    const key = config.key ?? useBusId()
    return useSignal(value, {
        ...config,
        onInit(signal) {
            if(isClient) 
                return onSharedData<T>(key, v => signal.value = v)

            watch(signal, () => {
                sharedStructure.data.set(key, signal.value)
            })
        },
    })
}