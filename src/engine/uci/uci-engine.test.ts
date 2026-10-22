import { FakeTransport, flush, position } from '../testing/fake-transport'
import type { EngineEvent, SearchEvent } from '../types'
import { UciEngine, type UciEngineConfig } from './uci-engine'

const SETTINGS = { threads: 4, hashMb: 32 }

function setup(overrides: Partial<UciEngineConfig> = {}) {
  const transports: FakeTransport[] = []
  const engine = new UciEngine({
    descriptor: { id: 'fake', name: 'Fake 1' },
    bounds: { maxThreads: 8, maxHashMb: 128 },
    settings: SETTINGS,
    connect: ({ reportProgress }) => {
      reportProgress({ phase: 'download', loadedBytes: 5, totalBytes: 10, cached: false })
      const transport = new FakeTransport()
      transports.push(transport)
      return Promise.resolve(transport)
    },
    ...overrides,
  })
  const events: EngineEvent[] = []
  engine.subscribe((e) => events.push(e))
  return { engine, transports, events, transport: () => transports[0]! }
}

const info = (depth: number, cp = 20, pv = 'e2e4 e7e5') =>
  `info depth ${depth} seldepth ${depth + 2} multipv 1 score cp ${cp} nodes ${depth * 100} nps 1000 time ${depth} pv ${pv}`

async function collect(events: AsyncIterable<SearchEvent>) {
  const out: SearchEvent[] = []
  for await (const event of events) out.push(event)
  return out
}

/** Waits until the engine process has received a `go` (the search really started). */
const started = (transports: FakeTransport[], count = 1, index = 0) =>
  vi.waitFor(() => expect(transports[index]?.sentMatching('go')).toHaveLength(count))

describe('UciEngine: loading', () => {
  it('starts idle, loads once, reports progress and becomes ready', async () => {
    const { engine, transports, events } = setup()
    expect(engine.status).toBe('idle')
    await Promise.all([engine.load(), engine.load()])
    expect(transports).toHaveLength(1)
    expect(engine.status).toBe('ready')
    expect(events.map((e) => e.type === 'status' && e.status).filter(Boolean)).toEqual([
      'loading',
      'ready',
    ])
    expect(events.filter((e) => e.type === 'progress')).toHaveLength(2)
    expect(transports[0]!.sent).toEqual(['uci', 'isready'])
  })

  it('exposes descriptor and clamped settings', () => {
    const { engine } = setup({ settings: { threads: 99, hashMb: 9999 } })
    expect(engine.descriptor.id).toBe('fake')
    expect(engine.settings).toEqual({ threads: 8, hashMb: 128 })
    engine.configure({ threads: 0 })
    expect(engine.settings).toEqual({ threads: 1, hashMb: 128 })
  })

  it('a failed connection rejects load, reports the error, and can be retried', async () => {
    let attempts = 0
    const { engine, events } = setup({
      connect: () => {
        attempts++
        return attempts === 1
          ? Promise.reject(new Error('offline'))
          : Promise.resolve(new FakeTransport())
      },
    })
    await expect(engine.load()).rejects.toThrow('offline')
    expect(engine.status).toBe('error')
    expect(events.filter((e) => e.type === 'error')).toHaveLength(1)
    await engine.load()
    expect(engine.status).toBe('ready')
  })

  it('terminates a process that fails its handshake', async () => {
    const transport = new FakeTransport(false)
    const { engine } = setup({ connect: () => Promise.resolve(transport), timeoutMs: 10 })
    await expect(engine.load()).rejects.toThrow(/uciok/)
    expect(transport.terminated).toBe(true)
    expect(engine.status).toBe('error')
  })
})

