import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { BoardFrame, BoardStage } from '@/ui'
import { EvalBar } from './EvalBar'

/** A vertical bar takes its length from the board beside it; here, from a flex row. */
const besideABoard: Decorator = (Story) => (
  <div className="flex h-80">
    <Story />
  </div>
)

const aboveABoard: Decorator = (Story) => (
  <div className="w-80 max-w-full">
    <Story />
  </div>
)

const meta = {
  title: 'features/analysis/EvalBar',
  component: EvalBar,
  parameters: { layout: 'centered' },
  args: { axis: 'vertical' },
} satisfies Meta<typeof EvalBar>

export default meta
type Story = StoryObj<typeof meta>

export const NoEvaluation: Story = { decorators: [besideABoard] }

export const Equal: Story = {
  args: { score: { kind: 'cp', cp: 0 } },
  decorators: [besideABoard],
}

/** A small edge moves the bar gently. */
export const WhiteSlightlyBetter: Story = {
  args: { score: { kind: 'cp', cp: 35 } },
  decorators: [besideABoard],
}

export const WhiteBetter: Story = {
  args: { score: { kind: 'cp', cp: 150 } },
  decorators: [besideABoard],
}

export const BlackBetter: Story = {
  args: { score: { kind: 'cp', cp: -420 } },
  decorators: [besideABoard],
}

export const WhiteMates: Story = {
  args: { score: { kind: 'mate', winner: 'white', moves: 3 } },
  decorators: [besideABoard],
}

export const BlackMates: Story = {
  args: { score: { kind: 'mate', winner: 'black', moves: 12 } },
  decorators: [besideABoard],
}

export const Checkmate: Story = {
  args: { score: { kind: 'mate', winner: 'white', moves: 0 } },
  decorators: [besideABoard],
}

/** Black at the bottom of the board: White's part grows from the top. */
export const Flipped: Story = {
  ...WhiteBetter,
  args: { ...WhiteBetter.args, orientation: 'black' },
}

/** Above the board on narrow layouts; White is on the left when White is at the bottom. */
export const Horizontal: Story = {
  args: { ...WhiteBetter.args, axis: 'horizontal' },
  decorators: [aboveABoard],
}

export const HorizontalFlipped: Story = {
  ...Horizontal,
  args: { ...Horizontal.args, orientation: 'black' },
}

export const DarkTheme: Story = { ...BlackBetter, globals: { theme: 'dark' } }

export const DarkThemeHorizontal: Story = { ...Horizontal, globals: { theme: 'dark' } }

/** As in the app: beside the board side by side, above it when stacked. Resize the viewport. */
export const BesideTheBoard: Story = {
  args: { ...WhiteBetter.args, axis: 'responsive' },
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="flex h-dvh items-start justify-center p-4 split:contain-box split:items-center">
        <BoardStage gauge={<Story />}>
          <BoardFrame className="rounded-md bg-board-dark" role="img" aria-label="Board" />
        </BoardStage>
      </div>
    ),
  ],
}
