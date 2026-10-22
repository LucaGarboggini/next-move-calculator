import type { Meta, StoryObj } from '@storybook/react-vite'
import { SavedBoardsPanel } from './panels'
import { StorySavedBoards } from './StorySavedBoards'

const meta = {
  title: 'features/saved-boards/SavedBoardsPanel',
  component: SavedBoardsPanel,
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SavedBoardsPanel>

export default meta
type Story = StoryObj<typeof meta>

export const WithBoards: Story = {
  render: () => (
    <StorySavedBoards>
      <SavedBoardsPanel />
    </StorySavedBoards>
  ),
}

export const Empty: Story = {
  render: () => (
    <StorySavedBoards boards={[]}>
      <SavedBoardsPanel />
    </StorySavedBoards>
  ),
}
