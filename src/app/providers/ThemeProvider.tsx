import { useEffect, type ReactNode } from 'react'
import { resolveTheme, useThemeStore } from '@/state'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Applies the resolved theme (.dark on <html>) and follows the OS while the preference is "system". */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useThemeStore((s) => s.preference)

  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY)
    const apply = () => {
      document.documentElement.classList.toggle(
        'dark',
        resolveTheme(preference, media.matches) === 'dark',
      )
    }
    apply()
    if (preference !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [preference])

  return children
}
