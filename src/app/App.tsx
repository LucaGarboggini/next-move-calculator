import { AnalysisProvider } from '@/features/analysis'
import { EditorProvider } from '@/features/editor'
import { Providers } from './providers/Providers'
import { AnalysisBoard } from './AnalysisBoard'
import { Shell } from './Shell'

export function App() {
  return (
    <Providers>
      <EditorProvider>
        <AnalysisProvider>
          <Shell board={<AnalysisBoard />} />
        </AnalysisProvider>
      </EditorProvider>
    </Providers>
  )
}
