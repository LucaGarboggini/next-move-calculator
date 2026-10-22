import { whiteShare, type WhiteScore } from '@/core'
import { useTranslation } from '@/i18n'
import { cn } from '@/ui'
import { ANALYSIS_NAMESPACE } from './i18n'

export interface EvalBarProps {
  /** Evaluation from White's point of view; the bar is level while there is none. */
  score?: WhiteScore
  /** Spoken value, e.g. "+0.35" (the visible number is shown next to the bar). */
  label?: string
  className?: string
}

/** White's share of the bar grows with White's advantage; a forced mate fills it completely. */
export function EvalBar({ score, label, className }: EvalBarProps) {
  const { t } = useTranslation(ANALYSIS_NAMESPACE)
  const share = score ? whiteShare(score) : 0.5
  return (
    <div
      role="img"
      aria-label={label ? t('eval.value', { value: label }) : t('eval.none')}
      data-slot="eval-bar"
      className={cn(
        'relative h-3 w-full overflow-hidden rounded-full border border-border bg-eval-black',
        className,
      )}
    >
      <div
        data-slot="eval-bar-white"
        className="h-full bg-eval-white transition-[width] motion-base ease-standard motion-reduce:transition-none"
        style={{ width: `${(share * 100).toFixed(1)}%` }}
      />
      <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-border" />
    </div>
  )
}
