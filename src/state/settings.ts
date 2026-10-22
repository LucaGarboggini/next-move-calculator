import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  BOARD_THEMES,
  DEFAULT_BOARD_THEME,
  DEFAULT_PIECE_THEME,
  PIECE_THEMES,
  type BoardThemeId,
  type PieceThemeId,
} from '@/board'
import { DEFAULT_NOTATION, isNotation, type Notation } from '@/core'
import type { EngineSize } from '@/engine'
import { createMigrate, type PersistedState } from './migrate'

export const ENGINE_SIZES = ['lite', 'full'] as const satisfies readonly EngineSize[]

export const SETTINGS_KEY = 'nmc-settings'
export const SETTINGS_VERSION = 1

/**
 * What the user chose to change about the app. Theme and language have their own stores because
 * the theme is also read before first paint (see `state/theme.ts`).
 */
export interface Settings {
  readonly notation: Notation
  /** Promote to a queen without asking. */
  readonly autoQueen: boolean
  /** Lite is the default; Full is opt-in (~94 MB). */
  readonly engineSize: EngineSize
  readonly boardTheme: BoardThemeId
  readonly pieceTheme: PieceThemeId
  /** Keyboard shortcuts can be turned off, so single-key shortcuts never get in the way. */
  readonly shortcuts: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  notation: DEFAULT_NOTATION,
  autoQueen: false,
  engineSize: 'lite',
  boardTheme: DEFAULT_BOARD_THEME,
  pieceTheme: DEFAULT_PIECE_THEME,
  shortcuts: true,
}

const oneOf = <T extends string>(options: readonly T[], value: unknown, fallback: T): T =>
  options.includes(value as T) ? (value as T) : fallback

/** Forces every field into its valid values; anything unusable falls back to the default. */
export function sanitizeSettings(input: PersistedState): Settings {
  const defaults = DEFAULT_SETTINGS
  return {
    notation: isNotation(input.notation) ? input.notation : defaults.notation,
    autoQueen: typeof input.autoQueen === 'boolean' ? input.autoQueen : defaults.autoQueen,
    engineSize: oneOf(ENGINE_SIZES, input.engineSize, defaults.engineSize),
    boardTheme: oneOf(BOARD_THEMES, input.boardTheme, defaults.boardTheme),
    pieceTheme: oneOf(PIECE_THEMES, input.pieceTheme, defaults.pieceTheme),
    shortcuts: typeof input.shortcuts === 'boolean' ? input.shortcuts : defaults.shortcuts,
  }
}

/** Upgrade persisted settings from any older shape; corrupt data resets to defaults. */
export const migrateSettings = createMigrate({
  version: SETTINGS_VERSION,
  sanitize: sanitizeSettings,
})

interface SettingsState extends Settings {
  update: (patch: Partial<Settings>) => void
  reset: () => void
}

const pickSettings = (state: Settings): Settings => ({
  notation: state.notation,
  autoQueen: state.autoQueen,
  engineSize: state.engineSize,
  boardTheme: state.boardTheme,
  pieceTheme: state.pieceTheme,
  shortcuts: state.shortcuts,
})

export const useSettings = create<SettingsState>()(
  persist<SettingsState, [], [], Settings>(
    (set) => ({
      ...DEFAULT_SETTINGS,
      update: (patch) => set((state) => sanitizeSettings({ ...pickSettings(state), ...patch })),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: SETTINGS_KEY,
      version: SETTINGS_VERSION,
      partialize: pickSettings,
      migrate: migrateSettings,
    },
  ),
)
