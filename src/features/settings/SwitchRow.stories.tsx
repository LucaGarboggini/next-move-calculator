import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SwitchRow } from './SwitchRow'

const meta = {
  title: 'features/settings/SwitchRow',
  component: SwitchRow,
  args: {
    label: 'Always promote to a queen',
    hint: 'Skips the choice of piece when a pawn reaches the last rank.',
    checked: false,
    onCheckedChange: fn(),
  },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SwitchRow>

export default meta
type Story = StoryObj<typeof meta>

export const Off: Story = {}

export const On: Story = { args: { checked: true } }
