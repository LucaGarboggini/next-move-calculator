import type { Meta, StoryObj } from '@storybook/react-vite'
import { PositionStatus } from './PositionStatus'
import { StoryDocument } from './StoryDocument'

const meta = {
  title: 'features/editor/PositionStatus',
  component: PositionStatus,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-80 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PositionStatus>

export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {
  render: () => (
    <StoryDocument>
      <PositionStatus />
    </StoryDocument>
  ),
}

export const Blocked: Story = {
  render: () => (
    <StoryDocument text="8/8/8/8/8/8/8/8 w - - 0 1">
      <PositionStatus />
    </StoryDocument>
  ),
}

export const BlockedSeveralReasons: Story = {
  render: () => (
    <StoryDocument text="4k3/8/8/8/8/8/P7/K3K3 w K - 0 1">
      <PositionStatus />
    </StoryDocument>
  ),
}

export const Warning: Story = {
  render: () => (
    <StoryDocument text="4k3/pppppppp/p7/8/8/8/8/4K3 w - - 0 1">
      <PositionStatus />
    </StoryDocument>
  ),
}

export const Checkmate: Story = {
  render: () => (
    <StoryDocument text="rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3">
      <PositionStatus />
    </StoryDocument>
  ),
}
