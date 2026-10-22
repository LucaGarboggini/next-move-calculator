/** Lite is the default; Full is the strongest and ~94 MB. */
export type EngineSize = 'lite' | 'full'

export interface StockfishFlavor {
  readonly size: EngineSize
  /** Multi-threaded builds need cross-origin isolation; single-threaded ones run anywhere. */
  readonly threaded: boolean
}

export interface StockfishFiles {
  /** The worker script; it loads `wasm` itself. */
  readonly script: string
  readonly wasm: string
  /** Size of the wasm file, used for progress when the server sends no Content-Length. */
  readonly wasmBytes: number
}

const VERSION = 19

/** Sizes of the files shipped in the `stockfish@19.0.1` npm package. */
const BUILDS: Record<string, { readonly name: string; readonly wasmBytes: number }> = {
  'lite:true': { name: `stockfish-${VERSION}-lite`, wasmBytes: 1_697_617 },
  'lite:false': { name: `stockfish-${VERSION}-lite-single`, wasmBytes: 1_845_971 },
  'full:true': { name: `stockfish-${VERSION}`, wasmBytes: 99_076_105 },
  'full:false': { name: `stockfish-${VERSION}-single`, wasmBytes: 99_169_054 },
}

/** Approximate download size per engine size, for "Full engine (~94 MB)" style labels. */
export const ENGINE_DOWNLOAD_BYTES: Record<EngineSize, number> = {
  lite: 1_700_000,
  full: 99_100_000,
}

export function stockfishFiles(flavor: StockfishFlavor, baseUrl: string): StockfishFiles {
  const build = BUILDS[`${flavor.size}:${flavor.threaded}`]
  if (!build) throw new Error(`Unknown Stockfish flavor ${JSON.stringify(flavor)}`)
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return {
    script: `${base}${build.name}.js`,
    wasm: `${base}${build.name}.wasm`,
    wasmBytes: build.wasmBytes,
  }
}

/** Every file name that `scripts/fetch-engine.mjs` must provide. */
export function stockfishFileNames(): string[] {
  return Object.values(BUILDS).flatMap(({ name }) => [`${name}.js`, `${name}.wasm`])
}
