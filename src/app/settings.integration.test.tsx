import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { documentFen, resetEditorStore, useEditorStore, useSavedBoards, useSettings } from '@/state'
import { App } from './App'
import { registerDefaultPanels } from './panels/defaults'
import { clearPanels } from './panels/registry'

const editor = () => useEditorStore.getState()
const board = () => screen.getByRole('application', { name: 'Chessboard' })

beforeEach(() => {
  clearPanels()
  registerDefaultPanels()
  resetEditorStore()
  useSettings.getState().reset()
  useSavedBoards.getState().clear()
})

describe('settings in the app', () => {
  it('applies the board and piece themes to the board', () => {
    render(<App />)
    expect(board()).toHaveAttribute('data-board-theme', 'green')
    act(() => useSettings.getState().update({ boardTheme: 'brown', pieceTheme: 'glyph' }))
    expect(board()).toHaveAttribute('data-board-theme', 'brown')
    expect(board()).toHaveAttribute('data-piece-theme', 'glyph')
  })

  it('changes a setting from the dialog and the board follows', async () => {
    render(<App />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('combobox', { name: 'Board colors' }))
    await user.click(screen.getByRole('option', { name: 'Blue' }))
    expect(board()).toHaveAttribute('data-board-theme', 'blue')
  })

  it('writes the moves of the move list in the chosen notation', () => {
    render(<App />)
    act(
      () =>
        void editor().playMoves([
          { from: 'g1', to: 'f3' },
          { from: 'e7', to: 'e5' },
        ]),
    )
    const moves = screen.getByRole('list', { name: 'Move list' })
    expect(within(moves).getByText('Nf3')).toBeInTheDocument()
    act(() => useSettings.getState().update({ notation: 'figurine' }))
    expect(within(moves).getByText('♘f3')).toBeInTheDocument()
    act(() => useSettings.getState().update({ notation: 'uci' }))
    expect(within(moves).getByText('g1f3')).toBeInTheDocument()
  })
})

describe('keyboard shortcuts in the app', () => {
  it('flips the board, undoes and redoes', async () => {
    render(<App />)
    const user = userEvent.setup()
    await user.keyboard('f')
    expect(editor().orientation).toBe('black')

    act(() => void editor().playMove({ from: 'e2', to: 'e4' }))
    const played = documentFen(editor().document)
    await user.keyboard('{Control>}z{/Control}')
    expect(documentFen(editor().document)).not.toBe(played)
    await user.keyboard('{Control>}{Shift>}z{/Shift}{/Control}')
    expect(documentFen(editor().document)).toBe(played)
  })

  it('steps through the moves of a game', async () => {
    render(<App />)
    act(() => {
      editor().playMoves([
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
      ])
    })
    const user = userEvent.setup()
    await user.keyboard('{ArrowLeft}')
    expect(editor().document.game?.cursor).toBe(1)
    await user.keyboard('{Shift>}{ArrowLeft}{/Shift}')
    expect(editor().document.game?.cursor).toBe(0)
    await user.keyboard('{Shift>}{ArrowRight}{/Shift}')
    expect(editor().document.game?.cursor).toBe(2)
  })

  it('switches between editing and playing moves', async () => {
    render(<App />)
    const user = userEvent.setup()
    await user.keyboard('m')
    expect(editor().mode).toBe('play')
    await user.keyboard('m')
    expect(editor().mode).toBe('edit')
  })

  it('lists them all in the help dialog, opened with "?"', async () => {
    render(<App />)
    await userEvent.setup().keyboard('?')
    const dialog = screen.getByRole('dialog', { name: 'Keyboard shortcuts' })
    for (const label of [
      'Flip the board',
      'Undo',
      'Redo',
      'Calculate, or stop the calculation',
      'Show the keyboard shortcuts',
    ]) {
      expect(within(dialog).getByText(label)).toBeInTheDocument()
    }
  })

  it('does not steal keys while typing in a field', async () => {
    render(<App />)
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Name'), 'fm')
    expect(editor().orientation).toBe('white')
    expect(editor().mode).toBe('edit')
  })

  it('can be turned off in the settings, and the help button still works', async () => {
    render(<App />)
    const user = userEvent.setup()
    act(() => useSettings.getState().update({ shortcuts: false }))
    await user.keyboard('f')
    expect(editor().orientation).toBe('white')
    await user.click(screen.getByRole('button', { name: 'View shortcuts' }))
    expect(
      screen.getByText('Keyboard shortcuts are turned off in the settings.'),
    ).toBeInTheDocument()
  })
})
