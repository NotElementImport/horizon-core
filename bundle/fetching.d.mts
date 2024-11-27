import { Fetching } from "../type";
export declare const useFetch: <T extends unknown>(url: Fetching.URL, options?: Fetching.RequestInit<T>) => Fetching.HorizonFetch<T>;
export declare const useCacheControl: (config?: Fetching.CacheControlConfig) => Fetching.HorizonFetchCacheControl;
export declare const useRecord: (url: Fetching.URL) => void;
