// Public API of the state layer: Zustand stores (persisted ones are versioned with migrations).
export {
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
  isThemePreference,
  migrateTheme,
  resolveTheme,
  useThemeStore,
  type ResolvedTheme,
  type ThemePreference,
} from './theme'
export {
  LOCALE_STORAGE_KEY,
  isLocalePreference,
  migrateLocale,
  useLocaleStore,
  type LocalePreference,
} from './locale'
export {
  analyzablePosition,
  documentFen,
  documentPgn,
  isSameTool,
  resetEditorStore,
  useEditorSnapshot,
  useEditorStore,
  type EditorDocument,
  type EditorMode,
  type EditorSnapshot,
  type EditorTool,
} from './editor'
export {
  ANALYSIS_SETTINGS_KEY,
  ANALYSIS_SETTINGS_VERSION,
  DEFAULT_ANALYSIS_SETTINGS,
  DEPTH_RANGE,
  MULTI_PV_RANGE,
  TIME_RANGE,
  isAnalysisRunning,
  migrateAnalysisSettings,
  resetAnalysisSession,
  sanitizeAnalysisSettings,
  useAnalysisSession,
  useAnalysisSettings,
  type AnalysisLine,
  type AnalysisResult,
  type AnalysisSettings,
  type AnalysisStatus,
} from './analysis'
export {
  DEFAULT_SETTINGS,
  ENGINE_SIZES,
  SETTINGS_KEY,
  SETTINGS_VERSION,
  migrateSettings,
  sanitizeSettings,
  useSettings,
  type Settings,
} from './settings'
export {
  MAX_NAME_LENGTH,
  MAX_SAVED_BOARDS,
  SAVED_BOARDS_KEY,
  SAVED_BOARDS_MIGRATIONS,
  SAVED_BOARDS_VERSION,
  cleanName,
  migrateSavedBoards,
  sanitizeSavedBoards,
  useSavedBoards,
  type SavedBoard,
  type SavedBoardInput,
} from './savedBoards'
export {
  createMerge,
  createMigrate,
  type MigrateOptions,
  type Migrations,
  type PersistedState,
} from './migrate'
