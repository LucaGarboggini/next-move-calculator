import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Color, Move, WhiteScore } from '@/core'

// --- Settings (persisted) ---------------------------------------------------------------------

export const TIME_RANGE = { min: 1, max: 60 } as const
export const DEPTH_RANGE = { min: 1, max: 99 } as const
export const MULTI_PV_RANGE = { min: 1, max: 5 } as const

export const ANALYSIS_SETTINGS_KEY = 'nmc-analysis'
const VERSION = 1

/** What the user asked of a search. `null` threads/hash mean "the device's recommended value". */
export interface AnalysisSettings {
  /** Seconds per search, ignored when `infinite`. */
  readonly movetimeSec: number
  /** Search until stopped (or until `depth`, when set). */
  readonly infinite: boolean
  /** Optional depth limit; the search ends at whichever limit comes first. */
  readonly depth: number | null
  readonly multiPv: number
  readonly threads: number | null
  readonly hashMb: number | null
}

export const DEFAULT_ANALYSIS_SETTINGS: AnalysisSettings = {
  movetimeSec: 5,
  infinite: false,
  depth: null,
  multiPv: 3,
  threads: null,
  hashMb: null,
}

const clampInt = (value: unknown, min: number, max: number, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : fallback

const optionalInt = (value: unknown, min: number, max: number): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? clampInt(value, min, max, min) : null

/** Forces every field into its valid range; anything unusable falls back to the default. */
export function sanitizeAnalysisSettings(input: Partial<Record<keyof AnalysisSettings, unknown>>) {
  const defaults = DEFAULT_ANALYSIS_SETTINGS
  const settings: AnalysisSettings = {
    movetimeSec: clampInt(input.movetimeSec, TIME_RANGE.min, TIME_RANGE.max, defaults.movetimeSec),
    infinite: typeof input.infinite === 'boolean' ? input.infinite : defaults.infinite,
    depth: optionalInt(input.depth, DEPTH_RANGE.min, DEPTH_RANGE.max),
    multiPv: clampInt(input.multiPv, MULTI_PV_RANGE.min, MULTI_PV_RANGE.max, defaults.multiPv),
    threads: optionalInt(input.threads, 1, Number.MAX_SAFE_INTEGER),
    hashMb: optionalInt(input.hashMb, 1, Number.MAX_SAFE_INTEGER),
  }
  return settings
}

/** Upgrade persisted data from any older shape; unknown or corrupt data resets to defaults. */
export function migrateAnalysisSettings(persisted: unknown): AnalysisSettings {
  const stored = typeof persisted === 'object' && persisted !== null ? persisted : {}
  return sanitizeAnalysisSettings(stored)
}

interface AnalysisSettingsState extends AnalysisSettings {
  update: (patch: Partial<AnalysisSettings>) => void
  reset: () => void
}

const pickSettings = (state: AnalysisSettings): AnalysisSettings => ({
  movetimeSec: state.movetimeSec,
  infinite: state.infinite,
  depth: state.depth,
  multiPv: state.multiPv,
  threads: state.threads,
  hashMb: state.hashMb,
})

export const useAnalysisSettings = create<AnalysisSettingsState>()(
  persist<AnalysisSettingsState, [], [], AnalysisSettings>(
    (set) => ({
      ...DEFAULT_ANALYSIS_SETTINGS,
      update: (patch) =>
        set((state) => sanitizeAnalysisSettings({ ...pickSettings(state), ...patch })),
      reset: () => set(DEFAULT_ANALYSIS_SETTINGS),
    }),
    {
      name: ANALYSIS_SETTINGS_KEY,
      version: VERSION,
      partialize: pickSettings,
      migrate: migrateAnalysisSettings,
    },
  ),
)

// --- Session (not persisted) ------------------------------------------------------------------

/** One principal variation, scored from White's point of view. */
export interface AnalysisLine {
  /** 1 = best line. */
  readonly multiPv: number
  readonly depth: number
  readonly score: WhiteScore
  readonly pv: readonly Move[]
  /** `pv` in SAN, same length (a line stops at the first move that is not legal). */
  readonly san: readonly string[]
}

/** What the engine has found so far for one position. */
export interface AnalysisResult {
  /** Canonical FEN of the analysed position. */
  readonly fen: string
  /** Side to move and move number at the start, to number the lines. */
  readonly turn: Color
  readonly fullmoves: number
  /** Ordered by `multiPv`. */
  readonly lines: readonly AnalysisLine[]
  readonly selDepth?: number
  readonly nodes?: number
  readonly nps?: number
  readonly timeMs?: number
  /** Hash table fill in permille. */
  readonly hashfull?: number
}

/**
 * - `loading`: waiting for the engine to download and start.
 * - `searching`: results are streaming in.
 * - `completed`: the limits were reached. `stopped`: the user stopped it.
 *   `backgrounded`: the tab was hidden, so the search was stopped to save battery.
 * - `error`: the engine failed; `error` has the message.
 */
export type AnalysisStatus =
  'idle' | 'loading' | 'searching' | 'completed' | 'stopped' | 'backgrounded' | 'error'

export const isAnalysisRunning = (status: AnalysisStatus): boolean =>
  status === 'loading' || status === 'searching'

interface AnalysisSessionState {
  status: AnalysisStatus
  /** Result for the position of the latest search; undefined before the first output. */
  result: AnalysisResult | undefined
  error: string | undefined
  set: (patch: Partial<Pick<AnalysisSessionState, 'status' | 'result' | 'error'>>) => void
  /** Back to idle with nothing shown. */
  clear: () => void
}

export const useAnalysisSession = create<AnalysisSessionState>()((set) => ({
  status: 'idle',
  result: undefined,
  error: undefined,
  set: (patch) => set(patch),
  clear: () => set({ status: 'idle', result: undefined, error: undefined }),
}))

/** Test and story helper. */
export const resetAnalysisSession = (
  session: Partial<Pick<AnalysisSessionState, 'status' | 'result' | 'error'>> = {},
): void =>
  useAnalysisSession.setState({ status: 'idle', result: undefined, error: undefined, ...session })
