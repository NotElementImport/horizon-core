import { Composable, CSS, Props, Signal } from "../type";
type StyleSignal = CSS.Style;
type StyleStringSignal = Signal.Signal<string, string>;
export declare const useStyle: <T extends CSS.Style | string>(object: T) => T extends string ? StyleStringSignal : StyleSignal;
export declare const useColorSheme: (config?: {
    get?: () => Composable.ColorSheme;
    set?: (v: Composable.ColorSheme) => void;
}) => Signal.Signal<Composable.ColorSheme, Composable.ColorSheme>;
interface ProcessConfig {
    at?: string | number;
    period?: number | string;
}
interface Process<T> extends Promise<T> {
    abort: () => void;
}
export declare const useProcess: (handle: (abort: () => void) => unknown, config?: ProcessConfig) => Process<void>;
export declare const useParallel: (threads: object | Function[]) => Promise<unknown[] | Record<any, unknown>>;
export declare const useNormalizer: (data: Props.OrSignal<number[]>, config?: {
    chart?: boolean;
}) => Signal.Signal<{
    value: number;
    raw: number;
}[], number[]>;
interface Subscribe<T> {
    on(handle: (v: T) => void, key?: string): (() => boolean);
    off(key: string): boolean;
    broadcast(v: T): void;
    clear(): void;
}
export declare const useSubscribe: <T extends unknown>() => Subscribe<T>;
interface EventMap<T extends Record<PropertyKey, unknown>> {
    on<K extends keyof T>(eventKey: K, handle: (v: T[K]) => void, key?: string): (() => boolean);
    off(eventKey: keyof T, key: string): boolean;
    broadcast<K extends keyof T>(eventKey: K, v: T[K]): void;
    clear(eventKey?: keyof T): void;
}
export declare const useEventMap: <T extends Record<PropertyKey, unknown>>() => EventMap<T>;
export declare const useScrollLock: () => Signal.Signal<boolean, boolean>;
export declare const useLocalStorage: <T extends unknown>(key: string, { defaultValue }?: {
    defaultValue?: T;
}) => Signal.Signal<T, T>;
export declare const useDocumentHtml: (handle: (dom: HTMLHtmlElement) => void) => undefined;
export declare const useDocumentBody: (handle: (dom: HTMLBodyElement) => void) => null | undefined;
export declare const useGetDOM: <T extends HTMLElement>(selector: string, onFound: (dom: T) => void) => null | undefined;
export {};
