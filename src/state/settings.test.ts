import { DEFAULT_SETTINGS, SETTINGS_KEY, migrateSettings, useSettings } from './settings'

const stored = () =>
  JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as {
    state: Record<string, unknown>
    version: number
  }

describe('settings', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettings.getState().reset()
  })

  it('starts with Lite, standard notation, no auto-queen and shortcuts on', () => {
    expect(useSettings.getState()).toMatchObject({
      notation: 'san',
      autoQueen: false,
      engineSize: 'lite',
      boardTheme: 'green',
      pieceTheme: 'classic',
      shortcuts: true,
    })
  })

  it('persists the values, not the actions, with a version', () => {
    useSettings.getState().update({ notation: 'figurine', engineSize: 'full', boardTheme: 'blue' })
    expect(stored()).toEqual({
      version: 1,
      state: { ...DEFAULT_SETTINGS, notation: 'figurine', engineSize: 'full', boardTheme: 'blue' },
    })
  })

  it('refuses values that are not options', () => {
    useSettings.getState().update({ notation: 'long' as never, boardTheme: 'neon' as never })
    expect(useSettings.getState()).toMatchObject({ notation: 'san', boardTheme: 'green' })
  })

  it('restores what was saved', async () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ version: 1, state: { autoQueen: true, pieceTheme: 'glyph' } }),
    )
    await useSettings.persist.rehydrate()
    expect(useSettings.getState()).toMatchObject({
      autoQueen: true,
      pieceTheme: 'glyph',
      notation: 'san',
    })
  })

  it('migrates corrupt data to defaults and keeps the valid fields', () => {
    expect(migrateSettings({ notation: 'uci', engineSize: 'huge', autoQueen: 'yes' }, 1)).toEqual({
      ...DEFAULT_SETTINGS,
      notation: 'uci',
    })
    expect(migrateSettings(null, 1)).toEqual(DEFAULT_SETTINGS)
  })
})
