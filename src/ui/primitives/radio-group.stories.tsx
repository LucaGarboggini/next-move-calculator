import type { Meta, StoryObj } from '@storybook/react-vite'
import { Label } from './label'
import { RadioGroup, RadioGroupItem } from './radio-group'

const meta = {
  title: 'ui/RadioGroup',
  component: RadioGroup,
  args: { defaultValue: 'w', 'aria-label': 'Side to move' },
  render: (args) => (
    <RadioGroup {...args}>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="w" id="side-w" />
        <Label htmlFor="side-w">White to move</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="b" id="side-b" />
        <Label htmlFor="side-b">Black to move</Label>
      </div>
    </RadioGroup>
  ),
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true } }
