import { Board } from '@/board'
import { startingSetup } from '@/core'
import { useSettings } from '@/state'
import { BoardFrame } from '@/ui'

const STARTING_PIECES = startingSetup().pieces

/** Shows the starting position until the editor takes over the board slot. */
export function StartingBoard() {
  const boardTheme = useSettings((s) => s.boardTheme)
  const pieceTheme = useSettings((s) => s.pieceTheme)
  return (
    <BoardFrame className="overflow-hidden rounded-md shadow-raised">
      <Board pieces={STARTING_PIECES} boardTheme={boardTheme} pieceTheme={pieceTheme} />
    </BoardFrame>
  )
}
