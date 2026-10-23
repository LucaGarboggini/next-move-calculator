import type { Color } from './types'

/** Engine score as UCI reports it: from the side to move's point of view. */
export type Score =
  | { readonly kind: 'cp'; readonly cp: number }
  /** `moves` > 0: side to move mates in that many; < 0: is mated; 0: is checkmated now. */
  | { readonly kind: 'mate'; readonly moves: number }

/** The same score from White's point of view, as displayed. */
export type WhiteScore =
  | { readonly kind: 'cp'; readonly cp: number }
  /** `moves` is always ≥ 0 (full moves until mate); `winner` says who mates. */
  | { readonly kind: 'mate'; readonly winner: Color; readonly moves: number }

export function toWhiteScore(score: Score, turn: Color): WhiteScore {
  if (score.kind === 'cp') return { kind: 'cp', cp: turn === 'white' ? score.cp : -score.cp }
  const sideWins = score.moves > 0
  const winner: Color = sideWins === (turn === 'white') ? 'white' : 'black'
  return { kind: 'mate', winner, moves: Math.abs(score.moves) }
}

/**
 * Display text for a White-POV score: "+0.35", "-1.20", "0.00", mates as "#3"
 * (White mates in 3) or "#-3" (Black mates in 3). A delivered checkmate reads
 * as the result, "1-0" or "0-1".
 */
export function formatEval(score: WhiteScore): string {
  if (score.kind === 'mate') {
    if (score.moves === 0) return score.winner === 'white' ? '1-0' : '0-1'
    return score.winner === 'white' ? `#${score.moves}` : `#-${score.moves}`
  }
  const pawns = Math.round(score.cp) / 100
  if (pawns === 0) return '0.00'
  return `${pawns > 0 ? '+' : '-'}${Math.abs(pawns).toFixed(2)}`
}

/**
 * At most four characters, for a narrow eval bar: "+0.4", "-3.2", "+12", "0.0"; mates and results
 * as in `formatEval` ("#3", "#-3", "1-0").
 */
export function formatEvalCompact(score: WhiteScore): string {
  if (score.kind === 'mate') return formatEval(score)
  const tenths = Math.round(score.cp / 10)
  if (tenths === 0) return '0.0'
  const sign = tenths > 0 ? '+' : '-'
  const abs = Math.abs(tenths)
  return abs < 100 ? `${sign}${(abs / 10).toFixed(1)}` : `${sign}${Math.round(abs / 10)}`
}

/** Steepness of the centipawn-to-win-chance curve (the one lichess uses for its eval bar). */
const SHARE_STEEPNESS = 0.00368208

/**
 * How much of an eval bar White's side fills, from 0 (Black is winning) to 1 (White is winning),
 * 0.5 when equal. Centipawns follow a logistic curve so a big edge does not flatten the bar
 * too early; a forced mate fills it completely.
 */
export function whiteShare(score: WhiteScore): number {
  if (score.kind === 'mate') return score.winner === 'white' ? 1 : 0
  return 1 / (1 + Math.exp(-SHARE_STEEPNESS * score.cp))
}
