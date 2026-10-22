import {
  THEME_STORAGE_KEY,
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
})

describe('locale state', () => {
  it('defaults to system and migrates safely', () => {
    expect(useLocaleStore.getState().preference).toBe('system')
    expect(migrateLocale({ preference: 'pt-BR' })).toEqual({ preference: 'pt-BR' })
    expect(migrateLocale({ preference: 'xx' })).toEqual({ preference: 'system' })
  })
})
