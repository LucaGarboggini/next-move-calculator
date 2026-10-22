import { useMemo } from 'react'
import { Board, type BoardArrow, type BoardMode } from '@/board'
import { BoardFrame } from '@/ui'
import { useEditorSnapshot, useEditorStore } from '@/state'
import { useBoardHandle } from './board-handle'

export interface EditorBoardProps {
  /** Drawn over the board, e.g. engine moves; the composition root decides where they come from. */
  arrows?: readonly BoardArrow[]
}

/** The board slot: edits the position, or plays legal moves, depending on the editor mode. */
export function EditorBoard({ arrows }: EditorBoardProps) {
  const handle = useBoardHandle()
  const { document, orientation, mode, tool } = useEditorStore()
  const setPieces = useEditorStore((s) => s.setPieces)
  const playMove = useEditorStore((s) => s.playMove)
  const { position } = useEditorSnapshot()

  // Only a legal position can be played from; otherwise the board is display-only.
  const playing = mode === 'play' && position !== undefined
  const boardMode: BoardMode = mode === 'edit' ? 'edit' : playing ? 'play' : 'view'
  const destinations = useMemo(
    () => (playing ? position.destinations() : undefined),
    [playing, position],
  )

  const { game } = document
  const lastEntry = game && game.cursor > 0 ? game.entries[game.cursor - 1] : undefined

  return (
    <BoardFrame className="overflow-hidden rounded-md shadow-raised">
      <Board
        ref={handle}
        pieces={document.setup.pieces}
        orientation={orientation}
        mode={boardMode}
        movableColor={playing ? position.turn : undefined}
        destinations={destinations}
        lastMove={lastEntry && [lastEntry.move.from, lastEntry.move.to]}
        check={position?.isCheck ? position.turn : undefined}
        arrows={arrows}
        editTool={mode === 'edit' ? tool : null}
        onEdit={setPieces}
        onMove={playMove}
      />
    </BoardFrame>
  )
}
