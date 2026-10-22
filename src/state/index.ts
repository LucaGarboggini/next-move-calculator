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
