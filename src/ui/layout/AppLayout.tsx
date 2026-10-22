import type { ReactNode } from 'react'
import { cn } from '@/ui/lib/utils'

export interface AppLayoutProps {
  /** Slot for the board area. */
  board: ReactNode
  /** Slot for the panel area (analysis, settings, ...). */
  panels: ReactNode
  className?: string
}

/**
 * Responsive two-slot shell layout: board first when stacked (phone, portrait
 * tablet), board beside the panel area from the `lg` breakpoint or in landscape.
 * Uses dynamic viewport units and safe-area insets.
 */
export function AppLayout({ board, panels, className }: AppLayoutProps) {
  return (
    <div
      data-slot="app-layout"
      className={cn(
        'flex min-h-dvh flex-col gap-4 bg-background p-4 pt-safe-top pr-safe-right pb-safe-bottom pl-safe-left text-foreground',
        'lg:flex-row landscape:flex-row',
        className,
      )}
    >
      <main
        data-slot="board-area"
        className="flex min-w-0 flex-1 items-start justify-center landscape:max-h-dvh"
      >
        {board}
      </main>
      <aside data-slot="panel-area" className="flex min-w-0 flex-col gap-4 lg:w-96 landscape:w-96">
        {panels}
      </aside>
    </div>
  )
}
