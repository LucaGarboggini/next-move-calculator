import type { LoadProgress } from '../types'
import { loadWasm, type WasmStore } from './wasm-store'

class MemoryStore implements WasmStore {
  readonly entries = new Map<string, Blob>()
  failPut = false
  failGet = false
  get(url: string) {
    if (this.failGet) return Promise.reject(new Error('unreadable'))
    return Promise.resolve(this.entries.get(url))
  }
  put(url: string, blob: Blob) {
    if (this.failPut) return Promise.reject(new Error('quota'))
    this.entries.set(url, blob)
    return Promise.resolve()
  }
  delete(url: string) {
    this.entries.delete(url)
    return Promise.resolve()
  }
}

function bytes(n: number): Uint8Array<ArrayBuffer> {
  return new Uint8Array(n).fill(7)
}

/** A fetch that streams `size` bytes in `chunks` pieces. */
function fakeFetch(size: number, { chunks = 4, headers = {}, status = 200 } = {}) {
  const fn = vi.fn<typeof fetch>(() => {
    const piece = Math.ceil(size / chunks)
    let sent = 0
    const body = new ReadableStream<Uint8Array<ArrayBuffer>>({
      pull(controller) {
        if (sent >= size) return controller.close()
        const n = Math.min(piece, size - sent)
        sent += n
        controller.enqueue(bytes(n))
      },
    })
    return Promise.resolve(new Response(body, { status, headers }))
  })
  return fn
}

describe('loadWasm', () => {
  it('downloads with progress, returns an application/wasm blob and caches it', async () => {
    const store = new MemoryStore()
    const fetchFn = fakeFetch(1000, { headers: { 'content-length': '1000' } })
    const progress: LoadProgress[] = []
    const { blob, cached } = await loadWasm({
      url: '/engine/a.wasm',
      expectedBytes: 1000,
      store,
      fetchFn,
      onProgress: (p) => progress.push(p),
    })
    expect(cached).toBe(false)
    expect(blob.size).toBe(1000)
    expect(blob.type).toBe('application/wasm')
    expect(store.entries.get('/engine/a.wasm')?.size).toBe(1000)
    expect(progress.at(-1)).toEqual({
      phase: 'download',
      loadedBytes: 1000,
      totalBytes: 1000,
      cached: false,
    })
    expect(progress.every((p) => p.loadedBytes <= 1000 && p.cached === false)).toBe(true)
    const loaded = progress.map((p) => p.loadedBytes)
    expect(loaded).toEqual([...loaded].sort((a, b) => a - b))
  })

  it('serves a complete cached copy without touching the network', async () => {
    const store = new MemoryStore()
    store.entries.set('/engine/a.wasm', new Blob([bytes(500)]))
    const fetchFn = fakeFetch(500)
    const progress: LoadProgress[] = []
    const { blob, cached } = await loadWasm({
      url: '/engine/a.wasm',
      expectedBytes: 500,
      store,
      fetchFn,
      onProgress: (p) => progress.push(p),
    })
    expect(cached).toBe(true)
    expect(blob.size).toBe(500)
    expect(fetchFn).not.toHaveBeenCalled()
    expect(progress).toEqual([
      { phase: 'download', loadedBytes: 500, totalBytes: 500, cached: true },
    ])
  })

  it('discards a truncated cache entry and downloads again', async () => {
    const store = new MemoryStore()
    store.entries.set('/engine/a.wasm', new Blob([bytes(10)]))
    const fetchFn = fakeFetch(500)
    const { cached } = await loadWasm({ url: '/engine/a.wasm', expectedBytes: 500, store, fetchFn })
    expect(cached).toBe(false)
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(store.entries.get('/engine/a.wasm')?.size).toBe(500)
  })

  it('falls back to the expected size without Content-Length, and ignores it when compressed', async () => {
    const noHeader: LoadProgress[] = []
    await loadWasm({
      url: '/a.wasm',
      expectedBytes: 300,
      fetchFn: fakeFetch(300),
      onProgress: (p) => noHeader.push(p),
    })
    expect(noHeader.at(-1)?.totalBytes).toBe(300)

    const compressed: LoadProgress[] = []
    await loadWasm({
      url: '/a.wasm',
      expectedBytes: 300,
      fetchFn: fakeFetch(300, { headers: { 'content-length': '40', 'content-encoding': 'br' } }),
      onProgress: (p) => compressed.push(p),
    })
    expect(compressed.at(-1)?.totalBytes).toBe(300)
  })

  it('works without a store (Cache Storage unavailable)', async () => {
    const { blob } = await loadWasm({ url: '/a.wasm', expectedBytes: 100, fetchFn: fakeFetch(100) })
    expect(blob.size).toBe(100)
  })

  it('survives a broken cache: unreadable on read, quota exceeded on write', async () => {
    const store = new MemoryStore()
    store.failGet = true
    store.failPut = true
    const { blob, cached } = await loadWasm({
      url: '/a.wasm',
      expectedBytes: 100,
      store,
      fetchFn: fakeFetch(100),
    })
    expect(cached).toBe(false)
    expect(blob.size).toBe(100)
  })

  it('does not cache a download of the wrong size', async () => {
    const store = new MemoryStore()
    await loadWasm({ url: '/a.wasm', expectedBytes: 100, store, fetchFn: fakeFetch(60) })
    expect(store.entries.size).toBe(0)
  })

  it('fails on HTTP errors and passes the abort signal to fetch', async () => {
    const failing = fakeFetch(0, { status: 404 })
    await expect(
      loadWasm({ url: '/missing.wasm', expectedBytes: 1, fetchFn: failing }),
    ).rejects.toThrow(/HTTP 404/)

    const controller = new AbortController()
    const fetchFn = fakeFetch(10)
    await loadWasm({ url: '/a.wasm', expectedBytes: 10, fetchFn, signal: controller.signal })
    expect(fetchFn.mock.calls[0]?.[1]?.signal).toBe(controller.signal)
  })
})
