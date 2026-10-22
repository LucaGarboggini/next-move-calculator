import { useTranslation } from '@/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui'
import { SAVED_BOARDS_NAMESPACE } from './i18n'
import { SaveForm } from './SaveForm'
import { SavedBoardsList } from './SavedBoardsList'

/** Save the board on screen under a name, and come back to it later. */
export function SavedBoardsPanel() {
  const { t } = useTranslation(SAVED_BOARDS_NAMESPACE)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SaveForm />
        <SavedBoardsList />
      </CardContent>
    </Card>
  )
}
