import { act, render, renderHook, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { i18n, setLocale } from '@/i18n'
import { documentFen, useAnalysisSession, useAnalysisSettings, useEditorStore } from '@/state'
import { AnalysisPanel } from './AnalysisPanel'
import { useAnalysisArrows } from './hooks'
import { en } from './locales/en'
import { ptBR } from './locales/pt-BR'
import { SearchSettingsPanel } from './panels'
import { SearchSettings } from './SearchSettings'
import { StoryAnalysis } from './StoryAnalysis'
import { FakeEngine } from './testing/fake-engine'
import { MATE_FEN, mateResult, startingResult } from './testing/samples'

const session = () => useAnalysisSession.getState()
const fen = () => documentFen(useEditorStore.getState().document)

function leafKeys(node: object, prefix = ''): string[] {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'string' ? [prefix + key] : leafKeys(value as object, `${prefix}${key}.`),
  )
}

describe('analysis translations', () => {
  it('have the same keys in every locale', () => {
    expect(leafKeys(ptBR).sort()).toEqual(leafKeys(en).sort())
  })
})

describe('AnalysisPanel', () => {
  afterEach(async () => {
    await setLocale('en')
  })

  function renderPanel(props: { text?: string } = {}) {
    const engine = new FakeEngine()
    render(
      <StoryAnalysis engine={engine} {...props}>
        <AnalysisPanel />
      </StoryAnalysis>,
    )
    return { engine, user: userEvent.setup() }
  }

  it('calculates: starts a search, streams the result, and ends with Calculate again', async () => {
    const { engine, user } = renderPanel({ text: MATE_FEN })
    expect(screen.getByText('Press Calculate to find the best move.')).toBeInTheDocument()
    expect(screen.queryByTestId('best-move')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    expect(engine.latest.fen).toBe(MATE_FEN)
    expect(engine.latest.options).toEqual({ multiPv: 3, limits: { movetimeMs: 5000 } })
    expect(screen.getByRole('button', { name: 'Stop' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Calculate' })).not.toBeInTheDocument()

    await act(async () => {
      engine.emitStatus('searching')
      engine.latest.report({
        depth: 12,
        score: { kind: 'mate', moves: 1 },
        pv: [{ from: 'a1', to: 'a8' }],
        nps: 800_000,
      })
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(screen.getByText('Calculating…')).toBeInTheDocument()
    expect(screen.getByTestId('best-move')).toHaveTextContent('Ra8#')
    expect(screen.getByTestId('analysis-eval')).toHaveTextContent('#1')
    expect(screen.getByRole('img', { name: 'Evaluation #1' })).toBeInTheDocument()
    expect(screen.getByTestId('analysis-stats')).toHaveTextContent('800k n/s')
    expect(screen.getAllByTestId('analysis-line')).toHaveLength(1)

    await act(async () => {
      engine.latest.end('completed', { from: 'a1', to: 'a8' })
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(screen.getByText('Done.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Calculate' })).toBeEnabled()
    expect(screen.getByTestId('best-move')).toBeInTheDocument()
  })

  it('stops on request and keeps what was found', async () => {
    const { engine, user } = renderPanel()
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    await act(async () => {
      engine.latest.report({ pv: [{ from: 'e2', to: 'e4' }] })
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    await user.click(screen.getByRole('button', { name: 'Stop' }))
    expect(engine.latest.stopRequested).toBe(true)
    expect(screen.getByText('Stopped.')).toBeInTheDocument()
    expect(screen.getByTestId('best-move')).toHaveTextContent('e4')
  })

  it('shows White’s point of view and whose move it is', () => {
    render(
      <StoryAnalysis
        text="4k3/8/8/8/8/8/4P3/4K3 b - - 0 7"
        status="completed"
        result={{
          ...mateResult(),
          fen: '4k3/8/8/8/8/8/4P3/4K3 b - - 0 7',
          turn: 'black',
          fullmoves: 7,
          lines: [
            {
              multiPv: 1,
              depth: 14,
              score: { kind: 'cp', cp: 180 },
              pv: [{ from: 'e8', to: 'e7' }],
              san: ['Ke7'],
            },
          ],
        }}
      >
        <AnalysisPanel />
      </StoryAnalysis>,
    )
    expect(screen.getByTestId('analysis-side-to-move')).toHaveTextContent('Black to move')
    expect(screen.getByTestId('analysis-eval')).toHaveTextContent('+1.80')
    expect(screen.getByText('White is ahead')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play 7... Ke7' })).toBeInTheDocument()
  })

  it('plays the best move on the board', async () => {
    const result = startingResult()
    render(
      <StoryAnalysis status="completed" result={result}>
        <AnalysisPanel />
      </StoryAnalysis>,
    )
    const user = userEvent.setup()
    await user.click(screen.getByTestId('best-move'))
    expect(fen()).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1')
    expect(useEditorStore.getState().mode).toBe('play')
    // The analysis was for the old position: it is gone, and nothing recalculates by itself.
    expect(session()).toMatchObject({ status: 'idle', result: undefined })
    expect(screen.queryByTestId('best-move')).not.toBeInTheDocument()
  })

  it('plays a line up to the move that was picked, as one undo step', async () => {
    render(
      <StoryAnalysis status="completed" result={startingResult()}>
        <AnalysisPanel />
      </StoryAnalysis>,
    )
    const user = userEvent.setup()
    const [first] = screen.getAllByTestId('analysis-line')
    await user.click(
      within(first as HTMLElement).getByRole('button', { name: 'Play 1. e4 e5 2. Nf3' }),
    )
    expect(fen()).toBe('rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2')
    expect(useEditorStore.getState().document.game?.cursor).toBe(3)

    useEditorStore.getState().undo()
    expect(fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  })

  it('drops the result when the position changes, and never shows another position’s result', () => {
    render(
      <StoryAnalysis status="completed" result={startingResult()}>
        <AnalysisPanel />
      </StoryAnalysis>,
    )
    expect(screen.getByTestId('best-move')).toBeInTheDocument()
    act(() => useEditorStore.getState().setTurn('black'))
    expect(screen.queryByTestId('best-move')).not.toBeInTheDocument()
    expect(session()).toMatchObject({ status: 'idle', result: undefined })
  })

  it('stops the search when the position changes', async () => {
    const { engine, user } = renderPanel()
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    act(() => {
      useEditorStore.getState().playMove({ from: 'e2', to: 'e4' })
    })
    expect(engine.latest.stopRequested).toBe(true)
    expect(screen.getByRole('button', { name: 'Calculate' })).toBeInTheDocument()
  })

  it('pauses the search when the tab goes to the background', async () => {
    const { engine, user } = renderPanel()
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    act(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    expect(engine.latest.stopRequested).toBe(true)
    expect(screen.getByText(/Paused because the tab was in the background/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Calculate' })).toBeEnabled()
  })

  it.each([
    ['4k3/8/8/8/8/8/8/8 w - - 0 1', 'Fix the position to calculate a move.'],
    ['R5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 1 1', 'Checkmate: there is no move to calculate.'],
    ['7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', 'Stalemate: there is no move to calculate.'],
  ])('cannot calculate %s', async (text, message) => {
    const { engine, user } = renderPanel({ text })
    expect(screen.getByText(message)).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Calculate' })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(engine.searches).toHaveLength(0)
  })

  it('shows an engine failure as an alert', async () => {
    const { engine, user } = renderPanel()
    await user.click(screen.getByRole('button', { name: 'Calculate' }))
    await act(async () => {
      engine.latest.end('failed', undefined, new Error('Could not download the engine.'))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The engine failed: Could not download the engine.',
    )
    expect(screen.getByRole('button', { name: 'Calculate' })).toBeEnabled()
  })

  it('uses the settings that were chosen', async () => {
    const engine = new FakeEngine()
    render(
      <StoryAnalysis engine={engine}>
        <AnalysisPanel />
      </StoryAnalysis>,
    )
    // StoryAnalysis resets settings to the defaults, so choose them after it rendered.
    act(() => useAnalysisSettings.getState().update({ infinite: true, depth: 18, multiPv: 1 }))
    await userEvent.setup().click(screen.getByRole('button', { name: 'Calculate' }))
    expect(engine.latest.options).toEqual({ multiPv: 1, limits: { depth: 18 } })
  })

  it('speaks Portuguese', async () => {
    await act(async () => {
      await setLocale('pt-BR')
    })
    renderPanel()
    expect(screen.getByRole('button', { name: 'Calcular' })).toBeInTheDocument()
    expect(screen.getByText('Vez das brancas')).toBeInTheDocument()
    expect(i18n.language).toBe('pt-BR')
  })
})

describe('useAnalysisArrows', () => {
  it('draws the best move strongly and the other lines faintly', () => {
    const { result } = renderHook(() => useAnalysisArrows(), {
      wrapper: ({ children }) => (
        <StoryAnalysis status="completed" result={startingResult()}>
          {children}
        </StoryAnalysis>
      ),
    })
    expect(result.current).toEqual([
      { from: 'e2', to: 'e4', tone: 'primary' },
      { from: 'd2', to: 'd4', tone: 'secondary', thin: true },
      { from: 'g1', to: 'f3', tone: 'secondary', thin: true },
    ])
  })

  it('has none without a result for the position on the board', () => {
    const { result } = renderHook(() => useAnalysisArrows(), {
      wrapper: ({ children }) => (
        <StoryAnalysis text={MATE_FEN} status="completed" result={startingResult()}>
          {children}
        </StoryAnalysis>
      ),
    })
    expect(result.current).toEqual([])
  })
})

describe('SearchSettings', () => {
  const desktop = {
    bounds: { maxThreads: 8, maxHashMb: 256 },
    recommended: { threads: 7, hashMb: 64 },
  }

  function renderSettings(limits = desktop) {
    render(
      <StoryAnalysis>
        <SearchSettings limits={limits} />
      </StoryAnalysis>,
    )
    return userEvent.setup()
  }

  it('switches between a time limit and searching until stopped', async () => {
    const user = renderSettings()
    expect(screen.getByRole('slider', { name: 'Time per search' })).not.toHaveAttribute(
      'data-disabled',
    )
    expect(screen.getByText('5 s')).toBeInTheDocument()

    await user.click(screen.getByRole('switch', { name: 'Until stopped' }))
    expect(useAnalysisSettings.getState().infinite).toBe(true)
    expect(screen.getByRole('slider', { name: 'Time per search' })).toHaveAttribute('data-disabled')
  })

  it('sets the time with the keyboard, within 1 to 60 seconds', async () => {
    const user = renderSettings()
    const slider = screen.getByRole('slider', { name: 'Time per search' })
    slider.focus()
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(useAnalysisSettings.getState().movetimeSec).toBe(7)
    await user.keyboard('{Home}')
    expect(useAnalysisSettings.getState().movetimeSec).toBe(1)
    await user.keyboard('{End}')
    expect(useAnalysisSettings.getState().movetimeSec).toBe(60)
  })

  it('takes an optional depth limit', async () => {
    const user = renderSettings()
    const depth = screen.getByRole('spinbutton', { name: 'Depth limit' })
    await user.type(depth, '24')
    expect(useAnalysisSettings.getState().depth).toBe(24)
    await user.clear(depth)
    expect(useAnalysisSettings.getState().depth).toBeNull()
  })

  it('picks 1 to 5 lines and cannot end up with none', async () => {
    const user = renderSettings()
    expect(screen.getByRole('radio', { name: '3 lines' })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: '5 lines' }))
    expect(useAnalysisSettings.getState().multiPv).toBe(5)
    await user.click(screen.getByRole('radio', { name: '5 lines' }))
    expect(useAnalysisSettings.getState().multiPv).toBe(5)
  })

  it('offers threads and hash within what the device allows', () => {
    renderSettings()
    expect(screen.getByRole('slider', { name: 'Threads' })).toHaveAttribute('aria-valuemax', '8')
    expect(screen.getByRole('slider', { name: 'Threads' })).toHaveAttribute('aria-valuenow', '7')
    expect(screen.getByText('Recommended for this device: 7.')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Hash memory' })).toHaveTextContent('64 MB')
  })

  it('has no threads control when the browser runs the engine on one thread', () => {
    renderSettings({
      bounds: { maxThreads: 1, maxHashMb: 256 },
      recommended: { threads: 1, hashMb: 64 },
    })
    expect(screen.queryByRole('slider', { name: 'Threads' })).not.toBeInTheDocument()
    expect(screen.getByText('This browser runs the engine on a single thread.')).toBeInTheDocument()
  })

  it('restores the defaults', async () => {
    const user = renderSettings()
    await user.click(screen.getByRole('radio', { name: '1 lines' }))
    await user.click(screen.getByRole('switch', { name: 'Until stopped' }))
    await user.click(screen.getByRole('button', { name: 'Restore defaults' }))
    expect(useAnalysisSettings.getState()).toMatchObject({ multiPv: 3, infinite: false })
  })
})

describe('SearchSettingsPanel', () => {
  it('renders inside a card with a title', () => {
    render(
      <StoryAnalysis>
        <SearchSettingsPanel />
      </StoryAnalysis>,
    )
    expect(screen.getByText('Search settings')).toBeInTheDocument()
  })
})
