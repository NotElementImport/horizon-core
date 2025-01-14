import type {
  Composable,
  CSS,
  H,
  Primitive,
  Props,
  Signal,
} from "../type.d.ts";
import { isClient } from "./app.mjs";
import { toDelay, useId, useStylePrettify } from "./helpers.mjs";
import { useStack } from "./stack.mjs";
import {
  unSignal,
  useDeepClone,
  useProxySignal,
  useSignal,
  watch,
} from "./stateble.mjs";

type StyleSignal = CSS.Style;
type StyleStringSignal = Signal.Signal<string, string>;

export const useStyle = <T extends CSS.Style | string>(
  object: T,
): T extends string ? StyleStringSignal : StyleSignal => {
  const signal = useSignal(object, { asRaw: (v) => useStylePrettify(v) });

  if (typeof signal.value == "object") {
    return useProxySignal(
      signal,
    ) as (T extends string ? StyleStringSignal : StyleSignal);
  }
  return signal as unknown as (T extends string ? StyleStringSignal
    : StyleSignal);
};

export const useColorSheme = (
  config: {
    get?: () => Composable.ColorSheme;
    set?: (v: Composable.ColorSheme) => void;
  } = {},
) => {
  return useSignal<Composable.ColorSheme>(
    config.get ? (config.get() ?? null) : null as any,
    {
      key: "client-system-theme",
      onSet(v) {
        if (config.set) config.set(v);
      },
      onInit(signal) {
        if (isClient && (signal.value == "null" as any)) {
          signal.value =
            window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light";
          window.matchMedia("(prefers-color-scheme: dark)")
            .addEventListener(
              "change",
              (event) => signal.value = event.matches ? "dark" : "light",
            );
        }
      },
    },
  );
};

export const useDebounceCallback = (
  watching: Props.OrSignal<any>[],
  delayMs: H.milliseconds,
  callback: () => unknown,
) => {
  let debounceTimer: number = -1;

  const runCallback = () => {
    if (debounceTimer != -1) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => callback(), delayMs);
  };

  for (const object of watching) {
    watch(object, () => {
      runCallback();
    }, { deep: true });
  }

  return runCallback;
};

export const useRandomInt = (a: H.int, b?: H.int) => {
  const min = b != null ? a : 0;
  const max = b != null ? b - a : a;
  return Math.floor(min + Math.random() * max);
};

export const useRandomFloat = (a?: H.float, b?: H.float) => {
  a = a ?? 1;
  const min = b != null ? a : 0;
  const max = b != null ? b - a : a;
  return min + Math.random() * max;
};

export const useRandomString = (len: H.int = 10) => {
  return useId(len) as string;
};

export const useHistory = <State extends unknown>(
  config: {
    length?: H.int;
    listen?: Signal.Signal<State>;
    keepName?: string;
  } = {},
) => {
  const { length: maxLength = 10, keepName, listen } = config;

  let lastStateHistory: State[] = [];
  let undoLength = 0;
  let doPush = false;

  const history = keepName
    ? useLocalStorage(keepName, { defaultValue: [] })
    : useSignal([]);

  if (listen) {
    let isHistory = false;

    watch(listen, () => {
      if (isHistory) return;
      instance.push(
        useDeepClone(listen.value) as State,
      );
      isHistory = false;
    }, { deep: false });

    watch(history, () => {
      if (!doPush) {
        isHistory = true;
        listen.value = history.value[history.value.length - 1];
      }
      doPush = false;
    });
  }

  const fromHistoryUpdate = () => {
    const index = lastStateHistory.length - undoLength;
    history.value = lastStateHistory.slice(
      0,
      index,
    );
    return index - 1;
  };

  const instance = {
    get value() {
      return history.value as State[];
    },
    push(state: State) {
      doPush = true;
      if (undoLength != 0) {
        undoLength = 0;
        lastStateHistory = [];
      }
      history.value.push(state);
      if (history.value.length > maxLength) {
        history.value.shift();
      }
      return history.value[history.value.length - 1];
    },
    undo() {
      if (undoLength == 0) {
        lastStateHistory = history.value;
      } else if (undoLength == lastStateHistory.length) {
        return undefined;
      }
      undoLength++;
      return lastStateHistory[fromHistoryUpdate() + 1];
    },
    redo() {
      if (undoLength == 0) {
        return history.value[lastStateHistory.length - 1];
      }
      undoLength--;
      return lastStateHistory[fromHistoryUpdate()];
    },
    clear() {
      history.value = [];
      lastStateHistory = [];
      undoLength = 0;
    },
  };

  return instance;
};

