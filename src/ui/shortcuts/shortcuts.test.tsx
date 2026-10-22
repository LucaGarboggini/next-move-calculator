import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ShortcutList } from './ShortcutList'
import { ShortcutsProvider } from './ShortcutsProvider'
import { keyCaps, matchesKeys, parseKeys } from './keys'
import { useRegisteredShortcuts, useShortcuts } from './registry'

const press = (key: string, init: Partial<KeyboardEventInit> = {}) => ({
  key,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...init,
})

describe('keys', () => {
  it('parses modifiers and the key', () => {
    expect(parseKeys('mod+shift+z')).toEqual({ key: 'z', mod: true, shift: true, alt: false })
    expect(parseKeys('arrowleft')).toEqual({
      key: 'arrowleft',
      mod: false,
      shift: false,
      alt: false,
    })
    expect(parseKeys('?').key).toBe('?')
  })

  it('matches exactly the modifiers asked for', () => {
    expect(matchesKeys(press('f'), 'f')).toBe(true)
    expect(matchesKeys(press('F', { shiftKey: true }), 'f')).toBe(false) // Shift+F is another one
    expect(matchesKeys(press('F', { shiftKey: true }), 'shift+f')).toBe(true)
    expect(matchesKeys(press('f', { ctrlKey: true }), 'f')).toBe(false) // browser/OS shortcuts
    expect(matchesKeys(press('z', { ctrlKey: true }), 'mod+z')).toBe(true)
    expect(matchesKeys(press('z', { metaKey: true }), 'mod+z')).toBe(true)
    expect(matchesKeys(press('Z', { metaKey: true, shiftKey: true }), 'mod+z')).toBe(false)
    expect(matchesKeys(press('Z', { metaKey: true, shiftKey: true }), 'mod+shift+z')).toBe(true)
  })

  it('does not care about Shift for punctuation such as "?"', () => {
    expect(matchesKeys(press('?', { shiftKey: true }), '?')).toBe(true)
    expect(matchesKeys(press('?'), '?')).toBe(true)
  })

  it('writes keycaps for the platform', () => {
    expect(keyCaps('mod+shift+z', false)).toEqual(['Ctrl', 'Shift', 'Z'])
    expect(keyCaps('mod+shift+z', true)).toEqual(['⌘', '⇧', 'Z'])
    expect(keyCaps('arrowleft', false)).toEqual(['←'])
  })
})

function Demo({ calls }: { calls: string[] }) {
  useShortcuts([
    { id: 'flip', keys: 'f', label: 'Flip', group: 'Board', run: () => calls.push('flip') },
    { id: 'undo', keys: 'mod+z', label: 'Undo', group: 'Board', run: () => calls.push('undo') },
  ])
  return <input aria-label="Name" />
}

function Registered() {
  return <ShortcutList shortcuts={useRegisteredShortcuts()} />
}

describe('ShortcutsProvider', () => {
  it('runs the shortcut that matches the key', async () => {
    const calls: string[] = []
    render(
      <ShortcutsProvider>
        <Demo calls={calls} />
      </ShortcutsProvider>,
    )
    const user = userEvent.setup()
    await user.keyboard('f')
    await user.keyboard('{Control>}z{/Control}')
    await user.keyboard('g')
    expect(calls).toEqual(['flip', 'undo'])
  })

  it('stays out of the way while typing in a field', async () => {
    const calls: string[] = []
    render(
      <ShortcutsProvider>
        <Demo calls={calls} />
      </ShortcutsProvider>,
    )
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Name'), 'f')
    await user.keyboard('{Control>}z{/Control}')
    expect(calls).toEqual([])
  })

  it('does nothing when disabled, and again when enabled', async () => {
    const calls: string[] = []
    const Toggle = () => {
      const [enabled, setEnabled] = useState(false)
      return (
        <ShortcutsProvider enabled={enabled}>
          <Demo calls={calls} />
          <button onClick={() => setEnabled(true)}>enable</button>
        </ShortcutsProvider>
      )
    }
    render(<Toggle />)
    const user = userEvent.setup()
    await user.keyboard('f')
    expect(calls).toEqual([])
    await user.click(screen.getByText('enable'))
    await user.keyboard('f')
    expect(calls).toEqual(['flip'])
  })

  it('does not run a shortcut for a key press something else already handled', async () => {
    const calls: string[] = []
    render(
      <ShortcutsProvider>
        <Demo calls={calls} />
        <div tabIndex={0} onKeyDown={(event) => event.preventDefault()} data-testid="own" />
      </ShortcutsProvider>,
    )
    const user = userEvent.setup()
    screen.getByTestId('own').focus()
    await user.keyboard('f')
    expect(calls).toEqual([])
  })

  it('lists registered shortcuts and forgets them when their owner unmounts', () => {
    const calls: string[] = []
    const { rerender } = render(
      <ShortcutsProvider>
        <Demo calls={calls} />
        <Registered />
      </ShortcutsProvider>,
    )
    expect(screen.getByText('Flip')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Board' })).toBeInTheDocument()
    rerender(
      <ShortcutsProvider>
        <Registered />
      </ShortcutsProvider>,
    )
    expect(screen.queryByText('Flip')).not.toBeInTheDocument()
  })

  it('always runs the latest closure', async () => {
    const seen: number[] = []
    const Counter = () => {
      const [count, setCount] = useState(0)
      useShortcuts([
        {
          id: 'count',
          keys: 'c',
          label: 'Count',
          group: 'General',
          run: () => {
            seen.push(count)
            setCount(count + 1)
          },
        },
      ])
      return null
    }
    render(
      <ShortcutsProvider>
        <Counter />
      </ShortcutsProvider>,
    )
    const user = userEvent.setup()
    await user.keyboard('ccc')
    expect(seen).toEqual([0, 1, 2])
  })
})
