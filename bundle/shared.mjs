import { isClient } from "./app.mjs";
import { useSubscribe } from "./composables.mjs";
import { useBusId } from "./helpers.mjs";
import { useSignal, watch } from "./stateble.mjs";
const onSync = useSubscribe();
const sharedStructure = {
    sync: false,
    data: new Map(),
    static: new Map()
};
export const onSharedData = (key, handle) => {
    const tryLaunch = () => {
        let data = useSharedData(key);
        if (data != null)
            handle(data);
    };
    if (!isClient)
        return tryLaunch();
    if (!sharedStructure.sync)
        return (onSync.on(() => tryLaunch()), void 0);
    tryLaunch();
};
export const useSharedData = (key, $default = null) => {
    return sharedStructure.data.get(key) ?? $default;
};
export const useSyncSignal = (value, config = {}) => {
    const key = config.key ?? useBusId();
    return useSignal(value, {
        ...config,
        onInit(signal) {
            if (isClient)
                return onSharedData(key, v => signal.value = v);
            watch(signal, () => {
                sharedStructure.data.set(key, signal.value);
            });
        },
    });
};
