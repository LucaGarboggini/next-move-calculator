import { createContext, useContext } from 'react'
import { DEFAULT_MESSAGES, type BoardMessages } from './messages'

/** Provide messages built with `createBoardMessages`; the app binds them to i18next. */
export const BoardMessagesContext = createContext<BoardMessages>(DEFAULT_MESSAGES)

export const useBoardMessages = (): BoardMessages => useContext(BoardMessagesContext)
