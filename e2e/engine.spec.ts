import { expect, test, type Page } from '@playwright/test'

// The engine has no UI yet, so these tests import the engine layer straight from the Vite dev
// server and run the real Stockfish in the browser under test.
const DEV_URL = 'http://localhost:5174/'

interface Probe {
  isolated: boolean
  cores: number
  maxThreads: number
  variant: string | undefined
  move: string | undefined
  reason: string
  score: { kind: string; moves?: number; cp?: number } | undefined
  progress: { phase: string; cached: boolean; loadedBytes: number; totalBytes?: number }[]
  status: string
}

interface EngineModule {
  createStockfishEngine: (options?: { size?: 'lite' | 'full' }) => {
    descriptor: { variant?: string }
    bounds: { maxThreads: number }
    status: string
    subscribe(
      listener: (event: { type: string; progress?: Probe['progress'][number] }) => void,
    ): void
    analyze(
      position: unknown,
      options: { limits: { depth: number } },
    ): {
      events: AsyncIterable<{
        type: string
        info?: { score: Probe['score'] }
        move?: { from: string; to: string }
        reason?: string
      }>
    }
    stop(): Promise<void>
    dispose(): void
  }
}
interface CoreModule {
  Position: { fromFen: (fen: string) => { ok: boolean; value: unknown } }
}

async function solve(page: Page, fen: string, depth: number): Promise<Probe> {
  return page.evaluate(
    async ({ fen, depth }) => {
      const load = (path: string) => import(/* @vite-ignore */ path) as Promise<unknown>
      const { createStockfishEngine } = (await load('/src/engine/index.ts')) as EngineModule
      const { Position } = (await load('/src/core/index.ts')) as CoreModule
      const engine = createStockfishEngine()
      const progress: Probe['progress'] = []
      engine.subscribe((event) => {
        if (event.type === 'progress' && event.progress) progress.push(event.progress)
      })
      const search = engine.analyze(Position.fromFen(fen).value, { limits: { depth } })
      let score: Probe['score']
      let move: string | undefined
      let reason = ''
      for await (const event of search.events) {
        if (event.type === 'info') score = event.info?.score
        else {
          reason = event.reason ?? ''
          move = event.move ? `${event.move.from}${event.move.to}` : undefined
        }
      }
      const status = engine.status
      const probe: Probe = {
        isolated: crossOriginIsolated,
        cores: navigator.hardwareConcurrency,
        maxThreads: engine.bounds.maxThreads,
        variant: engine.descriptor.variant,
        move,
        reason,
        score,
        progress,
        status,
      }
      engine.dispose()
      return probe
    },
    { fen, depth },
  )
}

test.describe('Stockfish in the browser', () => {
  test.beforeEach(async ({ page }) => {
    // Load the app first so Vite has pre-bundled its dependencies before the test imports sources.
    await page.goto(DEV_URL)
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('solves a mate in 3 with the Lite engine', async ({ page }) => {
    const result = await solve(page, 'r5rk/5p1p/5R2/4B3/8/8/7P/7K w - - 0 1', 12)
    expect(result.reason).toBe('completed')
    expect(result.move).toBe('f6a6')
    expect(result.score).toEqual({ kind: 'mate', moves: 3 })
    expect(result.variant).toBe('lite')
    expect(result.status).toBe('ready')
    // Multi-threaded when the page is cross-origin isolated, single-threaded otherwise.
    expect(result.maxThreads > 1).toBe(result.isolated && result.cores > 1)
    expect(result.progress[0]?.phase).toBe('download')
    expect(result.progress.at(-1)?.phase).toBe('starting')
  })

  test('caches the engine: the second start does not download again', async ({ page }) => {
    const first = await solve(page, '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', 6)
    expect(first.move).toBe('a1a8')
    const second = await solve(page, '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', 6)
    expect(second.move).toBe('a1a8')
    expect(second.progress[0]).toMatchObject({ phase: 'download', cached: true })
  })

  test('a restart supersedes the running search and ends the old one cleanly', async ({ page }) => {
    const outcome = await page.evaluate(async () => {
      const load = (path: string) => import(/* @vite-ignore */ path) as Promise<unknown>
      const { createStockfishEngine } = (await load('/src/engine/index.ts')) as EngineModule
      const { Position } = (await load('/src/core/index.ts')) as CoreModule
      const engine = createStockfishEngine()
      const start = Position.fromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
      const mate = Position.fromFen('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1')
      const first = engine.analyze(start.value, { limits: { depth: 99 } })
      const second = engine.analyze(mate.value, { limits: { depth: 8 } })
      const ends: string[] = []
      for (const search of [first, second]) {
        for await (const event of search.events)
          if (event.type === 'bestmove') ends.push(event.reason ?? '')
      }
      engine.dispose()
      return ends
    })
    expect(outcome).toEqual(['superseded', 'completed'])
  })
})
