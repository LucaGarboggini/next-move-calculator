import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/ui/lib/utils'

export interface BoardStageProps extends ComponentProps<'div'> {
  /**
   * Shown above the board when the shell is stacked and beside it (before it) side by side, e.g.
   * an eval bar. It stretches along the board's edge.
   */
  gauge?: ReactNode
}

/**
 * Holds a BoardFrame and an optional gauge. Side by side, the board stays the largest square
 * that fits the board area once the gauge has its room, so board and gauge both fit the viewport.
 */
export function BoardStage({ gauge, className, children, ...props }: BoardStageProps) {
  return (
    <div
      data-slot="board-stage"
      className={cn(
        'flex w-full max-w-board flex-col gap-gauge-gap',
        'split:w-auto split:max-w-none split:flex-row',
        gauge !== undefined && 'split:board-fit-gauge',
        className,
      )}
      {...props}
    >
      {gauge !== undefined && (
        <div data-slot="board-stage-gauge" className="flex flex-col split:flex-row">
          {gauge}
        </div>
      )}
      {children}
    </div>
  )
}
