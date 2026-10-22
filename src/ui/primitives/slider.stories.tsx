import type { Meta, StoryObj } from '@storybook/react-vite'
import { Slider } from './slider'

const meta = {
  title: 'ui/Slider',
  component: Slider,
  args: { defaultValue: [3], min: 1, max: 5, step: 1, 'aria-label': 'Lines' },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true } }
