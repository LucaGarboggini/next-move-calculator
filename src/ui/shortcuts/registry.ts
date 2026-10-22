import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { matchesKeys, usesOwnKeyboard } from './keys'

/** One keyboard shortcut. `label` and `group` are already translated. */
export interface Shortcut {
  /** Unique within its owner. */
  readonly id: string
  /** See `parseKeys`: `"mod+z"`, `"f"`, `"?"`. */
  readonly keys: string
  readonly label: string
  /** Heading in the help list, e.g. "Board". */
  readonly group: string
  readonly run: () => void
}

/**
 * Holds the shortcuts of every part of the app and runs the one that matches a key press.
 * Features register theirs with `useShortcuts`; the help list reads them all. Knows nothing
 * about React components.
 */
export class ShortcutRegistry {
  private readonly owners = new Map<symbol, readonly Shortcut[]>()
  private readonly listeners = new Set<() => void>()
  private snapshot: readonly Shortcut[] = []
  private enabled = true

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  register(owner: symbol, shortcuts: readonly Shortcut[]): () => void {
    this.owners.set(owner, shortcuts)
    this.commit()
    return () => {
      this.owners.delete(owner)
      this.commit()
    }
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  readonly getSnapshot = (): readonly Shortcut[] => this.snapshot

  /** Runs the matching shortcut, if any. Returns whether the key press was used. */
  handle(event: KeyboardEvent): boolean {
    if (!this.enabled || event.defaultPrevented || event.isComposing) return false
    if (usesOwnKeyboard(event.target)) return false
    const match = this.snapshot.find((shortcut) => matchesKeys(event, shortcut.keys))
    if (!match) return false
    event.preventDefault()
    match.run()
    return true
  }

  private commit(): void {
    this.snapshot = [...this.owners.values()].flat()
    this.listeners.forEach((notify) => notify())
  }
}

export const ShortcutRegistryContext = createContext<ShortcutRegistry | null>(null)

/** Without a provider (a story, a test) shortcuts are simply not available. */
const NONE = new ShortcutRegistry()

/**
 * Registers shortcuts while the calling component is mounted. The list may be rebuilt on every
 * render: `run` is always the latest closure, and the registry only changes when keys, labels or
 * groups do (for example when the language changes).
 */
export function useShortcuts(shortcuts: readonly Shortcut[]): void {
  const registry = useContext(ShortcutRegistryContext) ?? NONE
  const [owner] = useState(() => Symbol('shortcuts'))
  const latest = useRef(shortcuts)
  useEffect(() => {
    latest.current = shortcuts
  })

  const signature = JSON.stringify(
    shortcuts.map(({ id, keys, label, group }) => [id, keys, label, group]),
  )
  useEffect(() => {
    const stable = (JSON.parse(signature) as [string, string, string, string][]).map(
      ([id, keys, label, group]): Shortcut => ({
        id,
        keys,
        label,
        group,
        run: () => latest.current.find((shortcut) => shortcut.id === id)?.run(),
      }),
    )
    return registry.register(owner, stable)
  }, [registry, owner, signature])
}

/** Every registered shortcut, for the help list. */
export function useRegisteredShortcuts(): readonly Shortcut[] {
  const registry = useContext(ShortcutRegistryContext) ?? NONE
  return useSyncExternalStore(registry.subscribe, registry.getSnapshot)
}
