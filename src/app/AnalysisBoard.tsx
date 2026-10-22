import { useAnalysisArrows } from '@/features/analysis'
import { EditorBoard } from '@/features/editor'

/**
 * The board slot: the editor's board with the engine's moves drawn on it. Features never import
 * each other, so this is where the two meet.
 */
export function AnalysisBoard() {
  const arrows = useAnalysisArrows()
  return <EditorBoard arrows={arrows} />
}
