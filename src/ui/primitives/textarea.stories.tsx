import type { Meta, StoryObj } from '@storybook/react-vite'
import { Textarea } from './textarea'

const meta = {
  title: 'ui/Textarea',
  component: Textarea,
  args: { 'aria-label': 'Notes', rows: 3, placeholder: 'Paste a FEN or PGN' },
  decorators: [
    (Story) => (
      <div className="w-72 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Filled: Story = {
  args: { defaultValue: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
}
export const Invalid: Story = { args: { 'aria-invalid': true, defaultValue: 'not a position' } }
export const Disabled: Story = { args: { disabled: true } }
