import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ISSUE_CODES } from '@/core'
import { i18n, setLocale } from '@/i18n'
import { documentFen, useEditorStore } from '@/state'
import { Actions } from './Actions'
import { FenPgnField } from './FenPgnField'
import { MoveList } from './MoveList'
import { Palette } from './Palette'
import { PositionOptions } from './PositionOptions'
import { PositionStatus } from './PositionStatus'
import { StoryDocument } from './StoryDocument'
import { EDITOR_NAMESPACE } from './i18n'
import { en } from './locales/en'
import { ptBR } from './locales/pt-BR'

const fen = () => documentFen(useEditorStore.getState().document)
const STARTING = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

function leafKeys(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'string' ? [prefix + key] : leafKeys(value as object, `${prefix}${key}.`),
  )
}

describe('editor translations', () => {
  it('have the same keys in every locale', () => {
    expect(leafKeys(ptBR).sort()).toEqual(leafKeys(en).sort())
  })

  it('explain every validation issue in every locale', () => {
    expect(ISSUE_CODES.filter((code) => !(code in en.issues))).toEqual([])
    expect(ISSUE_CODES.filter((code) => !(code in ptBR.issues))).toEqual([])
  })
})

describe('Palette', () => {
  it('picks a piece to place, the eraser, and back to moving', async () => {
    const user = userEvent.setup()
    render(
      <StoryDocument>
        <Palette />
      </StoryDocument>,
    )
    const whiteQueen = screen.getByRole('button', { name: 'white queen' })
    expect(whiteQueen).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Move pieces' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(whiteQueen)
    expect(useEditorStore.getState().tool).toEqual({
      kind: 'place',
      piece: { color: 'white', role: 'queen' },
    })
    expect(whiteQueen).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Erase pieces' }))
    expect(useEditorStore.getState().tool).toEqual({ kind: 'erase' })

    await user.click(screen.getByRole('button', { name: 'Move pieces' }))
    expect(useEditorStore.getState().tool).toBeNull()
  })
})

describe('Actions', () => {
  it('clears, restores the start position, and steps through undo and redo', async () => {
    const user = userEvent.setup()
    render(
      <StoryDocument>
        <Actions />
      </StoryDocument>,
    )
    const undo = screen.getByRole('button', { name: 'Undo' })
    const redo = screen.getByRole('button', { name: 'Redo' })
    expect(undo).toBeDisabled()
    expect(redo).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Clear board' }))
    expect(fen()).toBe('8/8/8/8/8/8/8/8 w - - 0 1')
    await user.click(undo)
    expect(fen()).toBe(STARTING)
    expect(redo).toBeEnabled()
    await user.click(redo)
    expect(fen()).toBe('8/8/8/8/8/8/8/8 w - - 0 1')
    await user.click(screen.getByRole('button', { name: 'Start position' }))
    expect(fen()).toBe(STARTING)

    await user.click(screen.getByRole('button', { name: 'Flip board' }))
    expect(useEditorStore.getState().orientation).toBe('black')
  })
})

