import type { Props } from "../type.d.ts";
import { isClient } from "./app.mts";
import { unSignal } from "./stateble.mts";

interface MetaAttribute {
  charset?: string;
  name?: string;
  content?: string;
  "http-equiv"?:
    | "content-language"
    | "content-security-policy"
    | "content-type"
    | "refresh";
}

interface LinkAttribute {
  rel: string;
  href: string;
  as?: "image" | "font" | "track" | "script" | "style" | "fetch";
  sizes?: string;
}

export const headMeta = {
  title: "",
  meta: [] as MetaAttribute[],
  link: [] as LinkAttribute[],
  scripts: [],
};

export const setDocumentTitle = (
  value: Props.OrSignal<string> | (() => string),
) => {
  headMeta.title = unSignal(value);
  if (isClient) {
    // @ts-ignore
    document.title = headMeta.title;
  }
};
