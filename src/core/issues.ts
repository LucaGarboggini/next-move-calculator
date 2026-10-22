import type { CastlingSide } from './chessops-adapter'
import type { Color, Square } from './types'

export const ISSUE_CODES = [
  // FEN / PGN syntax
  'fenFormat',
  'fenBoard',
  'fenTurn',
  'fenCastling',
  'fenEnPassant',
  'fenHalfmoves',
  'fenFullmoves',
  'unsupportedVariant',
  'unsupportedCastling',
  'emptyInput',
  'pgnNoGame',
  'pgnIllegalMove',
  // Setup validation (errors)
  'missingKing',
  'multipleKings',
  'kingsAdjacent',
  'pawnsOnBackRank',
  'sideNotToMoveInCheck',
  'invalidCastling',
  'invalidEnPassant',
  'invalidHalfmoves',
  'invalidFullmoves',
  'invalidPosition',
  // Setup validation (warnings: playable but implausible)
  'tooManyPieces',
  'tooManyPawns',
  'tooManyPromotions',
  'impossibleCheck',
  // Playing moves
  'illegalMove',
] as const
export type IssueCode = (typeof ISSUE_CODES)[number]

export type IssueSeverity = 'error' | 'warning'

/**
 * A reason a FEN/PGN/setup/move was rejected (or looks suspicious). Features
 * translate by `code` through i18n; `message` is an English fallback for logs
 * and tests.
 */
export interface ValidationIssue {
  readonly code: IssueCode
  readonly severity: IssueSeverity
  readonly message: string
  readonly color?: Color
  readonly side?: CastlingSide
  readonly square?: Square
  readonly ply?: number
  readonly token?: string
}

export type IssueDetails = Partial<
  Pick<ValidationIssue, 'color' | 'side' | 'square' | 'ply' | 'token'>
>

type Definition = { severity: IssueSeverity; message: (d: IssueDetails) => string }

const who = (d: IssueDetails) => d.color ?? 'a side'
const sideName = (d: IssueDetails) => (d.side === 'queenSide' ? 'queen-side' : 'king-side')

const DEFINITIONS: Record<IssueCode, Definition> = {
  fenFormat: { severity: 'error', message: () => 'The FEN has the wrong number of fields.' },
  fenBoard: { severity: 'error', message: () => 'The piece placement in the FEN is invalid.' },
  fenTurn: { severity: 'error', message: () => 'The side to move must be "w" or "b".' },
  fenCastling: { severity: 'error', message: () => 'The castling field in the FEN is invalid.' },
  fenEnPassant: {
    severity: 'error',
    message: () => 'The en passant field must be "-" or a square such as "e3".',
  },
  fenHalfmoves: {
    severity: 'error',
    message: () => 'The halfmove clock must be a non-negative number.',
  },
  fenFullmoves: { severity: 'error', message: () => 'The move number must be a positive number.' },
  unsupportedVariant: {
    severity: 'error',
    message: () => 'Only standard chess is supported, not variants.',
  },
  unsupportedCastling: {
    severity: 'error',
    message: () => 'Castling with rooks off their corner squares (Chess960) is not supported.',
  },
  emptyInput: { severity: 'error', message: () => 'Paste a FEN or a PGN first.' },
  pgnNoGame: { severity: 'error', message: () => 'No game was found in the PGN.' },
  pgnIllegalMove: {
    severity: 'error',
    message: (d) => `Move ${d.ply ?? '?'} ("${d.token ?? '?'}") is illegal or unreadable.`,
  },
  missingKing: { severity: 'error', message: (d) => `${who(d)} needs a king.` },
  multipleKings: { severity: 'error', message: (d) => `${who(d)} can only have one king.` },
  kingsAdjacent: { severity: 'error', message: () => 'The two kings cannot touch.' },
  pawnsOnBackRank: {
    severity: 'error',
    message: (d) =>
      `A pawn cannot stand on the first or last rank${d.square ? ` (${d.square})` : ''}.`,
  },
  sideNotToMoveInCheck: {
    severity: 'error',
    message: (d) => `${who(d)} is in check but it is not their turn.`,
  },
  invalidCastling: {
    severity: 'error',
    message: (d) =>
      `${who(d)} cannot castle ${sideName(d)}: the king and rook must be on their starting squares.`,
  },
  invalidEnPassant: {
    severity: 'error',
    message: (d) => `The en passant square${d.square ? ` ${d.square}` : ''} is not possible here.`,
  },
  invalidHalfmoves: {
    severity: 'error',
    message: () => 'The halfmove clock must be a whole number, 0 or more.',
  },
  invalidFullmoves: {
    severity: 'error',
    message: () => 'The move number must be a whole number, 1 or more.',
  },
  invalidPosition: { severity: 'error', message: () => 'This position is not legal.' },
  tooManyPieces: { severity: 'warning', message: (d) => `${who(d)} has more than 16 pieces.` },
  tooManyPawns: { severity: 'warning', message: (d) => `${who(d)} has more than 8 pawns.` },
  tooManyPromotions: {
    severity: 'warning',
    message: (d) => `${who(d)} has more extra pieces than the pawns could have promoted.`,
  },
  impossibleCheck: {
    severity: 'warning',
    message: () => 'The check on the side to move could not arise in a real game.',
  },
  illegalMove: { severity: 'error', message: () => 'That move is not legal in this position.' },
}

export function createIssue(code: IssueCode, details: IssueDetails = {}): ValidationIssue {
  const { severity, message } = DEFINITIONS[code]
  return { code, severity, message: message(details), ...details }
}

export const hasErrors = (issues: readonly ValidationIssue[]): boolean =>
  issues.some((issue) => issue.severity === 'error')