describe('PositionOptions', () => {
  it('sets the side to move and castling rights', async () => {
    const user = userEvent.setup()
    render(
      <StoryDocument>
        <PositionOptions />
      </StoryDocument>,
    )
    await user.click(screen.getByRole('radio', { name: 'Black to move' }))
    expect(fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1')
    await user.click(screen.getByRole('checkbox', { name: 'White queen-side (O-O-O)' }))
    expect(fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b Kkq - 0 1')
  })

  it('does not offer castling the pieces cannot do, but lets a wrong right be removed', async () => {
    const user = userEvent.setup()
    render(
      <StoryDocument text="4k3/8/8/8/8/8/8/4K3 w K - 0 1">
        <PositionOptions />
      </StoryDocument>,
    )
    expect(screen.getByRole('checkbox', { name: 'White queen-side (O-O-O)' })).toBeDisabled()
    const wrong = screen.getByRole('checkbox', { name: 'White king-side (O-O)' })
    expect(wrong).toBeEnabled()
    await user.click(wrong)
    expect(fen()).toBe('4k3/8/8/8/8/8/8/4K3 w - - 0 1')
  })

  it('offers only possible en passant squares', () => {
    render(
      <StoryDocument text="4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2">
        <PositionOptions />
      </StoryDocument>,
    )
    expect(screen.getByRole('combobox', { name: 'En passant square' })).toHaveTextContent('d6')
  })

  it('disables en passant when no pawn has just advanced', () => {
    render(
      <StoryDocument>
        <PositionOptions />
      </StoryDocument>,
    )
    expect(screen.getByRole('combobox', { name: 'En passant square' })).toBeDisabled()
  })
})

describe('PositionStatus', () => {
  it('says the starting position is ready and whose move it is', () => {
    render(
      <StoryDocument>
        <PositionStatus />
      </StoryDocument>,
    )
    expect(screen.getByTestId('side-to-move')).toHaveTextContent('White to move')
    expect(screen.getByText('Ready for analysis')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('lists every reason an invalid position cannot be analyzed', () => {
    render(
      <StoryDocument text="8/8/8/8/8/8/8/8 b - - 0 1">
        <PositionStatus />
      </StoryDocument>,
    )
    const alert = screen.getByRole('alert')
    expect(within(alert).getByText('This position cannot be analyzed yet')).toBeInTheDocument()
    expect(within(alert).getByText('White needs a king.')).toBeInTheDocument()
    expect(within(alert).getByText('Black needs a king.')).toBeInTheDocument()
    expect(screen.getByTestId('side-to-move')).toHaveTextContent('Black to move')
    expect(screen.queryByText('Ready for analysis')).not.toBeInTheDocument()
  })

  it('warns about unusual material without blocking', () => {
    render(
      <StoryDocument text="4k3/pppppppp/p7/8/8/8/8/4K3 w - - 0 1">
        <PositionStatus />
      </StoryDocument>,
    )
    expect(screen.getByText('Ready for analysis')).toBeInTheDocument()
    expect(screen.getByText('Unusual position')).toBeInTheDocument()
    expect(screen.getByText('Black has more than 8 pawns.')).toBeInTheDocument()
  })

  it('names checkmate', () => {
    render(
      <StoryDocument text="rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3">
        <PositionStatus />
      </StoryDocument>,
    )
    expect(screen.getByTestId('side-to-move')).toHaveTextContent('Checkmate')
  })

  it('is translated', async () => {
    await setLocale('pt-BR')
    try {
      render(
        <StoryDocument text="8/8/8/8/8/8/8/8 w - - 0 1">
          <PositionStatus />
        </StoryDocument>,
      )
      expect(screen.getByText('As brancas precisam de um rei.')).toBeInTheDocument()
      expect(i18n.t('status.ready', { ns: EDITOR_NAMESPACE })).toBe('Pronta para análise')
    } finally {
      await setLocale('en')
    }
  })
})

describe('FenPgnField', () => {
  const field = () => screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'FEN or PGN' })

  it('mirrors the board', async () => {
    render(
      <StoryDocument>
        <FenPgnField />
      </StoryDocument>,
    )
    expect(field()).toHaveValue(STARTING)
    useEditorStore.getState().setTurn('black')
    expect(await screen.findByDisplayValue(/ b KQkq/)).toBeInTheDocument()
  })

  it('loads typed text with the button and is exported back identically', async () => {
    const user = userEvent.setup()
    const text = 'r3k2r/pp3ppp/8/8/8/8/PP3PPP/R3K2R b Kq - 4 17'
    render(
      <StoryDocument>
        <FenPgnField />
      </StoryDocument>,
    )
    const load = screen.getByRole('button', { name: 'Load' })
    expect(load).toBeDisabled()
    await user.clear(field())
    await user.type(field(), text)
    await user.click(load)
    expect(fen()).toBe(text)
    expect(field()).toHaveValue(text)
    expect(load).toBeDisabled()
  })

  it('loads on paste', async () => {
    const user = userEvent.setup()
    render(
      <StoryDocument>
        <FenPgnField />
      </StoryDocument>,
    )
    await user.click(field())
    await user.paste('1. e4 e5 2. Nf3 *')
    expect(useEditorStore.getState().document.game?.entries).toHaveLength(3)
    expect(field()).toHaveValue('rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2')
  })

  it('keeps bad text, explains it, and leaves the board alone', async () => {
    const user = userEvent.setup()
    render(
      <StoryDocument>
        <FenPgnField />
      </StoryDocument>,
    )
    await user.click(field())
    await user.paste('8/8/8/8/8/8/8/8 x - - 0 1')
    expect(screen.getByRole('alert')).toHaveTextContent('The side to move must be “w” or “b”.')
    expect(field()).toHaveValue('8/8/8/8/8/8/8/8 x - - 0 1')
    expect(fen()).toBe(STARTING)

    await user.clear(field())
    await user.type(field(), '1. e4 e5 2. Ke3')
    await user.click(screen.getByRole('button', { name: 'Load' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Move 3 (“Ke3”) is illegal or unreadable.')
  })

  it('copies the FEN and the PGN', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    render(
      <StoryDocument text="1. e4 e5 *">
        <FenPgnField />
      </StoryDocument>,
    )
    await user.click(screen.getByRole('button', { name: 'Copy FEN' }))
    expect(writeText).toHaveBeenLastCalledWith(fen())
    expect(await screen.findByText('Copied to the clipboard')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Copy PGN' }))
    expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining('1. e4 e5'))
  })

  it('cannot copy a PGN of an invalid position', () => {
    render(
      <StoryDocument text="8/8/8/8/8/8/8/8 w - - 0 1">
        <FenPgnField />
      </StoryDocument>,
    )
    expect(screen.getByRole('button', { name: 'Copy PGN' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Copy FEN' })).toBeEnabled()
  })
})

describe('MoveList', () => {
  it('explains how to get moves when there are none', () => {
    render(
      <StoryDocument>
        <MoveList />
      </StoryDocument>,
    )
    expect(screen.getByText(/No moves yet/)).toBeInTheDocument()
  })

  it('shows numbered moves and jumps to a position', async () => {
    const user = userEvent.setup()
    render(
      <StoryDocument text="1. e4 e5 2. Nf3 Nc6 *">
        <MoveList />
      </StoryDocument>,
    )
    const list = screen.getByRole('list', { name: 'Move list' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Nc6' })).toHaveAttribute('aria-current', 'step')

    await user.click(screen.getByRole('button', { name: 'e5' }))
    expect(fen()).toBe('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2')
    expect(screen.getByRole('button', { name: 'e5' })).toHaveAttribute('aria-current', 'step')

    await user.click(screen.getByRole('button', { name: 'Previous move' }))
    expect(screen.getByRole('button', { name: 'e4' })).toHaveAttribute('aria-current', 'step')
    await user.click(screen.getByRole('button', { name: 'First position' }))
    expect(fen()).toBe(STARTING)
    expect(screen.getByRole('button', { name: 'Previous move' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Last move' }))
    expect(screen.getByRole('button', { name: 'Nc6' })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('button', { name: 'Next move' })).toBeDisabled()
  })
})
