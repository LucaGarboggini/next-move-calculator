import { STARTING_FEN } from '@/core'
import type { SavedBoard } from '@/state'

const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'

export const SAMPLE_BOARDS: readonly SavedBoard[] = [
  {
    id: 'sample-2',
    name: 'After 1.e4',
    fen: AFTER_E4,
    pgn: '1. e4 *',
    orientation: 'white',
    savedAt: Date.UTC(2026, 9, 21, 18, 30),
  },
  {
    id: 'sample-1',
    name: 'Starting position, from Black’s side',
    fen: STARTING_FEN,
    pgn: null,
    orientation: 'black',
    savedAt: Date.UTC(2026, 9, 20, 9, 5),
  },
]
