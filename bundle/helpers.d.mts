import type { Fetching, URL } from "../type.d.ts";
export declare const useId: (len?: number) => string;
export declare const useBusId: () => number;
export declare const useStylePrettify: (style: Record<string, any> | string) => string;
export declare const toURLString: (url: Fetching.URL) => string;
export declare const toURLMeta: (url: Fetching.URL) => {
    origin: string;
    path: string;
    query: {};
    pathParams: Record<string, unknown>;
    defaultPathParams: Record<string, unknown>;
};
export declare const toDelay: (signature: string, from?: string | number | Date | undefined) => number;
export declare const useURLCapture: (url: URL.URL) => {
    fullPath: URL.URL;
    origin: string | null;
    path: string;
    query: string | {
        [k: string]: string;
    };
    port: number | null;
    params: {};
};
export declare const useRequestCapture: (url: URL.URL, headers: Record<string, any>) => {
    url: {
        fullPath: URL.URL;
        origin: string | null;
        path: string;
        query: string | {
            [k: string]: string;
        };
        port: number | null;
        params: {};
    };
};
