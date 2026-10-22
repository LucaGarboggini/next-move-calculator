import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './input'

const meta = {
  title: 'ui/Input',
  component: Input,
  args: {
    'aria-label': 'FEN',
    placeholder: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Filled: Story = { args: { defaultValue: '8/8/8/8/8/8/8/K6k w - - 0 1' } }
export const Invalid: Story = { args: { defaultValue: 'not a fen', 'aria-invalid': true } }
export const Disabled: Story = { args: { disabled: true } }
