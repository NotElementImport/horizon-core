import { isClient } from "./app.mjs";
import { toDelay, useStylePrettify } from "./helpers.mjs";
import { useStack } from "./stack.mjs";
import { useProxySignal, useSignal, watch } from "./stateble.mjs";
export const useStyle = (object) => {
    const signal = useSignal(object, { asRaw: (v) => useStylePrettify(v) });
    if (typeof signal.value == 'object')
        return useProxySignal(signal);
    return signal;
};
export const useColorSheme = (config = {}) => {
    return useSignal(config.get ? (config.get() ?? null) : null, {
        key: 'client-system-theme',
        onSet(v) { if (config.set)
            config.set(v); },
        onInit(signal) {
            if (isClient && (signal.value == 'null')) {
                signal.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                window.matchMedia('(prefers-color-scheme: dark)')
                    .addEventListener('change', event => signal.value = event.matches ? 'dark' : 'light');
            }
        },
    });
};
export const useProcess = (handle, config = {}) => {
    const launchProcess = async (resolve) => {
        periodAt != null
            ? (intervalProcces = setInterval(async () => { await handle(task.abort); }, periodAt))
            : (await handle(resolve), resolve());
    };
    let processAt = config.at ?? null;
    let periodAt = config.period ?? null;
    let timeoutProcces = null;
    let intervalProcces = null;
    let outerResolve = null;
    if (processAt != null && typeof processAt == 'string')
        processAt = toDelay(processAt);
    if (periodAt != null && typeof periodAt == 'string')
        periodAt = toDelay(periodAt);
    const task = new Promise(async (resolve) => {
        outerResolve = resolve;
        if (processAt == null)
            return await launchProcess(resolve);
        timeoutProcces = setTimeout(async () => await launchProcess(resolve), processAt);
    });
    task.abort = () => {
        if (timeoutProcces)
            clearTimeout(timeoutProcces);
        if (intervalProcces)
            clearInterval(intervalProcces);
        outerResolve();
    };
    return task;
};
export const useParallel = async (threads) => {
    const task = useStack();
    let output = {};
    task.fill(Object.entries(threads).map(thread => {
        return async () => output[thread[0]] = await thread[1]();
    }));
    return (await task.spread(), Array.isArray(threads) ? Array.from(output) : output);
};
export const useScrollLock = () => {
    return useSignal(false, {
        key: 'client-system-scroll-lock',
        onSet(v) {
            useDocumentBody(body => {
                body.style.overflow = v ? 'hidden' : 'unset';
            });
        }
    });
};
export const useLocalStorage = (key, { defaultValue = null } = {}) => {
    return useSignal(defaultValue, {
        key,
        onInit(signal) {
            watch(signal, (v) => localStorage.setItem(key, JSON.stringify(v)), { deep: true });
            if (isClient)
                signal.value = JSON.parse(localStorage.getItem(key) ?? 'null') ?? defaultValue;
        }
    });
};
export const useDocumentHtml = (handle) => {
    if (!isClient)
        return void 0;
    handle(document.body.parentElement);
};
export const useDocumentBody = (handle) => {
    if (!isClient)
        return null;
    handle(document.body);
};
