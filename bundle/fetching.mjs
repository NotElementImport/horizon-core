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
export const useRecord = (url) => {
    const urlMeta = toURLMeta(url);
};
