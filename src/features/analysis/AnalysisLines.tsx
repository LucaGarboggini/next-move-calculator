import { memo } from 'react'
import { formatEval, formatMove, type Color, type Move, type Notation } from '@/core'
import { useTranslation } from '@/i18n'
import { useSettings, type AnalysisLine } from '@/state'
import { lineText, lineTokens } from './format'
import { ANALYSIS_NAMESPACE } from './i18n'

/** Engine lines can run 30 moves or more; the first plies are what a player acts on. */
export const MAX_PLIES = 16

/** Plays the first `count` moves of a line on the board. */
export type PlayLine = (moves: readonly Move[], count: number) => void

/** Tall enough to tap on touch screens (`control-sm` grows to 44 px there), clear focus ring. */
const moveButtonClass =
  'min-h-control-sm rounded-md px-1.5 font-mono text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50'

/** The first plies of a line, written in the user's notation. */
const writtenLine = (line: AnalysisLine, notation: Notation): string[] =>
  line.san.slice(0, MAX_PLIES).map((san, i) => {
    const move = line.pv[i]
    return move ? formatMove(notation, san, move) : san
  })

interface LineRowProps {
  line: AnalysisLine
  turn: Color
  fullmoves: number
  onPlay: PlayLine
}

const LineRow = memo(function LineRow({ line, turn, fullmoves, onPlay }: LineRowProps) {
  const { t } = useTranslation(ANALYSIS_NAMESPACE)
  const notation = useSettings((s) => s.notation)
  const tokens = lineTokens(turn, fullmoves, writtenLine(line, notation))
  return (
    <li
      data-testid="analysis-line"
      aria-label={t('lines.line', { index: line.multiPv })}
      className="flex flex-col gap-1 rounded-md border border-border p-2"
    >
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-sm font-semibold tabular-nums">
          {formatEval(line.score)}
        </span>
        <span className="text-xs text-muted-foreground">
          {t('lines.depth', { depth: line.depth })}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-0.5">
        {tokens.map((token) => (
          <span key={token.index} className="inline-flex items-center">
            {token.number && (
              <span className="px-0.5 text-sm text-muted-foreground tabular-nums">
                {token.number}
              </span>
            )}
            <button
              type="button"
              className={moveButtonClass}
              aria-label={t('lines.play', { line: lineText(tokens, token.index + 1) })}
              onClick={() => onPlay(line.pv, token.index + 1)}
            >
              {token.san}
            </button>
          </span>
        ))}
        {line.san.length > MAX_PLIES && (
          <span aria-hidden="true" className="px-1 text-muted-foreground">
            …
          </span>
        )}
      </div>
    </li>
  )
})

export interface AnalysisLinesProps {
  lines: readonly AnalysisLine[]
  /** Side to move and move number at the start of every line. */
  turn: Color
  fullmoves: number
  onPlay: PlayLine
}

/** The engine's lines, best first. Pick a move to play the line up to and including it. */
export function AnalysisLines({ lines, turn, fullmoves, onPlay }: AnalysisLinesProps) {
  const { t } = useTranslation(ANALYSIS_NAMESPACE)
  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('lines.empty')}</p>
  }
  return (
    <ol aria-label={t('lines.label')} className="flex flex-col gap-2">
      {lines.map((line) => (
        <LineRow key={line.multiPv} line={line} turn={turn} fullmoves={fullmoves} onPlay={onPlay} />
      ))}
    </ol>
  )
}
