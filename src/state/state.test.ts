import {
  ANALYSIS_SETTINGS_KEY,
  ANALYSIS_SETTINGS_VERSION,
  DEFAULT_ANALYSIS_SETTINGS,
  LOCALE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  isAnalysisRunning,
  migrateAnalysisSettings,
  useAnalysisSession,
  useAnalysisSettings,
  migrateLocale,
  migrateTheme,
  resolveTheme,
  useLocaleStore,
  useThemeStore,
} from './index'

describe('theme state', () => {
  beforeEach(() => {
    localStorage.clear()
    useThemeStore.setState({ preference: 'system' })
  })

  it('resolves "system" from the OS and honors manual choices', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('persists the preference with a version', () => {
    useThemeStore.getState().setPreference('dark')
    const stored = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}') as {
      state: unknown
      version: number
    }
    expect(stored).toEqual({ state: { preference: 'dark' }, version: 1 })
  })

  it('migrates unknown or corrupt data to defaults', () => {
    expect(migrateTheme({ preference: 'dark' })).toEqual({ preference: 'dark' })
    expect(migrateTheme({ preference: 'neon' })).toEqual({ preference: 'system' })
    expect(migrateTheme(null)).toEqual({ preference: 'system' })
  })

  it('repairs a corrupt preference saved under the current version', async () => {
    localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({ version: 1, state: { preference: 'neon' } }),
    )
    await useThemeStore.persist.rehydrate()
    expect(useThemeStore.getState().preference).toBe('system')
  })
})

describe('locale state', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to system and migrates safely', () => {
    expect(useLocaleStore.getState().preference).toBe('system')
    expect(migrateLocale({ preference: 'pt-BR' })).toEqual({ preference: 'pt-BR' })
    expect(migrateLocale({ preference: 'xx' })).toEqual({ preference: 'system' })
  })

  it('repairs a corrupt preference saved under the current version', async () => {
    localStorage.setItem(
      LOCALE_STORAGE_KEY,
      JSON.stringify({ version: 1, state: { preference: 'xx' } }),
    )
    await useLocaleStore.persist.rehydrate()
    expect(useLocaleStore.getState().preference).toBe('system')
  })
})

describe('analysis settings', () => {
  beforeEach(() => {
    localStorage.clear()
    useAnalysisSettings.getState().reset()
  })

  it('starts from conservative defaults, leaving threads and hash to the device', () => {
    expect(useAnalysisSettings.getState()).toMatchObject({
      movetimeSec: 5,
      infinite: false,
      depth: null,
      multiPv: 3,
      threads: null,
      hashMb: null,
      autoMove: false,
    })
  })

  it('keeps every value in range', () => {
    const { update } = useAnalysisSettings.getState()
    update({ movetimeSec: 500, multiPv: 9, depth: 0 })
    expect(useAnalysisSettings.getState()).toMatchObject({ movetimeSec: 60, multiPv: 5, depth: 1 })
    update({ movetimeSec: -3, multiPv: 0, depth: 400 })
    expect(useAnalysisSettings.getState()).toMatchObject({ movetimeSec: 1, multiPv: 1, depth: 99 })
    update({ depth: null, movetimeSec: 12.6 })
    expect(useAnalysisSettings.getState()).toMatchObject({ depth: null, movetimeSec: 13 })
  })

  it('persists the settings, not the actions, with a version', () => {
    useAnalysisSettings.getState().update({ multiPv: 2, infinite: true })
    const stored = JSON.parse(localStorage.getItem(ANALYSIS_SETTINGS_KEY) ?? '{}') as {
      state: Record<string, unknown>
      version: number
    }
    expect(stored.version).toBe(ANALYSIS_SETTINGS_VERSION)
    expect(stored.state).toEqual({
      movetimeSec: 5,
      infinite: true,
      depth: null,
      multiPv: 2,
      threads: null,
      hashMb: null,
      autoMove: false,
    })
  })

  it('migrates unknown or corrupt data to valid settings', () => {
    expect(migrateAnalysisSettings({ multiPv: 4, depth: 20, extra: 1 }, 2)).toEqual({
      ...DEFAULT_ANALYSIS_SETTINGS,
      multiPv: 4,
      depth: 20,
    })
    expect(
      migrateAnalysisSettings({ multiPv: 'many', movetimeSec: NaN, infinite: 'yes' }, 2),
    ).toEqual(DEFAULT_ANALYSIS_SETTINGS)
    expect(migrateAnalysisSettings(null, 2)).toEqual(DEFAULT_ANALYSIS_SETTINGS)
  })

  it('upgrades version 1 data: everything kept, auto-move off', async () => {
    expect(
      migrateAnalysisSettings({ movetimeSec: 9, depth: 20, multiPv: 1, autoMove: true }, 1),
    ).toEqual({ ...DEFAULT_ANALYSIS_SETTINGS, movetimeSec: 9, depth: 20, multiPv: 1 })

    localStorage.setItem(
      ANALYSIS_SETTINGS_KEY,
      JSON.stringify({
        version: 1,
        state: { movetimeSec: 9, infinite: true, depth: 20, multiPv: 1, threads: 2, hashMb: 32 },
      }),
    )
    await useAnalysisSettings.persist.rehydrate()
    expect(useAnalysisSettings.getState()).toMatchObject({
      movetimeSec: 9,
      infinite: true,
      depth: 20,
      multiPv: 1,
      threads: 2,
      hashMb: 32,
      autoMove: false,
    })
  })

  it('remembers auto-move', () => {
    useAnalysisSettings.getState().update({ autoMove: true })
    const stored = JSON.parse(localStorage.getItem(ANALYSIS_SETTINGS_KEY) ?? '{}') as {
      state: Record<string, unknown>
    }
    expect(stored.state.autoMove).toBe(true)
  })

  it('repairs corrupt values saved under the current version', async () => {
    localStorage.setItem(
      ANALYSIS_SETTINGS_KEY,
      JSON.stringify({
        version: ANALYSIS_SETTINGS_VERSION,
        state: { multiPv: 'many', depth: 20, movetimeSec: 999 },
      }),
    )
    await useAnalysisSettings.persist.rehydrate()
    expect(useAnalysisSettings.getState()).toMatchObject({
      ...DEFAULT_ANALYSIS_SETTINGS,
      depth: 20,
      movetimeSec: 60,
    })
  })
})

describe('analysis session', () => {
  it('knows which statuses mean a search is in progress', () => {
    expect(['loading', 'searching'].every((s) => isAnalysisRunning(s as never))).toBe(true)
    expect(
      ['idle', 'completed', 'stopped', 'backgrounded', 'error'].some((s) =>
        isAnalysisRunning(s as never),
      ),
    ).toBe(false)
  })

  it('clears back to idle', () => {
    useAnalysisSession.getState().set({ status: 'error', error: 'boom' })
    useAnalysisSession.getState().clear()
    expect(useAnalysisSession.getState()).toMatchObject({
      status: 'idle',
      result: undefined,
      error: undefined,
    })
  })
})
