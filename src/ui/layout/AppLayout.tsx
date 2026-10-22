import type { ReactNode } from 'react'
import { cn } from '@/ui/lib/utils'

export interface AppLayoutProps {
  /** Optional top bar (see AppHeader). */
  header?: ReactNode
  /** Slot for the board area. */
  board: ReactNode
  /** Slot for the panel area (analysis, settings, ...). */
  panels: ReactNode
  className?: string
}

/**
 * Responsive two-slot shell layout. Stacked (board first) on phones and
 * portrait tablets; board beside the panel area from the `split` breakpoint
 * (wide screens, any landscape). Side by side the page does not scroll: the
 * board fits the board area and the panel area scrolls on its own. Uses dynamic
 * viewport units and safe-area insets.
 */
export function AppLayout({ header, board, panels, className }: AppLayoutProps) {
  return (
    <div
      data-slot="app-layout"
      className={cn(
        'flex min-h-dvh flex-col bg-background pt-safe-top pr-safe-right pb-safe-bottom pl-safe-left text-foreground',
        'split:h-dvh split:overflow-hidden',
        className,
      )}
    >
      {header}
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 split:flex-row">
        <main
          id="board-area"
          data-slot="board-area"
          tabIndex={-1}
          className="flex items-start justify-center outline-none split:contain-box split:min-w-0 split:flex-1 split:items-center"
        >
          {board}
        </main>
        <aside
          data-slot="panel-area"
          className="-m-1 flex flex-col gap-4 p-1 *:shrink-0 split:w-panel split:shrink-0 split:overflow-y-auto"
        >
          {panels}
        </aside>
      </div>
    </div>
  )
}
