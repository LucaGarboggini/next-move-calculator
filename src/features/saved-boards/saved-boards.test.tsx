import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setLocale } from '@/i18n'
import { documentFen, useEditorStore, useSavedBoards } from '@/state'
import { en } from './locales/en'
import { ptBR } from './locales/pt-BR'
import { SavedBoardsPanel } from './panels'
import { SAMPLE_BOARDS } from './samples'
import { StorySavedBoards } from './StorySavedBoards'

const STARTING = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const editor = () => useEditorStore.getState()
const boards = () => useSavedBoards.getState().boards

function leafKeys(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'string' ? [prefix + key] : leafKeys(value as object, `${prefix}${key}.`),
  )
}

function renderPanel(initial = SAMPLE_BOARDS) {
  render(
    <StorySavedBoards boards={initial}>
      <SavedBoardsPanel />
    </StorySavedBoards>,
  )
  return userEvent.setup()
}

afterEach(async () => {
  await setLocale('en')
})

describe('saved boards translations', () => {
  it('have the same keys in every locale', () => {
    expect(leafKeys(ptBR).sort()).toEqual(leafKeys(en).sort())
  })
})

describe('SavedBoardsPanel', () => {
  it('lists the saved boards, newest first, with their date', () => {
    renderPanel()
    const items = within(screen.getByRole('list', { name: 'Your saved boards' })).getAllByRole(
      'listitem',
    )
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('After 1.e4')
    expect(items[0]).toHaveTextContent('With moves')
    expect(items[0]).toHaveTextContent(/Saved .*2026/)
    expect(items[1]).toHaveTextContent('Starting position, from Black’s side')
  })

  it('says so when nothing is saved', () => {
    renderPanel([])
    expect(screen.getByText(/Nothing saved yet/)).toBeInTheDocument()
  })

  it('saves the board on screen under a name', async () => {
    const user = renderPanel([])
    const save = screen.getByRole('button', { name: 'Save this board' })
    expect(save).toBeDisabled()

    await user.type(screen.getByLabelText('Name'), '  Rook ending ')
    act(() => void editor().load('8/8/8/4k3/8/4K3/4R3/8 w - - 0 1'))
    await user.click(save)

    expect(boards()).toHaveLength(1)
    expect(boards()[0]).toMatchObject({
      name: 'Rook ending',
      fen: '8/8/8/4k3/8/4K3/4R3/8 w - - 0 1',
      pgn: null,
      orientation: 'white',
    })
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByText('Saved “Rook ending”.')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Your saved boards' })).toHaveTextContent('Rook ending')
  })

  it('saves the moves of a game up to the move shown, and the orientation', async () => {
    const user = renderPanel([])
    act(() => {
      editor().playMoves([
        { from: 'e2', to: 'e4' },
        { from: 'e7', to: 'e5' },
        { from: 'g1', to: 'f3' },
      ])
      editor().goToPly(2)
      editor().flip()
    })
    await user.type(screen.getByLabelText('Name'), 'Open game{Enter}')
    const [saved] = boards()
    expect(saved?.orientation).toBe('black')
    expect(saved?.fen).toBe(documentFen(editor().document))
    expect(saved?.pgn).toMatch(/1\. e4 e5/)
    expect(saved?.pgn).not.toMatch(/Nf3/)
  })

  it('loads a board with its moves and orientation, as one undo step', async () => {
    const user = renderPanel()
    await user.click(screen.getByRole('button', { name: 'Load “After 1.e4”' }))
    expect(documentFen(editor().document)).toBe(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    )
    expect(editor().document.game?.entries).toHaveLength(1)
    expect(screen.getByText('Loaded “After 1.e4”.')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Load “Starting position, from Black’s side”' }),
    )
    expect(editor().orientation).toBe('black')
    expect(documentFen(editor().document)).toBe(STARTING)

    act(() => editor().undo())
    expect(documentFen(editor().document)).toBe(
      'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
    )
  })

  it('renames, and keeps the old name when the rename is cancelled', async () => {
    const user = renderPanel()
    await user.click(screen.getByRole('button', { name: 'Rename “After 1.e4”' }))
    const field = screen.getByLabelText('New name')
    expect(field).toHaveFocus()
    await user.clear(field)
    await user.type(field, 'King pawn{Enter}')
    expect(boards()[0]?.name).toBe('King pawn')

    await user.click(screen.getByRole('button', { name: 'Rename “King pawn”' }))
    await user.type(screen.getByLabelText('New name'), ' changed{Escape}')
    expect(boards()[0]?.name).toBe('King pawn')
    expect(screen.queryByLabelText('New name')).not.toBeInTheDocument()
  })

  it('asks before deleting, and deletes only on confirmation', async () => {
    const user = renderPanel()
    await user.click(screen.getByRole('button', { name: 'Delete “After 1.e4”' }))
    const dialog = screen.getByRole('dialog', { name: 'Delete this board?' })
    expect(dialog).toHaveTextContent('“After 1.e4” will be removed from this browser.')

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(boards()).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Delete “After 1.e4”' }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(boards().map((b) => b.name)).toEqual(['Starting position, from Black’s side'])
  })

  it('speaks Portuguese', async () => {
    await act(() => setLocale('pt-BR'))
    renderPanel()
    expect(screen.getByRole('button', { name: 'Salvar este tabuleiro' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Carregar “After 1.e4”' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Seus tabuleiros salvos' })).toHaveTextContent(
      /Salvo em .*2026/,
    )
  })
})
