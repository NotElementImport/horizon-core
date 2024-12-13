import type { Primitive, Props, Signal } from "../type.d.ts";
export declare const clearSignalHeap: () => void;
export declare const signalMemoryMap: () => {
    isSearchingSignals?: undefined;
    findedSignals?: undefined;
    shared?: undefined;
    weak?: undefined;
} | {
    isSearchingSignals: boolean;
    findedSignals: any[];
    shared: {
        [k: string]: {
            value: any;
            signal: Signal.Signal<any, any>;
        };
    };
    weak: any[];
};
export declare const useSignal: <T extends unknown, K = T>(value: Props.OrSignal<T>, config?: Signal.SignalConfig<T, K>) => Signal.Signal<T, K>;
export declare const useComputed: <T extends unknown>(handle: (raw: <S>(v: S) => Signal.UnpackSignalRaw<S>) => T) => Signal.Signal<T, T>;
export declare const useLazyComputed: <T extends unknown>(models: Props.OrSignal<unknown>[], handle: (raw: <S>(v: S) => Signal.UnpackSignalRaw<S>) => T) => Signal.Signal<T, T>;
export declare const useProxySignal: <T extends Primitive.LikeProxy>(signal: Signal.Signal<T>, config?: Signal.SignalProxySetup<T>) => Signal.ProxySignal<T>;
export declare const watch: <T extends unknown>(value: T, handle: (v: T extends Signal.Signal<any> ? T["value"] : T) => void, config?: {
    key?: string;
    flush?: "sync" | "async";
    on?: "client" | "server" | "both";
    deep?: boolean;
}) => () => any;
export declare const isSignal: (data: unknown) => boolean;
export declare const fromWeakRef: <T extends unknown>(data: T, end?: boolean) => Signal.IWeakRef<T>;
export declare const useStrongRef: <T extends unknown, K = T>(value: T | Signal.Signal<T, K>, handle: (raw: K, unwatch: () => void) => void, forceDeep?: boolean) => () => any;
export declare const unSignal: <T>(value: T) => Signal.UnpackSignalRaw<T>;
