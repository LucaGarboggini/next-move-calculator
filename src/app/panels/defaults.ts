import { AnalysisPanel, SearchSettingsPanel } from '@/features/analysis'
import { FenPanel, MovesPanel, PositionPanel } from '@/features/editor'
import { SavedBoardsPanel } from '@/features/saved-boards'
import { registerPanel } from './registry'

/** Composition point: features add their panels here with `registerPanel`. */
export function registerDefaultPanels(): void {
  // Calculate comes right after the board; the search settings sit below the position panels.
  registerPanel({ id: 'analysis', order: 5, component: AnalysisPanel })
  registerPanel({ id: 'editor-position', order: 10, component: PositionPanel })
  registerPanel({ id: 'editor-fen', order: 20, component: FenPanel })
  registerPanel({ id: 'editor-moves', order: 30, component: MovesPanel })
  registerPanel({ id: 'analysis-settings', order: 40, component: SearchSettingsPanel })
  registerPanel({ id: 'saved-boards', order: 50, component: SavedBoardsPanel })
}
