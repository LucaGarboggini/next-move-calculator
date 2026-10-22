import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Position, startingSetup, type Piece, type Square } from '@/core'
import { createChessgroundView } from './chessground-adapter'
import {
  DEFAULT_VIEW_STATE,
  type BoardPieces,
  type BoardView,
  type BoardViewEvents,
  type BoardViewState,
} from './types'

const start = Position.start()
const startPieces = startingSetup().pieces

let element: HTMLElement
let view: BoardView | undefined

function mount(patch: Partial<BoardViewState> = {}, events: BoardViewEvents = {}) {
  view = createChessgroundView(
    element,
    { ...DEFAULT_VIEW_STATE, pieces: startPieces, ...patch },
    events,
  )
  return view
}
/** Chessground reports events and redraws shapes on timers. */
const flush = () => vi.runAllTimers()
const pieceCount = () => element.querySelectorAll('piece:not(.ghost)').length

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] })
  element = document.createElement('div')
  document.body.append(element)
})
afterEach(() => {
  vi.useRealTimers()
  view?.destroy()
  view = undefined
  element.remove()
})

describe('chessground adapter', () => {
  it('renders the pieces and the wrapper classes', () => {
    mount()
    expect(element.classList.contains('cg-wrap')).toBe(true)
    expect(pieceCount()).toBe(32)
    expect(element.querySelector('piece.king.white')).not.toBeNull()
  })

  it('updates pieces and orientation', () => {
    const board = mount()
    board.update({ pieces: { e1: { color: 'white', role: 'king' } }, orientation: 'black' })
    flush()
    expect(pieceCount()).toBe(1)
    expect(element.classList.contains('orientation-black')).toBe(true)
  })

  it('removes the DOM on destroy', () => {
    mount().destroy()
    expect(element.querySelector('cg-board')).toBeNull()
  })

  describe('view mode', () => {
    it('reports nothing when squares are activated', () => {
      const onMove = vi.fn()
      const onSquareSelect = vi.fn()
      const board = mount({}, { onMove, onSquareSelect })
      board.activateSquare('e2')
      flush()
      board.activateSquare('e4')
      flush()
      expect(onMove).not.toHaveBeenCalled()
      expect(onSquareSelect).not.toHaveBeenCalled()
      expect(board.selectedSquare()).toBeUndefined()
    })
  })

  describe('play mode', () => {
    const playState = {
      mode: 'play',
      movableColor: 'white',
      destinations: start.destinations(),
    } as const

    it('selects an own piece and moves it to a legal destination', () => {
      const onMove = vi.fn()
      const board = mount(playState, { onMove })
      board.activateSquare('e2')
      flush()
      expect(board.selectedSquare()).toBe('e2')
      board.activateSquare('e4')
      flush()
      expect(onMove).toHaveBeenCalledExactlyOnceWith({ from: 'e2', to: 'e4' })
    })

    it('ignores illegal destinations and the opponent’s pieces', () => {
      const onMove = vi.fn()
      const board = mount(playState, { onMove })
      board.activateSquare('e7')
      flush()
      expect(board.selectedSquare()).toBeUndefined()
      board.activateSquare('e2')
      flush()
      board.activateSquare('e5')
      flush()
      expect(onMove).not.toHaveBeenCalled()
    })

    it('clears the selection', () => {
      const board = mount(playState)
      board.activateSquare('g1')
      flush()
      board.clearSelection()
      expect(board.selectedSquare()).toBeUndefined()
    })

    it('reports square selections', () => {
      const onSquareSelect = vi.fn()
      mount(playState, { onSquareSelect }).activateSquare('d2')
      flush()
      expect(onSquareSelect).toHaveBeenCalledWith('d2')
    })

    it('reports castling as the king’s two-square move without moving the rook itself', () => {
      const position = Position.fromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')
      if (!position.ok) throw new Error('fixture')
      const onMove = vi.fn()
      const board = mount(
        {
          mode: 'play',
          movableColor: 'white',
          destinations: position.value.destinations(),
          pieces: position.value.setup.pieces,
        },
        { onMove },
      )
      board.activateSquare('e1')
      flush()
      board.activateSquare('g1')
      flush()
      expect(onMove).toHaveBeenCalledWith({ from: 'e1', to: 'g1' })
    })

    it('does not allow moves while nobody may move', () => {
      const onMove = vi.fn()
      const board = mount({ ...playState, movableColor: undefined }, { onMove })
      board.activateSquare('e2')
      flush()
      board.activateSquare('e4')
      flush()
      expect(onMove).not.toHaveBeenCalled()
    })
  })

  describe('edit mode', () => {
    const queen: Piece = { color: 'white', role: 'queen' }

    it('places a piece with the place tool and reports the new position', () => {
      const onEdit = vi.fn<(pieces: BoardPieces) => void>()
      const board = mount(
        { mode: 'edit', pieces: {}, editTool: { kind: 'place', piece: queen } },
        { onEdit },
      )
      board.activateSquare('d4')
      flush()
      expect(onEdit).toHaveBeenCalledOnce()
      expect(onEdit.mock.calls[0]?.[0]).toEqual({ d4: queen })
      expect(pieceCount()).toBe(1)
    })

    it('erases a piece with the erase tool', () => {
      const onEdit = vi.fn<(pieces: BoardPieces) => void>()
      const board = mount({ mode: 'edit', editTool: { kind: 'erase' } }, { onEdit })
      board.activateSquare('e2')
      flush()
      expect(onEdit.mock.calls[0]?.[0]?.e2).toBeUndefined()
      expect(Object.keys(onEdit.mock.calls[0]?.[0] ?? {})).toHaveLength(31)
    })

    it('does not report placing a piece that is already there', () => {
      const onEdit = vi.fn()
      const board = mount(
        { mode: 'edit', editTool: { kind: 'place', piece: { color: 'white', role: 'pawn' } } },
        { onEdit },
      )
      board.activateSquare('e2')
      flush()
      expect(onEdit).not.toHaveBeenCalled()
    })

    it('moves pieces freely when no tool is active (even onto an occupied square)', () => {
      const onEdit = vi.fn<(pieces: BoardPieces) => void>()
      const board = mount({ mode: 'edit' }, { onEdit })
      board.activateSquare('a1')
      flush()
      board.activateSquare('a7')
      flush()
      const pieces = onEdit.mock.calls.at(-1)?.[0]
      expect(pieces?.a1).toBeUndefined()
      expect(pieces?.a7).toEqual({ color: 'white', role: 'rook' })
    })

    it('does not auto-castle when a king moves two files', () => {
      const onEdit = vi.fn<(pieces: BoardPieces) => void>()
      const pieces = {
        e1: { color: 'white', role: 'king' },
        h1: { color: 'white', role: 'rook' },
      } as const
      const board = mount({ mode: 'edit', pieces }, { onEdit })
      board.activateSquare('e1')
      flush()
      board.activateSquare('g1')
      flush()
      const result = onEdit.mock.calls.at(-1)?.[0]
      expect(result?.g1?.role).toBe('king')
      expect(result?.h1?.role).toBe('rook')
      expect(result?.f1).toBeUndefined()
    })

    it('does not report programmatic updates as user edits', () => {
      const onEdit = vi.fn()
      const board = mount({ mode: 'edit' }, { onEdit })
      board.update({ pieces: { e4: { color: 'black', role: 'pawn' } } })
      flush()
      expect(onEdit).not.toHaveBeenCalled()
    })

    it('reports nothing in other modes', () => {
      const onEdit = vi.fn()
      const board = mount({ mode: 'view', editTool: { kind: 'erase' } }, { onEdit })
      board.activateSquare('e2')
      flush()
      expect(onEdit).not.toHaveBeenCalled()
    })
  })

  describe('overlays', () => {
    it('draws arrows as shapes using token colors', () => {
      const board = mount({
        arrows: [
          { from: 'e2', to: 'e4', tone: 'primary' },
          { from: 'g1', to: 'f3', tone: 'secondary', thin: true },
        ],
      })
      board.update({})
      flush()
      const shapes = element.querySelectorAll('.cg-shapes g line')
      expect(shapes.length).toBe(2)
      expect(shapes[0]?.getAttribute('stroke')).toBe('var(--board-arrow-primary)')
      expect(shapes[1]?.getAttribute('stroke')).toBe('var(--board-arrow-secondary)')
      board.update({ arrows: [] })
      flush()
      expect(element.querySelectorAll('.cg-shapes g line').length).toBe(0)
    })

    it('highlights squares with tone classes', () => {
      const board = mount({
        highlights: [
          { square: 'e4', tone: 'danger' },
          { square: 'a1', tone: 'primary' },
        ],
      })
      const classes = (square: Square) =>
        [...element.querySelectorAll('square')].filter((el) =>
          el.classList.contains(`hl-${square === 'e4' ? 'danger' : 'primary'}`),
        ).length
      expect(classes('e4')).toBe(1)
      expect(classes('a1')).toBe(1)
      board.update({ highlights: [] })
      flush()
      expect(element.querySelectorAll('square[class*="hl-"]').length).toBe(0)
    })

    it('marks the last move and the king in check', () => {
      const position = Position.fromFen('4k3/8/8/8/8/8/4R3/4K3 b - - 0 1')
      if (!position.ok) throw new Error('fixture')
      mount({ pieces: position.value.setup.pieces, lastMove: ['e1', 'e2'], check: 'black' })
      expect(element.querySelectorAll('square.last-move').length).toBe(2)
      expect(element.querySelectorAll('square.check').length).toBe(1)
    })

    it('shows destination dots for the selected piece', () => {
      const board = mount({
        mode: 'play',
        movableColor: 'white',
        destinations: start.destinations(),
      })
      board.activateSquare('g1')
      flush()
      expect(element.querySelectorAll('square.move-dest').length).toBe(2)
    })
  })
})
