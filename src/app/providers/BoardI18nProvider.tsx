import { useMemo, type ReactNode } from 'react'
import {
  BOARD_NAMESPACE,
  BoardMessagesContext,
  boardTranslations,
  createBoardMessages,
} from '@/board'
import { registerTranslations, useTranslation } from '@/i18n'

registerTranslations(BOARD_NAMESPACE, boardTranslations)

/** The board layer cannot import i18n, so the app hands it translated messages. */
export function BoardI18nProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation(BOARD_NAMESPACE)
  const messages = useMemo(
    () => createBoardMessages((key, vars) => t(key, vars)),
    // `t` changes identity when the language changes.
    [t],
  )
  return <BoardMessagesContext value={messages}>{children}</BoardMessagesContext>
}
