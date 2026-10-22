import type { PromotionRole, Square } from './types'
import { isSquare } from './types'

/** A move in standard-chess coordinates. Castling is the king moving two files (e1g1). */
export interface Move {
  readonly from: Square
  readonly to: Square
  readonly promotion?: PromotionRole
}

const PROMOTION_CHARS: Record<string, PromotionRole> = {
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
}
const CHAR_BY_PROMOTION: Record<PromotionRole, string> = {
  queen: 'q',
  rook: 'r',
  bishop: 'b',
  knight: 'n',
}

/** Parses long algebraic / UCI notation ("e2e4", "e7e8q"). Does not check legality. */
export function parseUci(uci: string): Move | undefined {
  const match = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/.exec(uci.trim().toLowerCase())
  if (!match) return undefined
  const [, from, to, promotion] = match
  if (!from || !to || !isSquare(from) || !isSquare(to)) return undefined
  return promotion
    ? { from, to, promotion: PROMOTION_CHARS[promotion] as PromotionRole }
    : { from, to }
}

export function makeUci(move: Move): string {
  return `${move.from}${move.to}${move.promotion ? CHAR_BY_PROMOTION[move.promotion] : ''}`
}

export const movesEqual = (a: Move, b: Move): boolean =>
  a.from === b.from && a.to === b.to && a.promotion === b.promotion
