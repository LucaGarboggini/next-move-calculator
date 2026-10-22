import { FILES, RANKS, SQUARES, type Piece, type Role, type Square } from '@/core'
import type { BoardPieces } from './types'

const ROLE_CHARS: Record<Role, string> = {
  pawn: 'p',
  knight: 'n',
  bishop: 'b',
  rook: 'r',
  queen: 'q',
  king: 'k',
}

/** Piece-placement part of a FEN ("rnbqkbnr/pppppppp/8/…"), the format chessground reads. */
export function placementFen(pieces: BoardPieces): string {
  return [...RANKS]
    .reverse()
    .map((rank) => {
      let row = ''
      let empty = 0
      for (const file of FILES) {
        const piece = pieces[`${file}${rank}`]
        if (!piece) {
          empty += 1
          continue
        }
        if (empty) row += empty
        empty = 0
        const char = ROLE_CHARS[piece.role]
        row += piece.color === 'white' ? char.toUpperCase() : char
      }
      return empty ? row + empty : row
    })
    .join('/')
}

/** Order-independent key, for detecting whether the pieces really changed. */
export const piecesKey = (pieces: BoardPieces): string => placementFen(pieces)

export function piecesFromEntries(entries: Iterable<[string, Piece]>): BoardPieces {
  const valid = new Set<string>(SQUARES)
  const pieces: Partial<Record<Square, Piece>> = {}
  for (const [square, piece] of entries) {
    if (valid.has(square)) pieces[square as Square] = { color: piece.color, role: piece.role }
  }
  return pieces
}
