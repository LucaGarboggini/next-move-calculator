import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from '@/i18n'
import { useEditorStore } from '@/state'
import { Button, cn } from '@/ui'
import { EDITOR_NAMESPACE } from './i18n'
import { moveRows, type MoveCell } from './moveRows'

/** The moves of the loaded or played game; pick one to see the position after it. */
export function MoveList() {
  const { t } = useTranslation(EDITOR_NAMESPACE)
  const game = useEditorStore((s) => s.document.game)
  const goToPly = useEditorStore((s) => s.goToPly)
  const rows = useMemo(() => (game ? moveRows(game) : []), [game])

  if (!game || game.entries.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('moves.empty')}</p>
  }

  const { cursor } = game
  const last = game.entries.length

  const cell = (move: MoveCell | undefined) =>
    move ? (
      <button
        type="button"
        aria-current={move.ply === cursor ? 'step' : undefined}
        onClick={() => goToPly(move.ply)}
        className={cn(
          'min-h-control-sm rounded-md px-2 text-left font-mono text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
          move.ply === cursor && 'bg-primary text-primary-foreground hover:bg-primary',
        )}
      >
        {move.san}
      </button>
    ) : (
      <span aria-hidden="true" className="px-2 text-muted-foreground">
        …
      </span>
    )

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label={t('moves.label')} className="flex gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t('moves.first')}
          title={t('moves.first')}
          disabled={cursor === 0}
          onClick={() => goToPly(0)}
        >
          <ChevronFirst aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t('moves.previous')}
          title={t('moves.previous')}
          disabled={cursor === 0}
          onClick={() => goToPly(cursor - 1)}
        >
          <ChevronLeft aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t('moves.next')}
          title={t('moves.next')}
          disabled={cursor === last}
          onClick={() => goToPly(cursor + 1)}
        >
          <ChevronRight aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t('moves.last')}
          title={t('moves.last')}
          disabled={cursor === last}
          onClick={() => goToPly(last)}
        >
          <ChevronLast aria-hidden />
        </Button>
      </div>
      <ol aria-label={t('moves.label')} className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
        {rows.map((row) => (
          <li key={row.number} className="grid grid-cols-[3rem_1fr_1fr] items-center">
            <span className="text-sm text-muted-foreground tabular-nums">{row.number}.</span>
            {cell(row.white)}
            {cell(row.black)}
          </li>
        ))}
      </ol>
    </div>
  )
}
