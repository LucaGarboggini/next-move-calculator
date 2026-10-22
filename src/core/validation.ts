import { analyzeSetup } from './chessops-adapter'
import { createIssue, hasErrors, type ValidationIssue } from './issues'
import { CASTLING_SIDES, canHoldCastlingRight, isPossibleEpSquare, type Setup } from './setup'
import { COLORS, FILES, SQUARES, opposite, type Color, type Square } from './types'

const fileIndex = (square: Square) => FILES.indexOf(square[0] as (typeof FILES)[number])
const rankIndex = (square: Square) => Number(square[1])

const squaresOf = (setup: Setup, color: Color, role: string): Square[] =>
  SQUARES.filter((s) => {
    const piece = setup.pieces[s]
    return piece?.color === color && piece.role === role
  })

/**
 * Lists everything wrong (errors) or suspicious (warnings) about a setup, so the
 * editor can show all reasons at once. A setup can be analyzed iff there are no errors.
 */
export function validateSetup(setup: Setup): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Counters
  if (!Number.isInteger(setup.halfmoves) || setup.halfmoves < 0) {
    issues.push(createIssue('invalidHalfmoves'))
  }
  if (!Number.isInteger(setup.fullmoves) || setup.fullmoves < 1) {
    issues.push(createIssue('invalidFullmoves'))
  }

  // Kings
  const kings: Record<Color, Square[]> = {
    white: squaresOf(setup, 'white', 'king'),
    black: squaresOf(setup, 'black', 'king'),
  }
  for (const color of COLORS) {
    if (kings[color].length === 0) issues.push(createIssue('missingKing', { color }))
    if (kings[color].length > 1) issues.push(createIssue('multipleKings', { color }))
  }
  const [whiteKing, blackKing] = [kings.white[0], kings.black[0]]
  const adjacent =
    kings.white.length === 1 &&
    kings.black.length === 1 &&
    whiteKing !== undefined &&
    blackKing !== undefined &&
    Math.max(
      Math.abs(fileIndex(whiteKing) - fileIndex(blackKing)),
      Math.abs(rankIndex(whiteKing) - rankIndex(blackKing)),
    ) <= 1
  if (adjacent) issues.push(createIssue('kingsAdjacent'))

  // Pawns on the first or last rank
  for (const square of SQUARES) {
    if (setup.pieces[square]?.role === 'pawn' && (square[1] === '1' || square[1] === '8')) {
      issues.push(createIssue('pawnsOnBackRank', { square }))
    }
  }

  // Castling and en passant must be physically possible
  for (const color of COLORS) {
    for (const side of CASTLING_SIDES) {
      if (setup.castling[color][side] && !canHoldCastlingRight(setup, color, side)) {
        issues.push(createIssue('invalidCastling', { color, side }))
      }
    }
  }
  if (setup.epSquare && !isPossibleEpSquare(setup, setup.epSquare)) {
    issues.push(createIssue('invalidEnPassant', { square: setup.epSquare }))
  }

  // Implausible material (still analyzable, hence warnings)
  for (const color of COLORS) {
    const count = (role: string) => squaresOf(setup, color, role).length
    const total = SQUARES.filter((s) => setup.pieces[s]?.color === color).length
    const pawns = count('pawn')
    const promoted =
      Math.max(count('queen') - 1, 0) +
      Math.max(count('rook') - 2, 0) +
      Math.max(count('bishop') - 2, 0) +
      Math.max(count('knight') - 2, 0)
    if (total > 16) issues.push(createIssue('tooManyPieces', { color }))
    if (pawns > 8) issues.push(createIssue('tooManyPawns', { color }))
    else if (pawns + promoted > 8) issues.push(createIssue('tooManyPromotions', { color }))
  }

  // Remaining rules (checks) need the move generator; only ask when the basics hold
  const structural = hasErrors(issues)
  if (!structural) {
    const analysis = analyzeSetup(setup)
    if (analysis.kind === 'oppositeCheck') {
      issues.push(createIssue('sideNotToMoveInCheck', { color: opposite(setup.turn) }))
    } else if (analysis.kind === 'invalid') {
      issues.push(createIssue('invalidPosition'))
    } else if (analysis.impossibleCheck) {
      issues.push(createIssue('impossibleCheck', { color: setup.turn }))
    }
  }

  return issues
}

export const isSetupValid = (setup: Setup): boolean => !hasErrors(validateSetup(setup))
