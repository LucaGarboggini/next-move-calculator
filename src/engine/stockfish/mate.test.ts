// @vitest-environment node
import { formatEval, toWhiteScore } from '@/core'
import { createNodeStockfishTransport } from '../testing/node-stockfish'
import { position } from '../testing/fake-transport'
import type { BestMoveEvent, Engine, SearchInfo } from '../types'
import { UciEngine } from '../uci/uci-engine'

/** The real Stockfish 19 (Lite, single-threaded) behind the generic `UciEngine`. */
function realEngine(): Engine {
  return new UciEngine({
    descriptor: { id: 'stockfish', name: 'Stockfish 19', variant: 'lite' },
    bounds: { maxThreads: 1, maxHashMb: 64 },
    settings: { threads: 1, hashMb: 16 },
    connect: () => Promise.resolve(createNodeStockfishTransport('lite-single')),
  })
}

interface Solved {
  readonly end: BestMoveEvent
  readonly last: SearchInfo
  readonly lines: SearchInfo[]
}

async function solve(engine: Engine, fen: string, depth = 12, multiPv = 1): Promise<Solved> {
  const search = engine.analyze(position(fen), { limits: { depth }, multiPv })
  const lines: SearchInfo[] = []
  let end: BestMoveEvent | undefined
  for await (const event of search.events) {
    if (event.type === 'info') lines.push(event.info)
    else end = event
  }
  const last = lines.at(-1)
  if (!end || !last) throw new Error('search produced no result')
  return { end, last, lines }
}

const uci = (move?: { from: string; to: string }) => (move ? `${move.from}${move.to}` : undefined)

describe('real Stockfish 19: known mates', () => {
  let engine: Engine
  beforeEach(() => {
    engine = realEngine()
  })
  afterEach(() => engine.dispose())

  it('mate in 1: back-rank Ra8#', async () => {
    const { end, last } = await solve(engine, '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1')
    expect(last.score).toEqual({ kind: 'mate', moves: 1 })
    expect(uci(end.move)).toBe('a1a8')
    expect(end.reason).toBe('completed')
  })

  it('mate in 2: Nf6+ gxf6 Bxf7#', async () => {
    const { end, last } = await solve(
      engine,
      'r2qkb1r/pp2nppp/3p4/2pNN1B1/2BnP3/3P4/PPP2PPP/R2bK2R w KQkq - 1 1',
    )
    expect(last.score).toEqual({ kind: 'mate', moves: 2 })
    expect(uci(end.move)).toBe('d5f6')
    expect(last.pv.map(uci).slice(0, 3)).toEqual(['d5f6', 'g7f6', 'c4f7'])
  })

  it('mate in 3: Ra6! and the mate follows by force', async () => {
    const { end, last } = await solve(engine, 'r5rk/5p1p/5R2/4B3/8/8/7P/7K w - - 0 1')
    expect(last.score).toEqual({ kind: 'mate', moves: 3 })
    expect(uci(end.move)).toBe('f6a6')
    expect(last.pv).toHaveLength(5)
  })

  it('black to move mates: the score is from the mover, white sees #-1', async () => {
    const fen = 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2'
    const { end, last } = await solve(engine, fen)
    expect(uci(end.move)).toBe('d8h4')
    expect(last.score).toEqual({ kind: 'mate', moves: 1 })
    expect(formatEval(toWhiteScore(last.score, 'black'))).toBe('#-1')
  })

  it('the side being mated sees a negative mate score', async () => {
    const { last } = await solve(engine, 'kbK5/pp6/RP6/8/8/8/8/8 b - - 0 1')
    expect(last.score).toEqual({ kind: 'mate', moves: -1 })
    expect(formatEval(toWhiteScore(last.score, 'black'))).toBe('#1')
  })

  it('a stop-by-mate limit finds the mate', async () => {
    const search = engine.analyze(position('r5rk/5p1p/5R2/4B3/8/8/7P/7K w - - 0 1'), {
      limits: { mate: 3 },
    })
    const end = await search.done
    expect(uci(end.move)).toBe('f6a6')
  })

  it('checkmate and stalemate give no move', async () => {
    const mated = await solve(
      engine,
      'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
    )
    expect(mated.end.move).toBeUndefined()
    expect(mated.last.score).toEqual({ kind: 'mate', moves: 0 })
    const stale = await solve(engine, '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')
    expect(stale.end.move).toBeUndefined()
    expect(stale.last.score).toEqual({ kind: 'cp', cp: 0 })
  })

  it('multipv returns distinct ranked lines', async () => {
    const { lines } = await solve(
      engine,
      'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
      8,
      3,
    )
    const finalDepth = lines.filter((l) => l.depth === 8)
    expect(finalDepth.map((l) => l.multiPv).sort()).toEqual([1, 2, 3])
    expect(new Set(finalDepth.map((l) => uci(l.pv[0]))).size).toBe(3)
  })

  it('stopping an infinite search returns a move; a restart gives the new position', async () => {
    const first = engine.analyze(position(), {})
    for await (const event of first.events) {
      if (event.type === 'info' && event.info.depth >= 3) break
    }
    const second = engine.analyze(position('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1'), {
      limits: { depth: 6 },
    })
    const [a, b] = await Promise.all([first.done, second.done])
    expect(a.reason).toBe('superseded')
    expect(b.reason).toBe('completed')
    expect(uci(b.move)).toBe('a1a8')
  })
})
