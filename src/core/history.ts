import type { ValidationIssue } from './issues'
import type { Move } from './move'
import { movesEqual } from './move'
import { Position } from './position'
import { ok, type Result } from './types'

export interface HistoryEntry {
  readonly move: Move
  readonly san: string
  /** Position after the move. */
  readonly position: Position
}

/**
 * Immutable move list with a cursor, for undo/redo. `cursor` is the number of
 * entries currently applied; entries beyond it are the redo stack.
 */
export interface MoveHistory {
  readonly start: Position
  readonly entries: readonly HistoryEntry[]
  readonly cursor: number
}

export const createHistory = (start: Position = Position.start()): MoveHistory => ({
  start,
  entries: [],
  cursor: 0,
})

export const currentPosition = (history: MoveHistory): Position =>
  history.cursor === 0
    ? history.start
    : (history.entries[history.cursor - 1]?.position ?? history.start)

export const canUndo = (history: MoveHistory): boolean => history.cursor > 0
export const canRedo = (history: MoveHistory): boolean => history.cursor < history.entries.length

/** The entries up to the cursor — the game as currently shown. */
export const playedEntries = (history: MoveHistory): readonly HistoryEntry[] =>
  history.entries.slice(0, history.cursor)

/**
 * Plays a move from the current position. Replaying the next redo move just
 * advances; any other move discards the redo stack.
 */
export function pushMove(history: MoveHistory, move: Move): Result<MoveHistory, ValidationIssue> {
  const next = history.entries[history.cursor]
  if (next && movesEqual(next.move, move)) return ok({ ...history, cursor: history.cursor + 1 })

  const before = currentPosition(history)
  const after = before.play(move)
  if (!after.ok) return after
  const entry: HistoryEntry = { move, san: before.san(move) ?? '', position: after.value }
  return ok({ ...history, entries: [...playedEntries(history), entry], cursor: history.cursor + 1 })
}

export const undo = (history: MoveHistory): MoveHistory =>
  canUndo(history) ? { ...history, cursor: history.cursor - 1 } : history

export const redo = (history: MoveHistory): MoveHistory =>
  canRedo(history) ? { ...history, cursor: history.cursor + 1 } : history

/** Jumps to `cursor` plies from the start, clamped to the available range. */
export const goTo = (history: MoveHistory, cursor: number): MoveHistory => ({
  ...history,
  cursor: Math.min(Math.max(0, cursor), history.entries.length),
})

export const goToStart = (history: MoveHistory): MoveHistory => goTo(history, 0)
export const goToEnd = (history: MoveHistory): MoveHistory => goTo(history, history.entries.length)