describe('UciEngine: a search', () => {
  it('loads on demand, applies options, sends position and go, and streams to bestmove', async () => {
    const { engine, transport, transports } = setup()
    const search = engine.analyze(position(), { limits: { depth: 10 }, multiPv: 2 })
    expect(search.fen).toBe(position().fen)
    await started(transports)

    expect(transport().sent).toEqual([
      'uci',
      'isready',
      'setoption name Threads value 4',
      'setoption name Hash value 32',
      'setoption name MultiPV value 2',
      'isready',
      `position fen ${position().fen}`,
      'go depth 10',
    ])
    expect(engine.status).toBe('searching')

    transport().emit(info(1), info(2, 30), 'info string noise', 'bestmove e2e4 ponder e7e5')
    const events = await collect(search.events)

    expect(events.map((e) => e.type)).toEqual(['info', 'info', 'bestmove'])
    expect(events.every((e) => e.searchId === search.id)).toBe(true)
    expect(events[1]).toMatchObject({
      type: 'info',
      info: { depth: 2, multiPv: 1, score: { kind: 'cp', cp: 30 }, timeMs: 2, nps: 1000 },
    })
    expect(events[2]).toEqual({
      type: 'bestmove',
      searchId: search.id,
      reason: 'completed',
      move: { from: 'e2', to: 'e4' },
      ponder: { from: 'e7', to: 'e5' },
    })
    await expect(search.done).resolves.toBe(events[2])
    expect(engine.status).toBe('ready')
  })

  it('copes with a transport that answers go before send returns', async () => {
    const transport = new FakeTransport()
    const send = transport.send.bind(transport)
    transport.send = (line) => {
      send(line)
      if (line.startsWith('go')) transport.emit(info(1), 'bestmove e2e4')
    }
    const { engine } = setup({ connect: () => Promise.resolve(transport) })
    const search = engine.analyze(position(), { limits: { depth: 1 } })
    expect(await search.done).toMatchObject({ reason: 'completed', move: { from: 'e2', to: 'e4' } })
    expect(await collect(search.events)).toHaveLength(2)
    expect(engine.status).toBe('ready')
  })

  it('without limits the search is infinite', async () => {
    const { engine, transport, transports } = setup()
    engine.analyze(position())
    await started(transports)
    expect(transport().sentMatching('go')).toEqual(['go infinite'])
  })

  it('re-sends only the options that changed', async () => {
    const { engine, transport, transports } = setup()
    const first = engine.analyze(position(), { limits: { depth: 1 } })
    await started(transports)
    transport().emit('bestmove e2e4')
    await first.done

    const second = engine.analyze(position(), { limits: { depth: 1 } })
    await started(transports, 2)
    expect(transport().sentMatching('setoption')).toHaveLength(2) // Threads + Hash, from the first search only
    transport().emit('bestmove e2e4')
    await second.done

    engine.configure({ hashMb: 64 })
    const third = engine.analyze(position(), { limits: { depth: 1 }, multiPv: 3 })
    await started(transports, 3)
    expect(transport().sentMatching('setoption').slice(2)).toEqual([
      'setoption name Hash value 64',
      'setoption name MultiPV value 3',
    ])
    transport().emit('bestmove e2e4')
    await third.done
  })

  it('does not send Threads to a single-threaded engine', async () => {
    const { engine, transport, transports } = setup({
      bounds: { maxThreads: 1, maxHashMb: 128 },
    })
    engine.analyze(position())
    await started(transports)
    expect(transport().sentMatching('setoption')).toEqual(['setoption name Hash value 32'])
  })

  it('reports no move for positions without legal moves', async () => {
    const { engine, transport, transports } = setup()
    const search = engine.analyze(
      position('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'),
    )
    await started(transports)
    transport().emit('info depth 0 score mate 0', 'bestmove (none)')
    const end = await search.done
    expect(end).toEqual({ type: 'bestmove', searchId: search.id, reason: 'completed' })
  })

  it('drops incomplete info lines and info that arrives with no search', async () => {
    const { engine, transports } = setup()
    await engine.load()
    transports[0]!.emit(info(5)) // nothing is running
    const search = engine.analyze(position())
    await started(transports)
    transports[0]!.emit('info depth 3 currmove e2e4 currmovenumber 1', 'info string hi', info(4))
    transports[0]!.emit('bestmove e2e4')
    const events = await collect(search.events)
    expect(events.map((e) => e.type)).toEqual(['info', 'bestmove'])
  })
})

