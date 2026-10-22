import { useRef, type ReactNode } from 'react'
import type { BoardHandle } from '@/board'
import { BoardHandleContext } from './board-handle'

/** Wrap the shell with this so the editor's board and panels can work together. */
export function EditorProvider({ children }: { children: ReactNode }) {
  const handle = useRef<BoardHandle>(null)
  return <BoardHandleContext value={handle}>{children}</BoardHandleContext>
}
