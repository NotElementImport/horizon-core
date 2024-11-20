import { Composable, CSS, Signal } from "../type";
type StyleSignal = CSS.Style;
type StyleStringSignal = Signal.Signal<string, string>;
export declare const useStyle: <T extends CSS.Style | string>(object: T) => T extends string ? StyleStringSignal : StyleSignal;
export declare const useColorSheme: (config?: {
    get?: () => Composable.ColorSheme;
    set?: (v: Composable.ColorSheme) => void;
}) => Signal.Signal<Composable.ColorSheme, Composable.ColorSheme>;
interface ProcessConfig {
    at?: string | Date | number;
    period?: number | string;
}
interface Process<T> extends Promise<T> {
    abort: () => void;
}
export declare const useProcess: (handle: (abort: () => void) => unknown, config?: ProcessConfig) => Process<void>;
export declare const useParallel: (threads: object | Function[]) => Promise<unknown[] | Record<any, unknown>>;
export declare const useScrollLock: () => Signal.Signal<boolean, boolean>;
export declare const useLocalStorage: <T extends unknown>(key: string, { defaultValue }?: {
    defaultValue?: T;
}) => Signal.Signal<T, T>;
export declare const useDocumentHtml: (handle: (dom: HTMLHtmlElement) => void) => undefined;
export declare const useDocumentBody: (handle: (dom: HTMLBodyElement) => void) => null | undefined;
export {};
