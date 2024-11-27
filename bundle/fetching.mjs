import { isClient } from "./app.mjs";
import { toURLMeta, toURLString } from "./helpers.mjs";
import { tryGetRaw, useSignal } from "./stateble.mjs";
export const useFetch = (url, options = {}) => {
    const fetching = useSignal(false);
    const error = useSignal(false);
    const status = useSignal(200);
    const response = useSignal(options.defaultValue ?? null);
    let rawData;
    const restart = async () => {
        if (options.cacheControl) {
            if (!options.cacheKey)
                throw new Error('Cache key not sets useFetch()');
            const cache = options.cacheControl.read(tryGetRaw(options.cacheKey));
            if (cache) {
                response.value = cache;
                return cache;
            }
        }
        fetching.value = true;
        response.value = options.defaultValue ?? null;
        rawData = fetch(toURLString(url), options)
            .then(async (e) => {
            error.value = !e.ok;
            status.value = e.status;
            if (error.value) {
                return e.text();
            }
            return e[options.type ?? 'text']();
        })
            .then(e => {
            fetching.value = false;
            response.value = e;
            if (options.cacheControl && !error.value) {
                if (!options.cacheKey)
                    throw new Error('Cache key not sets useFetch()');
                options.cacheControl.write(tryGetRaw(options.cacheKey), e);
            }
            return e;
        });
        return rawData;
    };
    if (options.immediate ?? true)
        restart();
    return {
        error,
        status,
        rawData,
        response,
        fetching,
        restart
    };
};
const symLinkCacheControl = Symbol();
export const useCacheControl = (config = {}) => {
    const caches = new Map();
    let valid = true;
    if (config.on) {
        if (config.on == 'client')
            valid = isClient;
        else if (config.on == 'server')
            valid = !isClient;
    }
    return {
        [symLinkCacheControl]: true,
        write(key, data) {
            if (valid)
                caches.set(key, data);
        },
        read(key) {
            return caches.get(key);
        },
        forget(key) {
            return caches.delete(key);
        },
        forgetAll(startsWith) {
            if (!startsWith)
                return caches.clear();
            caches.forEach((_, key) => {
                if (key.startsWith(startsWith))
                    caches.delete(key);
            });
        },
    };
};
export const useRecord = (url) => {
    const urlMeta = toURLMeta(url);
};
