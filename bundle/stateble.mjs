import { useId } from "./helpers.mjs";
import { currentApp } from "./app.mjs";
const weakMap = new Map();
if (!Object.asWeakRef) {
    Object.prototype.asWeakRef = function (data) {
        weakMap.set(this, data);
        return this;
    };
    Object.prototype.weakRef = function (end) {
        const data = weakMap.get(this);
        if (end)
            weakMap.delete(this);
        return data;
    };
    Object.prototype.hasWeakRef = function () {
        return weakMap.has(this);
    };
}
let signalListener = [];
let isSignalListener = false;
const sharedSignals = new Map();
const sWatch = Symbol();
const sValue = Symbol();
const sAsRaw = Symbol();
const fakeNull = "null";
export const clearSignalHeap = () => {
    sharedSignals.clear();
    weakMap.clear();
    signalListener = [];
};
export const signalMemoryMap = () => {
    const sharedObject = Object.fromEntries(sharedSignals.entries());
    const weakMapObject = [];
    weakMap.forEach((_, key) => {
        const info = fromWeakRef(key, false);
        weakMapObject.push({ value: key, signal: info.signal, path: info.path });
    });
    if (!currentApp.isDev) {
        return {};
    }
    return {
        isSearchingSignals: isSignalListener,
        findedSignals: signalListener,
        shared: Object.fromEntries(Object.entries(sharedObject).map(([key, signal]) => [key, { value: signal.value, signal: signal }])),
        weak: weakMapObject,
    };
};
export const useSignal = (value, config = {
    onSet: (v) => { },
}) => {
    if (config.key && sharedSignals.has(config.key)) {
        return sharedSignals.get(config.key);
    }
    let parentSetter = (v) => { };
    let safeMode = true;
    const signal = {
        toString() {
            return signal.asRaw;
        },
        [sWatch]: new Map(),
        get [sValue]() {
            return signal.value;
        },
        get [sAsRaw]() {
            if (isSignalListener) {
                signalListener.push(signal.value);
            }
            return config.asRaw ? config.asRaw(value) : value;
        },
        get asRaw() {
            safeMode = true;
            return signal[sAsRaw];
        },
        get _rawValue() {
            safeMode = false;
            return value;
        },
        get unsafe() {
            safeMode = false;
            return (value ?? null) != null
                ? value.asWeakRef({
                    value: () => value,
                    set: (v) => signal.value = v,
                    path: "$",
                    pathIndex: 0,
                    signal,
                })
                : null;
        },
        get value() {
            safeMode = true;
            const rawValue = (value ?? fakeNull).asWeakRef({
                value: () => value,
                set: (v) => signal.value = v,
                path: "$",
                pathIndex: 0,
                signal,
            });
            if (isSignalListener) {
                signalListener.push(rawValue);
            }
            return rawValue;
        },
        set value(v) {
            value = useProxy(v, ["$"]);
            parentSetter(v);
            useEffect(value, ["$"]);
            config.onSet?.(v);
        },
    };
    if ((value ?? null) != null && value.hasWeakRef()) {
        const { set } = fromWeakRef(value, false);
        parentSetter = set;
        watch(value, (v) => {
            value = v;
        }, { deep: true });
    }
    else if (isSignal(value)) {
        const parentSignal = value;
        watch(parentSignal, (_) => {
            value = parentSignal.value;
        }, { deep: true });
        value = parentSignal.unsafe;
        parentSetter = (v) => parentSignal.value = v;
    }
    const useProxy = (raw, path) => {
        if (typeof raw != "object" || raw == null || (raw.composable)) {
            return raw;
        }
        Object.entries(raw).forEach(([key, value]) => {
            raw[key] = useProxy(value, [...path, key]);
        });
        const proxy = new Proxy(raw, {
            get(target, p) {
                if (p == "toString") {
                    return () => JSON.stringify(raw);
                }
                if (p in target) {
                    const rawValue = target[p] ?? (safeMode ? "null" : null);
                    return rawValue != null
                        ? rawValue.asWeakRef({
                            value: () => target[p],
                            set: (v) => proxy[p] = v,
                            path: p,
                            pathIndex: path.length,
                            signal,
                        })
                        : rawValue;
                }
                return undefined;
            },
            set(target, p, newValue, receiver) {
                const $path = Array.isArray(target) && p == "length"
                    ? path
                    : [...path, p];
                const result = Reflect.set(target, p, useProxy(newValue, $path), receiver);
                useEffect(value, $path);
                return result;
            },
        });
        return proxy;
    };
    const useEffect = (value, path) => {
        signal[sWatch].forEach((callback) => {
            callback(value, path);
        });
    };
    value = useProxy(value, ["$"]);
    if (config.onInit)
        config.onInit(signal);
    if (config.key) {
        sharedSignals.set(config.key, signal);
    }
    if (config.devExpose && (currentApp?.isDev ?? false)) {
        globalThis[config.devExpose] = signal;
    }
    return signal;
};
export const useComputed = (handle) => {
    return useSignal(null, {
        onInit(signal) {
            isSignalListener = true;
            signalListener = [];
            signal.value = handle(unSignal);
            for (const item of signalListener) {
                watch(item, () => signal.value = handle(unSignal));
            }
            isSignalListener = false;
            signalListener = [];
        },
    });
};
export const useLazyComputed = (models, handle) => {
    return useSignal(null, {
        onInit(signal) {
            for (const item of models) {
                watch(item, () => signal.value = handle(unSignal));
            }
            signal.value = handle(unSignal);
        },
    });
};
export const useProxySignal = (signal, config = {}) => {
    return (new Proxy(signal.value, {
        set(target, p, newValue, receiver) {
            if (p == sWatch)
                return (signal[sWatch] = newValue, true);
            else if (!config.set)
                return Reflect.set(target, p, newValue, receiver);
            return config.set(target, p, newValue) ?? true;
        },
        get(target, p, receiver) {
            if (p == sWatch ||
                p == sAsRaw ||
                p == sValue)
                return Reflect.get(signal, p, receiver);
            else if (!config.get)
                return Reflect.get(target, p, receiver);
            return config.get(target, p) ?? null;
        },
        has(target, p) {
            if (p == sAsRaw || p == sWatch || p == sValue)
                return true;
            else if (!config.has)
                return Reflect.has(target, p);
            return config.has(target, p);
        },
    }));
};
const isClient = typeof window !== "undefined";
export const watch = (value, handle, config = {}) => {
    let { key = useId(), flush = "sync", on = "both", deep = false } = config;
    const flagError = (on == "server" && isClient) ||
        (on == "client" && !isClient);
    const launch = flush == "async"
        ? async (value) => handle(value)
        : handle;
    if (isSignal(value) && !flagError) {
        const unWatch = () => value[sWatch].delete(key);
        value[sWatch].set(key, (value, path) => {
            if (!deep && path.length != 1)
                return;
            launch(value);
        });
        return unWatch;
    }
    const weakRef = fromWeakRef(value);
    if (weakRef.signal == null || flagError)
        return () => (void 0);
    const unWatch = () => weakRef.signal[sWatch].delete(key);
    weakRef.signal[sWatch].set(key, (value, path) => {
        if ((path.length - 1) < weakRef.pathIndex ||
            path[weakRef.pathIndex] != weakRef.path)
            return;
        else if (!deep && (path.length - 1) > weakRef.pathIndex)
            return;
        launch(weakRef.value());
    });
    return unWatch;
};
export const isSignal = (data) => {
    if (typeof data == "object" && data && data[sWatch])
        return true;
    return false;
};
export const fromWeakRef = (data, end = true) => {
    if (typeof data == "undefined") {
        return {
            value: () => data,
            set: (v) => data = v,
            path: "",
            pathIndex: 0,
            signal: null,
        };
    }
    if (isSignal(data)) {
        return {
            value: () => data._rawValue,
            set: (v) => data.value = v,
            path: "$",
            pathIndex: 0,
            signal: data,
        };
    }
    else if (data != null && data.hasWeakRef()) {
        return data.weakRef(end);
    }
    return {
        value: () => data,
        set: (v) => data = v,
        path: "",
        pathIndex: 0,
        signal: null,
    };
};
export const useStrongRef = (value, handle, forceDeep = false) => {
    if (isSignal(value)) {
        handle(value[sAsRaw], () => void 0);
        const unwatch = watch(value, () => handle(value[sAsRaw], unwatch), {
            deep: true,
            flush: "sync",
        });
        return unwatch;
    }
    handle(value, () => void 0);
    const unwatch = watch(value, (val) => handle(val, unwatch), {
        flush: "sync",
        deep: forceDeep,
    });
    return unwatch;
};
export const unSignal = (value) => {
    if (typeof value == "function") {
        value = value();
    }
    if (isSignal(value)) {
        return value[sAsRaw];
    }
    return value;
};
