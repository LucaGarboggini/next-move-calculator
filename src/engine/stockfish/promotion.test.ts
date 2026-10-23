// @vitest-environment node
import { makeUci } from '@/core'
import { createNodeStockfishTransport } from '../testing/node-stockfish'
import { position } from '../testing/fake-transport'
import type { Engine } from '../types'
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

// Positions where one promotion piece wins and every other one draws or loses, at every depth from
// 2 to 20: the queen forks king and rook on diagonals (a bishop would win the rook but only draw),
// and the knight forks king and queen.
const PROMOTIONS = [
  ['White =Q', '8/2P5/r7/8/8/7k/8/4K3 w - - 0 1', 'c7c8q', 'c8=Q+'],
  ['Black =Q', '4k3/8/7K/8/8/R7/2p5/8 b - - 0 1', 'c2c1q', 'c1=Q+'],
  ['White =N', '8/4P1k1/3q4/8/8/8/7P/K7 w - - 0 1', 'e7e8n', 'e8=N+'],
] as const

describe('real Stockfish 19: promotion', () => {
  let engine: Engine
  beforeEach(() => {
    engine = realEngine()
  })
  afterEach(() => engine.dispose())

  it.each(PROMOTIONS)(
    '%s arrives with its piece and plays on the core position',
    async (_name, fen, uci, san) => {
      const start = position(fen)
      const search = engine.analyze(start, { limits: { depth: 12 } })
      let best
      for await (const event of search.events) if (event.type === 'bestmove') best = event.move
      expect(best && makeUci(best)).toBe(uci)
      if (!best) return
      expect(start.lineToSan([best])[0]).toBe(san)
      expect(start.play(best).ok).toBe(true)
    },
  )
})
