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

// Positions where castling is the engine's best move by a wide margin, at every depth from 4 to 20.
const CASTLINGS = [
  ['White O-O-O', '8/5k2/8/4p3/4b3/1p6/8/R3K3 w Q - 0 1', 'e1c1', /^O-O-O/],
  ['White O-O', '3n1k2/8/8/8/2NP4/r2p4/p7/4K2R w K - 0 1', 'e1g1', /^O-O(?!-O)/],
  ['Black O-O-O', 'r3k3/1R6/8/5p2/8/2PK4/8/8 b q - 0 1', 'e8c8', /^O-O-O/],
  ['Black O-O', '4k2r/2P5/B7/5K2/3b4/8/1Q6/8 b k - 0 1', 'e8g8', /^O-O(?!-O)/],
] as const

describe('real Stockfish 19: castling', () => {
  let engine: Engine
  beforeEach(() => {
    engine = realEngine()
  })
  afterEach(() => engine.dispose())

  it.each(CASTLINGS)(
    '%s arrives as the king’s two-square move and plays on the core position',
    async (_name, fen, uci, san) => {
      const start = position(fen)
      const search = engine.analyze(start, { limits: { depth: 12 } })
      let best
      for await (const event of search.events) if (event.type === 'bestmove') best = event.move
      expect(best && makeUci(best)).toBe(uci)
      if (!best) return
      expect(start.lineToSan([best])[0]).toMatch(san)
      expect(start.play(best).ok).toBe(true)
    },
  )
})
