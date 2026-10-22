import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { ENGINE_DOWNLOAD_BYTES, stockfishFileNames, stockfishFiles } from './files'

describe('stockfishFiles', () => {
  it('maps size and threading to the npm package file names', () => {
    expect(stockfishFiles({ size: 'lite', threaded: false }, '/engine/')).toEqual({
      script: '/engine/stockfish-19-lite-single.js',
      wasm: '/engine/stockfish-19-lite-single.wasm',
      wasmBytes: 1_845_971,
    })
    expect(stockfishFiles({ size: 'lite', threaded: true }, '/engine').script).toBe(
      '/engine/stockfish-19-lite.js',
    )
    expect(stockfishFiles({ size: 'full', threaded: true }, '/e/').wasm).toBe(
      '/e/stockfish-19.wasm',
    )
    expect(stockfishFiles({ size: 'full', threaded: false }, '/e/').wasm).toBe(
      '/e/stockfish-19-single.wasm',
    )
  })

  it('lists exactly the eight files the fetch script must provide', () => {
    expect(stockfishFileNames()).toHaveLength(8)
  })

  it('advertises ~94 MB for Full and a couple of MB for Lite', () => {
    expect(ENGINE_DOWNLOAD_BYTES.full).toBeGreaterThan(90_000_000)
    expect(ENGINE_DOWNLOAD_BYTES.lite).toBeLessThan(5_000_000)
  })

  it('matches the files and byte sizes in the installed stockfish package', async () => {
    const { statSync } = await import('node:fs')
    const dir = join(process.cwd(), 'node_modules', 'stockfish', 'bin')
    for (const flavor of [
      { size: 'lite', threaded: true },
      { size: 'lite', threaded: false },
      { size: 'full', threaded: true },
      { size: 'full', threaded: false },
    ] as const) {
      const files = stockfishFiles(flavor, '/x/')
      const wasm = join(dir, files.wasm.slice('/x/'.length))
      expect(existsSync(join(dir, files.script.slice('/x/'.length)))).toBe(true)
      expect(statSync(wasm).size).toBe(files.wasmBytes)
    }
  })
})
