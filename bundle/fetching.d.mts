import type { Fetching } from "../type.d.ts";
export declare const useFetch: <T extends unknown>(url: Fetching.URL, options?: Fetching.RequestInit<T>) => Fetching.HorizonFetch<T>;
export declare const useRecord: (url: Fetching.URL) => void;
