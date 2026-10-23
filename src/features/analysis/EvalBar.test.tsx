import { act, render, screen } from '@testing-library/react'
import { setLocale } from '@/i18n'
import { useAnalysisSession, useEditorStore, type AnalysisResult } from '@/state'
import { BoardEvalBar, EvalBar } from './EvalBar'
import { StoryAnalysis } from './StoryAnalysis'
import { MATE_FEN, mateResult, sampleResult, startingResult, START_FEN } from './testing/samples'

const bar = () => screen.getByRole('meter', { name: 'Who’s winning' })
const fill = () => bar().querySelector<HTMLElement>('[data-slot=balance-bar-fill]')!
const label = () => bar().querySelector('[data-slot=balance-bar-label]')
const shift = (axis: 'x' | 'y') => bar().style.getPropertyValue(`--balance-shift-${axis}`)

describe('EvalBar', () => {
  afterEach(async () => {
    await setLocale('en')
  })

  it('is level and says so before there is an evaluation', () => {
    render(<EvalBar />)
    expect(bar()).toHaveAttribute('aria-valuenow', '50')
    expect(bar()).toHaveAttribute('aria-valuetext', 'No evaluation yet')
    expect(label()).toBeNull()
    expect(shift('x')).toBe('-50.00%')
  })

  it('is level for an equal position and shows the eval', () => {
    render(<EvalBar score={{ kind: 'cp', cp: 0 }} />)
    expect(bar()).toHaveAttribute('aria-valuenow', '50')
    expect(bar()).toHaveAttribute('aria-valuetext', 'Evaluation 0.00: Equal')
    expect(label()).toHaveTextContent('0.0')
  })

  it("gives White its winning chance on lichess's curve, so small evals move it gently", () => {
    const { rerender } = render(<EvalBar score={{ kind: 'cp', cp: 35 }} />)
    expect(bar()).toHaveAttribute('aria-valuenow', '53')
    expect(bar()).toHaveAttribute('aria-valuetext', 'Evaluation +0.35: White is ahead')
    expect(label()).toHaveTextContent('+0.4')

    rerender(<EvalBar score={{ kind: 'cp', cp: -300 }} />)
    expect(bar()).toHaveAttribute('aria-valuenow', '25')
    expect(bar()).toHaveAttribute('aria-valuetext', 'Evaluation -3.00: Black is ahead')
    expect(label()).toHaveTextContent('-3.0')
    // White's part is the light one and covers a quarter: it is moved out by the other 75%.
    expect(shift('x')).toBe('-75.11%')
    expect(shift('y')).toBe('75.11%')
  })

  it('is full for the side that mates', () => {
    const { rerender } = render(<EvalBar score={{ kind: 'mate', winner: 'white', moves: 3 }} />)
    expect(bar()).toHaveAttribute('aria-valuenow', '100')
    expect(bar()).toHaveAttribute('aria-valuetext', 'Evaluation #3: White is ahead')
    expect(label()).toHaveTextContent('#3')
    expect(shift('x')).toBe('0.00%')

    rerender(<EvalBar score={{ kind: 'mate', winner: 'black', moves: 2 }} />)
    expect(bar()).toHaveAttribute('aria-valuenow', '0')
    expect(label()).toHaveTextContent('#-2')
    expect(shift('x')).toBe('-100.00%')
  })

  it("puts the number at the end of whoever is ahead, in the other part's color", () => {
    const { rerender } = render(<EvalBar score={{ kind: 'cp', cp: 120 }} />)
    expect(label()).toHaveClass('text-eval-black')
    expect(label()!.parentElement).toHaveClass('justify-start')

    rerender(<EvalBar score={{ kind: 'cp', cp: -120 }} />)
    expect(label()).toHaveClass('text-eval-white')
    expect(label()!.parentElement).toHaveClass('justify-end')
  })

  it("flips with the board: White's part grows from the top, or the right, when Black is at the bottom", () => {
    const score = { kind: 'cp', cp: -300 } as const
    const { rerender } = render(<EvalBar score={score} orientation="white" />)
    const white = { x: shift('x'), y: shift('y') }

    rerender(<EvalBar score={score} orientation="black" />)
    expect(bar()).toHaveAttribute('data-orientation', 'black')
    expect(shift('x')).toBe(white.y)
    expect(shift('y')).toBe(white.x)
    // Black is ahead, and its end is now the bottom (or left): the number moves with it.
    expect(label()!.parentElement).toHaveClass('justify-start')
    // The value read out never depends on the orientation.
    expect(bar()).toHaveAttribute('aria-valuenow', '25')
  })

  it('animates the light part as a transform', () => {
    render(<EvalBar score={{ kind: 'cp', cp: 80 }} />)
    expect(fill()).toHaveClass('transition-transform')
  })

  it('is translated', async () => {
    await setLocale('pt-BR')
    render(<EvalBar score={{ kind: 'cp', cp: 120 }} />)
    expect(screen.getByRole('meter', { name: 'Quem está ganhando' })).toHaveAttribute(
      'aria-valuetext',
      'Avaliação +1.20: As brancas estão melhor',
    )
  })
})

describe('BoardEvalBar', () => {
  function renderBar(props: { text?: string; result?: AnalysisResult } = {}) {
    render(
      <StoryAnalysis status={props.result && 'completed'} {...props}>
        <BoardEvalBar />
      </StoryAnalysis>,
    )
  }

  it('shows the best line for the position on the board', () => {
    renderBar({ text: MATE_FEN, result: mateResult() })
    expect(bar()).toHaveAttribute('aria-valuenow', '100')
    expect(label()).toHaveTextContent('#1')
  })

  it('never shows a result for another position', () => {
    renderBar({ result: startingResult() })
    expect(bar()).toHaveAttribute('aria-valuenow', '53')

    act(() => {
      useEditorStore.getState().load(MATE_FEN)
    })
    // The session still holds the old result until the provider clears it; the bar ignores it.
    expect(bar()).toHaveAttribute('aria-valuetext', 'No evaluation yet')
  })

  it('shows the result of a game that is over on the board', () => {
    renderBar({ text: 'R5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 1 1' })
    expect(bar()).toHaveAttribute('aria-valuenow', '100')
    expect(bar()).toHaveAttribute('aria-valuetext', 'Evaluation 1-0: White has won')
    expect(label()).toHaveTextContent('1-0')

    act(() => {
      useEditorStore.getState().load('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')
    })
    expect(bar()).toHaveAttribute('aria-valuetext', 'Evaluation 0.00: Equal')
  })

  it('follows the board orientation', () => {
    renderBar({ result: sampleResult(START_FEN, [{ san: ['e4'], score: { kind: 'cp', cp: 30 } }]) })
    expect(bar()).toHaveAttribute('data-orientation', 'white')
    act(() => {
      useEditorStore.getState().flip()
    })
    expect(bar()).toHaveAttribute('data-orientation', 'black')
    expect(useAnalysisSession.getState().result).toBeDefined()
  })
})
