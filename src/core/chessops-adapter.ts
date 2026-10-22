/**
 * The only place that converts between the domain's plain data and chessops
 * objects. The rest of `core/` (and every other layer) uses the plain types, so
 * chessops stays swappable.
 */
import { Board } from 'chessops'
import { Chess, IllegalSetup, isImpossibleCheck } from 'chessops/chess'
import { SquareSet } from 'chessops/squareSet'
import type { Setup as ChessopsSetup } from 'chessops/setup'
import type { Move as ChessopsMove } from 'chessops/types'
import {
  makeSquare,
  makeUci as makeChessopsUci,
  parseSquare,
  parseUci as parseChessopsUci,
} from 'chessops/util'
import { makeUci, parseUci, type Move } from './move'
import { COLORS, SQUARES, isSquare, type Color, type Piece, type Square } from './types'

export const CASTLING_SIDES = ['kingSide', 'queenSide'] as const
export type CastlingSide = (typeof CASTLING_SIDES)[number]

/** Plain (chessops-free) shape of a position setup; `setup.ts` re-exports it as `Setup`. */
export interface PlainSetup {
  readonly pieces: Readonly<Partial<Record<Square, Piece>>>
  readonly turn: Color
  readonly castling: Readonly<Record<Color, Readonly<Record<CastlingSide, boolean>>>>
  readonly epSquare: Square | undefined
  readonly halfmoves: number
  readonly fullmoves: number
}

/** The rook square that carries each castling right. */
export const CASTLING_ROOK_SQUARES: Record<Color, Record<CastlingSide, Square>> = {
  white: { kingSide: 'h1', queenSide: 'a1' },
  black: { kingSide: 'h8', queenSide: 'a8' },
}

export function toChessopsSetup(setup: PlainSetup): ChessopsSetup {
  const board = Board.empty()
  for (const square of SQUARES) {
    const piece = setup.pieces[square]
    if (piece) board.set(parseSquare(square), { color: piece.color, role: piece.role })
  }
  let castlingRights = SquareSet.empty()
  for (const color of COLORS) {
    for (const side of CASTLING_SIDES) {
      if (setup.castling[color][side]) {
        castlingRights = castlingRights.with(parseSquare(CASTLING_ROOK_SQUARES[color][side]))
      }
    }
  }
  return {
    board,
    pockets: undefined,
    turn: setup.turn,
    castlingRights,
    epSquare: setup.epSquare ? parseSquare(setup.epSquare) : undefined,
    remainingChecks: undefined,
    halfmoves: setup.halfmoves,
    fullmoves: setup.fullmoves,
  }
}

export type FromChessopsSetup =
  | { readonly kind: 'ok'; readonly setup: PlainSetup }
  | { readonly kind: 'variant' }
  | { readonly kind: 'nonStandardCastling' }

/** Converts a parsed chessops setup; variants and Chess960-style castling rooks are rejected. */
export function fromChessopsSetup(setup: ChessopsSetup): FromChessopsSetup {
  if (setup.pockets || setup.remainingChecks) return { kind: 'variant' }

  const pieces: Partial<Record<Square, Piece>> = {}
  for (const [index, piece] of setup.board) {
    const square = makeSquare(index)
    if (isSquare(square)) pieces[square] = { color: piece.color, role: piece.role }
  }

  const castling = {
    white: { kingSide: false, queenSide: false },
    black: { kingSide: false, queenSide: false },
  }
  const standardRooks = new Set<number>()
  for (const color of COLORS) {
    for (const side of CASTLING_SIDES) {
      const rook = parseSquare(CASTLING_ROOK_SQUARES[color][side])
      standardRooks.add(rook)
      castling[color][side] = setup.castlingRights.has(rook)
    }
  }
  for (const rook of setup.castlingRights) {
    if (!standardRooks.has(rook)) return { kind: 'nonStandardCastling' }
  }

  const ep = setup.epSquare === undefined ? undefined : makeSquare(setup.epSquare)
  return {
    kind: 'ok',
    setup: {
      pieces,
      turn: setup.turn,
      castling,
      epSquare: ep && isSquare(ep) ? ep : undefined,
      halfmoves: setup.halfmoves,
      fullmoves: setup.fullmoves,
    },
  }
}

/** Domain move (castling as e1g1) → chessops move (castling as king takes own rook). */
export function toChessopsMove(pos: Chess, move: Move): ChessopsMove | undefined {
  const parsed = parseChessopsUci(makeUci(move))
  if (!parsed || !('from' in parsed)) return parsed
  if (!pos.board.king.has(parsed.from)) return parsed
  // "King takes own rook" is chessops' castling spelling, not a domain move.
  if (pos.board[pos.turn].has(parsed.to)) return undefined
  const delta = parsed.to - parsed.from
  if (Math.abs(delta) === 2) {
    const rook = pos.castles.rook[pos.turn][delta > 0 ? 'h' : 'a']
    if (rook !== undefined) return { from: parsed.from, to: rook }
  }
  return parsed
}

/** chessops move (castling as king takes own rook) → domain move (castling as e1g1). */
export function fromChessopsMove(pos: Chess, move: ChessopsMove): Move {
  const parsed = parseUci(makeChessopsUci(move))
  if (!parsed) throw new Error('chessops produced a move outside standard chess')
  if (!('from' in move)) return parsed
  const mover = pos.board.get(move.from)
  const target = pos.board.get(move.to)
  if (mover?.role === 'king' && target?.role === 'rook' && target.color === mover.color) {
    const to = `${move.to > move.from ? 'g' : 'c'}${mover.color === 'white' ? '1' : '8'}`
    if (isSquare(to)) return { from: parsed.from, to }
  }
  return parsed
}

export type SetupAnalysis =
  | { readonly kind: 'ok'; readonly impossibleCheck: boolean }
  | { readonly kind: 'oppositeCheck' }
  | { readonly kind: 'invalid' }

/** Asks chessops whether a setup forms a legal position (kings/backranks are checked by the caller). */
export function analyzeSetup(setup: PlainSetup): SetupAnalysis {
  const result = Chess.fromSetup(toChessopsSetup(setup))
  if (result.isOk) return { kind: 'ok', impossibleCheck: isImpossibleCheck(result.value) }
  return result.error.message === (IllegalSetup.OppositeCheck as string)
    ? { kind: 'oppositeCheck' }
    : { kind: 'invalid' }
}
