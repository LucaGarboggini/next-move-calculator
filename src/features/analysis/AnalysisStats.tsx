import { useTranslation } from '@/i18n'
import type { AnalysisResult } from '@/state'
import { formatElapsed, formatNodes, formatSpeed } from './format'
import { ANALYSIS_NAMESPACE } from './i18n'

/** Depth, speed, nodes and time of the search so far. */
export function AnalysisStats({ result }: { result: AnalysisResult }) {
  const { t } = useTranslation(ANALYSIS_NAMESPACE)
  const best = result.lines[0]
  const items: [string, string | undefined][] = [
    [
      t('stats.depth'),
      best && (result.selDepth ? `${best.depth}/${result.selDepth}` : String(best.depth)),
    ],
    [
      t('stats.speed'),
      result.nps !== undefined
        ? t('stats.speedUnit', { value: formatSpeed(result.nps) })
        : undefined,
    ],
    [t('stats.nodes'), result.nodes !== undefined ? formatNodes(result.nodes) : undefined],
    [t('stats.time'), result.timeMs !== undefined ? formatElapsed(result.timeMs) : undefined],
  ]
  return (
    <dl
      aria-label={t('stats.label')}
      data-testid="analysis-stats"
      className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm"
    >
      {items.map(([name, value]) => (
        <div key={name} className="flex items-baseline justify-between gap-2">
          <dt className="text-muted-foreground">{name}</dt>
          <dd className="font-mono tabular-nums">{value ?? '–'}</dd>
        </div>
      ))}
    </dl>
  )
}
