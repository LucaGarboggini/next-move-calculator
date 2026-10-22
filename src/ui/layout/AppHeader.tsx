import type { ReactNode } from 'react'
import { cn } from '@/ui/lib/utils'

export interface AppHeaderProps {
  /** Brand / title, left. */
  title: ReactNode
  /** Global controls, right (theme, language, ...). */
  actions?: ReactNode
  className?: string
}

/** Top bar of the shell: title on the left, global actions on the right. */
export function AppHeader({ title, actions, className }: AppHeaderProps) {
  return (
    <header
      data-slot="app-header"
      className={cn(
        'flex min-h-touch items-center justify-between gap-3 border-b bg-card px-4 py-2 text-card-foreground',
        className,
      )}
    >
      <h1 className="min-w-0 truncate text-base font-semibold">{title}</h1>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  )
}
