import { useLocalStorage } from "./composables.mts";
import { useComputed, useSignal, useStrongRef } from "./stateble.mts";

let fallbackLocale = "en";
let registeredLocales: string[] = [];
let translations: Record<string, Record<string, string>> = {};
const current = useLocalStorage<string>("i18n_locale", {
  safeValue: () => fallbackLocale,
});

export const defineI18n = (config: {
  translation: typeof translations;
  locales: string[];
  fallbackLocale?: string;
}) => {
  fallbackLocale = config.fallbackLocale ?? "en";
  registeredLocales = config.locales ?? [];
  translations = config.translation;
};

export const useI18n = () => {
  const tryLocalePhrase = (locale: string, phrase: string) => {
    return translations[locale]?.[phrase] ?? phrase;
  };

  const i18n = {
    getLocales(): string[] {
      return registeredLocales;
    },
    setFallbackLocale(locale: string) {
      fallbackLocale = locale;
    },
    getFallbackLocale(): string {
      return fallbackLocale;
    },
    setLocale(locale: string): boolean {
      if (registeredLocales.includes(locale)) {
        return (current.value = locale, true);
      }
      return (current.value = fallbackLocale, false);
    },
    getLocale(): string {
      return current.value;
    },
    /** Static locale */
    s(phrase: string) {
      return tryLocalePhrase(current.value, phrase);
    },
    /** Signal locale */
    t(phrase: string) {
      return useSignal(phrase, {
        safeValue: phrase,
        key: `i18n_${phrase}`,
        onInit(signal) {
          useStrongRef(current, () => {
            signal.value = tryLocalePhrase(current.value, phrase);
          });
        },
      });
    },
    /** Computed locale */
    c(phrase: string, handle: (result: string) => string) {
      const phraseSignal = i18n.t(phrase);

      return useComputed(() => {
        return handle(
          phraseSignal.value,
        );
      });
    },
    current,
  };
  return i18n;
};
