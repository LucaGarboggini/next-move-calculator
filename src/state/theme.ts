import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const
export type ThemePreference = (typeof THEME_PREFERENCES)[number]
export type ResolvedTheme = 'light' | 'dark'

/** Also read by the inline script in index.html that sets the theme before first paint. */
export const THEME_STORAGE_KEY = 'nmc-theme'
const VERSION = 1

interface ThemeState {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference)
}

/** What actually renders: "system" follows the OS. */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light'
  return preference
}

/** Upgrade persisted data from any older shape; unknown or corrupt data resets to defaults. */
export function migrateTheme(persisted: unknown): Pick<ThemeState, 'preference'> {
  const preference = (persisted as { preference?: unknown } | null)?.preference
  return { preference: isThemePreference(preference) ? preference : 'system' }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    {
      name: THEME_STORAGE_KEY,
      version: VERSION,
      partialize: ({ preference }) => ({ preference }),
      migrate: migrateTheme,
    },
  ),
)
