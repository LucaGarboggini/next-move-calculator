import type { Meta, StoryObj } from '@storybook/react-vite'
import { BoardFrame } from './BoardFrame'

const meta = {
  title: 'ui/BoardFrame',
  component: BoardFrame,
  args: { className: 'bg-board-dark', role: 'img', 'aria-label': 'Board area' },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BoardFrame>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
