import { useState, type ReactNode } from 'react'
import {
  DEFAULT_ANALYSIS_SETTINGS,
  resetAnalysisSession,
  resetEditorStore,
  useAnalysisSettings,
  useEditorStore,
  useSettings,
  type AnalysisResult,
  type AnalysisStatus,
} from '@/state'
import { AnalysisProvider } from './AnalysisProvider'
import { FakeEngine } from './testing/fake-engine'

export interface StoryAnalysisProps {
  /** FEN or PGN to load into the editor first. */
  text?: string
  status?: AnalysisStatus
  result?: AnalysisResult
  error?: string
  /** Tests: the engine to drive by hand; stories get one that never computes. */
  engine?: FakeEngine
  children: ReactNode
}

/**
 * Stories and tests only: resets the editor, the analysis settings and the session, then renders
 * `children` inside an `AnalysisProvider` whose engine never computes anything.
 */
export function StoryAnalysis({
  text,
  status,
  result,
  error,
  engine,
  children,
}: StoryAnalysisProps) {
  useState(() => {
    resetEditorStore()
    if (text) useEditorStore.getState().load(text)
    useAnalysisSettings.setState(DEFAULT_ANALYSIS_SETTINGS)
    useSettings.getState().reset()
    resetAnalysisSession({
      ...(status && { status }),
      ...(result && { result }),
      ...(error && { error }),
    })
  })
  return (
    <AnalysisProvider createEngine={() => engine ?? new FakeEngine()}>{children}</AnalysisProvider>
  )
}
