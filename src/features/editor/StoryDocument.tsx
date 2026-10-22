import { useState, type ReactNode } from 'react'
import { resetEditorStore, useEditorStore, type EditorMode } from '@/state'
import { EditorProvider } from './EditorProvider'

/**
 * Stories and tests only: resets the editor store, optionally loads a FEN or PGN and sets
 * the mode, then renders `children` inside an `EditorProvider`.
 */
export function StoryDocument({
  text,
  mode = 'edit',
  children,
}: {
  text?: string
  mode?: EditorMode
  children: ReactNode
}) {
  useState(() => {
    resetEditorStore()
    if (text) useEditorStore.getState().load(text)
    useEditorStore.getState().setMode(mode)
  })
  return <EditorProvider>{children}</EditorProvider>
}
