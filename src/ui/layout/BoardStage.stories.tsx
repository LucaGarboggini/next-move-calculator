import type { Meta, StoryObj } from '@storybook/react-vite'
import { BalanceBar } from '@/ui/primitives/balance-bar'
import { BoardFrame } from './BoardFrame'
import { BoardStage } from './BoardStage'

const meta = {
  title: 'ui/BoardStage',
  component: BoardStage,
  parameters: { layout: 'fullscreen' },
  args: {
    children: <BoardFrame className="rounded-md bg-board-dark" role="img" aria-label="Board" />,
  },
  decorators: [
    // The board area of the shell: a size container the board fits into.
    (Story) => (
      <div className="flex h-dvh items-start justify-center p-4 split:contain-box split:items-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BoardStage>

export default meta
type Story = StoryObj<typeof meta>

export const BoardOnly: Story = {}

/** Above the board when stacked, beside it side by side: resize the viewport. */
export const WithGauge: Story = {
  args: {
    gauge: <BalanceBar axis="responsive" value={0.6} label="60" role="img" aria-label="60%" />,
  },
}