describe('UciEngine: stop, restart and stale results', () => {
  it('stop() sends stop and resolves once the engine answers; the best move so far is kept', async () => {
    const { engine, transport, transports } = setup()
    const search = engine.analyze(position())
    await started(transports)
    const stopped = engine.stop()
    expect(transport().sent.at(-1)).toBe('stop')
    transport().emit(info(9), 'bestmove d2d4')
    await stopped
    await expect(search.done).resolves.toMatchObject({
      reason: 'stopped',
      move: { from: 'd2', to: 'd4' },
    })
    expect(engine.status).toBe('ready')
  })

  it('search.stop() behaves like engine.stop()', async () => {
    const { engine, transport, transports } = setup()
    const search = engine.analyze(position())
    await started(transports)
    search.stop()
    expect(transport().sent.at(-1)).toBe('stop')
    transport().emit('bestmove d2d4')
    expect((await search.done).reason).toBe('stopped')
  })

  it('a new search waits for the old bestmove before go, and the two never mix', async () => {
    const { engine, transport, transports } = setup()
    const a = engine.analyze(position(), { limits: { depth: 30 } })
    await started(transports)

    const b = engine.analyze(position('8/8/8/8/8/8/8/K6k w - - 0 1'), { limits: { depth: 5 } })
    // A is told to stop; B has not been sent yet.
    expect(transport().sent.at(-1)).toBe('stop')
    await flush()
    expect(transport().sentMatching('go')).toHaveLength(1)

    // Late output of A still belongs to A.
    transport().emit(info(11, 50), 'bestmove e2e4')
    await started(transports, 2)
    expect(transport().sent.at(-2)).toBe('position fen 8/8/8/8/8/8/8/K6k w - - 0 1')

    transport().emit(info(1, 0, 'a1a2'), 'bestmove a1a2')
    const [aEvents, bEvents] = await Promise.all([collect(a.events), collect(b.events)])

    expect(aEvents.map((e) => e.type)).toEqual(['info', 'bestmove'])
    expect(aEvents.every((e) => e.searchId === a.id)).toBe(true)
    expect(aEvents.at(-1)).toMatchObject({ reason: 'superseded' })
    expect(bEvents.map((e) => e.type)).toEqual(['info', 'bestmove'])
    expect(bEvents.every((e) => e.searchId === b.id)).toBe(true)
    expect(bEvents[0]).toMatchObject({ info: { depth: 1, score: { cp: 0 } } })
    expect(bEvents.at(-1)).toMatchObject({ reason: 'completed', move: { from: 'a1', to: 'a2' } })
    expect(a.id).not.toBe(b.id)
  })

  it('searches replaced before they start never reach the engine', async () => {
    const { engine, transport, transports } = setup()
    const a = engine.analyze(position('8/8/8/8/8/8/8/K6k w - - 0 1'))
    const b = engine.analyze(position('8/8/8/8/8/8/8/K5k1 w - - 0 1'))
    const c = engine.analyze(position(), { limits: { depth: 3 } })

    expect((await a.done).reason).toBe('superseded')
    expect((await b.done).reason).toBe('superseded')
    await started(transports)
    expect(transport().sentMatching('position')).toEqual([`position fen ${position().fen}`])
    expect(transport().sent).not.toContain('stop')
    transport().emit('bestmove e2e4')
    expect((await c.done).reason).toBe('completed')
  })

  it('stopping a search that has not started never sends a stray stop', async () => {
    const { engine, transport } = setup()
    const search = engine.analyze(position())
    await engine.stop()
    expect((await search.done).reason).toBe('stopped')
    await flush()
    expect(transport().sentMatching('go')).toEqual([])
    expect(transport().sentMatching('stop')).toEqual([])
  })

  it('rapid restarts: only the last search runs and produces results', async () => {
    const { engine, transport, transports } = setup()
    const searches = Array.from({ length: 5 }, () =>
      engine.analyze(position(), { limits: { depth: 8 } }),
    )
    await started(transports)
    transport().emit(info(1))
    transport().emit('bestmove e2e4')
    const ends = await Promise.all(searches.map((s) => s.done))
    expect(ends.map((e) => e.reason)).toEqual([
      'superseded',
      'superseded',
      'superseded',
      'superseded',
      'completed',
    ])
    expect(transport().sentMatching('go')).toHaveLength(1)
  })

  it('stale output after a bestmove is ignored', async () => {
    const { engine, transport, transports } = setup()
    const search = engine.analyze(position(), { limits: { depth: 1 } })
    await started(transports)
    transport().emit(info(1), 'bestmove e2e4')
    const events = await collect(search.events)
    transport().emit(info(2), 'bestmove d2d4')
    expect(events).toHaveLength(2)
    expect(engine.status).toBe('ready')
  })

  it('invalid limits fail that search only, without disturbing the running one', async () => {
    const { engine, transport, transports } = setup()
    const running = engine.analyze(position())
    await started(transports)
    const bad = engine.analyze(position(), { limits: { depth: 0 } })
    const end = await bad.done
    expect(end.reason).toBe('failed')
    expect(end.error).toBeInstanceOf(RangeError)
    expect(transport().sentMatching('stop')).toEqual([])
    expect(engine.status).toBe('searching')
    transport().emit('bestmove e2e4')
    expect((await running.done).reason).toBe('completed')
  })
})

