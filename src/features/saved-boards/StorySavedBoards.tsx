import { useState, type ReactNode } from 'react'
import { resetEditorStore, useSavedBoards, type SavedBoard } from '@/state'
import { SAMPLE_BOARDS } from './samples'

/** Stories and tests only: resets the editor and fills the saved boards with `boards`. */
export function StorySavedBoards({
  boards = SAMPLE_BOARDS,
  children,
}: {
  boards?: readonly SavedBoard[]
  children: ReactNode
}) {
  useState(() => {
    resetEditorStore()
    useSavedBoards.setState({ boards })
  })
  return children
}
