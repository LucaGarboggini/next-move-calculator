import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setLocale } from '@/i18n'
import { detectCapabilities } from '@/engine'
import { useLocaleStore, useSettings, useThemeStore } from '@/state'
import { ShortcutsProvider, useShortcuts } from '@/ui'
import { EngineSizeSetting } from './EngineSizeSetting'
import { SettingsControls } from './SettingsControls'
import { SettingsForm } from './SettingsForm'

const DESKTOP = detectCapabilities({
  crossOriginIsolated: true,
  hasSharedArrayBuffer: true,
  hardwareConcurrency: 8,
  deviceMemory: 8,
  userAgent: 'Mozilla/5.0 (Macintosh)',
})
const PHONE = detectCapabilities({
  hardwareConcurrency: 4,
  deviceMemory: 2,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile',
})

beforeEach(() => {
  useSettings.getState().reset()
  useThemeStore.setState({ preference: 'system' })
  useLocaleStore.setState({ preference: 'system' })
})
afterEach(async () => {
  await setLocale('en')
})

describe('SettingsForm', () => {
  it('changes notation, auto-queen and the board and piece themes', async () => {
    render(<SettingsForm capabilities={DESKTOP} />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('radio', { name: 'Figurine (♘f3)' }))
    expect(useSettings.getState().notation).toBe('figurine')

    await user.click(screen.getByRole('switch', { name: 'Always promote to a queen' }))
    expect(useSettings.getState().autoQueen).toBe(true)

    await user.click(screen.getByRole('combobox', { name: 'Board colors' }))
    await user.click(screen.getByRole('option', { name: 'Blue' }))
    expect(useSettings.getState().boardTheme).toBe('blue')

    await user.click(screen.getByRole('combobox', { name: 'Pieces' }))
    await user.click(screen.getByRole('option', { name: 'Text symbols' }))
    expect(useSettings.getState().pieceTheme).toBe('glyph')
  })

  it('keeps the notation when the chosen one is pressed again', async () => {
    render(<SettingsForm capabilities={DESKTOP} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Standard (Nf3)' }))
    expect(useSettings.getState().notation).toBe('san')
  })

  it('turns keyboard shortcuts off and on', async () => {
    render(<SettingsForm capabilities={DESKTOP} />)
    await userEvent.click(screen.getByRole('switch', { name: 'Keyboard shortcuts' }))
    expect(useSettings.getState().shortcuts).toBe(false)
  })

  it('restores every default, including theme and language', async () => {
    useSettings.getState().update({ notation: 'uci', autoQueen: true })
    useThemeStore.setState({ preference: 'dark' })
    useLocaleStore.setState({ preference: 'pt-BR' })
    render(<SettingsForm capabilities={DESKTOP} />)
    await userEvent.click(screen.getByRole('button', { name: 'Restore defaults' }))
    expect(useSettings.getState()).toMatchObject({ notation: 'san', autoQueen: false })
    expect(useThemeStore.getState().preference).toBe('system')
    expect(useLocaleStore.getState().preference).toBe('system')
  })
})

describe('EngineSizeSetting', () => {
  it('uses Lite by default and switches to Lite without asking', async () => {
    useSettings.getState().update({ engineSize: 'full' })
    render(<EngineSizeSetting capabilities={DESKTOP} />)
    expect(screen.getByRole('radio', { name: /Full/ })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: /Lite/ }))
    expect(useSettings.getState().engineSize).toBe('lite')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('asks before the Full engine, and only switches on confirmation', async () => {
    render(<EngineSizeSetting capabilities={DESKTOP} />)
    expect(screen.getByRole('radio', { name: /Lite/ })).toBeChecked()
    const user = userEvent.setup()

    await user.click(screen.getByRole('radio', { name: /Full/ }))
    const dialog = screen.getByRole('dialog', { name: 'Use the Full engine?' })
    expect(dialog).toHaveTextContent('94 MB')
    expect(useSettings.getState().engineSize).toBe('lite')

    await user.click(within(dialog).getByRole('button', { name: 'Keep Lite' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(useSettings.getState().engineSize).toBe('lite')

    await user.click(screen.getByRole('radio', { name: /Full/ }))
    await user.click(screen.getByRole('button', { name: 'Use Full' }))
    expect(useSettings.getState().engineSize).toBe('full')
  })

  it('warns about memory, phones and single-threaded browsers before Full', async () => {
    render(<EngineSizeSetting capabilities={PHONE} />)
    await userEvent.click(screen.getByRole('radio', { name: /Full/ }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent(/phone or tablet/)
    expect(dialog).toHaveTextContent(/little memory/)
    expect(dialog).toHaveTextContent(/several threads/)
  })

  it('has no warning list on a capable desktop', async () => {
    render(<EngineSizeSetting capabilities={DESKTOP} />)
    await userEvent.click(screen.getByRole('radio', { name: /Full/ }))
    expect(within(screen.getByRole('dialog')).queryByRole('list')).not.toBeInTheDocument()
  })
})

function Registers() {
  useShortcuts([{ id: 'x', keys: 'x', label: 'Do x', group: 'Test', run: () => undefined }])
  return null
}

describe('SettingsControls', () => {
  const renderControls = () =>
    render(
      <ShortcutsProvider>
        <Registers />
        <SettingsControls />
      </ShortcutsProvider>,
    )

  it('opens the settings dialog and closes it with Escape', async () => {
    renderControls()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('lists every registered shortcut, including its own, and opens with "?"', async () => {
    renderControls()
    const user = userEvent.setup()
    await user.keyboard('?')
    const dialog = screen.getByRole('dialog', { name: 'Keyboard shortcuts' })
    expect(within(dialog).getByText('Do x')).toBeInTheDocument()
    expect(within(dialog).getByText('Show the keyboard shortcuts')).toBeInTheDocument()
  })

  it('opens the shortcut list from its button too (no keyboard needed)', async () => {
    renderControls()
    await userEvent.click(screen.getByRole('button', { name: 'View shortcuts' }))
    expect(screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeInTheDocument()
  })

  it('is in Portuguese when the language is', async () => {
    await act(() => setLocale('pt-BR'))
    renderControls()
    await userEvent.click(screen.getByRole('button', { name: 'Configurações' }))
    const dialog = screen.getByRole('dialog', { name: 'Configurações' })
    expect(within(dialog).getByRole('button', { name: 'Fechar' })).toBeInTheDocument()
    expect(within(dialog).getByText('Notação dos lances')).toBeInTheDocument()
  })
})
