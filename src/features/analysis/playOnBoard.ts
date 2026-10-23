import type { Move } from '@/core'
import { useEditorStore } from '@/state'

/**
 * Plays engine moves on the board as one undo step, and switches the editor to "play" so the game
 * continues from there. The analysis of the old position is dropped by the provider; nothing
 * recalculates by itself. Returns whether the moves were played (all legal).
 */
export function playOnBoard(moves: readonly Move[]): boolean {
  const editor = useEditorStore.getState()
  if (!editor.playMoves(moves)) return false
  editor.setMode('play')
  return true
}
