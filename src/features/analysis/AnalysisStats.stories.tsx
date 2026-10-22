import type { Meta, StoryObj } from '@storybook/react-vite'
import { AnalysisStats } from './AnalysisStats'
import { mateResult, startingResult } from './testing/samples'

const meta = {
  title: 'features/analysis/AnalysisStats',
  component: AnalysisStats,
  parameters: { layout: 'centered' },
  args: { result: startingResult() },
  decorators: [
    (Story) => (
      <div className="w-80 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AnalysisStats>

export default meta
type Story = StoryObj<typeof meta>

/** Mid-search: depth and selective depth, speed, nodes and time. */
export const Searching: Story = {}

/** A quick forced mate, without a selective depth. */
export const ForcedMate: Story = { args: { result: mateResult() } }

/** The first line has arrived but no statistics yet: dashes. */
export const NoStatisticsYet: Story = {
  args: {
    result: {
      ...startingResult(),
      selDepth: undefined,
      nps: undefined,
      nodes: undefined,
      timeMs: undefined,
    },
  },
}