describe('UciEngine: failures and disposal', () => {
  it('a crash mid-search ends the search as failed and the next search restarts the engine', async () => {
    const { engine, transports, events } = setup()
    const search = engine.analyze(position())
    await started(transports)
    transports[0]!.crash('out of memory')

    const end = await search.done
    expect(end).toMatchObject({ reason: 'failed' })
    expect(end.error?.message).toBe('out of memory')
    expect(engine.status).toBe('error')
    expect(transports[0]!.terminated).toBe(true)
    expect(events.filter((e) => e.type === 'error')).toHaveLength(1)

    const retry = engine.analyze(position(), { limits: { depth: 2 } })
    await vi.waitFor(() => expect(transports).toHaveLength(2))
    await started(transports, 1, 1)
    // The fresh process gets its options again.
    expect(transports[1]!.sentMatching('setoption')).toHaveLength(2)
    transports[1]!.emit('bestmove e2e4')
    expect((await retry.done).reason).toBe('completed')
    expect(engine.status).toBe('ready')
  })

  it('a search whose engine cannot start fails without throwing', async () => {
    const { engine } = setup({ connect: () => Promise.reject(new Error('no wasm')) })
    const search = engine.analyze(position())
    const end = await search.done
    expect(end.reason).toBe('failed')
    expect(end.error?.message).toBe('no wasm')
    expect(await collect(search.events)).toHaveLength(1)
  })

  it('dispose ends running and queued searches, terminates the process, and refuses new work', async () => {
    const { engine, transports } = setup()
    const search = engine.analyze(position())
    await started(transports)
    engine.dispose()
    expect((await search.done).reason).toBe('disposed')
    expect(transports[0]!.terminated).toBe(true)
    expect(engine.status).toBe('disposed')

    const late = engine.analyze(position())
    expect((await late.done).reason).toBe('disposed')
    await expect(engine.load()).rejects.toThrow(/disposed/)
    engine.dispose()
  })

  it('dispose while loading aborts the connection and kills a process that arrives late', async () => {
    let signal: AbortSignal | undefined
    let release: (t: FakeTransport) => void = () => {}
    const late = new FakeTransport()
    const { engine } = setup({
      connect: (context) => {
        signal = context.signal
        return new Promise((resolve) => (release = resolve))
      },
    })
    const search = engine.analyze(position())
    await flush()
    engine.dispose()
    expect(signal?.aborted).toBe(true)
    release(late)
    expect((await search.done).reason).toBe('disposed')
    await flush()
    expect(late.terminated).toBe(true)
  })

  it('unsubscribed listeners get nothing', async () => {
    const { engine } = setup()
    const seen: EngineEvent[] = []
    const off = engine.subscribe((e) => seen.push(e))
    off()
    await engine.load()
    expect(seen).toEqual([])
  })
})
