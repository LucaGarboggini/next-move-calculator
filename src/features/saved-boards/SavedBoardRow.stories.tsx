import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SavedBoardRow } from './SavedBoardRow'
import { SAMPLE_BOARDS } from './samples'

const [withMoves, positionOnly] = SAMPLE_BOARDS

const meta = {
  title: 'features/saved-boards/SavedBoardRow',
  component: SavedBoardRow,
  args: { board: withMoves!, onLoad: fn(), onRename: fn(), onDelete: fn() },
  decorators: [
    (Story) => (
      <ul className="w-96 max-w-full">
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof SavedBoardRow>

export default meta
type Story = StoryObj<typeof meta>

export const WithMoves: Story = {}

export const PositionOnly: Story = { args: { board: positionOnly! } }
