export const LOCALES = ['en', 'pt-BR'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

/** Endonyms: a language is always shown in its own language. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  'pt-BR': 'Português (Brasil)',
}

/** Best supported locale for the browser's preferred languages, else the default. */
export function detectLocale(preferred: readonly string[] = navigator.languages): Locale {
  for (const tag of preferred) {
    const exact = LOCALES.find((l) => l.toLowerCase() === tag.toLowerCase())
    if (exact) return exact
    const base = tag.split('-')[0]?.toLowerCase()
    const byBase = LOCALES.find((l) => l.split('-')[0]?.toLowerCase() === base)
    if (byBase) return byBase
  }
  return DEFAULT_LOCALE
}
