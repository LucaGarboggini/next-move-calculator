import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setLocale } from '@/i18n'
import { useLocaleStore, useThemeStore } from '@/state'
import { LanguageSelect } from './LanguageSelect'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => useThemeStore.setState({ preference: 'system' }))

  it('starts on system and switches manually', async () => {
    render(<ThemeToggle />)
    expect(screen.getByRole('radio', { name: 'System theme' })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: 'Dark theme' }))
    expect(useThemeStore.getState().preference).toBe('dark')
    await userEvent.click(screen.getByRole('radio', { name: 'Light theme' }))
    expect(useThemeStore.getState().preference).toBe('light')
  })

  it('keeps the choice when the active option is pressed again', async () => {
    useThemeStore.setState({ preference: 'dark' })
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('radio', { name: 'Dark theme' }))
    expect(useThemeStore.getState().preference).toBe('dark')
  })

  it('is operable by keyboard', async () => {
    render(<ThemeToggle />)
    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight}{Enter}')
    expect(useThemeStore.getState().preference).toBe('light')
  })
})

describe('LanguageSelect', () => {
  afterEach(async () => {
    useLocaleStore.setState({ preference: 'system' })
    await setLocale('en')
  })

  it('shows the current preference with a translated, accessible name', () => {
    render(<LanguageSelect />)
    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveTextContent('System language')
  })
})
