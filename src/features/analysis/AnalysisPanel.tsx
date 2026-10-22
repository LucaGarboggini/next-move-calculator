import { Play, Square } from 'lucide-react'
import { formatEval, formatMove, whiteShare, type WhiteScore } from '@/core'
import { useTranslation } from '@/i18n'
import { useSettings } from '@/state'
import { Alert, AlertDescription, Button, Card, CardContent, CardHeader, CardTitle } from '@/ui'
import { AnalysisLines } from './AnalysisLines'
import { AnalysisStats } from './AnalysisStats'
import { EvalBar } from './EvalBar'
import { useAnalysis } from './hooks'
import { ANALYSIS_NAMESPACE } from './i18n'
import { usePlayLine } from './usePlayLine'

/** Which side the eval favours, in words (the bar and number are not enough for everyone). */
function advantage(score: WhiteScore): 'whiteAhead' | 'blackAhead' | 'equal' {
  const share = whiteShare(score)
  if (share > 0.52) return 'whiteAhead'
  if (share < 0.48) return 'blackAhead'
  return 'equal'
}

/** Calculate/Stop, the evaluation, the best move, search statistics and the engine's lines. */
export function AnalysisPanel() {
  const { t } = useTranslation(ANALYSIS_NAMESPACE)
  const { status, error, result, running, blocker, turn, calculate, stop } = useAnalysis()
  const playLine = usePlayLine()
  const notation = useSettings((s) => s.notation)

  const best = result?.lines[0]
  const bestMove = best?.pv[0]
  const bestText = best && bestMove ? formatMove(notation, best.san[0] ?? '', bestMove) : undefined
  const message = blocker ? t(`blocked.${blocker}`) : t(`status.${status}`, { message: error })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('panels.analysis')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium" data-testid="analysis-side-to-move">
            {t(`toMove.${result?.turn ?? turn}`)}
          </p>
          {running ? (
            <Button type="button" size="lg" variant="outline" onClick={stop}>
              <Square aria-hidden data-icon="inline-start" />
              {t('actions.stop')}
            </Button>
          ) : (
            <Button type="button" size="lg" disabled={blocker !== undefined} onClick={calculate}>
              <Play aria-hidden data-icon="inline-start" />
              {t('actions.calculate')}
            </Button>
          )}
          {status === 'error' && !blocker ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : (
            <p role="status" className="text-sm text-muted-foreground">
              {message}
            </p>
          )}
        </div>

        {result && best && (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  data-testid="analysis-eval"
                  className="font-mono text-2xl font-semibold tabular-nums"
                >
                  {formatEval(best.score)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t(`eval.${advantage(best.score)}`)}
                </span>
              </div>
              <EvalBar score={best.score} label={formatEval(best.score)} />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">{t('best.label')}</span>
              <Button
                type="button"
                variant="secondary"
                data-testid="best-move"
                aria-label={t('best.play', { move: bestText })}
                className="font-mono"
                onClick={() => playLine(best.pv, 1)}
              >
                {bestText}
              </Button>
            </div>

            <AnalysisStats result={result} />
            <AnalysisLines
              lines={result.lines}
              turn={result.turn}
              fullmoves={result.fullmoves}
              onPlay={playLine}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
