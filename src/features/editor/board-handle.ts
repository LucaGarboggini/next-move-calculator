import { createContext, useContext, type RefObject } from 'react'
import type { BoardHandle } from '@/board'

/**
 * The board and the palette live in different slots of the shell, so the palette reaches
 * the board's `dragNewPiece` through this shared ref (provided by `EditorProvider`).
 */
export const BoardHandleContext = createContext<RefObject<BoardHandle | null>>({ current: null })

export const useBoardHandle = (): RefObject<BoardHandle | null> => useContext(BoardHandleContext)
