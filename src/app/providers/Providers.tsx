import type { ReactNode } from 'react'
import { TooltipProvider } from '@/ui'
import { I18nProvider } from './I18nProvider'
import { ThemeProvider } from './ThemeProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
