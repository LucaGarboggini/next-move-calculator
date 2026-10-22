import type { Move, Position, Score } from '@/core'

/** Identifies one search; every event carries it so consumers can drop stale results. */
export type SearchId = number

/** Stop conditions for a search. With none set the search runs until stopped. */
export interface SearchLimits {
  readonly depth?: number
  readonly movetimeMs?: number
  readonly nodes?: number
  /** Look for a mate in at most this many moves. */
  readonly mate?: number
}

export interface AnalyzeOptions {
  readonly limits?: SearchLimits
  /** Number of principal variations to report (default 1). */
  readonly multiPv?: number
}

/** One principal variation as reported by the engine; scores are from the side to move's view. */
export interface SearchInfo {
  readonly depth: number
  readonly selDepth?: number
  /** 1-based line index (1 = best line). */
  readonly multiPv: number
  readonly score: Score
  /** Set when the score is only a bound (the engine is still resolving the line). */
  readonly bound?: 'lower' | 'upper'
  readonly nodes?: number
  readonly nps?: number
  readonly timeMs?: number
  /** Hash table fill in permille. */
  readonly hashfull?: number
  readonly pv: readonly Move[]
}

export interface InfoEvent {
  readonly type: 'info'
  readonly searchId: SearchId
  readonly info: SearchInfo
}

/**
 * Why a search ended. `completed`: limits reached; `stopped`: the user stopped it;
 * `superseded`: a newer search replaced it (its move must not be shown);
 * `disposed`: the engine was shut down; `failed`: the engine crashed.
 */
export type SearchEndReason = 'completed' | 'stopped' | 'superseded' | 'disposed' | 'failed'

/** Last event of every search. `move` is absent for a search that never ran or has no legal move. */
export interface BestMoveEvent {
  readonly type: 'bestmove'
  readonly searchId: SearchId
  readonly reason: SearchEndReason
  readonly move?: Move
  readonly ponder?: Move
  readonly error?: Error
}

export type SearchEvent = InfoEvent | BestMoveEvent

/** A running (or queued) analysis. */
export interface Search {
  readonly id: SearchId
  /** Position being analysed. */
  readonly fen: string
  /** `info` events followed by exactly one `bestmove`, then the stream ends. Single consumer. */
  readonly events: AsyncIterable<SearchEvent>
  /** Resolves (never rejects) with the final event. */
  readonly done: Promise<BestMoveEvent>
  /** Asks the engine to finish now; `done` still resolves with the best move found so far. */
  stop(): void
}

export interface EngineSettings {
  readonly threads: number
  readonly hashMb: number
}

/** Hard limits of this engine instance (single-threaded builds have `maxThreads` 1). */
export interface EngineBounds {
  readonly maxThreads: number
  readonly maxHashMb: number
}

export interface EngineDescriptor {
  /** Stable machine id, e.g. `stockfish`. */
  readonly id: string
  /** Human name, e.g. `Stockfish 19`. */
  readonly name: string
  /** Build variant, e.g. `lite` / `full`. */
  readonly variant?: string
}

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'searching' | 'error' | 'disposed'

export interface LoadProgress {
  readonly phase: 'download' | 'starting'
  readonly loadedBytes: number
  readonly totalBytes?: number
  /** True when the files came from the local cache instead of the network. */
  readonly cached: boolean
}

export type EngineEvent =
  | { readonly type: 'status'; readonly status: EngineStatus }
  | { readonly type: 'progress'; readonly progress: LoadProgress }
  | { readonly type: 'error'; readonly error: Error }

/**
 * A chess engine that can analyse positions. Everything above `engine/` depends only on this
 * interface; a new engine implements it (or supplies a `UciTransport` to `UciEngine`).
 */
export interface Engine {
  readonly descriptor: EngineDescriptor
  readonly bounds: EngineBounds
  readonly status: EngineStatus
  /** Settings currently requested (applied at the start of the next search). */
  readonly settings: EngineSettings
  subscribe(listener: (event: EngineEvent) => void): () => void
  /** Downloads and starts the engine. Optional: `analyze` loads on demand. */
  load(): Promise<void>
  /** Changes threads/hash; values are clamped to `bounds` and take effect at the next search. */
  configure(settings: Partial<EngineSettings>): void
  /**
   * Starts a search, replacing any search in flight (which ends as `superseded`). Never
   * throws; failures are reported as a `bestmove` event with reason `failed`.
   */
  analyze(position: Position, options?: AnalyzeOptions): Search
  /** Stops the current search and resolves once it has ended. */
  stop(): Promise<void>
  /** Terminates the engine; searches end as `disposed`. */
  dispose(): void
}
