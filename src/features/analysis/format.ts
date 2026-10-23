import { whiteShare, type Color, type WhiteScore } from '@/core'

/** One move of a line as shown: SAN, with its move number on White's moves and at the start. */
export interface LineToken {
  /** Index of the move within the line; playing the token plays moves `0..index`. */
  readonly index: number
  readonly san: string
  /** "12." before a White move, "12..." before a Black move that starts the line. */
  readonly number?: string
}

/** Numbers the SAN of a line that starts with `turn` to move at move number `fullmoves`. */
export function lineTokens(
  turn: Color,
  fullmoves: number,
  san: readonly string[],
): readonly LineToken[] {
  return san.map((move, index) => {
    const white = (index % 2 === 0) === (turn === 'white')
    const number = fullmoves + Math.floor((index + (turn === 'black' ? 1 : 0)) / 2)
    return {
      index,
      san: move,
      ...(white ? { number: `${number}.` } : index === 0 ? { number: `${number}...` } : {}),
    }
  })
}

/** "1. e4 e5 2. Nf3" for the first `count` tokens: the text of the line up to a move. */
export function lineText(tokens: readonly LineToken[], count: number = tokens.length): string {
  return tokens
    .slice(0, count)
    .map((token) => (token.number ? `${token.number} ${token.san}` : token.san))
    .join(' ')
}

/** Nodes per second as "950", "12.3k" or "1.4M". */
export function formatSpeed(nps: number): string {
  if (nps >= 1_000_000) return `${(nps / 1_000_000).toFixed(1)}M`
  if (nps >= 1_000) return `${(nps / 1_000).toFixed(nps >= 100_000 ? 0 : 1)}k`
  return String(Math.round(nps))
}

/** Node count in the same short style as `formatSpeed`, with a "B" for billions. */
export function formatNodes(nodes: number): string {
  if (nodes >= 1_000_000_000) return `${(nodes / 1_000_000_000).toFixed(1)}B`
  return formatSpeed(nodes)
}

/** Elapsed search time as "0.4 s", "12 s" or "1:05". */
export function formatElapsed(ms: number): string {
  const seconds = ms / 1000
  if (seconds < 10) return `${seconds.toFixed(1)} s`
  if (seconds < 60) return `${Math.round(seconds)} s`
  const whole = Math.floor(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

/** Which side an evaluation favours, as an `eval.*` message key (the bar and number are not enough for everyone). */
export type Advantage = 'whiteAhead' | 'blackAhead' | 'equal' | 'whiteWon' | 'blackWon'

export function advantageOf(score: WhiteScore): Advantage {
  if (score.kind === 'mate' && score.moves === 0)
    return score.winner === 'white' ? 'whiteWon' : 'blackWon'
  const share = whiteShare(score)
  if (share > 0.52) return 'whiteAhead'
  if (share < 0.48) return 'blackAhead'
  return 'equal'
}
