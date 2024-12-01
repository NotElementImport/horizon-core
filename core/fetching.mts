import type { Fetching } from "../type.d.ts";
import { toURLMeta, toURLString } from "./helpers.mjs";
import { tryGetRaw, useSignal } from "./stateble.mjs";

export const useFetch = <T extends unknown>(
    url: Fetching.URL, 
    options: Fetching.RequestInit<T> = {} as Fetching.RequestInit<T>
): Fetching.HorizonFetch<T> => {
    const fetching = useSignal(false)
    const error    = useSignal(false)
    const status   = useSignal(200)
    const response = useSignal<T|null>(options.defaultValue ?? null)
    let   rawData: Promise<T>

    const restart = async () => {
        if(options.cacheControl) {
            if(!options.cacheKey) throw new Error('Cache key not sets useFetch()')
            const cache = options.cacheControl.read(tryGetRaw(options.cacheKey)) as T
            if(cache) {
                response.value = cache
                return cache
            }
        }

        fetching.value = true
        response.value = options.defaultValue ?? null
        rawData = fetch(toURLString(url), options)
            .then(async e => {
                error.value  = !e.ok
                status.value = e.status

                if(error.value) {
                    return e.text()
                }

                return e[options.type ?? 'text']()
            })
            .then(e => {
                fetching.value = false
                response.value = e
            
                if(options.cacheControl && !error.value) {
                    if(!options.cacheKey) throw new Error('Cache key not sets useFetch()')
                    options.cacheControl.write(tryGetRaw(options.cacheKey), e)
                }

                return e as T
            })
        return rawData
    }

    if(options.immediate ?? true)
        restart()

    return {
        error,
        status,
        // @ts-ignore
        rawData,
        response,
        fetching,
        restart
    }
}

export const useRecord = (url: Fetching.URL) => {
    const urlMeta = toURLMeta(url)
}