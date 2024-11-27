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
export function subscrible() {
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
export function init(item, ...props) {
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
