import type { Primitive, Signal } from "../type";
export declare const clearStateHeap: () => void;
export declare const useSignal: <T extends unknown, K = T>(value: T, config?: {
    devExpose?: string;
    key?: string;
    asRaw?: (v: T) => K;
    onSet?: (v: T) => void;
    onInit?: (signal: Signal.Signal<T, K>) => void;
}) => Signal.Signal<T, K>;
export declare const useProxySignal: <T extends Primitive.LikeProxy>(signal: Signal.Signal<any>, config?: Signal.SignalProxySetup<T>) => Signal.ProxySignal<T>;
export declare const watch: <T extends unknown>(value: T, handle: (v: T extends Signal.Signal<any> ? T["value"] : T) => void, config?: {
    key?: string;
    flush?: "sync" | "async";
    on?: "client" | "server" | "both";
    deep?: boolean;
}) => () => any;
export declare const isSignal: (data: unknown) => boolean;
export declare const fromWeakRef: <T extends unknown>(data: T, end?: boolean) => Signal.IWeakRef<T>;
export declare const useStrongRef: <T extends unknown, K = T>(value: T | Signal.Signal<T, K>, handle: (raw: K, unwatch: () => void) => void, forceDeep?: boolean) => () => any;
export declare const tryGetRaw: <T extends unknown, K = T>(value: T | Signal.Signal<T, K>) => K;
