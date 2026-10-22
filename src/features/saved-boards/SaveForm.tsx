import { Save } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { playedEntries, makePgn, type MoveHistory } from '@/core'
import { useTranslation } from '@/i18n'
import {
  MAX_NAME_LENGTH,
  MAX_SAVED_BOARDS,
  documentFen,
  useEditorStore,
  useSavedBoards,
  type EditorDocument,
} from '@/state'
import { Button, Input, Label } from '@/ui'
import { SAVED_BOARDS_NAMESPACE } from './i18n'

/** The game as shown on the board: moves after the cursor are not part of this position. */
function shownPgn(document: EditorDocument): string | null {
  const { game } = document
  if (!game) return null
  const shown: MoveHistory = { ...game, entries: playedEntries(game) }
  return shown.entries.length > 0 ? makePgn(shown) : null
}

/** Names the board on screen and saves it, with its moves when it has any. */
export function SaveForm() {
  const { t } = useTranslation(SAVED_BOARDS_NAMESPACE)
  const id = useId()
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const count = useSavedBoards((s) => s.boards.length)
  const full = count >= MAX_SAVED_BOARDS

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const { document, orientation } = useEditorStore.getState()
    const saved = useSavedBoards.getState().save({
      name,
      fen: documentFen(document),
      pgn: shownPgn(document),
      orientation,
    })
    if (!saved) return
    setName('')
    setMessage(t('saved', { name: saved.name }))
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <Label htmlFor={`${id}-name`}>{t('name.label')}</Label>
      <div className="flex gap-2">
        <Input
          id={`${id}-name`}
          value={name}
          maxLength={MAX_NAME_LENGTH}
          placeholder={t('name.placeholder')}
          autoComplete="off"
          onChange={(event) => {
            setName(event.target.value)
            setMessage('')
          }}
        />
        <Button type="submit" disabled={!name.trim() || full}>
          <Save aria-hidden data-icon="inline-start" />
          {t('save')}
        </Button>
      </div>
      {full && (
        <p className="text-sm text-muted-foreground">{t('full', { max: MAX_SAVED_BOARDS })}</p>
      )}
      <p role="status" className="text-sm text-muted-foreground">
        {message}
      </p>
    </form>
  )
}
