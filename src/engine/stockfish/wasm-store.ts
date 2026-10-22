import type { LoadProgress } from '../types'

/** Persistent storage for downloaded engine binaries. */
export interface WasmStore {
  get(url: string): Promise<Blob | undefined>
  put(url: string, blob: Blob): Promise<void>
  delete(url: string): Promise<void>
}

/** Cache Storage name; bump the suffix to drop every previously cached binary. */
export const CACHE_NAME = 'next-move-engine-v1'

/** Store backed by Cache Storage, or undefined where it is unavailable (insecure context, some private modes). */
export function createCacheStore(
  storage: CacheStorage | undefined = globalThis.caches,
): WasmStore | undefined {
  if (!storage) return undefined
  const open = () => storage.open(CACHE_NAME)
  return {
    async get(url) {
      const response = await (await open()).match(url)
      return response ? await response.blob() : undefined
    },
    async put(url, blob) {
      await (
        await open()
      ).put(url, new Response(blob, { headers: { 'content-type': 'application/wasm' } }))
    },
    async delete(url) {
      await (await open()).delete(url)
    },
  }
}

export interface LoadWasmOptions {
  readonly url: string
  /** Expected size: validates cached copies and stands in for a missing Content-Length. */
  readonly expectedBytes: number
  readonly store?: WasmStore | undefined
  readonly fetchFn?: typeof fetch
  readonly onProgress?: (progress: LoadProgress) => void
  readonly signal?: AbortSignal
}

const PROGRESS_INTERVAL_MS = 80

async function readCached(store: WasmStore, url: string, expectedBytes: number) {
  try {
    const blob = await store.get(url)
    if (blob?.size === expectedBytes) return blob
    // A truncated or foreign entry would make the engine fail to start: drop it.
    if (blob) await store.delete(url)
  } catch {
    // An unreadable cache is the same as an empty one.
  }
  return undefined
}

/**
 * Returns the wasm binary as a Blob: from the cache when present and complete, otherwise
 * downloaded with progress and then cached. Cache failures never fail the load.
 */
export async function loadWasm(options: LoadWasmOptions): Promise<{ blob: Blob; cached: boolean }> {
  const { url, expectedBytes, store, onProgress, signal } = options
  const fetchFn = options.fetchFn ?? globalThis.fetch.bind(globalThis)

  if (store) {
    const blob = await readCached(store, url, expectedBytes)
    if (blob) {
      onProgress?.({
        phase: 'download',
        loadedBytes: blob.size,
        totalBytes: blob.size,
        cached: true,
      })
      return { blob, cached: true }
    }
  }

  const response = await fetchFn(url, { ...(signal && { signal }) })
  if (!response.ok) throw new Error(`Could not download the engine (HTTP ${response.status})`)
  const header = Number(response.headers.get('content-length'))
  // A compressed response reports the compressed size, which is not what the reader counts.
  const encoded = response.headers.has('content-encoding')
  const total = !encoded && header > 0 ? header : expectedBytes

  const chunks: Uint8Array<ArrayBuffer>[] = []
  let loaded = 0
  let lastReport = 0
  const report = (force: boolean) => {
    const now = Date.now()
    if (!force && now - lastReport < PROGRESS_INTERVAL_MS) return
    lastReport = now
    onProgress?.({ phase: 'download', loadedBytes: loaded, totalBytes: total, cached: false })
  }

  if (response.body) {
    const reader = response.body.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      loaded += value.byteLength
      report(false)
    }
  } else {
    chunks.push(new Uint8Array(await response.arrayBuffer()))
    loaded = chunks[0]?.byteLength ?? 0
  }
  report(true)

  const blob = new Blob(chunks, { type: 'application/wasm' })
  if (store && blob.size === expectedBytes) {
    try {
      await store.put(url, blob)
    } catch {
      // Quota exceeded or storage blocked: the engine still runs, it just downloads again next time.
    }
  }
  return { blob, cached: false }
}
