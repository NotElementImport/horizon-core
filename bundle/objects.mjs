import { useLocalStorage } from "./composables.mjs";
import { useSignal } from "./stateble.mjs";
const signletoneMap = new Map();
const modifySym = Symbol();
const isSingletone = Symbol();
export function singletone() {
    return function (target, ctx) {
        target[modifySym] = true;
        target[isSingletone] = true;
    };
}
export function signal() {
    return function (_, ctx) {
        const signal = useSignal(null);
        ctx.addInitializer(function () {
            Object.defineProperty(this, ctx.name, { get: () => signal.value, set: (v) => signal.value = v });
        });
        return (value) => {
            signal.value = value;
            return value;
        };
    };
}
export function storage(config = {}) {
    return function (_, ctx) {
        ctx.addInitializer(function () {
            const signal = useLocalStorage(`${config.prefix ?? 'storage-'}${ctx.name}`, { defaultValue: this[ctx.name] });
            Object.defineProperty(this, ctx.name, { get: () => signal.value, set: (v) => signal.value = v });
        });
        return (value) => value;
    };
}
export function record() {
    return function (target, ctx) {
        target[modifySym] = true;
        target[isSingletone] = true;
    };
}
export function methodGet() {
    return function (target, ctx) {
        return (...args) => { return target(...args); };
    };
}
export function methodPost() {
}
export function methodPut() {
}
export function methodDelete() {
}
export function define(item, ...props) {
    let instance;
    if (!item[modifySym])
        instance = new item(...props);
    else {
        instance = signletoneMap.get(item) ?? new item(...props);
        if (item[isSingletone] && !signletoneMap.has(item))
            signletoneMap.set(item, instance);
    }
    return instance;
}
