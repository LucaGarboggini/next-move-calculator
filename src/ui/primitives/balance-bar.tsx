import type * as React from 'react'
import { cn } from '@/ui/lib/utils'

type Axis = 'horizontal' | 'vertical' | 'responsive'
type End = 'start' | 'end'

/** Literal class names per axis, so Tailwind sees every one of them. */
const AXES: Record<Axis, { root: string; fill: string; labels: string; midline: string }> = {
  horizontal: {
    root: 'h-gauge-compact',
    fill: 'translate-x-(--balance-shift-x)',
    labels: 'flex-row px-1.5',
    midline: 'inset-y-0 left-1/2 w-px',
  },
  vertical: {
    root: 'w-gauge',
    fill: 'translate-y-(--balance-shift-y)',
    labels: 'flex-col-reverse py-1.5',
    midline: 'inset-x-0 top-1/2 h-px',
  },
  responsive: {
    root: 'h-gauge-compact split:h-auto split:w-gauge',
    fill: 'translate-x-(--balance-shift-x) split:translate-x-0 split:translate-y-(--balance-shift-y)',
    labels: 'flex-row px-1.5 split:flex-col-reverse split:px-0 split:py-1.5',
    midline:
      'inset-y-0 left-1/2 w-px split:inset-x-0 split:top-1/2 split:bottom-auto split:h-px split:w-auto',
  },
}

export interface BalanceBarProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** Share of the bar the light part covers, from 0 to 1. */
  value: number
  /** End the light part grows from: `start` is the left end (horizontal) or the bottom (vertical). */
  from?: End
  /**
   * `responsive` is horizontal while the shell is stacked and vertical side by side. The length
   * comes from the parent: the bar stretches in a flex container, or fills a block's width.
   */
  axis?: Axis
  /** Short text inside the bar, at the outer end of the larger part. */
  label?: React.ReactNode
}

/**
 * A two-tone bar split at `value`, e.g. who is winning. The light part slides (an animated
 * transform), and a mark shows the middle. Gives no role: the caller says what it measures.
 */
function BalanceBar({
  value,
  from = 'start',
  axis = 'horizontal',
  label,
  className,
  style,
  ...props
}: BalanceBarProps) {
  const share = Math.min(1, Math.max(0, value))
  const rest = 1 - share
  // The light part is as large as the bar and moves out by the dark part's share. Along x, `start`
  // is the left end (move left: negative); along y it is the bottom (move down: positive).
  const toward = from === 'start' ? -1 : 1
  const shift = (sign: number) => `${(sign * rest * 100).toFixed(2)}%`
  const lightLarger = share >= 0.5
  const labelAt: End = lightLarger ? from : from === 'start' ? 'end' : 'start'
  const classes = AXES[axis]

  return (
    <div
      data-slot="balance-bar"
      data-axis={axis}
      className={cn(
        'relative shrink-0 overflow-hidden rounded-sm border border-border bg-eval-black',
        classes.root,
        className,
      )}
      style={
        {
          '--balance-shift-x': shift(toward),
          '--balance-shift-y': shift(-toward),
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        data-slot="balance-bar-fill"
        className={cn(
          'absolute inset-0 bg-eval-white transition-transform motion-slow ease-standard',
          classes.fill,
        )}
      />
      <div aria-hidden="true" className={cn('absolute bg-muted-foreground/60', classes.midline)} />
      {label !== undefined && (
        <div
          aria-hidden="true"
          className={cn(
            'absolute inset-0 flex items-center',
            labelAt === 'start' ? 'justify-start' : 'justify-end',
            classes.labels,
          )}
        >
          <span
            data-slot="balance-bar-label"
            className={cn(
              'font-mono text-xs leading-none font-semibold tabular-nums',
              lightLarger ? 'text-eval-black' : 'text-eval-white',
            )}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  )
}

export { BalanceBar }
