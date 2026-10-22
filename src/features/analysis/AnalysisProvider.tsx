import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createStockfishEngine, type Engine } from '@/engine'
import { useEditorSnapshot, useSettings } from '@/state'
import { AnalysisShortcuts } from './AnalysisShortcuts'
import { AnalysisController } from './controller'
import { AnalysisControllerContext } from './controller-context'

/** Lite or Full, as chosen in the settings when the engine is created. */
const createDefaultEngine = (): Engine =>
  createStockfishEngine({ size: useSettings.getState().engineSize })

export interface AnalysisProviderProps {
  children: ReactNode
  /** Swap the engine (tests, stories). Called once per engine, on the first search. */
  createEngine?: () => Engine
}

/**
 * Owns the analysis engine for the app. Wrap the shell with this so the board and the panels
 * share one search. While mounted it keeps results honest: a search ends and its result is
 * cleared when the position changes, and a search stops when the tab goes to the background.
 * Changing the engine size in the settings drops the running engine; the next search loads the
 * chosen one.
 */
export function AnalysisProvider({
  children,
  createEngine = createDefaultEngine,
}: AnalysisProviderProps) {
  const [controller] = useState(() => new AnalysisController(createEngine))
  const fen = useEditorSnapshot().position?.fen

  // A result belongs to one position: leaving it cancels the search and clears the result.
  const analysed = useRef(fen)
  useEffect(() => {
    if (analysed.current === fen) return
    analysed.current = fen
    controller.reset()
  }, [controller, fen])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) controller.pause()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [controller])

  const engineSize = useSettings((s) => s.engineSize)
  const engineSizeInUse = useRef(engineSize)
  useEffect(() => {
    if (engineSizeInUse.current === engineSize) return
    engineSizeInUse.current = engineSize
    controller.reset()
    controller.dispose()
  }, [controller, engineSize])

  // Releases the engine worker; the controller makes a new engine if it is used again.
  useEffect(() => () => controller.dispose(), [controller])

  return (
    <AnalysisControllerContext value={controller}>
      <AnalysisShortcuts />
      {children}
    </AnalysisControllerContext>
  )
}
