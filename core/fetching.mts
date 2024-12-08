import type { Fetching } from "../type.d.ts";
import { toURLString } from "./helpers.mjs";
import { useSyncSignal } from "./shared.mjs";
import { unSignal, useSignal } from "./stateble.mjs";

export const useFetch: Fetching.HorizonFetchMethod = <T extends unknown>(
    url: Fetching.URL, 
    options = {} as Fetching.RequestInit<T>
) => {
    const cacheControler = options.cacheControl
    const cacheKey       = options.key
    const cacheTimeout   = options.cacheTimeout

    const response = cacheKey 
        ? useSyncSignal<T, T>(options.defaultValue ?? null as T, { key: cacheKey }) 
        : useSignal<T>(options.defaultValue ?? null as T)
    const status   = useSignal(0)
    const error    = useSignal(false)
    const fetching = useSignal(false)

    const startRequest = async () => {
        fetching.value = true
        const type = options.type ?? 'json'

        if(cacheControler && cacheKey) {
            const data = cacheControler.read<T>(unSignal(cacheKey))
            if(data) {
                response.value = data 
                status.value = 0
                fetching.value = false
                error.value = false
                return returnObject
            }
        }

        await fetch(toURLString(url), options)
            .then(async e => {
                error.value = !e.ok
                status.value = e.status

                if(type == 'text') {
                    response.value = await e.text() as T
                    fetching.value = false
                    return response.value
                }

                try {
                    response.value = await e[type]() as T                    
                    fetching.value = false

                    if(cacheControler && cacheKey) {
                        cacheControler.write(unSignal(cacheKey), response.value, cacheTimeout)
                    }

                    return response.value
                }
                catch(_) {
                    console.error(_)
                    error.value = true
                    response.value = await e.text() as T
                    fetching.value = false
                    return response.value
                }
            })

        return returnObject
    }

    const returnObject = {
        response,
        get status() { return status.value },
        get fetching() { return fetching.value },
        get error() { return error.value },
        fetch: startRequest
    }

    const promise: Fetching.PromiseHorizonFetch<T> = new Promise<any>(async resolve => {
        resolve((options.immediate ?? true)
            ? await startRequest()
            : returnObject)
    }) as Fetching.PromiseHorizonFetch<T>

    Object.defineProperty(promise, 'response', { get: () => response })
    Object.defineProperty(promise, 'status', { get: () => status.value })
    Object.defineProperty(promise, 'error', { get: () => error.value })
    Object.defineProperty(promise, 'fetching', { get: () => fetching.value })
    Object.defineProperty(promise, 'fetch', { value: startRequest })

    return promise
}