import type { Move, Position } from '@/core'
import { EventStream } from '@/engine'
import type {
  AnalyzeOptions,
  BestMoveEvent,
  Engine,
  EngineBounds,
  EngineDescriptor,
  EngineEvent,
  EngineSettings,
  EngineStatus,
  Search,
  SearchEndReason,
  SearchEvent,
  SearchInfo,
} from '@/engine'

/** A search the test drives by hand: `report` plays the engine's output, `end` its `bestmove`. */
export class FakeSearch implements Search {
  readonly events = new EventStream<SearchEvent>()
  readonly done: Promise<BestMoveEvent>
  readonly id: number
  readonly fen: string
  readonly options: AnalyzeOptions
  finished = false
  stopRequested = false
  private resolveDone!: (event: BestMoveEvent) => void

  constructor(id: number, fen: string, options: AnalyzeOptions) {
    this.id = id
    this.fen = fen
    this.options = options
    this.done = new Promise((resolve) => {
      this.resolveDone = resolve
    })
  }

  /** One `info` line; unspecified fields get plausible values. */
  report(info: Partial<SearchInfo> & Pick<SearchInfo, 'pv'>): void {
    if (this.finished) return
    this.events.push({
      type: 'info',
      searchId: this.id,
      info: { depth: 10, multiPv: 1, score: { kind: 'cp', cp: 25 }, ...info },
    })
  }

  end(reason: SearchEndReason, move?: Move, error?: Error): void {
    if (this.finished) return
    this.finished = true
    const event: BestMoveEvent = {
      type: 'bestmove',
      searchId: this.id,
      reason,
      ...(move && { move }),
      ...(error && { error }),
    }
    this.events.push(event)
    this.events.close()
    this.resolveDone(event)
  }

  stop(): void {
    this.stopRequested = true
  }
}

/** An `Engine` that never computes: tests and stories script what it reports. */
export class FakeEngine implements Engine {
  readonly descriptor: EngineDescriptor = { id: 'fake', name: 'Fake engine' }
  readonly bounds: EngineBounds
  status: EngineStatus = 'ready'
  settings: EngineSettings
  readonly searches: FakeSearch[] = []
  disposed = false
  private readonly listeners = new Set<(event: EngineEvent) => void>()
  private nextId = 1

  constructor(
    bounds: EngineBounds = { maxThreads: 4, maxHashMb: 256 },
    settings: EngineSettings = { threads: 2, hashMb: 16 },
  ) {
    this.bounds = bounds
    this.settings = settings
  }

  get latest(): FakeSearch {
    const search = this.searches.at(-1)
    if (!search) throw new Error('No search was started')
    return search
  }

  subscribe(listener: (event: EngineEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Reports a status change, e.g. `searching` once the engine has started. */
  emitStatus(status: EngineStatus): void {
    this.status = status
    this.listeners.forEach((listener) => listener({ type: 'status', status }))
  }

  load(): Promise<void> {
    return Promise.resolve()
  }

  configure(settings: Partial<EngineSettings>): void {
    this.settings = { ...this.settings, ...settings }
  }

  analyze(position: Position, options: AnalyzeOptions = {}): Search {
    const previous = this.searches.at(-1)
    previous?.end('superseded')
    const search = new FakeSearch(this.nextId++, position.fen, options)
    this.searches.push(search)
    return search
  }

  async stop(): Promise<void> {
    const search = this.searches.at(-1)
    search?.stop()
    search?.end('stopped')
    await search?.done
  }

  dispose(): void {
    this.disposed = true
    this.searches.at(-1)?.end('disposed')
    this.listeners.clear()
  }
}
