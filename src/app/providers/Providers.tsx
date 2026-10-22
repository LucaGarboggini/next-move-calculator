import type { ReactNode } from 'react'
import { TooltipProvider } from '@/ui'
import { BoardI18nProvider } from './BoardI18nProvider'
import { I18nProvider } from './I18nProvider'
import { ThemeProvider } from './ThemeProvider'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <BoardI18nProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </BoardI18nProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
