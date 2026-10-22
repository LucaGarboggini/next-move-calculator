/// <reference types="node" />
import { createRequire } from 'node:module'
import type { UciTransport } from '../uci/client'

type NodeFlavor = 'lite' | 'lite-single' | 'single' | 'full'

interface NodeEngine {
  processCommand(command: string): void
  terminate?: () => void
}

/**
 * The real Stockfish 19 from the npm package, run in Node, as a `UciTransport`. Tests use it to
 * check mate-in-N positions against the actual engine. Needs `// @vitest-environment node`.
 */
export function createNodeStockfishTransport(flavor: NodeFlavor = 'lite-single'): UciTransport {
  const require = createRequire(import.meta.url)
  const stockfish = require('stockfish') as ((
    flavor: string,
    onMessage: (line: string) => void,
  ) => NodeEngine) & { findEngine(flavor: string): string }
  // The engine file is a module-level singleton; a fresh copy per transport keeps instances apart.
  delete require.cache[stockfish.findEngine(flavor)]
  const lineListeners = new Set<(line: string) => void>()
  const engine = stockfish(flavor, (line) => {
    for (const listener of [...lineListeners]) listener(line)
  })
  return {
    // The Node build exits the process on `quit`; `terminate` is the polite way out.
    send: (line) => {
      if (line !== 'quit') engine.processCommand(line)
    },
    onLine(listener) {
      lineListeners.add(listener)
      return () => lineListeners.delete(listener)
    },
    onError: () => () => {},
    terminate: () => {
      lineListeners.clear()
      engine.terminate?.()
    },
  }
}
