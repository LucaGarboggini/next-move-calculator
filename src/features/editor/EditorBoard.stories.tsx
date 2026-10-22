import type { Meta, StoryObj } from '@storybook/react-vite'
import { EditorBoard } from './EditorBoard'
import { StoryDocument } from './StoryDocument'

const meta = {
  title: 'features/editor/EditorBoard',
  component: EditorBoard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EditorBoard>

export default meta
type Story = StoryObj<typeof meta>

export const Edit: Story = {
  render: () => (
    <StoryDocument>
      <EditorBoard />
    </StoryDocument>
  ),
}

/** Only legal moves can be made; they build the move list. */
export const Play: Story = {
  render: () => (
    <StoryDocument mode="play">
      <EditorBoard />
    </StoryDocument>
  ),
}

/** An invalid position cannot be played from, so the board only displays it. */
export const InvalidPositionIsViewOnly: Story = {
  render: () => (
    <StoryDocument mode="play" text="4k3/8/8/8/8/8/8/8 w - - 0 1">
      <EditorBoard />
    </StoryDocument>
  ),
}
