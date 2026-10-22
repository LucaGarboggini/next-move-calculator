import { render, screen } from '@testing-library/react'
import { AppLayout } from './AppLayout'

describe('AppLayout', () => {
  it('renders the board and panel slots', () => {
    render(<AppLayout board={<p>board</p>} panels={<p>panel</p>} />)
    expect(screen.getByRole('main')).toHaveTextContent('board')
    expect(screen.getByRole('complementary')).toHaveTextContent('panel')
  })
})
