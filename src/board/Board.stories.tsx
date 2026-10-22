import type { Meta, StoryObj } from '@storybook/react-vite'
import { useRef, useState } from 'react'
import { Position, startingSetup, type Color, type Move, type Piece, ROLES } from '@/core'
import { Board, type BoardHandle } from './Board'
import { PieceIcon } from './PieceIcon'
import { BOARD_THEMES, PIECE_THEMES } from './themes'
import type { BoardPieces, BoardViewState, EditTool } from './types'

const START = startingSetup().pieces

const meta = {
  title: 'board/Board',
  component: Board,
  args: { pieces: START },
  decorators: [
    (Story) => (
      <div className="aspect-square w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Board>

export default meta
type Story = StoryObj<typeof meta>

// --- view -------------------------------------------------------------------

export const View: Story = { args: { mode: 'view' } }

export const BlackOrientation: Story = { args: { mode: 'view', orientation: 'black' } }

export const WithoutCoordinates: Story = { args: { coordinates: false } }

// --- play -------------------------------------------------------------------

function PlayDemo({
  fen,
  ...props
}: { fen?: string } & Partial<React.ComponentProps<typeof Board>>) {
  const initial = Position.fromFen(fen ?? Position.start().fen)
  const [position, setPosition] = useState(initial.ok ? initial.value : Position.start())
  const [lastMove, setLastMove] = useState<BoardViewState['lastMove']>()

  const onMove = (move: Move) => {
    const next = position.play(move)
    if (!next.ok) return
    setPosition(next.value)
    setLastMove([move.from, move.to])
  }

  return (
    <Board
      {...props}
      mode="play"
      pieces={position.setup.pieces}
      movableColor={position.turn}
      destinations={position.destinations()}
      lastMove={lastMove}
      check={position.isCheck ? position.turn : undefined}
      onMove={onMove}
    />
  )
}

/** Click, tap, drag or use the keyboard (focus the board, arrows + Enter). Only legal moves work. */
export const Play: Story = { render: () => <PlayDemo /> }

/** Push the a7 pawn to a8 to see the promotion picker. */
export const PlayPromotion: Story = {
  render: () => <PlayDemo fen="7k/P7/8/8/8/8/8/4K3 w - - 0 1" />,
}

/** With `autoPromote="queen"` the pawn becomes a queen without asking. */
export const PlayAutoQueen: Story = {
  render: () => <PlayDemo fen="7k/P7/8/8/8/8/8/4K3 w - - 0 1" autoPromote="queen" />,
}

/** Castling is available: move the king two squares. */
export const PlayCastling: Story = {
  render: () => <PlayDemo fen="r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1" />,
}

export const PlayAsBlack: Story = {
  render: () => (
    <PlayDemo
      orientation="black"
      fen="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
    />
  ),
}

/** The side to move is in check and the king is highlighted. */
export const Check: Story = {
  render: () => <PlayDemo fen="rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3" />,
}

// --- edit -------------------------------------------------------------------

const PALETTE: Piece[] = (['white', 'black'] as Color[]).flatMap((color) =>
  ROLES.map((role) => ({ color, role })),
)

function EditDemo() {
  const [pieces, setPieces] = useState<BoardPieces>(START)
  const [tool, setTool] = useState<EditTool>(null)
  const board = useRef<BoardHandle>(null)

  const isActive = (candidate: EditTool) => JSON.stringify(candidate) === JSON.stringify(tool)
  const toolClass = (active: boolean) =>
    `flex size-11 items-center justify-center rounded-md border border-border p-1 outline-none focus-visible:ring-3 focus-visible:ring-ring ${active ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'}`

  return (
    <div className="flex w-96 max-w-full flex-col gap-3">
      <div className="aspect-square">
        <Board mode="edit" pieces={pieces} editTool={tool} onEdit={setPieces} ref={board} />
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Pieces">
        <button
          type="button"
          aria-pressed={tool === null}
          onClick={() => setTool(null)}
          className={`${toolClass(tool === null)} px-2 text-xs`}
        >
          Move
        </button>
        {PALETTE.map((piece) => {
          const candidate: EditTool = { kind: 'place', piece }
          return (
            <button
              key={`${piece.color}-${piece.role}`}
              type="button"
              aria-label={`${piece.color} ${piece.role}`}
              aria-pressed={isActive(candidate)}
              onClick={() => setTool(candidate)}
              onPointerDown={(event) => board.current?.dragNewPiece(piece, event.nativeEvent)}
              style={{ touchAction: 'none' }}
              className={toolClass(isActive(candidate))}
            >
              <PieceIcon piece={piece} className="size-full" />
            </button>
          )
        })}
        <button
          type="button"
          aria-pressed={tool?.kind === 'erase'}
          onClick={() => setTool({ kind: 'erase' })}
          className={`${toolClass(tool?.kind === 'erase')} px-2 text-xs`}
        >
          Erase
        </button>
        <button
          type="button"
          onClick={() => setPieces({})}
          className={`${toolClass(false)} px-2 text-xs`}
        >
          Clear
        </button>
      </div>
    </div>
  )
}

/**
 * Edit mode. With "Move" selected, drag pieces anywhere (drop them off the
 * board to remove them). Pick a piece (tap a square to place it, or drag it
 * from the palette) or "Erase" to edit by tapping. Keyboard: arrows, Enter
 * applies the tool, Delete removes.
 */
export const Edit: Story = { render: () => <EditDemo /> }

export const EditEmptyBoard: Story = { args: { mode: 'edit', pieces: {} } }

// --- overlays ---------------------------------------------------------------

export const Arrows: Story = {
  args: {
    pieces: START,
    arrows: [
      { from: 'e2', to: 'e4', tone: 'primary' },
      { from: 'g1', to: 'f3', tone: 'secondary', thin: true },
      { from: 'd2', to: 'd4', tone: 'neutral', thin: true },
      { from: 'b1', to: 'c3', tone: 'danger', thin: true },
    ],
  },
}

export const Highlights: Story = {
  args: {
    pieces: START,
    lastMove: ['e2', 'e4'],
    highlights: [
      { square: 'e4', tone: 'primary' },
      { square: 'f3', tone: 'secondary' },
      { square: 'h5', tone: 'danger' },
      { square: 'a3', tone: 'neutral' },
    ],
  },
}

// --- themes -----------------------------------------------------------------

export const BoardThemes: Story = {
  decorators: [],
  render: (args) => (
    <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
      {BOARD_THEMES.map((boardTheme) => (
        <figure key={boardTheme} className="m-0">
          <div className="aspect-square">
            <Board {...args} boardTheme={boardTheme} aria-label={`${boardTheme} board`} />
          </div>
          <figcaption className="mt-1 text-center text-sm">{boardTheme}</figcaption>
        </figure>
      ))}
    </div>
  ),
}

export const PieceThemes: Story = {
  decorators: [],
  render: (args) => (
    <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
      {PIECE_THEMES.map((pieceTheme) => (
        <figure key={pieceTheme} className="m-0">
          <div className="aspect-square">
            <Board {...args} pieceTheme={pieceTheme} aria-label={`${pieceTheme} pieces`} />
          </div>
          <figcaption className="mt-1 text-center text-sm">{pieceTheme}</figcaption>
        </figure>
      ))}
    </div>
  ),
}

// --- sizing -----------------------------------------------------------------

/** The board fills its container and scales with it, from a small phone to a desktop. */
export const Sizes: Story = {
  decorators: [],
  render: (args) => (
    <div className="flex flex-wrap items-start gap-4">
      {['w-40', 'w-72', 'w-96'].map((width) => (
        <div key={width} className={`aspect-square max-w-full ${width}`}>
          <Board {...args} aria-label={`Board ${width}`} />
        </div>
      ))}
    </div>
  ),
}
