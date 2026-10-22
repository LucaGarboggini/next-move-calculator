import { useState } from 'react'
import { useTranslation } from '@/i18n'
import { useSavedBoards, type SavedBoard } from '@/state'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui'
import { SAVED_BOARDS_NAMESPACE } from './i18n'
import { loadSavedBoard } from './loadSavedBoard'
import { SavedBoardRow } from './SavedBoardRow'

/** The saved boards, newest first. Deleting asks first, because it cannot be undone. */
export function SavedBoardsList() {
  const { t } = useTranslation(SAVED_BOARDS_NAMESPACE)
  const boards = useSavedBoards((s) => s.boards)
  const [message, setMessage] = useState('')
  const [deleting, setDeleting] = useState<SavedBoard | null>(null)

  return (
    <div className="flex flex-col gap-2">
      {boards.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <ul aria-label={t('list')} className="flex max-h-80 flex-col gap-2 overflow-y-auto">
          {boards.map((board) => (
            <SavedBoardRow
              key={board.id}
              board={board}
              onLoad={(selected) =>
                setMessage(
                  loadSavedBoard(selected) ? t('loaded', { name: selected.name }) : t('loadFailed'),
                )
              }
              onRename={(selected, name) => useSavedBoards.getState().rename(selected.id, name)}
              onDelete={setDeleting}
            />
          ))}
        </ul>
      )}
      <p role="status" className="text-sm text-muted-foreground">
        {message}
      </p>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent closeLabel={t('close')}>
          <DialogHeader>
            <DialogTitle>{t('deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteDescription', { name: deleting?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
              {t('cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (deleting) useSavedBoards.getState().remove(deleting.id)
                setDeleting(null)
              }}
            >
              {t('deleteConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