export const useFriction = (
  watchers: Props.OrSignal<unknown>[],
  config: {
    setup: (controller: AbortController) => unknown;
    abort?: () => void;
    debounce?: H.milliseconds;
    immediate?: boolean;
  },
) => {
  let abortController = new AbortController();
  const { setup, abort, immediate = true, debounce = 0 } = config;
  const runDebounce = useDebounceCallback(
    [],
    debounce,
    () => setup(abortController),
  );

  const launch = (firstLaunch = false) => {
    if (!firstLaunch) {
      abort?.();
      abortController.abort();
      abortController = new AbortController();
      runDebounce();
    } else {
      setup(abortController);
    }
  };

  for (const object of watchers) {
    watch(object, () => {
      launch();
    });
  }

  if (immediate) {
    launch(true);
  }
};

export const useTransport = <T extends Primitive.LikeProxy>(
  signalA: Signal.Signal<T>,
  signalB: Signal.Signal<T>,
) => {
  const removeItem = (
    index: string | number,
    item: Record<string | number, unknown>,
  ) => {
    delete item[index];
  };

  return {
    move(index: string | number) {
      for (const [key] of Object.entries(signalA.value)) {
        if (index == key) {
          // @ts-ignore
          signalB.value[index] = signalA.value[index];
          // @ts-ignore
          removeItem(index, signalA.value);
          return true;
        }
      }
      for (const [key] of Object.entries(signalB.value)) {
        if (index == key) {
          // @ts-ignore
          signalA.value[index] = signalB.value[index];
          // @ts-ignore
          removeItem(index, signalB.value);
          return true;
        }
      }
      return false;
    },
    add(index: string | number) {
      for (const [key] of Object.entries(signalA.value)) {
        if (index == key) {
          // @ts-ignore
          signalB.value[index] = signalA.value[index];
          // @ts-ignore
          removeItem(index, signalA.value);
          return true;
        }
      }
      return false;
    },
    sub(index: string | number) {
      for (const [key] of Object.entries(signalB.value)) {
        if (index == key) {
          // @ts-ignore
          signalA.value[index] = signalB.value[index];
          // @ts-ignore
          removeItem(index, signalB.value);
          return true;
        }
      }
      return false;
    },
    toObject(config: { aName?: string; bName?: string } = {}) {
      const aItemName = config.aName ?? "a";
      const bItemName = config.bName ?? "b";
      const item = {
        [aItemName]: {} as any,
        [bItemName]: {} as any,
      };
      for (const [key, value] of Object.entries(signalA.value)) {
        item[aItemName][key] = value;
      }
      for (const [key, value] of Object.entries(signalB.value)) {
        item[bItemName][key] = value;
      }
      return item;
    },
  };
};

interface ProcessConfig {
  at?: string | H.milliseconds;
  period?: H.milliseconds | string;
}

interface Process<T> extends Promise<T> {
  abort: () => void;
}

export const useProcess = (
  handle: (abort: () => void) => unknown,
  config: ProcessConfig = {},
) => {
  let periodTimeout: number | null = null;
  let launchTimeout: number | null = null;
  let taskResolve: Function;

  const startProcess = async () => {
    if (!config.period) {
      return (await handle(taskResolve as any), taskResolve());
    }

    const getPeriod = () =>
      typeof config.period == "string"
        ? toDelay(config.period ?? "1 sec")
        : config.period;

    const startPeriod = () =>
      periodTimeout = setTimeout(async () => {
        await handle(task.abort);
        startPeriod();
      }, getPeriod());
    startPeriod();
  };

  let processAt = config.at ?? 0;

  const task: Process<void> = new Promise<void>(async (resolve) => {
    taskResolve = resolve;

    launchTimeout = setTimeout(
      () => startProcess(),
      typeof processAt == "string" ? toDelay(processAt ?? "1 sec") : processAt,
    );
  }) as any;

  task.abort = () => {
    if (launchTimeout) {
      clearTimeout(launchTimeout);
    }
    if (periodTimeout) {
      clearTimeout(periodTimeout);
    }
    taskResolve();
  };

  return task;
};

export const useParallel = async (threads: object | Function[]) => {
  const task = useStack();
  let output = {} as Record<string, unknown>;
  task.fill(
    Object.entries(threads).map(([index, task]) => {
      return async () => output[index] = await task();
    }),
  );
  return (await task.spread(),
    Array.isArray(threads) ? Object.values(output) : output);
};

export const useNormalizer = (
  data: Props.OrSignal<number[]>,
  config: { chart?: boolean } = {},
) => {
  const process = () => {
    let rawData = unSignal<number[]>(data);
    const output = [] as { value: number; raw: number }[];
    let maxValue = -Infinity;
    let minValue = Infinity;

    rawData.map((item) => {
      if (item < minValue) minValue = item;
      if (item > maxValue) maxValue = item;
    });

    if (!config.chart) {
      maxValue -= minValue;
    }
    maxValue = 1 / (maxValue == 0 ? 1 : maxValue);

    const chartMultiple = 1 / (rawData.length == 0 ? 1 : rawData.length);

    rawData = config.chart ? rawData.sort((a, b) => a - b) : rawData;

    rawData.map((item, index) => {
      if (!config.chart) {
        return output.push({
          value: (item - minValue) * maxValue,
          raw: item,
        });
      }

      output.push({
        value: item * maxValue * chartMultiple * (index + 1),
        raw: item,
      });
    });

    return config.chart ? output.reverse() : output;
  };

  return useSignal<{ value: number; raw: number }[], number[]>([], {
    onInit(signal) {
      watch(data, () => signal.value = process());
      signal.value = process();
    },
    asRaw(v) {
      return v.map((v) => v.value);
    },
  });
};

