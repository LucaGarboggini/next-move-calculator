import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { parseFen, type Color } from '@/core'
import { createMerge, createMigrate, type Migrations, type PersistedState } from './migrate'

export const SAVED_BOARDS_KEY = 'nmc-saved-boards'
/**
 * Schema history:
 * - 1: `{ boards: { id, name, fen, savedAt }[] }`
 * - 2: boards also keep the game (`pgn`) and which side was at the bottom (`orientation`)
 */
export const SAVED_BOARDS_VERSION = 2

export const MAX_SAVED_BOARDS = 100
export const MAX_NAME_LENGTH = 60

/** A named position the user keeps, with its moves when it came from a game. */
export interface SavedBoard {
  readonly id: string
  readonly name: string
  readonly fen: string
  /** The game when the position has a move list; null for a bare position. */
  readonly pgn: string | null
  readonly orientation: Color
  /** Milliseconds since the epoch. */
  readonly savedAt: number
}

/** What to keep when saving the board that is on screen. */
export type SavedBoardInput = Pick<SavedBoard, 'name' | 'fen' | 'pgn' | 'orientation'>

/** Single line, trimmed, at most `MAX_NAME_LENGTH` characters. */
export const cleanName = (name: string): string =>
  name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH)

const isRecord = (value: unknown): value is PersistedState =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Keeps the boards that are still usable and drops the rest, so one bad entry loses nothing else. */
export function sanitizeSavedBoards(state: PersistedState): { boards: SavedBoard[] } {
  const raw: unknown[] = Array.isArray(state.boards) ? state.boards : []
  const seen = new Set<string>()
  const boards: SavedBoard[] = []
  for (const entry of raw) {
    if (!isRecord(entry)) continue
    const { id, name, fen, pgn, orientation, savedAt } = entry
    if (typeof id !== 'string' || !id || seen.has(id)) continue
    if (typeof name !== 'string' || !cleanName(name)) continue
    if (typeof fen !== 'string' || !parseFen(fen).ok) continue
    seen.add(id)
    boards.push({
      id,
      name: cleanName(name),
      fen,
      pgn: typeof pgn === 'string' && pgn.trim() ? pgn : null,
      orientation: orientation === 'black' ? 'black' : 'white',
      savedAt: typeof savedAt === 'number' && Number.isFinite(savedAt) ? savedAt : 0,
    })
    if (boards.length === MAX_SAVED_BOARDS) break
  }
  return { boards }
}

/** `MIGRATIONS[n]` upgrades what version `n` wrote to version `n + 1`. */
export const SAVED_BOARDS_MIGRATIONS: Migrations = {
  // v1 kept positions only: add the (absent) game and the default orientation.
  1: (state) => ({
    ...state,
    boards: (Array.isArray(state.boards) ? (state.boards as unknown[]) : []).map((board) =>
      isRecord(board) ? { pgn: null, orientation: 'white', ...board } : board,
    ),
  }),
}

export const migrateSavedBoards = createMigrate({
  version: SAVED_BOARDS_VERSION,
  migrations: SAVED_BOARDS_MIGRATIONS,
  sanitize: sanitizeSavedBoards,
})

const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36)}`

interface SavedBoardsState {
  /** Newest first. */
  boards: readonly SavedBoard[]
  /** Saves a board; undefined when the name is empty or the list is full. */
  save: (input: SavedBoardInput) => SavedBoard | undefined
  rename: (id: string, name: string) => void
  remove: (id: string) => void
  clear: () => void
}

export const useSavedBoards = create<SavedBoardsState>()(
  persist<SavedBoardsState, [], [], { boards: readonly SavedBoard[] }>(
    (set, get) => ({
      boards: [],
      save: (input) => {
        const name = cleanName(input.name)
        if (!name || get().boards.length >= MAX_SAVED_BOARDS) return undefined
        const board: SavedBoard = { ...input, name, id: newId(), savedAt: Date.now() }
        set((state) => ({ boards: [board, ...state.boards] }))
        return board
      },
      rename: (id, name) => {
        const clean = cleanName(name)
        if (!clean) return
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === id ? { ...board, name: clean } : board,
          ),
        }))
      },
      remove: (id) => set((state) => ({ boards: state.boards.filter((board) => board.id !== id) })),
      clear: () => set({ boards: [] }),
    }),
    {
      name: SAVED_BOARDS_KEY,
      version: SAVED_BOARDS_VERSION,
      partialize: ({ boards }) => ({ boards }),
      migrate: migrateSavedBoards,
      merge: createMerge(sanitizeSavedBoards),
    },
  ),
)
