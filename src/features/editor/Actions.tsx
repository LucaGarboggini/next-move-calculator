import { FlipVertical2, Redo2, RotateCcw, Trash2, Undo2 } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useEditorStore } from '@/state'
import { Button } from '@/ui'
import { EDITOR_NAMESPACE } from './i18n'

/** Start, clear, flip, undo and redo. */
export function Actions() {
  const { t } = useTranslation(EDITOR_NAMESPACE)
  const canUndo = useEditorStore((s) => s.past.length > 0)
  const canRedo = useEditorStore((s) => s.future.length > 0)
  const { reset, clear, flip, undo, redo } = useEditorStore.getState()

  return (
    <div role="group" aria-label={t('actions.label')} className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={reset}>
        <RotateCcw aria-hidden />
        {t('actions.start')}
      </Button>
      <Button type="button" variant="outline" onClick={clear}>
        <Trash2 aria-hidden />
        {t('actions.clear')}
      </Button>
      <Button type="button" variant="outline" onClick={flip}>
        <FlipVertical2 aria-hidden />
        {t('actions.flip')}
      </Button>
      <Button type="button" variant="outline" disabled={!canUndo} onClick={undo}>
        <Undo2 aria-hidden />
        {t('actions.undo')}
      </Button>
      <Button type="button" variant="outline" disabled={!canRedo} onClick={redo}>
        <Redo2 aria-hidden />
        {t('actions.redo')}
      </Button>
    </div>
  )
}
