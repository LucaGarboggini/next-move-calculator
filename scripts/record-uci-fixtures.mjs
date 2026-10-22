// Records real Stockfish output into src/engine/uci/__fixtures__/ for the UCI parser tests.
// Re-run only when the engine version changes:  node scripts/record-uci-fixtures.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'src', 'engine', 'uci', '__fixtures__')
const require = createRequire(join(root, 'package.json'))

const scenarios = {
  // `uci` handshake: id, every option, uciok.
  handshake: { commands: ['uci'], until: 'uciok' },
  startpos: {
    commands: [
      'position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      'go depth 8',
    ],
  },
  multipv: {
    commands: [
      'setoption name MultiPV value 3',
      'position fen r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
      'go depth 8',
    ],
  },
  'mate-in-3': {
    commands: ['position fen r5rk/5p1p/5R2/4B3/8/8/7P/7K w - - 0 1', 'go depth 10'],
  },
  'being-mated': {
    commands: ['position fen kbK5/pp6/RP6/8/8/8/8/8 b - - 0 1', 'go depth 10'],
  },
  checkmated: {
    commands: [
      'position fen rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3',
      'go depth 10',
    ],
  },
  stalemate: { commands: ['position fen 7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', 'go depth 10'] },
}

function record({ commands, until = 'bestmove' }) {
  return new Promise((resolve) => {
    const lines = []
    // The Node build is a module singleton: load a fresh copy per scenario.
    const path = require('stockfish').findEngine('lite-single')
    delete require.cache[path]
    const engine = require('stockfish')('lite-single', (line) => {
      if (line.trim() === '') return
      lines.push(line)
      if (line.startsWith(until)) resolve(lines)
    })
    for (const command of ['uci', 'isready', ...commands]) {
      engine.processCommand(command)
    }
  })
}

mkdirSync(out, { recursive: true })
for (const [name, scenario] of Object.entries(scenarios)) {
  const lines = await record(scenario)
  writeFileSync(join(out, `${name}.txt`), `${lines.join('\n')}\n`)
  console.log(`${name}: ${lines.length} lines`)
}
process.exit(0)
