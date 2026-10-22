// Public API of the i18n layer. Every user-facing string goes through here.
import i18next from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import { DEFAULT_LOCALE, LOCALES, type Locale } from './locales'
import { en } from './locales/en'
import { ptBR } from './locales/pt-BR'

export { DEFAULT_LOCALE, LOCALES, LOCALE_NAMES, detectLocale, type Locale } from './locales'
export { useTranslation }

export const COMMON_NS = 'common'

void i18next.use(initReactI18next).init({
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: [...LOCALES],
  ns: [COMMON_NS],
  defaultNS: COMMON_NS,
  resources: { en: { [COMMON_NS]: en }, 'pt-BR': { [COMMON_NS]: ptBR } },
  interpolation: { escapeValue: false },
  returnNull: false,
})

export const i18n = i18next

/** Switch the UI language and keep <html lang> in sync. */
export async function setLocale(locale: Locale): Promise<void> {
  await i18next.changeLanguage(locale)
  document.documentElement.lang = locale
}

/**
 * Features own their strings: each registers a namespace with one bundle per
 * locale, then uses `useTranslation('<namespace>')`.
 */
export function registerTranslations(
  namespace: string,
  bundles: Record<Locale, Record<string, unknown>>,
): void {
  for (const locale of LOCALES) {
    i18next.addResourceBundle(locale, namespace, bundles[locale], true, true)
  }
}
