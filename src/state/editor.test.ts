import { act, renderHook } from '@testing-library/react'
import { STARTING_FEN, makeFen } from '@/core'
import {
  documentFen,
  documentPgn,
  isSameTool,
  resetEditorStore,
  useEditorSnapshot,
  useEditorStore,
} from './editor'

const store = () => useEditorStore.getState()
const fen = () => documentFen(store().document)

describe('editor store', () => {
  beforeEach(() => resetEditorStore())

  it('starts from the standard position, legal and ready for analysis', () => {
    const { result } = renderHook(() => useEditorSnapshot())
    expect(result.current.fen).toBe(STARTING_FEN)
    expect(result.current.issues).toEqual([])
    expect(result.current.position).toBeDefined()
  })

  it('edits side to move, castling and en passant', () => {
    store().load('4k3/8/8/3pP3/8/8/8/R3K2R w KQ d6 0 2')
    expect(fen()).toBe('4k3/8/8/3pP3/8/8/8/R3K2R w KQ d6 0 2')
    store().setCastling('white', 'queenSide', false)
    expect(fen()).toBe('4k3/8/8/3pP3/8/8/8/R3K2R w K d6 0 2')
    store().setTurn('black')
    // the en passant square belonged to the other side to move
    expect(fen()).toBe('4k3/8/8/3pP3/8/8/8/R3K2R b K - 0 2')
    store().setEpSquare(undefined)
    expect(fen()).toBe('4k3/8/8/3pP3/8/8/8/R3K2R b K - 0 2')
  })

  it('undoes and redoes edits; a new edit clears the redo stack', () => {
    store().clear()
    store().setTurn('black')
    expect(fen()).toBe('8/8/8/8/8/8/8/8 b - - 0 1')
    store().undo()
    expect(fen()).toBe('8/8/8/8/8/8/8/8 w - - 0 1')
    store().undo()
    expect(fen()).toBe(STARTING_FEN)
    store().undo()
    expect(fen()).toBe(STARTING_FEN)
    store().redo()
    store().redo()
    expect(fen()).toBe('8/8/8/8/8/8/8/8 b - - 0 1')
    store().undo()
    store().reset()
    expect(store().future).toEqual([])
  })

  it('explains an invalid position and blocks analysis', () => {
    store().clear()
    const { result } = renderHook(() => useEditorSnapshot())
    expect(result.current.position).toBeUndefined()
    expect(result.current.issues.map((i) => i.code)).toEqual(['missingKing', 'missingKing'])
    act(() => store().setPieces({ e1: { color: 'white', role: 'king' } }))
    expect(result.current.issues.map((i) => i.code)).toEqual(['missingKing'])
    act(() =>
      store().setPieces({
        e1: { color: 'white', role: 'king' },
        e8: { color: 'black', role: 'king' },
      }),
    )
    expect(result.current.issues).toEqual([])
    expect(result.current.position).toBeDefined()
  })

  it('keeps an illegal position that was pasted so it can be fixed', () => {
    expect(store().load('8/8/8/8/8/8/8/8 w - - 0 1')).toEqual([])
    expect(fen()).toBe('8/8/8/8/8/8/8/8 w - - 0 1')
  })

  it('rejects bad input without changing anything', () => {
    const issues = store().load('not a position')
    expect(issues.length).toBeGreaterThan(0)
    expect(fen()).toBe(STARTING_FEN)
    expect(store().past).toEqual([])
  })

  it('loads a PGN, navigates its moves, and exports it again', () => {
    expect(store().load('1. e4 e5 2. Nf3 *')).toEqual([])
    expect(store().document.game?.entries).toHaveLength(3)
    expect(fen()).toBe('rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2')
    store().goToPly(1)
    expect(fen()).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1')
    store().goToPly(99)
    expect(store().document.game?.cursor).toBe(3)
    expect(documentPgn(store().document)).toContain('1. e4 e5 2. Nf3')
  })

  it('plays legal moves, ignores illegal ones, and undoes them', () => {
    expect(store().playMove({ from: 'e2', to: 'e4' })).toBe(true)
    expect(store().playMove({ from: 'e2', to: 'e4' })).toBe(false)
    expect(store().playMove({ from: 'e7', to: 'e5' })).toBe(true)
    expect(documentPgn(store().document)).toContain('1. e4 e5')
    store().undo()
    expect(store().document.game?.cursor).toBe(1)
    store().undo()
    expect(store().document.game).toBeNull()
    expect(fen()).toBe(STARTING_FEN)
  })

  it('cannot play from an illegal position', () => {
    store().clear()
    expect(store().playMove({ from: 'e2', to: 'e4' })).toBe(false)
  })

  it('editing pieces after a game drops the game but undo brings it back', () => {
    store().load('1. e4 e5 *')
    store().setPieces({})
    expect(store().document.game).toBeNull()
    store().undo()
    expect(store().document.game?.entries).toHaveLength(2)
  })

  it('exports exactly what was built', () => {
    store().clear()
    store().setPieces({
      e1: { color: 'white', role: 'king' },
      h1: { color: 'white', role: 'rook' },
      e8: { color: 'black', role: 'king' },
    })
    store().setCastling('white', 'kingSide', true)
    const exported = fen()
    expect(exported).toBe('4k3/8/8/8/8/8/8/4K2R w K - 0 1')
    store().reset()
    store().load(exported)
    expect(makeFen(store().document.setup)).toBe(exported)
  })

  it('flips the board without touching the position or undo history', () => {
    store().flip()
    expect(store().orientation).toBe('black')
    expect(store().past).toEqual([])
  })

  it('compares tools by value', () => {
    const pawn = { kind: 'place', piece: { color: 'white', role: 'pawn' } } as const
    expect(isSameTool(pawn, { kind: 'place', piece: { color: 'white', role: 'pawn' } })).toBe(true)
    expect(isSameTool(pawn, { kind: 'place', piece: { color: 'black', role: 'pawn' } })).toBe(false)
    expect(isSameTool({ kind: 'erase' }, { kind: 'erase' })).toBe(true)
    expect(isSameTool(null, pawn)).toBe(false)
  })
})
