import { isClient } from "./app.mjs";
import { useStylePrettify } from "./helpers.mjs";
import { useProxySignal, useSignal, watch } from "./stateble.mjs";
export const useStyle = (object) => {
    const signal = useSignal(object, { asRaw: (v) => useStylePrettify(v) });
    if (typeof signal.value == 'object')
        return useProxySignal(signal);
    return signal;
};
export const useColorSheme = (config = {}) => {
    return useSignal(config.get ? (config.get() ?? 'light') : 'light', {
        key: 'client-system-theme',
        onSet(v) { if (config.set)
            config.set(v); },
        onInit(signal) {
            if (isClient) {
                signal.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                window.matchMedia('(prefers-color-scheme: dark)')
                    .addEventListener('change', event => signal.value = event.matches ? 'dark' : 'light');
            }
        },
    });
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
    return useSignal(null, {
        key,
        onInit(signal) {
            watch(signal, (v) => localStorage.setItem(key, JSON.stringify(v)), { deep: true });
            if (isClient)
                signal.value = JSON.parse(localStorage.getItem(key) ?? 'null') ?? defaultValue;
            else
                signal.value = defaultValue;
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
