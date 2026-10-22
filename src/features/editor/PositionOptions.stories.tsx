import type { Meta, StoryObj } from '@storybook/react-vite'
import { PositionOptions } from './PositionOptions'
import { StoryDocument } from './StoryDocument'

const meta = {
  title: 'features/editor/PositionOptions',
  component: PositionOptions,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-80 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PositionOptions>

export default meta
type Story = StoryObj<typeof meta>

export const StartingPosition: Story = {
  render: () => (
    <StoryDocument>
      <PositionOptions />
    </StoryDocument>
  ),
}

export const EnPassantAvailable: Story = {
  render: () => (
    <StoryDocument text="4k3/8/8/3pP3/8/8/8/R3K2R w KQ d6 0 2">
      <PositionOptions />
    </StoryDocument>
  ),
}

/** The rights are on although the rook left its corner: shown, and can only be switched off. */
export const ImpossibleCastlingRight: Story = {
  render: () => (
    <StoryDocument text="4k3/8/8/8/8/8/8/4K3 w KQ - 0 1">
      <PositionOptions />
    </StoryDocument>
  ),
}
