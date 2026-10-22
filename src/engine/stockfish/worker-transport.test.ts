import { createWorkerTransport, workerSource, type WorkerLike } from './worker-transport'

class FakeWorker implements WorkerLike {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  readonly posted: string[] = []
  terminated = false
  readonly url: string
  constructor(url: string) {
    this.url = url
  }
  postMessage(message: string) {
    this.posted.push(message)
  }
  terminate() {
    this.terminated = true
  }
  say(data: unknown) {
    this.onmessage?.({ data } as MessageEvent)
  }
}

const blobs: Blob[] = []
const revoked: string[] = []

beforeEach(() => {
  blobs.length = 0
  revoked.length = 0
  vi.stubGlobal(
    'URL',
    class extends URL {
      static override createObjectURL = (blob: Blob) => `blob:worker-${blobs.push(blob)}`
      static override revokeObjectURL = (url: string) => void revoked.push(url)
    },
  )
})
afterEach(() => vi.unstubAllGlobals())

function setup(release?: () => void) {
  let worker!: FakeWorker
  const transport = createWorkerTransport({
    script: '/engine/stockfish-19-lite.js',
    wasmUrl: 'blob:http://localhost/abc-123',
    ...(release && { release }),
    createWorker: (url) => (worker = new FakeWorker(url)),
  })
  return { transport, worker }
}

describe('workerSource', () => {
  it('redirects the engine fetch to the wasm blob, then loads the engine', () => {
    const source = workerSource('http://x/engine.js', 'blob:http://x/1')
    expect(source).toContain('"blob:http://x/1"')
    expect(source.indexOf('self.fetch =')).toBeLessThan(
      source.indexOf('importScripts("http://x/engine.js")'),
    )
  })

  it('quotes URLs safely', () => {
    expect(workerSource('a"b', 'c\nd')).toContain('importScripts("a\\"b")')
  })
})

describe('createWorkerTransport', () => {
  it('starts a blob worker that wraps the absolute engine script URL', async () => {
    const { worker } = setup()
    expect(worker.url).toBe('blob:worker-1')
    const source = await blobs[0]!.text()
    expect(source).toContain(`importScripts("${location.origin}/engine/stockfish-19-lite.js")`)
    expect(source).toContain('blob:http://localhost/abc-123')
  })

  it('sends lines with postMessage and delivers string output, ignoring internal objects', () => {
    const { transport, worker } = setup()
    const lines: string[] = []
    transport.onLine((l) => lines.push(l))
    transport.send('uci')
    worker.say('uciok')
    worker.say({ da: 3 })
    worker.say('readyok')
    expect(worker.posted).toEqual(['uci'])
    expect(lines).toEqual(['uciok', 'readyok'])
  })

  it('reports worker errors', () => {
    const { transport, worker } = setup()
    const errors: Error[] = []
    transport.onError((e) => errors.push(e))
    worker.onerror?.({ message: 'wasm trap' } as ErrorEvent)
    worker.onerror?.({ message: '' } as ErrorEvent)
    expect(errors.map((e) => e.message)).toEqual(['wasm trap', 'The engine worker crashed'])
  })

  it('terminate stops the worker, drops listeners and releases both blobs', () => {
    const release = vi.fn()
    const { transport, worker } = setup(release)
    const lines: string[] = []
    const off = transport.onLine((l) => lines.push(l))
    transport.terminate()
    worker.say('late')
    expect(worker.terminated).toBe(true)
    expect(lines).toEqual([])
    expect(revoked).toEqual(['blob:worker-1'])
    expect(release).toHaveBeenCalledTimes(1)
    off()
  })
})
