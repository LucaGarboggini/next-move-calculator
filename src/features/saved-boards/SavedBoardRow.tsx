import { Check, FolderOpen, Pencil, Trash2, X } from 'lucide-react'
import { useId, useState } from 'react'
import { i18n, useTranslation } from '@/i18n'
import { MAX_NAME_LENGTH, type SavedBoard } from '@/state'
import { Button, Input, Label } from '@/ui'
import { SAVED_BOARDS_NAMESPACE } from './i18n'

export interface SavedBoardRowProps {
  board: SavedBoard
  onLoad: (board: SavedBoard) => void
  onRename: (board: SavedBoard, name: string) => void
  onDelete: (board: SavedBoard) => void
}

/** One saved board: its name and date, and load, rename and delete. */
export function SavedBoardRow({ board, onLoad, onRename, onDelete }: SavedBoardRowProps) {
  const { t } = useTranslation(SAVED_BOARDS_NAMESPACE)
  const id = useId()
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(board.name)

  const date = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(board.savedAt)

  if (renaming) {
    const finish = (save: boolean) => {
      if (save && name.trim()) onRename(board, name)
      setRenaming(false)
    }
    return (
      <li className="flex flex-col gap-2 rounded-md border border-border p-2">
        <Label htmlFor={`${id}-rename`} className="sr-only">
          {t('renameField')}
        </Label>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            finish(true)
          }}
        >
          <Input
            id={`${id}-rename`}
            autoFocus
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && finish(false)}
          />
          <Button
            type="submit"
            size="icon"
            aria-label={t('renameSave')}
            title={t('renameSave')}
            disabled={!name.trim()}
          >
            <Check aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t('cancel')}
            title={t('cancel')}
            onClick={() => finish(false)}
          >
            <X aria-hidden />
          </Button>
        </form>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-2 rounded-md border border-border p-2">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{board.name}</span>
        <span className="text-xs text-muted-foreground">
          {t('savedOn', { date })}
          {board.pgn ? ` · ${t('withMoves')}` : ''}
        </span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={t('load', { name: board.name })}
        title={t('load', { name: board.name })}
        onClick={() => onLoad(board)}
      >
        <FolderOpen aria-hidden />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={t('rename', { name: board.name })}
        title={t('rename', { name: board.name })}
        onClick={() => {
          setName(board.name)
          setRenaming(true)
        }}
      >
        <Pencil aria-hidden />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={t('delete', { name: board.name })}
        title={t('delete', { name: board.name })}
        onClick={() => onDelete(board)}
      >
        <Trash2 aria-hidden />
      </Button>
    </li>
  )
}
