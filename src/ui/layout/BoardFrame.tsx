import type { ComponentProps } from 'react'
import { cn } from '@/ui/lib/utils'

/**
 * Square container for the board. Stacked, it fills the width up to the board
 * maximum; side by side it is the largest square that fits the board area, so
 * the board always fits the viewport.
 */
export function BoardFrame({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="board-frame"
      className={cn('aspect-square w-full max-w-board split:board-fit split:max-w-none', className)}
      {...props}
    />
  )
}
