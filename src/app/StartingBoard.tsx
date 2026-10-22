import { Board } from '@/board'
import { startingSetup } from '@/core'
import { BoardFrame } from '@/ui'

const STARTING_PIECES = startingSetup().pieces

/** Shows the starting position until the editor takes over the board slot. */
export function StartingBoard() {
  return (
    <BoardFrame className="overflow-hidden rounded-md shadow-raised">
      <Board pieces={STARTING_PIECES} />
    </BoardFrame>
  )
}
