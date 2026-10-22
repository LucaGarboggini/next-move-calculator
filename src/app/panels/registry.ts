import { useSyncExternalStore, type ComponentType } from 'react'

export interface PanelDefinition {
  id: string
  /** Lower comes first. */
  order: number
  component: ComponentType
}

const panels = new Map<string, PanelDefinition>()
const listeners = new Set<() => void>()
let snapshot: readonly PanelDefinition[] = []

function commit(): void {
  snapshot = [...panels.values()].sort((a, b) => a.order - b.order)
  listeners.forEach((notify) => notify())
}

/** Register a panel for the shell's panel area. Re-registering an id replaces it. */
export function registerPanel(panel: PanelDefinition): void {
  panels.set(panel.id, panel)
  commit()
}

export function getPanels(): readonly PanelDefinition[] {
  return snapshot
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Registered panels in order; the caller re-renders when the registry changes. */
export function usePanels(): readonly PanelDefinition[] {
  return useSyncExternalStore(subscribe, getPanels)
}

/** Test helper. */
export function clearPanels(): void {
  panels.clear()
  commit()
}
