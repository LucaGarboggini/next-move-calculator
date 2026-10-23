import {
  CASTLING_SIDES,
  CASTLING_ROOK_SQUARES,
  fromChessopsSetup,
  toChessopsSetup,
} from './chessops-adapter'
import type { CastlingSide, PlainSetup } from './chessops-adapter'
import { createIssue, type ValidationIssue } from './issues'
import {
  COLORS,
  FILES,
  SQUARES,
  err,
  ok,
  type Color,
  type Piece,
  type Result,
  type Square,
} from './types'
import { makeFen as chessopsMakeFen, parseFen as chessopsParseFen } from 'chessops/fen'

export type { CastlingSide }
export { CASTLING_SIDES }

/** A not-necessarily-legal position: what the editor edits and a FEN describes. Immutable. */
export type Setup = PlainSetup

export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
export const EMPTY_FEN = '8/8/8/8/8/8/8/8 w - - 0 1'

const NO_CASTLING = {
  white: { kingSide: false, queenSide: false },
  black: { kingSide: false, queenSide: false },
} as const

export const emptySetup = (): Setup => ({
  pieces: {},
  turn: 'white',
  castling: NO_CASTLING,
  epSquare: undefined,
  halfmoves: 0,
  fullmoves: 1,
})

export function startingSetup(): Setup {
  const result = parseFen(STARTING_FEN)
  if (!result.ok) throw new Error('Starting FEN must parse')
  return result.value
}

// --- Editing (all return new setups) ---------------------------------------

export function setPiece(setup: Setup, square: Square, piece: Piece | undefined): Setup {
  const pieces = { ...setup.pieces }
  if (piece) pieces[square] = piece
  else delete pieces[square]
  return { ...setup, pieces }
}

export const setTurn = (setup: Setup, turn: Color): Setup => ({ ...setup, turn })

export const setEpSquare = (setup: Setup, epSquare: Square | undefined): Setup => ({
  ...setup,
  epSquare,
})

/**
 * Replaces the pieces. Castling rights the new pieces cannot hold (king or rook gone from its
 * starting square) are dropped, as moving either piece would lose them in a game.
 */
export const placePieces = (setup: Setup, pieces: Setup['pieces']): Setup =>
  dropImpossibleCastling({ ...setup, pieces })

/**
 * Moves a piece the way the editor does: to any square, replacing what is there; the side to
 * move does not change. A king's two-file move from its starting square castles when that
 * castling right is set and nothing stands between king and rook: the rook comes along. Rights
 * the moved pieces can no longer hold are dropped (so castling uses up both of that color's).
 */
export function movePiece(setup: Setup, from: Square, to: Square): Setup {
  const piece = setup.pieces[from]
  if (!piece || from === to) return setup
  let pieces = { ...setup.pieces, [to]: piece }
  delete pieces[from]
  const castling = castlingByKingMove(setup, from, to)
  if (castling) {
    const { color, side } = castling
    const { [CASTLING_ROOK_SQUARES[color][side]]: rook, ...rest } = pieces
    pieces = { ...rest, [CASTLING_MOVES[color][side].rook]: rook }
  }
  return placePieces(setup, pieces)
}

export function setCastlingRight(
  setup: Setup,
  color: Color,
  side: CastlingSide,
  value: boolean,
): Setup {
  return {
    ...setup,
    castling: { ...setup.castling, [color]: { ...setup.castling[color], [side]: value } },
  }
}

// --- Queries ---------------------------------------------------------------

export const pieceCount = (setup: Setup, color: Color, role?: Piece['role']): number =>
  SQUARES.filter((s) => {
    const piece = setup.pieces[s]
    return piece?.color === color && (role === undefined || piece.role === role)
  }).length

/** Standard castling: where king and rook land, and the squares between them that must be empty. */
const CASTLING_MOVES: Record<
  Color,
  Record<CastlingSide, { king: Square; rook: Square; between: readonly Square[] }>
> = {
  white: {
    kingSide: { king: 'g1', rook: 'f1', between: ['f1', 'g1'] },
    queenSide: { king: 'c1', rook: 'd1', between: ['b1', 'c1', 'd1'] },
  },
  black: {
    kingSide: { king: 'g8', rook: 'f8', between: ['f8', 'g8'] },
    queenSide: { king: 'c8', rook: 'd8', between: ['b8', 'c8', 'd8'] },
  },
}

