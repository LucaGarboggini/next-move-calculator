import type { Meta, StoryObj } from '@storybook/react-vite'
import { Actions } from './Actions'
import { StoryDocument } from './StoryDocument'

const meta = {
  title: 'features/editor/Actions',
  component: Actions,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-80 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Actions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <StoryDocument>
      <Actions />
    </StoryDocument>
  ),
}
