import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

const meta = { title: 'ui/Tooltip', component: Tooltip } satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover or focus</Button>
      </TooltipTrigger>
      <TooltipContent>Flip the board</TooltipContent>
    </Tooltip>
  ),
}

export const Open: Story = {
  render: () => (
    <Tooltip open>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover or focus</Button>
      </TooltipTrigger>
      <TooltipContent>Flip the board</TooltipContent>
    </Tooltip>
  ),
}
