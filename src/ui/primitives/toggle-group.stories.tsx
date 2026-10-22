import type { Meta, StoryObj } from '@storybook/react-vite'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

const meta = {
  title: 'ui/ToggleGroup',
  component: ToggleGroup,
} satisfies Meta<typeof ToggleGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {
  args: { type: 'single', variant: 'outline', defaultValue: 'p', 'aria-label': 'Piece' },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="p">Pawn</ToggleGroupItem>
      <ToggleGroupItem value="n">Knight</ToggleGroupItem>
      <ToggleGroupItem value="b">Bishop</ToggleGroupItem>
    </ToggleGroup>
  ),
}
