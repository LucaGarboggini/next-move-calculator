import { useCallback } from 'react'
import type { Move } from '@/core'
import type { PlayLine } from './AnalysisLines'
import { playOnBoard } from './playOnBoard'

/** Plays the first `count` moves of an engine line on the board, as one undo step. */
export function usePlayLine(): PlayLine {
  return useCallback((moves: readonly Move[], count: number) => {
    playOnBoard(moves.slice(0, count))
  }, [])
}
