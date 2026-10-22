import { act, render, screen } from '@testing-library/react'
import { lazy } from 'react'
import { Shell } from './Shell'
import { Providers } from './providers/Providers'
import { clearPanels, registerPanel } from './panels/registry'
import { useThemeStore } from '@/state'

const renderShell = () =>
  render(
    <Providers>
      <Shell />
    </Providers>,
  )

describe('Shell', () => {
  beforeEach(clearPanels)

  it('exposes board and panel areas', () => {
    renderShell()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('complementary')).toBeInTheDocument()
    expect(screen.getByRole('application', { name: 'Chessboard' })).toBeInTheDocument()
  })

  it('has a header with title and global controls plus a skip link', () => {
    renderShell()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Next-Move Calculator')
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View shortcuts' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Skip to board' })).toHaveAttribute(
      'href',
      '#board-area',
    )
  })

  it('shows a placeholder while a lazy panel loads, then the panel', async () => {
    let finish: (module: { default: () => React.JSX.Element }) => void = () => undefined
    const Lazy = lazy(() => new Promise<{ default: () => React.JSX.Element }>((r) => (finish = r)))
    registerPanel({ id: 'lazy', order: 1, component: Lazy })
    renderShell()
    expect(screen.getByRole('complementary').querySelector('[aria-busy="true"]')).not.toBeNull()

    await act(() => Promise.resolve(finish({ default: () => <p>loaded</p> })))

    expect(await screen.findByText('loaded')).toBeInTheDocument()
    expect(screen.getByRole('complementary').querySelector('[aria-busy="true"]')).toBeNull()
  })

  it('renders registered panels in order without editing the shell', () => {
    registerPanel({ id: 'b', order: 2, component: () => <p>second</p> })
    registerPanel({ id: 'a', order: 1, component: () => <p>first</p> })
    renderShell()
    expect(screen.getByRole('complementary').textContent).toBe('firstsecond')
  })

  it('picks up panels registered after the first render', () => {
    renderShell()
    expect(screen.getByRole('complementary')).toBeEmptyDOMElement()
    act(() => registerPanel({ id: 'late', order: 1, component: () => <p>late</p> }))
    expect(screen.getByRole('complementary')).toHaveTextContent('late')
  })

  it('applies the theme preference to <html>', () => {
    renderShell()
    expect(document.documentElement).not.toHaveClass('dark')
    act(() => useThemeStore.getState().setPreference('dark'))
    expect(document.documentElement).toHaveClass('dark')
    act(() => useThemeStore.getState().setPreference('light'))
    expect(document.documentElement).not.toHaveClass('dark')
  })
})
