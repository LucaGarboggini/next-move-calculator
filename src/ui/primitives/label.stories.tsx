import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './input'
import { Label } from './label'

const meta = {
  title: 'ui/Label',
  component: Label,
  render: (args) => (
    <div className="grid gap-2">
      <Label htmlFor="name" {...args} />
      <Input id="name" />
    </div>
  ),
  args: { children: 'Board name' },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
