import { formatEval, formatEvalCompact, whiteShare, type Color, type WhiteScore } from '@/core'
import { useTranslation } from '@/i18n'
import { useEditorStore } from '@/state'
import { BalanceBar, type BalanceBarProps } from '@/ui'
import { advantageOf } from './format'
import { useBoardEval } from './hooks'
import { ANALYSIS_NAMESPACE } from './i18n'

export interface EvalBarProps {
  /** Evaluation from White's point of view; the bar is level while there is none. */
  score?: WhiteScore
  /** The side at the bottom of the board. White's part grows from that side's end. */
  orientation?: Color
  /** `responsive`: above the board when stacked, beside it side by side. */
  axis?: BalanceBarProps['axis']
  className?: string
}

/**
 * Who's winning: White's share is White's winning chance on lichess's curve, so small evals move
 * it gently, and a forced mate fills it. Shows the eval in short; screen readers get it in full,
 * with which side is ahead.
 */
export function EvalBar({
  score,
  orientation = 'white',
  axis = 'responsive',
  className,
}: EvalBarProps) {
  const { t } = useTranslation(ANALYSIS_NAMESPACE)
  const share = score ? whiteShare(score) : 0.5
  return (
    <BalanceBar
      role="meter"
      aria-label={t('eval.bar')}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(share * 100)}
      aria-valuetext={
        score
          ? t('eval.summary', {
              value: formatEval(score),
              advantage: t(`eval.${advantageOf(score)}`),
            })
          : t('eval.none')
      }
      data-testid="eval-bar"
      data-orientation={orientation}
      value={share}
      from={orientation === 'white' ? 'start' : 'end'}
      axis={axis}
      label={score && formatEvalCompact(score)}
      className={className}
    />
  )
}

/** The bar for the position on the board, oriented like the board. `app/` puts it next to the board. */
export function BoardEvalBar() {
  const score = useBoardEval()
  const orientation = useEditorStore((s) => s.orientation)
  return <EvalBar score={score} orientation={orientation} />
}
