import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Position, startingSetup, type Move } from '@/core'
import { Board, type BoardHandle, type BoardProps } from './Board'
import { BoardMessagesContext } from './messages-context'
import { boardTranslations, createBoardMessages } from './messages'
import type { BoardView, BoardViewFactory } from './types'

const start = Position.start()
const startPieces = startingSetup().pieces

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

/** Chessground reports events on timers. */
const flush = () => act(() => void vi.runAllTimers())
const key = (el: HTMLElement, name: string) => fireEvent.keyDown(el, { key: name })
const board = () => screen.getByRole('application')
const status = () => screen.getByRole('status')

function renderPlay(props: Partial<BoardProps> = {}) {
  return render(
    <Board
      pieces={startPieces}
      mode="play"
      movableColor="white"
      destinations={start.destinations()}
      {...props}
    />,
  )
}

describe('Board', () => {
  it('renders an accessible, focusable board with a hint', () => {
    render(<Board pieces={startPieces} />)
    expect(board()).toHaveAccessibleName('Chessboard')
    expect(board()).toHaveAccessibleDescription(/arrow keys/i)
    expect(board()).toHaveAttribute('tabindex', '0')
    expect(board().querySelectorAll('piece:not(.ghost)')).toHaveLength(32)
  })

  it('hides the visual layer from assistive technology', () => {
    render(<Board pieces={startPieces} />)
    expect(board().querySelector('cg-board')?.closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('applies the board and piece themes as data attributes', () => {
    render(<Board pieces={startPieces} boardTheme="brown" pieceTheme="glyph" />)
    expect(board()).toHaveAttribute('data-board-theme', 'brown')
    expect(board()).toHaveAttribute('data-piece-theme', 'glyph')
  })

  it('uses messages from the provider', () => {
    const messages = createBoardMessages((k, v) => {
      const flat = k
        .split('.')
        .reduce<unknown>((n, p) => (n as Record<string, unknown>)[p], boardTranslations['pt-BR'])
      return typeof flat === 'string'
        ? flat.replace(/\{\{(\w+)\}\}/g, (_m, n: string) => String(v?.[n]))
        : k
    })
    render(
      <BoardMessagesContext value={messages}>
        <Board pieces={startPieces} />
      </BoardMessagesContext>,
    )
    expect(board()).toHaveAccessibleName('Tabuleiro de xadrez')
  })

  describe('keyboard', () => {
    it('moves a cursor with the arrow keys and announces each square', () => {
      render(<Board pieces={startPieces} />)
      act(() => board().focus())
      expect(document.querySelector('[data-slot="board-cursor"]')).toBeNull()
      key(board(), 'ArrowRight')
      expect(status()).toHaveTextContent('f2, white pawn')
      expect(document.querySelector('[data-slot="board-cursor"]')).toBeInTheDocument()
      key(board(), 'ArrowUp')
      expect(status()).toHaveTextContent('f3, empty')
      key(board(), 'PageUp')
      expect(status()).toHaveTextContent('f8, black bishop')
    })

    it('follows the orientation', () => {
      render(<Board pieces={startPieces} orientation="black" />)
      key(board(), 'ArrowRight')
      expect(status()).toHaveTextContent('d7, black pawn')
    })

    it('plays a move with Enter and reports it', () => {
      const onMove = vi.fn<(move: Move) => void>()
      renderPlay({ onMove })
      key(board(), 'Enter')
      expect(status()).toHaveTextContent('e2 selected, 2 moves available')
      key(board(), 'ArrowUp')
      key(board(), 'ArrowUp')
      key(board(), ' ')
      flush()
      expect(onMove).toHaveBeenCalledExactlyOnceWith({ from: 'e2', to: 'e4' })
      expect(status()).toHaveTextContent('white pawn from e2 to e4')
    })

    it('Escape clears the selection', () => {
      const onMove = vi.fn()
      renderPlay({ onMove })
      key(board(), 'Enter')
      key(board(), 'Escape')
      key(board(), 'ArrowUp')
      key(board(), 'Enter')
      flush()
      expect(onMove).not.toHaveBeenCalled()
    })

    it('ignores Enter on a view-only board', () => {
      const onSquareSelect = vi.fn()
      render(<Board pieces={startPieces} onSquareSelect={onSquareSelect} />)
      key(board(), 'Enter')
      flush()
      expect(onSquareSelect).not.toHaveBeenCalled()
    })

    it('does not swallow shortcuts with modifier keys', () => {
      render(<Board pieces={startPieces} />)
      fireEvent.keyDown(board(), { key: 'ArrowRight', ctrlKey: true })
      expect(status()).toHaveTextContent('')
    })

    it('reverts the board when the host does not accept the move', () => {
      renderPlay({ onMove: () => {} })
      key(board(), 'Enter')
      key(board(), 'ArrowUp')
      key(board(), 'Enter')
      flush()
      // The host kept the same pieces: the pawn is back on e2.
      expect(board().querySelectorAll('piece.pawn.white')).toHaveLength(8)
      expect(board().querySelector('piece.pawn.white')).not.toBeNull()
    })
  })

  describe('promotion', () => {
    const position = Position.fromFen('7k/P7/8/8/8/8/8/4K3 w - - 0 1')
    if (!position.ok) throw new Error('fixture')
    const props = {
      pieces: position.value.setup.pieces,
      destinations: position.value.destinations(),
    }

    const pushPawn = () => {
      key(board(), 'PageUp')
      key(board(), 'ArrowDown')
      key(board(), 'Home')
      key(board(), 'Enter') // select a7
      key(board(), 'ArrowUp')
      key(board(), 'Enter') // a8
      flush()
    }

    it('asks which piece to promote to, then reports the full move', () => {
      const onMove = vi.fn<(move: Move) => void>()
      renderPlay({ ...props, onMove })
      pushPawn()
      const dialog = screen.getByRole('dialog', { name: 'Promote the pawn to' })
      expect(onMove).not.toHaveBeenCalled()
      fireEvent.click(within(dialog).getByRole('button', { name: 'white knight' }))
      expect(onMove).toHaveBeenCalledExactlyOnceWith({ from: 'a7', to: 'a8', promotion: 'knight' })
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    it('offers the four promotion pieces and focuses the first', () => {
      renderPlay(props)
      pushPawn()
      const names = within(screen.getByRole('dialog'))
        .getAllByRole('button')
        .map((b) => b.getAttribute('aria-label') ?? b.textContent)
      expect(names).toEqual(['white queen', 'white rook', 'white bishop', 'white knight', 'Cancel'])
      expect(screen.getByRole('button', { name: 'white queen' })).toHaveFocus()
    })

    it('Escape cancels without a move', () => {
      const onMove = vi.fn()
      renderPlay({ ...props, onMove })
      pushPawn()
      key(screen.getByRole('dialog'), 'Escape')
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(onMove).not.toHaveBeenCalled()
      expect(board()).toHaveFocus()
    })

    it('the Cancel button cancels', () => {
      const onMove = vi.fn()
      renderPlay({ ...props, onMove })
      pushPawn()
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(onMove).not.toHaveBeenCalled()
    })
  })

  describe('edit mode', () => {
    it('deletes the piece under the cursor with Delete', () => {
      const onEdit = vi.fn()
      render(<Board pieces={startPieces} mode="edit" onEdit={onEdit} />)
      key(board(), 'Delete')
      expect(onEdit).toHaveBeenCalledOnce()
      const next = onEdit.mock.calls[0]?.[0] as Record<string, unknown>
      expect(next.e2).toBeUndefined()
      expect(Object.keys(next)).toHaveLength(31)
      expect(status()).toHaveTextContent('Piece removed from e2')
    })

    it('does not delete in other modes', () => {
      const onEdit = vi.fn()
      render(<Board pieces={startPieces} mode="play" onEdit={onEdit} />)
      key(board(), 'Delete')
      expect(onEdit).not.toHaveBeenCalled()
    })

    it('places the tool piece with Enter and reports the edit', () => {
      const onEdit = vi.fn()
      render(
        <Board
          pieces={{}}
          mode="edit"
          editTool={{ kind: 'place', piece: { color: 'black', role: 'queen' } }}
          onEdit={onEdit}
        />,
      )
      key(board(), 'Enter')
      flush()
      expect(onEdit).toHaveBeenCalledOnce()
      expect(onEdit.mock.calls[0]?.[0]).toEqual({ e2: { color: 'black', role: 'queen' } })
      expect(status()).toHaveTextContent('black queen placed on e2')
    })
  })

  describe('with a custom view (the adapter is swappable)', () => {
    function stubFactory() {
      const spies = {
        update: vi.fn<BoardView['update']>(),
        dragNewPiece: vi.fn<BoardView['dragNewPiece']>(),
        destroy: vi.fn<BoardView['destroy']>(),
      }
      const view: BoardView = {
        ...spies,
        activateSquare: () => {},
        selectedSquare: () => undefined,
        clearSelection: () => {},
      }
      const factory = vi.fn<BoardViewFactory>(() => view)
      return { spies, factory }
    }

    it('creates the view once, pushes prop changes, and destroys it on unmount', () => {
      const { spies, factory } = stubFactory()
      const { rerender, unmount } = render(<Board pieces={startPieces} createView={factory} />)
      expect(factory).toHaveBeenCalledOnce()
      rerender(<Board pieces={startPieces} createView={factory} orientation="black" />)
      expect(factory).toHaveBeenCalledOnce()
      expect(spies.update).toHaveBeenLastCalledWith(
        expect.objectContaining({ orientation: 'black' }),
      )
      unmount()
      expect(spies.destroy).toHaveBeenCalledOnce()
    })

    it('disables animations when the user prefers reduced motion', () => {
      const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation(
        (query) =>
          ({
            matches: query.includes('reduced-motion'),
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
          }) as unknown as MediaQueryList,
      )
      try {
        const { spies, factory } = stubFactory()
        render(<Board pieces={startPieces} createView={factory} />)
        expect(spies.update).toHaveBeenLastCalledWith(
          expect.objectContaining({ animations: false }),
        )
      } finally {
        matchMedia.mockRestore()
      }
    })

    it('exposes dragNewPiece through its ref', () => {
      const { spies, factory } = stubFactory()
      const ref = { current: null as BoardHandle | null }
      render(<Board pieces={{}} mode="edit" createView={factory} ref={ref} />)
      const event = new MouseEvent('mousedown')
      ref.current?.dragNewPiece({ color: 'white', role: 'king' }, event)
      expect(spies.dragNewPiece).toHaveBeenCalledWith({ color: 'white', role: 'king' }, event)
    })
  })
})
