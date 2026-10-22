import type { UciTransport } from '../uci/client'

/** The part of `Worker` the transport uses (lets tests pass a fake). */
export interface WorkerLike {
  postMessage(message: string): void
  terminate(): void
  onmessage: ((event: MessageEvent) => void) | null
  onerror: ((event: ErrorEvent) => void) | null
}

export interface WorkerTransportOptions {
  /** Engine script URL (classic script, same origin). */
  readonly script: string
  /** URL (normally a blob URL) the engine should load its wasm from instead of the network. */
  readonly wasmUrl: string
  /** Called on `terminate` to free what backs `wasmUrl`. */
  readonly release?: () => void
  readonly createWorker?: (url: string) => WorkerLike
}

/**
 * Source of the tiny worker that wraps the engine script. Stockfish.js fetches its wasm from
 * `<script>.wasm` (or from the script URL's `#hash`, which Safari refuses to load under COEP), so
 * the wrapper redirects that one `fetch` to the wasm we already downloaded and cached, then
 * loads the engine. Thread workers re-run this same wrapper, so they get the redirect too.
 */
export function workerSource(script: string, wasmUrl: string): string {
  return [
    'const realFetch = self.fetch.bind(self)',
    `self.fetch = (_input, init) => realFetch(${JSON.stringify(wasmUrl)}, init)`,
    `importScripts(${JSON.stringify(script)})`,
  ].join('\n')
}

/** Talks UCI to a Stockfish.js worker started through `workerSource`. */
export function createWorkerTransport(options: WorkerTransportOptions): UciTransport {
  const script = new URL(options.script, globalThis.location.href).href
  const source = new Blob([workerSource(script, options.wasmUrl)], { type: 'text/javascript' })
  const workerUrl = URL.createObjectURL(source)
  const worker = options.createWorker?.(workerUrl) ?? new Worker(workerUrl)
  const lineListeners = new Set<(line: string) => void>()
  const errorListeners = new Set<(error: Error) => void>()

  worker.onmessage = (event) => {
    // The engine also posts internal non-text messages; only strings are UCI output.
    if (typeof event.data !== 'string') return
    for (const listener of [...lineListeners]) listener(event.data)
  }
  worker.onerror = (event) => {
    const error = new Error(event.message || 'The engine worker crashed')
    for (const listener of [...errorListeners]) listener(error)
  }

  return {
    send: (line) => worker.postMessage(line),
    onLine(listener) {
      lineListeners.add(listener)
      return () => lineListeners.delete(listener)
    },
    onError(listener) {
      errorListeners.add(listener)
      return () => errorListeners.delete(listener)
    },
    terminate() {
      worker.terminate()
      lineListeners.clear()
      errorListeners.clear()
      URL.revokeObjectURL(workerUrl)
      options.release?.()
    },
  }
}
