import { useEditorStore, type SavedBoard } from '@/state'

/** Puts a saved board on the editor's board, with its moves and orientation. One undo step. */
export function loadSavedBoard(board: SavedBoard): boolean {
  const editor = useEditorStore.getState()
  const issues = editor.load(board.pgn ?? board.fen)
  if (issues.length > 0) return false
  editor.setOrientation(board.orientation)
  return true
}
