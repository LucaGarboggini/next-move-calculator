import type { Meta, StoryObj } from '@storybook/react-vite'
import { Progress } from './progress'

const meta = {
  title: 'ui/Progress',
  component: Progress,
  args: { value: 60, 'aria-label': 'Engine download' },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Empty: Story = { args: { value: 0 } }
export const Complete: Story = { args: { value: 100 } }
