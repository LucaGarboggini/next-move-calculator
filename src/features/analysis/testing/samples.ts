import { Position, toWhiteScore, type Move, type Score } from '@/core'
import type { AnalysisLine, AnalysisResult } from '@/state'

export interface LineSpec {
  /** Moves in SAN, played from the position. */
  san: readonly string[]
  /** Score from the side to move's point of view, as the engine reports it. */
  score: Score
  depth?: number
}

/** A result for `fen` built from SAN lines, so stories and tests do not hand-write moves. */
export function sampleResult(
  fen: string,
  specs: readonly LineSpec[],
  stats: Partial<AnalysisResult> = {},
): AnalysisResult {
  const start = Position.fromFen(fen)
  if (!start.ok) throw new Error(`Bad sample position: ${fen}`)
  const position = start.value
  const lines = specs.map((spec, index): AnalysisLine => {
    const pv: Move[] = []
    let current = position
    for (const san of spec.san) {
      const move = current.parseSan(san)
      const next = move && current.play(move)
      if (!move || !next?.ok) throw new Error(`Illegal sample move ${san} in ${fen}`)
      pv.push(move)
      current = next.value
    }
    return {
      multiPv: index + 1,
      depth: spec.depth ?? 20,
      score: toWhiteScore(spec.score, position.turn),
      pv,
      san: spec.san,
    }
  })
  return {
    fen: position.fen,
    turn: position.turn,
    fullmoves: position.fullmoves,
    lines,
    ...stats,
  }
}

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

/** Three lines from the starting position, as a mid-search snapshot. */
export const startingResult = (): AnalysisResult =>
  sampleResult(
    START_FEN,
    [
      {
        san: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'],
        score: { kind: 'cp', cp: 32 },
        depth: 24,
      },
      { san: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6'], score: { kind: 'cp', cp: 28 }, depth: 23 },
      { san: ['Nf3', 'd5', 'g3', 'Nf6'], score: { kind: 'cp', cp: 24 }, depth: 23 },
    ],
    { selDepth: 31, nps: 1_450_000, nodes: 18_300_000, timeMs: 12_600, hashfull: 140 },
  )

export const MATE_FEN = '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1'

/** A forced mate: Black to move is losing, so the eval bar is full for White. */
export const mateResult = (): AnalysisResult =>
  sampleResult(MATE_FEN, [{ san: ['Ra8#'], score: { kind: 'mate', moves: 1 }, depth: 12 }], {
    nps: 800_000,
    nodes: 4_000,
    timeMs: 300,
  })
