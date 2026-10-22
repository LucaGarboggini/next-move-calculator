import { Fragment } from 'react'
import { cn } from '../lib/utils'
import { isMac, keyCaps } from './keys'
import type { Shortcut } from './registry'

export interface ShortcutListProps {
  shortcuts: readonly Pick<Shortcut, 'id' | 'keys' | 'label' | 'group'>[]
  /** Shown instead of the list when there are no shortcuts. */
  empty?: string
  className?: string
}

/** A key as a keycap. */
function Keys({ keys }: { keys: string }) {
  const caps = keyCaps(keys, isMac())
  return (
    <span className="inline-flex items-center gap-1">
      {caps.map((cap, index) => (
        <Fragment key={cap}>
          {index > 0 && <span aria-hidden="true">+</span>}
          <kbd className="inline-flex min-w-6 items-center justify-center rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            {cap}
          </kbd>
        </Fragment>
      ))}
    </span>
  )
}

/** Shortcuts grouped under their headings, in the order they were registered. */
export function ShortcutList({ shortcuts, empty, className }: ShortcutListProps) {
  if (shortcuts.length === 0) return empty ? <p className="text-sm">{empty}</p> : null
  const groups = new Map<string, ShortcutListProps['shortcuts'][number][]>()
  for (const shortcut of shortcuts) {
    groups.set(shortcut.group, [...(groups.get(shortcut.group) ?? []), shortcut])
  }
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {[...groups].map(([group, items]) => (
        <section key={group} aria-label={group} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{group}</h3>
          <dl className="flex flex-col gap-1.5">
            {items.map((shortcut) => (
              <div key={shortcut.id} className="flex items-center justify-between gap-4 text-sm">
                <dt className="text-muted-foreground">{shortcut.label}</dt>
                <dd>
                  <Keys keys={shortcut.keys} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}
