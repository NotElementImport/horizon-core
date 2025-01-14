import { isClient } from "./app.mjs";
import { toDelay, useId, useStylePrettify } from "./helpers.mjs";
import { useStack } from "./stack.mjs";
import { unSignal, useProxySignal, useSignal, watch } from "./stateble.mjs";
export const useStyle = (object) => {
    const signal = useSignal(object, { asRaw: (v) => useStylePrettify(v) });
    if (typeof signal.value == "object") {
        return useProxySignal(signal);
    }
    return signal;
};
export const useColorSheme = (config = {}) => {
    return useSignal(config.get ? (config.get() ?? null) : null, {
        key: "client-system-theme",
        onSet(v) {
            if (config.set)
                config.set(v);
        },
        onInit(signal) {
            if (isClient && (signal.value == "null")) {
                signal.value =
                    window.matchMedia("(prefers-color-scheme: dark)").matches
                        ? "dark"
                        : "light";
                window.matchMedia("(prefers-color-scheme: dark)")
                    .addEventListener("change", (event) => signal.value = event.matches ? "dark" : "light");
            }
        },
    });
};
export const useDebounceCallback = (watching, delayMs, callback) => {
    let debounceTimer = -1;
    const runCallback = () => {
        if (debounceTimer != -1) {
            clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => callback(), delayMs);
    };
    for (const object of watching) {
        watch(object, () => {
            runCallback();
        }, { deep: true });
    }
};
export const useRandomInt = (a, b) => {
    const min = b != null ? a : 0;
    const max = b != null ? b - a : a;
    return Math.floor(min + Math.random() * max);
};
export const useRandomFloat = (a, b) => {
    a = a ?? 1;
    const min = b != null ? a : 0;
    const max = b != null ? b - a : a;
    return min + Math.random() * max;
};
export const useRandomString = (len = 10) => {
    return useId(len);
};
export const useTransport = (signalA, signalB) => {
    const removeItem = (index, item) => {
        delete item[index];
    };
    return {
        move(index) {
            for (const [key] of Object.entries(signalA.value)) {
                if (index == key) {
                    signalB.value[index] = signalA.value[index];
                    removeItem(index, signalA.value);
                    return true;
                }
            }
            for (const [key] of Object.entries(signalB.value)) {
                if (index == key) {
                    signalA.value[index] = signalB.value[index];
                    removeItem(index, signalB.value);
                    return true;
                }
            }
            return false;
        },
        add(index) {
            for (const [key] of Object.entries(signalA.value)) {
                if (index == key) {
                    signalB.value[index] = signalA.value[index];
                    removeItem(index, signalA.value);
                    return true;
                }
            }
            return false;
        },
        sub(index) {
            for (const [key] of Object.entries(signalB.value)) {
                if (index == key) {
                    signalA.value[index] = signalB.value[index];
                    removeItem(index, signalB.value);
                    return true;
                }
            }
            return false;
        },
        toObject(config = {}) {
            const aItemName = config.aName ?? "a";
            const bItemName = config.bName ?? "b";
            const item = {
                [aItemName]: {},
                [bItemName]: {},
            };
            for (const [key, value] of Object.entries(signalA.value)) {
                item[aItemName][key] = value;
            }
            for (const [key, value] of Object.entries(signalB.value)) {
                item[bItemName][key] = value;
            }
            return item;
        },
    };
};
export const useProcess = (handle, config = {}) => {
    let periodTimeout = null;
    let launchTimeout = null;
    let taskResolve;
    const startProcess = async () => {
        if (!config.period) {
            return (await handle(taskResolve), taskResolve());
        }
        const getPeriod = () => typeof config.period == "string"
            ? toDelay(config.period ?? "1 sec")
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
        launchTimeout = setTimeout(() => startProcess(), typeof processAt == "string" ? toDelay(processAt ?? "1 sec") : processAt);
    });
    task.abort = () => {
        if (launchTimeout) {
            clearTimeout(launchTimeout);
        }
        if (periodTimeout) {
            clearTimeout(periodTimeout);
        }
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
    return (await task.spread(),
        Array.isArray(threads) ? Object.values(output) : output);
};
export const useNormalizer = (data, config = {}) => {
    const process = () => {
        let rawData = unSignal(data);
        const output = [];
        let maxValue = -Infinity;
        let minValue = Infinity;
        rawData.map((item) => {
            if (item < minValue)
                minValue = item;
            if (item > maxValue)
                maxValue = item;
        });
        if (!config.chart) {
            maxValue -= minValue;
        }
        maxValue = 1 / (maxValue == 0 ? 1 : maxValue);
        const chartMultiple = 1 / (rawData.length == 0 ? 1 : rawData.length);
        rawData = config.chart ? rawData.sort((a, b) => a - b) : rawData;
        rawData.map((item, index) => {
            if (!config.chart) {
                return output.push({
                    value: (item - minValue) * maxValue,
                    raw: item,
                });
            }
            output.push({
                value: item * maxValue * chartMultiple * (index + 1),
                raw: item,
            });
        });
        return config.chart ? output.reverse() : output;
    };
    return useSignal([], {
        onInit(signal) {
            watch(data, () => signal.value = process());
            signal.value = process();
        },
        asRaw(v) {
            return v.map((v) => v.value);
        },
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
        off(key) {
            return subs.delete(key);
        },
        broadcast(v) {
            subs.forEach((callback) => callback(v));
        },
        clear() {
            subs.clear();
        },
    };
};
export const useEventMap = () => {
    const events = new Map();
    return {
        on(eventKey, handle, key) {
            let event = events.get(eventKey) ??
                null;
            if (event == null) {
                event = new Map();
                events.set(eventKey, event);
            }
            key = key ?? useId();
            event.set(key, handle);
            return () => event.delete(key);
        },
        off(eventKey, key) {
            const event = events.get(eventKey) ?? null;
            if (event == null)
                return false;
            return event.delete(key);
        },
        broadcast(eventKey, v) {
            const event = events.get(eventKey) ?? null;
            if (event == null)
                return;
            event.forEach((callback) => {
                callback(v);
            });
        },
        clear(eventKey) {
            if (!eventKey)
                return (events.clear(), void 0);
            const event = events.get(eventKey) ?? null;
            if (event != null)
                event.clear();
        },
    };
};
export const useScrollLock = () => {
    return useSignal(false, {
        key: "client-system-scroll-lock",
        onSet(v) {
            useDocumentBody((body) => {
                body.style.overflow = v ? "hidden" : "unset";
            });
        },
    });
};
export const useLocalStorage = (key, { defaultValue = null } = {}) => {
    return useSignal(defaultValue, {
        key,
        onInit(signal) {
            if (isClient) {
                watch(signal, (v) => localStorage.setItem(key, JSON.stringify(v)), {
                    deep: true,
                });
                signal.value = JSON.parse(localStorage.getItem(key) ?? "null") ??
                    defaultValue;
            }
        },
    });
};
export const useDocumentHtml = (handle) => {
    if (!isClient) {
        return void 0;
    }
    handle(document.body.parentElement);
};
export const useDocumentBody = (handle) => {
    if (!isClient) {
        return null;
    }
    handle(document.body);
};
export const useGetDOM = (selector, onFound) => {
    if (!isClient) {
        return null;
    }
    const dom = document.body.querySelector(selector);
    if (dom)
        onFound(dom);
};
