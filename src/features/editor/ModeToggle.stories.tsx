import type { Meta, StoryObj } from '@storybook/react-vite'
import { ModeToggle } from './ModeToggle'
import { StoryDocument } from './StoryDocument'

const meta = {
  title: 'features/editor/ModeToggle',
  component: ModeToggle,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-80 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ModeToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Edit: Story = {
  render: () => (
    <StoryDocument>
      <ModeToggle />
    </StoryDocument>
  ),
}

/** Playing needs a legal position, so the option is disabled while the board is invalid. */
export const PlayDisabled: Story = {
  render: () => (
    <StoryDocument text="8/8/8/8/8/8/8/8 w - - 0 1">
      <ModeToggle />
    </StoryDocument>
  ),
}
