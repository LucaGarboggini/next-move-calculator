import type { Meta, StoryObj } from '@storybook/react-vite'
import { Label } from './label'
import { Switch } from './switch'

const meta = {
  title: 'ui/Switch',
  component: Switch,
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch id="threads" {...args} />
      <Label htmlFor="threads">Use all threads</Label>
    </div>
  ),
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const On: Story = { args: { defaultChecked: true } }
export const Disabled: Story = { args: { disabled: true } }