/** The castling a king move from `from` to `to` performs in this setup, if any. */
function castlingByKingMove(
  setup: Setup,
  from: Square,
  to: Square,
): { color: Color; side: CastlingSide } | undefined {
  for (const color of COLORS) {
    for (const side of CASTLING_SIDES) {
      const castling = CASTLING_MOVES[color][side]
      if (from !== (color === 'white' ? 'e1' : 'e8') || to !== castling.king) continue
      const allowed = setup.castling[color][side] && canHoldCastlingRight(setup, color, side)
      const clear = castling.between.every((square) => !setup.pieces[square])
      return allowed && clear ? { color, side } : undefined
    }
  }
  return undefined
}

/** Whether the king and rook stand where `color` needs them to keep that castling right. */
export function canHoldCastlingRight(setup: Setup, color: Color, side: CastlingSide): boolean {
  const king = setup.pieces[color === 'white' ? 'e1' : 'e8']
  const rook = setup.pieces[CASTLING_ROOK_SQUARES[color][side]]
  return (
    king?.color === color && king.role === 'king' && rook?.color === color && rook.role === 'rook'
  )
}

/** Whether `square` could be the en passant target given the pieces and the side to move. */
export function isPossibleEpSquare(setup: Setup, square: Square): boolean {
  const file = square[0]
  const rank = square[1]
  const whiteToMove = setup.turn === 'white'
  if (rank !== (whiteToMove ? '6' : '3') || !file) return false
  const behind = `${file}${whiteToMove ? '7' : '2'}` as Square
  const pushed = `${file}${whiteToMove ? '5' : '4'}` as Square
  const pawn = setup.pieces[pushed]
  return (
    !setup.pieces[square] &&
    !setup.pieces[behind] &&
    pawn?.role === 'pawn' &&
    pawn.color === (whiteToMove ? 'black' : 'white')
  )
}

/** Squares the editor may offer as en passant targets. */
export const candidateEpSquares = (setup: Setup): Square[] =>
  FILES.map((f): Square => `${f}${setup.turn === 'white' ? '6' : '3'}`).filter((s) =>
    isPossibleEpSquare(setup, s),
  )

function dropImpossibleCastling(setup: Setup): Setup {
  let result = setup
  for (const color of COLORS) {
    for (const side of CASTLING_SIDES) {
      if (result.castling[color][side] && !canHoldCastlingRight(result, color, side)) {
        result = setCastlingRight(result, color, side, false)
      }
    }
  }
  return result
}

/** Drops castling rights and en passant squares that cannot exist, and fixes the counters. */
export function sanitizeSetup(setup: Setup): Setup {
  let result = dropImpossibleCastling(setup)
  if (result.epSquare && !isPossibleEpSquare(result, result.epSquare)) {
    result = setEpSquare(result, undefined)
  }
  return {
    ...result,
    halfmoves: Math.max(0, Math.trunc(result.halfmoves) || 0),
    fullmoves: Math.max(1, Math.trunc(result.fullmoves) || 1),
  }
}

// --- FEN -------------------------------------------------------------------

const FEN_ERRORS: Record<string, Parameters<typeof createIssue>[0]> = {
  ERR_FEN: 'fenFormat',
  ERR_BOARD: 'fenBoard',
  ERR_TURN: 'fenTurn',
  ERR_CASTLING: 'fenCastling',
  ERR_EP_SQUARE: 'fenEnPassant',
  ERR_HALFMOVES: 'fenHalfmoves',
  ERR_FULLMOVES: 'fenFullmoves',
  ERR_POCKETS: 'unsupportedVariant',
  ERR_REMAINING_CHECKS: 'fenFormat',
}

/**
 * Parses a FEN into a setup. Syntax only — use `validateSetup` for legality.
 * Like most tools it accepts a FEN with trailing fields missing ("board w KQkq").
 */
export function parseFen(fen: string): Result<Setup, ValidationIssue[]> {
  const parsed = chessopsParseFen(fen.trim())
  if (parsed.isErr) {
    return err([createIssue(FEN_ERRORS[parsed.error.message] ?? 'fenFormat')])
  }
  const converted = fromChessopsSetup(parsed.value)
  if (converted.kind === 'variant') return err([createIssue('unsupportedVariant')])
  if (converted.kind === 'nonStandardCastling') return err([createIssue('unsupportedCastling')])
  return ok(converted.setup)
}

/** Writes the setup exactly as given (castling as KQkq, en passant square as set). */
export function makeFen(setup: Setup): string {
  const fields = chessopsMakeFen(toChessopsSetup(setup)).split(' ')
  const castling = [
    setup.castling.white.kingSide ? 'K' : '',
    setup.castling.white.queenSide ? 'Q' : '',
    setup.castling.black.kingSide ? 'k' : '',
    setup.castling.black.queenSide ? 'q' : '',
  ].join('')
  fields[2] = castling || '-'
  return fields.join(' ')
}
