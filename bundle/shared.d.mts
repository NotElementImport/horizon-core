import type { Fetching, Signal } from "../type.d.ts";
export declare const executeSync: (data: Record<string, unknown>, cacheControl?: Record<string, unknown>) => void;
export declare const createSharedJSON: () => string;
export declare const clearSharedData: () => void;
export declare const tryReadSharedData: <T extends unknown>(key: string | number, handle: (value: T) => void) => void;
export declare const writeSharedData: <T extends unknown>(key: string | number, value: T) => void;
export declare const readSharedData: <T extends unknown>(key: string | number, $default?: T) => any;
export declare const useSyncSignal: <T extends unknown, K extends unknown>(value: T, config?: Signal.SharedConfig<T, K>) => Signal.Signal<T, K>;
export declare const useCacheControl: (config?: Fetching.CacheControlConfig) => Fetching.HorizonFetchCacheControl;
