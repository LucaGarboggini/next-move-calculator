import type { Meta, StoryObj } from '@storybook/react-vite'
import { SaveForm } from './SaveForm'
import { StorySavedBoards } from './StorySavedBoards'

const meta = {
  title: 'features/saved-boards/SaveForm',
  component: SaveForm,
  decorators: [
    (Story) => (
      <StorySavedBoards boards={[]}>
        <div className="w-96 max-w-full">
          <Story />
        </div>
      </StorySavedBoards>
    ),
  ],
} satisfies Meta<typeof SaveForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
