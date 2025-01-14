import type { Fetching, Signal } from "../type.d.ts";
import { isClient } from "./app.mjs";
import { useEventMap } from "./composables.mjs";
import { useBusId } from "./helpers.mjs";
import { unSignal, useSignal, useStrongRef, watch } from "./stateble.mjs";

// const sharedEventMap = useEventMap<{ "on-sync": void }>();

const sharedStructure = {
  sync: false,
  data: new Map<string | number, any>(),
  cacheControl: new Map<string, any>(),
};

export const executeSync = (
  data: Record<string, unknown>,
  cacheControl?: Record<string, unknown>,
) => {
  for (const [key, sharedValue] of Object.entries(data)) {
    sharedStructure.data.set(key, sharedValue);
  }

  if (cacheControl) {
    for (const [key, cacheValue] of Object.entries(cacheControl)) {
      sharedStructure.cacheControl.set(key, cacheValue);
    }
  }

  sharedStructure.sync = true;
  sharedEventMap.broadcast("on-sync", void 0);
};

export const createSharedJSON = () => {
  const json: Record<string, any> = { data: {}, cacheControl: {} };
  for (const [key, value] of sharedStructure.data.entries()) {
    if (`${key}`[0] == "#") continue;
    json.data[key] = unSignal(value);
  }
  for (const [key, value] of sharedStructure.cacheControl.entries()) {
    if (key[0] == "#") continue;
    json.cacheControl[key] = unSignal(value);
  }
  return JSON.stringify(json);
};

export const clearSharedData = () => {
  sharedStructure.cacheControl.clear();
  sharedStructure.data.clear();
};

export const tryReadSharedData = <T extends unknown>(
  key: string | number,
  handle: (value: T) => void,
): void => {
  const tryRead = () => {
    const someData = readSharedData(key, null);
    if (someData != null) {
      handle(someData);
    }
  };

  if (!isClient || !sharedStructure.sync) {
    return tryRead();
  }

  sharedEventMap.on("on-sync", () => tryRead());
};

export const writeSharedData = <T extends unknown>(
  key: string | number,
  value: T,
) => {
  sharedStructure.data.set(key, value);
};

export const readSharedData = <T extends unknown>(
  key: string | number,
  $default: T = null as T,
) => {
  return sharedStructure.data.get(key) ?? $default;
};

export const useSyncSignal = <T extends unknown, K extends any>(
  value: T,
  config: Signal.SharedConfig<T, K> = {},
) => {
  const key = config.key ?? useBusId();
  return useSignal(value, {
    ...config,
    onInit(signal) {
      if (isClient) {
        tryReadSharedData<T>(key, (v) => {
          signal.value = v;
          if (config.onSync) {
            config.onSync(v);
          }
        });
      } else {
        useStrongRef(signal, () => writeSharedData(key, signal.value));
        if (config.onServerInit) config.onServerInit(signal);
      }
      if (config.onInit) config.onInit(signal);
    },
  });
};

export const useCacheControl = (
  config: Fetching.CacheControlConfig = {},
): Fetching.HorizonFetchCacheControl => {
  const shared = config.shared ?? false;

  if (shared) {
    return {
      write(key, data, time) {
        sharedStructure.cacheControl.set(key, data);
        if (time) {
          setTimeout(() => {
            sharedStructure.cacheControl.delete(key);
          }, time);
        }
        return data;
      },
      read(key) {
        return sharedStructure.cacheControl.get(key);
      },
      tryRead(key, $default) {
        let value = sharedStructure.cacheControl.get(key);
        if (value) return value;
        // @ts-ignore
        return typeof $default == "function" ? $default() : $default;
      },
      forget(key) {
        return sharedStructure.cacheControl.delete(key);
      },
      forgetAll(startsWith) {
        if (!startsWith) {
          throw new Error("Global cache cannot be without startWith");
        }

        sharedStructure.cacheControl.forEach((_, key) => {
          if (key.startsWith(startsWith)) {
            caches.delete(key);
          }
        });
      },
    };
  } else {
    const local = new Map();
    return {
      write(key, data, time) {
        if (!isClient) return data;
        local.set(key, data);
        if (time) {
          setTimeout(() => {
            local.delete(key);
          }, time);
        }
        return data;
      },
      read(key) {
        if (!isClient) return undefined;
        return local.get(key);
      },
      tryRead(key, $default) {
        // @ts-ignore
        if (!isClient) {
          return typeof $default == "function" ? $default() : $default;
        }
        const value = local.get(key);
        if (value) return value;
        // @ts-ignore
        return typeof $default == "function" ? $default() : $default;
      },
      forget(key) {
        return local.delete(key);
      },
      forgetAll(startsWith) {
        if (!startsWith) return local.clear();

        local.forEach((_, key) => {
          if (key.startsWith(startsWith)) {
            caches.delete(key);
          }
        });
      },
    };
  }
};

