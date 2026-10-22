import type { ReactNode } from 'react'
import { useSettings } from '@/state'
import { ShortcutsProvider, TooltipProvider } from '@/ui'
import { BoardI18nProvider } from './BoardI18nProvider'
import { I18nProvider } from './I18nProvider'
import { ThemeProvider } from './ThemeProvider'

export function Providers({ children }: { children: ReactNode }) {
  const shortcuts = useSettings((s) => s.shortcuts)
  return (
    <ThemeProvider>
      <I18nProvider>
        <BoardI18nProvider>
          <TooltipProvider>
            <ShortcutsProvider enabled={shortcuts}>{children}</ShortcutsProvider>
          </TooltipProvider>
        </BoardI18nProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
