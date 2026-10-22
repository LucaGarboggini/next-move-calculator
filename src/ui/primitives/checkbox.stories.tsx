import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox } from './checkbox'
import { Label } from './label'

const meta = {
  title: 'ui/Checkbox',
  component: Checkbox,
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox id="castle-k" {...args} />
      <Label htmlFor="castle-k">White can castle kingside</Label>
    </div>
  ),
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Checked: Story = { args: { defaultChecked: true } }
export const Disabled: Story = { args: { disabled: true } }
