import { STARTING_FEN } from '@/core'
import {
  MAX_NAME_LENGTH,
  MAX_SAVED_BOARDS,
  SAVED_BOARDS_KEY,
  SAVED_BOARDS_VERSION,
  cleanName,
  migrateSavedBoards,
  useSavedBoards,
} from './savedBoards'

const AFTER_E4 = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'

const input = (name: string) => ({ name, fen: STARTING_FEN, pgn: null, orientation: 'white' as const })

describe('saved boards', () => {
  beforeEach(() => {
    localStorage.clear()
    useSavedBoards.getState().clear()
  })

  it('saves newest first and persists with the current version', () => {
    const { save } = useSavedBoards.getState()
    save(input('First'))
    save({ ...input('Second'), fen: AFTER_E4, orientation: 'black' })
    expect(useSavedBoards.getState().boards.map((b) => b.name)).toEqual(['Second', 'First'])
    const stored = JSON.parse(localStorage.getItem(SAVED_BOARDS_KEY) ?? '{}') as {
      version: number
      state: { boards: unknown[] }
    }
    expect(stored.version).toBe(SAVED_BOARDS_VERSION)
    expect(stored.state.boards).toHaveLength(2)
  })

  it('cleans names and refuses empty ones', () => {
    expect(cleanName('  Rook   ending \n')).toBe('Rook ending')
    expect(cleanName('x'.repeat(200))).toHaveLength(MAX_NAME_LENGTH)
    expect(useSavedBoards.getState().save(input('   '))).toBeUndefined()
    expect(useSavedBoards.getState().boards).toEqual([])
  })

  it('renames and removes', () => {
    const board = useSavedBoards.getState().save(input('Old'))
    if (!board) throw new Error('not saved')
    useSavedBoards.getState().rename(board.id, ' New ')
    expect(useSavedBoards.getState().boards[0]?.name).toBe('New')
    useSavedBoards.getState().rename(board.id, '  ')
    expect(useSavedBoards.getState().boards[0]?.name).toBe('New')
    useSavedBoards.getState().remove(board.id)
    expect(useSavedBoards.getState().boards).toEqual([])
  })

  it('stops at the limit', () => {
    const { save } = useSavedBoards.getState()
    for (let i = 0; i < MAX_SAVED_BOARDS; i++) save(input(`Board ${i}`))
    expect(save(input('One too many'))).toBeUndefined()
    expect(useSavedBoards.getState().boards).toHaveLength(MAX_SAVED_BOARDS)
  })
})

describe('saved boards schema migration', () => {
  /** Exactly what version 1 wrote to localStorage: positions only. */
  const V1 = {
    version: 1,
    state: {
      boards: [
        { id: 'a', name: 'Opening', fen: STARTING_FEN, savedAt: 1_700_000_000_000 },
        { id: 'b', name: 'After 1.e4', fen: AFTER_E4, savedAt: 1_700_000_100_000 },
      ],
    },
  }

  beforeEach(() => {
    localStorage.clear()
    useSavedBoards.getState().clear()
  })

  it('keeps boards saved by version 1 and fills the new fields', () => {
    expect(migrateSavedBoards(V1.state, 1)).toEqual({
      boards: [
        {
          id: 'a',
          name: 'Opening',
          fen: STARTING_FEN,
          pgn: null,
          orientation: 'white',
          savedAt: 1_700_000_000_000,
        },
        {
          id: 'b',
          name: 'After 1.e4',
          fen: AFTER_E4,
          pgn: null,
          orientation: 'white',
          savedAt: 1_700_000_100_000,
        },
      ],
    })
  })

  it('upgrades version 1 data found in storage when the app starts', async () => {
    localStorage.setItem(SAVED_BOARDS_KEY, JSON.stringify(V1))
    await useSavedBoards.persist.rehydrate()
    const { boards } = useSavedBoards.getState()
    expect(boards.map((b) => [b.id, b.name, b.fen, b.pgn, b.orientation])).toEqual([
      ['a', 'Opening', STARTING_FEN, null, 'white'],
      ['b', 'After 1.e4', AFTER_E4, null, 'white'],
    ])
    // The upgraded boards keep working: new saves go in front and everything is rewritten as v2.
    useSavedBoards.getState().save(input('Newer'))
    const stored = JSON.parse(localStorage.getItem(SAVED_BOARDS_KEY) ?? '{}') as {
      version: number
      state: { boards: unknown[] }
    }
    expect(stored.version).toBe(2)
    expect(stored.state.boards).toHaveLength(3)
  })

  it('does not rewrite version 2 data', () => {
    const v2 = {
      boards: [
        { id: 'c', name: 'Game', fen: AFTER_E4, pgn: '1. e4 *', orientation: 'black', savedAt: 5 },
      ],
    }
    expect(migrateSavedBoards(v2, 2)).toEqual(v2)
  })

  it('drops only the entries that are unusable', () => {
    const migrated = migrateSavedBoards(
      {
        boards: [
          { id: 'ok', name: 'Fine', fen: STARTING_FEN, savedAt: 1 },
          { id: 'bad-fen', name: 'Broken', fen: 'not a fen', savedAt: 1 },
          { id: 'no-name', name: '  ', fen: STARTING_FEN, savedAt: 1 },
          { id: 'ok', name: 'Duplicate id', fen: STARTING_FEN, savedAt: 1 },
          'junk',
          null,
        ],
      },
      1,
    )
    expect(migrated.boards.map((b) => b.id)).toEqual(['ok'])
  })

  it('survives a missing or corrupt payload', () => {
    expect(migrateSavedBoards(null, 1)).toEqual({ boards: [] })
    expect(migrateSavedBoards({ boards: 'many' }, 2)).toEqual({ boards: [] })
  })
})
