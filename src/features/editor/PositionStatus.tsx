import { CircleAlert, CircleCheck, TriangleAlert } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { hasErrors } from '@/core'
import { useEditorSnapshot, useEditorStore } from '@/state'
import { Alert, AlertDescription, AlertTitle } from '@/ui'
import { describeIssue } from './issues'
import { EDITOR_NAMESPACE } from './i18n'

/**
 * Whose move it is, whether the position can be analyzed, and, when it cannot, every
 * reason why. Unusual-but-legal positions get warnings that do not block.
 */
export function PositionStatus() {
  const { t } = useTranslation(EDITOR_NAMESPACE)
  const { issues, position } = useEditorSnapshot()
  const turn = useEditorStore((s) => s.document.setup.turn)

  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')
  const blocked = hasErrors(issues)

  const gameState =
    position && position.status !== 'ongoing'
      ? t(`status.${position.status}`)
      : position?.isCheck
        ? t('status.check')
        : undefined

  return (
    <div className="flex flex-col gap-2" data-testid="position-status">
      <p className="text-sm font-medium" data-testid="side-to-move">
        {t(`status.toMove.${turn}`)}
        {gameState && <span className="text-muted-foreground"> · {gameState}</span>}
      </p>

      {blocked ? (
        <Alert variant="destructive" role="alert">
          <CircleAlert aria-hidden />
          <AlertTitle>{t('status.blocked')}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {errors.map((issue, index) => (
                <li key={`${issue.code}-${index}`}>{describeIssue(t, issue)}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="success" role="status">
          <CircleCheck aria-hidden />
          <AlertTitle>{t('status.ready')}</AlertTitle>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert variant="warning" role="status">
          <TriangleAlert aria-hidden />
          <AlertTitle>{t('status.warnings')}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {warnings.map((issue, index) => (
                <li key={`${issue.code}-${index}`}>{describeIssue(t, issue)}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
