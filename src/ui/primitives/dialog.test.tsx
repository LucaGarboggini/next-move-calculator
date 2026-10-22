import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog'

/** Opened from state, like the app's settings: there is no DialogTrigger. */
function Controlled() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogDescription>Description</DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  )
}

describe('Dialog', () => {
  it('gives the focus back to what opened it, without a trigger', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    const opener = screen.getByRole('button', { name: 'Open' })
    await user.click(opener)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })
})
