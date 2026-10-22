// Public API of the "editor" feature. Features never import each other.
import './i18n'

export { EditorBoard, type EditorBoardProps } from './EditorBoard'
export { EditorProvider } from './EditorProvider'
export { FenPanel, MovesPanel, PositionPanel } from './panels'
