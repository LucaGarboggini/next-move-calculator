import { render, screen } from '@testing-library/react'
import { Shell } from './Shell'
import { clearPanels, registerPanel } from './panels/registry'

describe('Shell', () => {
  beforeEach(clearPanels)

  it('exposes board and panel areas', () => {
    render(<Shell />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('complementary')).toBeInTheDocument()
  })

  it('renders registered panels in order without editing the shell', () => {
    registerPanel({ id: 'b', order: 2, component: () => <p>second</p> })
    registerPanel({ id: 'a', order: 1, component: () => <p>first</p> })
    render(<Shell />)
    const text = screen.getByRole('complementary').textContent
    expect(text).toBe('firstsecond')
  })
})
