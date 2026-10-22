import type { Position } from '@/core'
import { EventStream } from '../event-stream'
import type {
  AnalyzeOptions,
  BestMoveEvent,
  Engine,
  EngineBounds,
  EngineDescriptor,
  EngineEvent,
  EngineSettings,
  EngineStatus,
  LoadProgress,
  Search,
  SearchEvent,
  SearchEndReason,
  SearchId,
  SearchInfo,
} from '../types'
import { UciClient, type UciTransport } from './client'
import { formatGo } from './commands'
import type { UciInfo } from './messages'

export interface ConnectContext {
  readonly reportProgress: (progress: LoadProgress) => void
  /** Aborted when the engine is disposed while connecting. */
  readonly signal: AbortSignal
}

export interface UciEngineConfig {
  readonly descriptor: EngineDescriptor
  readonly bounds: EngineBounds
  readonly settings: EngineSettings
  /** Obtains a started engine process (downloading it first if needed). Called again after a failure. */
  connect(context: ConnectContext): Promise<UciTransport>
  /** Handshake / readiness timeout in ms. */
  readonly timeoutMs?: number
}

type StopReason = 'stopped' | 'superseded' | 'disposed'

/** One search, from `analyze()` to its `bestmove`. */
class SearchRun implements Search {
  readonly id: SearchId
  readonly fen: string
  readonly multiPv: number
  readonly limits: NonNullable<AnalyzeOptions['limits']>
  readonly events = new EventStream<SearchEvent>()
  readonly done: Promise<BestMoveEvent>
  /** queued: not yet sent to the engine; running: waiting for `bestmove`; finished: `done` settled. */
  state: 'queued' | 'running' | 'finished' = 'queued'
  stopReason: StopReason | undefined

  private resolveDone!: (event: BestMoveEvent) => void
  private readonly requestStop: (run: SearchRun) => void

  constructor(
    id: SearchId,
    fen: string,
    options: AnalyzeOptions,
    requestStop: (run: SearchRun) => void,
  ) {
    this.id = id
    this.fen = fen
    this.multiPv = Math.max(1, Math.floor(options.multiPv ?? 1))
    this.limits = options.limits ?? {}
    this.requestStop = requestStop
    this.done = new Promise((resolve) => {
      this.resolveDone = resolve
    })
  }

  stop(): void {
    this.requestStop(this)
  }

  finish(result: Omit<BestMoveEvent, 'type' | 'searchId'>): void {
    if (this.state === 'finished') return
    this.state = 'finished'
    const event: BestMoveEvent = { type: 'bestmove', searchId: this.id, ...result }
    this.events.push(event)
    this.events.close()
    this.resolveDone(event)
  }
}

