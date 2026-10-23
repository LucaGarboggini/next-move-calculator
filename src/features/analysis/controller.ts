import { toWhiteScore, type Move, type Position } from '@/core'
import type { BestMoveEvent, Engine, EngineSettings, Search, SearchInfo } from '@/engine'
import { useAnalysisSession, type AnalysisLine, type AnalysisSettings } from '@/state'
import { searchOptions } from './options'

/** Engine output is shown at most this often, however fast it arrives. */
export const FLUSH_INTERVAL_MS = 100

/** One search from `start` to its end, as far as the UI is concerned. */
interface Run {
  readonly search: Search
  readonly position: Position
  /** Latest exact line per `multiPv`, in display form. Unchanged lines keep their identity. */
  readonly lines: Map<number, AnalysisLine>
  /** Raw engine output not shown yet: only the newest info per line matters. */
  readonly pending: Map<number, SearchInfo>
  stats: Pick<SearchInfo, 'selDepth' | 'nodes' | 'nps' | 'timeMs' | 'hashfull'>
  timer: ReturnType<typeof setTimeout> | undefined
  lastFlush: number
}

const now = (): number => performance.now()

/** A search that reached its time or depth limit, and the move the engine settled on. */
export interface Completion {
  readonly position: Position
  readonly move: Move
}

/**
 * Runs one search at a time on an `Engine` and publishes what it finds to the analysis session
 * store. Knows nothing about React.
 *
 * - Engine output is coalesced: the engine can report hundreds of lines per second, so only the
 *   newest line per variation is kept and the store is updated at most every
 *   `FLUSH_INTERVAL_MS`. SAN is computed at that point, only for lines that changed.
 * - Only the current run can write to the store. A run that was stopped, replaced or reset is
 *   detached on the spot, so a late event can never show a stale result.
 * - The engine is created on the first search and can be released with `dispose()` and recreated.
 * - `onComplete` listeners hear about searches that ended by their limits, never about ones that
 *   were stopped, paused, reset or replaced.
 */
export class AnalysisController {
  private readonly createEngine: () => Engine
  private readonly flushIntervalMs: number
  private engine: Engine | undefined
  /** What the engine would use without the user's overrides (the device's recommendation). */
  private defaults: EngineSettings | undefined
  private unsubscribe: (() => void) | undefined
  private run: Run | undefined
  private readonly completionListeners = new Set<(completion: Completion) => void>()

  constructor(createEngine: () => Engine, flushIntervalMs: number = FLUSH_INTERVAL_MS) {
    this.createEngine = createEngine
    this.flushIntervalMs = flushIntervalMs
  }

  get running(): boolean {
    return this.run !== undefined
  }

  /**
   * Calls `listener` when a search reaches its limits with a best move, after the result is
   * published. Returns the unsubscribe function.
   */
  onComplete(listener: (completion: Completion) => void): () => void {
    this.completionListeners.add(listener)
    return () => this.completionListeners.delete(listener)
  }

  /** Starts a search for `position`, replacing any search in flight. */
  start(position: Position, settings: AnalysisSettings): void {
    this.detach()
    const session = useAnalysisSession.getState()
    try {
      const engine = this.ensureEngine()
      const defaults = this.defaults ?? engine.settings
      engine.configure({
        threads: settings.threads ?? defaults.threads,
        hashMb: settings.hashMb ?? defaults.hashMb,
      })
      const search = engine.analyze(position, searchOptions(settings))
      const run: Run = {
        search,
        position,
        lines: new Map(),
        pending: new Map(),
        stats: {},
        timer: undefined,
        lastFlush: Number.NEGATIVE_INFINITY,
      }
      this.run = run
      session.set({ status: 'loading', result: undefined, error: undefined })
      void this.consume(run)
    } catch (error) {
      session.set({ status: 'error', error: messageOf(error) })
    }
  }

  /** The user stopped the search: the best result so far stays on screen. */
  stop(): void {
    this.end('stopped')
  }

  /** The tab went to the background: same as `stop`, but says why. */
  pause(): void {
    this.end('backgrounded')
  }

  /** Cancels any search and forgets its result (the position changed). */
  reset(): void {
    const run = this.run
    this.detach()
    run?.search.stop()
    useAnalysisSession.getState().clear()
  }

