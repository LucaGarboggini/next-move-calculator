import { createContext, useContext } from 'react'
import type { AnalysisController } from './controller'

export const AnalysisControllerContext = createContext<AnalysisController | undefined>(undefined)

/** The controller of the surrounding `AnalysisProvider`. */
export function useAnalysisController(): AnalysisController {
  const controller = useContext(AnalysisControllerContext)
  if (!controller) throw new Error('Wrap the app in <AnalysisProvider>')
  return controller
}
