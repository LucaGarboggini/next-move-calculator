// Copies the Stockfish builds from the `stockfish` npm package into public/engine/ so Vite
// serves them in dev and ships them in the static bundle. The files are never committed.
//
//   ENGINE_SIZES=lite npm run engine:fetch   # skip the ~190 MB of Full builds
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'node_modules', 'stockfish', 'bin')
const target = join(root, 'public', 'engine')

// Keep in sync with src/engine/stockfish/files.ts.
const builds = {
  lite: ['stockfish-19-lite', 'stockfish-19-lite-single'],
  full: ['stockfish-19', 'stockfish-19-single'],
}

const sizes = (process.env.ENGINE_SIZES ?? 'lite,full').split(',').map((s) => s.trim())
const unknown = sizes.filter((s) => !(s in builds))
if (unknown.length > 0) {
  console.error(`Unknown ENGINE_SIZES value(s): ${unknown.join(', ')} (use lite, full)`)
  process.exit(1)
}

if (!existsSync(source)) {
  console.error('node_modules/stockfish not found; run `npm install` first.')
  process.exit(1)
}

mkdirSync(target, { recursive: true })
let copied = 0
for (const size of sizes) {
  for (const name of builds[size]) {
    for (const extension of ['js', 'wasm']) {
      const file = `${name}.${extension}`
      const from = join(source, file)
      const to = join(target, file)
      if (!existsSync(from)) {
        console.error(`Missing ${file} in the stockfish package.`)
        process.exit(1)
      }
      if (existsSync(to) && statSync(to).size === statSync(from).size) continue
      copyFileSync(from, to)
      copied++
    }
  }
}
console.log(`engine: ${copied} file(s) copied to public/engine/ (${sizes.join(', ')})`)
