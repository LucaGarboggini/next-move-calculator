import { currentPosition, type MoveHistory } from './history'
import { createIssue, type ValidationIssue } from './issues'
import { parsePgn } from './pgn'
import { parseFen, type Setup } from './setup'
import { err, ok, type Result } from './types'

/** What pasted text turned into: the position to show and, for a PGN, its moves. */
export interface ImportedPosition {
  /** The position as given (FEN) or at the last move (PGN). Not necessarily legal when from a FEN. */
  readonly setup: Setup
  /** The game, cursor at the last move; null for a bare FEN. */
  readonly game: MoveHistory | null
}

/** A FEN starts with a piece-placement field, which always contains "/". PGN starts with a tag or a move. */
const looksLikeFen = (text: string): boolean =>
  !text.startsWith('[') && (text.split(/\s+/, 1)[0] ?? '').includes('/')

/**
 * Reads pasted text as a FEN or a PGN (first game). A FEN only needs to be
 * well-formed — the editor shows whether the position is legal; a PGN must be a
 * playable game, so its positions are legal by construction.
 */
export function importText(text: string): Result<ImportedPosition, ValidationIssue[]> {
  const trimmed = text.trim()
  if (!trimmed) return err([createIssue('emptyInput')])

  if (looksLikeFen(trimmed)) {
    const setup = parseFen(trimmed)
    return setup.ok ? ok({ setup: setup.value, game: null }) : setup
  }

  const pgn = parsePgn(trimmed)
  if (!pgn.ok) return pgn
  // Free text parses as an empty game; only tags or moves make it a PGN.
  if (pgn.value.history.entries.length === 0 && !trimmed.startsWith('[')) {
    return err([createIssue('pgnNoGame')])
  }
  return ok({ setup: currentPosition(pgn.value.history).setup, game: pgn.value.history })
}
