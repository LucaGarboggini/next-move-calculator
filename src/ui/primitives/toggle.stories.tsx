import type { Meta, StoryObj } from '@storybook/react-vite'
import { Bold } from 'lucide-react'
import { Toggle } from './toggle'

const meta = {
  title: 'ui/Toggle',
  component: Toggle,
  args: { 'aria-label': 'Flip board', children: <Bold aria-hidden /> },
  argTypes: { variant: { control: 'select', options: ['default', 'outline'] } },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Outline: Story = { args: { variant: 'outline' } }
export const Pressed: Story = { args: { variant: 'outline', defaultPressed: true } }
export const Disabled: Story = { args: { disabled: true } }
