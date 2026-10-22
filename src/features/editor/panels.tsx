import { useTranslation } from '@/i18n'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui'
import { Actions } from './Actions'
import { FenPgnField } from './FenPgnField'
import { MoveList } from './MoveList'
import { ModeToggle } from './ModeToggle'
import { Palette } from './Palette'
import { PositionOptions } from './PositionOptions'
import { PositionStatus } from './PositionStatus'
import { useEditorStore } from '@/state'
import { EDITOR_NAMESPACE } from './i18n'

/** Mode, spare pieces, board actions, position options and the validity status. */
export function PositionPanel() {
  const { t } = useTranslation(EDITOR_NAMESPACE)
  const mode = useEditorStore((s) => s.mode)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('panels.position')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ModeToggle />
        {mode === 'edit' && <Palette />}
        <Actions />
        {mode === 'edit' && <PositionOptions />}
        <PositionStatus />
      </CardContent>
    </Card>
  )
}

/** FEN and PGN: paste to load, copy to export. */
export function FenPanel() {
  const { t } = useTranslation(EDITOR_NAMESPACE)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('panels.fen')}</CardTitle>
      </CardHeader>
      <CardContent>
        <FenPgnField />
      </CardContent>
    </Card>
  )
}

export function MovesPanel() {
  const { t } = useTranslation(EDITOR_NAMESPACE)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('panels.moves')}</CardTitle>
      </CardHeader>
      <CardContent>
        <MoveList />
      </CardContent>
    </Card>
  )
}
