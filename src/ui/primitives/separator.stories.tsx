import type { Meta, StoryObj } from '@storybook/react-vite'
import { Separator } from './separator'

const meta = { title: 'ui/Separator', component: Separator } satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: (args) => (
    <div className="w-64 text-sm">
      Above
      <Separator className="my-3" {...args} />
      Below
    </div>
  ),
}

export const Vertical: Story = {
  render: (args) => (
    <div className="flex h-6 items-center gap-3 text-sm">
      Left
      <Separator orientation="vertical" {...args} />
      Right
    </div>
  ),
}
