import type { Fetching, Primitive, URL } from "../type.d.ts";
import { unSignal } from "./stateble.mjs";

const charTable = "0123456789qwertyuiopasdfghjklzxcvbnm#@$%&*";

export const useId = (len = 10) => {
  let result = "";
  for (let i = 0; i < len; i++) {
    result += charTable.charAt(
      Math.floor(Math.random() * (charTable.length - 1)),
    );
  }
  return result;
};

let busCounter = -1;
export const useBusId = () => {
  return (busCounter++, busCounter);
};

export const resetBusId = () => {
  busCounter = -1;
};

export const useStylePrettify = (style: Record<string, any> | string) => {
  if (typeof style == "string") return style;

  return Object.entries(style)
    .reduce(
      (acc, [key, value]) =>
        acc +
        `${
          key.replace("webkit", "-webkit").split(/(?=[A-Z])/).join("-")
            .toLowerCase()
        }: ${value};`,
      "",
    );
};

export const toURLString = (url: Fetching.URL): string => {
  if (typeof url == "string") return url;
  else if (url instanceof URL) return url.toString();

  let final = `${url.path}`;

  if (url.pathParams) {
    Object.entries(url.pathParams)
      .map(([key, value]) =>
        final = final.replace(`{${key}}`, unSignal(value))
      );
  }

  // @ts-ignore
  let query = (Object.keys(url.query ?? {}).length)
    ? `?${
      (new URLSearchParams(
        Object.fromEntries(
          Object.entries(url.query ?? {})
            .map(([key, value]) => [key, unSignal(value)]),
        ),
      )).toString()
    }`
    : "";

  return `${url.origin ?? ""}${final}${query}`;
};

export const toURLMeta = (url: Fetching.URL) => {
  const meta = {
    origin: "",
    path: "",
    query: {},
    pathParams: {} as Record<string, unknown>,
    defaultPathParams: {} as Record<string, unknown>,
  };

  const processPathParams = (path: string): string => {
    if (path.includes("{")) {
      for (const part of path.split("{$").slice(1)) {
        const [param] = part.split("}", 2);
        const [key, value = ""] = param.split(":");

        console.log(`"${key}"`, `"${value}"`);

        // @ts-ignore
        path = path.replaceAll(
          `{$${param}}`,
          process.env[key] ?? value,
        );
      }
      for (const part of path.split("{").slice(1)) {
        const [param] = part.split("}", 2);
        const [key, value = ""] = param.split(":");

        meta.pathParams[key] = decodeURIComponent(value).trim();
        meta.defaultPathParams[key] = decodeURIComponent(value).trim();

        if (value != "") {
          path = path.replace(`{${param}}`, `{${key}}`);
        }
      }
    }
    return path;
  };

  if (typeof url == "object" && "path" in url) {
    url.path = processPathParams(url.path);
    const globalThisUrl = new URL(
      url.path[0] == "/" ? `http://localhost${url.path}` : url.path,
    );
    meta.origin = globalThisUrl.origin;
    // @ts-ignore
    meta.path = globalThisUrl.pathname.replaceAll("%7D", "}").replaceAll(
      "%7B",
      "{",
    );
    meta.query = url.query ?? {};
    meta.pathParams = { ...meta.pathParams, ...(url.pathParams ?? {}) };
  } else if (typeof url == "string" || url instanceof URL) {
    if (typeof url == "string") {
      url = processPathParams(url);
      url = new URL(url[0] == "/" ? `http://localhost${url}` : url);
    }

    meta.origin = url.origin;
    // @ts-ignore
    meta.path = url.pathname.replaceAll("%7D", "}").replaceAll("%7B", "{");
    meta.query = Object.fromEntries(url.searchParams.entries()) ?? {};
  }

  return meta;
};

export const toDelay = (
  signature: string,
  from: string | number | Date | undefined = undefined,
) => {
  let dateFrom: Date = (from ?? new Date()) as Date;

  if (from && !(from instanceof Date)) {
    dateFrom = new Date(from);
  }

  const parsedSignature = Date.parse(signature);

  if (!Number.isNaN(parsedSignature)) {
    return parsedSignature - dateFrom.getTime();
  }

  const dateSignature = new Date();

  if (signature.includes(":")) {
    dateSignature.setFullYear(dateFrom.getFullYear());
    dateSignature.setMonth(dateFrom.getMonth());
    dateSignature.setDate(dateFrom.getDate());

    const [hour, minute, seconds] = signature.split(":");
    dateSignature.setHours(+(hour ?? 1) + 1, +(minute ?? 0), +(seconds ?? 0));
    let result = dateSignature.getTime() - dateFrom.getTime();

    if (result <= 0) {
      dateSignature.setDate(dateSignature.getDate() + 1);
      result = dateSignature.getTime() - dateFrom.getTime();
    }

    return result;
  }

  for (let timeSignature of signature.split("+")) {
    timeSignature = timeSignature.trim();
    const [value, timeType] = timeSignature.split(" ");

    if (timeType.includes("sec")) {
      dateSignature.setSeconds(dateSignature.getSeconds() + +value);
    }
    if (timeType.includes("min")) {
      dateSignature.setMinutes(dateSignature.getMinutes() + +value);
    }
    if (timeType.includes("hour")) {
      dateSignature.setHours(dateSignature.getHours() + +value);
    }
    if (timeType.includes("day")) {
      dateSignature.setDate(dateSignature.getDate() + +value);
    }
    if (timeType.includes("month")) {
      dateSignature.setMonth(dateSignature.getMonth() + +value);
    }
    if (timeType.includes("year")) {
      dateSignature.setFullYear(dateSignature.getFullYear() + +value);
    }
  }

  return dateSignature.getTime() - dateFrom.getTime();
};

export const useURLCapture = (url: URL.URL): URL.ParsedURL => {
  const hasOrigin =
    (typeof url == "string" ? url : (url.path ?? location.pathname))[0] != "/";
  const path = typeof url == "string" ? url : (url.path ?? location.pathname);
  const query = typeof url == "string" ? undefined : url.query;

  const parsedURL = new URL(path, !hasOrigin ? "http://localhost" : undefined);
  const searchParams = typeof url == "string"
    ? parsedURL.searchParams
    : new URLSearchParams(query as any);
  const renderSearchParams = searchParams.toString();
  const basePath = `${parsedURL.pathname}${
    renderSearchParams ? "?" + searchParams.toString() : ""
  }`;

  const captured = {
    fullPath: parsedURL.origin + basePath,
    basePath: basePath,
    origin: hasOrigin ? parsedURL.origin : null,
    path: parsedURL.pathname,
    query: query ?? Object.fromEntries(parsedURL.searchParams.entries()),
    port: +(parsedURL.port) || null,
    params: {},
    hash: parsedURL.hash,
  };

  return captured;
};

export const useRequestCapture = (
  url: URL.URL,
  headers: Record<string, any>,
) => {
  const urlMeta = useURLCapture(url);

  return {
    url: urlMeta,
  };
};
