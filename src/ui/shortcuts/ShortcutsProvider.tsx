import { useEffect, useState, type ReactNode } from 'react'
import { ShortcutRegistry, ShortcutRegistryContext } from './registry'

export interface ShortcutsProviderProps {
  /** Off means no shortcut runs (the help list still shows what exists). */
  enabled?: boolean
  children: ReactNode
}

/** Listens for key presses once, for the whole page, and runs the matching registered shortcut. */
export function ShortcutsProvider({ enabled = true, children }: ShortcutsProviderProps) {
  const [registry] = useState(() => new ShortcutRegistry())

  useEffect(() => {
    registry.setEnabled(enabled)
  }, [registry, enabled])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => void registry.handle(event)
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [registry])

  return <ShortcutRegistryContext value={registry}>{children}</ShortcutRegistryContext>
}
