import { useMemo } from 'react'
import { create } from 'zustand'
import {
  Position,
  createHistory,
  currentPosition,
  emptySetup,
  goTo,
  importText,
  makeFen,
  makePgn,
  pushMove,
  setCastlingRight,
  setEpSquare,
  setTurn,
  startingSetup,
  validateSetup,
  hasErrors,
  type CastlingSide,
  type Color,
  type Move,
  type MoveHistory,
  type Piece,
  type Setup,
  type Square,
  type ValidationIssue,
} from '@/core'

/**
 * The position being edited. Immutable: every change makes a new document, which
 * is what undo and redo step through.
 *
 * `setup` is always what the board shows and need not be legal. `game` is set when
 * the position came from a PGN or from moves played on the board; `setup` then
 * equals the game's position at its cursor.
 */
export interface EditorDocument {
  readonly setup: Setup
  readonly game: MoveHistory | null
}

/** `edit` moves, adds and removes pieces freely; `play` makes legal moves and builds a move list. */
export type EditorMode = 'edit' | 'play'

/** What a tap on the board does in edit mode: place a piece, erase, or nothing (just move pieces). */
export type EditorTool = { kind: 'place'; piece: Piece } | { kind: 'erase' } | null

const UNDO_LIMIT = 200

interface EditorState {
  document: EditorDocument
  past: readonly EditorDocument[]
  future: readonly EditorDocument[]
  orientation: Color
  mode: EditorMode
  tool: EditorTool

  setMode: (mode: EditorMode) => void
  setTool: (tool: EditorTool) => void
  flip: () => void

  /** New piece placement from the board (drag, drop, tap tool, keyboard). */
  setPieces: (pieces: Setup['pieces']) => void
  setTurn: (turn: Color) => void
  setCastling: (color: Color, side: CastlingSide, value: boolean) => void
  setEpSquare: (square: Square | undefined) => void
  /** Empty board, White to move. */
  clear: () => void
  /** Standard starting position. */
  reset: () => void
  /** Loads pasted FEN or PGN; on failure nothing changes and the reasons are returned. */
  load: (text: string) => readonly ValidationIssue[]

  /** `play` mode: plays a legal move from the current position. Returns whether it was made. */
  playMove: (move: Move) => boolean
  /** Shows the position after `ply` moves of the game (0 = before the first). Not an undo step. */
  goToPly: (ply: number) => void

  undo: () => void
  redo: () => void
}

const START_DOCUMENT: EditorDocument = { setup: startingSetup(), game: null }

const edited = (setup: Setup): EditorDocument => ({ setup, game: null })

/** Stable key for tool comparison. */
export const isSameTool = (a: EditorTool, b: EditorTool): boolean =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.kind === b.kind &&
    (a.kind !== 'place' ||
      (b.kind === 'place' && a.piece.color === b.piece.color && a.piece.role === b.piece.role)))

export const useEditorStore = create<EditorState>()((set, get) => {
  /** Makes `next` the current document and remembers the old one for undo. */
  const commit = (next: EditorDocument) => {
    const { document, past } = get()
    if (next === document) return
    set({ document: next, past: [...past, document].slice(-UNDO_LIMIT), future: [] })
  }
  const change = (update: (setup: Setup) => Setup) => commit(edited(update(get().document.setup)))

  return {
    document: START_DOCUMENT,
    past: [],
    future: [],
    orientation: 'white',
    mode: 'edit',
    tool: null,

    setMode: (mode) => set({ mode }),
    setTool: (tool) => set({ tool }),
    flip: () =>
      set(({ orientation }) => ({ orientation: orientation === 'white' ? 'black' : 'white' })),

    setPieces: (pieces) => change((setup) => ({ ...setup, pieces })),
    // A new side to move invalidates any en passant square, which belongs to the other side.
    setTurn: (turn) => change((setup) => setEpSquare(setTurn(setup, turn), undefined)),
    setCastling: (color, side, value) =>
      change((setup) => setCastlingRight(setup, color, side, value)),
    setEpSquare: (square) => change((setup) => setEpSquare(setup, square)),
    clear: () => change(() => emptySetup()),
    reset: () => change(() => startingSetup()),

    load: (text) => {
      const imported = importText(text)
      if (!imported.ok) return imported.error
      commit({ setup: imported.value.setup, game: imported.value.game })
      return []
    },

    playMove: (move) => {
      const { document } = get()
      let game = document.game
      if (!game) {
        const start = Position.fromSetup(document.setup)
        if (!start.ok) return false
        game = createHistory(start.value)
      }
      const next = pushMove(game, move)
      if (!next.ok) return false
      commit({ setup: currentPosition(next.value).setup, game: next.value })
      return true
    },

    goToPly: (ply) => {
      const { document } = get()
      if (!document.game) return
      const game = goTo(document.game, ply)
      if (game.cursor === document.game.cursor) return
      set({ document: { setup: currentPosition(game).setup, game } })
    },

    undo: () => {
      const { past, document, future } = get()
      const previous = past[past.length - 1]
      if (!previous) return
      set({ document: previous, past: past.slice(0, -1), future: [document, ...future] })
    },
    redo: () => {
      const { past, document, future } = get()
      const [next, ...rest] = future
      if (!next) return
      set({ document: next, past: [...past, document], future: rest })
    },
  }
})

/** Test and story helper: back to the starting position with empty history. */
export const resetEditorStore = (document: EditorDocument = START_DOCUMENT): void =>
  useEditorStore.setState({
    document,
    past: [],
    future: [],
    orientation: 'white',
    mode: 'edit',
    tool: null,
  })

// --- Derived values ----------------------------------------------------------

export const documentFen = (document: EditorDocument): string => makeFen(document.setup)

/** The legal position when the setup can be analyzed, else undefined. */
export const analyzablePosition = (document: EditorDocument): Position | undefined => {
  const position = document.game
    ? currentPosition(document.game)
    : (() => {
        const result = Position.fromSetup(document.setup)
        return result.ok ? result.value : undefined
      })()
  return position && !hasErrors(validateSetup(document.setup)) ? position : undefined
}

/** PGN of the game (or just the start position), undefined while the position is invalid. */
export const documentPgn = (document: EditorDocument): string | undefined => {
  if (document.game) return makePgn(document.game)
  const start = Position.fromSetup(document.setup)
  return start.ok ? makePgn(createHistory(start.value)) : undefined
}

export interface EditorSnapshot {
  readonly fen: string
  /** Every problem with the setup (errors and warnings). */
  readonly issues: readonly ValidationIssue[]
  /** Set exactly when the position is legal, i.e. analysis may run. */
  readonly position: Position | undefined
}

/** Derived view of the current document: FEN, validation issues and the analyzable position. */
export function useEditorSnapshot(): EditorSnapshot {
  const document = useEditorStore((s) => s.document)
  return useMemo(
    () => ({
      fen: documentFen(document),
      issues: validateSetup(document.setup),
      position: analyzablePosition(document),
    }),
    [document],
  )
}