interface Subscribe<T> {
  on(handle: (v: T) => void, key?: string): () => boolean;
  off(key: string): boolean;
  broadcast(v: T): void;
  clear(): void;
}

export const useSubscribe = <T extends unknown>() => {
  const subs = new Map<string, Function>();
  return {
    on(handle, key) {
      const id = key ?? useId();
      subs.set(id, handle);
      return () => subs.delete(id);
    },
    off(key) {
      return subs.delete(key);
    },
    broadcast(v) {
      subs.forEach((callback) => callback(v));
    },
    clear() {
      subs.clear();
    },
  } as Subscribe<T>;
};

interface EventMap<T extends Record<PropertyKey, unknown>> {
  on<K extends keyof T>(
    eventKey: K,
    handle: (v: T[K]) => void,
    key?: string,
  ): () => boolean;
  off(eventKey: keyof T, key: string): boolean;
  broadcast<K extends keyof T>(eventKey: K, v: T[K]): void;
  clear(eventKey?: keyof T): void;
}

export const useEventMap = <T extends Record<PropertyKey, unknown>>() => {
  const events = new Map<keyof T, Map<PropertyKey, Function>>();

  return {
    on(eventKey, handle, key) {
      let event: Map<PropertyKey, Function> | null = events.get(eventKey) ??
        null;

      if (event == null) {
        event = new Map<PropertyKey, Function>();
        events.set(eventKey, event);
      }

      key = key ?? useId();
      event.set(key, handle);

      return () => event.delete(key);
    },
    off(eventKey, key) {
      const event = events.get(eventKey) ?? null;

      if (event == null) return false;

      return event.delete(key);
    },
    broadcast(eventKey, v) {
      const event = events.get(eventKey) ?? null;

      if (event == null) return;

      event.forEach((callback) => {
        callback(v);
      });
    },
    clear(eventKey) {
      if (!eventKey) return (events.clear(), void 0);
      const event = events.get(eventKey) ?? null;
      if (event != null) event.clear();
    },
  } as EventMap<T>;
};

export const useScrollLock = () => {
  return useSignal(false, {
    key: "client-system-scroll-lock",
    onSet(v) {
      useDocumentBody((body) => {
        body.style.overflow = v ? "hidden" : "unset";
      });
    },
  });
};

type TriggerSignal = Signal.Signal<boolean> & { trigger: () => void };
export const useTrigger = (handle: (push: Function) => void): TriggerSignal => {
  const signal = useSignal(false, {
    onInit(signal) {
      handle(() => signal.value = !signal.value);
    },
  });
  signal.trigger = () => {
    signal.value = !signal.value;
  };
  return signal;
};

export const useLocalStorage = <T extends any>(
  key: string,
  { defaultValue = null as T, safeValue }: {
    defaultValue?: T;
    safeValue?: Signal.SignalConfig<T, T>["safeValue"];
  } = {},
) => {
  return useSignal<T>(defaultValue, {
    key,
    safeValue,
    onInit(signal) {
      if (isClient) {
        watch(signal, (v) => localStorage.setItem(key, JSON.stringify(v)), {
          deep: true,
        });
        signal.value = JSON.parse(localStorage.getItem(key) ?? "null") ??
          defaultValue;
      }
    },
  });
};

export const useSessionStorage = <T extends any>(
  key: string,
  { defaultValue = null as T }: { defaultValue?: T } = {},
) => {
  return useSignal<T>(defaultValue, {
    key,
    onInit(signal) {
      if (isClient) {
        watch(
          signal,
          (v) => sessionStorage.setItem(key, JSON.stringify(v)),
          {
            deep: true,
          },
        );
        signal.value = JSON.parse(sessionStorage.getItem(key) ?? "null") ??
          defaultValue;
      }
    },
  });
};

export const useDocumentHtml = (handle: (dom: HTMLHtmlElement) => void) => {
  if (!isClient) {
    return void 0;
  }
  handle(document.body.parentElement as HTMLHtmlElement);
};

export const useDocumentBody = (handle: (dom: HTMLBodyElement) => void) => {
  if (!isClient) {
    return void 0;
  }
  handle(document.body as HTMLBodyElement);
};

export const useGetDOM = <T extends HTMLElement>(
  selector: string,
  onFound: (dom: T) => void,
) => {
  if (!isClient) {
    return void 0;
  }
  const dom = document.body.querySelector(selector);
  if (dom) onFound(dom as T);
};
