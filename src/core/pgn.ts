import {
  defaultGame,
  extend,
  makePgn as chessopsMakePgn,
  parsePgn as chessopsParsePgn,
  type PgnNodeData,
} from 'chessops/pgn'
import { createHistory, currentPosition, pushMove, type MoveHistory } from './history'
import { createIssue, type ValidationIssue } from './issues'
import { Position, START_FEN } from './position'
import { err, ok, type Result } from './types'

export type GameResult = '1-0' | '0-1' | '1/2-1/2' | '*'
const RESULTS: readonly string[] = ['1-0', '0-1', '1/2-1/2', '*']

export interface PgnGame {
  readonly headers: Readonly<Record<string, string>>
  /** Mainline of the first game, cursor at the last move. Variations and comments are dropped. */
  readonly history: MoveHistory
  readonly result: GameResult
}

const STANDARD_VARIANTS = new Set(['', 'standard', 'chess', 'from position', 'fromposition'])

/** Imports the first game of a PGN (headers, optional FEN start position, mainline). */
export function parsePgn(text: string): Result<PgnGame, ValidationIssue[]> {
  const games = text.trim() ? chessopsParsePgn(text) : []
  const game = games[0]
  if (!game) return err([createIssue('pgnNoGame')])

  const variant = (game.headers.get('Variant') ?? '').trim().toLowerCase()
  if (!STANDARD_VARIANTS.has(variant)) return err([createIssue('unsupportedVariant')])

  const fen = game.headers.get('FEN')
  const start = fen ? Position.fromFen(fen) : ok(Position.start())
  if (!start.ok) return start

  let history = createHistory(start.value)
  let ply = 0
  for (const node of game.moves.mainline()) {
    ply += 1
    const move = currentPosition(history).parseSan(node.san)
    const next = move && pushMove(history, move)
    if (!next?.ok) return err([createIssue('pgnIllegalMove', { ply, token: node.san })])
    history = next.value
  }

  const result = game.headers.get('Result') ?? '*'
  return ok({
    headers: Object.fromEntries(game.headers),
    history,
    result: RESULTS.includes(result) ? (result as GameResult) : '*',
  })
}

export interface MakePgnOptions {
  readonly headers?: Readonly<Record<string, string>>
  readonly result?: GameResult
}

/** Exports every move of the history (not just up to the cursor), with the Seven Tag Roster. */
export function makePgn(history: MoveHistory, options: MakePgnOptions = {}): string {
  const game = defaultGame<PgnNodeData>(() => new Map())
  const roster = { Event: '?', Site: '?', Date: '????.??.??', Round: '?', White: '?', Black: '?' }
  const headers = { ...roster, ...options.headers, Result: options.result ?? '*' }
  for (const [key, value] of Object.entries(headers)) game.headers.set(key, value)
  if (history.start.fen !== START_FEN) {
    game.headers.set('SetUp', '1')
    game.headers.set('FEN', history.start.fen)
  }

  extend(
    game.moves,
    history.entries.map((entry) => ({ san: entry.san })),
  )
  return chessopsMakePgn(game)
}
