import type { Meta, StoryObj } from '@storybook/react-vite'
import { MoveList } from './MoveList'
import { StoryDocument } from './StoryDocument'

const meta = {
  title: 'features/editor/MoveList',
  component: MoveList,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-80 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MoveList>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  render: () => (
    <StoryDocument>
      <MoveList />
    </StoryDocument>
  ),
}

export const WithMoves: Story = {
  render: () => (
    <StoryDocument text="1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 *">
      <MoveList />
    </StoryDocument>
  ),
}

/** A game that starts from a position with Black to move shows a gap for White. */
export const StartsWithBlack: Story = {
  render: () => (
    <StoryDocument
      text='[SetUp "1"]
[FEN "4k3/8/8/8/8/8/4P3/4K3 b - - 0 7"]

7... Kd7 8. e4 Kc6 *'
    >
      <MoveList />
    </StoryDocument>
  ),
}
