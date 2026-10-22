import { detectCapabilities } from '../capabilities'
import { flush, position } from '../testing/fake-transport'
import type { EngineEvent, LoadProgress } from '../types'
import { createStockfishEngine } from './stockfish-engine'
import type { WasmStore } from './wasm-store'
import type { WorkerLike } from './worker-transport'

const WASM_BYTES = 1_697_617 // lite, threaded

function memoryStore(): WasmStore & { entries: Map<string, Blob> } {
  const entries = new Map<string, Blob>()
  return {
    entries,
    get: (url) => Promise.resolve(entries.get(url)),
    put: (url, blob) => Promise.resolve(void entries.set(url, blob)),
    delete: (url) => Promise.resolve(void entries.delete(url)),
  }
}

/** Answers UCI like a tiny engine: handshake, isready, and a canned search. */
class ScriptedWorker implements WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  readonly posted: string[] = []
  readonly url: string
  constructor(url: string) {
    this.url = url
  }
  private say(line: string) {
    queueMicrotask(() => this.onmessage?.({ data: line } as MessageEvent))
  }
  postMessage(line: string) {
    this.posted.push(line)
    if (line === 'uci') this.say('uciok')
    else if (line === 'isready') this.say('readyok')
    else if (line.startsWith('go')) {
      this.say('info depth 1 seldepth 2 multipv 1 score cp 25 nodes 20 nps 1 time 1 pv e2e4')
      this.say('bestmove e2e4')
    }
  }
  terminate() {}
}

const THREADED = detectCapabilities({
  crossOriginIsolated: true,
  hasSharedArrayBuffer: true,
  hardwareConcurrency: 8,
  userAgent: 'desktop',
})
const SINGLE = detectCapabilities({ hardwareConcurrency: 8, userAgent: 'desktop' })

function fetchOf(size: number) {
  return vi.fn(() => Promise.resolve(new Response(new Uint8Array(size), { status: 200 })))
}

const blobs: Blob[] = []

describe('createStockfishEngine', () => {
  beforeEach(() => {
    blobs.length = 0
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL = (blob: Blob) => `blob:${blobs.push(blob)}`
        static override revokeObjectURL = () => {}
      },
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('describes itself and picks bounds and defaults from the capabilities', () => {
    const threaded = createStockfishEngine({ capabilities: THREADED, store: undefined })
    expect(threaded.descriptor).toEqual({ id: 'stockfish', name: 'Stockfish 19', variant: 'lite' })
    expect(threaded.bounds.maxThreads).toBe(8)
    expect(threaded.settings).toEqual({ threads: 7, hashMb: 64 })
    const single = createStockfishEngine({ capabilities: SINGLE, size: 'full', store: undefined })
    expect(single.descriptor.variant).toBe('full')
    expect(single.bounds.maxThreads).toBe(1)
    expect(single.settings.threads).toBe(1)
  })

  it('downloads the wasm with progress, starts a worker that loads it from a blob and analyses', async () => {
    const store = memoryStore()
    const workers: ScriptedWorker[] = []
    const fetchFn = fetchOf(WASM_BYTES)
    const engine = createStockfishEngine({
      capabilities: THREADED,
      baseUrl: '/engine/',
      store,
      fetchFn,
      createWorker: (url) => {
        const worker = new ScriptedWorker(url)
        workers.push(worker)
        return worker
      },
    })
    const progress: LoadProgress[] = []
    engine.subscribe((e: EngineEvent) => e.type === 'progress' && progress.push(e.progress))

    const search = engine.analyze(position(), { limits: { depth: 1 } })
    const end = await search.done

    expect(fetchFn).toHaveBeenCalledWith('/engine/stockfish-19-lite.wasm', {
      signal: expect.any(AbortSignal) as AbortSignal,
    })
    // Blob 1 is the downloaded wasm; blob 2 is the worker wrapper that loads the engine from it.
    expect(blobs[0]?.size).toBe(WASM_BYTES)
    expect(workers[0]?.url).toBe('blob:2')
    const wrapper = await blobs[1]!.text()
    expect(wrapper).toContain(`importScripts("${location.origin}/engine/stockfish-19-lite.js")`)
    expect(wrapper).toContain('"blob:1"')
    expect(progress[0]).toMatchObject({ phase: 'download', cached: false, totalBytes: WASM_BYTES })
    expect(progress.at(-1)).toMatchObject({ phase: 'starting' })
    expect(end).toMatchObject({ reason: 'completed', move: { from: 'e2', to: 'e4' } })
    expect(workers[0]?.posted).toContain('setoption name Threads value 7')
    expect(store.entries.get('/engine/stockfish-19-lite.wasm')?.size).toBe(WASM_BYTES)
  })

  it('uses the single-threaded build and never sets Threads without isolation', async () => {
    const workers: ScriptedWorker[] = []
    const engine = createStockfishEngine({
      capabilities: SINGLE,
      baseUrl: '/engine/',
      store: undefined,
      fetchFn: fetchOf(1_845_971),
      createWorker: (url) => {
        const worker = new ScriptedWorker(url)
        workers.push(worker)
        return worker
      },
    })
    await engine.analyze(position(), { limits: { depth: 1 } }).done
    expect(await blobs[1]!.text()).toContain('/engine/stockfish-19-lite-single.js')
    expect(workers[0]?.posted.some((l) => l.includes('Threads'))).toBe(false)
  })

  it('the second start comes from the cache without a download', async () => {
    const store = memoryStore()
    const fetchFn = fetchOf(WASM_BYTES)
    const options = {
      capabilities: THREADED,
      baseUrl: '/engine/',
      store,
      fetchFn,
      createWorker: (url: string) => new ScriptedWorker(url),
    }
    const first = createStockfishEngine(options)
    await first.load()
    first.dispose()
    const second = createStockfishEngine(options)
    const progress: LoadProgress[] = []
    second.subscribe((e) => e.type === 'progress' && progress.push(e.progress))
    await second.load()
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(progress[0]).toMatchObject({ phase: 'download', cached: true })
    second.dispose()
  })

  it('reports a missing engine file as a failed search, not an exception', async () => {
    const engine = createStockfishEngine({
      capabilities: THREADED,
      store: undefined,
      fetchFn: () => Promise.resolve(new Response('nope', { status: 404 })),
    })
    const end = await engine.analyze(position()).done
    expect(end.reason).toBe('failed')
    expect(end.error?.message).toMatch(/404/)
    expect(engine.status).toBe('error')
    await flush()
  })
})
