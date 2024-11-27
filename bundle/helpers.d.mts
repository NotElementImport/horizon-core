import { Fetching } from "../type";
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
