import type { Meta, StoryObj } from '@storybook/react-vite'
import { SavedBoardsList } from './SavedBoardsList'
import { StorySavedBoards } from './StorySavedBoards'

const meta = {
  title: 'features/saved-boards/SavedBoardsList',
  component: SavedBoardsList,
  decorators: [
    (Story) => (
      <StorySavedBoards>
        <div className="w-96 max-w-full">
          <Story />
        </div>
      </StorySavedBoards>
    ),
  ],
} satisfies Meta<typeof SavedBoardsList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
