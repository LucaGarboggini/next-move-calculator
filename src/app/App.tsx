import { EditorBoard, EditorProvider } from '@/features/editor'
import { Providers } from './providers/Providers'
import { Shell } from './Shell'

export function App() {
  return (
    <Providers>
      <EditorProvider>
        <Shell board={<EditorBoard />} />
      </EditorProvider>
    </Providers>
  )
}
