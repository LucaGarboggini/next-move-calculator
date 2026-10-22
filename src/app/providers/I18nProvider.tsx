import { useEffect, type ReactNode } from 'react'
import { detectLocale, setLocale } from '@/i18n'
import { useLocaleStore } from '@/state'

/** Keeps the UI language in sync with the stored preference ("system" follows the browser). */
export function I18nProvider({ children }: { children: ReactNode }) {
  const preference = useLocaleStore((s) => s.preference)

  useEffect(() => {
    const apply = () => void setLocale(preference === 'system' ? detectLocale() : preference)
    apply()
    if (preference !== 'system') return
    window.addEventListener('languagechange', apply)
    return () => window.removeEventListener('languagechange', apply)
  }, [preference])

  return children
}
