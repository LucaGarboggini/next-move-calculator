import type { AnalyzeOptions } from '@/engine'
import type { AnalysisSettings } from '@/state'

/**
 * Turns the user's settings into engine limits. A time limit and a depth limit can both be set:
 * the search ends at whichever is reached first. With neither it runs until stopped.
 */
export function searchOptions(settings: AnalysisSettings): AnalyzeOptions {
  return {
    multiPv: settings.multiPv,
    limits: {
      ...(!settings.infinite && { movetimeMs: settings.movetimeSec * 1000 }),
      ...(settings.depth !== null && { depth: settings.depth }),
    },
  }
}

/** Whether a search with these settings reaches a limit by itself, which auto-move needs. */
export const endsByItself = (settings: AnalysisSettings): boolean =>
  !settings.infinite || settings.depth !== null
