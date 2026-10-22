import { useCallback } from 'react'
import type { Move } from '@/core'
import { useEditorStore } from '@/state'
import type { PlayLine } from './AnalysisLines'

/**
 * Plays the first `count` moves of an engine line on the board, as one undo step. The editor
 * switches to "play" so the game continues from there; the analysis of the old position is
 * dropped by the provider, and the user presses Calculate again.
 */
export function usePlayLine(): PlayLine {
  return useCallback((moves: readonly Move[], count: number) => {
    const editor = useEditorStore.getState()
    if (editor.playMoves(moves.slice(0, count))) editor.setMode('play')
  }, [])
}
