import { isClient } from "./app.mjs";
import { toDelay, useId, useStylePrettify } from "./helpers.mjs";
import { useStack } from "./stack.mjs";
import { tryGetRaw, useProxySignal, useSignal, watch } from "./stateble.mjs";
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
    let periodTimeout = null;
    let launchTimeout = null;
    let taskResolve;
    const startProcess = async () => {
        if (!config.period)
            return (await handle(taskResolve), taskResolve());
        const getPeriod = () => typeof config.period == 'string'
            ? toDelay(config.period ?? '1 sec')
            : config.period;
        const startPeriod = () => periodTimeout = setTimeout(async () => {
            await handle(task.abort);
            startPeriod();
        }, getPeriod());
        startPeriod();
    };
    let processAt = config.at ?? 0;
    const task = new Promise(async (resolve) => {
        taskResolve = resolve;
        launchTimeout = setTimeout(() => startProcess(), typeof processAt == 'string'
            ? toDelay(processAt ?? '1 sec')
            : processAt);
    });
    task.abort = () => {
        if (launchTimeout)
            clearTimeout(launchTimeout);
        if (periodTimeout)
            clearTimeout(periodTimeout);
        taskResolve();
    };
    return task;
};
export const useParallel = async (threads) => {
    const task = useStack();
    let output = {};
    task.fill(Object.entries(threads).map(([index, task]) => {
        return async () => output[index] = await task();
    }));
    return (await task.spread(), Array.isArray(threads) ? Object.values(output) : output);
};
export const useNormalizer = (data, config = {}) => {
    const process = () => {
        let rawData = tryGetRaw(data);
        const output = [];
        let maxValue = -Infinity;
        let minValue = Infinity;
        rawData.map((item) => {
            if (item < minValue)
                minValue = item;
            if (item > maxValue)
                maxValue = item;
        });
        if (!config.chart)
            maxValue -= minValue;
        maxValue = (1 / (maxValue == 0 ? 1 : maxValue));
        const chartMultiple = (1 / (rawData.length == 0 ? 1 : rawData.length));
        rawData = config.chart ? rawData.sort((a, b) => a - b) : rawData;
        rawData.map((item, index) => {
            if (!config.chart)
                return output.push({
                    value: (item - minValue) * maxValue,
                    raw: item
                });
            output.push({
                value: item * maxValue * chartMultiple * (index + 1),
                raw: item
            });
        });
        return config.chart ? output.reverse() : output;
    };
    return useSignal([], {
        bus: config.bus,
        onInit(signal) {
            watch(data, () => signal.value = process());
            signal.value = process();
        },
        asRaw(v) {
            return v.map(v => v.value);
        }
    });
};
export const useSubscribe = () => {
    const subs = new Map();
    return {
        on(handle, key) {
            const id = key ?? useId();
            subs.set(id, handle);
            return () => subs.delete(id);
        },
        off(key) { return subs.delete(key); },
        emit(v) { subs.forEach(callback => callback(v)); },
        clear() { subs.clear(); }
    };
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
            if (isClient) {
                watch(signal, (v) => localStorage.setItem(key, JSON.stringify(v)), { deep: true });
                signal.value = JSON.parse(localStorage.getItem(key) ?? 'null') ?? defaultValue;
            }
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
export const useGetDOM = (selector, onFound) => {
    if (!isClient)
        return null;
    const dom = document.body.querySelector(selector);
    if (dom)
        onFound(dom);
};
