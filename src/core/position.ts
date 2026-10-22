import { Chess } from 'chessops/chess'
import { makeFen as chessopsMakeFen } from 'chessops/fen'
import { makeSan, parseSan } from 'chessops/san'
import { makeSquare, parseSquare } from 'chessops/util'
import {
  fromChessopsMove,
  fromChessopsSetup,
  toChessopsMove,
  toChessopsSetup,
} from './chessops-adapter'
import { createIssue, hasErrors, type ValidationIssue } from './issues'
import { movesEqual, type Move } from './move'
import { makeFen, parseFen, startingSetup, type Setup } from './setup'
import { validateSetup } from './validation'
import {
  PROMOTION_ROLES,
  err,
  ok,
  isSquare,
  type Color,
  type Piece,
  type Result,
  type Square,
} from './types'

export type PositionStatus = 'ongoing' | 'checkmate' | 'stalemate' | 'insufficientMaterial'

/** A legal chess position. Immutable: `play` returns a new position. */
export class Position {
  private readonly chess: Chess

  private constructor(chess: Chess) {
    this.chess = chess
  }

  static start(): Position {
    return new Position(Chess.default())
  }

  /** Fails with every error found by `validateSetup`; warnings do not block. */
  static fromSetup(setup: Setup): Result<Position, ValidationIssue[]> {
    const issues = validateSetup(setup)
    if (hasErrors(issues)) return err(issues.filter((i) => i.severity === 'error'))
    const chess = Chess.fromSetup(toChessopsSetup(setup))
    if (chess.isErr) return err([createIssue('invalidPosition')])
    return ok(new Position(chess.value))
  }

  static fromFen(fen: string): Result<Position, ValidationIssue[]> {
    const setup = parseFen(fen)
    return setup.ok ? Position.fromSetup(setup.value) : setup
  }

  /** Canonical FEN: the en passant square appears only when a capture is actually legal. */
  get fen(): string {
    return chessopsMakeFen(this.chess.toSetup())
  }

  /** The position as an editable setup (same canonical rules as `fen`). */
  get setup(): Setup {
    const converted = fromChessopsSetup(this.chess.toSetup())
    if (converted.kind !== 'ok') throw new Error('A standard position always converts to a setup')
    return converted.setup
  }

  get turn(): Color {
    return this.chess.turn
  }

  get fullmoves(): number {
    return this.chess.fullmoves
  }

  get isCheck(): boolean {
    return this.chess.isCheck()
  }

  get status(): PositionStatus {
    if (this.chess.isCheckmate()) return 'checkmate'
    if (this.chess.isStalemate()) return 'stalemate'
    if (this.chess.isInsufficientMaterial()) return 'insufficientMaterial'
    return 'ongoing'
  }

  /** The winner when the game is over by checkmate. */
  get winner(): Color | undefined {
    return this.status === 'checkmate' ? (this.turn === 'white' ? 'black' : 'white') : undefined
  }

  pieceAt(square: Square): Piece | undefined {
    const piece = this.chess.board.get(parseSquare(square))
    return piece && { color: piece.color, role: piece.role }
  }

  /** Every legal move; promotions are expanded into four moves. */
  legalMoves(): Move[] {
    const moves: Move[] = []
    for (const [from, tos] of this.destinations()) {
      for (const to of tos) {
        const isPromotion = this.pieceAt(from)?.role === 'pawn' && (to[1] === '8' || to[1] === '1')
        if (isPromotion) {
          for (const promotion of PROMOTION_ROLES) moves.push({ from, to, promotion })
        } else moves.push({ from, to })
      }
    }
    return moves
  }

  /** Legal target squares per origin square (castling targets the king's two-file destination). */
  destinations(): Map<Square, Square[]> {
    const result = new Map<Square, Square[]>()
    for (const [index, targets] of this.chess.allDests()) {
      const from = makeSquare(index)
      if (!isSquare(from)) continue
      const tos: Square[] = []
      for (const target of targets) {
        const move = fromChessopsMove(this.chess, { from: index, to: target })
        tos.push(move.to)
      }
      result.set(from, tos)
    }
    return result
  }

  isLegal(move: Move): boolean {
    const converted = toChessopsMove(this.chess, move)
    if (!converted) return false
    if (!('from' in converted)) return false
    const needsPromotion =
      this.pieceAt(move.from)?.role === 'pawn' && (move.to[1] === '8' || move.to[1] === '1')
    if (needsPromotion !== (move.promotion !== undefined)) return false
    return this.chess.isLegal(converted)
  }

  play(move: Move): Result<Position, ValidationIssue> {
    if (!this.isLegal(move))
      return err(createIssue('illegalMove', { token: `${move.from}${move.to}` }))
    const converted = toChessopsMove(this.chess, move)
    if (!converted) return err(createIssue('illegalMove'))
    const next = this.chess.clone()
    next.play(converted)
    return ok(new Position(next))
  }

  /** SAN for a legal move ("Nf3", "O-O", "exd8=Q+"), or undefined if it is illegal. */
  san(move: Move): string | undefined {
    if (!this.isLegal(move)) return undefined
    const converted = toChessopsMove(this.chess, move)
    return converted && makeSan(this.chess, converted)
  }

  /** Parses SAN ("Nf3", "O-O") into a legal move of this position. */
  parseSan(san: string): Move | undefined {
    const move = parseSan(this.chess, san.trim())
    return move && fromChessopsMove(this.chess, move)
  }

  /**
   * Plays a line (e.g. an engine's principal variation) and returns its SAN,
   * stopping at the first illegal move.
   */
  lineToSan(line: readonly Move[]): string[] {
    const sans: string[] = []
    let current = new Position(this.chess)
    for (const move of line) {
      const san = current.san(move)
      const next = current.play(move)
      if (san === undefined || !next.ok) break
      sans.push(san)
      current = next.value
    }
    return sans
  }

  equals(other: Position): boolean {
    return this.fen === other.fen
  }
}

export { movesEqual }
export const START_FEN = makeFen(startingSetup())
