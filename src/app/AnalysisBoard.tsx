import { BoardEvalBar, useAnalysisArrows } from '@/features/analysis'
import { EditorBoard } from '@/features/editor'
import { BoardStage } from '@/ui'

/**
 * The board slot: the editor's board with the engine's moves drawn on it and the eval bar next to
 * it. Features never import each other, so this is where the two meet.
 */
export function AnalysisBoard() {
  const arrows = useAnalysisArrows()
  return (
    <BoardStage gauge={<BoardEvalBar />}>
      <EditorBoard arrows={arrows} />
    </BoardStage>
  )
}
