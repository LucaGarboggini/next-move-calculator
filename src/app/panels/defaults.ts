import { FenPanel, MovesPanel, PositionPanel } from '@/features/editor'
import { registerPanel } from './registry'

/** Composition point: features add their panels here with `registerPanel`. */
export function registerDefaultPanels(): void {
  registerPanel({ id: 'editor-position', order: 10, component: PositionPanel })
  registerPanel({ id: 'editor-fen', order: 20, component: FenPanel })
  registerPanel({ id: 'editor-moves', order: 30, component: MovesPanel })
}
