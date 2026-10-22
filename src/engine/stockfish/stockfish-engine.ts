import {
  detectCapabilities,
  engineBounds,
  recommendedSettings,
  type EngineCapabilities,
} from '../capabilities'
import type { Engine, EngineSettings } from '../types'
import { UciEngine } from '../uci/uci-engine'
import { stockfishFiles, type EngineSize } from './files'
import { createCacheStore, loadWasm, type WasmStore } from './wasm-store'
import { createWorkerTransport, type WorkerLike } from './worker-transport'

export interface StockfishEngineOptions {
  /** Lite (default) or Full. */
  readonly size?: EngineSize
  readonly capabilities?: EngineCapabilities
  /** Initial settings; defaults come from the device capabilities. */
  readonly settings?: Partial<EngineSettings>
  /** Where the engine files are served (default: `<base>/engine/`). */
  readonly baseUrl?: string
  /** Override for tests: where downloaded binaries are cached (default: Cache Storage). */
  readonly store?: WasmStore | undefined
  readonly fetchFn?: typeof fetch
  readonly createWorker?: (url: string) => WorkerLike
}

const DEFAULT_BASE_URL = `${import.meta.env.BASE_URL}engine/`

/**
 * Stockfish 19 in a Web Worker. The wasm is downloaded on the main thread (progress, cache),
 * then handed to the worker as a blob URL, so the worker never hits the network for it.
 * Multi-threaded when the page is cross-origin isolated, single-threaded otherwise.
 */
export function createStockfishEngine(options: StockfishEngineOptions = {}): Engine {
  const size = options.size ?? 'lite'
  const caps = options.capabilities ?? detectCapabilities()
  const bounds = engineBounds(caps)
  const files = stockfishFiles(
    { size, threaded: caps.threads },
    options.baseUrl ?? DEFAULT_BASE_URL,
  )
  const store = 'store' in options ? options.store : createCacheStore()

  return new UciEngine({
    descriptor: { id: 'stockfish', name: 'Stockfish 19', variant: size },
    bounds,
    settings: { ...recommendedSettings(caps), ...options.settings },
    connect: async ({ reportProgress, signal }) => {
      const { blob } = await loadWasm({
        url: files.wasm,
        expectedBytes: files.wasmBytes,
        store,
        signal,
        onProgress: reportProgress,
        ...(options.fetchFn && { fetchFn: options.fetchFn }),
      })
      const blobUrl = URL.createObjectURL(blob)
      return createWorkerTransport({
        script: files.script,
        wasmUrl: blobUrl,
        release: () => URL.revokeObjectURL(blobUrl),
        ...(options.createWorker && { createWorker: options.createWorker }),
      })
    },
  })
}