/** A complete info line: what the UI can show as an analysis line. */
function toSearchInfo(info: UciInfo): SearchInfo | undefined {
  if (info.depth === undefined || info.score === undefined) return undefined
  return {
    depth: info.depth,
    multiPv: info.multipv ?? 1,
    score: info.score,
    pv: info.pv ?? [],
    ...(info.seldepth !== undefined && { selDepth: info.seldepth }),
    ...(info.bound && { bound: info.bound }),
    ...(info.nodes !== undefined && { nodes: info.nodes }),
    ...(info.nps !== undefined && { nps: info.nps }),
    ...(info.time !== undefined && { timeMs: info.time }),
    ...(info.hashfull !== undefined && { hashfull: info.hashfull }),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

/**
 * `Engine` over any UCI engine. Owns the search lifecycle:
 *
 * - searches are tagged with an id and run one at a time; a new `analyze` stops the running
 *   one and waits for its `bestmove` before sending `go`, so output can never be attributed to
 *   the wrong search;
 * - a search replaced before it started never reaches the engine;
 * - settings are applied (and confirmed with `isready`) right before each `go`.
 */
export class UciEngine implements Engine {
  readonly descriptor: EngineDescriptor
  readonly bounds: EngineBounds

  private readonly config: UciEngineConfig
  private readonly listeners = new Set<(event: EngineEvent) => void>()
  private readonly abort = new AbortController()
  private desired: EngineSettings
  private applied: { settings?: EngineSettings; multiPv: number } = { multiPv: 1 }
  private _status: EngineStatus = 'idle'
  private client: UciClient | undefined
  private loading: Promise<UciClient> | undefined
  private nextId: SearchId = 1
  /** Newest requested search (may be queued, running or finished). */
  private latest: SearchRun | undefined
  /** Search currently sent to the engine, awaiting `bestmove`. */
  private running: SearchRun | undefined
  /** Serialises search starts. */
  private tail: Promise<void> = Promise.resolve()

  constructor(config: UciEngineConfig) {
    this.config = config
    this.descriptor = config.descriptor
    this.bounds = config.bounds
    this.desired = this.clampSettings(config.settings)
  }

  get status(): EngineStatus {
    return this._status
  }

  get settings(): EngineSettings {
    return this.desired
  }

  subscribe(listener: (event: EngineEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  async load(): Promise<void> {
    await this.ensureClient()
  }

  configure(settings: Partial<EngineSettings>): void {
    this.desired = this.clampSettings({ ...this.desired, ...settings })
  }

  analyze(position: Position, options: AnalyzeOptions = {}): Search {
    const run = new SearchRun(this.nextId++, position.fen, options, (r) =>
      this.cancel(r, 'stopped'),
    )
    if (this._status === 'disposed') {
      run.finish({ reason: 'disposed' })
      return run
    }
    try {
      formatGo(run.limits)
    } catch (error) {
      // Bad limits are the caller's mistake: report them without disturbing the engine.
      run.finish({ reason: 'failed', error: asError(error) })
      return run
    }
    if (this.latest) this.cancel(this.latest, 'superseded')
    this.latest = run
    this.tail = this.tail.then(() => this.start(run))
    return run
  }

  async stop(): Promise<void> {
    const run = this.latest
    if (!run) return
    this.cancel(run, 'stopped')
    await run.done
  }

  dispose(): void {
    if (this._status === 'disposed') return
    this.abort.abort()
    this.teardown()
    this.finishAll({ reason: 'disposed' })
    this.setStatus('disposed')
    this.listeners.clear()
  }

  // --- search lifecycle -------------------------------------------------------------------

  /** A queued search is dropped on the spot; a running one is asked to stop and ends on `bestmove`. */
  private cancel(run: SearchRun, reason: StopReason): void {
    if (run.state === 'finished') return
    if (run.state === 'queued') {
      run.finish({ reason })
      return
    }
    run.stopReason ??= reason
    this.client?.send({ type: 'stop' })
  }

  private async start(run: SearchRun): Promise<void> {
    try {
      const client = await this.ensureClient()
      // The previous search must have ended (its `bestmove` consumed) before the next `go`.
      if (this.running) await this.running.done
      if (run.state !== 'queued') return
      await this.applyOptions(client, run.multiPv)
      // No await between this check and `go`: a `stop` can never overtake the search it targets.
      if (run.state !== 'queued' || this.client !== client) return
      // Registered before `go` goes out: a synchronous transport can answer before `send` returns.
      run.state = 'running'
      this.running = run
      this.setStatus('searching')
      client.send({ type: 'position', fen: run.fen })
      client.send({ type: 'go', limits: run.limits })
    } catch (error) {
      const failure = asError(error)
      run.finish({ reason: 'failed', error: failure })
      // Connection failures and transport errors were already reported by `fail`.
      if (this._status !== 'error') this.fail(failure)
    }
  }

  private handleInfo(info: UciInfo): void {
    const run = this.running
    const searchInfo = toSearchInfo(info)
    if (!run || !searchInfo) return
    run.events.push({ type: 'info', searchId: run.id, info: searchInfo })
  }

  private handleBestMove(move: BestMoveEvent['move'], ponder: BestMoveEvent['ponder']): void {
    const run = this.running
    if (!run) return
    this.running = undefined
    const reason: SearchEndReason = run.stopReason ?? 'completed'
    run.finish({ reason, ...(move && { move }), ...(ponder && { ponder }) })
    if (this._status === 'searching') this.setStatus('ready')
  }

  // --- process lifecycle ------------------------------------------------------------------

  private ensureClient(): Promise<UciClient> {
    if (this._status === 'disposed') return Promise.reject(new Error('Engine was disposed'))
    if (this.client) return Promise.resolve(this.client)
    this.loading ??= this.connect().finally(() => {
      this.loading = undefined
    })
    return this.loading
  }

  private async connect(): Promise<UciClient> {
    this.setStatus('loading')
    let transport: UciTransport | undefined
    let client: UciClient | undefined
    try {
      transport = await this.config.connect({
        signal: this.abort.signal,
        reportProgress: (progress) => this.emit({ type: 'progress', progress }),
      })
      if (this.abort.signal.aborted) throw new Error('Engine was disposed')
      this.emit({
        type: 'progress',
        progress: { phase: 'starting', loadedBytes: 0, cached: true },
      })
      client = new UciClient(transport, { timeoutMs: this.config.timeoutMs })
      client.onMessage((message) => {
        if (message.type === 'info') this.handleInfo(message.info)
        else if (message.type === 'bestmove') this.handleBestMove(message.move, message.ponder)
      })
      client.onError((error) => this.fail(error))
      await client.handshake()
      await client.ready()
      this.client = client
      this.applied = { multiPv: 1 }
      this.setStatus('ready')
      return client
    } catch (error) {
      if (client) client.close()
      else transport?.terminate()
      const failure = asError(error)
      if (this._status !== 'disposed') this.fail(failure)
      throw failure
    }
  }

  /** Sends threads / hash / multipv when they differ from what the engine last confirmed. */
  private async applyOptions(client: UciClient, multiPv: number): Promise<void> {
    let changed = false
    const previous = this.applied.settings
    const wanted = this.desired
    if (this.bounds.maxThreads > 1 && previous?.threads !== wanted.threads) {
      client.send({ type: 'setoption', name: 'Threads', value: wanted.threads })
      changed = true
    }
    if (previous?.hashMb !== wanted.hashMb) {
      client.send({ type: 'setoption', name: 'Hash', value: wanted.hashMb })
      changed = true
    }
    if (this.applied.multiPv !== multiPv) {
      client.send({ type: 'setoption', name: 'MultiPV', value: multiPv })
      changed = true
    }
    if (!changed) return
    await client.ready()
    this.applied = { settings: wanted, multiPv }
  }

  /** Drops the process after a crash; the next `analyze`/`load` starts a fresh one. */
  private fail(error: Error): void {
    if (this._status === 'disposed') return
    this.teardown()
    this.finishAll({ reason: 'failed', error })
    this.setStatus('error')
    this.emit({ type: 'error', error })
  }

  private teardown(): void {
    this.client?.close()
    this.client = undefined
    this.running = undefined
  }

  private finishAll(result: Omit<BestMoveEvent, 'type' | 'searchId'>): void {
    const runs = new Set([this.latest, this.running])
    for (const run of runs) run?.finish(result)
  }

  private clampSettings(settings: EngineSettings): EngineSettings {
    return {
      threads: clamp(settings.threads, 1, this.bounds.maxThreads),
      hashMb: clamp(settings.hashMb, 1, this.bounds.maxHashMb),
    }
  }

  private setStatus(status: EngineStatus): void {
    if (this._status === status) return
    this._status = status
    this.emit({ type: 'status', status })
  }

  private emit(event: EngineEvent): void {
    for (const listener of [...this.listeners]) listener(event)
  }
}
