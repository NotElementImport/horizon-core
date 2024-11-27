import { Signal } from "../type";
export declare const onSharedData: <T extends unknown>(key: string | number, handle: (value: T) => void) => void;
export declare const useSharedData: <T extends unknown>(key: string | number, $default?: T) => any;
export declare const useSyncSignal: <T extends unknown, K extends unknown>(value: T, config?: Signal.SignalConfig<T, K>) => Signal.Signal<T, K>;
