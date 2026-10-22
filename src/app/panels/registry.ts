import type { ComponentType } from 'react'

export interface PanelDefinition {
  id: string
  /** Lower comes first. */
  order: number
  component: ComponentType
}

const panels = new Map<string, PanelDefinition>()

/** Register a panel for the shell's panel area. Re-registering an id replaces it. */
export function registerPanel(panel: PanelDefinition): void {
  panels.set(panel.id, panel)
}

export function getPanels(): PanelDefinition[] {
  return [...panels.values()].sort((a, b) => a.order - b.order)
}

/** Test helper. */
export function clearPanels(): void {
  panels.clear()
}
