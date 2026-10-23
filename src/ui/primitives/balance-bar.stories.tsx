import type { Meta, StoryObj } from '@storybook/react-vite'
import { BalanceBar } from './balance-bar'

const meta = {
  title: 'ui/BalanceBar',
  component: BalanceBar,
  args: { value: 0.65, label: '65', role: 'img', 'aria-label': 'Light 65%' },
  decorators: [
    (Story) => (
      <div className="flex h-64 w-72 max-w-full flex-col justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BalanceBar>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {}

export const FromTheEnd: Story = { args: { from: 'end' } }

/** The dark part is larger: the label moves to its end and takes the light color. */
export const DarkLarger: Story = { args: { value: 0.2, label: '20', 'aria-label': 'Light 20%' } }

export const Level: Story = { args: { value: 0.5, label: undefined, 'aria-label': 'Level' } }

export const Vertical: Story = {
  args: { axis: 'vertical' },
  decorators: [
    (Story) => (
      <div className="flex h-64">
        <Story />
      </div>
    ),
  ],
}

export const VerticalFromTheTop: Story = { ...Vertical, args: { axis: 'vertical', from: 'end' } }

/** Horizontal when the shell is stacked, vertical side by side: resize the viewport. */
export const Responsive: Story = {
  args: { axis: 'responsive' },
  decorators: [
    (Story) => (
      <div className="flex h-64 w-72 max-w-full flex-col split:flex-row">
        <Story />
      </div>
    ),
  ],
}

export const Dark: Story = { globals: { theme: 'dark' } }
