import type { Meta, StoryObj } from '@storybook/react-vite'
import { FenPanel, MovesPanel, PositionPanel } from './panels'
import { StoryDocument } from './StoryDocument'

const meta = {
  title: 'features/editor/Panels',
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Position: Story = {
  render: () => (
    <StoryDocument>
      <PositionPanel />
    </StoryDocument>
  ),
}

export const PositionWhilePlaying: Story = {
  render: () => (
    <StoryDocument mode="play">
      <PositionPanel />
    </StoryDocument>
  ),
}

export const Fen: Story = {
  render: () => (
    <StoryDocument>
      <FenPanel />
    </StoryDocument>
  ),
}

export const Moves: Story = {
  render: () => (
    <StoryDocument text="1. d4 d5 2. c4 e6 3. Nc3 Nf6 *">
      <MovesPanel />
    </StoryDocument>
  ),
}
