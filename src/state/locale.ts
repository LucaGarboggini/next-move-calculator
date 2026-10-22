import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LOCALES, type Locale } from '@/i18n'
import { createMerge } from './migrate'

export type LocalePreference = 'system' | Locale

export const LOCALE_STORAGE_KEY = 'nmc-locale'
const VERSION = 1

interface LocaleState {
  preference: LocalePreference
  setPreference: (preference: LocalePreference) => void
}

export function isLocalePreference(value: unknown): value is LocalePreference {
  return value === 'system' || LOCALES.includes(value as Locale)
}

/** Upgrade persisted data from any older shape; unknown or corrupt data resets to defaults. */
export function migrateLocale(persisted: unknown): Pick<LocaleState, 'preference'> {
  const preference = (persisted as { preference?: unknown } | null)?.preference
  return { preference: isLocalePreference(preference) ? preference : 'system' }
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: LOCALE_STORAGE_KEY,
      version: VERSION,
      partialize: ({ preference }) => ({ preference }),
      migrate: migrateLocale,
      merge: createMerge(migrateLocale),
    },
  ),
)
