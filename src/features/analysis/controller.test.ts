import { Position } from '@/core'
import { DEFAULT_ANALYSIS_SETTINGS, resetAnalysisSession, useAnalysisSession } from '@/state'
import { AnalysisController } from './controller'
import { FakeEngine } from './testing/fake-engine'

const START = Position.start()
const positionOf = (fen: string): Position => {
  const result = Position.fromFen(fen)
  if (!result.ok) throw new Error(`Bad test position: ${fen}`)
  return result.value
}
const E4 = { from: 'e2', to: 'e4' } as const
const E5 = { from: 'e7', to: 'e5' } as const
const NF3 = { from: 'g1', to: 'f3' } as const
const session = () => useAnalysisSession.getState()

/** Lets the controller's consumer loop process what was pushed into a stream. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

function setup(flushMs = 0) {
  const engine = new FakeEngine()
  const controller = new AnalysisController(() => engine, flushMs)
  return { engine, controller }
}

describe('AnalysisController', () => {
  beforeEach(() => resetAnalysisSession())

  it('passes the settings to the engine, using device defaults where the user chose none', () => {
    const { engine, controller } = setup()
    controller.start(START, {
      ...DEFAULT_ANALYSIS_SETTINGS,
      movetimeSec: 7,
      depth: 18,
      multiPv: 2,
      hashMb: 64,
    })
    expect(engine.latest.options).toEqual({ multiPv: 2, limits: { movetimeMs: 7000, depth: 18 } })
    expect(engine.settings).toEqual({ threads: 2, hashMb: 64 })
    expect(session().status).toBe('loading')

    controller.start(START, { ...DEFAULT_ANALYSIS_SETTINGS, infinite: true, threads: 3 })
    expect(engine.latest.options).toEqual({ multiPv: 3, limits: {} })
    expect(engine.settings).toEqual({ threads: 3, hashMb: 16 })
  })

  it('moves from loading to searching when the engine starts', () => {
    const { engine, controller } = setup()
    controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
    engine.emitStatus('searching')
    expect(session().status).toBe('searching')
  })

  it('publishes lines in SAN, scored from White’s point of view', async () => {
    const { engine, controller } = setup()
    controller.start(positionOf('4k3/8/8/8/8/8/4P3/4K3 b - - 0 7'), {
      ...DEFAULT_ANALYSIS_SETTINGS,
    })
    engine.latest.report({
      depth: 12,
      score: { kind: 'cp', cp: 80 },
      pv: [{ from: 'e8', to: 'e7' }],
      nps: 1_200_000,
      nodes: 5000,
      timeMs: 400,
    })
    await settle()

    expect(session().status).toBe('searching')
    expect(session().result).toMatchObject({
      fen: '4k3/8/8/8/8/8/4P3/4K3 b - - 0 7',
      turn: 'black',
      fullmoves: 7,
      nps: 1_200_000,
      nodes: 5000,
      timeMs: 400,
      lines: [{ multiPv: 1, depth: 12, score: { kind: 'cp', cp: -80 }, san: ['Ke7'] }],
    })
  })

  it('orders variations and keeps unchanged lines as they were', async () => {
    const { engine, controller } = setup()
    controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
    const search = engine.latest
    search.report({ multiPv: 2, pv: [{ from: 'd2', to: 'd4' }] })
    search.report({ multiPv: 1, pv: [E4, E5, NF3] })
    await settle()
    const first = session().result?.lines
    expect(first?.map((line) => line.san)).toEqual([['e4', 'e5', 'Nf3'], ['d4']])

    search.report({ multiPv: 1, depth: 11, pv: [E4, E5] })
    await settle()
    const second = session().result?.lines
    expect(second?.[0]?.depth).toBe(11)
    expect(second?.[1]).toBe(first?.[1])
  })

  it('shows only the newest output per line, at most once per interval', async () => {
    vi.useFakeTimers()
    try {
      const { engine, controller } = setup(100)
      controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
      const search = engine.latest
      const writes: (number | undefined)[] = []
      const stopListening = useAnalysisSession.subscribe((state) =>
        writes.push(state.result?.lines[0]?.depth),
      )

      for (let depth = 1; depth <= 20; depth++) search.report({ depth, pv: [E4] })
      await vi.advanceTimersByTimeAsync(0)
      expect(writes).toEqual([1])

      await vi.advanceTimersByTimeAsync(100)
      expect(writes).toEqual([1, 20])
      stopListening()
    } finally {
      vi.useRealTimers()
    }
  })

  it('ignores half-resolved bounds once a line is known, and empty lines', async () => {
    const { engine, controller } = setup()
    controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
    const search = engine.latest
    search.report({ depth: 9, pv: [E4] })
    await settle()
    search.report({ depth: 10, bound: 'lower', score: { kind: 'cp', cp: 400 }, pv: [E4, E5] })
    search.report({ depth: 11, pv: [] })
    await settle()
    expect(session().result?.lines).toMatchObject([{ depth: 9, san: ['e4'] }])
  })

  it('cuts a line at the first move that is not legal', async () => {
    const { engine, controller } = setup()
    controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
    engine.latest.report({ pv: [E4, { from: 'e4', to: 'e5' }, E5] })
    await settle()
    expect(session().result?.lines[0]).toMatchObject({ san: ['e4'], pv: [E4] })
  })

  it('completes when the engine says so, keeping the result', async () => {
    const { engine, controller } = setup()
    controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
    engine.latest.report({ pv: [E4] })
    engine.latest.end('completed', E4)
    await settle()
    expect(session().status).toBe('completed')
    expect(session().result?.lines).toHaveLength(1)
    expect(controller.running).toBe(false)
  })

  it('flushes what was pending when the search ends', async () => {
    vi.useFakeTimers()
    try {
      const { engine, controller } = setup(1000)
      controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
      const search = engine.latest
      search.report({ depth: 1, pv: [E4] })
      search.report({ depth: 2, pv: [E4] })
      search.end('completed', E4)
      await vi.advanceTimersByTimeAsync(0)
      expect(session().result?.lines[0]?.depth).toBe(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops on request: the result so far stays and later output is dropped', async () => {
    const { engine, controller } = setup()
    controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
    const search = engine.latest
    search.report({ depth: 5, pv: [E4] })
    await settle()

    controller.stop()
    expect(search.stopRequested).toBe(true)
    expect(session().status).toBe('stopped')

    search.report({ depth: 6, pv: [E4, E5] })
    search.end('stopped', E4)
    await settle()
    expect(session().status).toBe('stopped')
    expect(session().result?.lines[0]?.depth).toBe(5)
  })

  it('stops a search that is still waiting for the engine', () => {
    const { engine, controller } = setup()
    controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
    controller.stop()
    expect(engine.latest.stopRequested).toBe(true)
    expect(session()).toMatchObject({ status: 'stopped', result: undefined })
  })

  it('says when the search was stopped because the tab went to the background', async () => {
    const { engine, controller } = setup()
    controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
    engine.latest.report({ pv: [E4] })
    await settle()
    controller.pause()
    expect(session().status).toBe('backgrounded')
    expect(session().result?.lines).toHaveLength(1)
    expect(engine.latest.stopRequested).toBe(true)
  })

  it('does nothing when there is nothing to stop', () => {
    const { controller } = setup()
    controller.stop()
    controller.pause()
    expect(session().status).toBe('idle')
  })

  it('never shows the result of a replaced search', async () => {
    const { engine, controller } = setup()
    controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
    const first = engine.latest
    first.report({ depth: 8, pv: [E4] })
    await settle()

    const other = positionOf('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1')
    controller.start(other, DEFAULT_ANALYSIS_SETTINGS)
    expect(first.finished).toBe(true)
    expect(session()).toMatchObject({ status: 'loading', result: undefined })

    first.report({ depth: 9, pv: [E4] })
    await settle()
    expect(session().result).toBeUndefined()

    engine.latest.report({ pv: [{ from: 'e1', to: 'd2' }] })
    await settle()
    expect(session().result).toMatchObject({
      fen: '4k3/8/8/8/8/8/4P3/4K3 w - - 0 1',
      lines: [{ san: ['Kd2'] }],
    })
  })

  it('reset cancels the search and clears the result', async () => {
    const { engine, controller } = setup()
    controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
    engine.latest.report({ pv: [E4] })
    await settle()

    controller.reset()
    expect(engine.latest.stopRequested).toBe(true)
    expect(session()).toMatchObject({ status: 'idle', result: undefined })

    engine.latest.report({ depth: 30, pv: [E4] })
    await settle()
    expect(session().result).toBeUndefined()
  })

  it('reports an engine failure', async () => {
    const { engine, controller } = setup()
    controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
    engine.latest.end('failed', undefined, new Error('out of memory'))
    await settle()
    expect(session()).toMatchObject({ status: 'error', error: 'out of memory' })
    expect(controller.running).toBe(false)
  })

  it('reports an engine that cannot be created, and can try again', () => {
    let attempts = 0
    const engine = new FakeEngine()
    const controller = new AnalysisController(() => {
      attempts++
      if (attempts === 1) throw new Error('no workers here')
      return engine
    })
    controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
    expect(session()).toMatchObject({ status: 'error', error: 'no workers here' })
    controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
    expect(session().status).toBe('loading')
  })

  it('releases the engine on dispose and creates a new one for the next search', () => {
    const engines: FakeEngine[] = []
    const controller = new AnalysisController(() => {
      const engine = new FakeEngine()
      engines.push(engine)
      return engine
    })
    controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
    controller.dispose()
    expect(engines[0]?.disposed).toBe(true)
    expect(controller.running).toBe(false)

    controller.start(START, DEFAULT_ANALYSIS_SETTINGS)
    expect(engines).toHaveLength(2)
    expect(engines[1]?.searches).toHaveLength(1)
  })
})
