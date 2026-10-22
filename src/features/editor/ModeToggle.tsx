import { Pencil, Play } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useEditorSnapshot, useEditorStore, type EditorMode } from '@/state'
import { ToggleGroup, ToggleGroupItem } from '@/ui'
import { EDITOR_NAMESPACE } from './i18n'

const isMode = (value: string): value is EditorMode => value === 'edit' || value === 'play'

/** Switches between building the position and playing legal moves from it. */
export function ModeToggle() {
  const { t } = useTranslation(EDITOR_NAMESPACE)
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const { position } = useEditorSnapshot()

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={mode}
      // Radix reports "" when the pressed item is pressed again; one mode is always active.
      onValueChange={(value) => isMode(value) && setMode(value)}
      aria-label={t('mode.label')}
      className="w-full"
    >
      <ToggleGroupItem value="edit" className="flex-1">
        <Pencil aria-hidden />
        {t('mode.edit')}
      </ToggleGroupItem>
      <ToggleGroupItem value="play" disabled={!position} className="flex-1">
        <Play aria-hidden />
        {t('mode.play')}
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
