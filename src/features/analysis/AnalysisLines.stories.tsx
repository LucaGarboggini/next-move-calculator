import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { AnalysisLines } from './AnalysisLines'
import { sampleResult, startingResult } from './testing/samples'

const starting = startingResult()

const meta = {
  title: 'features/analysis/AnalysisLines',
  component: AnalysisLines,
  parameters: { layout: 'centered' },
  args: {
    lines: starting.lines,
    turn: starting.turn,
    fullmoves: starting.fullmoves,
    onPlay: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AnalysisLines>

export default meta
type Story = StoryObj<typeof meta>

export const ThreeLines: Story = {}

/** The line starts with Black's move, so it is numbered "12...". */
export const BlackToMove: Story = {
  args: (() => {
    const result = sampleResult(
      'r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 1 4',
      [{ san: ['Nf6', 'O-O', 'Be7'], score: { kind: 'cp', cp: -15 } }],
    )
    return { lines: result.lines, turn: result.turn, fullmoves: result.fullmoves }
  })(),
}

export const Empty: Story = { args: { lines: [] } }
