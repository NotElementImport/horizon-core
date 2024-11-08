import { useId } from "./helpers.mjs";
import { currentApp } from "./app.mjs";
if (!Object.asWeakRef) {
    const weakMap = new Map();
    Object.prototype.asWeakRef = function (data) { weakMap.set(this, data); return this; };
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
const sharedSignals = new Map();
const sWatch = Symbol();
const sValue = Symbol();
const sAsRaw = Symbol();
const fakeNull = 'null';
export const clearStateHeap = () => sharedSignals.clear();
export const useSignal = (value, config = {
    onSet: (v) => { }
}) => {
    if (config.key && sharedSignals.has(config.key))
        return sharedSignals.get(config.key);
    let parentSetter = (v) => { };
    const signal = {
        [sWatch]: new Map(),
        get [sValue]() { return signal.value; },
        get [sAsRaw]() {
            return config.asRaw
                ? config.asRaw(value)
                : value;
        },
        get asRaw() {
            return signal[sAsRaw];
        },
        get value() {
            return (value ?? fakeNull).asWeakRef({
                value: () => value,
                set: (v) => signal.value = v,
                path: '$',
                pathIndex: 0,
                signal
            });
        },
        set value(v) {
            value = useProxy(v, ['$']);
            parentSetter(v);
            useEffect(value, ['$']);
            config.onSet?.(v);
        }
    };
    if ((value ?? null) != null && value.hasWeakRef()) {
        const { set } = fromWeakRef(value, false);
        parentSetter = set;
        watch(value, (v) => { value = v; }, { deep: true });
    }
    const useProxy = (raw, path) => {
        if (typeof raw != 'object' || raw == null)
            return raw;
        Object.entries(raw).forEach(([key, value]) => {
            raw[key] = useProxy(value, [...path, key]);
        });
        const proxy = (new Proxy(raw, {
            get(target, p) {
                if (p == 'toString')
                    return () => JSON.stringify(raw);
                if (p in target) {
                    const data = target[p] ?? null;
                    return data.asWeakRef({
                        value: () => target[p],
                        set: (v) => proxy[p] = v,
                        path: p,
                        pathIndex: path.length,
                        signal
                    });
                }
                return null;
            },
            set(target, p, newValue, receiver) {
                const $path = Array.isArray(target) && p == 'length' ? path : [...path, p];
                const result = Reflect.set(target, p, useProxy(newValue, $path), receiver);
                useEffect(value, $path);
                return result;
            }
        }));
        return proxy;
    };
    const useEffect = (value, path) => {
        signal[sWatch].forEach(callback => {
            callback(value, path);
        });
    };
    value = useProxy(value, ['$']);
    if (config.onInit)
        config.onInit(signal);
    if (config.key)
        sharedSignals.set(config.key, signal);
    if (config.devExpose && (currentApp?.isDev ?? false))
        globalThis[config.devExpose] = signal;
    return signal;
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
            if (p == sWatch
                || p == sAsRaw
                || p == sValue)
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
const isClient = typeof window !== 'undefined';
export const watch = (value, handle, config = {}) => {
    let { key = useId(), flush = 'sync', on = 'both', deep = false } = config;
    const flagError = (on == 'server' && isClient) || (on == 'client' && !isClient);
    const launch = flush == 'async'
        ? async (value) => handle(value)
        : handle;
    let isArray = Array.isArray(value);
    if (isSignal(value) && !flagError) {
        isArray = Array.isArray(value.value);
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
        if ((path.length - 1) < weakRef.pathIndex || path[weakRef.pathIndex] != weakRef.path)
            return;
        else if (!deep && (path.length - 1) > weakRef.pathIndex)
            return;
        launch(weakRef.value());
    });
    return unWatch;
};
export const isSignal = (data) => {
    if (typeof data == 'object' && data && data[sWatch])
        return true;
    return false;
};
export const fromWeakRef = (data, end = true) => {
    if (typeof data == 'undefined')
        return { value: () => data, set: (v) => data = v, path: '', pathIndex: 0, signal: null };
    if (isSignal(data))
        return { value: () => data.value, set: (v) => data.value = v, path: '$', pathIndex: 0, signal: data };
    else if (data.hasWeakRef())
        return data.weakRef(end);
    return { value: () => data, set: (v) => data = v, path: '', pathIndex: 0, signal: null };
};
export const useStrongRef = (value, handle, forceDeep = false) => {
    if (isSignal(value)) {
        handle(value[sAsRaw], () => void 0);
        const unwatch = watch(value, () => handle(value[sAsRaw], unwatch), { deep: true, flush: 'sync' });
        return unwatch;
    }
    handle(value, () => void 0);
    const unwatch = watch(value, (val) => handle(val, unwatch), { flush: 'sync', deep: forceDeep });
    return unwatch;
};
export const tryGetRaw = (value) => {
    if (isSignal(value)) {
        return value[sAsRaw];
    }
    return value;
};
