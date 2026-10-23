import { useMemo } from 'react'
import type { BoardArrow } from '@/board'
import { opposite, type Color, type Position, type WhiteScore } from '@/core'
import {
  detectCapabilities,
  engineBounds,
  recommendedSettings,
  type EngineBounds,
  type EngineSettings,
} from '@/engine'
import {
  isAnalysisRunning,
  useAnalysisSession,
  useAnalysisSettings,
  useEditorSnapshot,
  useEditorStore,
  type AnalysisResult,
  type AnalysisStatus,
} from '@/state'
import { useAnalysisController } from './controller-context'

/** What this device allows and recommends for the engine's threads and hash memory. */
export interface DeviceLimits {
  readonly bounds: EngineBounds
  readonly recommended: EngineSettings
}

export function useDeviceLimits(): DeviceLimits {
  return useMemo(() => {
    const capabilities = detectCapabilities()
    return { bounds: engineBounds(capabilities), recommended: recommendedSettings(capabilities) }
  }, [])
}

/** Why Calculate is unavailable, if it is. */
export type Blocker = 'invalid' | 'checkmate' | 'stalemate'

export function blockerOf(position: Position | undefined): Blocker | undefined {
  if (!position) return 'invalid'
  if (position.status === 'checkmate' || position.status === 'stalemate') return position.status
  return undefined
}

/**
 * The result for the position on the board, if there is one. A result is cleared when the
 * position changes, but that happens in an effect, so this also compares positions and never
 * returns a result that belongs to another one, not even for a frame.
 */
export function useCurrentResult(): AnalysisResult | undefined {
  const result = useAnalysisSession((s) => s.result)
  const fen = useEditorSnapshot().position?.fen
  return result && result.fen === fen ? result : undefined
}

/**
 * What the eval bar shows for the position on the board: the best line's score, or, when the game
 * on the board is over, its result (checkmate is a mate in 0, stalemate is level).
 */
export function useBoardEval(): WhiteScore | undefined {
  const best = useCurrentResult()?.lines[0]?.score
  const { position } = useEditorSnapshot()
  if (best) return best
  if (position?.status === 'checkmate') {
    return { kind: 'mate', winner: opposite(position.turn), moves: 0 }
  }
  if (position?.status === 'stalemate') return { kind: 'cp', cp: 0 }
  return undefined
}

export interface AnalysisApi {
  status: AnalysisStatus
  error: string | undefined
  result: AnalysisResult | undefined
  running: boolean
  blocker: Blocker | undefined
  /** The side to move in the position on the board. */
  turn: Color
  calculate: () => void
  stop: () => void
}

/** Everything the analysis panel needs: the session, and Calculate/Stop for the current position. */
export function useAnalysis(): AnalysisApi {
  const controller = useAnalysisController()
  const { position } = useEditorSnapshot()
  const turn = useEditorStore((s) => s.document.setup.turn)
  const status = useAnalysisSession((s) => s.status)
  const error = useAnalysisSession((s) => s.error)
  const result = useCurrentResult()
  const blocker = blockerOf(position)
  return {
    status,
    error,
    result,
    running: isAnalysisRunning(status),
    blocker,
    turn,
    calculate: () => {
      if (position && !blocker) controller.start(position, useAnalysisSettings.getState())
    },
    stop: () => controller.stop(),
  }
}

/**
 * Arrows for the board: the best line's first move, and fainter ones for the other lines.
 * Compose this with the editor's board in `app/`; features do not import each other.
 */
export function useAnalysisArrows(): readonly BoardArrow[] {
  const result = useCurrentResult()
  return useMemo(
    () =>
      (result?.lines ?? []).flatMap((line, index): BoardArrow[] => {
        const move = line.pv[0]
        if (!move) return []
        return [
          index === 0
            ? { from: move.from, to: move.to, tone: 'primary' }
            : { from: move.from, to: move.to, tone: 'secondary', thin: true },
        ]
      }),
    [result],
  )
}