  /** Stops everything and releases the engine and its worker. */
  dispose(): void {
    this.detach()
    this.unsubscribe?.()
    this.unsubscribe = undefined
    this.engine?.dispose()
    this.engine = undefined
    this.defaults = undefined
  }

  // --- internals --------------------------------------------------------------------------

  private ensureEngine(): Engine {
    if (this.engine) return this.engine
    const engine = this.createEngine()
    this.engine = engine
    this.defaults = engine.settings
    this.unsubscribe = engine.subscribe((event) => {
      // The engine starts searching once it has downloaded and started.
      if (event.type !== 'status' || event.status !== 'searching' || !this.run) return
      const session = useAnalysisSession.getState()
      if (session.status === 'loading') session.set({ status: 'searching' })
    })
    return engine
  }

  private end(status: 'stopped' | 'backgrounded'): void {
    const run = this.run
    if (!run) return
    this.flush(run)
    this.detach()
    run.search.stop()
    useAnalysisSession.getState().set({ status })
  }

  /** Makes `run` irrelevant: its remaining events are dropped and nothing is flushed for it. */
  private detach(): void {
    const run = this.run
    if (!run) return
    clearTimeout(run.timer)
    run.timer = undefined
    this.run = undefined
  }

  private async consume(run: Run): Promise<void> {
    try {
      for await (const event of run.search.events) {
        if (this.run !== run) return
        if (event.type === 'info') this.accept(run, event.info)
        else {
          this.flush(run)
          this.finish(run, event)
        }
      }
    } catch (error) {
      if (this.run !== run) return
      this.detach()
      useAnalysisSession.getState().set({ status: 'error', error: messageOf(error) })
    }
  }

  private finish(run: Run, event: BestMoveEvent): void {
    // Superseded and disposed searches are replaced or abandoned by whoever ended them.
    if (event.reason === 'superseded' || event.reason === 'disposed') return
    this.detach()
    const session = useAnalysisSession.getState()
    if (event.reason === 'failed') {
      session.set({ status: 'error', error: event.error?.message ?? 'Engine failed' })
    } else if (event.reason === 'stopped') {
      session.set({ status: 'stopped' })
    } else {
      session.set({ status: 'completed' })
      if (!event.move) return
      const completion: Completion = { position: run.position, move: event.move }
      this.completionListeners.forEach((listener) => listener(completion))
    }
  }

  private accept(run: Run, info: SearchInfo): void {
    // A bound is a half-resolved score; keep the last exact line until the engine settles.
    if (info.bound && run.lines.has(info.multiPv)) return
    if (info.pv.length === 0) return
    run.pending.set(info.multiPv, info)
    run.stats = {
      ...(info.selDepth !== undefined && { selDepth: info.selDepth }),
      ...(info.nodes !== undefined && { nodes: info.nodes }),
      ...(info.nps !== undefined && { nps: info.nps }),
      ...(info.timeMs !== undefined && { timeMs: info.timeMs }),
      ...(info.hashfull !== undefined && { hashfull: info.hashfull }),
    }
    if (run.timer !== undefined) return
    const wait = run.lastFlush + this.flushIntervalMs - now()
    if (wait <= 0) this.flush(run)
    else run.timer = setTimeout(() => this.flush(run), wait)
  }

  /** Publishes what has arrived since the last flush. */
  private flush(run: Run): void {
    clearTimeout(run.timer)
    run.timer = undefined
    if (this.run !== run || run.pending.size === 0) return
    run.lastFlush = now()

    const { position } = run
    for (const [multiPv, info] of run.pending) {
      const san = position.lineToSan(info.pv)
      if (san.length === 0) continue
      run.lines.set(multiPv, {
        multiPv,
        depth: info.depth,
        score: toWhiteScore(info.score, position.turn),
        pv: info.pv.slice(0, san.length),
        san,
      })
    }
    run.pending.clear()

    const session = useAnalysisSession.getState()
    session.set({
      status: session.status === 'loading' ? 'searching' : session.status,
      result: {
        fen: position.fen,
        turn: position.turn,
        fullmoves: position.fullmoves,
        lines: [...run.lines.values()].sort((a, b) => a.multiPv - b.multiPv),
        ...run.stats,
      },
    })
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
