import type { ReactNode } from 'react'
import { LanguageSelect, ThemeToggle } from '@/features/settings'
import { useTranslation } from '@/i18n'
import { AppHeader, AppLayout } from '@/ui'
import { BoardPlaceholder } from './BoardPlaceholder'
import { usePanels } from './panels/registry'

export interface ShellProps {
  /** Content of the board slot. */
  board?: ReactNode
}

/** Exposes a board area and a panel area; panels arrive via `registerPanel`. */
export function Shell({ board = <BoardPlaceholder /> }: ShellProps) {
  const { t } = useTranslation()
  const panels = usePanels()
  return (
    <>
      <a
        href="#board-area"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-toast focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {t('app.skipToContent')}
      </a>
      <AppLayout
        header={
          <AppHeader
            title={t('app.title')}
            actions={
              <>
                <LanguageSelect />
                <ThemeToggle />
              </>
            }
          />
        }
        board={board}
        panels={panels.map(({ id, component: Panel }) => (
          <Panel key={id} />
        ))}
      />
    </>
  )
}
